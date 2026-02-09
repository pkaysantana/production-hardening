import { expect } from "chai";
import { ethers } from "hardhat";

describe("ShipmentTrackerV2 FDC Restriction", function () {
    let shipmentTracker: any;
    let mockFDC: any;
    let owner: any;
    let user: any;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();

        // Deploy Mock FDC
        const MockFDC = await ethers.getContractFactory("MockFlareDataConnector");
        mockFDC = await MockFDC.deploy();

        // Deploy ShipmentTrackerV2
        const ShipmentTrackerV2 = await ethers.getContractFactory("ShipmentTrackerV2");
        shipmentTracker = await ShipmentTrackerV2.deploy(await mockFDC.getAddress());
    });

    it("should revert when trying to manually set status to Delivered via updateStatus", async function () {
        const shipmentId = "TEST-SHIP-001";

        // Create Shipment
        await shipmentTracker.createShipment(shipmentId, user.address);

        // Try to update to Delivered (Status index 3)
        // param: _shipmentId, _status
        // Enum Status: Created, PickedUp, InTransit, Delivered, Cancelled
        await expect(
            shipmentTracker.updateStatus(shipmentId, 3)
        ).to.be.revertedWith("Cannot manually set Delivered. Use FDC.");
    });

    it("should allow manual updates to other statuses", async function () {
        const shipmentId = "TEST-SHIP-002";

        // Create Shipment
        await shipmentTracker.createShipment(shipmentId, user.address);

        // Update to PickedUp (Status index 1)
        await shipmentTracker.updateStatus(shipmentId, 1);

        const shipment = await shipmentTracker.shipments(shipmentId);
        expect(shipment.status).to.equal(1);
    });

    it("should allow verifying delivery via verifyDelivery (FDC)", async function () {
        const shipmentId = "TEST-SHIP-003";

        // Create Shipment
        await shipmentTracker.createShipment(shipmentId, user.address);

        // Request Attestation
        await shipmentTracker.requestAttestation(shipmentId);

        // Mock Proof
        const proof = [ethers.hexlify(ethers.randomBytes(32))];
        const merkleRoot = ethers.hexlify(ethers.randomBytes(32));

        // Canonical Data
        const attestationType = ethers.hexlify(ethers.randomBytes(32));
        const sourceId = ethers.hexlify(ethers.randomBytes(32));

        // Calculate Expected Leaf (Must match contract logic)
        // requestBody = keccak256(abi.encode(shipmentId, "Delivered"))
        // leaf = keccak256(abi.encode(attestationType, sourceId, requestBody))
        const requestBody = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["string", "string"], [shipmentId, "Delivered"]));
        const leaf = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["bytes32", "bytes32", "bytes32"], [attestationType, sourceId, requestBody]));

        // Register valid proof in Mock FDC
        await mockFDC.setProofValidity(merkleRoot, leaf, true);

        // Call verifyDelivery
        await shipmentTracker.verifyDelivery(shipmentId, proof, merkleRoot, attestationType, sourceId);

        const shipment = await shipmentTracker.shipments(shipmentId);
        expect(shipment.status).to.equal(3); // Delivered
    });
});
