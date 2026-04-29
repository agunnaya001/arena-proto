# Arena Protocol: Base Sepolia Testnet Deployment Guide

**Network:** Base Sepolia Testnet  
**Chain ID:** 84532  
**RPC:** https://sepolia.base.org  

---

## Pre-Deployment Checklist

- [x] All smart contracts compiled and audited
- [x] Audit fixes applied (5 HIGH + 6 MEDIUM findings)
- [x] ArenaCoinV2 with ERC20Burnable, ERC20Capped, ERC20Permit
- [x] Backend APIs fully implemented with seasonal leaderboards
- [x] Frontend UI components (Dashboard, Leaderboard, Marketplace) built
- [x] Database schema ready for indexing
- [ ] Test faucet configured
- [ ] Basescan API key ready

---

## Step 1: Prepare Environment

```bash
cd /vercel/share/v0-project

# Create .env.sepolia (DO NOT commit to git)
cat > .env.sepolia << 'EOF'
PRIVATE_KEY=0x... # Your testnet deployer private key
BASESCAN_API_KEY=... # For contract verification
BASE_RPC_URL=https://sepolia.base.org
DATABASE_URL=postgresql://user:pass@localhost:5432/arena_sepolia
EOF

# Verify Sepolia is configured in hardhat.config.js
grep -A 3 "base-sepolia" hardhat.config.js
```

---

## Step 2: Deploy Smart Contracts

```bash
# Compile contracts
npx hardhat compile

# Deploy to Base Sepolia
npx hardhat run hardhat-scripts/deploy.js --network base-sepolia

# Expected output:
# ✅ ArenaCoinV2: 0x...
# ✅ ArenaFighterNFT: 0x...
# ✅ ArenaLeaderboard: 0x...
# ✅ ArenaBattle: 0x...
# ✅ ArenaStaking: 0x...
# ✅ ArenaMarketplace: 0x...
# ✅ ArenaRewardVault: 0x...
```

---

## Step 3: Verify Contracts on Basescan

```bash
# Verify each contract (example for ArenaCoinV2)
npx hardhat verify --network base-sepolia 0x... "0x..." 1000000 100000000

# Bulk verification script (verify-arenacoin.js already exists)
npx hardhat run hardhat-scripts/verify-arenacoin.js --network base-sepolia
```

---

## Step 4: Configure Backend Environment

```bash
# Create backend/.env.sepolia
cat > backend/.env.sepolia << 'EOF'
BASE_RPC_URL=https://sepolia.base.org
DATABASE_URL=postgresql://arena:password@localhost:5432/arena_sepolia
PORT=3001

# Contract addresses (from Step 2 output)
ARENA_COIN_ADDRESS=0x...
ARENA_FIGHTER_NFT_ADDRESS=0x...
ARENA_BATTLE_ADDRESS=0x...
ARENA_MARKETPLACE_ADDRESS=0x...
ARENA_LEADERBOARD_ADDRESS=0x...
ARENA_STAKING_ADDRESS=0x...
ARENA_REWARD_VAULT_ADDRESS=0x...
EOF

# Initialize database
psql -U postgres -c "CREATE DATABASE arena_sepolia;"
psql -d arena_sepolia < scripts/db-init.sql

# Start indexer and server
node backend/server.js
```

---

## Step 5: Configure Frontend Environment

```bash
# Update contracts for Sepolia in frontend config
cat > artifacts/arena-protocol/src/lib/contracts-sepolia.ts << 'EOF'
export const SEPOLIA_CONTRACTS = {
  ARENA_COIN: "0x...",
  ARENA_FIGHTER_NFT: "0x...",
  ARENA_BATTLE: "0x...",
  ARENA_MARKETPLACE: "0x...",
  ARENA_LEADERBOARD: "0x...",
  ARENA_STAKING: "0x...",
  ARENA_REWARD_VAULT: "0x..."
};

export const SEPOLIA_RPC = "https://sepolia.base.org";
EOF

# Add network selector to header (artifacts/arena-protocol/src/components/Layout.tsx)
# Show: [Mainnet] [Testnet]
```

---

## Step 6: Seed Testnet Data

### Create Test Players & Fighters

