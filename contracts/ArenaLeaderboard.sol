// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ArenaLeaderboard is Ownable {
    struct PlayerStats {
        uint256 totalWins;
        uint256 totalBattles;
        uint256 totalRewards;
    }

    struct SeasonStats {
        uint256 wins;
        uint256 battles;
        uint256 rewards;
    }

    struct Season {
        uint256 startTime;
        uint256 endTime;
        uint256 rewardPool;
        bool active;
    }

    // Global stats
    mapping(address => PlayerStats) public playerStats;
    address[] public registeredPlayers;
    mapping(address => bool) public isRegistered;

    // Seasonal stats
    mapping(uint256 => Season) public seasons;
    mapping(uint256 => mapping(address => SeasonStats)) public seasonStats;
    uint256 public currentSeasonId;

    address public battleContract;

    event StatsUpdated(address indexed player, uint256 wins, uint256 battles, uint256 rewards);
    event SeasonStarted(uint256 indexed seasonId, uint256 startTime, uint256 endTime);
    event SeasonEnded(uint256 indexed seasonId, address topWinner, uint256 topReward);

    modifier onlyBattle() {
        require(msg.sender == battleContract || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setBattleContract(address _battleContract) external onlyOwner {
        battleContract = _battleContract;
    }

    function recordFight(address player, bool win, uint256 reward) external onlyBattle {
        // Register player if new
        if (!isRegistered[player]) {
            registeredPlayers.push(player);
            isRegistered[player] = true;
        }

        // Update global stats
        playerStats[player].totalBattles++;
        if (win) {
            playerStats[player].totalWins++;
            playerStats[player].totalRewards += reward;
        }

        // Update seasonal stats if season is active
        if (seasons[currentSeasonId].active) {
            seasonStats[currentSeasonId][player].battles++;
            if (win) {
                seasonStats[currentSeasonId][player].wins++;
                seasonStats[currentSeasonId][player].rewards += reward;
            }
        }

        emit StatsUpdated(
            player,
            playerStats[player].totalWins,
            playerStats[player].totalBattles,
            playerStats[player].totalRewards
        );
    }

    // Admin: Start a new season
    function startSeason(uint256 endTime, uint256 rewardPool) external onlyOwner {
        require(endTime > block.timestamp, "End time must be in future");
        
        uint256 seasonId = currentSeasonId + 1;
        seasons[seasonId] = Season({
            startTime: block.timestamp,
            endTime: endTime,
            rewardPool: rewardPool,
            active: true
        });

        currentSeasonId = seasonId;
        emit SeasonStarted(seasonId, block.timestamp, endTime);
    }

    // Admin: End season and emit event
    function endSeason() external onlyOwner {
        require(seasons[currentSeasonId].active, "No active season");
        
        uint256 seasonId = currentSeasonId;
        seasons[seasonId].active = false;

        // Find top winner this season (off-chain sorting recommended)
        address topWinner = address(0);
        uint256 topWins = 0;
        for (uint256 i = 0; i < registeredPlayers.length; i++) {
            if (seasonStats[seasonId][registeredPlayers[i]].wins > topWins) {
                topWins = seasonStats[seasonId][registeredPlayers[i]].wins;
                topWinner = registeredPlayers[i];
            }
        }

        emit SeasonEnded(seasonId, topWinner, topWins);
    }

    // MED-3: Get player stats for a specific season (off-chain sorted)
    function getSeasonStats(uint256 seasonId, address player) external view returns (SeasonStats memory) {
        return seasonStats[seasonId][player];
    }

    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return playerStats[player];
    }

    function totalPlayers() external view returns (uint256) {
        return registeredPlayers.length;
    }

    function getRegisteredPlayers() external view returns (address[] memory) {
        return registeredPlayers;
    }
}
