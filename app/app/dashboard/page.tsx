import { Metadata } from 'next';
import { Trophy, Zap, TrendingUp, Wallet } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard - Arena Protocol',
};

async function fetchPlayers() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/players?limit=10`, {
      cache: 'revalidate',
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Failed to fetch players');
    return res.json();
  } catch (error) {
    console.error('Error fetching players:', error);
    return { data: [] };
  }
}

async function fetchBattles() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/battles?limit=10`, {
      cache: 'revalidate',
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Failed to fetch battles');
    return res.json();
  } catch (error) {
    console.error('Error fetching battles:', error);
    return { data: [] };
  }
}

export default async function Dashboard() {
  const [playersRes, battlesRes] = await Promise.all([
    fetchPlayers(),
    fetchBattles(),
  ]);

  const players = playersRes.data || [];
  const battles = battlesRes.data || [];

  const totalPlayers = players.length || 0;
  const totalBattles = battles.length || 0;
  const totalFighters = 0; // Would fetch from fighters endpoint

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-accent">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-card border border-border p-6 clip-edges hover:border-primary/50 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Players</p>
                <p className="text-3xl font-bold text-primary">{totalPlayers}</p>
              </div>
              <Trophy className="w-8 h-8 text-accent opacity-50" />
            </div>
          </div>

          <div className="bg-card border border-border p-6 clip-edges hover:border-secondary/50 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Battles</p>
                <p className="text-3xl font-bold text-secondary">{totalBattles}</p>
              </div>
              <Zap className="w-8 h-8 text-secondary opacity-50" />
            </div>
          </div>

          <div className="bg-card border border-border p-6 clip-edges hover:border-accent/50 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Active Fighters</p>
                <p className="text-3xl font-bold text-accent">{totalFighters}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-accent opacity-50" />
            </div>
          </div>

          <div className="bg-card border border-border p-6 clip-edges hover:border-primary/50 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Volume</p>
                <p className="text-3xl font-bold text-primary">$0</p>
              </div>
              <Wallet className="w-8 h-8 text-primary opacity-50" />
            </div>
          </div>
        </div>

        {/* Top Players */}
        <div className="bg-card border border-border clip-edges p-6 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-accent">Top Players</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-mono">Rank</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-mono">Player</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-mono">Wins</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-mono">Battles</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-mono">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {players && players.length > 0 ? (
                  players.map((player, idx) => (
                    <tr key={player.id} className="border-b border-border/50 hover:bg-background/50 transition">
                      <td className="py-3 px-4 font-bold text-accent">#{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-sm truncate">{player.address.slice(0, 10)}...</td>
                      <td className="py-3 px-4 text-primary font-bold">{player.total_wins}</td>
                      <td className="py-3 px-4">{player.total_battles}</td>
                      <td className="py-3 px-4">
                        {player.total_battles > 0
                          ? ((player.total_wins / player.total_battles) * 100).toFixed(1)
                          : 0}
                        %
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No players yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Battles */}
        <div className="bg-card border border-border clip-edges p-6">
          <h2 className="text-2xl font-bold mb-6 text-secondary">Recent Battles</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-mono">Player</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-mono">Result</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-mono">Mode</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-mono">Reward</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-mono">Time</th>
                </tr>
              </thead>
              <tbody>
                {battles && battles.length > 0 ? (
                  battles.map((battle) => (
                    <tr key={battle.id} className="border-b border-border/50 hover:bg-background/50 transition">
                      <td className="py-3 px-4 font-mono text-sm truncate">{battle.player_address.slice(0, 10)}...</td>
                      <td className="py-3 px-4">
                        <span className={battle.win ? 'text-green-400 font-bold' : 'text-red-400'}>
                          {battle.win ? 'Win' : 'Loss'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{battle.mode}</td>
                      <td className="py-3 px-4 text-primary">{String(battle.reward)} ARENA</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {new Date(battle.battle_timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No battles yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
