import { ethers } from "hardhat";

async function main() {
    console.log("🚀 Deploying V2 Stack (FDC Real Mode)...");

    // 1. Get FDC Address (or default to Coston2 standard)
    const FDC_ADDRESS = process.env.FDC_ADDRESS || '0x1000000000000000000000000000000000000001';
    console.log(`📡 Using FDC Address: ${FDC_ADDRESS}`);

    // 2. Deploy ShipmentTrackerV2
    const ShipmentTrackerV2 = await ethers.getContractFactory("ShipmentTrackerV2");
    const tracker = await ShipmentTrackerV2.deploy(FDC_ADDRESS);
    await tracker.waitForDeployment();
    const trackerAddress = await tracker.getAddress();
    console.log(`✅ ShipmentTrackerV2 deployed to: ${trackerAddress}`);

    // 3. Deploy PlasmaPaymentUSDT (linked to V2 Tracker)
    // Note: We need a valid USDT address for Coston2. 
    // From HACKATHON_CONTEXT.md: 0x726839D54FB18E40b15392e276082A81D230F872
    const USDT_ADDRESS = ethers.getAddress("0x726839D54FB18E40b15392e276082A81D230F872");

    // NOTE: Using 'PlasmaPaymentERC20' artifact as 'PlasmaPaymentUSDT' wasn't found in file list.
    const PlasmaPaymentUSDT = await ethers.getContractFactory("PlasmaPaymentERC20");
    const payment = await PlasmaPaymentUSDT.deploy(FDC_ADDRESS, trackerAddress, USDT_ADDRESS);
    await payment.waitForDeployment();
    const paymentAddress = await payment.getAddress();
    console.log(`✅ PlasmaPaymentUSDT deployed to: ${paymentAddress}`);

    console.log("\nDeployment Complete! Don't forget to update HACKATHON_CONTEXT.md");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
