import { useState, useEffect } from "react"
import { useGetMarketListings } from "@workspace/api-client-react"
import { Store, Filter, TrendingUp } from "lucide-react"
import { FighterCard } from "@/components/FighterCard"
import { Button } from "@/components/ui/button"
import { fighterImage } from "@/lib/fighters"

export default function Marketplace() {
  const [rarity, setRarity] = useState("")
  const [sortBy, setSortBy] = useState("listed")
  const [trending, setTrending] = useState([])

  const { data: listings, isLoading } = useGetMarketListings({ limit: 50, rarity, sort: sortBy })

  useEffect(() => {
    // Fetch trending collections
    fetch("/api/marketplace/trending?period=7d")
      .then(res => res.json())
      .then(data => setTrending(data))
      .catch(err => console.error("Failed to load trending:", err))
  }, [])

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-secondary/10 clip-edges border border-secondary/30">
            <Store className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display uppercase tracking-widest text-secondary">Black Market</h1>
            <p className="text-muted-foreground font-mono text-sm">P2P Asset Exchange Hub</p>
          </div>
        </div>

        {/* Trending Section */}
        {trending.length > 0 && (
          <div className="mb-6 bg-card/40 border border-secondary/20 clip-edges p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-secondary" />
              <p className="text-xs font-mono uppercase text-secondary font-bold">Trending (7d Volume)</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs font-mono">
              {trending.slice(0, 5).map((item: any) => (
                <div key={item.collection} className="bg-black/40 p-2 border border-border/30 clip-edges">
                  <p className="text-accent font-bold mb-1">{item.collection}</p>
                  <p className="text-muted-foreground">{item.volume} ARENA</p>
                  <p className={item.change >= 0 ? "text-green-400" : "text-red-400"}>
                    {item.change >= 0 ? "+" : ""}{item.change}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="text-xs font-mono uppercase text-muted-foreground mb-2 block">Rarity Filter</label>
          <select
            value={rarity}
            onChange={(e) => setRarity(e.target.value)}
            className="w-full bg-card/60 border border-border/50 text-foreground font-mono text-sm px-4 py-2 clip-edges hover:border-secondary/50 transition-colors"
          >
            <option value="">All Rarities</option>
            <option value="Common">Common</option>
            <option value="Rare">Rare</option>
            <option value="Epic">Epic</option>
            <option value="Legendary">Legendary</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-mono uppercase text-muted-foreground mb-2 block flex items-center gap-2">
            <Filter className="w-3 h-3" /> Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-card/60 border border-border/50 text-foreground font-mono text-sm px-4 py-2 clip-edges hover:border-secondary/50 transition-colors"
          >
            <option value="listed">Recently Listed</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="trending">Trending</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="aspect-[3/4] bg-card/40 animate-pulse clip-edges border border-border/20" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {listings?.map((item) => (
            <FighterCard
              key={item.tokenId}
              id={item.tokenId}
              image={fighterImage(item.tokenId, import.meta.env.BASE_URL)}
              rarity={item.rarity}
              stats={{
                strength: item.strength,
                speed: item.speed,
                intelligence: item.intelligence
              }}
              wins={item.wins}
              losses={item.losses}
              price={item.price}
              onClick={() => alert(`Open purchase modal for ${item.tokenId}`)}
            />
          ))}

          {(!listings || listings.length === 0) && (
            <div className="col-span-full py-20 text-center border border-dashed border-border/50 clip-edges">
              <p className="font-mono text-muted-foreground uppercase">NO LISTINGS FOUND IN CURRENT SECTOR</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
