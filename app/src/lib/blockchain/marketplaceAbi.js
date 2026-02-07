// src/lib/blockchain/marketplaceAbi.js
// src/lib/blockchain/marketplaceAbi.js
export const marketplaceAbi = [
    "constructor(address _deliveryOracle, address _usdt)",
    "function createEscrowForOrder(bytes32 orderId, address seller, uint256 deadlineDuration) external returns (address escrow)",
    "function escrowOfOrder(bytes32 orderId) view returns (address)",
    "function USDT() view returns (address)",
    "function deliveryOracle() view returns (address)",
    "event EscrowCreated(bytes32 indexed orderId, address indexed buyer, address indexed seller, address escrow, uint256 deadlineDuration, address deliveryOracle)"
];