# ArenaCoin (ARENA) — Focused Security Audit

**Address:** `0x3b855F88CB93aA642EaEB13F59987C552Fc614b5` (Base Mainnet, chainId 8453)
**Compiler:** solc 0.8.25, EVM `paris`, optimizer 200 runs, OpenZeppelin v4.9.6
**Source (verified on Basescan):**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ArenaCoin is ERC20 {
    constructor() ERC20("ArenaCoin", "ARENA") {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }
}
```

**On-chain state (snapshot):**
- `name = "ArenaCoin"`, `symbol = "ARENA"`, `decimals = 18`
- `totalSupply = 1,000,000 ARENA` (fixed)
- Deployer EOA balance = **970,000 ARENA (97 %)**
- No `owner()` getter (no `Ownable`), no admin functions, no upgrade proxy
- Bytecode length: 2,131 bytes

---

## Overall Risk Rating: **3 / 10 (Low)**

The contract itself is a textbook OpenZeppelin ERC20 with no custom logic and no privileged functions. There are **no exploitable bugs** in the token contract. All findings below are **operational, tokenomic, or design** concerns — not code bugs.

The single biggest real-world risk is **97 % of supply held by one EOA** — that's a key-management problem, not a smart-contract problem.

---

## Findings

### HIGH

#### H-1. Treasury concentration: 97 % of supply in a single EOA
- **Where:** deployer wallet `0xFfb6505912FCE95B42be4860477201bb4e204E9f`
- **Issue:** A compromise of that one private key drains the entire token supply. There is no multisig, no timelock, no vesting, no on-chain split. The same EOA also holds your deploy gas and is referenced as the deployer of the other Arena contracts.
- **Recommendation:**
  1. Move ≥80 % of the balance into a **Safe (Gnosis Safe) multisig** with at least 2-of-3 signers — Base supports it natively at https://app.safe.global/.
  2. Move team/founder allocation into a vesting contract (e.g. Sablier, OZ `VestingWallet`).
  3. Move the LP / market-making allocation to a dedicated treasury address that never signs transactions.
  4. Keep no more than the next-month operational budget on the hot deployer EOA.

#### H-2. Reward economy is structurally impossible with a fixed supply
- **Where:** the Arena Battle / PvP / (planned) Staking economy
- **Issue:** Battle pays out 18 ARENA per win and burns 2 ARENA per loss against a 10 ARENA entry fee. Battles create net inflation (18 > 10). Staking is documented as 1 % per day — that's >3,650 % APY, which **cannot be sustained from a 1,000,000 fixed supply**. There is no `mint(address,uint256)` exposed, so you cannot top up reward pools later.
- **Recommendation:** Decide today which model you want and lock it in:
  - **(a) Treasury-funded rewards:** transfer a fixed reward pool from treasury into `ArenaBattle` / `ArenaStaking`; cap APYs and burn-rates so the pool depletes predictably; communicate the runway to users.
  - **(b) Mintable token:** redeploy `ArenaCoinV2` that inherits `ERC20`, `AccessControl`, with a `MINTER_ROLE` granted only to `ArenaBattle`/`ArenaStaking`. This requires migration (snapshot + airdrop on V2, or wrapped V1↔V2 swap contract).

### MEDIUM

#### M-1. Floating pragma `^0.8.25` in production source
- Lets a future recompile silently pick `0.8.30+`, producing different bytecode and metadata. Pin to `pragma solidity 0.8.25;` (no caret) in any redeploy and in documentation that referencing Arena contracts.

#### M-2. Documentation drift — `replit.md` claims "mintable/burnable"
- The deployed contract is **neither**. There is no `mint`, no `burn`, no `burnFrom`. Anyone reading the docs will believe burns reduce supply — they don't. Either:
  - Update docs to say "fixed supply, non-mintable, non-burnable", **or**
  - Redeploy as `ArenaCoin is ERC20, ERC20Burnable` (and optionally `ERC20Capped`).

#### M-3. No on-chain liquidity-lock proof
- Users buying ARENA on a DEX have no on-chain way to verify that LP tokens are time-locked or burned. Add a public LP-lock (e.g. UNCX, Team.Finance) and publish the lock URL; or burn the LP NFT/tokens and publish the tx hash.

### LOW

#### L-1. Missing `ERC20Permit` (EIP-2612)
- Every interaction with `ArenaBattle` / `ArenaMarketplace` requires a separate `approve()` tx, doubling user gas and worsening UX (especially on mobile / Telegram Mini-App). Adding `ERC20Permit` would let the dApp request a signature instead of a tx.
- Cannot be retrofitted on the deployed contract — would require V2.

#### L-2. EVM target `paris` leaves gas on the table
- Base supports Cancun (mcopy, tload, tstore). A Cancun-targeted recompile would shave ~1–3 % gas off `transfer` / `transferFrom` calls. Marginal; only matters at scale.

#### L-3. No `name()`/`symbol()` collision check
- Several existing tokens on Base also use the symbol `ARENA`. Indexers and explorers may confuse them. Consider registering on the Coinbase Base token list (https://github.com/base/web/tree/main/apps/web/src/data) to claim canonical symbol metadata.

#### L-4. Solc 0.8.25 is one minor behind current
- 0.8.25 has no known critical issues. New deployments should use 0.8.30 (current). For this token specifically: **do not redeploy just for the version bump** — the gain isn't worth a token migration.

### INFORMATIONAL / POSITIVE FINDINGS

- ✅ **No reentrancy surface** — no ETH receive, no external callbacks, no hooks.
- ✅ **No admin keys** — once deployed, no one can pause, blacklist, mint, or upgrade. Maximum decentralization.
- ✅ **OpenZeppelin v4.9.6** — well-audited, no outstanding CVEs against ERC20.sol in this version.
- ✅ **Approve race condition mitigated** — OZ v4 ships `increaseAllowance` / `decreaseAllowance` which the ABI confirms are present.
- ✅ **Fixed decimals (18)** — matches market expectation, avoids the USDC/USDT 6-decimal trap that breaks naive front-ends.
- ✅ **Verified source on Basescan** — exchange listings and aggregators (CoinGecko, GeckoTerminal, DexScreener) require this; you're ready.

---

## Action Plan (recommended order)

| # | Action | Effort | Impact |
|---|---|---|---|
| 1 | Move 970k deployer balance → Safe multisig | 1 hour | Eliminates H-1 |
| 2 | Update `replit.md` & README to state "fixed supply, non-mintable, non-burnable" | 5 min | Resolves M-2 |
| 3 | Decide reward-pool model (treasury-funded vs V2 mintable) and document it | 1 day discussion | Resolves H-2 |
| 4 | Lock LP and publish proof on the website | 30 min after LP exists | Resolves M-3 |
| 5 | Submit to Base token list | 1 PR | Resolves L-3 |
| 6 | (Optional) Plan ArenaCoinV2 with `ERC20Permit` + capped mintable | 1–2 weeks incl. migration | Resolves L-1, H-2 long-term |

---

# Appendix: Sepolia / Testnet Question

> "Do I need to deploy those contracts on Sepolia too?"

**Short answer: No, not for the already-deployed 5 contracts. Yes, strongly recommended for the *next* contracts you plan to deploy (Staking, RewardVault, Leaderboard).**

### Details

1. **"Sepolia" is Ethereum testnet, not Base.** The correct testnet for Base mainnet is **Base Sepolia** (chainId `84532`), RPC `https://sepolia.base.org`. Don't use Ethereum Sepolia — different L1, different infrastructure, no relationship to your deployed contracts.

