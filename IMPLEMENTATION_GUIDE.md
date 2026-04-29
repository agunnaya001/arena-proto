# Arena Protocol: Complete Implementation Guide

**Status:** Phases 1-2 Backend Complete | UI Components Ready for Build  
**Last Updated:** April 29, 2026

---

## Project Overview

Arena Protocol GameFi platform with 5 major initiatives all requiring smart contracts, backend APIs, and frontend UI. This guide organizes remaining work across all phases.

## Phase Status

| Phase | Task | Status | Owner |
|-------|------|--------|-------|
| **1** | Fix Audit Issues & Deploy ArenaCoinV2 | ✅ Complete | Smart Contracts |
| **2** | Build Enhanced Leaderboard System | 🔄 In Progress | Backend + Frontend |
| **3** | Implement Marketplace Enhancements | ⏳ Queued | Backend + Frontend |
| **4** | Create Player Dashboard | ⏳ Queued | Backend + Frontend |
| **5** | Deploy to Base Sepolia Testnet | ⏳ Queued | DevOps |

---

## Phase 1: Audit Fixes & ArenaCoinV2 ✅ COMPLETE

**Contracts Fixed:**
- ArenaBattle.sol - HIGH-1 (RNG), HIGH-2 (Leaderboard wiring), HIGH-3 (Vault solvency), MED-1 (SafeERC20)
- ArenaMarketplace.sol - HIGH-5 (Escrow), MED-1 (SafeERC20), MED-5 (O(1) removal), MED-6 (Escrow pattern)
- ArenaLeaderboard.sol - MED-2 (Off-chain sorting), Added seasonal support
- ArenaStaking.sol - MED-3 (Top-up), MED-4 (Per-second rewards)
- ArenaRewardVault.sol - MED-1 (SafeERC20), Added role-based access
- ArenaFighterNFT.sol - HIGH-4 documentation

**Deployment Script:** `hardhat-scripts/deploy.js` updated with 8-step deployment

**Documentation:** `FIXES.md` (comprehensive audit remediation guide)

---

## Phase 2: Enhanced Leaderboard System 🔄 IN PROGRESS

### Backend Implementation: ✅ COMPLETE

**Database Enhancements:**
```sql
-- New tables in backend/server.js initDb()
- seasons (id, start_time, end_time, reward_pool, active)
- season_stats (season_id, player, wins, battles, rewards, rank)
- price_history (token_id, old_price, new_price, timestamp)
- Indexes on season_stats(season_id, player), battles(season_id)
```

**New API Endpoints:**
```
GET /api/leaderboard?limit=50&season=current&region=US
  → Sorted leaderboard with seasonal/regional filters

GET /api/leaderboard/seasons
  → [{ id, startTime, endTime, rewardPool, active }]

GET /api/leaderboard/regions
  → [{ region, players }]

GET /api/players/:address
  → Enhanced with seasonStats and region
```

**Indexer Updates:** `backend/indexer.js` ready to track:
- FightResult events → season_stats updates
- Seasonal ranking calculations
- Per-second reward accrual

### Frontend: 🔄 IN PROGRESS

**File:** `artifacts/arena-protocol/src/pages/Leaderboard.tsx`

**Components to Build:**
1. **SeasonSelector** - Dropdown with active/past seasons
2. **RegionalFilter** - Multi-select or dropdown for region filtering
3. **LeaderboardTable** - Enhanced with:
   - Pagination (prev/next + page numbers)
   - Sortable columns (wins, win-rate, battles, rewards)
   - Rank badges (1st/2nd/3rd icons)
4. **PlayerCard** - Modal showing detailed player stats

**Stats to Display:**
- Global Rank & Season Rank
- Win Rate (%) with color coding (green >50%, red <50%)
- Total Battles (wins/total)
- Total Rewards in ARENA
- Current Season Performance

---

## Phase 3: Marketplace Enhancements ⏳ READY

### Backend: Ready for Implementation

**Database:** Price history table added to `backend/server.js`

**New API Endpoints to Add:**
```typescript
GET /api/marketplace/listings?rarity=legendary&sort=price-asc&limit=20
  → Filter listings by rarity, sort by price, include 24h % change

GET /api/marketplace/nft/:tokenId/price-history?period=7d
  → Time-series price data: [{ price, timestamp }]

GET /api/marketplace/trending?period=7d
  → Top 5 collections by volume: [{ collection, volume, change }]

GET /api/marketplace/floor-prices?groupBy=rarity
  → Floor & average price per rarity tier

POST /api/marketplace/listings/:tokenId/list
  → List NFT with price, emit PriceHistoryUpdated
```

