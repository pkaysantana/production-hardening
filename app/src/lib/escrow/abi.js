export const escrowAbi = [
    "function buyer() view returns (address)",
    "function seller() view returns (address)",
    "function usdtToken() view returns (address)",
    "function amount() view returns (uint256)",
    "function deadline() view returns (uint256)",
    "function released() view returns (bool)",
    "function cancelled() view returns (bool)",
    "function deposit(uint256 amount) external",
    "function releaseToSeller() external",
    "function refundBuyer() external"
];

export const erc20Abi = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)"
];