import { ethers } from "hardhat";

async function main() {
    console.log("🌍 Deploying FXSettlement Contract...\n");

    const [deployer] = await ethers.getSigners();
    console.log(`📡 Deployer Address: ${deployer.address}`);

    // ======================== CONFIGURATION ========================
    // Read from environment with fallbacks, normalise addresses with getAddress()
    // Use lowercase addresses to let ethers compute correct checksum
    const FTSO_REGISTRY = ethers.getAddress(process.env.FTSO_REGISTRY || "0x48767f909a9a2ed381448e42c174381c9bdeee82");
    const USDT_ADDRESS = ethers.getAddress(process.env.USDT_ADDRESS || "0xa9fe73d102fE4A7bFa0B68a9E4c2f38fe9FA57c9");
    const RELAYER = ethers.getAddress(process.env.RELAYER_ADDRESS || deployer.address);

    // ======================== DEPLOY ========================
    console.log("\n📋 Configuration:");
    console.log(`   FTSO Registry: ${FTSO_REGISTRY}`);
    console.log(`   Settlement Token (USDT): ${USDT_ADDRESS}`);
    console.log(`   Relayer: ${RELAYER}`);

    const FXSettlement = await ethers.getContractFactory("FXSettlement");
    const fxSettlement = await FXSettlement.deploy(
        FTSO_REGISTRY,
        USDT_ADDRESS,
        RELAYER
    );

    await fxSettlement.waitForDeployment();
    const address = await fxSettlement.getAddress();

    console.log(`\n✅ FXSettlement deployed to: ${address}`);

    // ======================== VERIFY FTSO CONNECTION ========================
    console.log("\n🔍 Verifying FTSO connection...");
    try {
        const quote = await fxSettlement.getQuote("EUR", ethers.parseUnits("1000", 2)); // 1000.00 EUR
        console.log(`   EUR Quote for 1000.00 EUR:`);
        console.log(`   - USDT Amount: ${ethers.formatUnits(quote.usdtAmount, 6)} USDT`);
        console.log(`   - Rate: ${quote.rate.toString()}`);
        console.log(`   - Decimals: ${quote.decimals.toString()}`);
    } catch (e: any) {
        console.log(`   ⚠️ EUR not available on FTSO, trying C2FLR...`);
        try {
            const quote = await fxSettlement.getQuote("C2FLR", ethers.parseUnits("1000", 2));
            console.log(`   C2FLR Quote: ${ethers.formatUnits(quote.usdtAmount, 6)} USDT`);
        } catch (e2: any) {
            console.log(`   ❌ FTSO query failed: ${e2.shortMessage || e2.message}`);
        }
    }

    // ======================== NEXT STEPS ========================
    console.log("\n📝 Next Steps:");
    console.log("1. Update HACKATHON_CONTEXT.md with FXSettlement address");
    console.log("2. Update .env with VITE_FX_SETTLEMENT_ADDRESS=" + address);
    console.log("3. Integrate with frontend for multi-currency orders");
    console.log("\n🎉 FX Protection is now available for international orders!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
