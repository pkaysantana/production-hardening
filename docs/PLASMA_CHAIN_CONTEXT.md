# Plasma Blockchain Documentation

## Overview
Plasma is a Layer 1 blockchain purpose-built for global stablecoin payments. It combines high throughput, stablecoin-native features, and full EVM compatibility.

### Key Features
- **Purpose-built for stablecoins**: Native support for zero fee USD₮ transfers, custom gas tokens, and confidential payments.
- **High-performance architecture**: Pipelined Fast HotStuff consensus with a modular EVM execution layer built on Reth.
- **Bitcoin-native**: Trust-minimized bridge for real BTC.
- **EVM compatible**: Fully compatible with existing Ethereum tooling.
- **Deep liquidity**: Launching with ~$2B in USD₮.

### Architecture
1.  **PlasmaBFT Consensus Layer**: Pipelined Fast HotStuff consensus.
2.  **EVM Execution Layer**: Built on Reth.
3.  **Native Bitcoin Bridge**: Trust-minimized BTC bridge.

### Stablecoin-Native Contracts
- **Zero Fee USD₮ Transfers**: Protocol-sponsored gas for USD₮ transfers.
- **Custom Gas Tokens**: Pay gas with supported stablecoins.
- **Confidential Payments**: Privacy-preserving transfer module (under development).

## Tokenomics (XPL)
- **Token**: XPL (Native token).
- **Supply**: 10 Billion XPL at mainnet beta.
- **Utility**: Transaction fees, validator staking, governance.

## Public Sale & Vaults
- **Structure**: Deposit stablecoins (USDT, USDC, DAI) -> Earn Units -> Purchase XPL.
- **Lock-up**: 12 months for US persons; 40-day lock-up for vault deposits post-sale.
- **Bridging**: Vault deposits converted to USDT and bridged to Plasma Mainnet Beta.

## Technical Details
- **Consensus**: PlasmaBFT (n≥3f+1).
- **Block Time**: Rapid finality (seconds).
- **Energy Consumption**: ~200,000 kWh/year (estimated).

(See full text in chat history for details on Use Cases, Risks, and specific Sale Mechanics)
