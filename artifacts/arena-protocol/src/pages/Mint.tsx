import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Terminal, Cpu, Zap, Beaker, Wallet, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FighterCard } from "@/components/FighterCard";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import {
  ARENA_ADDRESSES,
  ARENA_CHAMPION_ABI,
  explorerUrl,
} from "@/lib/contracts";
import { fighterByTokenId } from "@/lib/fighters";

const RARITY_LABELS = ["Common", "Rare", "Epic", "Legendary"] as const;

export default function Mint() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();

  const { data: txHash, writeContract, isPending: isSubmitting, error: writeError, reset } =
    useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({ hash: txHash });

  const isMinting = isSubmitting || isConfirming;

  // Re-read totalSupply once mint confirms so we can resolve the new tokenId.
  const { data: totalSupply, refetch: refetchTotalSupply } = useReadContract({
    address: ARENA_ADDRESSES.ArenaChampion,
    abi: ARENA_CHAMPION_ABI,
    functionName: "totalSupply",
    query: { enabled: false },
  });

  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);

  // Surface write errors as toasts (e.g. user rejected, onlyOwner revert).
  useEffect(() => {
    if (writeError) {
      toast({
        title: "MINT REJECTED",
        description: writeError.message,
        variant: "destructive",
      });
    }
  }, [writeError, toast]);

  // On confirmation, derive the minted tokenId from the Transfer event log.
  useEffect(() => {
    if (!isConfirmed || !receipt) return;
    const transferTopic =
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    const log = receipt.logs.find(
      (l) =>
        l.address.toLowerCase() === ARENA_ADDRESSES.ArenaChampion.toLowerCase() &&
        l.topics[0] === transferTopic &&
        l.topics.length === 4,
    );
    if (log) {
      const id = BigInt(log.topics[3]!).toString();
      setMintedTokenId(id);
    } else {
      // Fallback: read totalSupply
      void refetchTotalSupply().then((r) => {
        if (r.data) setMintedTokenId(String(r.data));
      });
    }
    toast({ title: "SYNTHESIS COMPLETE", description: "New fighter minted on-chain." });
  }, [isConfirmed, receipt, refetchTotalSupply, toast]);

  const handleMint = () => {
    if (!address) {
      toast({ title: "Wallet required", description: "Connect a wallet first.", variant: "destructive" });
      return;
    }
    setMintedTokenId(null);
    reset();
    writeContract({
      address: ARENA_ADDRESSES.ArenaChampion,
      abi: ARENA_CHAMPION_ABI,
      functionName: "mintFighter",
      args: [address],
    });
  };

  const minted = mintedTokenId ? fighterByTokenId(mintedTokenId) : null;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-secondary/10 clip-edges border border-secondary/30">
          <Beaker className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display uppercase tracking-widest">Synthesis Lab</h1>
          <p className="text-muted-foreground font-mono text-sm">Generate new augmented assets on-chain</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mint Console */}
        <Card className="border-primary/20 h-fit">
          <CardContent className="p-6 lg:p-8">
            <div className="bg-black/50 border border-primary/30 p-4 mb-8 font-mono text-sm text-green-400 h-48 overflow-y-auto">
              <p>{">"} CONNECTING TO BASE MAINNET...</p>
              <p>{">"} STATUS: {isConnected ? "OK" : "AWAITING WALLET"}</p>
              <p>{">"} CONTRACT: ArenaChampion @ {ARENA_ADDRESSES.ArenaChampion.slice(0, 10)}…</p>
              {!isConnected && (
                <p className="text-yellow-400 mt-4">{">"} CONNECT A WALLET TO BEGIN SYNTHESIS.</p>
              )}
              {isSubmitting && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-yellow-400 mt-4">
                  {">"} AWAITING USER SIGNATURE…
                </motion.p>
              )}
              {isConfirming && txHash && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-yellow-400 mt-4 space-y-1">
                  <p>{">"} TX SUBMITTED: {txHash.slice(0, 10)}…{txHash.slice(-6)}</p>
                  <p className="animate-pulse">{">"} ASSEMBLING CYBERNETICS [====      ]</p>
                </motion.div>
              )}
              {isConfirmed && txHash && (
                <p className="text-primary mt-4">
                  {">"} CONFIRMED. TX:{" "}
                  <a className="underline" href={explorerUrl(txHash, "tx")} target="_blank" rel="noreferrer">
                    {txHash.slice(0, 10)}…
                  </a>
                </p>
              )}
              {writeError && (
                <p className="text-destructive mt-4">{">"} ERROR: {writeError.message.split("\n")[0]}</p>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-border/50 pb-4">
                <span className="font-mono text-muted-foreground uppercase">Synthesis Cost</span>
                <span className="font-bold text-xl text-primary">
                  0 ARENA <span className="text-sm text-muted-foreground">+ GAS</span>
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-border/50 pb-4">
                <span className="font-mono text-muted-foreground uppercase">Network</span>
                <span className="font-bold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" /> Base Mainnet
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-border/50 pb-4">
                <span className="font-mono text-muted-foreground uppercase">NFT Total Supply</span>
                <span className="font-bold">
                  {totalSupply ? totalSupply.toString() : "—"}
                </span>
              </div>

              <Button
                size="lg"
                className="w-full h-16 text-xl mt-4"
                onClick={handleMint}
                disabled={!isConnected || isMinting}
              >
                {!isConnected ? (
                  <>
                    <Wallet className="mr-2 h-6 w-6" />
                    CONNECT WALLET
                  </>
                ) : isMinting ? (
                  <>
                    <Cpu className="mr-2 h-6 w-6 animate-spin" />
                    {isSubmitting ? "SIGN IN WALLET…" : "CONFIRMING…"}
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-6 w-6" />
                    INITIALIZE SYNTHESIS
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result Area */}
        <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed border-border/50 p-8 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />

          <AnimatePresence mode="wait">
            {!minted && !isMinting && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center z-10"
              >
                <Terminal className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="font-mono text-muted-foreground uppercase">Awaiting Output</p>
              </motion.div>
            )}

            {isMinting && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                className="z-10"
              >
                <div className="w-64 h-80 border-2 border-primary border-dashed flex items-center justify-center clip-edges relative overflow-hidden">
                  <div className="absolute inset-0 bg-primary/20 animate-pulse" />
                  <div className="w-full h-2 bg-primary/50 absolute top-0 animate-[ping_2s_linear_infinite]" />
                  <Cpu className="w-16 h-16 text-primary animate-spin" />
                </div>
              </motion.div>
            )}

            {minted && !isMinting && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="z-10 w-full max-w-xs"
              >
                <h3 className="text-center text-primary font-bold font-display uppercase mb-4 text-xl neon-text">
                  Asset Secured · #{mintedTokenId}
                </h3>
                <FighterCard
                  id={mintedTokenId!}
                  image={`${import.meta.env.BASE_URL.replace(/\/$/, "")}${minted.image}`}
                  rarity={minted.rarity}
                  stats={minted.stats}
                />
                {txHash && (
                  <a
                    href={explorerUrl(txHash, "tx")}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex items-center justify-center gap-1 text-xs font-mono text-primary/70 hover:text-primary"
                  >
                    View on Basescan <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <p className="mt-8 text-[11px] font-mono text-muted-foreground text-center">
        Rarity tiers in this collection: {RARITY_LABELS.join(" · ")}. The on-chain rarity is assigned
        deterministically by the contract — the front-end falls back to a sensible portrait by tokenId.
      </p>
    </div>
  );
}
