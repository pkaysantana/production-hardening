import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { RelayerService } from "../backend/services/RelayerService";
import { Logger, LogLevel } from "../backend/services/logger";
import { FDCService } from "../backend/services/FDCService";

dotenv.config();

const logger = new Logger("RelayerBot");
const fdcService = new FDCService();

// Contract ABIs
const TRACKER_ABI = [
    "event ShipmentDelivered(string shipmentId, address seller)",
    "function shipments(string shipmentId) external view returns (tuple(string shipmentId, address sender, address receiver, uint8 status, uint256 lastUpdated))"
];

const PLASMA_RELAYER_ABI = [
    "function releaseFunds(bytes32 orderId, bytes32[] calldata proof, bytes32 attestationType, bytes32 sourceId) external",
    "function orderIdByTrackingId(string calldata trackingId) external view returns (bytes32)"
];

async function main() {
    logger.info("🤖 Starting Relayer Bot...");

    const flareRpc = process.env.COSTON2_RPC_URL || "https://coston2-api.flare.network/ext/C/rpc";
    const plasmaRpc = process.env.PLASMA_RPC_URL || "https://testnet-rpc.plasma.io";
    const privateKey = process.env.RELAYER_PRIVATE_KEY || process.env.PRIVATE_KEY;

    if (!privateKey) {
        logger.error("Missing RELAYER_PRIVATE_KEY or PRIVATE_KEY in .env");
        process.exit(1);
    }

    // Initialize Services
    // 1. Flare (Read-Only listener) - We use standard provider here as we don't write to Flare
    const flareProvider = new ethers.JsonRpcProvider(flareRpc);
    const trackerAddress = "0xb0cfb3b6cf85c585532bd5f1ad20A49D89993233";
    const shipmentTracker = new ethers.Contract(trackerAddress, TRACKER_ABI, flareProvider);

    // 2. Plasma (Writer) - Use Robust Relayer Service
    const plasmaRelayerService = new RelayerService(plasmaRpc, privateKey, "PlasmaRelayer");
    const plasmaRelayerAddress = "0x6533AEdD2369a5583959B244bADd797eB7333818";
    const plasmaRelayerContract = new ethers.Contract(plasmaRelayerAddress, PLASMA_RELAYER_ABI, plasmaRelayerService.getWallet());

    logger.info(`📡 Listening for events on ShipmentTracker (${trackerAddress}) on Flare Coston2...`);

    // Use robust polling or standard listener with error boundary
    // For specific events, 'on' is usually okay if the provider auto-reconnects, 
    // but robust services often use polling. Let's stick to 'on' with a heartbeat for now 
    // or keep it simple but logged.

    shipmentTracker.on("ShipmentDelivered", async (shipmentId, seller, event) => {
        logger.info(`🎉 EVENT DETECTED: ShipmentDelivered`, { shipmentId, seller, txHash: event.log.transactionHash });

        try {
            logger.info(`🔍 Looking up Order ID for Shipment ${shipmentId}...`);
            const orderId = await plasmaRelayerContract.orderIdByTrackingId(shipmentId);

            if (orderId === ethers.ZeroHash) {
                logger.warn(`⚠️ No matching Order ID found for Shipment ${shipmentId}. Skipping relay.`);
                return;
            }

            logger.info(`🚀 Relaying release command for Order ${orderId}...`);

            // Fetch Proof via FDC Service
            const attestation = await fdcService.getAttestation(shipmentId);

            if (!attestation) {
                logger.error(`❌ Failed to get attestation for ${shipmentId}`);
                return;
            }

            // Use retry mechanism from service
            const receipt = await plasmaRelayerService.retry(async () => {
                const feeData = await plasmaRelayerService.getProvider().getFeeData();
                const tx = await plasmaRelayerContract.releaseFunds(
                    orderId,
                    attestation.merkleProof,
                    attestation.attestationType,
                    attestation.sourceId,
                    {
                        maxFeePerGas: feeData.maxFeePerGas ? (feeData.maxFeePerGas * 120n) / 100n : undefined,
                        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? (feeData.maxPriorityFeePerGas * 120n) / 100n : undefined
                    }
                );
                logger.info(`⏳ Transaction sent: ${tx.hash}`);
                return await tx.wait();
            });

            logger.info(`✅ Funds Released on Plasma! Block: ${receipt.blockNumber}`);
        } catch (error) {
            logger.error(`❌ Relay Failed`, error);
        }
    });

    // Keep process alive
    process.stdin.resume();
}

main().catch((error) => {
    logger.error("Fatal Error", error);
    process.exit(1);
});
