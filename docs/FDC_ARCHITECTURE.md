# Flare Data Connector (FDC) Architecture

## Overview

The Flare Data Connector (FDC) provides the decentralized trust anchor for **ShipmentTrackerV2**. It allows the smart contract to verify off-chain data (specifically logistics API responses) without relying on a centralized oracle or the contract deployer.

## Latency as a Security Feature

In **ShipmentTrackerV2**, the delay between a delivery event and its on-chain verification is **intentional and necessary**.

1.  **Attestation Request**: A user or automated service requests an attestation for a specific shipment.
2.  **Voting Round**: Independent data providers on the Flare Network observe the request and query the underlying logistics API (e.g., DHL, FedEx).
3.  **Consensus**: Providers submit their results. A consensus is reached on the correct state (Delivered/Not Delivered).
4.  **Merkle Root Publication**: The FDC protocol publishes a Merkle root containing the proven facts for that round.
5.  **Verification**: The `verifyDelivery` function in `ShipmentTrackerV2` validates a specific proof against the published Merkle root.

**This process takes minutes, not seconds.** This latency ensures that the data is secured by the full economic stake of the Flare validators, making it immutable and avoiding "flash" manipulation of data states.

## Implementation Details

### `ShipmentTrackerV2.sol`

-   **`verifyDelivery`**: The *only* function allowed to transition a shipment to `Status.Delivered`. It calls `IFlareDataConnector.verifyMerkleProof`.
-   **`updateStatus`**: Restricted. It cannot be used to manually set `Status.Delivered`. attempts to do so will revert.

### `MockFlareDataConnector.sol`

-   Used **strictly for testing and demos** where deterministic, instant feedback is required.
-   **MUST NOT** be used in production deployments where verified reliability is required.

## Production Flow

1.  **Carrier API** says "Delivered".
2.  **dApp Client** sees status change and calls `requestAttestation` on-chain (or an off-chain cron job does this).
3.  **Flare Network** runs consensus (approx. 3-5 minutes).
4.  **dApp Client** obtains the specific Merkle Proof for the delivery fact.
5.  **dApp Client** calls `verifyDelivery` with the proof.
6.  **Funds Released**: `FXSettlement` or `PlasmaPayment` releases funds based on the verified `Delivered` status.
