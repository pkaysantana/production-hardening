import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { RelayerService } from "../backend/services/RelayerService";
import { Logger } from "../backend/services/logger";
import DeliveryRegistryABI from "../app/src/lib/blockchain/DeliveryRegistry.json";
import DeliveryEscrowArtifact from "../artifacts/contracts/DeliveryEscrowFDC.sol/DeliveryEscrowFDC.json";

dotenv.config();

const logger = new Logger("FDCAttester");

// Configuration
const SOURCE_RPC = process.env.PLASMA_RPC_URL || "https://testnet-rpc.plasma.to";
const DEST_RPC = process.env.DEST_RPC_URL || "";
const DEST_PRIVATE_KEY = process.env.DEST_PRIVATE_KEY || "";
const DELIVERY_REGISTRY_ADDRESS = "0xAfc8816E5B9924b11ac6666FA8186821238009cD";
const DELIVERY_ESCROW_ADDRESS = process.env.DELIVERY_ESCROW_ADDRESS || "";

async function main() {
  if (!DEST_RPC || !DEST_PRIVATE_KEY || !DELIVERY_ESCROW_ADDRESS) {
    logger.error("Missing DEST_RPC_URL, DEST_PRIVATE_KEY, or DELIVERY_ESCROW_ADDRESS in .env");
    process.exit(1);
  }

  // 1. Source Chain (Reader)
  const sourceProvider = new ethers.JsonRpcProvider(SOURCE_RPC);
  const sourceContract = new ethers.Contract(DELIVERY_REGISTRY_ADDRESS, DeliveryRegistryABI, sourceProvider);

  // 2. Destination Chain (Writer) - Use RelayerService
  const destRelayerService = new RelayerService(DEST_RPC, DEST_PRIVATE_KEY, "DestRelayer");
  const destEscrowContract = new ethers.Contract(
    DELIVERY_ESCROW_ADDRESS,
    DeliveryEscrowArtifact.abi,
    destRelayerService.getWallet()
  );

  const network = await sourceProvider.getNetwork();
  logger.info(`Connected to source chain: ${network.chainId}`);

  const currentBlock = await sourceProvider.getBlockNumber();
  const startBlock = Math.max(currentBlock - 100, 0); // Start looking back a bit

  logger.info(`Starting polling from block: ${startBlock} for DeliveryConfirmed events...`);

  // Use robust polling from RelayerService (adapting the interface slightly or just using the helper)
  // Since RelayerService.pollEvents is designed for this:

  await destRelayerService.pollEvents(
    sourceContract,
    "DeliveryConfirmed",
    startBlock,
    async (log, args) => {
      const orderId = args[0];
      logger.info(`Delivery confirmed on source chain`, { orderId, txHash: log.transactionHash });

      try {
        logger.info(`Confirming delivery on destination chain...`);
        await destRelayerService.retry(async () => {
          // 0x1234 is mocked attestation data
          const tx = await destEscrowContract.confirmDelivery("0x1234", orderId);
          logger.info(`confirmDelivery tx sent: ${tx.hash}`);
          const receipt = await tx.wait();
          logger.info(`✅ Payment released for order: ${orderId} in block ${receipt.blockNumber}`);
        });
      } catch (error) {
        logger.error(`Failed to confirm delivery on destination`, error);
      }
    }
  );
}

main().catch((error) => {
  logger.error("Fatal Error", error);
  process.exit(1);
});


