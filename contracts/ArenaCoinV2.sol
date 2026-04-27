// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20}         from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Capped}   from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {ERC20Permit}   from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title  ArenaCoin V2 — Arena Protocol governance / utility token
 * @notice Successor to the V1 ArenaCoin (0x3b85...4b5).
 *
 * Differences vs. V1 (audit-driven):
 *   - HARD CAP enforced at contract level (default 100M ARENA, immutable after deploy)
 *   - MINTABLE only by addresses that hold MINTER_ROLE (battle, staking, reward vault)
 *   - BURNABLE via OZ ERC20Burnable (battle loss-burn becomes possible)
 *   - PERMIT (EIP-2612) for gasless approvals → single-tx swaps & battle entries
 *   - DEFAULT_ADMIN_ROLE granted to a treasury multisig at deploy, NOT to the EOA
 *   - All 1,000,000 V1-equivalent supply minted upfront to the treasury multisig
 *
 * Treasury & roles MUST be a Safe multisig. Granting any role to an EOA in
 * production reintroduces the H-1 finding from AUDIT_ArenaCoin.md.
 */
contract ArenaCoinV2 is ERC20, ERC20Burnable, ERC20Capped, ERC20Permit, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /**
     * @param treasury        Multisig that will receive the initial supply and
     *                        the DEFAULT_ADMIN_ROLE. MUST NOT be an EOA.
     * @param initialSupply   Tokens minted at deploy (in whole units, not wei).
     *                        Pass 1_000_000 to mirror V1.
     * @param maxSupplyCap    Absolute cap on totalSupply (in whole units).
     *                        Pass 100_000_000 for a 100x runway.
     */
    constructor(
        address treasury,
        uint256 initialSupply,
        uint256 maxSupplyCap
    )
        ERC20("ArenaCoin", "ARENA")
        ERC20Capped(maxSupplyCap * 10 ** 18)
        ERC20Permit("ArenaCoin")
    {
        require(treasury != address(0), "ArenaCoinV2: treasury=0");
        require(initialSupply <= maxSupplyCap, "ArenaCoinV2: initial>cap");

        _grantRole(DEFAULT_ADMIN_ROLE, treasury);
        // Treasury can also mint by default; revoke if you want strict separation.
        _grantRole(MINTER_ROLE, treasury);

        // Mint the V1-equivalent supply directly to the treasury, NOT to msg.sender.
        // _mint goes through ERC20Capped._update so the cap is enforced.
        _mint(treasury, initialSupply * 10 ** 18);
    }

    /// @notice Mint new ARENA. Only callable by accounts with MINTER_ROLE
    ///         (battle / staking / reward-vault contracts after deploy).
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    // ─── Required overrides ───────────────────────────────────────────────

    /// @dev Resolves diamond inheritance between ERC20 and ERC20Capped.
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Capped)
    {
        super._update(from, to, value);
    }
}
