import { ethers } from "ethers";
import { ICourier, TrackingInfo, CourierStatus } from "../../interfaces/ICourier";

export class FedExCourier implements ICourier {
    private readonly SOURCE_ID = ethers.keccak256(ethers.toUtf8Bytes("FEDEX"));

    public getName(): string {
        return "FedEx";
    }

    public getSourceId(): string {
        return this.SOURCE_ID;
    }

    public async getTrackingInfo(trackingNumber: string): Promise<TrackingInfo | null> {
        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 600));

        // Mock Logic: If tracking number starts with "FEDEX" and ends with "DEL", return Delivered.
        if (trackingNumber.startsWith("FEDEX")) {
            const isDelivered = trackingNumber.endsWith("DEL");
            return {
                trackingNumber,
                status: isDelivered ? "Delivered" : "InTransit",
                lastLocation: "Memphis, TN, USA",
                timestamp: Math.floor(Date.now() / 1000)
            };
        }

        return null; // Not a FedEx number
    }
}
