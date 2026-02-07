import { ethers } from "hardhat";

async function main() {
    console.log("Starting USDT Payment Deployment to Flare Coston2...");

    // Addresses from Context
    const FDC_ADDRESS = "0x1000000000000000000000000000000000000001";
    const USDT_ADDRESS = "0xC1A5B41512496B80903D1f32d6dEa3a73212E71F";
    const TRACKER_ADDRESS = "0xDCd1F0747C2e7820a9C6F128E6E3571B79D2Ed85"; // From previous deployment

    console.log(`FDC:     ${FDC_ADDRESS}`);
    console.log(`USDT:    ${USDT_ADDRESS}`);
    console.log(`Tracker: ${TRACKER_ADDRESS}`);

    // Deploy PlasmaPaymentERC20 (Generic)
    const PlasmaPaymentERC20 = await ethers.getContractFactory("PlasmaPaymentERC20");
    const plasmaPayment = await PlasmaPaymentERC20.deploy(FDC_ADDRESS, TRACKER_ADDRESS, USDT_ADDRESS);

    await plasmaPayment.waitForDeployment();
    const paymentAddress = await plasmaPayment.getAddress();

    console.log(`\nPlasmaPaymentERC20 deployed to: ${paymentAddress}`);

    // Authorize in Tracker (Optional but good practice if we want status updates back)
    // Note: We need the private key that deployed Tracker to do this.
    // const shipmentTracker = await ethers.getContractAt("ShipmentTracker", TRACKER_ADDRESS);
    // console.log("Authorizing PlasmaPaymentUSDT in ShipmentTracker...");
    // await shipmentTracker.setAuthorizedUpdater(address, true);
    // console.log("Authorization complete.");

    console.log("\nDeployment Summary:");
    console.log("-------------------");
    console.log("PlasmaPaymentERC20:", paymentAddress);
    console.log("\nVerify with:");
    console.log(`npx hardhat verify --network coston2 ${paymentAddress} ${FDC_ADDRESS} ${TRACKER_ADDRESS} ${USDT_ADDRESS}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
