# Arena Protocol — Security Audit Report

**Audited by:** Replit Agent (automated review)
**Date:** April 27, 2026
**Scope:** All 7 Solidity smart contracts under `contracts/`, the deployment script, the on-chain event indexer, and the frontend wiring.
**Compiler:** Solidity 0.8.24 with optimizer (200 runs), EVM target Cancun
**Disclaimer:** This is a heuristic, automated audit. It is *not* a substitute for a formal audit by a firm such as OpenZeppelin, Trail of Bits, or ConsenSys Diligence before holding meaningful TVL.

---

## 0. Deployment Status

| Contract              | Address                                      | Verified | Source matches local? |
| --------------------- | -------------------------------------------- | -------- | --------------------- |
| ArenaToken (≈Coin)    | `0x3b855F88CB93aA642EaEB13F59987C552Fc614b5` | ❌ No    | ❌ No (no `owner()`)  |
| ArenaChampion (≈NFT)  | `0x68f08b005b09B0F7D07E1c0B5CDe18E43CE2486A` | ❌ No    | ❌ No (different name/symbol) |
| ArenaBattle           | `0xF6fc2B6a306B626548ca9dF25B31a22D0f8971CF` | ❌ No    | ❌ No (uses `arenaToken()` getter) |
| ArenaPVP              | `0xd0C4Af12E95f9590e7314D079C58597771E57533` | ❌ No    | ❌ Not in local source |
| ArenaMarketplace      | `0x67817157Dd6E5945ac2fAf1a822e7f1dE26C698E` | ❌ No    | ❌ No (different ABI) |
| ArenaStaking          | *(not deployed)*                             | —        | —                     |
| ArenaRewardVault      | *(not deployed)*                             | —        | —                     |
| ArenaLeaderboard      | *(not deployed)*                             | —        | —                     |

**Important:** The 5 deployed contracts were *not* compiled from this repository. Their on-chain ABI uses `arenaToken()` instead of `arenaCoin()`, the NFT is named "ArenaChampion / CHAMP" (not "Arena Fighter / AFIGHT"), and `ArenaPVP` does not exist locally at all. To verify them on Basescan, supply the original source files used to deploy them. Once you provide that source, run `npx hardhat verify --network base <address> <ctorArgs...>`.

---

## 1. Severity Legend

| Severity      | Meaning                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| **Critical**  | Funds at immediate risk; bug allows direct theft or permanent loss.     |
| **High**      | Funds at risk under specific (realistic) conditions, or core function broken. |
| **Medium**    | Economic / fairness risk, exploitable by a motivated actor.             |
| **Low**       | Best-practice violation, gas waste, minor UX risk.                      |
| **Info**      | Stylistic note, documentation gap.                                      |

---

## 2. Critical & High-Severity Findings

### [HIGH-1] `ArenaBattle.fight` — Predictable randomness
**File:** `contracts/ArenaBattle.sol:40-41`
```solidity
uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, fighterId)));
bool win = seed % 2 == 0;
```
`block.timestamp` and `block.prevrandao` are known to the proposer of the block. A validator (or any MEV searcher placing the tx in their own block via a private bundle) can read the result before broadcast and only submit transactions that win, draining the reward vault.
**Recommendation:** Use a commit-reveal scheme, or Chainlink VRF v2.5, or settle PvP outcomes off-chain with an EIP-712 signed result from a trusted oracle.

### [HIGH-2] `ArenaBattle` doesn't actually call the leaderboard
**Files:** `ArenaBattle.sol`, `ArenaLeaderboard.sol`
`ArenaLeaderboard` exposes `recordFight(player, win, reward)` and `setBattleContract(...)`, but `ArenaBattle.fight` never invokes it. The leaderboard will remain empty forever in production.
**Recommendation:** Add an immutable `ArenaLeaderboard public leaderboard;` reference in `ArenaBattle`, and call `leaderboard.recordFight(msg.sender, win, win ? WINNER_REWARD : 0)` at the end of `fight`. Wrap in `try/catch` so a leaderboard revert can never block a battle settlement.

