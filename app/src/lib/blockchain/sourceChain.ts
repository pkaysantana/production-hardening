import { ethers } from "ethers";
import DeliveryRegistryABI from "./DeliveryRegistry.json";

export const submitSimulatedDelivery = async (orderId: string) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const deliveryRegistry = new ethers.Contract(
    import.meta.env.VITE_DELIVERY_REGISTRY_ADDRESS,
    DeliveryRegistryABI,
    signer
  );


  const orderIdBytes32 = ethers.id(orderId);
  
  const tx = await deliveryRegistry.confirmDelivery(orderIdBytes32);
  console.log("tx submitted:", tx.hash);

  const receipt = await tx.wait();
  console.log("tx mined in block:", receipt.blockNumber);

 
  return {
    receipt,
    orderIdBytes32,
  };
};
