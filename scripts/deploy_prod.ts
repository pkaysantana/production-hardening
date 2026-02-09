import { ethers } from "hardhat";

async function main() {
    console.log("Starting Production Deployment...");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // 1. Deploy ShipmentTracker
    // In production, this might be a single global instance.
    const ShipmentTracker = await ethers.getContractFactory("ShipmentTracker");
    const shipmentTracker = await ShipmentTracker.deploy();
    await shipmentTracker.waitForDeployment();
    console.log("ShipmentTracker deployed to:", await shipmentTracker.getAddress());

    // 2. Mock FDC (For Testnet/Dev, in prod use real address)
    // const FDC_ADDRESS = "0x..."; // Real FDC address
    // For now, deploying mock for demonstration if not provided
    let fdcAddress = process.env.FDC_ADDRESS;
    if (!fdcAddress) {
        console.log("No FDC_ADDRESS provided, deploying MockFDC...");
        const MockFDC = await ethers.getContractFactory("MockFlareDataConnector");
        const mockFDC = await MockFDC.deploy();
        await mockFDC.waitForDeployment();
        fdcAddress = await mockFDC.getAddress();
        console.log("MockFDC deployed to:", fdcAddress);
    }

    // 3. Deploy PlasmaPayment (Native ETH)
    const PlasmaPayment = await ethers.getContractFactory("PlasmaPayment");
    const plasmaPayment = await PlasmaPayment.deploy(fdcAddress, await shipmentTracker.getAddress());
    await plasmaPayment.waitForDeployment();
    console.log("PlasmaPayment (Native) deployed to:", await plasmaPayment.getAddress());

    // 4. Deploy PlasmaPaymentERC20 (Stablecoin)
    // const USDT_ADDRESS = "0x..."; // Real USDT address
    let usdtAddress = process.env.USDT_ADDRESS;
    if (!usdtAddress) {
        console.log("No USDT_ADDRESS provided, deploying MockUSDT...");
        const MockUSDT = await ethers.getContractFactory("MockUSDT");
        const mockUSDT = await MockUSDT.deploy();
        await mockUSDT.waitForDeployment();
        usdtAddress = await mockUSDT.getAddress();
        console.log("MockUSDT deployed to:", usdtAddress);
    }

    const PlasmaPaymentERC20 = await ethers.getContractFactory("PlasmaPaymentERC20");
    const plasmaPaymentERC20 = await PlasmaPaymentERC20.deploy(
        fdcAddress,
        await shipmentTracker.getAddress(),
        usdtAddress
    );
    await plasmaPaymentERC20.waitForDeployment();
    console.log("PlasmaPaymentERC20 deployed to:", await plasmaPaymentERC20.getAddress());

    console.log("Deployment Complete! 🚀");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
