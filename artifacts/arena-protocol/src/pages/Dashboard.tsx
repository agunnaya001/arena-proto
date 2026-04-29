import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { useQuery } from "@tanstack/react-query"
import { Trophy, Swords, Zap, TrendingUp, Loader2 } from "lucide-react"
import { formatAddress } from "@/lib/utils"

interface PlayerDashboard {
  address: string
  region: string
  totalWins: number
  totalBattles: number
  totalRewards: string
  winRate: number
  fighters: number
  globalRank: number
  seasonStats?: {
    wins: number
    battles: number
    rewards: string
    seasonRank: number
  }
}

interface Fighter {
  tokenId: string
  rarity: string
  strength: number
  speed: number
  intelligence: number
  wins: number
  losses: number
}

interface Battle {
  id: number
  player: string
  fighterId: string
  win: boolean
  reward: string
  mode: string
  timestamp: string
}

export default function Dashboard() {
  const { address } = useAccount()
  const [activeTab, setActiveTab] = useState<"overview" | "fighters" | "battles" | "rewards">("overview")

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ["playerDashboard", address],
    queryFn: () => fetch(`/api/players/${address}`).then(r => r.json()),
    enabled: !!address,
  })

  const { data: fighters = [], isLoading: fightersLoading } = useQuery({
    queryKey: ["playerFighters", address],
    queryFn: () => fetch(`/api/player/${address}/fighters`).then(r => r.json()),
    enabled: !!address,
  })

  const { data: battles = [], isLoading: battlesLoading } = useQuery({
    queryKey: ["playerBattles", address],
    queryFn: () => fetch(`/api/player/${address}/battle-history?limit=20`).then(r => r.json()),
    enabled: !!address,
  })

  if (!address) {
    return (
      <div className="max-w-6xl mx-auto text-center py-12">
        <p className="text-muted-foreground font-mono mb-4">CONNECT WALLET TO VIEW DASHBOARD</p>
        <p className="text-sm text-muted-foreground/70">Player profile data requires wallet authentication</p>
      </div>
    )
  }

  if (dashboardLoading) {
    return (
      <div className="max-w-6xl mx-auto text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
        <p className="text-muted-foreground font-mono">LOADING PLAYER DATA...</p>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="max-w-6xl mx-auto text-center py-12">
        <p className="text-destructive font-mono mb-4">ERR_PLAYER_NOT_FOUND</p>
        <p className="text-sm text-muted-foreground">No profile data found. Mint your first fighter to create a profile.</p>
      </div>
    )
  }

  const rarityColors = {
    "Common": "bg-gray-600",
    "Rare": "bg-blue-600",
    "Epic": "bg-purple-600",
    "Legendary": "bg-yellow-600"
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display uppercase tracking-widest text-accent mb-2">
          {formatAddress(address)}
        </h1>
        <p className="text-muted-foreground font-mono text-sm">Global Rank #{dashboard.globalRank} • {dashboard.region}</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card/60 border border-border/50 clip-edges p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-mono text-muted-foreground uppercase">Total Wins</span>
          </div>
          <p className="text-2xl font-bold text-accent">{dashboard.totalWins}</p>
          <p className="text-xs text-muted-foreground font-mono">{dashboard.totalBattles} battles</p>
        </div>

        <div className="bg-card/60 border border-border/50 clip-edges p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs font-mono text-muted-foreground uppercase">Win Rate</span>
          </div>
          <p className="text-2xl font-bold text-accent">{dashboard.winRate}%</p>
          <p className="text-xs text-muted-foreground font-mono">{dashboard.totalBattles > 0 ? "active" : "no battles"}</p>
        </div>

        <div className="bg-card/60 border border-border/50 clip-edges p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono text-muted-foreground uppercase">Total Rewards</span>
          </div>
          <p className="text-2xl font-bold text-accent">{parseFloat(dashboard.totalRewards).toFixed(1)}</p>
          <p className="text-xs text-muted-foreground font-mono">ARENA earned</p>
        </div>

        <div className="bg-card/60 border border-border/50 clip-edges p-4">
          <div className="flex items-center gap-2 mb-2">
            <Swords className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono text-muted-foreground uppercase">Fighters</span>
          </div>
          <p className="text-2xl font-bold text-accent">{dashboard.fighters}</p>
          <p className="text-xs text-muted-foreground font-mono">owned</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-border/30">
        {(["overview", "fighters", "battles", "rewards"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-mono text-sm uppercase transition-colors ${
              activeTab === tab
                ? "text-accent border-b-2 border-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "overview" && "Overview"}
            {tab === "fighters" && "Fighters"}
            {tab === "battles" && "History"}
            {tab === "rewards" && "Rewards"}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Season Stats */}
          {dashboard.seasonStats && (
            <div className="bg-card/60 border border-border/50 clip-edges p-6">
              <h3 className="text-sm font-mono uppercase text-muted-foreground mb-4">Current Season</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wins</span>
                  <span className="font-bold text-accent">{dashboard.seasonStats.wins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Battles</span>
                  <span className="font-bold text-accent">{dashboard.seasonStats.battles}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rewards</span>
                  <span className="font-bold text-accent">{parseFloat(dashboard.seasonStats.rewards).toFixed(1)} ARENA</span>
                </div>
                <div className="border-t border-border/30 pt-4 flex justify-between">
                  <span className="text-muted-foreground">Season Rank</span>
                  <span className="font-bold text-yellow-400">#{dashboard.seasonStats.seasonRank}</span>
                </div>
              </div>
            </div>
          )}

          {/* Global Stats */}
          <div className="bg-card/60 border border-border/50 clip-edges p-6">
            <h3 className="text-sm font-mono uppercase text-muted-foreground mb-4">All Time</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Wins</span>
                <span className="font-bold text-accent">{dashboard.totalWins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Battles</span>
                <span className="font-bold text-accent">{dashboard.totalBattles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Rewards</span>
                <span className="font-bold text-accent">{parseFloat(dashboard.totalRewards).toFixed(1)} ARENA</span>
              </div>
              <div className="border-t border-border/30 pt-4 flex justify-between">
                <span className="text-muted-foreground">Global Rank</span>
                <span className="font-bold text-yellow-400">#{dashboard.globalRank}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fighters Tab */}
      {activeTab === "fighters" && (
        <div>
          {fightersLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-accent mb-2" />
            </div>
          ) : fighters.length === 0 ? (
            <p className="text-muted-foreground font-mono text-center py-12">NO FIGHTERS FOUND</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fighters.map((f: Fighter) => (
                <div key={f.tokenId} className="bg-card/60 border border-border/50 clip-edges overflow-hidden">
                  <div className={`${rarityColors[f.rarity as keyof typeof rarityColors] || "bg-gray-600"} px-4 py-2 text-sm font-mono font-bold text-white`}>
                    {f.rarity} Fighter
                  </div>
                  <div className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Token ID</span>
                      <span className="font-mono font-bold">{f.tokenId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Strength</span>
                      <span className="text-accent">{f.strength}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Speed</span>
                      <span className="text-accent">{f.speed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Intelligence</span>
                      <span className="text-accent">{f.intelligence}</span>
                    </div>
                    <div className="border-t border-border/30 pt-2 mt-2 flex justify-between">
                      <span className="text-muted-foreground">Record</span>
                      <span className="font-bold">{f.wins}W-{f.losses}L</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Battles Tab */}
      {activeTab === "battles" && (
        <div>
          {battlesLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-accent mb-2" />
            </div>
          ) : battles.length === 0 ? (
            <p className="text-muted-foreground font-mono text-center py-12">NO BATTLES RECORDED</p>
          ) : (
            <div className="bg-card/60 border border-border/50 clip-edges overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-mono">
                  <thead className="bg-black/40 text-muted-foreground text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left font-normal">Date</th>
                      <th className="px-4 py-3 text-left font-normal">Fighter ID</th>
                      <th className="px-4 py-3 text-left font-normal">Result</th>
                      <th className="px-4 py-3 text-left font-normal">Reward</th>
                      <th className="px-4 py-3 text-left font-normal">Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {battles.map((b: Battle) => (
                      <tr key={b.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          {new Date(b.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-accent">{b.fighterId}</td>
                        <td className="px-4 py-3">
                          <span className={b.win ? "text-green-400 font-bold" : "text-red-400"}>
                            {b.win ? "WIN" : "LOSS"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-accent">{parseFloat(b.reward).toFixed(1)} ARENA</td>
                        <td className="px-4 py-3 text-muted-foreground">{b.mode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rewards Tab */}
      {activeTab === "rewards" && (
        <div className="space-y-4">
          <div className="bg-card/60 border border-border/50 clip-edges p-6">
            <h3 className="text-sm font-mono uppercase text-muted-foreground mb-4">Pending Rewards</h3>
            <p className="text-3xl font-bold text-accent mb-4">{parseFloat(dashboard.totalRewards).toFixed(1)} ARENA</p>
            <button className="w-full bg-accent/20 hover:bg-accent/30 border border-accent/50 text-accent font-mono py-2 px-4 clip-edges transition-colors">
              CLAIM REWARDS
            </button>
          </div>

          <div className="bg-card/60 border border-border/50 clip-edges p-6">
            <h3 className="text-sm font-mono uppercase text-muted-foreground mb-4">Staking</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Staked Amount</span>
                <span className="font-bold text-accent">0 ARENA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daily Yield</span>
                <span className="font-bold text-accent">0 ARENA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Claim</span>
                <span className="font-bold text-accent">—</span>
              </div>
              <button className="w-full mt-4 bg-accent/10 hover:bg-accent/20 border border-accent/40 text-accent font-mono py-2 px-4 clip-edges transition-colors">
                MANAGE STAKING
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
