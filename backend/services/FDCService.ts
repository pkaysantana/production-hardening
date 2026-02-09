import { ethers } from "ethers";
import { Logger } from "./logger";
import { ICourier, CourierStatus } from "../interfaces/ICourier";
import { DHLCourier } from "./couriers/DHLCourier";
import { FedExCourier } from "./couriers/FedExCourier";

export interface FDCProof {
    merkleProof: string[];
    attestationType: string;
    sourceId: string;
    leaf: string;
}

export class FDCService {
    private logger: Logger;
    private couriers: ICourier[];

    constructor() {
        this.logger = new Logger("FDCService");
        this.couriers = [
            new DHLCourier(),
            new FedExCourier()
        ];
    }

    /**
     * Determines which courier handles a given tracking ID.
     * Simple heuristic for mock purposes.
     */
    private getCourierForShipment(shipmentId: string): ICourier {
        if (shipmentId.toUpperCase().startsWith("FEDEX")) {
            return this.couriers.find(c => c.getName() === "FedEx") || this.couriers[0];
        }
        // Default to DHL for "DHL" prefix or generic IDs
        return this.couriers.find(c => c.getName() === "DHL") || this.couriers[0];
    }

    /**
     * Fetches an attestation for a shipment delivery.
     * In production, this would call the Flare FDC Attestation API.
     */
    public async getAttestation(shipmentId: string): Promise<FDCProof | null> {
        this.logger.info(`Fetching FDC attestation for shipment: ${shipmentId}`);

        const courier = this.getCourierForShipment(shipmentId);
        this.logger.info(`Selected courier: ${courier.getName()} for ${shipmentId}`);

        try {
            const trackingInfo = await courier.getTrackingInfo(shipmentId);

            if (!trackingInfo) {
                this.logger.warn(`No tracking info found for ${shipmentId}`);
                return null;
            }

            if (trackingInfo.status !== "Delivered") {
                this.logger.info(`Shipment ${shipmentId} is not yet delivered. Status: ${trackingInfo.status}`);
                // In a real relay, we might wait or return null. 
                // For the bot, returning null means "don't release funds yet".
                return null;
            }

            // Generate Proof for "Delivered" state
            const attestationType = ethers.ZeroHash; // Default/Generic Type
            const sourceId = courier.getSourceId();

            // requestBody = keccak256(abi.encode(shipmentId, "Delivered"))
            const requestBody = ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(["string", "string"], [shipmentId, "Delivered"])
            );

            // leaf = keccak256(abi.encode(attestationType, sourceId, requestBody))
            const leaf = ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(["bytes32", "bytes32", "bytes32"], [attestationType, sourceId, requestBody])
            );

            // Mock Proof (In reality, we'd fetch this from FDC)
            const merkleProof = [ethers.ZeroHash];

            this.logger.debug(`Generated proof for ${shipmentId} from ${courier.getName()}`, { leaf });

            return {
                merkleProof,
                attestationType,
                sourceId,
                leaf
            };
        } catch (error) {
            this.logger.error(`Error fetching tracking info`, error);
            return null;
        }
    }

    public calculateLeaf(shipmentId: string, attestationType: string, sourceId: string): string {
        const requestBody = ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(["string", "string"], [shipmentId, "Delivered"])
        );
        return ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(["bytes32", "bytes32", "bytes32"], [attestationType, sourceId, requestBody])
        );
    }
}
