import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { playersTable, battlesTable, marketListingsTable } from "@workspace/db/schema";
import { eq, desc, gt, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) || "10");
    const players = await db
      .select()
      .from(playersTable)
      .orderBy(desc(playersTable.totalWins))
      .limit(limit);

    const entries = players.map((row, idx) => ({
      rank: idx + 1,
      address: row.address,
      totalWins: row.totalWins,
      totalBattles: row.totalBattles,
      totalRewards: row.totalRewards,
      winRate: row.totalBattles > 0 ? (row.totalWins / row.totalBattles) * 100 : 0,
    }));

    res.json(entries);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/players/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const players = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.address, address.toLowerCase()))
      .limit(1);

    if (players.length === 0) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    const player = players[0];

    const rankResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(playersTable)
      .where(gt(playersTable.totalWins, player.totalWins));

    res.json({
      address: player.address,
      totalWins: player.totalWins,
      totalBattles: player.totalBattles,
      totalRewards: player.totalRewards,
      fighters: player.fighters,
      rank: (rankResult[0]?.count ?? 0) + 1,
    });
  } catch (err) {
    console.error("Player stats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/battles", async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) || "20");
    const { address } = req.query as { address?: string };

    let query = db.select().from(battlesTable).orderBy(desc(battlesTable.timestamp)).limit(limit);

    if (address) {
      query = query.where(eq(battlesTable.player, address.toLowerCase())) as typeof query;
    }

    const battles = await query;

    res.json(
      battles.map((row) => ({
        id: row.id,
        player: row.player,
        fighterId: row.fighterId,
        win: row.win,
        reward: row.reward,
        mode: row.mode,
        txHash: row.txHash,
        timestamp: row.timestamp,
      }))
    );
  } catch (err) {
    console.error("Battle history error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/battles", async (req, res) => {
  try {
    const { player, fighterId, win, reward, mode, txHash } = req.body ?? {};

    if (typeof player !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(player)) {
      res.status(400).json({ error: "Invalid player address" });
      return;
    }
    if (typeof fighterId !== "string" || fighterId.length === 0) {
      res.status(400).json({ error: "fighterId is required" });
      return;
    }
    if (typeof win !== "boolean") {
      res.status(400).json({ error: "win (boolean) is required" });
      return;
    }

    const safeReward = typeof reward === "string" ? reward : "0";
    const safeMode = mode === "PvP" ? "PvP" : "PvE";
    const safeTxHash = typeof txHash === "string" && /^0x[0-9a-fA-F]{64}$/.test(txHash) ? txHash : null;

    const [battle] = await db
      .insert(battlesTable)
      .values({
        player: player.toLowerCase(),
        fighterId,
        win,
        reward: safeReward,
        mode: safeMode,
        txHash: safeTxHash,
      })
      .returning();

    await db
      .insert(playersTable)
      .values({
        address: player.toLowerCase(),
        totalWins: win ? 1 : 0,
        totalBattles: 1,
        totalRewards: win ? safeReward : "0",
        fighters: 0,
      })
      .onConflictDoUpdate({
        target: playersTable.address,
        set: {
          totalWins: sql`${playersTable.totalWins} + ${win ? 1 : 0}`,
          totalBattles: sql`${playersTable.totalBattles} + 1`,
          totalRewards: sql`(CAST(${playersTable.totalRewards} AS NUMERIC) + ${parseFloat(win ? safeReward : "0")})::TEXT`,
          updatedAt: new Date(),
        },
      });

    res.json({
      id: battle.id,
      player: battle.player,
      fighterId: battle.fighterId,
      win: battle.win,
      reward: battle.reward,
      mode: battle.mode,
      txHash: battle.txHash,
      timestamp: battle.timestamp,
    });
  } catch (err) {
    console.error("Record battle error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats", async (_req, res) => {
  try {
    const [
      [{ activeFighters }],
      [{ totalBattles }],
      [{ totalRewardsArena }],
      [{ activeListings }],
    ] = await Promise.all([
      db.select({ activeFighters: sql<number>`count(*)::int` }).from(playersTable),
      db.select({ totalBattles: sql<number>`count(*)::int` }).from(battlesTable),
      db
        .select({
          totalRewardsArena: sql<string>`COALESCE(SUM(CAST(${playersTable.totalRewards} AS NUMERIC)), 0)::TEXT`,
        })
        .from(playersTable),
      db
        .select({ activeListings: sql<number>`count(*)::int` })
        .from(marketListingsTable)
        .where(eq(marketListingsTable.active, true)),
    ]);

    res.json({
      activeFighters: Number(activeFighters ?? 0),
      totalBattles: Number(totalBattles ?? 0),
      totalRewardsArena: String(totalRewardsArena ?? "0"),
      activeListings: Number(activeListings ?? 0),
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/market/listings", async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) || "20");
    const listings = await db
      .select()
      .from(marketListingsTable)
      .where(eq(marketListingsTable.active, true))
      .orderBy(desc(marketListingsTable.listedAt))
      .limit(limit);

    res.json(
      listings.map((row) => ({
        tokenId: row.tokenId,
        seller: row.seller,
        price: row.price,
        rarity: row.rarity,
        strength: row.strength,
        speed: row.speed,
        intelligence: row.intelligence,
        wins: row.wins,
        losses: row.losses,
        active: row.active,
      }))
    );
  } catch (err) {
    console.error("Market listings error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