### [HIGH-3] Reward vault drainable via repeated wins (no cool-down, no cap)
**File:** `ArenaBattle.sol:33-50`
With a 50 % win rate, expected payout per fight = `0.5 * 18 ARENA = 9 ARENA` against an entry fee of `10 ARENA`. The protocol is *only* solvent if the vault is constantly refunded. Combined with HIGH-1, an attacker can guarantee 100 % win rate and continuously withdraw from the vault.
**Recommendation:** Either lower `WINNER_REWARD` to `< ENTRY_FEE * 0.95` so the house has positive edge, or introduce a per-block / per-player rate-limit, and emit `BattleSettled` events with a nonce.

### [HIGH-4] `ArenaFighterNFT.mintFighter` is `onlyOwner` but stat seed is predictable
**File:** `contracts/ArenaFighterNFT.sol:31`
Even though only the owner can mint, the rarity roll uses `block.timestamp` + `block.prevrandao`, so the owner key (or whoever calls the mint endpoint on the backend) can pre-compute the rarity for a given block and sandwich legendary mints to themselves.
**Recommendation:** Use VRF, or accept the centralization and document that the owner picks rarity.

### [HIGH-5] `ArenaMarketplace.buyNFT` uses `transferFrom` from buyer with no explicit ARENA approval check
**File:** `contracts/ArenaMarketplace.sol:62-63`
The buyer must have approved the marketplace for at least `listing.price` ARENA, but this is not asserted up front — the failure mode is a low-level ERC-20 revert with no message. Worse, after step 1 succeeds (`transferFrom` to seller), step 2 (`transferFrom` for the fee) could *succeed even if the buyer revoked allowance between txns* — but if step 2 reverts, the entire transaction rolls back, so funds are not lost; the issue is purely UX.
**Recommendation:** Front-load `require(arenaCoin.allowance(msg.sender, address(this)) >= listing.price, "Approve ARENA");` and switch both transfers to a single `safeTransferFrom(buyer, address(this), price)` followed by `safeTransfer(seller, sellerAmount)` and `safeTransfer(owner(), fee)` using `SafeERC20`.

---

## 3. Medium-Severity Findings

### [MED-1] No `SafeERC20` anywhere
**Files:** `ArenaBattle.sol`, `ArenaMarketplace.sol`, `ArenaRewardVault.sol`, `ArenaStaking.sol`
Direct `IERC20.transfer / transferFrom` calls silently return `false` for some non-standard tokens (USDT-style). `ArenaCoin` is well-behaved, so this is not exploitable today, but if the protocol ever supports a second payment token it will break.
**Recommendation:** Import `@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol` and use `safeTransfer / safeTransferFrom`.

### [MED-2] `ArenaLeaderboard.getTopPlayers` is O(n²) bubble sort
**File:** `contracts/ArenaLeaderboard.sol:61-67`
After ~200 registered players, this view function will exceed the public RPC node gas/time limit (50 M units on Base). The function is `view`, so on-chain calls are fine, but the dApp will start failing.
**Recommendation:** Sort off-chain in the indexer (already in `backend/indexer.js`) and remove this function, or maintain a `SortedSet`-style structure on inserts.

### [MED-3] `ArenaStaking` cannot top up an existing stake
**File:** `contracts/ArenaStaking.sol:32`
```solidity
require(stakes[msg.sender].amount == 0, "Already staking, unstake first");
```
Forces the user to unstake (losing pending rewards rounding) just to add more — bad UX and triggers two transfers.
**Recommendation:** Auto-claim pending rewards, then add to the stake and reset `lastClaimAt`.

### [MED-4] `ArenaStaking._pendingRewards` truncates rewards to whole days
**File:** `contracts/ArenaStaking.sol:83`
```solidity
uint256 daysElapsed = (block.timestamp - info.lastClaimAt) / SECONDS_PER_DAY;
```
A user who claims after 23 h 59 m gets *zero* rewards. They will quickly learn to claim every 24 h sharp. Worse, calling `claimRewards` requires `pending > 0` which reverts in the truncation window, so the function can be DoS'd against itself.
**Recommendation:** Compute rewards on a per-second basis: `(amount * DAILY_RATE * (block.timestamp - lastClaimAt)) / (BASIS_POINTS * SECONDS_PER_DAY)`.

