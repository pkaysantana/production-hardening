export type CourierStatus = "Created" | "PickedUp" | "InTransit" | "Delivered" | "Cancelled";

export interface TrackingInfo {
    trackingNumber: string;
    status: CourierStatus;
    lastLocation: string;
    timestamp: number;
}

export interface ICourier {
    /**
     * Fetches the tracking information from the courier's API (normalized).
     */
    getTrackingInfo(trackingNumber: string): Promise<TrackingInfo | null>;

    /**
     * Returns the unique Source ID for this courier (used in FDC attestations).
     * e.g., keccak256("DHL")
     */
    getSourceId(): string;

    /**
     * Returns the human-readable name of the courier.
     */
    getName(): string;
}
