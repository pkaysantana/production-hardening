import { ethers } from "hardhat";

async function main() {
    console.log("Probing FTSO Registry on Coston2...");

    const ADDRESSES = [
        { name: "Genesis Registry", address: "0x1000000000000000000000000000000000000003" },
        { name: "Searched Address", address: "0xbd33bdff04c357f7fc019e72d0504c24cf4aa010" }
    ];

    const SYMBOLS = ["C2FLR", "FLR", "WFLR", "USDT"];

    // ABI Key points: getCurrentPrice returns (uint256 price, uint256 timestamp)
    const ABI = [
        "function getCurrentPrice(string symbol) external view returns (uint256 price, uint256 timestamp)",
        "function getCurrentPriceWithDecimals(string symbol) external view returns (uint256 price, uint256 timestamp, uint256 decimals)"
    ];

    const [signer] = await ethers.getSigners();

    for (const target of ADDRESSES) {
        console.log(`\n--- Checking ${target.name} (${target.address}) ---`);
        try {
            const contract = new ethers.Contract(target.address, ABI, signer);

            for (const symbol of SYMBOLS) {
                try {
                    const result = await contract.getCurrentPrice(symbol);
                    if (result.price > 0n) {
                        console.log(`✅ SUCCESS! Found price for ${symbol}: ${result.price} (Timestamp: ${result.timestamp})`);
                        return; // Found it!
                    } else {
                        console.log(`⚠️  ${symbol} returned 0 price.`);
                    }
                } catch (e: any) {
                    process.stdout.write(`❌ ${symbol}: ${e.shortMessage || e.message?.substring(0, 50)}... `);
                }
            }
        } catch (e: any) {
            console.log(`❌ Contract connection failed: ${e.message}`);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
