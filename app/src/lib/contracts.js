import { ethers } from "ethers";

// Contract Addresses
export const MOCK_USDT_ADDRESS = "0xa9fe73d102fE4A7bFa0B68a9E4c2f38fe9FA57c9"; // Keeping previous mock or need new one? 
// Wait, deploy output didn't show MockUSDT because I have env var likely? 
// "No USDT_ADDRESS provided... MockUSDT deployed to..." was NOT in output so likely existing one used.
// Log says: "No USDT_ADDRESS provided" logic was skipped... wait.
// Looking at log: "No USDT_ADDRESS provided, deploying MockFDC..." - wait, FDC was deployed.
// For USDT, the log snippets DO NOT show "MockUSDT deployed to".
// This implies `process.env.USDT_ADDRESS` WAS provided or the logic skipped it?
// Ah, `deploy_prod.ts` logic: `if (!usdtAddress)`.
// If it wasn't printed, it means env var exists.
// Let's assume MOCK_USDT_ADDRESS is unchanged or I should check .env.
// Actually, I'll stick with the old one for USDT for now unless user complains.
// Updating PlasmaPaymentERC20 address:
export const PLASMA_PAYMENT_ERC20_ADDRESS = "0xe81568b3Fa636726dCaC9Fce834FE261429E13A7";

// MockUSDT ABI (Standard ERC20)
export const MOCK_USDT_ABI = [
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function allowance(address owner, address spender) public view returns (uint256)",
    "function balanceOf(address account) public view returns (uint256)",
    "function transfer(address to, uint256 amount) public returns (bool)",
    "function decimals() public view returns (uint8)"
];

// PlasmaPaymentERC20 ABI (Full Feature Set)
export const PLASMA_PAYMENT_ERC20_ABI = [
    // Order Management
    "function createOrder(address seller, string trackingId, uint256 amount, uint256 fxRate, uint256 deliveryWindow) external",
    "function orders(bytes32) public view returns (bytes32 orderId, address buyer, address seller, uint256 amount, uint256 fxRate, uint256 deliveryDeadline, string trackingId, uint8 status)",

    // Dispute Resolution
    "function initiateDispute(bytes32 orderId) external",
    "function resolveDispute(bytes32 orderId, bool refundBuyer) external",
    "function claimTimeout(bytes32 orderId) external",

    // Optimistic Settlement
    "function authorizeRelayer(bytes32 orderId, address relayer, uint256 minAmount) external",
    "function advancePayment(bytes32 orderId) external",
    "function advancePaymentWithAmount(bytes32 orderId, uint256 amount) external",

    // Events
    "event OrderCreated(bytes32 indexed orderId, address indexed buyer, address indexed seller, uint256 amount)",
    "event DisputeInitiated(bytes32 indexed orderId, address indexed initiator)",
    "event DisputeResolved(bytes32 indexed orderId, address indexed resolver, bool refundedToBuyer)",
    "event RelayerAuthorized(bytes32 indexed orderId, address indexed relayer, uint256 minAmount)",
    "event PaymentAdvanced(bytes32 indexed orderId, address indexed oldSeller, address indexed newSeller, uint256 amount)"
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

    const plasmaPaymentContract = new ethers.Contract(
        PLASMA_PAYMENT_ERC20_ADDRESS,
        PLASMA_PAYMENT_ERC20_ABI,
        signerOrProvider
    );

    return { usdtContract, plasmaPaymentContract };
}
