import { expect } from "chai";
import { ethers } from "hardhat";

describe("PlasmaPayment FDC Integration", function () {
    let plasmaPayment: any;
    let shipmentTracker: any;
    let mockFDC: any;
    let owner: any;
    let seller: any;
    let buyer: any;

    beforeEach(async function () {
        [owner, seller, buyer] = await ethers.getSigners();

        // Deploy Mock FDC
        const MockFDC = await ethers.getContractFactory("MockFlareDataConnector");
        mockFDC = await MockFDC.deploy();

        // Deploy ShipmentTracker
        const ShipmentTracker = await ethers.getContractFactory("ShipmentTracker");
        shipmentTracker = await ShipmentTracker.deploy();

        // Deploy PlasmaPayment
        const PlasmaPayment = await ethers.getContractFactory("PlasmaPayment");
        plasmaPayment = await PlasmaPayment.deploy(await mockFDC.getAddress(), await shipmentTracker.getAddress());

        // Authorize PlasmaPayment to update ShipmentTracker (though Logic currently doesn't strictly call it, good for future)
        await shipmentTracker.setAuthorizedUpdater(await plasmaPayment.getAddress(), true);
    });

    it("should release funds when FDC verifies shipment", async function () {
        const trackingId = "SHIP-123";
        const amount = ethers.parseEther("1.0");
        const fxRate = 100;

        // 1. Create Shipment
        await shipmentTracker.connect(seller).createShipment(trackingId, buyer.address);

        // 2. Create Order in PlasmaPayment
        await plasmaPayment.connect(buyer).createOrder(
            seller.address,
            trackingId,
            amount,
            fxRate,
            3600, // Delivery Window
            { value: amount }
        );

        // 3. Request Attestation (Simulated in ShipmentTracker)
        await shipmentTracker.requestAttestation(trackingId);

        // 4. Mock the Merkle Root in PlasmaPayment
        // In reality this comes from FTSO/System
        const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("ROOT"));
        await plasmaPayment.setMerkleRoot(merkleRoot);

        // 5. Prepare Proof (Mock)
        const proof = [ethers.keccak256(ethers.toUtf8Bytes("PROOF_NODE"))];

        // Canonical Data
        const attestationType = ethers.hexlify(ethers.randomBytes(32));
        const sourceId = ethers.hexlify(ethers.randomBytes(32));

        // Calculate Leaf (Matches PlasmaPayment logic)
        // requestBody = keccak256(abi.encode(trackingId, "Delivered"))
        // leaf = keccak256(abi.encode(attestationType, sourceId, requestBody))
        const requestBody = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["string", "string"], [trackingId, "Delivered"]));
        const leaf = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["bytes32", "bytes32", "bytes32"], [attestationType, sourceId, requestBody]));

        // Register valid proof
        await mockFDC.setProofValidity(merkleRoot, leaf, true);

        // 6. Release Funds
        await expect(plasmaPayment.releaseFunds(
            // orderId calculation: keccak256(buyer, seller, timestamp)
            // Since we can't easily predict exact timestamp, we might need to fetch the orderId from events or storage
            // For this test we can assume we grab it from the event or just re-calculate it locally if we control timestamp
            // Let's get it from the event:
            (await plasmaPayment.queryFilter("OrderCreated"))[0].args[0],
            proof,
            attestationType,
            sourceId
        )).to.changeEtherBalances(
            [plasmaPayment, seller],
            [-amount, amount]
        );

        // Verify Order Status updated (you might need a getter or public mapping)
        // Order is in mapping public orders
        const orderId = (await plasmaPayment.queryFilter("OrderCreated"))[0].args[0];
        const order = await plasmaPayment.orders(orderId);
        expect(order.status).to.equal(3); // Delivered (assuming enum index 3)
    });
});
