import { expect } from "chai";
import { ethers } from "hardhat";

describe("Optimistic Settlement Verification", function () {
    let plasmaPayment: any;
    let shipmentTracker: any;
    let mockFDC: any;
    let owner: any;
    let seller: any;
    let buyer: any;
    let relayer: any;
    let attacker: any;

    beforeEach(async function () {
        [owner, seller, buyer, relayer, attacker] = await ethers.getSigners();

        // Deploy Mock FDC
        const MockFDC = await ethers.getContractFactory("MockFlareDataConnector");
        mockFDC = await MockFDC.deploy();

        // Deploy ShipmentTracker
        const ShipmentTracker = await ethers.getContractFactory("ShipmentTracker");
        shipmentTracker = await ShipmentTracker.deploy();

        // Deploy PlasmaPayment
        const PlasmaPayment = await ethers.getContractFactory("PlasmaPayment");
        plasmaPayment = await PlasmaPayment.deploy(await mockFDC.getAddress(), await shipmentTracker.getAddress());
    });

    it("should allow seller to authorize a relayer", async function () {
        const trackingId = "SHIP-OPT-1";
        const amount = ethers.parseEther("1.0");

        // Create Order
        await plasmaPayment.connect(buyer).createOrder(seller.address, trackingId, amount, 100, 3600, { value: amount });
        const orderId = (await plasmaPayment.queryFilter("OrderCreated"))[0].args[0];

        // Authorize Relayer
        const minAmount = ethers.parseEther("0.95"); // 95%
        await expect(plasmaPayment.connect(seller).authorizeRelayer(orderId, relayer.address, minAmount))
            .to.emit(plasmaPayment, "RelayerAuthorized")
            .withArgs(orderId, relayer.address, minAmount);

        const info = await plasmaPayment.relayerInfos(orderId);
        expect(info.authorizedRelayer).to.equal(relayer.address);
        expect(info.minAdvanceAmount).to.equal(minAmount);
    });

    it("should allow authorized relayer to advance payment and claim order", async function () {
        const trackingId = "SHIP-OPT-2";
        const amount = ethers.parseEther("1.0");
        const advanceAmount = ethers.parseEther("0.95");

        // Create Order
        await plasmaPayment.connect(buyer).createOrder(seller.address, trackingId, amount, 100, 3600, { value: amount });
        const orderId = (await plasmaPayment.queryFilter("OrderCreated"))[0].args[0];

        // Authorize
        await plasmaPayment.connect(seller).authorizeRelayer(orderId, relayer.address, advanceAmount);

        // Advance Payment
        // Relayer sends 0.95 ETH. Contract forwards to Seller. Order.seller becomes Relayer.
        const tx = await plasmaPayment.connect(relayer).advancePayment(orderId, { value: advanceAmount });

        // Verify Balances:
        // Relayer: -0.95 (plus gas)
        // Seller: +0.95
        await expect(tx).to.changeEtherBalances(
            [relayer, seller],
            [-advanceAmount, advanceAmount]
        );

        // Verify Order Ownership
        const order = await plasmaPayment.orders(orderId);
        expect(order.seller).to.equal(relayer.address);

        await expect(tx).to.emit(plasmaPayment, "PaymentAdvanced")
            .withArgs(orderId, seller.address, relayer.address, advanceAmount);
    });

    it("should prevent unauthorized relayer from advancing payment", async function () {
        const trackingId = "SHIP-OPT-FAIL";
        const amount = ethers.parseEther("1.0");
        const advanceAmount = ethers.parseEther("0.95");

        await plasmaPayment.connect(buyer).createOrder(seller.address, trackingId, amount, 100, 3600, { value: amount });
        const orderId = (await plasmaPayment.queryFilter("OrderCreated"))[0].args[0];

        await plasmaPayment.connect(seller).authorizeRelayer(orderId, relayer.address, advanceAmount);

        await expect(plasmaPayment.connect(attacker).advancePayment(orderId, { value: advanceAmount }))
            .to.be.revertedWith("Not authorized relayer");
    });

    it("should prevent advancing less than minimum amount", async function () {
        const trackingId = "SHIP-OPT-LOW";
        const amount = ethers.parseEther("1.0");
        const minAmount = ethers.parseEther("0.95");

        await plasmaPayment.connect(buyer).createOrder(seller.address, trackingId, amount, 100, 3600, { value: amount });
        const orderId = (await plasmaPayment.queryFilter("OrderCreated"))[0].args[0];

        await plasmaPayment.connect(seller).authorizeRelayer(orderId, relayer.address, minAmount);

        await expect(plasmaPayment.connect(relayer).advancePayment(orderId, { value: ethers.parseEther("0.9") }))
            .to.be.revertedWith("Insufficient advance amount");
    });

    it("should allow new owner (relayer) to release full funds via FDC", async function () {
        const trackingId = "SHIP-Relayer-Claim";
        const amount = ethers.parseEther("1.0");
        const advanceAmount = ethers.parseEther("0.95");

        await plasmaPayment.connect(buyer).createOrder(seller.address, trackingId, amount, 100, 3600, { value: amount });
        const orderId = (await plasmaPayment.queryFilter("OrderCreated"))[0].args[0];

        await plasmaPayment.connect(seller).authorizeRelayer(orderId, relayer.address, advanceAmount);
        await plasmaPayment.connect(relayer).advancePayment(orderId, { value: advanceAmount });

        // FDC Verification Flow
        const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("ROOT"));
        await plasmaPayment.setMerkleRoot(merkleRoot);

        const attestationType = ethers.hexlify(ethers.randomBytes(32));
        const sourceId = ethers.hexlify(ethers.randomBytes(32));
        const requestBody = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["string", "string"], [trackingId, "Delivered"]));
        const leaf = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["bytes32", "bytes32", "bytes32"], [attestationType, sourceId, requestBody]));

        await mockFDC.setProofValidity(merkleRoot, leaf, true);
        const proof = [ethers.hexlify(ethers.randomBytes(32))];

        // Release Funds - Should go to RELAYER (new owner)
        // Relayer receives the full 1.0 ETH (Profit: 0.05 ETH)
        await expect(plasmaPayment.releaseFunds(orderId, proof, attestationType, sourceId))
            .to.changeEtherBalances([plasmaPayment, relayer], [-amount, amount]);
    });
});
