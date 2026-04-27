/**
 * Submit verification for ArenaCoin to Etherscan v2 (Basescan) using
 * Standard JSON Input with OZ v4.9.6 sources from .verify-deps/.
 */
const fs   = require("fs");
const path = require("path");

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || process.env.BASESCAN_API_KEY;
const CHAIN_ID = 8453;

const TARGET = {
  name:         "ArenaCoin",
  address:      "0x3b855F88CB93aA642EaEB13F59987C552Fc614b5",
  source:       path.resolve(__dirname, "..", "contracts", "deployed", "ArenaCoin.sol"),
  contractName: "contracts/deployed/ArenaCoin.sol:ArenaCoin",
  compiler:     "v0.8.25+commit.b61c2a91",
  settings: {
    optimizer:  { enabled: true, runs: 200 },
    evmVersion: "paris",
    metadata:   { bytecodeHash: "ipfs" },
  },
};

function readImports(src, parentKey, sources, seen = new Set()) {
  const importRe = /import\s+(?:\{[^}]*\}\s+from\s+)?["']([^"']+)["']/g;
  let m;
  while ((m = importRe.exec(src)) !== null) {
    const imp = m[1];
    let key, resolved;
    if (imp.startsWith("@")) {
      key = imp;
      const v4 = path.resolve(__dirname, "..", ".verify-deps", "node_modules", imp);
      resolved = fs.existsSync(v4) ? v4 : path.resolve(__dirname, "..", "node_modules", imp);
    } else if (imp.startsWith("./") || imp.startsWith("../")) {
      const parentDir = parentKey.includes("/") ? parentKey.replace(/\/[^/]*$/, "") : "";
      const parts = (parentDir + "/" + imp).split("/");
      const stack = [];
      for (const p of parts) {
        if (p === "" || p === ".") continue;
        if (p === "..") stack.pop();
        else stack.push(p);
      }
      key = stack.join("/");
      resolved = key.startsWith("@")
        ? path.resolve(__dirname, "..", ".verify-deps", "node_modules", key)
        : path.resolve(__dirname, "..", key);
      if (key.startsWith("@") && !fs.existsSync(resolved)) {
        resolved = path.resolve(__dirname, "..", "node_modules", key);
      }
    } else continue;

    if (seen.has(key)) continue;
    seen.add(key);
    if (!fs.existsSync(resolved)) {
      console.error("  [warn] missing:", key);
      continue;
    }
    const c = fs.readFileSync(resolved, "utf8");
    sources[key] = { content: c };
    readImports(c, key, sources, seen);
  }
}

async function main() {
  if (!ETHERSCAN_API_KEY) {
    console.error("ETHERSCAN_API_KEY not set");
    process.exit(1);
  }

  const src = fs.readFileSync(TARGET.source, "utf8");
  const sources = { "contracts/deployed/ArenaCoin.sol": { content: src } };
  readImports(src, "contracts/deployed/ArenaCoin.sol", sources);

  const stdInput = {
    language: "Solidity",
    sources,
    settings: {
      ...TARGET.settings,
      outputSelection: { "*": { "*": ["*"], "": ["*"] } },
    },
  };

  console.log("Sources to upload:", Object.keys(sources).length);

  const params = new URLSearchParams();
  params.set("chainid", String(CHAIN_ID));
  params.set("module", "contract");
  params.set("action", "verifysourcecode");
  params.set("apikey", ETHERSCAN_API_KEY);

  const body = new URLSearchParams();
  body.set("chainId", String(CHAIN_ID));
  body.set("codeformat", "solidity-standard-json-input");
  body.set("sourceCode", JSON.stringify(stdInput));
  body.set("contractaddress", TARGET.address);
  body.set("contractname", TARGET.contractName);
  body.set("compilerversion", TARGET.compiler);
  body.set("constructorArguements", ""); // ArenaCoin has no constructor args

  const url = `https://api.etherscan.io/v2/api?${params.toString()}`;
  console.log("POST", url.replace(ETHERSCAN_API_KEY, "***"));

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const json = await res.json();
  console.log("Submission response:", json);

  if (json.status !== "1") {
    console.error("Submission failed.");
    process.exit(1);
  }

  const guid = json.result;
  console.log(`\nGUID: ${guid}\nPolling status...`);

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 4000));
    const checkUrl = `https://api.etherscan.io/v2/api?chainid=${CHAIN_ID}&module=contract&action=checkverifystatus&guid=${guid}&apikey=${ETHERSCAN_API_KEY}`;
    const cr = await fetch(checkUrl);
    const cj = await cr.json();
    console.log(`  [${i+1}/30]`, cj.result);
    if (cj.status === "1") {
      console.log("\n✅ VERIFIED:", `https://basescan.org/address/${TARGET.address}#code`);
      return;
    }
    if (cj.result && /fail|error/i.test(cj.result) && !/pending/i.test(cj.result)) {
      console.error("\n❌ Verification failed:", cj.result);
      process.exit(1);
    }
  }
  console.error("\nTimed out waiting for verification.");
  process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
