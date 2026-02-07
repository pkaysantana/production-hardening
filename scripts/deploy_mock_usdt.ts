import { ethers } from "hardhat";

async function main() {
    console.log("🪙 Deploying MockUSDT to Plasma Testnet...");

    const [deployer] = await ethers.getSigners();
    console.log(`📡 Deployer Address: ${deployer.address}`);

    // Deploy MockUSDT
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    const usdt = await MockUSDT.deploy();
    await usdt.waitForDeployment();

    const usdtAddress = await usdt.getAddress();
    console.log(`✅ MockUSDT deployed to: ${usdtAddress}`);

    // Verify initial balance
    const balance = await usdt.balanceOf(deployer.address);
    console.log(`💰 Deployer USDT Balance: ${ethers.formatUnits(balance, 18)} USDT`);

    console.log("\nNext Steps:");
    console.log("1. Update scripts/deploy_plasma_relayer.ts with this USDT address");
    console.log("2. Redeploy PlasmaPaymentRelayer");
    console.log("3. Update frontend config");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
