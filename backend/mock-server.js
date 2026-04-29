require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Mock data
const mockPlayers = [
  {
    address: "0x1234567890123456789012345678901234567890",
    region: "NA",
    total_wins: 45,
    total_battles: 100,
    total_rewards: "450000000000000000000",
    win_rate: 45,
    fighters: 8,
    global_rank: 1,
    season_stats: {
      wins: 12,
      battles: 25,
      rewards: "120000000000000000000",
      season_rank: 3,
    },
  },
  {
    address: "0x2234567890123456789012345678901234567890",
    region: "EU",
    total_wins: 38,
    total_battles: 95,
    total_rewards: "380000000000000000000",
    win_rate: 40,
    fighters: 6,
    global_rank: 2,
  },
  {
    address: "0x3234567890123456789012345678901234567890",
    region: "APAC",
    total_wins: 35,
    total_battles: 88,
    total_rewards: "350000000000000000000",
    win_rate: 39.8,
    fighters: 5,
    global_rank: 3,
  },
];

const mockSeasons = [
  {
    id: 1,
    start_time: "2024-04-01T00:00:00Z",
    end_time: "2024-04-29T23:59:59Z",
    reward_pool: "100000000000000000000000",
    active: true,
  },
  {
    id: 2,
    start_time: "2024-03-01T00:00:00Z",
    end_time: "2024-03-31T23:59:59Z",
    reward_pool: "100000000000000000000000",
    active: false,
  },
];

const mockRegions = [
  { region: "NA", player_count: 234 },
  { region: "EU", player_count: 189 },
  { region: "APAC", player_count: 156 },
];

const mockListings = [
  {
    token_id: "1",
    seller: "0x1111111111111111111111111111111111111111",
    price: "50000000000000000000",
    rarity: "Epic",
    strength: 85,
    speed: 75,
    intelligence: 80,
    wins: 15,
    losses: 5,
    active: true,
    listed_at: new Date(),
  },
  {
    token_id: "2",
    seller: "0x2222222222222222222222222222222222222222",
    price: "30000000000000000000",
    rarity: "Rare",
    strength: 65,
    speed: 70,
    intelligence: 60,
    wins: 8,
    losses: 12,
    active: true,
    listed_at: new Date(),
  },
  {
    token_id: "3",
    seller: "0x3333333333333333333333333333333333333333",
    price: "100000000000000000000",
    rarity: "Legendary",
    strength: 95,
    speed: 90,
    intelligence: 95,
    wins: 28,
    losses: 2,
    active: true,
    listed_at: new Date(),
  },
];

// Leaderboard endpoints
app.get("/api/leaderboard", (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const season = req.query.season;

  const leaderboard = mockPlayers.slice(0, limit).map((player, idx) => ({
    rank: idx + 1,
    address: player.address,
    totalWins: player.total_wins,
    totalBattles: player.total_battles,
    totalRewards: player.total_rewards,
    winRate: player.win_rate.toFixed(1),
  }));

  res.json(leaderboard);
});

app.get("/api/leaderboard/seasons", (req, res) => {
  res.json(mockSeasons);
});

app.get("/api/leaderboard/regions", (req, res) => {
  res.json(mockRegions);
});

// Player stats
app.get("/api/players/:address", (req, res) => {
  const player = mockPlayers.find(
    (p) => p.address.toLowerCase() === req.params.address.toLowerCase()
  );

  if (!player) {
    return res.status(404).json({ error: "Player not found" });
  }

  res.json({
    address: player.address,
    region: player.region,
    totalWins: player.total_wins,
    totalBattles: player.total_battles,
    totalRewards: player.total_rewards,
    winRate: player.win_rate.toFixed(1),
    fighters: player.fighters,
    globalRank: player.global_rank,
    seasonStats: player.season_stats || null,
  });
});

// Marketplace endpoints
app.get("/api/marketplace/listings", (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const rarity = req.query.rarity;
  const sort = req.query.sort || "listed";

  let filtered = mockListings.filter((l) => l.active);

  if (rarity) {
    filtered = filtered.filter((l) => l.rarity === rarity);
  }

  if (sort === "price-asc") {
    filtered.sort((a, b) => parseInt(a.price) - parseInt(b.price));
  } else if (sort === "price-desc") {
    filtered.sort((a, b) => parseInt(b.price) - parseInt(a.price));
  }

  res.json(filtered.slice(0, limit));
});

app.get("/api/marketplace/trending", (req, res) => {
  const period = req.query.period || "7d";
  const trending = [
    { collection: "Legendary Fighters", volume: "250000", change: 25 },
    { collection: "Epic Legends", volume: "180000", change: 12 },
    { collection: "Rare Warriors", volume: "120000", change: -5 },
    { collection: "Common Fighters", volume: "80000", change: 8 },
    { collection: "Mythic Beasts", volume: "45000", change: 35 },
  ];

  res.json(trending);
});

// Battle endpoints (mock)
app.post("/api/battles", (req, res) => {
  res.json({
    success: true,
    txHash: "0x" + "0".repeat(64),
    reward: "9000000000000000000",
  });
});

app.get("/api/battles/history/:address", (req, res) => {
  const battles = [
    {
      id: 1,
      player: req.params.address,
      fighter_id: "1",
      win: true,
      reward: "9000000000000000000",
      mode: "PvE",
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: 2,
      player: req.params.address,
      fighter_id: "2",
      win: false,
      reward: "0",
      mode: "PvP",
      timestamp: new Date(Date.now() - 7200000),
    },
    {
      id: 3,
      player: req.params.address,
      fighter_id: "3",
      win: true,
      reward: "9000000000000000000",
      mode: "PvE",
      timestamp: new Date(Date.now() - 10800000),
    },
  ];

  res.json(battles);
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

const PORT = process.env.API_PORT || 5000;
app.listen(PORT, () => {
  console.log(`Mock API server running on port ${PORT}`);
});
