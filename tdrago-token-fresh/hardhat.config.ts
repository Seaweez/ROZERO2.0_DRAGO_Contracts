import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000000";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.22",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    bscTestnet: {
      url: process.env.BSC_TESTNET_URL || "https://bsc-testnet.publicnode.com",
      accounts: [PRIVATE_KEY],
    },
    bsc: {
      url: process.env.BSC_MAINNET_URL || "https://bsc-dataseed.binance.org/",
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: process.env.BSCSCAN_API_KEY || "",
  },
};

export default config;