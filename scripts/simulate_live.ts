import { ethers } from "hardhat";
import { getFxRate } from "../backend/flare/fxOracle";
import { createShipmentOnChain, requestAttestationOnChain } from "../backend/flare/shipping";

async function main() {
    // --- Configuration ---
    const TRACKER_ADDRESS = "0xDCd1F0747C2e7820a9C6F128E6E3571B79D2Ed85";
    const PAYMENT_ADDRESS = "0xa9fe73d102fE4A7bFa0B68a9E4c2f38fe9FA57c9";

    console.log("--- Starting Live Simulation on Flare Coston2 ---");

    // 1. Setup
    const [signer] = await ethers.getSigners();
    console.log(`Acting as: ${signer.address}`);

    const shipmentTracker = await ethers.getContractAt("ShipmentTracker", TRACKER_ADDRESS);
    const plasmaPayment = await ethers.getContractAt("PlasmaPayment", PAYMENT_ADDRESS);

    // 2. Data Generation
    const shipmentId = "SHIP-" + Math.floor(Math.random() * 1000000);
    const orderAmount = ethers.parseEther("0.01"); // 0.01 C2FLR

    // Use the backend Oracle service
    const fxRate = await getFxRate("USDT/C2FLR");

    console.log(`\nGenerated Shipment ID: ${shipmentId}`);
    console.log(`Oracle FX Rate: ${fxRate}`);

    // 3. Create Shipment (using Backend Service)
    console.log(`\n[1/3] Creating Shipment on Tracker...`);
    await createShipmentOnChain(shipmentTracker, shipmentId, signer.address);
    console.log("Shipment Created Successfully!");

    // 4. Create Order (Escrow) - Direct contract call as this is the financial "Frontend" action
    console.log(`\n[2/3] Creating Order and Locking Funds on PlasmaPayment...`);
    const tx2 = await plasmaPayment.createOrder(
        signer.address,
        shipmentId,
        orderAmount,
        fxRate,
        { value: orderAmount }
    );
    console.log(`Transaction sent: ${tx2.hash}`);
    await tx2.wait();
    console.log(`Funds Escrowed (${ethers.formatEther(orderAmount)} C2FLR)!`);

    // 5. Request Attestation (using Backend Service)
    console.log(`\n[3/3] Requesting Attestation via Tracker...`);
    await requestAttestationOnChain(shipmentTracker, shipmentId);
    console.log("Attestation Requested!");

    console.log("\n--- Simulation Complete! ---");
    console.log(`View transactions on Explorer: https://coston2-explorer.flare.network/address/${signer.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