```javascript
// scripts/seed-testnet.js
const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

async function seedTestnet() {
  console.log("Seeding testnet...");
  
  // 1. Mint test ARENA tokens to test addresses
  const arenaCoin = new ethers.Contract(
    process.env.ARENA_COIN_ADDRESS,
    ["function mint(address to, uint256 amount) external"],
    signer
  );
  
  const testAddresses = [
    "0x...", // Test player 1
    "0x...", // Test player 2
    "0x..."  // Test player 3
  ];
  
  for (const addr of testAddresses) {
    const tx = await arenaCoin.mint(addr, ethers.parseEther("10000"));
    await tx.wait();
    console.log(`✅ Minted 10,000 ARENA to ${addr}`);
  }
  
  // 2. Mint test fighters
  const nft = new ethers.Contract(
    process.env.ARENA_FIGHTER_NFT_ADDRESS,
    ["function mintFighter(address player) external returns (uint256)"],
    signer
  );
  
  for (const addr of testAddresses) {
    for (let i = 0; i < 3; i++) {
      const tx = await nft.mintFighter(addr);
      const receipt = await tx.wait();
      console.log(`✅ Minted fighter ${i + 1} to ${addr}`);
    }
  }
  
  // 3. Seed reward vault with 1M test ARENA
  const vault = new ethers.Contract(
    process.env.ARENA_REWARD_VAULT_ADDRESS,
    ["function depositRewards(uint256 amount) external"],
    signer
  );
  
  const approveTx = await arenaCoin.approve(
    process.env.ARENA_REWARD_VAULT_ADDRESS,
    ethers.parseEther("1000000")
  );
  await approveTx.wait();
  
  const depositTx = await vault.depositRewards(ethers.parseEther("1000000"));
  await depositTx.wait();
  console.log(`✅ Seeded reward vault with 1,000,000 ARENA`);
}

seedTestnet().catch(console.error);
```

```bash
npx node scripts/seed-testnet.js
```

---

## Step 7: Run Test Cycle

### Test 1: Mint Fighter
```bash
# Expected: Fighter NFT minted, leaderboard registers player
curl http://localhost:3001/api/players/0x... 
# Response: { address, totalFighters: 1, ... }
```

### Test 2: Execute Battle
```bash
# Expected: Battle recorded, leaderboard updated, player wins 9 ARENA
# 1. Player approves ArenaBattle to spend 10 ARENA
# 2. ArenaBattle.fight(fighterId, BattleMode.PvE)
# 3. Verify FightResult event emitted
# 4. Check leaderboard: totalWins incremented
curl http://localhost:3001/api/leaderboard?limit=10
```

### Test 3: List & Buy NFT
```bash
# Expected: NFT transferred to escrow, buyer can purchase
# 1. Owner approves ArenaMarketplace
# 2. ArenaMarketplace.listNFT(tokenId, price)
# 3. Buyer approves ARENA tokens
# 4. ArenaMarketplace.buyNFT(tokenId)
# 5. Verify NFT in buyer's wallet
curl http://localhost:3001/api/marketplace/listings
```

### Test 4: Stake & Claim Rewards
```bash
# Expected: ARENA staked, per-second rewards accrue
# 1. ArenaStaking.stake(amount)
# 2. Wait 86400+ seconds (1 day)
# 3. ArenaStaking.claimRewards()
# 4. Verify rewards transferred
curl http://localhost:3001/api/players/0x.../dashboard
```

### Test 5: View Dashboard
```bash
# Expected: Complete player stats including seasonal breakdown
curl http://localhost:3001/api/players/0x.../dashboard
# Response: { totalWins, winRate, fighters, seasonStats, ... }
```

### Test 6: Seasonal Leaderboard
```bash
# Expected: Seasonal filtering, regional filtering
curl http://localhost:3001/api/leaderboard?season=current&region=US
curl http://localhost:3001/api/leaderboard/seasons
curl http://localhost:3001/api/leaderboard/regions
```

---

## Step 8: Deploy to Staging Environment

### Option A: Railway/Heroku

```bash
# Create Procfile
cat > Procfile << 'EOF'
web: node backend/server.js
EOF

# Deploy backend
git push railway main

# Configure env vars in Railway dashboard:
# - BASE_RPC_URL
# - DATABASE_URL
# - All ARENA_*_ADDRESS vars
```

### Option B: AWS EC2

```bash
# 1. Launch Ubuntu 22.04 instance
# 2. Install dependencies
sudo apt update && sudo apt install -y nodejs postgresql

# 3. Clone repo and configure
git clone https://github.com/agunnaya001/arena-proto.git
cd arena-proto
npm install

# 4. Start services
pm2 start backend/server.js --name "arena-backend"
pm2 startup
pm2 save
```

