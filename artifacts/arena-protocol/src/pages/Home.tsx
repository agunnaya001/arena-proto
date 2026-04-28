import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import {
  TerminalSquare,
  Swords,
  Users,
  Activity,
  Hexagon,
  Trophy,
  Store,
} from "lucide-react";
import { motion } from "framer-motion";
import { useReadContract } from "wagmi";
import { useGetStats, getGetStatsQueryKey } from "@workspace/api-client-react";
import { ARENA_ADDRESSES, ARENA_TOKEN_ABI, ONE_ARENA } from "@/lib/contracts";

function formatCompact(value: number | bigint | string): string {
  const n = typeof value === "bigint" ? Number(value) : Number(value);
  if (!Number.isFinite(n) || n === 0) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return n.toLocaleString();
}

export default function Home() {
  const { data: stats } = useGetStats({
    query: {
      queryKey: getGetStatsQueryKey(),
      staleTime: 30_000,
      refetchInterval: 60_000,
    },
  });

  // Live ARENA token total supply from chain — proves the dApp is wired to Base.
  const { data: totalSupply } = useReadContract({
    address: ARENA_ADDRESSES.ArenaToken,
    abi: ARENA_TOKEN_ABI,
    functionName: "totalSupply",
    query: { staleTime: 5 * 60_000 },
  });

  const supplyArena = totalSupply ? Number((totalSupply as bigint) / ONE_ARENA) : null;

  const cards: {
    label: string;
    value: string;
    icon: typeof Users;
    border: string;
    iconBg: string;
    iconColor: string;
    valueColor: string;
  }[] = [
    {
      label: "ACTIVE FIGHTERS",
      value: stats ? formatCompact(stats.activeFighters) : "—",
      icon: Users,
      border: "border-primary/20 hover:border-primary/50",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      valueColor: "text-white neon-text",
    },
    {
      label: "TOTAL BATTLES",
      value: stats ? formatCompact(stats.totalBattles) : "—",
      icon: Activity,
      border: "border-secondary/20 hover:border-secondary/50",
      iconBg: "bg-secondary/10",
      iconColor: "text-secondary",
      valueColor: "text-white",
    },
    {
      label: "$ARENA SUPPLY",
      value: supplyArena !== null ? `${formatCompact(supplyArena)}` : "—",
      icon: Hexagon,
      border: "border-accent/20 hover:border-accent/50",
      iconBg: "bg-accent/10",
      iconColor: "text-accent",
      valueColor: "text-white",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden clip-edges border border-primary/30 p-8 md:p-16 lg:p-24 min-h-[500px] flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src={`${import.meta.env.BASE_URL}brand/banner.png`}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover opacity-40"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary text-primary text-xs font-mono mb-6 clip-edges">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              SYSTEM_ONLINE // BASE MAINNET
            </div>

            <h1 className="text-5xl md:text-7xl font-black mb-6 text-white text-shadow-sm uppercase leading-tight">
              Enter The <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary filter drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                Cyber Arena
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 mb-8 font-mono max-w-xl">
              Mint augmented fighters, battle in high-stakes arenas, and climb the global ranks to earn $ARENA tokens.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/mint" className="block">
                <Button size="lg" className="text-lg w-full sm:w-auto">
                  <TerminalSquare className="mr-2 h-5 w-5" />
                  INITIALIZE FIGHTER
                </Button>
              </Link>
              <Link href="/arena" className="block">
                <Button variant="cyber" size="lg" className="text-lg w-full sm:w-auto">
                  <Swords className="mr-2 h-5 w-5" />
                  ENTER ARENA
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Network Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (i + 1) }}
          >
            <Card className={`bg-card/40 transition-colors ${c.border}`}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-4 ${c.iconBg} clip-edges`}>
                  <c.icon className={`w-8 h-8 ${c.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-mono">{c.label}</p>
                  <p className={`text-3xl font-display font-bold ${c.valueColor}`}>{c.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Quick Access */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <TerminalSquare className="text-primary" /> SYSTEM_MODULES
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link href="/leaderboard" className="group block">
            <div className="relative overflow-hidden clip-edges border border-border/50 bg-card p-8 transition-all hover:border-primary">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Trophy className="w-32 h-32 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                LEADERBOARD
              </h3>
              <p className="text-muted-foreground font-mono text-sm max-w-[80%]">
                View top ranked players, global win rates, and highest earners in the protocol.
              </p>
            </div>
          </Link>

          <Link href="/marketplace" className="group block">
            <div className="relative overflow-hidden clip-edges border border-border/50 bg-card p-8 transition-all hover:border-secondary">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Store className="w-32 h-32 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-2 group-hover:text-secondary transition-colors">
                MARKETPLACE
              </h3>
              <p className="text-muted-foreground font-mono text-sm max-w-[80%]">
                Trade augmented fighters with other players. Acquire legendary tier assets.
                {stats && stats.activeListings > 0 && (
                  <span className="block mt-2 text-secondary">
                    {stats.activeListings} active listing{stats.activeListings === 1 ? "" : "s"}
                  </span>
                )}
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
