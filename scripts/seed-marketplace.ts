/**
 * Seeds the marketplace_listings table with the 6 Arena Champion NFTs.
 *
 * Usage:
 *   pnpm tsx scripts/seed-marketplace.ts
 *
 * Idempotent: re-running upserts each listing by tokenId.
 */
import { db } from "../lib/db/src/index.ts";
import { marketListingsTable } from "../lib/db/src/schema/index.ts";

const SELLER = "0xFfb6505912FCE95B42be4860477201bb4e204E9f"; // demo seller — deployer EOA

const LISTINGS = [
  { tokenId: "1", price: "120",  rarity: "Epic",      strength:  78, speed: 92, intelligence: 71, wins: 14, losses:  3 },
  { tokenId: "2", price: "35",   rarity: "Common",    strength:  88, speed: 64, intelligence: 42, wins:  9, losses: 11 },
  { tokenId: "3", price: "85",   rarity: "Rare",      strength:  38, speed: 71, intelligence: 96, wins: 22, losses:  5 },
  { tokenId: "4", price: "150",  rarity: "Epic",      strength:  67, speed: 99, intelligence: 74, wins: 31, losses:  2 },
  { tokenId: "5", price: "750",  rarity: "Legendary", strength: 100, speed: 38, intelligence: 62, wins: 47, losses:  0 },
  { tokenId: "6", price: "70",   rarity: "Rare",      strength:  84, speed: 70, intelligence: 76, wins: 18, losses:  6 },
];

async function main() {
  console.log(`Seeding ${LISTINGS.length} marketplace listings...`);
  for (const l of LISTINGS) {
    await db
      .insert(marketListingsTable)
      .values({ ...l, seller: SELLER, active: true })
      .onConflictDoUpdate({
        target: marketListingsTable.tokenId,
        set: {
          price: l.price,
          rarity: l.rarity,
          strength: l.strength,
          speed: l.speed,
          intelligence: l.intelligence,
          wins: l.wins,
          losses: l.losses,
          active: true,
        },
      });
    console.log(`  ✓ tokenId=${l.tokenId.padEnd(2)} ${l.rarity.padEnd(10)} price=${l.price} ARENA`);
  }
  console.log("Done.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
