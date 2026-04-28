import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FighterCard } from "@/components/FighterCard";
import {
  Swords,
  User,
  Bot,
  Skull,
  Wallet,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRecordBattle } from "@workspace/api-client-react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  ARENA_ADDRESSES,
  ARENA_BATTLE_ABI,
  ARENA_CHAMPION_ABI,
  ARENA_TOKEN_ABI,
  BATTLE_ENTRY_FEE_ARENA,
  ONE_ARENA,
  explorerUrl,
} from "@/lib/contracts";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { fighterByTokenId } from "@/lib/fighters";

export default function Arena() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();

  const [selectedFighter, setSelectedFighter] = useState<string | null>(null);
  const [mode, setMode] = useState<"PvE" | "PvP">("PvE");
  const [result, setResult] = useState<{ win: boolean; reward: string } | null>(null);

  // ── Read on-chain: how many fighters does this wallet own? ────────────
  const { data: fighterCount } = useReadContract({
    address: ARENA_ADDRESSES.ArenaChampion,
    abi: ARENA_CHAMPION_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // ── Fetch each owned tokenId via tokenOfOwnerByIndex ───────────────────
  const ownedCalls = useMemo(() => {
    if (!address || !fighterCount) return [];
    const n = Number(fighterCount as bigint);
    return Array.from({ length: Math.min(n, 12) }, (_, i) => ({
      address: ARENA_ADDRESSES.ArenaChampion,
      abi: ARENA_CHAMPION_ABI,
      functionName: "tokenOfOwnerByIndex" as const,
      args: [address, BigInt(i)] as const,
    }));
  }, [address, fighterCount]);

  const { data: ownedResults } = useReadContracts({
    contracts: ownedCalls,
    query: { enabled: ownedCalls.length > 0 },
  });

  const myFighters = useMemo(() => {
    if (!ownedResults) return [];
    return ownedResults
      .map((r) => (r.status === "success" ? (r.result as bigint).toString() : null))
      .filter((id): id is string => id !== null)
      .map((id) => {
        const t = fighterByTokenId(id);
        return {
          id,
          image: `${import.meta.env.BASE_URL.replace(/\/$/, "")}${t.image}`,
          rarity: t.rarity,
          stats: t.stats,
        };
      });
  }, [ownedResults]);

  // ── ARENA balance + allowance for the entry fee ───────────────────────
  const { data: arenaBalance } = useReadContract({
    address: ARENA_ADDRESSES.ArenaToken,
    abi: ARENA_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30_000 },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: ARENA_ADDRESSES.ArenaToken,
    abi: ARENA_TOKEN_ABI,
    functionName: "allowance",
    args: address ? [address, ARENA_ADDRESSES.ArenaBattle] : undefined,
    query: { enabled: !!address },
  });

  // ── Approve + Fight write paths ────────────────────────────────────────
  const {
    data: approveTx,
    writeContract: writeApprove,
    isPending: isApprovingSig,
  } = useWriteContract();
  const { isLoading: isApprovingOnChain, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({ hash: approveTx });
  useEffect(() => {
    if (isApproveConfirmed) {
      void refetchAllowance();
      toast({ title: "Allowance set", description: "ArenaBattle approved to spend ARENA." });
    }
  }, [isApproveConfirmed, refetchAllowance, toast]);

  const {
    data: fightTx,
    writeContract: writeFight,
    isPending: isFightingSig,
    error: fightError,
  } = useWriteContract();
  const {
    isLoading: isFightingOnChain,
    isSuccess: isFightConfirmed,
    data: fightReceipt,
  } = useWaitForTransactionReceipt({ hash: fightTx });

  const { mutateAsync: recordBattle } = useRecordBattle();

  // Decode BattleResult event for win/reward, then mirror to API.
  useEffect(() => {
    if (!isFightConfirmed || !fightReceipt || !address || !selectedFighter) return;
    // Pick the last log emitted by ArenaBattle (the BattleResult event).
    const log =
      fightReceipt.logs
        .filter((l) => l.address.toLowerCase() === ARENA_ADDRESSES.ArenaBattle.toLowerCase())
        .pop() ?? fightReceipt.logs[fightReceipt.logs.length - 1];

    let win = false;
    let rewardWei = 0n;
    if (log && log.data && log.data.length >= 2 + 64 * 2) {
      // data layout: [win:bool padded to 32 bytes][reward:uint256]
      const winHex = log.data.slice(2, 2 + 64);
      const rewardHex = log.data.slice(2 + 64, 2 + 64 * 2);
      win = BigInt("0x" + winHex) === 1n;
      rewardWei = BigInt("0x" + rewardHex);
    }
    const reward = (rewardWei / ONE_ARENA).toString();
    setResult({ win, reward });

    void recordBattle({
      data: {
        player: address,
        fighterId: selectedFighter,
        win,
        reward,
        mode,
        txHash: fightTx!,
      },
    }).catch((e) => {
      console.error("Failed to record battle off-chain", e);
    });
  }, [isFightConfirmed, fightReceipt, address, selectedFighter, mode, fightTx, recordBattle]);

  // Surface fight errors
  useEffect(() => {
    if (fightError) {
      toast({
        title: "BATTLE REJECTED",
        description: fightError.message.split("\n")[0],
        variant: "destructive",
      });
    }
  }, [fightError, toast]);

  const battleState: "IDLE" | "FIGHTING" | "RESULT" =
    result !== null
      ? "RESULT"
      : isFightingSig || isFightingOnChain
        ? "FIGHTING"
        : "IDLE";

  const entryFeeWei = BATTLE_ENTRY_FEE_ARENA * ONE_ARENA;
  const needsApproval =
    !!address && (!allowance || (allowance as bigint) < entryFeeWei);
  const insufficientBalance =
    !!address && (!arenaBalance || (arenaBalance as bigint) < entryFeeWei);

  const handleApprove = () => {
    writeApprove({
      address: ARENA_ADDRESSES.ArenaToken,
      abi: ARENA_TOKEN_ABI,
      functionName: "approve",
      args: [ARENA_ADDRESSES.ArenaBattle, entryFeeWei * 100n],
    });
  };

  const handleFight = () => {
    if (!selectedFighter) return;
    if (!address) {
      toast({ title: "Wallet required", description: "Connect a wallet first.", variant: "destructive" });
      return;
    }
    setResult(null);
    writeFight({
      address: ARENA_ADDRESSES.ArenaBattle,
      abi: ARENA_BATTLE_ABI,
      functionName: "fight",
      args: [BigInt(selectedFighter), mode === "PvE" ? 0 : 1],
    });
  };

  const resetArena = () => setResult(null);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 clip-edges border border-primary/30">
          <Swords className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display uppercase tracking-widest">Combat Arena</h1>
          <p className="text-muted-foreground font-mono text-sm">
            Entry: {BATTLE_ENTRY_FEE_ARENA.toString()} ARENA · Win reward: 18 ARENA · Burn: 2 ARENA
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {battleState === "IDLE" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            {/* Mode toggle */}
            <div className="flex gap-2 border border-border/40 p-1 w-fit clip-edges">
              <button
                onClick={() => setMode("PvE")}
                className={cn(
                  "px-5 py-2 font-mono text-xs uppercase flex items-center gap-2 transition-colors",
                  mode === "PvE" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Bot className="w-3.5 h-3.5" /> PvE
              </button>
              <button
                onClick={() => setMode("PvP")}
                className={cn(
                  "px-5 py-2 font-mono text-xs uppercase flex items-center gap-2 transition-colors",
                  mode === "PvP" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <User className="w-3.5 h-3.5" /> PvP
              </button>
            </div>

            {/* Fighter selection */}
            {!isConnected ? (
              <Card className="border-dashed border-border/50 p-12 text-center">
                <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="font-mono text-sm uppercase text-muted-foreground">
                  Connect a wallet to view your fighters
                </p>
              </Card>
            ) : myFighters.length === 0 ? (
              <Card className="border-dashed border-border/50 p-12 text-center">
                <Skull className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="font-mono text-sm uppercase text-muted-foreground mb-4">
                  No fighters in this wallet
                </p>
                <Button asChild variant="cyber">
                  <a href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/mint`}>MINT ONE FIRST</a>
                </Button>
              </Card>
            ) : (
              <>
                <h2 className="text-sm font-mono text-muted-foreground uppercase">Select a fighter</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {myFighters.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFighter(f.id)}
                      className={cn(
                        "text-left transition-all",
                        selectedFighter === f.id
                          ? "ring-2 ring-primary scale-[1.02]"
                          : "opacity-80 hover:opacity-100",
                      )}
                    >
                      <FighterCard {...f} />
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pt-4 border-t border-border/30">
                  <div className="font-mono text-xs text-muted-foreground space-y-1">
                    <div>Balance: <span className="text-foreground">
                      {arenaBalance ? ((arenaBalance as bigint) / ONE_ARENA).toString() : "—"} ARENA
                    </span></div>
                    <div>Allowance: <span className="text-foreground">
                      {allowance ? ((allowance as bigint) / ONE_ARENA).toString() : "0"} ARENA
                    </span></div>
                  </div>
                  <div className="ml-auto flex gap-3">
                    {needsApproval && (
                      <Button
                        variant="outline"
                        size="lg"
                        disabled={isApprovingSig || isApprovingOnChain}
                        onClick={handleApprove}
                      >
                        {isApprovingSig
                          ? "SIGN APPROVAL…"
                          : isApprovingOnChain
                            ? "APPROVING…"
                            : "APPROVE ARENA"}
                      </Button>
                    )}
                    <Button
                      size="lg"
                      onClick={handleFight}
                      disabled={!selectedFighter || needsApproval || insufficientBalance || isFightingSig}
                    >
                      <Swords className="mr-2 h-5 w-5" />
                      {insufficientBalance ? "INSUFFICIENT ARENA" : "INITIATE COMBAT"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {battleState === "FIGHTING" && (
          <motion.div
            key="fighting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[50vh] gap-6"
          >
            <div className="relative">
              <Swords className="w-32 h-32 text-primary animate-pulse" />
              <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse" />
            </div>
            <p className="font-display text-3xl uppercase tracking-widest text-white">
              {isFightingSig ? "AWAITING SIGNATURE…" : "COMBAT IN PROGRESS"}
            </p>
            {fightTx && (
              <a
                href={explorerUrl(fightTx, "tx")}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-primary/70 hover:text-primary flex items-center gap-1"
              >
                {fightTx.slice(0, 10)}…{fightTx.slice(-6)} <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </motion.div>
        )}

        {battleState === "RESULT" && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[50vh]"
          >
            <div
              className={cn(
                "p-12 text-center clip-edges border-2 bg-card max-w-lg w-full",
                result.win
                  ? "border-primary shadow-[0_0_50px_rgba(0,255,255,0.2)]"
                  : "border-destructive shadow-[0_0_50px_rgba(255,0,0,0.2)]",
              )}
            >
              <h2
                className={cn(
                  "text-5xl font-black font-display mb-4 uppercase",
                  result.win ? "text-primary neon-text" : "text-destructive",
                )}
              >
                {result.win ? "VICTORY" : "DEFEAT"}
              </h2>

              <div className="font-mono text-xl mb-8">
                {result.win ? (
                  <p className="text-green-400">Reward Transferred: +{result.reward} ARENA</p>
                ) : (
                  <p className="text-muted-foreground">Entry fee burned. Better luck next round.</p>
                )}
              </div>

              {fightTx && (
                <a
                  href={explorerUrl(fightTx, "tx")}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-mono text-primary/70 hover:text-primary mb-6"
                >
                  View transaction <ExternalLink className="w-3 h-3" />
                </a>
              )}

              <Button onClick={resetArena} variant="cyber" className="w-full">
                RETURN TO LOBBY
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
