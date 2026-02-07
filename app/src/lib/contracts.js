import { ethers } from "ethers";

// Contract Addresses
export const MOCK_USDT_ADDRESS = "0xa9fe73d102fE4A7bFa0B68a9E4c2f38fe9FA57c9";
export const PLASMA_RELAYER_ADDRESS = "0x6533AEdD2369a5583959B244bADd797eB7333818";

// MockUSDT ABI (Standard ERC20)
export const MOCK_USDT_ABI = [
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function allowance(address owner, address spender) public view returns (uint256)",
    "function balanceOf(address account) public view returns (uint256)",
    "function transfer(address to, uint256 amount) public returns (bool)",
    "function decimals() public view returns (uint8)"
];

// PlasmaPaymentRelayer ABI
export const PLASMA_RELAYER_ABI = [
    "function createOrder(string memory orderId, address seller, uint256 amount) public",
    "function releaseFunds(string memory orderId) public",
    "function orders(string memory) public view returns (address buyer, address seller, uint256 amount, bool released)"
];

/**
 * Get configured contract instances
 * @param {object} signerOrProvider - ethers Signer or Provider object
 */
export function getContracts(signerOrProvider) {
    const usdtContract = new ethers.Contract(
        MOCK_USDT_ADDRESS,
        MOCK_USDT_ABI,
        signerOrProvider
    );

    const relayerContract = new ethers.Contract(
        PLASMA_RELAYER_ADDRESS,
        PLASMA_RELAYER_ABI,
        signerOrProvider
    );

    return { usdtContract, relayerContract };
}
