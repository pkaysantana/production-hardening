const { ethers } = require("hardhat");

async function main() {
  const DeliveryEscrow = await ethers.getContractFactory("DeliveryEscrow");

  console.log("Deploying DeliveryEscrow contract...");

  // Example values for local testing
  const sellerBuyerAddress = "0x270216787A9bc1EDC945a8D24E40FbDEdb35B605"
  const usdtAddress = "0x0000000000000000000000000000000000000001"; 
  const deadlineDuration = 60 * 60 * 24; // 1 day in seconds

  const deliveryEscrow = await DeliveryEscrow.deploy(
    sellerBuyerAddress,
    sellerBuyerAddress,
    usdtAddress,
    deadlineDuration
  );

  await deliveryEscrow.waitForDeployment();

  console.log("DeliveryEscrow deployed to:", await deliveryEscrow.getAddress());
  console.log("✅ Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
