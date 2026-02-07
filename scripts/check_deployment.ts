import { ethers } from "hardhat";

async function main() {
    const contracts = [
        { name: "ShipmentTracker", address: "0xdcd1f0747c2e7820a9c6f128e6e3571b79d2ed85" },
        { name: "PlasmaPayment", address: "0xa9fe73d102fe4a7bfa0b68a9e4c2f38fe9fa57c9" }
    ];

    for (const { name, address } of contracts) {
        console.log(`\nChecking ${name} at: ${address}`);
        const code = await ethers.provider.getCode(address);

        if (code === "0x") {
            console.error(`ERROR: No code found for ${name}.`);
        } else {
            console.log(`SUCCESS: Code found (${code.length} bytes).`);
            console.log(`${name} Checksummed Address: ${ethers.getAddress(address)}`);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
