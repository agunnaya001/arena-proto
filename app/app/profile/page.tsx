import { Metadata } from 'next';
import { User, Zap, Trophy } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Profile - Arena Protocol',
};

export default async function Profile() {
  // In production, this would get the connected wallet address from context/auth
  // For now, show a placeholder

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-primary/10 clip-edges border border-primary/30">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-primary">Your Profile</h1>
            <p className="text-muted-foreground font-mono text-sm">Connect your wallet to view your profile</p>
          </div>
        </div>

        {/* Placeholder Card */}
        <div className="bg-card border border-border clip-edges p-8 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-6 flex items-center justify-center">
            <User className="w-12 h-12 text-background" />
          </div>

          <h2 className="text-2xl font-bold mb-2 text-foreground">Profile Not Connected</h2>
          <p className="text-muted-foreground mb-8">
            Connect your wallet to view your fighter collection, battle history, and stats
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-background/50 p-4 rounded">
              <Trophy className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Total Wins</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="bg-background/50 p-4 rounded">
              <Zap className="w-6 h-6 text-secondary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Fighters Owned</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="bg-background/50 p-4 rounded">
              <Trophy className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Total Rewards</p>
              <p className="text-2xl font-bold">0 ARENA</p>
            </div>
          </div>

          <button className="bg-primary hover:bg-primary/90 text-background px-8 py-3 rounded font-mono font-bold transition">
            Connect Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
