import { ethers } from "hardhat";
import { nameToAddress, FTSO_REGISTRY_ABI } from "@flarenetwork/flare-periphery-contract-artifacts";

async function main() {
    console.log("--- Probing FTSO via Official Flare Package ---");

    const [signer] = await ethers.getSigners();
    const provider = ethers.provider;

    // Use the official package to get the FtsoRegistry address for Coston2
    const ftsoRegistryAddress = nameToAddress("FtsoRegistry", "coston2");
    console.log(`FtsoRegistry Address (from package): ${ftsoRegistryAddress}`);

    // If the package method didn't work, try the direct FlareContractRegistry approach
    if (!ftsoRegistryAddress) {
        console.log("Package did not return address. Trying FlareContractRegistry...");

        // FlareContractRegistry is at a well-known address on all Flare chains
        const FLARE_CONTRACT_REGISTRY = "0xAD67FE66660Fb8dFE9d6b1b4240d8650e30F6019";
        const REGISTRY_ABI = [
            "function getContractAddressByName(string calldata _name) external view returns (address)"
        ];

        const registry = new ethers.Contract(FLARE_CONTRACT_REGISTRY, REGISTRY_ABI, signer);
        const resolvedAddress = await registry.getContractAddressByName("FtsoRegistry");
        console.log(`FtsoRegistry resolved: ${resolvedAddress}`);
    }

    // Create FtsoRegistry contract instance
    const ftsoRegistry = new ethers.Contract(ftsoRegistryAddress!, FTSO_REGISTRY_ABI, signer);

    // Get current price for "FLR"
    console.log("\nFetching FLR/USD price...");
    try {
        const result = await ftsoRegistry.getCurrentPriceWithDecimals("FLR");
        console.log("✅ SUCCESS!");
        console.log(`Price: ${result[0]}`);
        console.log(`Timestamp: ${result[1]}`);
        console.log(`Decimals: ${result[2]}`);

        const price = Number(result[0]) / Math.pow(10, Number(result[2]));
        console.log(`FLR/USD = $${price.toFixed(6)}`);
    } catch (e: any) {
        console.log(`❌ FLR failed: ${e.shortMessage || e.message}`);

        // Try C2FLR for testnet
        console.log("\nTrying C2FLR (testnet native)...");
        try {
            const result = await ftsoRegistry.getCurrentPriceWithDecimals("C2FLR");
            console.log("✅ SUCCESS with C2FLR!");
            console.log(`Price: ${result[0]}, Decimals: ${result[2]}`);
        } catch (e2: any) {
            console.log(`❌ C2FLR also failed: ${e2.shortMessage || e2.message}`);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
