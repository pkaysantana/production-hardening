import * as dotenv from "dotenv";
dotenv.config();

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
        const balance = await hre.ethers.provider.getBalance(account.address);
        // Use formatEther for readability
        console.log(`Balance: ${hre.ethers.formatEther(balance)} CFLR`);
    }
});

const config: HardhatUserConfig = {
    solidity: "0.8.20",
    networks: {
        coston2: {
            url: process.env.COSTON2_RPC_URL || "https://coston2-api.flare.network/ext/C/rpc",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 114,
        },
    },
    etherscan: {
        apiKey: {
            coston2: "flare", // Dummy key
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
        ],
    },
    sourcify: {
        enabled: false,
    },
};

export default config;
