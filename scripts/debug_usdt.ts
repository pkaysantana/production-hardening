import { ethers } from "hardhat";

async function main() {
    const USDT_ADDRESS = "0xC1A5B41512496B80903D1f32d6dEa3a73212E71F";
    console.log(`Checking address: ${USDT_ADDRESS}`);

    const provider = ethers.provider;
    const code = await provider.getCode(USDT_ADDRESS);

    console.log(`Code size: ${code.length}`);
    if (code === "0x") {
        console.error("❌ NO CODE at this address! It is not a contract.");
    } else {
        console.log("✅ Contract code found.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
