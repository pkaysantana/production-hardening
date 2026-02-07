// src/lib/blockchain/marketplaceActions.js
import { ethers } from "ethers";
import { MARKETPLACE_ADDRESS } from "./marketplaceConfig";
import { marketplaceAbi } from "./marketplaceAbi";

export async function createEscrowForOrder(
  wallet,
  orderId,        // Supabase UUID string
  sellerAddress,
  deadlineSeconds
) {
  const ethProvider = await wallet.getEthereumProvider();
  const provider = new ethers.BrowserProvider(ethProvider);
  const signer = await provider.getSigner();

  const marketplace = new ethers.Contract(
    MARKETPLACE_ADDRESS,
    marketplaceAbi,
    signer
  );

  const orderIdBytes32 = ethers.keccak256(
    ethers.toUtf8Bytes(orderId)
  );

  const tx = await marketplace.createEscrowForOrder(
    orderIdBytes32,
    sellerAddress,
    deadlineSeconds
  );

  const receipt = await tx.wait();

  // grab escrow address from event
  // grab escrow address from event (ONLY Marketplace logs)
  const event = receipt.logs
    .filter(log => log.address.toLowerCase() === MARKETPLACE_ADDRESS.toLowerCase())
    .map(log => {
      try {
        return marketplace.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find(e => e?.name === "EscrowCreated");

  if (!event) throw new Error("EscrowCreated event not found");

  return event.args.escrow;

}