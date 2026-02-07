import { ethers } from "ethers";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

// Contract ABIs (minimal needed)
const TRACKER_ABI = [
    "event ShipmentDelivered(string shipmentId, address seller)"
];

const PLASMA_RELAYER_ABI = [
    "function releaseFunds(string memory orderId) external"
];

async function main() {
    console.log("🤖 Starting Relayer Bot...");

    // 1. Setup Flare Provider (Reader)
    const flareProvider = new ethers.JsonRpcProvider("https://coston2-api.flare.network/ext/C/rpc");
    const trackerAddress = "0xb0cfb3b6cf85c585532bd5f1ad20A49D89993233"; // From HACKATHON_CONTEXT
    const shipmentTracker = new ethers.Contract(trackerAddress, TRACKER_ABI, flareProvider);

    // 2. Setup Plasma Provider (Writer)
    const plasmaProvider = new ethers.JsonRpcProvider("https://testnet-rpc.plasma.to"); // Update if different
    const privateKey = process.env.RELAYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("Missing RELAYER_PRIVATE_KEY or PRIVATE_KEY in .env");
    }
    const relayerWallet = new ethers.Wallet(privateKey, plasmaProvider);

    // TODO: Update with deployed PlasmaPaymentRelayer address
    const plasmaRelayerAddress = "0xDCd1F0747C2e7820a9C6F128E6E3571B79D2Ed85";
    const plasmaRelayer = new ethers.Contract(plasmaRelayerAddress, PLASMA_RELAYER_ABI, relayerWallet);

    console.log(`📡 Listening for events on ShipmentTracker (${trackerAddress}) on Flare Coston2...`);

    // 3. Listen for Events
    shipmentTracker.on("ShipmentDelivered", async (shipmentId, seller, event) => {
        console.log(`\n🎉 EVENT DETECTED: ShipmentDelivered`);
        console.log(`   Shipment ID: ${shipmentId}`);
        console.log(`   Seller: ${seller}`);
        console.log(`   Tx Hash: ${event.log.transactionHash}`);

        try {
            console.log(`🚀 Relaying release command to Plasma chain...`);
            const tx = await plasmaRelayer.releaseFunds(shipmentId);
            console.log(`⏳ Transaction sent: ${tx.hash}`);
            await tx.wait();
            console.log(`✅ Funds Released on Plasma!`);
        } catch (error) {
            console.error(`❌ Relay Failed:`, error);
        }
    });

    // Keep process alive
    process.stdin.resume();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