2. **For contracts already on Base Mainnet** (the 5 you deployed): no value in mirroring them to testnet. They're verified, immutable, and battle-tested in the only environment that matters (production).

3. **For the 3 contracts still to deploy** (`ArenaStaking`, `ArenaRewardVault`, `ArenaLeaderboard`): yes — deploy to **Base Sepolia first**. Reasons:
   - Free ETH from https://www.alchemy.com/faucets/base-sepolia or https://faucet.quicknode.com/base/sepolia (no real money at risk).
   - Lets you test the full reward-pool funding flow end-to-end (treasury → vault → battle payouts → staking) without spending real ETH.
   - Lets the indexer (`backend/indexer.js`) be tested against real on-chain events without polluting the production DB — point it at `BASE_SEPOLIA_RPC` and use a separate `DATABASE_URL`.
   - Resolves the H-2 reward-economy uncertainty before committing immutable mainnet contracts.

4. **Frontend implication:** wagmi/RainbowKit currently configures only `base`. To support a Base Sepolia "staging" build, add `baseSepolia` from `viem/chains` to the `chains` array, gated by an env flag (`VITE_USE_TESTNET=true`). Production builds stay mainnet-only.

5. **Cost comparison:** deploying all 3 remaining contracts to Base mainnet costs roughly **$0.20–$0.80 total** at current Base gas (~0.005 gwei). It is genuinely cheap, but Base Sepolia is **free** and gives you a debugging round-trip. Use testnet for the staking/reward economy specifically because you're tuning APY parameters that you cannot change after deployment.

### Recommended Workflow

```
1. Refine ArenaStaking.sol & ArenaRewardVault.sol locally
2. Deploy to Base Sepolia
3. Run integration tests: stake → wait → claim → battle reward flow
4. Iterate parameters (reward rate, lockup, burn-rate)
5. Once happy, deploy the EXACT same bytecode to Base Mainnet
6. Verify on Basescan with the same scripts already in hardhat-scripts/
```
