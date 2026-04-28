// Single source of truth for on-chain Arena Protocol contracts on Base Mainnet.
// Mirrors `contracts.deployed.json` at the repo root. Keep in sync.

export const ARENA_NETWORK = {
  name: "Base Mainnet",
  chainId: 8453,
  rpcUrl: "https://mainnet.base.org",
  explorer: "https://basescan.org",
} as const;

export const ARENA_ADDRESSES = {
  ArenaToken:        (import.meta.env.VITE_ARENA_TOKEN_ADDRESS        ?? "0x3b855F88CB93aA642EaEB13F59987C552Fc614b5") as `0x${string}`,
  ArenaChampion:     (import.meta.env.VITE_ARENA_CHAMPION_ADDRESS     ?? "0x68f08b005b09B0F7D07E1c0B5CDe18E43CE2486A") as `0x${string}`,
  ArenaBattle:       (import.meta.env.VITE_ARENA_BATTLE_ADDRESS       ?? "0xF6fc2B6a306B626548ca9dF25B31a22D0f8971CF") as `0x${string}`,
  ArenaPVP:          (import.meta.env.VITE_ARENA_PVP_ADDRESS          ?? "0xd0C4Af12E95f9590e7314D079C58597771E57533") as `0x${string}`,
  ArenaMarketplace:  (import.meta.env.VITE_ARENA_MARKETPLACE_ADDRESS  ?? "0x67817157Dd6E5945ac2fAf1a822e7f1dE26C698E") as `0x${string}`,
  ArenaStaking:      (import.meta.env.VITE_ARENA_STAKING_ADDRESS      ?? null) as `0x${string}` | null,
  ArenaRewardVault:  (import.meta.env.VITE_ARENA_REWARD_VAULT_ADDRESS ?? null) as `0x${string}` | null,
  ArenaLeaderboard:  (import.meta.env.VITE_ARENA_LEADERBOARD_ADDRESS  ?? null) as `0x${string}` | null,
} as const;

export function explorerUrl(addressOrTx: string, kind: "address" | "tx" = "address") {
  return `${ARENA_NETWORK.explorer}/${kind}/${addressOrTx}`;
}

// ── Battle constants (mirror on-chain values from ArenaBattle.sol) ─────────
export const BATTLE_ENTRY_FEE_ARENA = 10n;     // 10 ARENA charged per fight
export const BATTLE_WIN_REWARD_ARENA = 18n;    // 18 ARENA paid to the winner
export const BATTLE_BURN_ARENA = 2n;           // 2 ARENA burned per fight
export const TOKEN_DECIMALS = 18;
export const ONE_ARENA = 10n ** BigInt(TOKEN_DECIMALS);

// ── ABIs ───────────────────────────────────────────────────────────────────

export const ARENA_TOKEN_ABI = [
  { type: "function", name: "name",        stateMutability: "view", inputs: [], outputs: [{ type: "string"  }] },
  { type: "function", name: "symbol",      stateMutability: "view", inputs: [], outputs: [{ type: "string"  }] },
  { type: "function", name: "decimals",    stateMutability: "view", inputs: [], outputs: [{ type: "uint8"   }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "balanceOf",   stateMutability: "view", inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowance",   stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve",     stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "transfer",    stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "event",    name: "Transfer",   inputs: [{ indexed: true, name: "from", type: "address" }, { indexed: true, name: "to", type: "address" }, { indexed: false, name: "value", type: "uint256" }] },
] as const;

export const ARENA_CHAMPION_ABI = [
  { type: "function", name: "name",         stateMutability: "view", inputs: [], outputs: [{ type: "string"  }] },
  { type: "function", name: "symbol",       stateMutability: "view", inputs: [], outputs: [{ type: "string"  }] },
  { type: "function", name: "totalSupply",  stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "balanceOf",    stateMutability: "view", inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "ownerOf",      stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "address" }] },
  { type: "function", name: "tokenOfOwnerByIndex", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "index", type: "uint256" }], outputs: [{ type: "uint256" }] },
  // Mint: open or onlyOwner depending on deployment. The wallet will surface a
  // permission error if the connected address is not authorised.
  { type: "function", name: "mintFighter",  stateMutability: "nonpayable", inputs: [{ name: "player", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "getFighter",   stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{
      type: "tuple", components: [
        { name: "strength",     type: "uint256" },
        { name: "speed",        type: "uint256" },
        { name: "intelligence", type: "uint256" },
        { name: "rarity",       type: "uint8"   },
        { name: "wins",         type: "uint256" },
        { name: "losses",       type: "uint256" },
      ]
  }] },
  { type: "function", name: "approve",      stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "tokenId", type: "uint256" }], outputs: [] },
  { type: "function", name: "isApprovedForAll", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "operator", type: "address" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "setApprovalForAll", stateMutability: "nonpayable", inputs: [{ name: "operator", type: "address" }, { name: "approved", type: "bool" }], outputs: [] },
  { type: "event",    name: "Transfer",   inputs: [{ indexed: true, name: "from", type: "address" }, { indexed: true, name: "to", type: "address" }, { indexed: true, name: "tokenId", type: "uint256" }] },
] as const;

export const ARENA_BATTLE_ABI = [
  { type: "function", name: "fight", stateMutability: "nonpayable", inputs: [
    { name: "fighterId", type: "uint256" },
    { name: "mode",      type: "uint8"   }, // 0 = PvE, 1 = PvP (matches enum order in ArenaBattle.sol)
  ], outputs: [] },
  { type: "event", name: "BattleResult", inputs: [
    { indexed: true,  name: "player",    type: "address" },
    { indexed: true,  name: "fighterId", type: "uint256" },
    { indexed: false, name: "win",       type: "bool"    },
    { indexed: false, name: "reward",    type: "uint256" },
  ] },
] as const;

export const ARENA_MARKETPLACE_ABI = [
  { type: "function", name: "listNFT",          stateMutability: "nonpayable", inputs: [{ name: "tokenId", type: "uint256" }, { name: "price", type: "uint256" }], outputs: [] },
  { type: "function", name: "buyNFT",           stateMutability: "nonpayable", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [] },
  { type: "function", name: "cancelListing",    stateMutability: "nonpayable", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [] },
  { type: "function", name: "getActiveListings", stateMutability: "view", inputs: [], outputs: [{ type: "uint256[]" }] },
  { type: "event", name: "Listed",    inputs: [{ indexed: true, name: "tokenId", type: "uint256" }, { indexed: true, name: "seller", type: "address" }, { indexed: false, name: "price", type: "uint256" }] },
  { type: "event", name: "Sold",      inputs: [{ indexed: true, name: "tokenId", type: "uint256" }, { indexed: true, name: "buyer",  type: "address" }, { indexed: false, name: "price", type: "uint256" }] },
  { type: "event", name: "Cancelled", inputs: [{ indexed: true, name: "tokenId", type: "uint256" }, { indexed: true, name: "seller", type: "address" }] },
] as const;
