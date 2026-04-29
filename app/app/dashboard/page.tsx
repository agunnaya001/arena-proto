import { Metadata } from 'next';
import { Trophy, Zap, TrendingUp, Wallet } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard - Arena Protocol',
};

export default async function Dashboard() {
  // Placeholder stats while database connection stabilizes
  const totalPlayers = 0;
  const totalBattles = 0;
  const totalFighters = 0;

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
          <div className="py-12 text-center text-muted-foreground">
            Connect your database to view player rankings
          </div>
        </div>

        {/* Recent Battles */}
        <div className="bg-card border border-border clip-edges p-6">
          <h2 className="text-2xl font-bold mb-6 text-secondary">Recent Battles</h2>
          <div className="py-12 text-center text-muted-foreground">
            Battle history will appear here once the database is connected
          </div>
        </div>
      </div>
    </div>
  );
}
