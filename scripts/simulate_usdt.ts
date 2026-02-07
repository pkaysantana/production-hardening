import { ethers } from "hardhat";
import { getFxRate } from "../backend/flare/fxOracle";

async function main() {
    // --- Configuration ---
    const USDT_ADDRESS = "0xC1A5B41512496B80903D1f32d6dEa3a73212E71F";
    const PAYMENT_USDT_ADDRESS = "0xec83F0D1b321152916a4040dC4EB7F75204000aA";
    const TRACKER_ADDRESS = "0xDCd1F0747C2e7820a9C6F128E6E3571B79D2Ed85";

    // Minimal ERC20 ABI for Approve/Balance
    const ERC20_ABI = [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function balanceOf(address account) external view returns (uint256)",
        "function decimals() external view returns (uint8)"
    ];

    console.log("--- Starting USDT Live Simulation on Flare Coston2 ---");

    // 1. Setup
    const [signer] = await ethers.getSigners();
    console.log(`Acting as: ${signer.address}`);

    const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
    const plasmaPaymentERC20 = await ethers.getContractAt("PlasmaPaymentERC20", PAYMENT_USDT_ADDRESS);
    const shipmentTracker = await ethers.getContractAt("ShipmentTracker", TRACKER_ADDRESS);

    // 2. Check Balance
    const balance = await usdt.balanceOf(signer.address);
    const decimals = await usdt.decimals();
    console.log(`USDT Balance: ${ethers.formatUnits(balance, decimals)}`);

    if (balance === 0n) {
        console.error("❌ Error: You need USDTTest (USDT0) to run this simulation.");
        console.error("Please use the Flare Faucet: https://faucet.flare.network/coston2");
        return;
    }

    // 3. Data Generation
    const shipmentId = "USDT-SHIP-" + Math.floor(Math.random() * 1000000);
    const orderAmount = ethers.parseUnits("1.0", decimals); // 1.00 USDT
    const fxRate = await getFxRate("USDT/C2FLR"); // Mock Oracle

    console.log(`\nGenerated Shipment ID: ${shipmentId}`);
    console.log(`Order Amount: ${ethers.formatUnits(orderAmount, decimals)} USDT`);

    // 4. APPROVE USDT (Crucial Step for ERC20)
    console.log(`\n[1/4] Approving Payment Contract...`);
    const txApprove = await usdt.approve(PAYMENT_USDT_ADDRESS, orderAmount);
    console.log(`Approval Tx: ${txApprove.hash}`);
    await txApprove.wait();
    console.log("Approved!");

    // 5. Create Shipment (Tracker)
    console.log(`\n[2/4] Creating Shipment...`);
    const txShip = await shipmentTracker.createShipment(shipmentId, signer.address);
    await txShip.wait();
    console.log("Shipment On-Chain.");

    // 6. Create Order (Payment - Locks USDT)
    console.log(`\n[3/4] Creating Order & Locking USDT...`);
    const txOrder = await plasmaPaymentERC20.createOrder(
        signer.address,
        shipmentId,
        orderAmount,
        fxRate
    );
    console.log(`Order Tx: ${txOrder.hash}`);
    await txOrder.wait();
    console.log("USDT Locked in Escrow!");

    // 7. Request Attestation
    console.log(`\n[4/4] Requesting Attestation...`);
    const txAttest = await shipmentTracker.requestAttestation(shipmentId);
    await txAttest.wait();
    console.log("Attestation Requested.");

    console.log("\n--- USDT Simulation Complete! ---");
    console.log(`View on Explorer: https://coston2-explorer.flare.network/address/${signer.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
