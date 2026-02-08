import { submitSimulatedDelivery } from "../blockchain/sourceChain";
const SIMULATED_ORDER_ID =
  "0x4f6a1c2e9d7b3a5c8e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1";

const onConfirmDelivery = async () => {
  await deliveryRegistry.confirmDelivery(SIMULATED_ORDER_ID);
};