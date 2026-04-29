// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ArenaRewardVault is Ownable, AccessControl {
    using SafeERC20 for IERC20;

    IERC20 public arenaCoin;

    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");

    event RewardsDeposited(address indexed from, uint256 amount);
    event RewardsWithdrawn(address indexed to, uint256 amount);

    constructor(address initialOwner, address _arenaCoin) Ownable(initialOwner) {
        require(_arenaCoin != address(0), "Invalid arenaCoin");
        arenaCoin = IERC20(_arenaCoin);
        
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(WITHDRAWER_ROLE, initialOwner);
    }

    function depositRewards(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        arenaCoin.safeTransferFrom(msg.sender, address(this), amount);
        emit RewardsDeposited(msg.sender, amount);
    }

    // MED-1: Use SafeERC20; require WITHDRAWER_ROLE
    function withdrawRewards(address to, uint256 amount) external onlyRole(WITHDRAWER_ROLE) {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        require(arenaCoin.balanceOf(address(this)) >= amount, "Insufficient vault balance");
        arenaCoin.safeTransfer(to, amount);
        emit RewardsWithdrawn(to, amount);
    }

    function vaultBalance() external view returns (uint256) {
        return arenaCoin.balanceOf(address(this));
    }
}
