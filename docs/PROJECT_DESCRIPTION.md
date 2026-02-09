# Project Description: Magma Marketplace

## Tagline
**Liquid Capital. Solid Truth.**

## Short Description
Magma is a **Trustless Commerce Primitive** that burns the middleman by replacing bank intermediaries with cryptographic fire. We allow solvent SMEs to prove delivery via **Flare Data Connector (FDC)** and get paid instantly via **Plasma**, creating a "Verified Commerce" layer for the internet.

## The Problem
Global trade finance has a **$2.5 Trillion Gap**.
- **Multinationals** get trust (Letters of Credit).
- **SMEs** get rejected (40% rejection rate).
Banks are too slow, expensive, and manual to service the "missing middle" of global trade. SMEs are solvent but "unbankable" due to compliance costs.

## The Solution
Magma replaces the bank with code:
1.  **Zero-Gas Settlement (Plasma):** Buyers lock stablecoins (USDT) in a smart escrow without paying gas fees, thanks to Plasma's native Paymaster.
2.  **Decentralized Truth (Flare):** We use the **Flare Data Connector (FDC)** to cryptographically verify real-world logistics events (e.g., "Package Delivered" via FedEx/DHL) without trusting a centralized oracle.
3.  **Instant Payout:** Once the Truth is verified on-chain, funds are released instantly to the seller.

## Architecture

### 1. The Settlement Layer (Liquid)
-   **Network:** Plasma Testnet (Chain ID 9746)
-   **Role:** Holds the money (Stablecoins).
-   **Key Innovation:** Protocol-level gas abstraction allows users to pay $0 gas fees, removing a major friction point for B2B adoption.

### 2. The Truth Layer (Solid)
-   **Network:** Flare Coston2 (Chain ID 114)
-   **Role:** Proves the facts.
-   **Key Innovation:** **Flare Data Connector (FDC)** uses the consensus of the entire network to attest to the state of an external API (FedEx), making the data as immutable as the blockchain itself.

### 3. The Bridge (Nervous System)
-   **Role:** Trustless Relayer.
-   **Function:** Listens for "Delivery Verified" events on Flare and triggers "Release Funds" on Plasma.

## Traction & Hackathon Achievements
-   **Production-Grade Architecture:** Successfully deployed dual-chain architecture (Plasma + Flare).
-   **Live Simulation:** End-to-end command-line simulation of the entire lifecycle (Order -> Shipping -> FDC Verification -> Payout).
-   **Zero-Gas UX:** Validated the "gasless" onboarding model for enterprise clients.

## Tech Stack
-   **Smart Contracts:** Solidity, Hardhat, OpenZeppelin.
-   **Networks:** Plasma (Settlement), Flare (Oracle/Verification).
-   **Frontend:** React, Vite, Privy (Embedded Wallets), Wagmi.
-   **Backend:** Node.js, TypeScript (Relayer).
