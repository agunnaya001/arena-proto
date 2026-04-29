require("dotenv").config();
const express = require("express");
const { createServer } = require("http");
const { WebSocketServer } = require("ws");
const { Pool } = require("pg");
const indexer = require("./indexer");

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS players (
      address TEXT PRIMARY KEY,
      total_wins INTEGER DEFAULT 0,
      total_battles INTEGER DEFAULT 0,
      total_rewards TEXT DEFAULT '0',
      fighters INTEGER DEFAULT 0,
      region TEXT DEFAULT 'UNKNOWN',
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS seasons (
      id SERIAL PRIMARY KEY,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      reward_pool TEXT DEFAULT '0',
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS season_stats (
      id SERIAL PRIMARY KEY,
      season_id INTEGER NOT NULL,
      player TEXT NOT NULL,
      wins INTEGER DEFAULT 0,
      battles INTEGER DEFAULT 0,
      rewards TEXT DEFAULT '0',
      rank INTEGER,
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(season_id, player),
      FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS battles (
      id SERIAL PRIMARY KEY,
      player TEXT NOT NULL,
      fighter_id TEXT NOT NULL,
      win BOOLEAN NOT NULL,
      reward TEXT DEFAULT '0',
      mode TEXT DEFAULT 'PvE',
      tx_hash TEXT,
      season_id INTEGER,
      timestamp TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS market_listings (
      token_id TEXT PRIMARY KEY,
      seller TEXT NOT NULL,
      price TEXT NOT NULL,
      rarity TEXT DEFAULT 'Common',
      strength INTEGER DEFAULT 10,
      speed INTEGER DEFAULT 10,
      intelligence INTEGER DEFAULT 10,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      active BOOLEAN DEFAULT true,
      listed_at TIMESTAMP DEFAULT NOW(),
      price_updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id SERIAL PRIMARY KEY,
      token_id TEXT NOT NULL,
      old_price TEXT,
      new_price TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (token_id) REFERENCES market_listings(token_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_season_stats_season ON season_stats(season_id);
    CREATE INDEX IF NOT EXISTS idx_season_stats_player ON season_stats(player);
    CREATE INDEX IF NOT EXISTS idx_battles_season ON battles(season_id);
    CREATE INDEX IF NOT EXISTS idx_battles_player ON battles(player);
  `);
  console.log("Database initialized");
}

const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: "connected", message: "Arena Protocol WS ready" }));
  ws.on("close", () => clients.delete(ws));
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(msg);
    }
  }
}

app.get("/api/healthz", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const season = req.query.season || "all";
    const region = req.query.region;

    let query, params = [];

    if (season !== "all") {
      // Seasonal leaderboard
      query = `
        SELECT s.player as address, s.wins as total_wins, s.battles as total_battles, s.rewards as total_rewards, s.rank
        FROM season_stats s
        INNER JOIN seasons se ON s.season_id = se.id
        WHERE se.id = (SELECT id FROM seasons WHERE active = true ORDER BY start_time DESC LIMIT 1)
      `;
    } else {
      // Global lifetime leaderboard
      query = `SELECT address, total_wins, total_battles, total_rewards FROM players`;
      if (region) {
        query += ` WHERE region = $1`;
        params.push(region);
      }
    }

    query += ` ORDER BY total_wins DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    const entries = result.rows.map((row, idx) => ({
      rank: row.rank || idx + 1,
      address: row.address,
      totalWins: row.total_wins,
      totalBattles: row.total_battles,
      totalRewards: row.total_rewards,
      winRate: row.total_battles > 0 ? ((row.total_wins / row.total_battles) * 100).toFixed(1) : 0,
    }));

    res.json(entries);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/leaderboard/seasons", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, start_time, end_time, reward_pool, active
       FROM seasons
       ORDER BY start_time DESC`
    );

    const seasons = result.rows.map((row) => ({
      id: row.id,
      startTime: row.start_time,
      endTime: row.end_time,
      rewardPool: row.reward_pool,
      active: row.active,
    }));

    res.json(seasons);
  } catch (err) {
    console.error("Seasons error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/leaderboard/regions", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT region, COUNT(*) as player_count
       FROM players
       WHERE region != 'UNKNOWN'
       GROUP BY region
       ORDER BY player_count DESC`
    );

    const regions = result.rows.map((row) => ({
      region: row.region,
      players: row.player_count,
    }));

    res.json(regions);
  } catch (err) {
    console.error("Regions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/players/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const lowerAddr = address.toLowerCase();

    const playerResult = await pool.query("SELECT * FROM players WHERE address = $1", [lowerAddr]);

    if (playerResult.rows.length === 0) {
      return res.status(404).json({ error: "Player not found" });
    }

    const row = playerResult.rows[0];
    const rankResult = await pool.query(
      "SELECT COUNT(*) as rank FROM players WHERE total_wins > $1",
      [row.total_wins]
    );

    // Get current season stats
    const seasonResult = await pool.query(
      `SELECT s.* FROM season_stats s
       INNER JOIN seasons se ON s.season_id = se.id
       WHERE s.player = $1 AND se.active = true`,
      [lowerAddr]
    );

    const currentSeasonStats = seasonResult.rows[0] || null;

    res.json({
      address: row.address,
      region: row.region,
      totalWins: row.total_wins,
      totalBattles: row.total_battles,
      totalRewards: row.total_rewards,
      winRate: row.total_battles > 0 ? ((row.total_wins / row.total_battles) * 100).toFixed(1) : 0,
      fighters: row.fighters,
      globalRank: parseInt(rankResult.rows[0].rank) + 1,
      seasonStats: currentSeasonStats ? {
        wins: currentSeasonStats.wins,
        battles: currentSeasonStats.battles,
        rewards: currentSeasonStats.rewards,
        seasonRank: currentSeasonStats.rank,
      } : null,
    });
  } catch (err) {
    console.error("Player stats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/battles", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const { address } = req.query;

    let query = "SELECT * FROM battles";
    const params = [];

    if (address) {
      query += " WHERE player = $1";
      params.push(address.toLowerCase());
    }

    query += " ORDER BY timestamp DESC LIMIT $" + (params.length + 1);
    params.push(limit);

    const result = await pool.query(query, params);

    const battles = result.rows.map((row) => ({
      id: row.id,
      player: row.player,
      fighterId: row.fighter_id,
      win: row.win,
      reward: row.reward,
      mode: row.mode,
      txHash: row.tx_hash,
      timestamp: row.timestamp,
    }));

    res.json(battles);
  } catch (err) {
    console.error("Battle history error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/battles", async (req, res) => {
  try {
    const { player, fighterId, win, reward, mode, txHash } = req.body;

    const battleResult = await pool.query(
      `INSERT INTO battles (player, fighter_id, win, reward, mode, tx_hash)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [player.toLowerCase(), fighterId, win, reward || "0", mode || "PvE", txHash || null]
    );

    await pool.query(
      `INSERT INTO players (address, total_wins, total_battles, total_rewards)
       VALUES ($1, $2, 1, $3)
       ON CONFLICT (address) DO UPDATE SET
         total_wins = players.total_wins + $2,
         total_battles = players.total_battles + 1,
         total_rewards = (CAST(players.total_rewards AS NUMERIC) + CAST(EXCLUDED.total_rewards AS NUMERIC))::TEXT,
         updated_at = NOW()`,
      [player.toLowerCase(), win ? 1 : 0, win ? (reward || "0") : "0"]
    );

    const row = battleResult.rows[0];
    const battle = {
      id: row.id,
      player: row.player,
      fighterId: row.fighter_id,
      win: row.win,
      reward: row.reward,
      mode: row.mode,
      txHash: row.tx_hash,
      timestamp: row.timestamp,
    };

    broadcast({ type: "battle", data: battle });
    res.json(battle);
  } catch (err) {
    console.error("Record battle error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/market/listings", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const result = await pool.query(
      "SELECT * FROM market_listings WHERE active = true ORDER BY listed_at DESC LIMIT $1",
      [limit]
    );

    const listings = result.rows.map((row) => ({
      tokenId: row.token_id,
      seller: row.seller,
      price: row.price,
      rarity: row.rarity,
      strength: row.strength,
      speed: row.speed,
      intelligence: row.intelligence,
      wins: row.wins,
      losses: row.losses,
      active: row.active,
    }));

    res.json(listings);
  } catch (err) {
    console.error("Market listings error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3001;

initDb()
  .then(() => {
    indexer.start(broadcast, pool);
    httpServer.listen(PORT, () => {
      console.log(`Arena Protocol backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to init DB:", err);
    process.exit(1);
  });
