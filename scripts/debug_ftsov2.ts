import { ethers } from "hardhat";

async function main() {
    console.log("Probing FTSOv2 on Coston2...");

    // FTSOv2 Address on Coston2 (often the same as Genesis or precompiled)
    // We will try the Genesis address first, as it's common for these protocols on Flare testnets.
    const FTSO_V2_ADDRESS = "0x1000000000000000000000000000000000000003";

    // ABI for FTSOv2
    const ABI = [
        "function getFeedById(bytes21 feedId) external view returns (uint256 value, int8 decimals, uint256 timestamp)",
        "function getFeedsById(bytes21[] calldata feedIds) external view returns (uint256[] memory values, int8[] memory decimals, uint256[] memory timestamps)"
    ];

    const [signer] = await ethers.getSigners();
    const ftsov2 = new ethers.Contract(FTSO_V2_ADDRESS, ABI, signer);

    // Feed IDs are typically bytes21. 
    // Format: Category (1 byte) + Name (20 bytes).
    // Category 01 = Crypto.
    // Name is usually hex of string.

    function generateFeedId(category: string, name: string): string {
        const categoryHex = category; // e.g. "01"
        const nameUtf8 = ethers.toUtf8Bytes(name);
        const nameHex = ethers.hexlify(nameUtf8).substring(2); // remove 0x
        // Pad name to 20 bytes (40 chars) with zeros? Or just use as identifier?
        // Flare docs say: "01" + "464c522f55534400..." (FLR/USD padded)

        // Let's try constructing the ID for "FLR/USD"
        // 1. Get hex of "FLR/USD"
        // 2. Pad right to 20 bytes
        const paddedName = ethers.zeroPadBytes(ethers.hexlify(ethers.toUtf8Bytes(name)), 20).substring(2);

        // Actually, let's try a simpler approach often used in these systems:
        // just byte encoding the string "FLR/USD" and seeing if that works or if we need specific IDs.
        return "0x" + category + paddedName; // This is a guess, let's look for standard IDs.
    }

    // Known Feed IDs from Flare Docs/Examples (Standard Crypto Feeds)
    // Data Category: 01 (Crypto)
    // FLR/USD ID: 01464c522f55534400000000000000000000000000
    // (That is 01 + hex("FLR/USD") + padding)

    const FLR_USD_ID = "0x01464c522f55534400000000000000000000000000";
    const BTC_USD_ID = "0x014254432f55534400000000000000000000000000";

    console.log(`Checking Feed ID: ${FLR_USD_ID} (FLR/USD)`);

    try {
        // Try getFeedById
        const result = await ftsov2.getFeedById(FLR_USD_ID);
        console.log("✅ FOUND DATA!");
        console.log(`Value: ${result.value}`);
        console.log(`Decimals: ${result.decimals}`);
        console.log(`Timestamp: ${result.timestamp}`);
    } catch (e: any) {
        console.log(`❌ Failed: ${e.shortMessage || e.message}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
