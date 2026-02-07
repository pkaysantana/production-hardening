const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Marketplace...");

  const DELIVERY_ORACLE =
    "0xbbe5364e86b9160E472c6668b700Db8f2EEDf617";

  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(DELIVERY_ORACLE);

  await marketplace.waitForDeployment();

  const address = await marketplace.getAddress();
  console.log("✅ Marketplace deployed at:", address);
  console.log("🚚 Delivery oracle set to:", DELIVERY_ORACLE);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });