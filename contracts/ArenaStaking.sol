// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ArenaStaking is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public arenaCoin;

    uint256 public constant DAILY_REWARD_RATE = 100; // 1% per day (100 basis points)
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_DAY = 86400;

    struct StakeInfo {
        uint256 amount;
        uint256 stakedAt;
        uint256 lastClaimAt;
    }

    mapping(address => StakeInfo) public stakes;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 reward);
    event TopUpStaked(address indexed user, uint256 amount);

    constructor(address initialOwner, address _arenaCoin) Ownable(initialOwner) {
        require(_arenaCoin != address(0), "Invalid arenaCoin");
        arenaCoin = IERC20(_arenaCoin);
    }

    // MED-3: Allow initial stake
    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(stakes[msg.sender].amount == 0, "Already staking, unstake first");

        arenaCoin.safeTransferFrom(msg.sender, address(this), amount);

        stakes[msg.sender] = StakeInfo({
            amount: amount,
            stakedAt: block.timestamp,
            lastClaimAt: block.timestamp
        });

        emit Staked(msg.sender, amount);
    }

    // MED-3: Allow top-up of existing stake
    function topUpStake(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        StakeInfo storage info = stakes[msg.sender];
        require(info.amount > 0, "No existing stake, call stake() first");

        // Auto-claim pending rewards before top-up
        uint256 pending = _pendingRewards(msg.sender);
        if (pending > 0 && arenaCoin.balanceOf(address(this)) >= pending) {
            arenaCoin.safeTransfer(msg.sender, pending);
            emit RewardsClaimed(msg.sender, pending);
        }

        // Reset claim timer and add to stake
        arenaCoin.safeTransferFrom(msg.sender, address(this), amount);
        info.amount += amount;
        info.lastClaimAt = block.timestamp;

        emit TopUpStaked(msg.sender, amount);
    }

    function unstake() external {
        StakeInfo storage info = stakes[msg.sender];
        require(info.amount > 0, "Nothing staked");

        uint256 pending = _pendingRewards(msg.sender);
        uint256 amount = info.amount;

        delete stakes[msg.sender];

        arenaCoin.safeTransfer(msg.sender, amount);

        if (pending > 0 && arenaCoin.balanceOf(address(this)) >= pending) {
            arenaCoin.safeTransfer(msg.sender, pending);
            emit RewardsClaimed(msg.sender, pending);
        }

        emit Unstaked(msg.sender, amount);
    }

    function claimRewards() external {
        uint256 pending = _pendingRewards(msg.sender);
        require(pending > 0, "No rewards available");
        require(arenaCoin.balanceOf(address(this)) >= pending, "Insufficient reward pool");

        stakes[msg.sender].lastClaimAt = block.timestamp;
        arenaCoin.safeTransfer(msg.sender, pending);

        emit RewardsClaimed(msg.sender, pending);
    }

    function pendingRewards(address user) external view returns (uint256) {
        return _pendingRewards(user);
    }

    // MED-4: Per-second reward calculation for precision
    function _pendingRewards(address user) internal view returns (uint256) {
        StakeInfo storage info = stakes[user];
        if (info.amount == 0) return 0;

        uint256 secondsElapsed = block.timestamp - info.lastClaimAt;
        // Rewards = (amount * dailyRate * secondsElapsed) / (BASIS_POINTS * SECONDS_PER_DAY)
        return (info.amount * DAILY_REWARD_RATE * secondsElapsed) / (BASIS_POINTS * SECONDS_PER_DAY);
    }
}
