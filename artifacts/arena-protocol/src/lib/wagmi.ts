// Wagmi configuration. Production builds use Base Mainnet only.
// Set VITE_USE_TESTNET=true at build time to enable Base Sepolia for staging
// and to test newly deployed contracts (e.g. ArenaCoinV2, ArenaStaking) before
// promoting them to mainnet.
import { createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'

const useTestnet = import.meta.env.VITE_USE_TESTNET === 'true'

export const supportedChains = useTestnet ? [base, baseSepolia] as const : [base] as const

export const config = createConfig({
  chains: supportedChains,
  transports: {
    [base.id]:        http(import.meta.env.VITE_BASE_RPC_URL          || undefined),
    [baseSepolia.id]: http(import.meta.env.VITE_BASE_SEPOLIA_RPC_URL  || undefined),
  },
})

// Default chain for the active build. Components should prefer reading
// `useChainId()` from wagmi at runtime instead of hard-coding this.
export const defaultChain = useTestnet ? baseSepolia : base

// Mocks for UI testing without full wallet connection
export const useMockAccount = () => {
  return {
    address: '0x1234567890abcdef1234567890abcdef12345678' as const,
    isConnected: true,
  }
}
