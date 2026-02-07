# Verifiable B2B Commerce (Flare + Plasma)

**Hackathon Submission: ETHOxford 2026**

This project demonstrates a **Verifiable B2B Commerce Primitive** that bridges off-chain logistics data with on-chain payments using **Flare's Data Connector (FDC)**.

It solves the "Cash on Delivery" trust problem by using a smart escrow system that only releases funds when the shipment status is strictly verified by the FDC attestation mechanism.

## 🚀 Key Features

*   **Smart Escrow (`PlasmaPayment.sol` & `PlasmaPaymentUSDT.sol`)**: secure payment logic that locks funds until conditions are met. (Supports Native C2FLR & Stablecoins).
*   **Data Verification (`ShipmentTracker.sol`)**: A tracker that requests and verifies off-chain attestation data via Flare's FDC.
*   **Live Simulation Backend**: A TypeScript service simulating the real-world flow of `Order -> Shipment -> Attestation`.

## 🔗 Deployed Contracts (Coston2 Testnet)

| Contract | Address |
|---|---|
| **ShipmentTracker** | `0xDCd1F0747C2e7820a9C6F128E6E3571B79D2Ed85` |
| **PlasmaPayment** (Native) | `0xa9fe73d102fE4A7bFa0B68a9E4c2f38fe9FA57c9` |
| **PlasmaPaymentUSDT** (Stablecoin) | `0x6dBd653b44476bE6D1A7F2c4129613127f93F2F0` |

Verified on [Coston2 Explorer](https://coston2-explorer.flare.network/).

## 🛠️ Project Structure

*   `contracts/`: Solidity smart contracts.
    *   `ShipmentTracker.sol`: Manages shipment lifecycle and FDC requests.
    *   `PlasmaPayment.sol`: Handles native token payment escrow.
    *   `PlasmaPaymentUSDT.sol`: **NEW**: Handles USDT stablecoin escrow (Plasma Track).
*   `backend/`: TypeScript backend services.
    *   `backend/flare/shipping.ts`: Service for interacting with the ShipmentTracker.
    *   `backend/flare/fxOracle.ts`: Service for fetching oracle FX rates.
*   `scripts/`: Deployment and simulation scripts.
    *   `simulate_live.ts`: Simulator for Native C2FLR flow.
    *   `simulate_usdt.ts`: **Simulator for Stablecoin USDT flow.**

## 🏃 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Configuration
Ensure you have a `.env` file with your `PRIVATE_KEY` and `COSTON2_RPC_URL` (optional).

### 3. Run Live Simulation (USDT Stablecoin Flow)
Execute the B2B flow required for the Plasma Track:

```bash
npx hardhat run scripts/simulate_usdt.ts --network coston2
```

**What this does:**
1.  Connects to your wallet (checks USDT0 balance).
2.  **Approves** the Payment Contract (ERC20 Approve).
3.  **Locks 1.00 USDT** in Escrow (`createOrder`).
4.  **Creates Shipment** & **Requests Attestation** from Flare FDC.

### 4. Verify on Explorer
Check your wallet address on the [Coston2 Explorer](https://coston2-explorer.flare.network/) to see the transaction history (Approve, Order, Shipment).

## 📚 Architecture

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for a detailed breakdown of the interaction flow.
