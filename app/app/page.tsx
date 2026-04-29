import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Trophy, Zap, Shield, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Home - Arena Protocol',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-accent">
            ARENA PROTOCOL
          </h1>
          <p className="text-xl md:text-2xl text-muted mb-8 font-mono">
            Battle. Earn. Trade. On-Chain.
          </p>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            A decentralized gaming ecosystem where players mint augmented NFT fighters,
            compete in PvE/PvP battles, and trade assets on a trustless marketplace.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/dashboard">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Enter Arena
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="outline">
                Explore Marketplace
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-4 gap-6 mt-20">
          <div className="bg-card/50 border border-border p-6 clip-edges hover:border-primary/50 transition">
            <Trophy className="w-8 h-8 text-accent mb-4" />
            <h3 className="font-bold text-lg mb-2">Battle & Earn</h3>
            <p className="text-sm text-muted-foreground">
              Win battles to earn ARENA tokens and climb the global leaderboard
            </p>
          </div>

          <div className="bg-card/50 border border-border p-6 clip-edges hover:border-secondary/50 transition">
            <Zap className="w-8 h-8 text-secondary mb-4" />
            <h3 className="font-bold text-lg mb-2">Mint Fighters</h3>
            <p className="text-sm text-muted-foreground">
              Create unique NFT fighters with randomized stats and rare attributes
            </p>
          </div>

          <div className="bg-card/50 border border-border p-6 clip-edges hover:border-accent/50 transition">
            <Shield className="w-8 h-8 text-accent mb-4" />
            <h3 className="font-bold text-lg mb-2">Secure Trading</h3>
            <p className="text-sm text-muted-foreground">
              Trade fighters and assets with escrow protection on our marketplace
            </p>
          </div>

          <div className="bg-card/50 border border-border p-6 clip-edges hover:border-primary/50 transition">
            <TrendingUp className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-bold text-lg mb-2">Real Economy</h3>
            <p className="text-sm text-muted-foreground">
              Sustainable token economics with staking and seasonal rewards
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16 border-t border-border">
        <div className="grid md:grid-cols-3 gap-12 text-center">
          <div>
            <p className="text-4xl font-bold text-primary mb-2">10,000+</p>
            <p className="text-muted-foreground">Active Players</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-secondary mb-2">50,000+</p>
            <p className="text-muted-foreground">Battles Fought</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-accent mb-2">$5M+</p>
            <p className="text-muted-foreground">Total Volume</p>
          </div>
        </div>
      </section>
    </div>
  );
}
