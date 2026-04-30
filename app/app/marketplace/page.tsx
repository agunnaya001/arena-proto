import { Metadata } from 'next';
import { Store, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Marketplace - Arena Protocol',
};

export default async function Marketplace() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-secondary/10 clip-edges border border-secondary/30">
              <Store className="w-8 h-8 text-secondary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-secondary">Marketplace</h1>
              <p className="text-muted-foreground font-mono text-sm">P2P Asset Exchange Hub</p>
            </div>
          </div>

          <Button variant="outline" className="font-mono text-xs">
            <Filter className="w-4 h-4 mr-2" />
            FILTER ASSETS
          </Button>
        </div>

        {/* Empty State */}
        <div className="bg-card border border-border clip-edges p-12 text-center">
          <p className="text-muted-foreground mb-4">No active listings yet</p>
          <p className="text-sm text-muted-foreground">
            Connect your Supabase database to view fighter NFT listings
          </p>
        </div>
      </div>
    </div>
  );
}
