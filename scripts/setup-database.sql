-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT,
  total_wins INTEGER DEFAULT 0,
  total_battles INTEGER DEFAULT 0,
  total_rewards NUMERIC DEFAULT 0,
  region TEXT DEFAULT 'UNKNOWN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fighters table
CREATE TABLE IF NOT EXISTS fighters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  token_id INTEGER UNIQUE NOT NULL,
  name TEXT,
  rarity TEXT CHECK (rarity IN ('Common', 'Rare', 'Epic', 'Legendary')),
  strength INTEGER DEFAULT 10,
  speed INTEGER DEFAULT 10,
  intelligence INTEGER DEFAULT 10,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Battles table
CREATE TABLE IF NOT EXISTS battles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  fighter_id UUID NOT NULL REFERENCES fighters(id) ON DELETE CASCADE,
  opponent_id UUID,
  opponent_fighter_id UUID,
  win BOOLEAN NOT NULL,
  reward NUMERIC DEFAULT 0,
  mode TEXT CHECK (mode IN ('PvE', 'PvP')) DEFAULT 'PvE',
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace listings table
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fighter_id UUID NOT NULL REFERENCES fighters(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  active BOOLEAN DEFAULT true,
  listed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Price history table
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  old_price NUMERIC,
  new_price NUMERIC NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  reward_pool NUMERIC DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Season stats table
CREATE TABLE IF NOT EXISTS season_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  wins INTEGER DEFAULT 0,
  battles INTEGER DEFAULT 0,
  rewards NUMERIC DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(season_id, player_id)
);

-- Wallet balances table
CREATE TABLE IF NOT EXISTS wallet_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID UNIQUE NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  token_balance NUMERIC DEFAULT 0,
  staked_balance NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_players_wallet_address ON players(wallet_address);
CREATE INDEX idx_fighters_player_id ON fighters(player_id);
CREATE INDEX idx_fighters_token_id ON fighters(token_id);
CREATE INDEX idx_battles_player_id ON battles(player_id);
CREATE INDEX idx_battles_created_at ON battles(created_at);
CREATE INDEX idx_marketplace_fighter_id ON marketplace_listings(fighter_id);
CREATE INDEX idx_marketplace_seller_id ON marketplace_listings(seller_id);
CREATE INDEX idx_marketplace_active ON marketplace_listings(active);
CREATE INDEX idx_season_stats_season_id ON season_stats(season_id);
CREATE INDEX idx_season_stats_player_id ON season_stats(player_id);

-- Enable RLS (Row Level Security)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE fighters ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for players (public read, own write)
CREATE POLICY "Players are viewable by everyone" ON players FOR SELECT USING (true);
CREATE POLICY "Players can update their own record" ON players FOR UPDATE USING (true);

-- RLS Policies for fighters (public read)
CREATE POLICY "Fighters are viewable by everyone" ON fighters FOR SELECT USING (true);

-- RLS Policies for battles (public read)
CREATE POLICY "Battles are viewable by everyone" ON battles FOR SELECT USING (true);

-- RLS Policies for marketplace (public read)
CREATE POLICY "Marketplace listings are viewable by everyone" ON marketplace_listings FOR SELECT USING (true);

-- RLS Policies for seasons (public read)
CREATE POLICY "Seasons are viewable by everyone" ON seasons FOR SELECT USING (true);

-- RLS Policies for season_stats (public read)
CREATE POLICY "Season stats are viewable by everyone" ON season_stats FOR SELECT USING (true);

-- RLS Policies for wallet_balances (own read)
CREATE POLICY "Users can view their own wallet balance" ON wallet_balances FOR SELECT USING (true);
