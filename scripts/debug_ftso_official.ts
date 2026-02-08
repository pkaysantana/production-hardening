import { ethers } from "hardhat";
import { nameToAddress } from "@flarenetwork/flare-periphery-contract-artifacts";

// Manual ABI because the package export is missing or mismatched
const FTSO_REGISTRY_ABI = [
    "function getCurrentPriceWithDecimals(string memory _symbol) external view returns (uint256 _price, uint256 _timestamp, uint256 _decimals)",
    "function getCurrentPriceWithDecimals(uint256 _assetIndex) external view returns (uint256 _price, uint256 _timestamp, uint256 _decimals)",
    "function getSupportedSymbols() external view returns (string[] memory)"
];

async function main() {
    console.log("--- Probing FTSO via Official Flare Package ---");

    const [signer] = await ethers.getSigners();
    const provider = signer.provider!;

    // 1. Get Registry Address
    // Use the official package to get the FtsoRegistry address for Coston2
    let ftsoRegistryAddress = await nameToAddress("FtsoRegistry", "coston2", provider);

    if (!ftsoRegistryAddress) {
        console.log("Package did not return address. Trying fallback...");
        ftsoRegistryAddress = "0x48767F909A9A2eD381448E42c174381C9BdEEe82"; // Coston2 FTSO Registry
    }

    console.log(`FtsoRegistry Address: ${ftsoRegistryAddress}`);

    // 2. Create Contract
    const ftsoRegistry = new ethers.Contract(ftsoRegistryAddress!, FTSO_REGISTRY_ABI, signer);

    // 3. Get Price
    console.log("\nFetching FLR/USD price...");
    try {
        // Try Symbol First
        const result = await ftsoRegistry.getCurrentPriceWithDecimals("FLR");
        console.log("✅ SUCCESS (Symbol)!");
        console.log(`Price: ${result[0]}`);
        console.log(`Timestamp: ${result[1]}`);
        console.log(`Decimals: ${result[2]}`);

        const price = Number(result[0]) / Math.pow(10, Number(result[2]));
        console.log(`FLR/USD = $${price.toFixed(6)}`);
    } catch (e: any) {
        console.log(`❌ FLR Symbol failed: ${e.shortMessage || e.message}`);

        try {
            // Try C2FLR (Coston2 Native)
            console.log("Trying C2FLR...");
            const result = await ftsoRegistry.getCurrentPriceWithDecimals("C2FLR");
            console.log("✅ SUCCESS (C2FLR)!");
            const price = Number(result[0]) / Math.pow(10, Number(result[2]));
            console.log(`C2FLR/USD = $${price.toFixed(6)}`);
        } catch (e2: any) {
            console.log(`❌ C2FLR failed: ${e2.shortMessage || e2.message}`);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
