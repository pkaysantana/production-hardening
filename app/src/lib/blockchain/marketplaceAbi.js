// src/lib/blockchain/marketplaceAbi.js
export const marketplaceAbi = [
    "function createEscrowForOrder(bytes32 orderId, address seller, address usdtAddress, uint256 deadlineDuration) external returns (address)",
    "function escrowOfOrder(bytes32 orderId) view returns (address)",
    "event EscrowCreated(bytes32 indexed orderId, address indexed buyer, address indexed seller, address escrow, address usdt, uint256 deadlineDuration)"
];