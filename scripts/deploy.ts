import { ethers } from "hardhat";

async function main() {
    console.log("Starting deployment to Flare Coston2...");

    // 1. Deploy ShipmentTracker
    const ShipmentTracker = await ethers.getContractFactory("ShipmentTracker");
    const shipmentTracker = await ShipmentTracker.deploy();
    await shipmentTracker.waitForDeployment();
    const shipmentTrackerAddress = await shipmentTracker.getAddress();

    console.log(`ShipmentTracker deployed to: ${shipmentTrackerAddress}`);

    // 2. Deploy PlasmaPayment
    // Coston2 State Connector Address
    const FDC_ADDRESS = "0x10000000i 00000000000000000000000000000001";

    const PlasmaPayment = await ethers.getContractFactory("PlasmaPayment");
    const plasmaPayment = await PlasmaPayment.deploy(FDC_ADDRESS, shipmentTrackerAddress);
    await plasmaPayment.waitForDeployment();
    const plasmaPaymentAddress = await plasmaPayment.getAddress();

    console.log(`PlasmaPayment deployed to: ${plasmaPaymentAddress}`);

    // 3. Authorize PlasmaPayment in ShipmentTracker
    console.log("Authorizing PlasmaPayment to update ShipmentTracker...");
    const tx = await shipmentTracker.setAuthorizedUpdater(plasmaPaymentAddress, true);
    await tx.wait();

    console.log("Authorization complete.");

    console.log("\nDeployment Summary:");
    console.log("-------------------");
    console.log("ShipmentTracker:", shipmentTrackerAddress);
    console.log("PlasmaPayment:  ", plasmaPaymentAddress);
    console.log("FDC Address:    ", FDC_ADDRESS);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