### [MED-5] Marketplace `_removeFromActiveListings` is O(n) per sale
**File:** `contracts/ArenaMarketplace.sol:87-95`
The unbounded `activeListingIds` array will eventually make every sale very expensive.
**Recommendation:** Replace with a `mapping(uint256 => uint256) indexOfTokenId` plus the array, so removal is O(1) (swap-and-pop with index lookup).

### [MED-6] `ArenaMarketplace.listNFT` doesn't verify token still owned at sale time
**File:** `contracts/ArenaMarketplace.sol:53-71`
Between `listNFT` and `buyNFT` the seller can transfer the NFT to another wallet, then re-list it. `buyNFT` would then revert at `fighterNFT.transferFrom(...)` because the seller no longer owns it — wasting gas and confusing the buyer.
**Recommendation:** Either escrow the NFT in `listNFT` (recommended) or re-check `ownerOf(tokenId) == listing.seller` at the top of `buyNFT`.

---

## 4. Low-Severity Findings

### [LOW-1] No `ReentrancyGuard` on functions that interact with external ERC-20s
While `ArenaCoin` is non-reentrant, all of `fight`, `buyNFT`, `stake`, `unstake`, `claimRewards`, `depositRewards`, `withdrawRewards` follow the pattern of "external call → state change". Switching the payment token in the future to one with hooks (ERC-777, ERC-1363) would expose them.
**Recommendation:** Inherit `ReentrancyGuard` from OpenZeppelin and add `nonReentrant` to all four-of-five mutating external functions.

### [LOW-2] `ArenaRewardVault.depositRewards` is callable by anyone
**File:** `contracts/ArenaRewardVault.sol:17-21`
Not an exploit, but documented as `external` with no event-tagging of the depositor's intent. If you ever distinguish "owner top-up" from "user donation" you'll need to refactor.

### [LOW-3] No event on `ArenaBattle.setRewardVault`
Owner can silently swap the vault. Add `event RewardVaultUpdated(address oldVault, address newVault);`.

### [LOW-4] `ArenaLeaderboard.battleContract` can only be set, not unset
After a hot-swap of `ArenaBattle`, the old battle contract retains write access until `setBattleContract(newAddress)` is called — which is fine, but allow `address(0)` to pause writes during migrations.

### [LOW-5] No Pausable / circuit-breaker
None of the user-facing contracts (`ArenaBattle`, `ArenaMarketplace`, `ArenaStaking`) are `Pausable`. In the event of a discovered exploit, the only mitigation is migrating to new addresses.
**Recommendation:** Inherit `Pausable` and gate `fight`, `buyNFT`, `stake`, `unstake` behind `whenNotPaused`. Pausing is owner-only (centralized), but the upside vastly outweighs the downside.

### [LOW-6] Solidity floating-pragma `^0.8.24`
**Files:** All contracts.
A floating pragma allows users to compile with a future, untested compiler version.
**Recommendation:** Pin to a fixed version, e.g. `pragma solidity 0.8.24;`.

### [LOW-7] Hard-coded `dEaD` burn address in `ArenaBattle`
Use `arenaCoin.burn(BURN_AMOUNT)` if `ArenaCoin` exposes burn (it does, via the `burn(uint256)` external function), so the totalSupply actually decreases. Sending to `0xdEaD` does *not* decrement totalSupply.

---

## 5. Centralization Risks

| Capability                          | Held by      | Risk if compromised                                  |
| ----------------------------------- | ------------ | ---------------------------------------------------- |
| `ArenaCoin.mint`                    | owner        | Unlimited inflation → token price → 0                |
| `ArenaFighterNFT.mintFighter`       | owner        | Owner mints all legendary fighters to themselves     |
| `ArenaRewardVault.withdrawRewards`  | owner        | Vault can be drained directly to attacker            |
| `ArenaBattle.setRewardVault`        | owner        | Redirect winner payouts to attacker-controlled vault |
| `ArenaLeaderboard.setBattleContract`| owner        | Fake battle contract spams leaderboard               |

