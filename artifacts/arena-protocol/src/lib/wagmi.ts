// Wagmi configuration. Production builds use Base Mainnet only.
// Set VITE_USE_TESTNET=true at build time to enable Base Sepolia for staging
// and to test newly deployed contracts (e.g. ArenaCoinV2, ArenaStaking) before
// promoting them to mainnet.
import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { injected, coinbaseWallet } from "wagmi/connectors";

const useTestnet = import.meta.env.VITE_USE_TESTNET === "true";

export const supportedChains = useTestnet
  ? ([base, baseSepolia] as const)
  : ([base] as const);

export const config = createConfig({
  chains: supportedChains,
  multiInjectedProviderDiscovery: true,
  connectors: [
    injected({ shimDisconnect: true }),
    coinbaseWallet({ appName: "Arena Protocol", preference: "smartWalletOnly" }),
  ],
  transports: {
    [base.id]: http(import.meta.env.VITE_BASE_RPC_URL || undefined),
    [baseSepolia.id]: http(import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || undefined),
  },
});

// Default chain for the active build. Components should prefer reading
// `useChainId()` from wagmi at runtime instead of hard-coding this.
export const defaultChain = useTestnet ? baseSepolia : base;

// Arena Protocol treasury address. All initial supply, NFT royalties, and
// the DEFAULT_ADMIN_ROLE on ArenaCoinV2 should be assigned to this address
// (preferably a Safe multisig — https://app.safe.global/).
export const ARENA_TREASURY_ADDRESS =
  (import.meta.env.VITE_ARENA_TREASURY_ADDRESS as `0x${string}` | undefined) ??
  ("0x725615639B760DAa64b3e794AA49B5A9a8A7632E" as const);
