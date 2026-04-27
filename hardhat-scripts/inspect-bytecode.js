/**
 * Extract function selectors from the on-chain bytecode and compare
 * against expected ERC20 selectors. Helps detect API drift.
 */
const { ethers } = require("hardhat");

const ADDR = "0x3b855F88CB93aA642EaEB13F59987C552Fc614b5";

const KNOWN = {
  "06fdde03": "name()",
  "095ea7b3": "approve(address,uint256)",
  "18160ddd": "totalSupply()",
  "23b872dd": "transferFrom(address,address,uint256)",
  "313ce567": "decimals()",
  "39509351": "increaseAllowance(address,uint256)",
  "70a08231": "balanceOf(address)",
  "8da5cb5b": "owner()",
  "95d89b41": "symbol()",
  "a457c2d7": "decreaseAllowance(address,uint256)",
  "a9059cbb": "transfer(address,uint256)",
  "dd62ed3e": "allowance(address,address)",
  "f2fde38b": "transferOwnership(address)",
  "715018a6": "renounceOwnership()",
  "40c10f19": "mint(address,uint256)",
  "42966c68": "burn(uint256)",
  "79cc6790": "burnFrom(address,uint256)",
};

async function main() {
  const code = await ethers.provider.getCode(ADDR);
  // function selectors appear as PUSH4 (0x63 XX XX XX XX) followed by EQ (0x14)
  const re = /63([0-9a-f]{8})14/gi;
  const selectors = new Set();
  let m;
  while ((m = re.exec(code.slice(2))) !== null) {
    selectors.add(m[1].toLowerCase());
  }
  console.log("Detected selectors in deployed contract:");
  for (const s of [...selectors].sort()) {
    console.log(`  0x${s} -> ${KNOWN[s] || "<unknown>"}`);
  }
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
