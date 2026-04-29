-- Arena Protocol Database Schema
-- Production-ready schema with RLS policies and indexes

-- 1. Players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT UNIQUE NOT NULL,
  username TEXT,
  avatar_url TEXT,
  total_wins INTEGER DEFAULT 0,
  total_battles INTEGER DEFAULT 0,
  total_rewards NUMERIC(20,0) DEFAULT 0,
  fighters_owned INTEGER DEFAULT 0,
  region TEXT DEFAULT 'UNKNOWN',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Fighter NFTs table
CREATE TABLE IF NOT EXISTS fighters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id TEXT UNIQUE NOT NULL,
  owner_address TEXT NOT NULL REFERENCES players(address) ON DELETE CASCADE,
  rarity TEXT NOT NULL CHECK (rarity IN ('Common', 'Rare', 'Epic', 'Legendary')),
  strength INTEGER NOT NULL DEFAULT 10,
  speed INTEGER NOT NULL DEFAULT 10,
  intelligence INTEGER NOT NULL DEFAULT 10,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  minted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Battles table
CREATE TABLE IF NOT EXISTS battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_address TEXT NOT NULL REFERENCES players(address) ON DELETE CASCADE,
  fighter_id uuid NOT NULL REFERENCES fighters(id) ON DELETE CASCADE,
  opponent_address TEXT,
  opponent_fighter_id uuid REFERENCES fighters(id) ON DELETE SET NULL,
  win BOOLEAN NOT NULL,
  reward NUMERIC(20,0) DEFAULT 0,
  mode TEXT DEFAULT 'PvE' CHECK (mode IN ('PvE', 'PvP')),
  tx_hash TEXT,
  season_id INTEGER,
  battle_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Marketplace listings table
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id TEXT NOT NULL REFERENCES fighters(token_id) ON DELETE CASCADE,
  seller_address TEXT NOT NULL REFERENCES players(address) ON DELETE CASCADE,
  price NUMERIC(20,0) NOT NULL,
  rarity TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  listed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sold_at TIMESTAMP WITH TIME ZONE,
  buyer_address TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Price history table
CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id TEXT NOT NULL REFERENCES fighters(token_id) ON DELETE CASCADE,
  old_price NUMERIC(20,0),
  new_price NUMERIC(20,0) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  reward_pool NUMERIC(20,0) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Season stats table
CREATE TABLE IF NOT EXISTS season_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  player_address TEXT NOT NULL REFERENCES players(address) ON DELETE CASCADE,
  wins INTEGER DEFAULT 0,
  battles INTEGER DEFAULT 0,
  rewards NUMERIC(20,0) DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(season_id, player_address)
);

-- 8. Player balances table
CREATE TABLE IF NOT EXISTS player_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_address TEXT NOT NULL UNIQUE REFERENCES players(address) ON DELETE CASCADE,
  arena_balance NUMERIC(20,0) DEFAULT 0,
  pending_rewards NUMERIC(20,0) DEFAULT 0,
  staked_amount NUMERIC(20,0) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_players_address ON players(address);
CREATE INDEX idx_players_region ON players(region);
CREATE INDEX idx_fighters_owner ON fighters(owner_address);
CREATE INDEX idx_fighters_rarity ON fighters(rarity);
CREATE INDEX idx_battles_player ON battles(player_address);
CREATE INDEX idx_battles_season ON battles(season_id);
CREATE INDEX idx_battles_timestamp ON battles(battle_timestamp);
CREATE INDEX idx_listings_seller ON marketplace_listings(seller_address);
CREATE INDEX idx_listings_token ON marketplace_listings(token_id);
CREATE INDEX idx_listings_active ON marketplace_listings(active, listed_at);
CREATE INDEX idx_price_history_token ON price_history(token_id);
CREATE INDEX idx_season_stats_season ON season_stats(season_id);
CREATE INDEX idx_season_stats_player ON season_stats(player_address);

-- Row Level Security (RLS) Policies
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE fighters ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_balances ENABLE ROW LEVEL SECURITY;

-- Players: Read is public, write requires authentication
CREATE POLICY "Players are publicly readable" ON players FOR SELECT USING (true);
CREATE POLICY "Players can update their own record" ON players FOR UPDATE USING (auth.jwt() ->> 'sub' = address);
CREATE POLICY "Players can insert their own record" ON players FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = address);

-- Fighters: Public read, owner can update
CREATE POLICY "Fighters are publicly readable" ON fighters FOR SELECT USING (true);
CREATE POLICY "Owners can update their fighters" ON fighters FOR UPDATE USING (owner_address = auth.jwt() ->> 'sub');

-- Battles: Public read, app can insert
CREATE POLICY "Battles are publicly readable" ON battles FOR SELECT USING (true);
CREATE POLICY "App can insert battles" ON battles FOR INSERT WITH CHECK (true);

-- Marketplace: Public read, seller can manage
CREATE POLICY "Listings are publicly readable" ON marketplace_listings FOR SELECT USING (true);
CREATE POLICY "Sellers can manage their listings" ON marketplace_listings FOR UPDATE USING (seller_address = auth.jwt() ->> 'sub');
CREATE POLICY "Sellers can insert listings" ON marketplace_listings FOR INSERT WITH CHECK (seller_address = auth.jwt() ->> 'sub');

-- Price history: Public read only
CREATE POLICY "Price history is publicly readable" ON price_history FOR SELECT USING (true);

-- Seasons: Public read only
CREATE POLICY "Seasons are publicly readable" ON seasons FOR SELECT USING (true);

-- Season stats: Public read only
CREATE POLICY "Season stats are publicly readable" ON season_stats FOR SELECT USING (true);

-- Balances: Users can read their own
CREATE POLICY "Users can read their own balance" ON player_balances FOR SELECT USING (player_address = auth.jwt() ->> 'sub');
CREATE POLICY "Users can update their own balance" ON player_balances FOR UPDATE USING (player_address = auth.jwt() ->> 'sub');

-- Insert initial season
INSERT INTO seasons (name, start_time, end_time, reward_pool, active) VALUES
  ('Season 1', NOW(), NOW() + INTERVAL '30 days', 100000::numeric, true)
ON CONFLICT DO NOTHING;
