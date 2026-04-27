/**
 * Check Basescan verification status for all 5 deployed contracts.
 */
const KEY = process.env.ETHERSCAN_API_KEY || process.env.BASESCAN_API_KEY;
const CHAIN = 8453;

const ADDRS = {
  ArenaToken:       "0x3b855F88CB93aA642EaEB13F59987C552Fc614b5",
  ArenaChampion:    "0x68f08b005b09B0F7D07E1c0B5CDe18E43CE2486A",
  ArenaBattle:      "0xF6fc2B6a306B626548ca9dF25B31a22D0f8971CF",
  ArenaPVP:         "0xd0C4Af12E95f9590e7314D079C58597771E57533",
  ArenaMarketplace: "0x67817157Dd6E5945ac2fAf1a822e7f1dE26C698E",
};

async function check(addr) {
  const url = `https://api.etherscan.io/v2/api?chainid=${CHAIN}&module=contract&action=getsourcecode&address=${addr}&apikey=${KEY}`;
  const r = await fetch(url);
  const j = await r.json();
  if (j.status !== "1") return { error: j.message + " " + j.result };
  const item = j.result?.[0] || {};
  return {
    contractName: item.ContractName || "(none)",
    compiler:     item.CompilerVersion || "",
    optimization: item.OptimizationUsed === "1",
    runs:         item.Runs,
    evmVersion:   item.EVMVersion,
    proxy:        item.Proxy === "1",
    verified:     !!(item.SourceCode && item.SourceCode.length > 0),
  };
}

(async () => {
  for (const [name, addr] of Object.entries(ADDRS)) {
    const r = await check(addr);
    const status = r.error
      ? `ERR: ${r.error}`
      : r.verified
        ? `✅ VERIFIED as "${r.contractName}"  ${r.compiler}  evm=${r.evmVersion}  opt=${r.optimization?`${r.runs} runs`:"off"}`
        : "✗ unverified";
    console.log(`${name.padEnd(18)} ${addr}  ${status}`);
    await new Promise(r => setTimeout(r, 250));
  }
})();
