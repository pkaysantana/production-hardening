import { ethers } from "ethers";
import DeliveryRegistryABI from "../app/src/lib/blockchain/DeliveryRegistry.json";
import DeliveryEscrowArtifact from "../artifacts/contracts/DeliveryEscrowFDC.sol/DeliveryEscrowFDC.json";

const PROVIDER = new ethers.JsonRpcProvider(
  "https://testnet-rpc.plasma.to"
);

const DELIVERY_REGISTRY =
  "0xAfc8816E5B9924b11ac6666FA8186821238009cD";

const iface = new ethers.Interface(DeliveryRegistryABI);


const DEST_PROVIDER = new ethers.JsonRpcProvider(
  process.env.DEST_RPC_URL!
);

const DEST_SIGNER = new ethers.Wallet(
  process.env.DEST_PRIVATE_KEY!,
  DEST_PROVIDER
);

const DELIVERY_ESCROW = new ethers.Contract(
  process.env.DELIVERY_ESCROW_ADDRESS!,
  DeliveryEscrowArtifact.abi,
  DEST_SIGNER
);


async function confirmDeliveryOnChain(orderId: string) {
  console.log("Confirming delivery on destination chain...");

  const tx = await DELIVERY_ESCROW.confirmDelivery(
    "0x1234",   // mocked FDC attestation data (OK for now)
    orderId
  );

  console.log("confirmDelivery tx:", tx.hash);
  await tx.wait();

  console.log("✅ Payment released for order:", orderId);
}



async function main() {
  const network = await PROVIDER.getNetwork();
  console.log("Connected to chain:", network.chainId);

  const current = await PROVIDER.getBlockNumber();
  let lastBlock = Math.max(current - 20, 0);

  console.log("Starting from block:", lastBlock);
  console.log("Polling for DeliveryConfirmed...");

  setInterval(async () => {
    const currentBlock = await PROVIDER.getBlockNumber();
    if (currentBlock <= lastBlock) return;

    const logs = await PROVIDER.getLogs({
      address: DELIVERY_REGISTRY,
      fromBlock: lastBlock + 1,
      toBlock: currentBlock,
    });

    for (const log of logs) {
      try {
        const parsed = iface.parseLog(log);
        if (!parsed) continue;

        if (parsed.name === "DeliveryConfirmed") {
          const orderId = parsed.args[0];

          console.log("Delivery confirmed on source chain");
          console.log("orderId:", orderId);
          console.log("txHash:", log.transactionHash);
          console.log("block:", log.blockNumber);

          await confirmDeliveryOnChain(orderId);
        }
      } catch {
        
      }
    }

    lastBlock = currentBlock;
  }, 3000);
}

main().catch(console.error);


