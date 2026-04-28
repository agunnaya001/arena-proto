import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { formatAddress } from "@/lib/utils";
import { Wallet, LogOut, Copy, ExternalLink, AlertTriangle } from "lucide-react";
import { ARENA_NETWORK, explorerUrl } from "@/lib/contracts";
import { useToast } from "@/hooks/use-toast";

export function ConnectWallet() {
  const { address, isConnected, connector } = useAccount();
  const { connectors, connect, isPending: isConnecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { toast } = useToast();

  const wrongNetwork = isConnected && chainId !== ARENA_NETWORK.chainId;

  if (!isConnected || !address) {
    // Surface every detected wallet (MetaMask, Rabby, Coinbase, Brave, etc.)
    const visibleConnectors = connectors.filter(
      (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i,
    );

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" disabled={isConnecting}>
            <Wallet className="mr-2 h-4 w-4" />
            {isConnecting ? "CONNECTING…" : "CONNECT"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 font-mono">
          <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">
            Select Wallet
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {visibleConnectors.length === 0 && (
            <div className="px-2 py-3 text-xs text-muted-foreground">
              No wallet detected. Install MetaMask or Coinbase Wallet.
            </div>
          )}
          {visibleConnectors.map((c) => (
            <DropdownMenuItem
              key={c.uid}
              onSelect={() => {
                connect(
                  { connector: c },
                  {
                    onError: (err) =>
                      toast({
                        title: "Connection failed",
                        description: err.message,
                        variant: "destructive",
                      }),
                  },
                );
              }}
              className="cursor-pointer text-xs uppercase"
            >
              {c.name}
            </DropdownMenuItem>
          ))}
          {connectError && (
            <div className="px-2 py-2 text-[11px] text-destructive border-t border-border/40">
              {connectError.message}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (wrongNetwork) {
    return (
      <Button
        variant="destructive"
        className="font-mono text-xs"
        disabled={isSwitching}
        onClick={() => switchChain({ chainId: ARENA_NETWORK.chainId })}
      >
        <AlertTriangle className="mr-2 h-4 w-4" />
        {isSwitching ? "SWITCHING…" : "SWITCH TO BASE"}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="cyber" className="font-mono text-xs">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
          {formatAddress(address)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 font-mono">
        <DropdownMenuLabel className="text-[11px] uppercase text-muted-foreground">
          {connector?.name ?? "Wallet"}
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="cursor-pointer text-xs"
          onSelect={async () => {
            try {
              await navigator.clipboard.writeText(address);
              toast({ title: "Address copied" });
            } catch {
              /* noop */
            }
          }}
        >
          <Copy className="mr-2 h-3.5 w-3.5" /> {formatAddress(address)}
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer text-xs">
          <a href={explorerUrl(address)} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-2 h-3.5 w-3.5" /> View on Basescan
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-xs text-destructive focus:text-destructive"
          onSelect={() => disconnect()}
        >
          <LogOut className="mr-2 h-3.5 w-3.5" /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
