import { ethers } from "hardhat";

async function main() {
  const DeliveryRegistry = await ethers.getContractFactory("DeliveryRegistry");
  const deliveryRegistry = await DeliveryRegistry.deploy();

  await deliveryRegistry.waitForDeployment();

  const address = await deliveryRegistry.getAddress();
  console.log("DeliveryRegistry deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});