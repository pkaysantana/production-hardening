<p align="center">
  <img src="docs/logo.jpeg" alt="Magma Marketplace Logo" width="300"/>
</p>

# Magma Marketplace: Verified B2B Commerce

![Status](https://img.shields.io/badge/Status-Hackathon_MVP-fire) ![Settlement](https://img.shields.io/badge/Settlement-Plasma-blue) ![Truth](https://img.shields.io/badge/Truth-Flare-red) ![Bridge](https://img.shields.io/badge/Bridge-TypeScript-yellow) ![Interface](https://img.shields.io/badge/Interface-React-cyan)

> **"Liquid Capital. Solid Truth."**
>
> Magma is a Trustless Commerce Primitive that burns the middleman by bridging **Plasma's** zero-gas settlement with **Flare's** decentralised data verification.

---

## 🌍 The Problem: The $2.5 Trillion Gap

Global trade is bifurcated:
*   **Multinationals** get Letters of Credit (LCs).
*   **SMEs** get rejected (40% rejection rate).

Magma solves this by replacing the bank with code. We allow solvent SMEs to prove delivery via **Flare Data Connector (FDC)** and get paid instantly via **Plasma**, creating a "Verified Commerce" layer for the internet.

---

## � The Magma Architecture Stack

**"Money 2.0" Thesis:** We don't use a monolithic chain. We use specialised layers for specialised tasks.

### 1. The Settlement Layer (Liquid)
*   **Network:** Plasma Testnet (Chain ID 9746)
*   **Role:** Stablecoin Liquidity & Payments
*   **Tech:** Solidity, OpenZeppelin
*   **Why:** Zero-Gas functionality via native Paymasters.

### 2. The Truth Layer (Solid)
*   **Network:** Flare Coston2 (Chain ID 114)
*   **Role:** Decentralised Data Verification (FDC)
*   **Tech:** Flare Data Connector, Solidity
*   **Why:** The only decentralised oracle capable of proving real-world API states.

### 3. The Infrastructure Layer (The Bridge)
*   **Role:** Relayer Bot (Cross-chain event listening)
*   **Tech:** TypeScript, Ethers.js v6, Node.js
*   **Why:** Orchestrates the atomic swap between Truth (Flare) and Settlement (Plasma). *This is the complex nervous system of the app.*

### 4. The Interface Layer
*   **Role:** Client Dashboard
*   **Tech:** React, Vite, Privy (Auth), Supabase (Data)
*   **Why:** Embedded wallet experience for seamless B2B onboarding.

---

## 🚀 Quick Start

### Prerequisites
*   Node.js v18+
*   Metamask / Rabby Wallet
*   `Coston2` (Flare Testnet) ETH for gas.

### 1. Installation
```bash
git clone https://github.com/orlandoalexander/ethoxford-2026.git
cd ethoxford-2026
npm install
```

### 2. Run the Live Simulation (Command Line)
Simulate a full B2B lifecycle (Order -> Shipping -> FDC Verification -> Payout) entirely from the terminal:

```bash
# Run the USDT Stablecoin Flow
npx hardhat run scripts/simulate_usdt.ts --network coston2
```

**What happens:**
1.  **Escrow:** Locks 1.00 MockUSDT in the contract.
2.  **Shipment:** Simulates a FedEx "Delivered" event.
3.  **Attestation:** Requests Flare FDC to verify the event.
4.  **Payout:** Releases funds to the Seller.

### 3. Run the Frontend Dashboard
Interact with the UI via Privy + Wagmi:

```bash
cd app
npm install
npm run dev
```
Open `http://localhost:5173` to see the "Magma Dashboard."

---

## 🔗 Deployed Contracts (Coston2 Testnet)

| Contract | Address | Function |
|---|---|---|
| **ShipmentTracker** | `0xDCd1F0747C2e7820a9C6F128E6E3571B79D2Ed85` | Manages Shipment State & FDC |
| **PlasmaPayment** | `0xa9fe73d102fE4A7bFa0B68a9E4c2f38fe9FA57c9` | Native Token Escrow |
| **PlasmaPaymentERC20** | `0xec83F0D1b321152916a4040dC4EB7F75204000aA` | **Stablecoin Escrow (Main Demo)** |
| **FXSettlement** | `0x65162419E7312cE9Eb8f7107E7C2676360A226c2` | **FTSO-Powered FX Rate Locking** |
| **DeliveryRegistry** | *Run `npx hardhat run scripts/deploy-delivery-registry.ts`* | Verifies FDC Proofs |

> **Setup Note:** After deploying `DeliveryRegistry`, update your `.env` with `VITE_DELIVERY_REGISTRY_ADDRESS=<your_address>`.

## 💎 Project Structure

```bash
├── app/                      # Frontend (React/Vite/Privy)
├── backend/                  # Off-Chain Services
│   ├── flare/                # FDC & Oracle Services
│   ├── plasma/               # Payment Relayer Logic
│   └── services/             # Core Infrastructure
├── contracts/                # Solidity Smart Contracts (Flat Structure)
│   ├── interfaces/           # Interfaces (IFlareDataConnector.sol)
│   ├── PlasmaPayment.sol     # Core Escrow Logic
│   ├── ShipmentTracker.sol   # FDC Verification Logic
│   ├── DeliveryRegistry.sol  # Registry Logic
│   └── ... (Mocks & V2 Contracts)
├── scripts/                  # DevOps & Automation (Flat Structure)
│   ├── deploy_*.ts           # Deployment Scripts
│   ├── simulate_*.ts         # End-to-End Simulations
│   └── debug_*.ts            # Troubleshooting Tools
└── docs/                     # Documentation & Pitch Deck
```