**Recommendation:** Transfer ownership of all five contracts to a 2-of-3 (or 3-of-5) Gnosis Safe at launch. Even better: move long-term parameters (mint cap, burn rate, entry fee) under a `Timelock` (e.g. 24 h) so users can exit before changes take effect.

---

## 6. Code-Quality & Gas Findings

| ID  | Location                                  | Note                                                                                  |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------- |
| Q-1 | `ArenaBattle.ENTRY_FEE` etc.              | Use `1e18` instead of `10 ** 18` (slightly cheaper, more idiomatic).                  |
| Q-2 | `ArenaFighterNFT.mintFighter`             | Rarity roll uses 3 separate shifts of one seed — fine, but cheaper to use 3 seeds.    |
| Q-3 | All contracts                             | Mark constants as `private` if not consumed externally to save deploy bytecode.       |
| Q-4 | `ArenaMarketplace.activeListingIds`       | Storage array of `uint256` — consider `EnumerableSet.UintSet` from OpenZeppelin.      |
| Q-5 | `ArenaLeaderboard.PlayerStats.totalRewards` | Stored as `uint256` but emitted as raw — consumers will need to know decimals (18). |
| Q-6 | `ArenaRewardVault.vaultBalance`           | Pure wrapper — drop and let the caller read `ArenaCoin.balanceOf(vault)` directly.    |

---

## 7. Off-Chain Findings (backend / frontend)

### [HIGH-OF-1] Indexer ABI mismatch with deployed contracts
`backend/indexer.js` listens for `FightResult(player, win, fighterId, mode, reward)` and `FighterMinted(player, tokenId, rarity)` — but the deployed `ArenaBattle` (`0xF6fc...71CF`) and `ArenaChampion` (`0x68f0...486A`) likely emit different events. **No on-chain activity will be indexed until the ABI is updated to match the deployed contracts**, or the deployed contracts are replaced with our local ones.

### [MED-OF-1] No retry / persistence on indexer disconnect
The indexer subscribes via `provider.on(...)`. On RPC disconnect it silently stops. Add a heartbeat ping every 30 s and re-subscribe on disconnect.

### [LOW-OF-1] CORS wildcard in `backend/server.js`
`Access-Control-Allow-Origin: *` is fine for read-only public data but should be tightened to the production domain before launch.

### [LOW-OF-2] Frontend Wagmi config is mocked
`artifacts/arena-protocol/src/lib/wagmi.ts` exports `useMockAccount` — must be replaced with real `useAccount` from `wagmi` before users connect real wallets.

---

## 8. Overall Risk Score

| Domain                    | Score (out of 10, lower = riskier) |
| ------------------------- | ---------------------------------- |
| Token / supply integrity  | **6**  — Ownable mint, no cap      |
| Battle fairness / RNG     | **2**  — Predictable, exploitable  |
| Marketplace correctness   | **6**  — Sound, needs SafeERC20 + escrow |
| Staking math              | **5**  — Truncation, no top-ups    |
| Centralization            | **3**  — All single-owner, no multi-sig |
| Off-chain trust surface   | **6**  — Indexer single point      |
| **Aggregate launch risk** | **4 / 10 → DO NOT MAINNET-LAUNCH AS-IS** |

---

## 9. Priority Fix List Before Launch

1. **Replace RNG** in `ArenaBattle` with Chainlink VRF or commit-reveal (HIGH-1, HIGH-3, HIGH-4).
2. **Wire `ArenaBattle` → `ArenaLeaderboard.recordFight`** (HIGH-2).
3. **Switch all ERC-20 calls to `SafeERC20`** (MED-1).
4. **Make staking math per-second and allow top-ups** (MED-3, MED-4).
5. **Escrow NFTs in `ArenaMarketplace.listNFT`** (MED-6).
6. **Add `Pausable`** to `ArenaBattle`, `ArenaMarketplace`, `ArenaStaking` (LOW-5).
7. **Transfer ownership to a multi-sig** (centralization).
8. **Update indexer ABI** to match the actually-deployed contracts (HIGH-OF-1).
9. **Remove the mocked Wagmi hook** and wire the real `useAccount` (LOW-OF-2).
10. **Get an external review** from a reputable audit firm before any TVL > $50 k.

---

*End of report.*
