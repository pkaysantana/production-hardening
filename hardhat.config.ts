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
    paths: {
        tests: "./tests",
    },
    networks: {
        coston2: {
            url: process.env.COSTON2_RPC_URL || "https://coston2-api.flare.network/ext/C/rpc",
            chainId: 114,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
        flare: {
            url: process.env.FLARE_RPC_URL || "https://flare-api.flare.network/ext/C/rpc",
            chainId: 14,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
        plasmaTestnet: {
            url: process.env.PLASMA_RPC_URL || "https://testnet-rpc.plasma.io",
            chainId: 9746,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
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
