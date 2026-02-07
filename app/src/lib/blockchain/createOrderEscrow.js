// src/lib/blockchain/marketplaceActions.js
import { ethers } from "ethers";
import { MARKETPLACE_ADDRESS } from "./marketplaceConfig";
import { marketplaceAbi } from "./marketplaceAbi";

export async function createEscrowForOrder(
  wallet,
  orderId,        // Supabase UUID string
  sellerAddress,
  usdtAddress,
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
    usdtAddress,
    deadlineSeconds
  );

  const receipt = await tx.wait();

  // grab escrow address from event
  const event = receipt.logs
    .map(log => {
      try {
        return marketplace.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find(e => e?.name === "EscrowCreated");

  return event.args.escrow;
}