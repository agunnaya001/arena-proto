import { Metadata } from 'next';
import { Store, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Marketplace - Arena Protocol',
};

async function fetchListings() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/marketplace?limit=50`, {
      cache: 'revalidate',
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Failed to fetch listings');
    return res.json();
  } catch (error) {
    console.error('Error fetching listings:', error);
    return { data: [] };
  }
}

export default async function Marketplace() {
  const listingsRes = await fetchListings();
  const listings = listingsRes.data || [];

  const rarityColors: { [key: string]: string } = {
    Common: 'bg-gray-600',
    Rare: 'bg-blue-600',
    Epic: 'bg-purple-600',
    Legendary: 'bg-yellow-600',
  };

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

        {/* Listings Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings.length > 0 ? (
            listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-card border border-border clip-edges overflow-hidden hover:border-secondary/50 transition group cursor-pointer"
              >
                {/* Rarity Badge */}
                <div className={`${rarityColors[listing.rarity] || 'bg-gray-700'} px-4 py-2 text-white text-sm font-bold`}>
                  {listing.rarity}
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="font-mono text-xs text-muted-foreground mb-2">Token #{listing.token_id.slice(0, 8)}</p>
                  <p className="font-bold text-lg mb-4">Fighter #{listing.token_id.slice(0, 6)}</p>

                  {/* Price */}
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="text-2xl font-bold text-primary">{String(listing.price)} ARENA</p>
                  </div>

                  {/* Listed Info */}
                  <div className="text-xs text-muted-foreground mb-4">
                    <p>Seller: {listing.seller_address.slice(0, 10)}...</p>
                    <p>Listed: {new Date(listing.listed_at).toLocaleDateString()}</p>
                  </div>

                  {/* Buy Button */}
                  <button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground py-2 rounded font-mono text-sm transition group-hover:bg-secondary/80">
                    Buy Now
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <p>No active listings</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