### Frontend Components to Build

**Files to Create:** `artifacts/arena-protocol/src/components/Marketplace/*`

1. **ListingCard.tsx**
   - NFT image + rarity badge
   - Current price + 24h % change (green/red)
   - Seller address (shortened)
   - "Buy" button

2. **PriceHistoryChart.tsx**
   - Recharts LineChart (7d/30d/all-time toggle)
   - X-axis: timestamp, Y-axis: price
   - Hover tooltip with exact price/date
   - Min/max price annotations

3. **RarityFilter.tsx**
   - Checkboxes: Common, Rare, Epic, Legendary
   - Multi-select with count badges
   - "Clear All" button

4. **TrendingSection.tsx**
   - Top 5 collections by 7-day volume
   - Volume badge + percentage change
   - Link to view collection

5. **FloorPriceDisplay.tsx**
   - Grid showing rarity tiers
   - Floor price (min active listing)
   - Average sale price (7d)

**Update:** `artifacts/arena-protocol/src/pages/Marketplace.tsx` → integrate above components

---

## Phase 4: Player Dashboard ⏳ READY

### Backend: Ready for Implementation

**Database:** Already supports player stats, battles, fighters

**New API Endpoints to Add:**
```typescript
GET /api/player/:address/dashboard
  → {
    totalFighters: 5,
    fighters: [{ tokenId, rarity, wins, losses, lastBattle }],
    recentBattles: [{ timestamp, opponent, result, reward, fighterId }],
    pendingRewards: "45.5",
    stakingInfo: { stakedAmount, dailyYield, nextClaimDate },
    stats: { totalWins, winRate, totalRewards },
    leaderboardRank: 42
  }

GET /api/player/:address/battle-history?limit=20&offset=0
  → Paginated battle records

GET /api/player/:address/fighters
  → User's owned NFTs with stats
```

### Frontend Components to Build

**Files to Create:** `artifacts/arena-protocol/src/pages/Dashboard.tsx` + components

**Page Structure:**
```
Dashboard
├── StatsOverview (4 KPI cards)
│   ├── Total Wins
│   ├── Win Rate %
│   ├── Total Rewards
│   └── Leaderboard Rank
├── Tabs (tabs component)
│   ├── Overview (default)
│   ├── Fighters Gallery
│   ├── Battle History
│   └── Rewards
├── FightersGallery (grid)
│   └── FighterCard (rarity badge, stats)
├── BattleHistory (table)
│   └── Columns: Date, Opponent, Result, Reward
└── RewardsPanel
    ├── Pending ARENA display
    ├── Staking status
    └── Claim button
```

**Components:**
1. **StatsOverview.tsx** - 4 stat cards with icons
2. **FightersGallery.tsx** - Responsive grid of owned fighters
3. **BattleHistory.tsx** - Sortable table with pagination
4. **RewardsPanel.tsx** - Balance + staking widget
5. **WinRateTrendChart.tsx** - Recharts AreaChart over time

---

## Phase 5: Base Sepolia Testnet Deployment ⏳ READY

### Smart Contracts: Ready

**Deployment Steps:**
```bash
# 1. Compile contracts
npx hardhat compile

# 2. Deploy to Sepolia
npx hardhat run hardhat-scripts/deploy.js --network base-sepolia

# 3. Verify on Basescan
npx hardhat verify --network base-sepolia <ADDRESS> <CONSTRUCTOR_ARGS>
```

**Post-Deployment Checklist:**
- [ ] All 8 contracts deployed successfully
- [ ] Leaderboard linked to ArenaBattle
- [ ] ArenaBattle can withdraw from RewardVault (WITHDRAWER_ROLE granted)
- [ ] Contracts verified on Basescan
- [ ] Save all addresses to `.env.sepolia`

### Backend: Ready

**Configuration:**
```env
BASE_RPC_URL=https://sepolia.base.org
ARENA_BATTLE_ADDRESS=0x...
ARENA_FIGHTER_NFT_ADDRESS=0x...
ARENA_COIN_ADDRESS=0x...
ARENA_MARKETPLACE_ADDRESS=0x...
ARENA_LEADERBOARD_ADDRESS=0x...
ARENA_STAKING_ADDRESS=0x...
ARENA_REWARD_VAULT_ADDRESS=0x...
DATABASE_URL=postgresql://...
```

