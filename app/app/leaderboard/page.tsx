import { Metadata } from 'next';
import { Trophy } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Leaderboard - Arena Protocol',
};

export default async function Leaderboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-accent/10 clip-edges border border-accent/30">
            <Trophy className="w-8 h-8 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-accent">Global Rankings</h1>
            <p className="text-muted-foreground font-mono text-sm">Top commanders in the Arena Protocol</p>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-card border border-border clip-edges overflow-hidden">
          <div className="py-12 text-center text-muted-foreground">
            <p>Connect your Supabase database to view the global leaderboard</p>
            <p className="text-sm mt-2">Run `pnpm db:setup` to initialize the database schema</p>
          </div>
        </div>
      </div>
    </div>
  );
}
