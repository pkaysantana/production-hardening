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
<<<<<<< HEAD
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
=======
});

const config: HardhatUserConfig = {
    solidity: "0.8.20",
    networks: {
        coston2: {
            url: process.env.COSTON2_RPC_URL || "https://coston2-api.flare.network/ext/C/rpc",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 114,
        },
        plasmaTestnet: {
            url: process.env.PLASMA_RPC_URL || "https://testnet-rpc.plasma.to",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 9746,
        },
    },
    etherscan: {
        apiKey: {
            coston2: "flare",
            plasmaTestnet: "plasma", // Dummy key
        },
        customChains: [
            {
                network: "coston2",
                chainId: 114,
                urls: {
                    apiURL: "https://coston2-explorer.flare.network/api",
                    browserURL: "https://coston2-explorer.flare.network",
                },
            },
            {
                network: "plasmaTestnet",
                chainId: 9746,
                urls: {
                    apiURL: "https://explorer.plasma.to/api",
                    browserURL: "https://explorer.plasma.to",
                },
            },
        ],
    },
    sourcify: {
        enabled: false,
    },
};

export default config;
>>>>>>> 3b62e20654a84d1b2785072dc0e7969f5f2da691