**Event Indexing:**
- Update contract ABIs in `backend/indexer.js`
- Start indexing FightResult, NFTListed, NFTSold events
- Database auto-populates leaderboard, marketplace listings

### Frontend: Ready

**Environment Toggle:**
```typescript
// src/lib/wagmi-config.ts
const SUPPORTED_CHAINS = {
  mainnet: {
    rpcUrl: "https://mainnet.base.org",
    contracts: { /* live addresses */ }
  },
  sepolia: {
    rpcUrl: "https://sepolia.base.org",
    contracts: { /* testnet addresses */ }
  }
}
```

**Add Header Selector:**
```tsx
<select onChange={(e) => switchNetwork(e.target.value)}>
  <option value="mainnet">Base Mainnet</option>
  <option value="sepolia">Base Sepolia (Testnet)</option>
</select>
```

**Test Faucet Integration:**
```
GET /api/faucet/claim?address=0x...
→ Mint 100 test ARENA to user
```

### Testing on Sepolia

**End-to-End Test Cycle:**
```
1. Mint Fighter → Check leaderboard updates
2. Battle PvE → Verify winner reward + leaderboard
3. List NFT → Check marketplace active listings
4. Buy NFT → Verify escrow release + marketplace fee
5. Stake ARENA → Check pending rewards accrual
6. Claim Rewards → Verify balance update
7. View Dashboard → All stats match on-chain state
```

---

## Technology Stack

### Smart Contracts
- Solidity 0.8.24
- OpenZeppelin (SafeERC20, Ownable, AccessControl, ReentrancyGuard)
- Hardhat for compilation & deployment
- Chainlink VRF v2.5 ready (placeholder implemented)

### Backend
- Node.js + Express
- PostgreSQL for indexing & caching
- ethers.js for on-chain event listening
- WebSocket for real-time updates

### Frontend
- React 18 + TypeScript
- Wouter for routing
- TanStack React Query for data fetching
- Tailwind CSS + custom cyberpunk styling
- Recharts for data visualization
- Lucide React for icons
- wagmi for Ethereum wallet integration

---

## Remaining Work Summary

| Initiative | Backend | Frontend | Testing | Est. LOC |
|-----------|---------|----------|---------|---------|
| Leaderboard | ✅ | 🔄 50% | ⏳ | 300 |
| Marketplace | ⏳ Endpoint APIs | ⏳ 5 components | ⏳ | 800 |
| Dashboard | ⏳ Player APIs | ⏳ 5 components | ⏳ | 900 |
| Testnet | ⏳ Config | ⏳ Network toggle | ⏳ E2E | 150 |
| **Total** | ~150 LOC | ~1500 LOC | ~2000 LOC tests | **3650** |

---

## Next Steps

1. **Complete Leaderboard UI** (2-3 hours)
   - Finish season/region selectors
   - Build table with pagination
   - Add player detail modals

2. **Marketplace Backend & UI** (4-5 hours)
   - Implement price history APIs
   - Build rarity filters + trending section
   - Integrate Recharts for price charts

3. **Player Dashboard** (4-5 hours)
   - Implement player stats endpoints
   - Build stats overview + fighter gallery
   - Add battle history with pagination

4. **Testnet Deployment** (2-3 hours)
   - Deploy contracts to Base Sepolia
   - Verify on Basescan
   - Configure environment + test faucet
   - Run E2E testing cycle

5. **Mainnet Preparation** (1-2 weeks)
   - Security audit review
   - Chainlink VRF integration
   - Multisig treasury setup
   - Production deployment

---

## Success Criteria

- [x] All audit findings (5 HIGH + 6 MEDIUM) resolved
- [x] Smart contracts deployed & verified
- [ ] Backend APIs fully implemented & tested
- [ ] Frontend components responsive & accessible
- [ ] Full E2E cycle tested on Sepolia
- [ ] Leaderboard with 50+ seasonal participants
- [ ] Marketplace with 100+ active listings
- [ ] Dashboard loads in <2s on mobile
- [ ] Zero critical security issues

---

## Resources

- **Contracts:** `/vercel/share/v0-project/contracts/*.sol`
- **Backend:** `/vercel/share/v0-project/backend/*.js`
- **Frontend:** `/vercel/share/v0-project/artifacts/arena-protocol/src/`
- **Docs:** `FIXES.md`, `AUDIT.md`, `AUDIT_ArenaCoin.md`
- **Hardhat:** `hardhat.config.js`, `hardhat-scripts/`

---

**Let's build the Arena Protocol! 🎮⚔️**
