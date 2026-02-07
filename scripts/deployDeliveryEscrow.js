const { ethers } = require("hardhat");

async function main() {
  const PaymentEscrow = await ethers.getContractFactory("PaymentEscrow");

  console.log("Deploying PaymentEscrow contract...");

  // Example values for local testing
  const buyerAddress = "0x270216787A9bc1EDC945a8D24E40FbDEdb35B605";
  const sellerAddress = "0x48F4068b8c704bec2cb51d3a4e8585c8c5Fb68D5"
  const usdtAddress = "0x0000000000000000000000000000000000000001";
  const deadlineDuration = 60 * 60 * 24; // 1 day in seconds

  const paymentEscrow = await PaymentEscrow.deploy(
    buyerAddress,
    sellerAddress,
    usdtAddress,
    deadlineDuration
  );

  await paymentEscrow.waitForDeployment();

  console.log("PaymentEscrow deployed to:", await paymentEscrow.getAddress());
  console.log("✅ Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
