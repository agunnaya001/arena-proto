import { useState, useEffect } from "react"
import { useGetLeaderboard } from "@workspace/api-client-react"
import { Trophy, Medal, Crown, Globe } from "lucide-react"
import { formatAddress } from "@/lib/utils"

export default function Leaderboard() {
  const [season, setSeason] = useState("all")
  const [region, setRegion] = useState("")
  const [seasons, setSeasons] = useState([])
  const [regions, setRegions] = useState([])
  
  const { data: leaderboard, isLoading, error } = useGetLeaderboard({ limit: 50, season })

  useEffect(() => {
    // Fetch available seasons
    fetch("/api/leaderboard/seasons")
      .then(res => res.json())
      .then(data => setSeasons(data))
      .catch(err => console.error("Failed to load seasons:", err))
  }, [])

  useEffect(() => {
    // Fetch available regions
    fetch("/api/leaderboard/regions")
      .then(res => res.json())
      .then(data => setRegions(data))
      .catch(err => console.error("Failed to load regions:", err))
  }, [])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-accent/10 clip-edges border border-accent/30">
          <Trophy className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display uppercase tracking-widest text-accent">Global Rankings</h1>
          <p className="text-muted-foreground font-mono text-sm">Top commanders in the Arena Protocol</p>
        </div>
      </div>

      {/* Season & Region Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Season Selector */}
        <div>
          <label className="text-sm font-mono text-muted-foreground uppercase mb-2 block">Season</label>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="w-full bg-card/60 border border-border/50 text-foreground font-mono text-sm px-4 py-2 clip-edges hover:border-accent/50 transition-colors"
          >
            <option value="all">All Time</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                Season {s.id} ({new Date(s.startTime).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        {/* Region Selector */}
        <div>
          <label className="text-sm font-mono text-muted-foreground uppercase mb-2 block flex items-center gap-2">
            <Globe className="w-4 h-4" /> Region
          </label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full bg-card/60 border border-border/50 text-foreground font-mono text-sm px-4 py-2 clip-edges hover:border-accent/50 transition-colors"
          >
            <option value="">All Regions</option>
            {regions.map((r) => (
              <option key={r.region} value={r.region}>
                {r.region} ({r.players} players)
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-card/60 backdrop-blur-md border border-border/50 clip-edges overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono">
            <thead className="bg-black/40 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-normal">Rank</th>
                <th className="px-6 py-4 font-normal">Commander</th>
                <th className="px-6 py-4 font-normal text-right">Win Rate</th>
                <th className="px-6 py-4 font-normal text-right">Battles</th>
                <th className="px-6 py-4 font-normal text-right">Total Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-primary animate-pulse">
                    LOADING NEURAL DATA...
                  </td>
                </tr>
              )}
              
              {error && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-destructive">
                    ERR_CONNECTION_FAILED
                  </td>
                </tr>
              )}

              {leaderboard?.map((entry) => (
                <tr 
                  key={entry.address} 
                  className="hover:bg-white/5 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {entry.rank === 1 && <Crown className="w-5 h-5 text-yellow-400" />}
                      {entry.rank === 2 && <Medal className="w-5 h-5 text-gray-400" />}
                      {entry.rank === 3 && <Medal className="w-5 h-5 text-amber-700" />}
                      {entry.rank > 3 && <span className="w-5 text-center text-muted-foreground">#{entry.rank}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-primary font-bold group-hover:neon-text transition-all">
                      {formatAddress(entry.address)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={entry.winRate > 50 ? "text-green-400" : "text-red-400"}>
                      {entry.winRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-muted-foreground">
                    {entry.totalWins} / {entry.totalBattles}
                  </td>
                  <td className="px-6 py-4 text-right text-accent font-bold">
                    {entry.totalRewards}
                  </td>
                </tr>
              ))}

              {!isLoading && !leaderboard?.length && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    NO DATA AVAILABLE IN REGISTRY
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