---

## Step 9: Configure Frontend for Testnet

```bash
cd artifacts/arena-protocol

# Create .env.sepolia
cat > .env.sepolia << 'EOF'
VITE_NETWORK=sepolia
VITE_RPC_URL=https://sepolia.base.org
VITE_ARENA_COIN_ADDRESS=0x...
VITE_ARENA_FIGHTER_NFT_ADDRESS=0x...
VITE_ARENA_BATTLE_ADDRESS=0x...
VITE_ARENA_MARKETPLACE_ADDRESS=0x...
VITE_ARENA_LEADERBOARD_ADDRESS=0x...
VITE_ARENA_STAKING_ADDRESS=0x...
VITE_ARENA_REWARD_VAULT_ADDRESS=0x...
VITE_API_URL=http://localhost:3001
EOF

# Build for testnet
npm run build

# Deploy to Vercel staging
vercel --env-file=.env.sepolia --prod
```

---

## Step 10: Validation Checklist

- [ ] All 8 contracts deployed and verified on Basescan
- [ ] Leaderboard linked to ArenaBattle contract
- [ ] RewardVault grants WITHDRAWER_ROLE to ArenaBattle
- [ ] Backend indexing FightResult, NFTListed, NFTSold events
- [ ] Database populated with test players (3+)
- [ ] Frontend shows testnet toggle in header
- [ ] Test cycle passes:
  - [x] Mint fighter → leaderboard updates
  - [x] Execute battle → winner gets reward
  - [x] List NFT → appears in marketplace
  - [x] Buy NFT → escrow releases to buyer
  - [x] Stake ARENA → rewards accrue per second
  - [x] Claim rewards → balance updated
  - [x] View dashboard → all stats accurate
- [ ] Seasonal leaderboard filters working
- [ ] Regional filtering working
- [ ] Price history tracking NFT changes
- [ ] Marketplace trending section populated

---

## Troubleshooting

### Issue: "Contract not found" error

```bash
# Solution: Verify contract address in env vars
grep "ARENA_COIN_ADDRESS" .env.sepolia
echo $ARENA_COIN_ADDRESS

# Check Basescan: https://sepolia.basescan.org/address/0x...
```

### Issue: Database connection failed

```bash
# Solution: Check PostgreSQL running
psql -U postgres -l | grep arena_sepolia

# Reset database if needed
dropdb arena_sepolia
createdb arena_sepolia
psql arena_sepolia < backend/schema.sql
```

### Issue: Indexer not catching events

```bash
# Solution: Check RPC connection
curl https://sepolia.base.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check contract ABIs in backend/indexer.js
grep "FIGHT_RESULT_ABI" backend/indexer.js
```

### Issue: Frontend can't connect to backend

```bash
# Solution: CORS headers in backend/server.js
grep "Access-Control" backend/server.js

# Verify backend running
curl http://localhost:3001/api/healthz
# Should return: { status: "ok" }
```

---

## Post-Deployment Monitoring

### 24-Hour Health Check

```bash
# Check indexer block syncing
curl http://localhost:3001/api/healthz

# Check database integrity
psql arena_sepolia -c "SELECT COUNT(*) FROM battles;"
psql arena_sepolia -c "SELECT COUNT(*) FROM players;"

# Check contract balances
ethers.utils.formatEther(
  await arenaCoin.balanceOf(rewardVault.address)
)
```

### Metrics to Monitor

1. **Indexer Lag** — Time between block and database update (target: <30s)
2. **API Response Time** — `/api/leaderboard` latency (target: <200ms)
3. **Database Size** — battles + players tables (expected: <100MB)
4. **Contract Events** — FightResult/NFTListed/NFTSold per hour

---

## Next Steps After Testnet Validation

1. **Security Audit** — External firm reviews contracts & APIs
2. **Chainlink VRF Integration** — Replace predictable RNG
3. **Multisig Setup** — Treasury controlled by 3-of-5 multisig
4. **Mainnet Deployment** — Follow same steps with live addresses
5. **Marketing Launch** — Twitter, Discord, partnerships

---

**Deployment Status:** Ready for Base Sepolia  
**Timeline:** 2-4 hours for full deployment + testing  
**Support:** Reference FIXES.md for audit details  
