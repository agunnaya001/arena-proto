require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
// The Etherscan v2 multichain API key works for Basescan as well, so accept either name.
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || process.env.ETHERSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: "cancun",
        },
      },
      {
        // Used for verifying user-supplied deployed contracts under contracts/deployed/*
        version: "0.8.25",
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: "cancun",
        },
      },
    ],
  },
  networks: {
    base: {
      url: "https://mainnet.base.org",
      accounts: [`0x${PRIVATE_KEY.replace(/^0x/, "")}`],
      chainId: 8453,
    },
    "base-sepolia": {
      url: "https://sepolia.base.org",
      accounts: [`0x${PRIVATE_KEY.replace(/^0x/, "")}`],
      chainId: 84532,
    },
    hardhat: {
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: {
      base: BASESCAN_API_KEY,
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts-hardhat",
    scripts: "./hardhat-scripts",
  },
};
