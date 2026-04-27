/**
 * Brute-force compiler/optimizer settings against the on-chain bytecode
 * using the native solc 0.8.25 binary (already cached by Hardhat).
 */
const { ethers } = require("hardhat");
const fs   = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const SOLC_BINARY = path.resolve(
  __dirname, "..", ".cache", "hardhat-nodejs", "compilers-v2",
  "linux-amd64", "solc-linux-amd64-v0.8.25+commit.b61c2a91",
);

const TARGET = {
  name:    "ArenaCoin",
  address: "0x3b855F88CB93aA642EaEB13F59987C552Fc614b5",
  source:  path.resolve(__dirname, "..", "contracts", "deployed", "ArenaCoin.sol"),
};

// parentKey is the source-name (e.g. "@openzeppelin/contracts/token/ERC20/ERC20.sol")
// against which relative imports must be resolved (NOT the filesystem path).
function readImports(src, parentKey, sources, seen = new Set()) {
  const importRe = /import\s+(?:\{[^}]*\}\s+from\s+)?["']([^"']+)["']/g;
  let m;
  while ((m = importRe.exec(src)) !== null) {
    const imp = m[1];
    let key, resolved;
    if (imp.startsWith("@")) {
      key = imp;
      // Prefer OZ v4 from .verify-deps for deployed-contract verification
      const v4 = path.resolve(__dirname, "..", ".verify-deps", "node_modules", imp);
      resolved = fs.existsSync(v4) ? v4 : path.resolve(__dirname, "..", "node_modules", imp);
    } else if (imp.startsWith("./") || imp.startsWith("../")) {
      // Resolve key by treating parentKey like a posix path
      const parentDir = parentKey.includes("/") ? parentKey.replace(/\/[^/]*$/, "") : "";
      const parts = (parentDir + "/" + imp).split("/");
      const stack = [];
      for (const p of parts) {
        if (p === "" || p === ".") continue;
        if (p === "..") stack.pop();
        else stack.push(p);
      }
      key = stack.join("/");
      // Resolve filesystem path
      if (key.startsWith("@")) {
        resolved = path.resolve(__dirname, "..", "node_modules", key);
      } else {
        resolved = path.resolve(__dirname, "..", key);
      }
    } else {
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    if (!fs.existsSync(resolved)) {
      console.error("  [warn] missing import:", key, "->", resolved);
      continue;
    }
    const c = fs.readFileSync(resolved, "utf8");
    sources[key] = { content: c };
    readImports(c, key, sources, seen);
  }
}

function compile(settings) {
  const src = fs.readFileSync(TARGET.source, "utf8");
  const sources = { "ArenaCoin.sol": { content: src } };
  readImports(src, path.dirname(TARGET.source), sources);

  const input = {
    language: "Solidity",
    sources,
    settings: {
      ...settings,
      outputSelection: { "*": { "*": ["evm.deployedBytecode.object"] } },
    },
  };

  const result = execFileSync(SOLC_BINARY, ["--standard-json"], {
    input: JSON.stringify(input),
    maxBuffer: 50 * 1024 * 1024,
  }).toString();

  const out = JSON.parse(result);
  if (out.errors && out.errors.some(e => e.severity === "error")) {
    return { error: out.errors.find(e => e.severity === "error").formattedMessage };
  }

  for (const file of Object.values(out.contracts || {})) {
    if (file[TARGET.name]) {
      return { bytecode: "0x" + file[TARGET.name].evm.deployedBytecode.object };
    }
  }
  return { error: "ArenaCoin contract not found in output" };
}

function stripMetadata(bc) {
  if (!bc || bc.length < 8) return bc;
  const len = parseInt(bc.slice(-4), 16);
  const cut = bc.length - 4 - len * 2;
  return cut > 0 && cut < bc.length ? bc.slice(0, cut) : bc;
}

async function main() {
  const provider = ethers.provider;
  const onchain = await provider.getCode(TARGET.address);
  const onchainStripped = stripMetadata(onchain);
  console.log(`On-chain bytecode size: ${(onchain.length-2)/2} bytes (stripped: ${(onchainStripped.length-2)/2})`);

  const variants = [];
  for (const evm of ["cancun", "shanghai", "paris"]) {
    for (const opt of [
      { enabled: false, runs: 200 },
      { enabled: true,  runs: 200 },
      { enabled: true,  runs: 1000 },
      { enabled: true,  runs: 999999 },
    ]) {
      variants.push({ evm, opt });
    }
  }

  let winner = null;
  for (const v of variants) {
    const r = compile({ optimizer: v.opt, evmVersion: v.evm });
    if (r.error) {
      console.log(`  evm=${v.evm.padEnd(8)} opt=${JSON.stringify(v.opt).padEnd(35)}  ERR: ${r.error.split("\n")[0].slice(0,60)}`);
      continue;
    }
    const exact   = r.bytecode === onchain;
    const noMeta  = stripMetadata(r.bytecode) === onchainStripped;
    const status  = exact ? "✅✅ EXACT" : noMeta ? "✅ MATCH (modulo metadata)" : `✗ ${(r.bytecode.length-2)/2}b`;
    console.log(`  evm=${v.evm.padEnd(8)} opt=${JSON.stringify(v.opt).padEnd(35)}  ${status}`);
    if (exact || noMeta) { winner = v; break; }
  }

  if (winner) {
    console.log("\n>>> WINNING SETTINGS:");
    console.log("    compiler:    0.8.25");
    console.log("    evmVersion:  ", winner.evm);
    console.log("    optimizer:   ", JSON.stringify(winner.opt));
  } else {
    console.log("\nNo combination matched. Try a different OZ version or check imports.");
  }
}

main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
