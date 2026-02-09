import { ethers } from "ethers";
import { ICourier, TrackingInfo, CourierStatus } from "../../interfaces/ICourier";

export class DHLCourier implements ICourier {
    private readonly SOURCE_ID = ethers.keccak256(ethers.toUtf8Bytes("DHL"));

    public getName(): string {
        return "DHL";
    }

    public getSourceId(): string {
        return this.SOURCE_ID;
    }

    public async getTrackingInfo(trackingNumber: string): Promise<TrackingInfo | null> {
        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock Logic: If tracking number starts with "DHL", return Delivered.
        if (trackingNumber.startsWith("DHL")) {
            return {
                trackingNumber,
                status: "Delivered",
                lastLocation: "London, UK",
                timestamp: Math.floor(Date.now() / 1000)
            };
        }

        // Simulate "In Transit" for others
        return {
            trackingNumber,
            status: "InTransit",
            lastLocation: "Frankfurt, DE",
            timestamp: Math.floor(Date.now() / 1000)
        };
    }
}
