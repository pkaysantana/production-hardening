# HACKATHON CONTEXT: Verifiable B2B Commerce (Flare + Plasma)

## 🎯 Mission
We are building a "Trustless Social Commerce" primitive.
- **Theme:** "New Consumer Primitives" (X.com for Commerce).
- **Core Mechanism:** Escrow (Plasma) releases funds ONLY when Logistics Data (Flare) confirms delivery.
- **Targets:**
  1. **Flare Main Track ($5k):** Uses FDC (Flare Data Connector).
  2. **Plasma Track ($5k):** Uses Stablecoin Payments.

## 🛠️ Current Status (Verified)
- **Network:** Flare Coston2 (Testnet).
- **Wallet:** `0xDD...` (Funded & Active).
- **Contracts Deployed:**
  - `ShipmentTracker`: Verified. Handles the "Web2 -> Web3" signal.
  - `PlasmaPayment` (Native V1): Verified at `0xa9fe73d102fE4A7bFa0B68a9E4c2f38fe9FA57c9`.
- **Tests:** Local Hardhat tests passed (100% coverage of flow).
- **Simulation:** Live testnet simulation successful (Transactions proved on block explorer).

## 🏗️ Architecture
1. **Buyer** -> locks funds in `PlasmaPayment`.
2. **Seller** -> ships item, creates entry in `ShipmentTracker`.
3. **Flare FDC** -> verifies delivery via Attestation.
4. **Contract** -> releases funds to Seller automatically.

## ⚠️ NEXT IMMEDIATE TASK: The "USDT" Pivot
To win the Plasma bounty, we must upgrade from Native Tokens (C2FLR) to Stablecoins (USDT).

**Requirements for `contracts/PlasmaPaymentUSDT.sol`:**
1. Import `IERC20`.
2. Accept `USDT` address in constructor.
3. Use `safeTransferFrom` for deposits (User must Approve first!).
4. Use `safeTransfer` for releasing funds.
5. **Coston2 USDT Address:** `0x726839D54FB18E40b15392e276082A81D230F872`.

## 📝 Frontend / Orlando's Notes
- The frontend needs TWO buttons for the new flow:
  1. `USDT.approve(PaymentContract, Amount)`
  2. `PaymentContract.createOrder(...)`

## 🚫 Non-Goals / Guardrails
*These are strict constraints to prevent regression during the final hours.*
- **Do NOT** switch networks away from Flare Coston2.
- **Do NOT** remove Plasma escrow logic.
- **Do NOT** refactor verified contracts (`ShipmentTracker`, `PlasmaPayment` V1) unless absolutely necessary.
- **Do NOT** introduce new dependencies (npm packages) close to submission.

## 🚀 Phase 2: FDC Real Mode (Active)

**Goal:** Upgrade verification logic to use real FDC Merkle Proofs.

- **FDC Address Strategy:** FDC address is injected at deployment time to support Flare system contracts, testnet mocks, and future mainnet upgrades.
- **New Contracts:**
  - `ShipmentTrackerV2`: Adds `verifyDelivery` with FDC integration.
  - `PlasmaPaymentUSDT`: Links to the V2 Tracker.

| Contract | Address |
|---|---|
| **ShipmentTrackerV2** | *Pending Deployment* |
| **PlasmaPaymentUSDT** | *Pending Deployment* |

