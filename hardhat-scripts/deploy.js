const { ethers } = require("hardhat");

// Absolute minimum fees — near-zero priority tip for Base L2
const GAS_OPTS = {
  maxPriorityFeePerGas: ethers.parseUnits("0.001", "gwei"),
};

async function deploy(factory, args, label) {
  const contract = await factory.deploy(...args, GAS_OPTS);
  await contract.waitForDeployment();
  const addr = await contract.getAddress();
  console.log(`  ✅ ${label}: ${addr}`);
  return { contract, addr };
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Deployer:", deployer.address);
  console.log("Balance: ", ethers.formatEther(balance), "ETH\n");

  // ── 1. ArenaCoin ──────────────────────────────────────────────────────────
  let arenaCoinAddress = process.env.ARENA_COIN_ADDRESS;
  let arenaCoin;
  if (arenaCoinAddress) {
    console.log("[1/7] ArenaCoin already deployed:", arenaCoinAddress);
    arenaCoin = await ethers.getContractAt("ArenaCoin", arenaCoinAddress);
  } else {
    console.log("[1/7] Deploying ArenaCoin...");
    const F = await ethers.getContractFactory("ArenaCoin");
    ({ contract: arenaCoin, addr: arenaCoinAddress } = await deploy(F, [deployer.address], "ArenaCoin"));
  }

  // ── 2. ArenaFighterNFT ────────────────────────────────────────────────────
  let arenaFighterNFTAddress = process.env.ARENA_FIGHTER_NFT_ADDRESS;
  let arenaFighterNFT;
  if (arenaFighterNFTAddress) {
    console.log("[2/7] ArenaFighterNFT already deployed:", arenaFighterNFTAddress);
    arenaFighterNFT = await ethers.getContractAt("ArenaFighterNFT", arenaFighterNFTAddress);
  } else {
    console.log("[2/7] Deploying ArenaFighterNFT...");
    const F = await ethers.getContractFactory("ArenaFighterNFT");
    ({ contract: arenaFighterNFT, addr: arenaFighterNFTAddress } = await deploy(F, [deployer.address], "ArenaFighterNFT"));
  }

  // ── 3. ArenaRewardVault ───────────────────────────────────────────────────
  let arenaRewardVaultAddress = process.env.ARENA_REWARD_VAULT_ADDRESS;
  let arenaRewardVault;
  if (arenaRewardVaultAddress) {
    console.log("[3/7] ArenaRewardVault already deployed:", arenaRewardVaultAddress);
    arenaRewardVault = await ethers.getContractAt("ArenaRewardVault", arenaRewardVaultAddress);
  } else {
    console.log("[3/7] Deploying ArenaRewardVault...");
    const F = await ethers.getContractFactory("ArenaRewardVault");
    ({ contract: arenaRewardVault, addr: arenaRewardVaultAddress } = await deploy(F, [deployer.address, arenaCoinAddress], "ArenaRewardVault"));
  }

  // ── 4. ArenaLeaderboard (deploy before ArenaBattle) ────────────────────────
  let arenaLeaderboardAddress = process.env.ARENA_LEADERBOARD_ADDRESS;
  let arenaLeaderboard;
  if (arenaLeaderboardAddress) {
    console.log("[4/8] ArenaLeaderboard already deployed:", arenaLeaderboardAddress);
    arenaLeaderboard = await ethers.getContractAt("ArenaLeaderboard", arenaLeaderboardAddress);
  } else {
    console.log("[4/8] Deploying ArenaLeaderboard...");
    const F = await ethers.getContractFactory("ArenaLeaderboard");
    ({ contract: arenaLeaderboard, addr: arenaLeaderboardAddress } = await deploy(F, [deployer.address], "ArenaLeaderboard"));
  }

  // ── 5. ArenaBattle ───────────────────────────────────────────────────────
  let arenaBattleAddress = process.env.ARENA_BATTLE_ADDRESS;
  let arenaBattle;
  if (arenaBattleAddress) {
    console.log("[5/8] ArenaBattle already deployed:", arenaBattleAddress);
    arenaBattle = await ethers.getContractAt("ArenaBattle", arenaBattleAddress);
  } else {
    console.log("[5/8] Deploying ArenaBattle...");
    const F = await ethers.getContractFactory("ArenaBattle");
    ({ contract: arenaBattle, addr: arenaBattleAddress } = await deploy(F, [deployer.address, arenaCoinAddress, arenaFighterNFTAddress, arenaRewardVaultAddress, arenaLeaderboardAddress], "ArenaBattle"));
  }

  // ── 6. ArenaStaking ───────────────────────────────────────────────────────
  let arenaStakingAddress = process.env.ARENA_STAKING_ADDRESS;
  let arenaStaking;
  if (arenaStakingAddress) {
    console.log("[6/8] ArenaStaking already deployed:", arenaStakingAddress);
    arenaStaking = await ethers.getContractAt("ArenaStaking", arenaStakingAddress);
  } else {
    console.log("[6/8] Deploying ArenaStaking...");
    const F = await ethers.getContractFactory("ArenaStaking");
    ({ contract: arenaStaking, addr: arenaStakingAddress } = await deploy(F, [deployer.address, arenaCoinAddress], "ArenaStaking"));
  }

  // ── 7. ArenaMarketplace ───────────────────────────────────────────────────
  let arenaMarketplaceAddress = process.env.ARENA_MARKETPLACE_ADDRESS;
  let arenaMarketplace;
  if (arenaMarketplaceAddress) {
    console.log("[7/8] ArenaMarketplace already deployed:", arenaMarketplaceAddress);
    arenaMarketplace = await ethers.getContractAt("ArenaMarketplace", arenaMarketplaceAddress);
  } else {
    console.log("[7/8] Deploying ArenaMarketplace...");
    const F = await ethers.getContractFactory("ArenaMarketplace");
    ({ contract: arenaMarketplace, addr: arenaMarketplaceAddress } = await deploy(F, [deployer.address, arenaCoinAddress, arenaFighterNFTAddress], "ArenaMarketplace"));
  }

  // ── 8. Grant ArenaRewardVault access to ArenaBattle ────────────────────────
  console.log("[8/8] Granting ArenaBattle WITHDRAWER_ROLE on RewardVault...");
  try {
    const WITHDRAWER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("WITHDRAWER_ROLE"));
    const tx = await arenaRewardVault.grantRole(WITHDRAWER_ROLE, arenaBattleAddress, GAS_OPTS);
    await tx.wait();
    console.log("  ✅ Done");
  } catch (err) {
    console.log("  ⚠️ Could not grant role (may already exist):", err.message);
  }

  // ── Post-deployment setup ─────────────────────────────────────────────────
  console.log("\n[Setup] Linking Leaderboard → BattleContract...");
  try {
    const tx = await arenaLeaderboard.setBattleContract(arenaBattleAddress, GAS_OPTS);
    await tx.wait();
    console.log("  ✅ Done");
  } catch (err) {
    console.log("  ⚠️ Could not link (may already be set):", err.message);
  }

  const finalBalance = await deployer.provider.getBalance(deployer.address);
  console.log("\n========================================");
  console.log("  ARENA PROTOCOL — ALL CONTRACTS LIVE");
  console.log("========================================");
  console.log("ArenaCoin:        ", arenaCoinAddress);
  console.log("ArenaFighterNFT:  ", arenaFighterNFTAddress);
  console.log("ArenaRewardVault: ", arenaRewardVaultAddress);
  console.log("ArenaLeaderboard: ", arenaLeaderboardAddress);
  console.log("ArenaBattle:      ", arenaBattleAddress);
  console.log("ArenaStaking:     ", arenaStakingAddress);
  console.log("ArenaMarketplace: ", arenaMarketplaceAddress);
  console.log("========================================");
  console.log("Remaining balance:", ethers.formatEther(finalBalance), "ETH");
  console.log("\n--- Env vars to save ---");
  console.log(`ARENA_COIN_ADDRESS=${arenaCoinAddress}`);
  console.log(`ARENA_FIGHTER_NFT_ADDRESS=${arenaFighterNFTAddress}`);
  console.log(`ARENA_REWARD_VAULT_ADDRESS=${arenaRewardVaultAddress}`);
  console.log(`ARENA_BATTLE_ADDRESS=${arenaBattleAddress}`);
  console.log(`ARENA_STAKING_ADDRESS=${arenaStakingAddress}`);
  console.log(`ARENA_MARKETPLACE_ADDRESS=${arenaMarketplaceAddress}`);
  console.log(`ARENA_LEADERBOARD_ADDRESS=${arenaLeaderboardAddress}`);
  console.log(`DEPLOYER_ADDRESS=${deployer.address}`);
  console.log(`VITE_ARENA_COIN_ADDRESS=${arenaCoinAddress}`);
  console.log(`VITE_ARENA_FIGHTER_NFT_ADDRESS=${arenaFighterNFTAddress}`);
  console.log(`VITE_ARENA_REWARD_VAULT_ADDRESS=${arenaRewardVaultAddress}`);
  console.log(`VITE_ARENA_BATTLE_ADDRESS=${arenaBattleAddress}`);
  console.log(`VITE_ARENA_STAKING_ADDRESS=${arenaStakingAddress}`);
  console.log(`VITE_ARENA_MARKETPLACE_ADDRESS=${arenaMarketplaceAddress}`);
  console.log(`VITE_ARENA_LEADERBOARD_ADDRESS=${arenaLeaderboardAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1); });
