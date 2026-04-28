import {
  useGetPlayerStats,
  useGetBattleHistory,
  getGetPlayerStatsQueryKey,
  getGetBattleHistoryQueryKey,
} from "@workspace/api-client-react";
import { useAccount, useReadContract } from "wagmi";
import { formatAddress } from "@/lib/utils";
import { User, Activity, Wallet, Swords } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ARENA_ADDRESSES,
  ARENA_TOKEN_ABI,
  ARENA_CHAMPION_ABI,
  ONE_ARENA,
  explorerUrl,
} from "@/lib/contracts";

export default function Profile() {
  const { address, isConnected } = useAccount();

  const { data: stats, isLoading: statsLoading } = useGetPlayerStats(address ?? "", {
    query: {
      queryKey: getGetPlayerStatsQueryKey(address ?? ""),
      enabled: !!address,
    },
  });
  const { data: history, isLoading: historyLoading } = useGetBattleHistory(
    { address: address ?? undefined, limit: 10 },
    {
      query: {
        queryKey: getGetBattleHistoryQueryKey({
          address: address ?? undefined,
          limit: 10,
        }),
        enabled: !!address,
      },
    },
  );

  const { data: arenaBalance } = useReadContract({
    address: ARENA_ADDRESSES.ArenaToken,
    abi: ARENA_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30_000 },
  });

  const { data: nftBalance } = useReadContract({
    address: ARENA_ADDRESSES.ArenaChampion,
    abi: ARENA_CHAMPION_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30_000 },
  });

  if (!isConnected || !address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Wallet className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold font-display uppercase mb-2">ACCESS DENIED</h2>
        <p className="text-muted-foreground font-mono">Connect a wallet to authenticate identity.</p>
      </div>
    );
  }

  const winRate =
    stats && stats.totalBattles > 0
      ? Math.round((stats.totalWins / Math.max(stats.totalBattles, 1)) * 100)
      : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4 border-b border-border/50 pb-8">
        <div className="w-20 h-20 bg-card border-2 border-primary clip-edges flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/20 scanlines" />
          <User className="w-10 h-10 text-primary relative z-10" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-widest text-white neon-text truncate">
            {formatAddress(address)}
          </h1>
          <p className="text-primary font-mono text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            VERIFIED COMMANDER
          </p>
          <a
            href={explorerUrl(address)}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-mono text-muted-foreground hover:text-primary"
          >
            View on Basescan ↗
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox
          label="GLOBAL RANK"
          value={stats?.rank ? `#${stats.rank}` : "UNRANKED"}
          loading={statsLoading}
          color="text-accent"
        />
        <StatBox label="WIN RATE" value={`${winRate}%`} loading={statsLoading} color="text-primary" />
        <StatBox
          label="FIGHTERS OWNED"
          value={nftBalance != null ? (nftBalance as bigint).toString() : "—"}
          loading={nftBalance == null}
          color="text-white"
        />
        <StatBox
          label="ARENA BALANCE"
          value={arenaBalance != null ? `${((arenaBalance as bigint) / ONE_ARENA).toString()}` : "—"}
          loading={arenaBalance == null}
          color="text-green-400"
        />
      </div>

      <Card className="border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-primary" />
            COMBAT LOG
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="py-8 text-center text-primary font-mono animate-pulse">FETCHING LOGS…</div>
          ) : history && history.length > 0 ? (
            <div className="space-y-2">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-black/40 border border-border/20 clip-edges font-mono text-sm hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-4 mb-2 sm:mb-0">
                    <span className={record.win ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                      {record.win ? "VICTORY" : "DEFEAT"}
                    </span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-foreground">FIGHTER #{record.fighterId}</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-muted-foreground">{record.mode}</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className={record.win ? "text-green-400" : "text-muted-foreground"}>
                      {record.win ? `+${record.reward} ARENA` : "0 ARENA"}
                    </span>
                    {record.txHash ? (
                      <a
                        href={explorerUrl(record.txHash, "tx")}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary/60 hover:text-primary underline decoration-primary/30"
                      >
                        VIEW TX
                      </a>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-border/30 clip-edges">
              <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="font-mono text-muted-foreground uppercase">NO COMBAT RECORDS FOUND</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({
  label,
  value,
  loading,
  color,
}: {
  label: string;
  value: string;
  loading: boolean;
  color: string;
}) {
  return (
    <div className="bg-card/40 border border-border/50 p-4 clip-edges">
      <p className="font-mono text-xs text-muted-foreground mb-1">{label}</p>
      {loading ? (
        <div className="h-8 w-16 bg-white/5 animate-pulse rounded" />
      ) : (
        <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
      )}
    </div>
  );
}
