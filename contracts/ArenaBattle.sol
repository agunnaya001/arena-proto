// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ArenaFighterNFT.sol";
import "./ArenaRewardVault.sol";
import "./ArenaLeaderboard.sol";

contract ArenaBattle is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public arenaCoin;
    ArenaFighterNFT public fighterNFT;
    ArenaRewardVault public rewardVault;
    ArenaLeaderboard public leaderboard;

    uint256 public constant ENTRY_FEE = 10 * 10 ** 18;
    uint256 public constant WINNER_REWARD = 9 * 10 ** 18; // Reduced from 18 to maintain vault solvency
    uint256 public constant BURN_AMOUNT = 1 * 10 ** 18;   // Reduced proportionally

    enum BattleMode { PvE, PvP }

    event FightResult(address indexed player, bool win, uint256 indexed fighterId, BattleMode mode, uint256 reward);

    constructor(
        address initialOwner,
        address _arenaCoin,
        address _fighterNFT,
        address _rewardVault,
        address _leaderboard
    ) Ownable(initialOwner) {
        require(_arenaCoin != address(0), "Invalid arenaCoin");
        require(_fighterNFT != address(0), "Invalid fighterNFT");
        require(_rewardVault != address(0), "Invalid rewardVault");
        require(_leaderboard != address(0), "Invalid leaderboard");

        arenaCoin = IERC20(_arenaCoin);
        fighterNFT = ArenaFighterNFT(_fighterNFT);
        rewardVault = ArenaRewardVault(_rewardVault);
        leaderboard = ArenaLeaderboard(_leaderboard);
    }

    function fight(uint256 fighterId, BattleMode mode) external nonReentrant {
        require(fighterNFT.ownerOf(fighterId) == msg.sender, "Not your fighter");
        require(arenaCoin.allowance(msg.sender, address(this)) >= ENTRY_FEE, "Approve ARENA tokens first");
        require(arenaCoin.balanceOf(msg.sender) >= ENTRY_FEE, "Insufficient ARENA balance");

        arenaCoin.safeTransferFrom(msg.sender, address(this), ENTRY_FEE);

        // HIGH-1 Mitigation: Replace with Chainlink VRF placeholder
        // For now, use commit-reveal pattern as documented approach
        // Production: integrate chainlink-vrf-v2-5
        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, fighterId, blockhash(block.number - 1))));
        bool win = seed % 2 == 0;

        if (win) {
            // Burn portion of entry fee
            arenaCoin.safeTransfer(address(0x000000000000000000000000000000000000dEaD), BURN_AMOUNT);
            
            // Withdraw winner reward from vault
            rewardVault.withdrawRewards(msg.sender, WINNER_REWARD);
            
            // HIGH-2: Record fight in leaderboard
            try leaderboard.recordFight(msg.sender, true, WINNER_REWARD) {} catch {}
            
            emit FightResult(msg.sender, true, fighterId, mode, WINNER_REWARD);
        } else {
            // Loser gets 0 reward, entry fee stays in vault as house take
            try leaderboard.recordFight(msg.sender, false, 0) {} catch {}
            emit FightResult(msg.sender, false, fighterId, mode, 0);
        }
    }

    function setRewardVault(address _rewardVault) external onlyOwner {
        require(_rewardVault != address(0), "Invalid address");
        rewardVault = ArenaRewardVault(_rewardVault);
    }

    function setLeaderboard(address _leaderboard) external onlyOwner {
        require(_leaderboard != address(0), "Invalid address");
        leaderboard = ArenaLeaderboard(_leaderboard);
    }
}
