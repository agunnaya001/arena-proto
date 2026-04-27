# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── arena-protocol/     # Arena Protocol frontend (React + Vite)
├── contracts/              # Solidity smart contracts (Hardhat)
│   ├── ArenaCoin.sol       # ERC20 token V1 (local; deployed equivalent is "ArenaToken")
│   ├── ArenaCoinV2.sol     # ERC20 V2: cap + roles + permit + burnable (audit-driven successor)
│   ├── ArenaFighterNFT.sol # ERC721 fighters (local; deployed equivalent is "ArenaChampion")
│   ├── ArenaBattle.sol     # Battle engine
│   ├── ArenaStaking.sol    # Staking (NOT deployed)
│   ├── ArenaRewardVault.sol# Reward pool (NOT deployed)
│   ├── ArenaMarketplace.sol# NFT marketplace
│   └── ArenaLeaderboard.sol# On-chain leaderboard (NOT deployed)
├── contracts.deployed.json # On-chain addresses for deployed Arena contracts (Base Mainnet)
├── AUDIT.md                # Comprehensive security audit of all 7 local contracts
├── scripts/                # Deploy + verify Hardhat scripts
│   ├── deploy.js
│   └── verify.js
├── backend/                # Standalone Node.js backend (event indexer)
│   ├── server.js           # Express + WebSocket server
│   └── indexer.js          # Ethers.js on-chain event indexer
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── hardhat.config.js       # Hardhat config (Base Mainnet, Solidity 0.8.21)
├── arena-package.json      # Package.json for Hardhat project (rename to use)
├── .env.example            # Environment variable template
├── README.md               # Full project documentation
├── pnpm-workspace.yaml     # pnpm workspace config
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package
```

## Arena Protocol

### Smart Contracts (Base Mainnet, chainId 8453)

| Contract | Description |
|---|---|
| ArenaCoin (ARENA) | ERC20 token, 1M supply, mintable/burnable |
| ArenaFighterNFT (AFIGHT) | ERC721 with strength/speed/intelligence/rarity |
| ArenaBattle | Battle engine: 10 ARENA entry, 18 ARENA reward, 2 ARENA burn |
| ArenaStaking | Stake ARENA, 1% daily rewards |
| ArenaRewardVault | Reward pool for battles |
| ArenaMarketplace | NFT trading with 2% fee |
| ArenaLeaderboard | On-chain player stats |

### Deployed Contracts on Base Mainnet (all verified on Basescan)

User deployed 5 contracts (NOT from this codebase — different ABI; e.g. `arenaToken()` getter, NFT named `ArenaChampion/CHAMP`). All verified with: solc **0.8.25**, EVM **paris**, optimizer **enabled / 200 runs**, OpenZeppelin **v4.9.6**.

| Local label | Deployed name | Address |
|---|---|---|
| ArenaToken | `ArenaCoin` | `0x3b855F88CB93aA642EaEB13F59987C552Fc614b5` |
| ArenaChampion | `ArenaChampion` | `0x68f08b005b09B0F7D07E1c0B5CDe18E43CE2486A` |
| ArenaBattle | `ArenaBattle` | `0xF6fc2B6a306B626548ca9dF25B31a22D0f8971CF` |
| ArenaPVP | `ArenaPvP` | `0xd0C4Af12E95f9590e7314D079C58597771E57533` |
| ArenaMarketplace | `ArenaMarketplace` | `0x67817157Dd6E5945ac2fAf1a822e7f1dE26C698E` |

Verification helper scripts: `hardhat-scripts/match-bytecode.js` (brute-forces compiler settings), `hardhat-scripts/verify-arenacoin.js` (Etherscan v2 standard-JSON submitter), `hardhat-scripts/check-verified.js` (status checker). OZ v4.9.6 sources used for verification live in `.verify-deps/node_modules/`.

### Audit & Successor Token

- `AUDIT_ArenaCoin.md` — focused audit of the deployed ArenaCoin V1. Overall risk **3/10 (Low)**; no code bugs. Two HIGH findings: 97 % of supply in a single EOA (move to Safe multisig), and the reward economy is structurally impossible against a fixed supply (need treasury-funded pools or V2 with mintable role).
- `contracts/ArenaCoinV2.sol` — successor token addressing the audit. Adds `ERC20Capped` (default 100M cap), `ERC20Burnable`, `ERC20Permit` (EIP-2612 gasless approvals), and `AccessControl` with `MINTER_ROLE` granted to battle/staking/vault contracts. `DEFAULT_ADMIN_ROLE` and initial supply both go to a treasury multisig at deploy — never an EOA.
- Deploy: `npx hardhat run hardhat-scripts/deploy-arena-coin-v2.js --network base-sepolia` (or `--network base`). Required env: `ARENA_TREASURY_ADDRESS`. Optional: `ARENA_INITIAL_SUPPLY`, `ARENA_MAX_SUPPLY_CAP`, `ARENA_GRANT_MINTER_TO`.

### Base Sepolia (testnet) wiring

- Hardhat: `--network base-sepolia` (chainId 84532, RPC `https://sepolia.base.org`). Verification uses the same Etherscan v2 multichain key.
- Faucets: https://www.alchemy.com/faucets/base-sepolia or https://faucet.quicknode.com/base/sepolia.
- Frontend: set `VITE_USE_TESTNET=true` (and optionally `VITE_BASE_SEPOLIA_RPC_URL`) in `artifacts/arena-protocol/.env.local` for staging builds. Production (default, no flag) stays mainnet-only.

