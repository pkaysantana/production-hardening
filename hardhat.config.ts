require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    plasmaTestnet: {
      url: process.env.RPC_URL,
      chainId: 9746,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 1000000000, // 1 gwei
    }
  },
  etherscan: {
    apiKey: {
      plasmaTestnet: process.env.ETHERSCAN_API_KEY
    },
    customChains: [
      {
        network: "plasmaTestnet",
        chainId: 9746,
        urls: {
          apiURL: "https://testnet.plasmascan.to/api",
          browserURL: "https://testnet.plasmascan.to/"
        }
      }
    ]
  }
};
