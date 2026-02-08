import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

 
  const buyer = deployer.address;          
  const seller = deployer.address;         
  const usdt = "0xEF63358999141a5D1C5452f0e4d6968c23BBBD11";           
  const deadlineDuration = 7 * 24 * 60 * 60;


  const PaymentEscrow = await ethers.getContractFactory("PaymentEscrow");
  const paymentEscrow = await PaymentEscrow.deploy(
    buyer,
    seller,
    usdt,
    deadlineDuration,
    ethers.ZeroAddress
  );
  await paymentEscrow.waitForDeployment();

  const paymentEscrowAddress = await paymentEscrow.getAddress();
  console.log("PaymentEscrow:", paymentEscrowAddress);

 
const DeliveryEscrowFDC = await ethers.getContractFactory("DeliveryEscrowFDC");

const attesterAddress = deployer.address; // 👈 ADD THIS LINE

const deliveryEscrow = await DeliveryEscrowFDC.deploy(
  paymentEscrowAddress,
  attesterAddress
);
  await deliveryEscrow.waitForDeployment();

  const deliveryEscrowAddress = await deliveryEscrow.getAddress();
  console.log("DeliveryEscrowFDC:", deliveryEscrowAddress);

 
  const tx = await paymentEscrow.setDeliveryOracle(deliveryEscrowAddress);
  await tx.wait();

  console.log("Oracle wired ✔");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
