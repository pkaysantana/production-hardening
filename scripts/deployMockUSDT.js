const { ethers } = require("hardhat");

async function main() {
  const MockUSDT = await ethers.getContractFactory("MockUSDT");

  console.log("🚀 Deploying Mock USDT...");

  const usdt = await MockUSDT.deploy();
  await usdt.waitForDeployment();

  console.log("✅ Mock USDT deployed at:", await usdt.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});