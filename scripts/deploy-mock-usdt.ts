import { ethers } from "hardhat";

async function main() {
  const MockUSDT = await ethers.getContractFactory("MockUSDT");

  console.log("🚀 Deploying Mock USDT...");

  const usdt = await MockUSDT.deploy();
  await usdt.waitForDeployment();

  const address = await usdt.getAddress();
  console.log("✅ Mock USDT deployed at:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

