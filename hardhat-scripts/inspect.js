const { ethers } = require("hardhat");

const ADDRS = {
  ArenaMarketplace: "0x67817157Dd6E5945ac2fAf1a822e7f1dE26C698E",
  ArenaToken:       "0x3b855F88CB93aA642EaEB13F59987C552Fc614b5",
  ArenaChampion:    "0x68f08b005b09B0F7D07E1c0B5CDe18E43CE2486A",
  ArenaBattle:      "0xF6fc2B6a306B626548ca9dF25B31a22D0f8971CF",
  ArenaPVP:         "0xd0C4Af12E95f9590e7314D079C58597771E57533",
};

async function main() {
  const [signer] = await ethers.getSigners();
  const provider = signer.provider;
  const bal = await provider.getBalance(signer.address);
  console.log("Wallet:", signer.address);
  console.log("ETH:   ", ethers.formatEther(bal), "ETH\n");

  for (const [name, addr] of Object.entries(ADDRS)) {
    const code = await provider.getCode(addr);
    console.log(`${name.padEnd(18)} ${addr}  bytecode: ${(code.length-2)/2} bytes`);
  }

  // Try ERC20 detection on ArenaToken
  console.log("\n--- ArenaToken probe ---");
  try {
    const erc20 = new ethers.Contract(ADDRS.ArenaToken, [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function totalSupply() view returns (uint256)",
      "function owner() view returns (address)",
    ], provider);
    console.log("name:        ", await erc20.name().catch(e=>e.message));
    console.log("symbol:      ", await erc20.symbol().catch(e=>e.message));
    console.log("decimals:    ", await erc20.decimals().then(d=>d.toString()).catch(e=>e.message));
    console.log("totalSupply: ", await erc20.totalSupply().then(d=>ethers.formatEther(d)).catch(e=>e.message));
    console.log("owner:       ", await erc20.owner().catch(e=>e.message));
  } catch (e) { console.log("err:", e.message); }

  console.log("\n--- ArenaChampion probe ---");
  try {
    const c = new ethers.Contract(ADDRS.ArenaChampion, [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function totalSupply() view returns (uint256)",
      "function owner() view returns (address)",
    ], provider);
    console.log("name:        ", await c.name().catch(e=>e.message));
    console.log("symbol:      ", await c.symbol().catch(e=>e.message));
    console.log("totalSupply: ", await c.totalSupply().then(d=>d.toString()).catch(e=>e.message));
    console.log("owner:       ", await c.owner().catch(e=>e.message));
  } catch (e) { console.log("err:", e.message); }

  console.log("\n--- ArenaBattle probe ---");
  try {
    const c = new ethers.Contract(ADDRS.ArenaBattle, [
      "function arenaCoin() view returns (address)",
      "function arenaToken() view returns (address)",
      "function fighterNFT() view returns (address)",
      "function championNFT() view returns (address)",
      "function rewardVault() view returns (address)",
      "function ENTRY_FEE() view returns (uint256)",
      "function owner() view returns (address)",
    ], provider);
    console.log("arenaCoin:    ", await c.arenaCoin().catch(e=>"-"));
    console.log("arenaToken:   ", await c.arenaToken().catch(e=>"-"));
    console.log("fighterNFT:   ", await c.fighterNFT().catch(e=>"-"));
    console.log("championNFT:  ", await c.championNFT().catch(e=>"-"));
    console.log("rewardVault:  ", await c.rewardVault().catch(e=>"-"));
    console.log("ENTRY_FEE:    ", await c.ENTRY_FEE().then(d=>d.toString()).catch(e=>"-"));
    console.log("owner:        ", await c.owner().catch(e=>"-"));
  } catch (e) { console.log("err:", e.message); }

  console.log("\n--- ArenaPVP probe ---");
  try {
    const c = new ethers.Contract(ADDRS.ArenaPVP, [
      "function arenaCoin() view returns (address)",
      "function arenaToken() view returns (address)",
      "function fighterNFT() view returns (address)",
      "function championNFT() view returns (address)",
      "function owner() view returns (address)",
    ], provider);
    console.log("arenaCoin:    ", await c.arenaCoin().catch(e=>"-"));
    console.log("arenaToken:   ", await c.arenaToken().catch(e=>"-"));
    console.log("fighterNFT:   ", await c.fighterNFT().catch(e=>"-"));
    console.log("championNFT:  ", await c.championNFT().catch(e=>"-"));
    console.log("owner:        ", await c.owner().catch(e=>"-"));
  } catch (e) { console.log("err:", e.message); }

  console.log("\n--- ArenaMarketplace probe ---");
  try {
    const c = new ethers.Contract(ADDRS.ArenaMarketplace, [
      "function arenaCoin() view returns (address)",
      "function arenaToken() view returns (address)",
      "function fighterNFT() view returns (address)",
      "function championNFT() view returns (address)",
      "function owner() view returns (address)",
      "function MARKETPLACE_FEE_BPS() view returns (uint256)",
    ], provider);
    console.log("arenaCoin:    ", await c.arenaCoin().catch(e=>"-"));
    console.log("arenaToken:   ", await c.arenaToken().catch(e=>"-"));
    console.log("fighterNFT:   ", await c.fighterNFT().catch(e=>"-"));
    console.log("championNFT:  ", await c.championNFT().catch(e=>"-"));
    console.log("owner:        ", await c.owner().catch(e=>"-"));
    console.log("MARKETPLACE_FEE_BPS:", await c.MARKETPLACE_FEE_BPS().then(d=>d.toString()).catch(e=>"-"));
  } catch (e) { console.log("err:", e.message); }
}

main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
