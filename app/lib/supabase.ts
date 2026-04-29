import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Server-side client for API routes
export function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Type definitions
export interface Player {
  id: string;
  address: string;
  username?: string;
  avatar_url?: string;
  total_wins: number;
  total_battles: number;
  total_rewards: bigint;
  fighters_owned: number;
  region?: string;
  joined_at: string;
  updated_at: string;
}

export interface Fighter {
  id: string;
  token_id: string;
  owner_address: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  strength: number;
  speed: number;
  intelligence: number;
  wins: number;
  losses: number;
  minted_at: string;
}

export interface Battle {
  id: string;
  player_address: string;
  fighter_id: string;
  opponent_address?: string;
  win: boolean;
  reward: bigint;
  mode: 'PvE' | 'PvP';
  tx_hash?: string;
  season_id?: number;
  battle_timestamp: string;
}

export interface MarketplaceListing {
  id: string;
  token_id: string;
  seller_address: string;
  price: bigint;
  rarity: string;
  active: boolean;
  listed_at: string;
  sold_at?: string;
  buyer_address?: string;
}

export interface Season {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  reward_pool: bigint;
  active: boolean;
}

export interface SeasonStats {
  id: string;
  season_id: number;
  player_address: string;
  wins: number;
  battles: number;
  rewards: bigint;
  rank?: number;
}
