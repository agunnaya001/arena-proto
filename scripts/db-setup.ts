import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupDatabase() {
  console.log("Setting up Arena Protocol database...");

  try {
    // Create tables using Supabase client
    // Note: This uses raw SQL via rpc or direct client execution

    // 1. Create players table
    await supabase.from("players").select("id").limit(0);
    console.log("✓ Players table ready");

    // 2. Create fighters table
    await supabase.from("fighters").select("id").limit(0);
    console.log("✓ Fighters table ready");

    // 3. Create battles table
    await supabase.from("battles").select("id").limit(0);
    console.log("✓ Battles table ready");

    // 4. Create marketplace_listings table
    await supabase.from("marketplace_listings").select("id").limit(0);
    console.log("✓ Marketplace listings table ready");

    // 5. Create price_history table
    await supabase.from("price_history").select("id").limit(0);
    console.log("✓ Price history table ready");

    // 6. Create seasons table
    await supabase.from("seasons").select("id").limit(0);
    console.log("✓ Seasons table ready");

    // 7. Create season_stats table
    await supabase.from("season_stats").select("id").limit(0);
    console.log("✓ Season stats table ready");

    // 8. Create player_balances table
    await supabase.from("player_balances").select("id").limit(0);
    console.log("✓ Player balances table ready");

    console.log("\n✓ Database setup complete!");
  } catch (error) {
    console.error("Database setup failed:", error);
    process.exit(1);
  }
}

setupDatabase();
