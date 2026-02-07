import { ethers, Contract } from "ethers";

/**
 * Service to handle shipping related on-chain interactions.
 */

export async function createShipmentOnChain(
    trackerContract: Contract,
    shipmentId: string,
    receiver: string
): Promise<string> {
    console.log(`[Backend] Creating shipment ${shipmentId} for receiver ${receiver}...`);

    const tx = await trackerContract.createShipment(shipmentId, receiver);
    await tx.wait();

    console.log(`[Backend] Shipment created. Tx: ${tx.hash}`);
    return tx.hash;
}

export async function requestAttestationOnChain(
    trackerContract: Contract,
    shipmentId: string
): Promise<string> {
    console.log(`[Backend] Requesting attestation for ${shipmentId}...`);

    const tx = await trackerContract.requestAttestation(shipmentId);
    await tx.wait();

    console.log(`[Backend] Attestation requested. Tx: ${tx.hash}`);
    return tx.hash;
}