### Frontend Screens (React + Vite + Wagmi + RainbowKit)

- **Home** — Hero banner, stats, navigation CTAs
- **Mint Fighter** — Mint NFT fighters with randomized stats + rarity
- **Battle Arena** — PvE/PvP battles, entry fee 10 ARENA, 18 ARENA reward on win
- **Leaderboard** — Top players by wins
- **Marketplace** — List/buy/cancel fighter NFTs
- **Profile** — Player stats + battle history

### Telegram Mini App

- Integrates Telegram WebApp SDK (`@twa-dev/sdk`)
- Auto-initializes on load
- Supports Telegram theme colors

## Contract Env Variables (after deployment)

```
VITE_ARENA_COIN_ADDRESS=
VITE_ARENA_FIGHTER_NFT_ADDRESS=
VITE_ARENA_REWARD_VAULT_ADDRESS=
VITE_ARENA_BATTLE_ADDRESS=
VITE_ARENA_STAKING_ADDRESS=
VITE_ARENA_MARKETPLACE_ADDRESS=
VITE_ARENA_LEADERBOARD_ADDRESS=
```

## Database Schema

- `players` — address, total_wins, total_battles, total_rewards, fighters
- `battles` — id, player, fighter_id, win, reward, mode, tx_hash, timestamp
- `market_listings` — token_id, seller, price, rarity, stats, active, listed_at

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/arena-protocol` (`@workspace/arena-protocol`)

React + Vite frontend for Arena Protocol. Uses Wagmi, framer-motion, Telegram WebApp SDK.

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes: health, leaderboard, player stats, battle history, marketplace.

### `lib/db` (`@workspace/db`)

Database layer with tables: players, battles, market_listings.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec for Arena Protocol endpoints.

### `lib/api-zod` / `lib/api-client-react`

Generated Zod schemas and React Query hooks from OpenAPI spec.

## Brand & NFT Assets

Logo, banner, and the 6 Arena Champion fighter NFTs live in
`artifacts/arena-protocol/public/brand/` and `public/nfts/`. Originals are
kept in `attached_assets/generated_images/`. The OpenSea-compatible
collection metadata is in `public/nfts/metadata.json` and the front-end
catalogue is `src/lib/fighters.ts` (single source of truth — used by the
marketplace card image resolver). Logo is wired as the favicon and OG
image in `index.html`.

To re-seed the marketplace listings:

```bash
pnpm --filter @workspace/api-server exec tsx ../../scripts/seed-marketplace.ts
```
