<div align="center">

<img src="artifacts/arena-protocol/public/brand/logo.png" alt="Arena Protocol" width="160" />

# ⚔️ ARENA PROTOCOL

**Cyberpunk GameFi on Base. Mint augmented fighters, battle in high-stakes arenas, climb the global rank, earn $ARENA.**

[![Base Mainnet](https://img.shields.io/badge/Network-Base%20Mainnet-0052FF?style=for-the-badge&logo=coinbase&logoColor=white)](https://basescan.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.25-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Audited](https://img.shields.io/badge/Self%20Audit-3%2F10%20Risk-green?style=for-the-badge)](AUDIT_ArenaCoin.md)

[![Node](https://img.shields.io/badge/node-24-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-monorepo-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Wagmi](https://img.shields.io/badge/Wagmi-2-1F1F1F?logo=ethereum&logoColor=white)](https://wagmi.sh/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.28-FFF100?logo=ethereum&logoColor=black)](https://hardhat.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-v5%20%7C%20v4.9-4E5EE4?logo=openzeppelin&logoColor=white)](https://openzeppelin.com/contracts)

<img src="artifacts/arena-protocol/public/brand/banner.png" alt="Arena Protocol Banner" width="100%" />

</div>

---

## Table of Contents

- [Overview](#overview)
- [Live Contracts](#live-contracts-base-mainnet)
- [Architecture](#architecture)
- [Repository Layout](#repository-layout)
- [Quick Start](#quick-start)
- [Frontend](#frontend)
- [Backend / Indexer](#backend--indexer)
- [Smart Contracts](#smart-contracts)
- [Database Schema](#database-schema)
- [NFT Collection](#nft-collection-arena-champions)
- [Audit & Security](#audit--security)
- [Testnet Workflow (Base Sepolia)](#testnet-workflow-base-sepolia)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Scripts Reference](#scripts-reference)
- [License](#license)

---

## Overview

Arena Protocol is a **fully on-chain combat game** with off-chain analytics. Players mint ERC-721 fighters with random stats, enter PvE/PvP battles backed by an ERC-20 reward economy, trade fighters on a 2 % fee marketplace, and stake $ARENA for daily rewards. The whole thing runs in a Telegram Mini App or a desktop browser via wagmi + RainbowKit.

The smart-contract layer is deployed and verified on **Base Mainnet**. A separate Express + WebSocket indexer reads on-chain events into PostgreSQL so the front-end can render leaderboards and battle history without RPC round-trips.

---

## Live Contracts (Base Mainnet)

> All addresses verified on Basescan with **solc 0.8.25, EVM `paris`, optimizer 200 runs, OpenZeppelin v4.9.6**.

| Contract           | Address                                                                                                                       | Verified |
|--------------------|-------------------------------------------------------------------------------------------------------------------------------|---------|
| `ArenaCoin`  (ARENA)| [`0x3b855F88…14b5`](https://basescan.org/address/0x3b855F88CB93aA642EaEB13F59987C552Fc614b5#code)                              | ✅      |
| `ArenaChampion`     | [`0x68f08b00…486A`](https://basescan.org/address/0x68f08b005b09B0F7D07E1c0B5CDe18E43CE2486A#code)                              | ✅      |
| `ArenaBattle`       | [`0xF6fc2B6a…71CF`](https://basescan.org/address/0xF6fc2B6a306B626548ca9dF25B31a22D0f8971CF#code)                              | ✅      |
| `ArenaPvP`          | [`0xd0C4Af12…7533`](https://basescan.org/address/0xd0C4Af12E95f9590e7314D079C58597771E57533#code)                              | ✅      |
| `ArenaMarketplace`  | [`0x67817157…698E`](https://basescan.org/address/0x67817157Dd6E5945ac2fAf1a822e7f1dE26C698E#code)                              | ✅      |

Pending (require ETH top-up): `ArenaStaking`, `ArenaRewardVault`, `ArenaLeaderboard`. A successor token `ArenaCoinV2` is also drafted in `contracts/` — see the audit for the rationale.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BASE MAINNET (8453)                         │
│                                                                     │
│   ArenaCoin   ArenaChampion   ArenaBattle   ArenaPvP   Marketplace  │
│      ▲              ▲              │            │           ▲       │
│      │              │              ▼            ▼           │       │
└──────┼──────────────┼──────────────┼────────────┼───────────┼───────┘
       │              │              │            │           │
       │   Events     │              │            │           │
       ▼              ▼              ▼            ▼           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  backend/indexer.js  — ethers.js WebSocket subscription              │
│            ↓ writes to PostgreSQL (Drizzle ORM)                      │
├─────────────────────────────────────────────────────────────────────┤
│  artifacts/api-server  (Express 5, REST, OpenAPI 3.1)                │
│            ↑ orval-generated React Query hooks                       │
├─────────────────────────────────────────────────────────────────────┤
│  artifacts/arena-protocol  (React 19 + Vite 7 + wagmi 2)             │
│            ↳ also runnable as a Telegram Mini App via @twa-dev/sdk   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Repository Layout

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/             # Express 5 REST API (TS)
│   ├── arena-protocol/         # React + Vite frontend
│   └── mockup-sandbox/         # Vite preview server for component variants
├── contracts/                  # Solidity sources (Hardhat)
│   ├── ArenaCoin.sol           # V1 ERC20 (already on-chain)
│   ├── ArenaCoinV2.sol         # V2: cap + permit + roles + burnable
│   ├── ArenaFighterNFT.sol
│   ├── ArenaBattle.sol
│   ├── ArenaStaking.sol
│   ├── ArenaRewardVault.sol
│   ├── ArenaMarketplace.sol
│   ├── ArenaLeaderboard.sol
│   └── deployed/ArenaCoin.sol  # Verified source for the live V1 token
├── backend/
│   ├── server.js               # Express + WebSocket relay
│   └── indexer.js              # ethers.js event indexer → Postgres
├── hardhat-scripts/
│   ├── deploy.js
│   ├── deploy-arena-coin-v2.js
│   ├── verify.js
│   ├── verify-arenacoin.js
│   ├── match-bytecode.js
│   ├── check-verified.js
│   └── inspect-bytecode.js
├── lib/
│   ├── api-spec/               # OpenAPI 3.1 spec + orval codegen config
│   ├── api-client-react/       # Generated React Query hooks
│   ├── api-zod/                # Generated Zod schemas
│   └── db/                     # Drizzle schema + DB client
├── scripts/
│   └── seed-marketplace.ts     # Insert 6 demo NFT listings
├── contracts.deployed.json     # Single source of truth for on-chain addresses
├── AUDIT.md                    # Audit of all 7 local contracts
├── AUDIT_ArenaCoin.md          # Focused audit of the live ArenaCoin V1
├── hardhat.config.js
├── pnpm-workspace.yaml
└── replit.md
```

---

## Quick Start

```bash
# 1. Install (root)
pnpm install

# 2. Configure env
cp .env.example .env
# fill in DATABASE_URL, ETHERSCAN_API_KEY (works for Basescan), and PRIVATE_KEY only if deploying

# 3. Push DB schema
pnpm --filter @workspace/db push

# 4. Seed the marketplace with the 6 Arena Champions
pnpm tsx scripts/seed-marketplace.ts

# 5. Run everything (3 separate terminals or use the configured workflows)
pnpm --filter @workspace/api-server     dev    # → http://localhost:5001
pnpm --filter @workspace/arena-protocol dev    # → http://localhost:5173
node backend/indexer.js                        # → on-chain event indexer
```

---

## Frontend

`artifacts/arena-protocol/` is a React 19 + Vite 7 SPA wired with **wagmi 2** + **viem** for chain reads/writes. Key pages:

| Route          | Purpose                                                         |
|----------------|-----------------------------------------------------------------|
| `/`            | Hero, live stats, marketing CTAs                                 |
| `/mint`        | Mint a fighter NFT (random stats + rarity)                       |
| `/arena`       | PvE & PvP battles — entry 10 ARENA, 18 ARENA reward, 2 ARENA burn|
| `/leaderboard` | Top players sorted by wins                                       |
| `/market`      | Fighter NFT marketplace (browse / buy / list / cancel)           |
| `/profile`     | Per-address stats + battle history                               |

### Tech

- React Query hooks auto-generated by **orval** from the OpenAPI spec — never write a fetcher by hand.
- Tailwind + shadcn/ui + framer-motion for the cyberpunk look.
- Telegram WebApp SDK initialised at boot — works seamlessly inside `@twa-dev`.
- Wagmi config in `src/lib/wagmi.ts` ships **mainnet-only** by default; set `VITE_USE_TESTNET=true` to add Base Sepolia for staging builds.

---

## Backend / Indexer

`backend/indexer.js` opens a WebSocket subscription to Base Mainnet, decodes `BattleResult`, `Listed`, `Sold`, `Cancelled`, and `Transfer` events, and writes them to PostgreSQL via Drizzle. The Express API in `artifacts/api-server/` then serves them as REST endpoints described in `lib/api-spec/openapi.yaml`:

| Method | Path                       | Description                       |
|-------:|----------------------------|-----------------------------------|
| `GET`  | `/api/healthz`             | Health check                      |
| `GET`  | `/api/leaderboard`         | Top players by wins               |
| `GET`  | `/api/players/:address`    | Single-player stats               |
| `GET`  | `/api/battles`             | Battle history (filter by player) |
| `POST` | `/api/battles`             | Record a battle                   |
| `GET`  | `/api/market/listings`     | Active marketplace listings       |

Every change to `openapi.yaml` regenerates both the Zod schemas (`@workspace/api-zod`) and the React Query hooks (`@workspace/api-client-react`) via `pnpm --filter @workspace/api-spec codegen`.

---

## Smart Contracts

Built with **Hardhat 2.28**, dual-compiled with `solc 0.8.24` + `0.8.25` (Cancun), tested via the verification scripts in `hardhat-scripts/`.

### Contract Map

| File                         | Role                                                             |
|------------------------------|------------------------------------------------------------------|
| `ArenaCoin.sol`              | V1 ERC20 — fixed supply, 1 M ARENA, currently live on Base       |
| `ArenaCoinV2.sol`            | V2 ERC20 — capped, mintable via `MINTER_ROLE`, permit, burnable  |
| `ArenaFighterNFT.sol`        | ERC721 fighter with strength / speed / intelligence / rarity     |
| `ArenaBattle.sol`            | PvE battle engine (10 entry / 18 reward / 2 burn)                |
| `ArenaStaking.sol`           | Stake ARENA, accrue 1 % daily (treasury-funded)                  |
| `ArenaRewardVault.sol`       | Reward pool for battles                                          |
| `ArenaMarketplace.sol`       | NFT trading, 2 % protocol fee                                    |
| `ArenaLeaderboard.sol`       | On-chain leaderboard write surface                               |

### Verifying a deployed contract

```bash
# Status check across all 5 deployed contracts
node hardhat-scripts/check-verified.js

# Brute-force compiler settings against on-chain bytecode (handy when you didn't deploy it yourself)
npx hardhat run hardhat-scripts/match-bytecode.js --network base
```

---

## Database Schema

Drizzle ORM, PostgreSQL. See `lib/db/src/schema/arena.ts`.

```text
players ─ address (pk), total_wins, total_battles, total_rewards, fighters, updated_at
battles ─ id (pk), player, fighter_id, win, reward, mode (PvE|PvP), tx_hash, timestamp
market_listings ─ token_id (pk), seller, price, rarity, strength, speed, intelligence,
                  wins, losses, active, listed_at
```

---

## NFT Collection (Arena Champions)

Six on-brand Champions live in `artifacts/arena-protocol/public/nfts/` with metadata in `public/nfts/metadata.json` (OpenSea-compatible, 2 % `seller_fee_basis_points`).

| #   | Slug             | Class    | Rarity     | STR / SPD / INT |
|-----|------------------|----------|------------|------------------|
| 1   | cyber-samurai    | Samurai  | Epic       | 78 / 92 / 71     |
| 2   | neon-brawler     | Brawler  | Common     | 88 / 64 / 42     |
| 3   | quantum-mage     | Mage     | Rare       | 38 / 71 / 96     |
| 4   | chrome-assassin  | Assassin | Epic       | 67 / 99 / 74     |
| 5   | void-titan       | Titan    | Legendary  | 100 / 38 / 62    |
| 6   | pulse-knight     | Knight   | Rare       | 84 / 70 / 76     |

Run `pnpm tsx scripts/seed-marketplace.ts` to insert them as marketplace listings; the front-end will render them via `src/lib/fighters.ts`.

---

## Audit & Security

| Document               | What it covers                                                |
|------------------------|---------------------------------------------------------------|
| `AUDIT.md`             | All 7 local contracts — 5 High, 6 Medium, 7+ Low. Risk **4/10** — **DO NOT** mainnet-launch the rest as-is. |
| `AUDIT_ArenaCoin.md`   | Focused audit of the live ArenaCoin V1. No code bugs. Two HIGH operational findings (treasury concentration & inflationary reward economy). Risk **3/10**. |

**Top action items:**
1. Move 970k ARENA from the deployer EOA into a Safe multisig (https://app.safe.global/).
2. Decide on the reward-pool funding model (treasury-funded fixed pool vs. `ArenaCoinV2` with `MINTER_ROLE`).
3. Test `ArenaStaking` / `ArenaRewardVault` end-to-end on **Base Sepolia** before any further mainnet deploy.

---

## Testnet Workflow (Base Sepolia)

`base-sepolia` (chainId **84532**) is configured in `hardhat.config.js`. Get free ETH from:

- https://www.alchemy.com/faucets/base-sepolia
- https://faucet.quicknode.com/base/sepolia

Deploy V2 to testnet:

```bash
ARENA_TREASURY_ADDRESS=0xYourMultisig \
  npx hardhat run hardhat-scripts/deploy-arena-coin-v2.js --network base-sepolia
```

Verify the same way you would on mainnet — the Etherscan v2 multichain endpoint is already wired. Set `VITE_USE_TESTNET=true` in `artifacts/arena-protocol/.env.local` to flip the front-end to staging.

---

## Deployment

The repo is set up for **Replit autoscale deployment**. Each artifact runs on its own port and is reverse-proxied behind a single domain. To publish:

1. Push the database schema in production: `pnpm --filter @workspace/db push`.
2. Set production env vars (especially `DATABASE_URL`, `ETHERSCAN_API_KEY`, RPC URLs).
3. Click **Publish** in the workspace; Replit handles TLS, health checks, and routing.

For the front-end alone you can also build a static bundle: `pnpm --filter @workspace/arena-protocol build` and serve `dist/` from any CDN. The contract layer is **already on-chain** and requires no further deployment.

---

## Environment Variables

| Variable                       | Required by              | Notes                                                     |
|--------------------------------|--------------------------|-----------------------------------------------------------|
| `DATABASE_URL`                 | api-server, indexer, seed| Postgres connection string                                |
| `ETHERSCAN_API_KEY`            | hardhat verify           | One key works for Base Mainnet & Base Sepolia (v2 API)    |
| `PRIVATE_KEY`                  | hardhat deploy           | Without `0x` prefix; only for deploys                     |
| `BASE_RPC_URL`                 | indexer                  | Defaults to `https://mainnet.base.org`                    |
| `BASE_SEPOLIA_RPC_URL`         | hardhat                  | Defaults to `https://sepolia.base.org`                    |
| `ARENA_TREASURY_ADDRESS`       | deploy V2                | Multisig (Safe). All initial supply + admin role goes here|
| `ARENA_INITIAL_SUPPLY`         | deploy V2                | Default `1000000`                                         |
| `ARENA_MAX_SUPPLY_CAP`         | deploy V2                | Default `100000000` (immutable after deploy)              |
| `ARENA_GRANT_MINTER_TO`        | deploy V2                | Comma-separated addresses to receive `MINTER_ROLE`        |
| `VITE_USE_TESTNET`             | frontend                 | `true` to enable Base Sepolia                             |
| `VITE_BASE_RPC_URL`            | frontend                 | Optional override                                         |
| `VITE_BASE_SEPOLIA_RPC_URL`    | frontend                 | Optional override                                         |
| `ARENA_*_ADDRESS`              | indexer / api            | Per-contract, with sensible mainnet defaults              |

A complete template lives in `.env.example`.

---

## Scripts Reference

| Command                                                                | Purpose                                       |
|------------------------------------------------------------------------|-----------------------------------------------|
| `pnpm install`                                                         | Install all workspace dependencies            |
| `pnpm run typecheck`                                                   | Project-wide TS typecheck (composite refs)    |
| `pnpm run build`                                                       | Typecheck, then build every package           |
| `pnpm --filter @workspace/api-spec codegen`                            | Regenerate Zod + React Query from OpenAPI     |
| `pnpm --filter @workspace/db push`                                     | Apply Drizzle schema to the configured DB     |
| `pnpm tsx scripts/seed-marketplace.ts`                                 | Seed the 6 Arena Champion marketplace listings|
| `npx hardhat compile`                                                  | Compile all Solidity sources                  |
| `npx hardhat run hardhat-scripts/deploy.js --network base-sepolia`     | Deploy the original 7-contract suite          |
| `npx hardhat run hardhat-scripts/deploy-arena-coin-v2.js --network base-sepolia` | Deploy ArenaCoinV2 to testnet       |
| `node hardhat-scripts/check-verified.js`                               | Check Basescan verification status            |

---

## License

MIT — see [LICENSE](LICENSE).
