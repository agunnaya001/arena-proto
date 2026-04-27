/**
 * Deploy ArenaCoinV2 to either Base Sepolia (testnet) or Base Mainnet.
 *
 * Usage:
 *   npx hardhat run hardhat-scripts/deploy-arena-coin-v2.js --network base-sepolia
 *   npx hardhat run hardhat-scripts/deploy-arena-coin-v2.js --network base
 *
 * Required env:
 *   PRIVATE_KEY               — deployer (only pays gas; receives no tokens)
 *   ARENA_TREASURY_ADDRESS    — multisig to receive supply + DEFAULT_ADMIN_ROLE
 *
 * Optional env:
 *   ARENA_INITIAL_SUPPLY      — whole tokens to mint at deploy (default 1_000_000)
 *   ARENA_MAX_SUPPLY_CAP      — absolute cap, whole tokens     (default 100_000_000)
 *   ARENA_GRANT_MINTER_TO     — comma-separated addresses to also receive MINTER_ROLE
 *                               (e.g. battle, staking, reward-vault contracts)
 */
const hre = require("hardhat");
const fs  = require("fs");
const path = require("path");

const DEFAULT_INITIAL = 1_000_000n;
const DEFAULT_CAP     = 100_000_000n;

async function main() {
  const net = hre.network.name;
  const treasury = process.env.ARENA_TREASURY_ADDRESS;
  if (!treasury || !/^0x[0-9a-fA-F]{40}$/.test(treasury)) {
    throw new Error("ARENA_TREASURY_ADDRESS must be a valid 0x address (multisig recommended)");
  }

  const initial = BigInt(process.env.ARENA_INITIAL_SUPPLY || DEFAULT_INITIAL);
  const cap     = BigInt(process.env.ARENA_MAX_SUPPLY_CAP  || DEFAULT_CAP);
  if (initial > cap) throw new Error(`initial supply (${initial}) > cap (${cap})`);

  const minterGrants = (process.env.ARENA_GRANT_MINTER_TO || "")
    .split(",").map(s => s.trim()).filter(Boolean);

  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Network:  ${net}`);
  console.log(`Deployer: ${deployer.address}  (balance: ${hre.ethers.formatEther(balance)} ETH)`);
  console.log(`Treasury: ${treasury}`);
  console.log(`Initial:  ${initial.toLocaleString()} ARENA`);
  console.log(`Cap:      ${cap.toLocaleString()} ARENA`);
  console.log(`Minters:  ${minterGrants.length ? minterGrants.join(", ") : "(treasury only)"}`);

  if (net === "base" && balance < hre.ethers.parseEther("0.0005")) {
    console.warn("⚠️  Mainnet deployer balance is low; top up before continuing.");
  }

  const ArenaCoinV2 = await hre.ethers.getContractFactory("ArenaCoinV2");
  const token = await ArenaCoinV2.deploy(treasury, initial, cap);
  await token.waitForDeployment();

  const addr = await token.getAddress();
  console.log(`\n✅ ArenaCoinV2 deployed at ${addr}`);
  console.log(`   tx: ${token.deploymentTransaction()?.hash}`);

  // Optionally grant MINTER_ROLE to additional contracts. The deployer can do
  // this only if it also holds DEFAULT_ADMIN_ROLE — by default that role goes
  // to the treasury, NOT the deployer, so this section will fail unless the
  // treasury is the same as the deployer (testnet only).
  if (minterGrants.length) {
    console.log("\nAttempting to grant MINTER_ROLE...");
    const MINTER_ROLE = await token.MINTER_ROLE();
    for (const m of minterGrants) {
      try {
        const tx = await token.grantRole(MINTER_ROLE, m);
        await tx.wait();
        console.log(`   ✓ granted MINTER_ROLE to ${m}`);
      } catch (e) {
        console.log(`   ✗ could not grant to ${m} (deployer probably isn't admin) — `
                    + `have the treasury multisig call grantRole instead.`);
        break;
      }
    }
  }

  // Persist deployment record alongside the existing contracts.deployed.json
  const recordPath = path.resolve(__dirname, "..", "contracts.deployed.json");
  let record = {};
  if (fs.existsSync(recordPath)) {
    try { record = JSON.parse(fs.readFileSync(recordPath, "utf8")); } catch {}
  }
  record.networks = record.networks || {};
  const netKey = net === "base" ? "base-mainnet" : net;
  record.networks[netKey] = record.networks[netKey] || {};
  record.networks[netKey].ArenaCoinV2 = {
    address:      addr,
    treasury,
    initialSupply: initial.toString(),
    cap:          cap.toString(),
    deployer:     deployer.address,
    deployedAt:   new Date().toISOString(),
    txHash:       token.deploymentTransaction()?.hash,
  };
  fs.writeFileSync(recordPath, JSON.stringify(record, null, 2));
  console.log(`\nWrote deployment record → ${recordPath}`);

  console.log("\nNext steps:");
  console.log(`  1. Verify on the explorer:`);
  console.log(`     npx hardhat verify --network ${net} ${addr} \\`);
  console.log(`       ${treasury} ${initial} ${cap}`);
  if (minterGrants.length) {
    console.log(`  2. From the treasury multisig, grant MINTER_ROLE to:`);
    minterGrants.forEach(m => console.log(`       - ${m}`));
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
