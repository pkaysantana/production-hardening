import { ethers } from "hardhat";

async function main() {
    console.log("🚀 Deploying Plasma Relayer (Backend Mode)...");

    const [deployer] = await ethers.getSigners();
    console.log(`📡 Using Deployer (Relayer) Address: ${deployer.address}`);

    // PLASMA TESTNET USDT ADDRESS
    // TODO: Replace with the actual Plasma Testnet USDT address or ask user.
    // For now, using a placeholder/zero address to deploy.
    // NOTE: If using Zero Address, transfers will fail until updated or redeployed with correct address.
    const USDT_ADDRESS = "0xa9fe73d102fE4A7bFa0B68a9E4c2f38fe9FA57c9"; // MockUSDT deployed



    const PlasmaPaymentRelayer = await ethers.getContractFactory("PlasmaPaymentRelayer");

    // Deploy: _relayer = deployer, _usdt = USDT_ADDRESS
    const relayerContract = await PlasmaPaymentRelayer.deploy(deployer.address, USDT_ADDRESS);

    await relayerContract.waitForDeployment();
    const address = await relayerContract.getAddress();

    console.log(`✅ PlasmaPaymentRelayer deployed to: ${address}`);
    console.log(`🔑 Relayer Address set to: ${deployer.address}`);
    console.log(`💰 USDT Address set to: ${USDT_ADDRESS}`);

    console.log("\nNext Steps:");
    console.log("1. Verify contract on Plasma Explorer (if available).");
    console.log("2. Update HACKATHON_CONTEXT.md with the new address.");
    console.log("3. Update scripts/relayer_bot.ts with this address.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
