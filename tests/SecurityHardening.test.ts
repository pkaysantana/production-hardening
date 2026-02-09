import { expect } from "chai";
import { ethers } from "hardhat";

describe("Security Hardening Verification", function () {
    let marketplace: any;
    let plasmaPayment: any;
    let mockFDC: any;
    let shipmentTracker: any;
    let paymentEscrow: any;
    let owner: any;
    let attacker: any;
    let user: any;
    let seller: any;

    const DELIVERY_ORACLE = "0x0000000000000000000000000000000000000001"; // Logic doesn't check code size

    beforeEach(async function () {
        [owner, attacker, user, seller] = await ethers.getSigners();

        // --- DEPLOY MOCKS & DEPENDENCIES ---
        const MockFDC = await ethers.getContractFactory("MockFlareDataConnector");
        mockFDC = await MockFDC.deploy();

        const ShipmentTracker = await ethers.getContractFactory("ShipmentTracker");
        shipmentTracker = await ShipmentTracker.deploy();

        // --- DEPLOY TARGET CONTRACTS ---

        // 1. Marketplace
        const Marketplace = await ethers.getContractFactory("Marketplace");
        marketplace = await Marketplace.deploy(DELIVERY_ORACLE);

        // 2. PlasmaPayment
        const PlasmaPayment = await ethers.getContractFactory("PlasmaPayment");
        plasmaPayment = await PlasmaPayment.deploy(await mockFDC.getAddress(), await shipmentTracker.getAddress());

        // Fund PlasmaPayment with some ETH if needed (Simulated)
        // await owner.sendTransaction({to: await plasmaPayment.getAddress(), value: ethers.parseEther("1.0")});
    });

    describe("Marketplace Hardening", function () {
        it("should allow owner to pause and unpause", async function () {
            await marketplace.pause();
            expect(await marketplace.paused()).to.be.true;

            await marketplace.unpause();
            expect(await marketplace.paused()).to.be.false;
        });

        it("should revert when non-owner tries to pause", async function () {
            await expect(marketplace.connect(attacker).pause())
                .to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
        });

        it("should prevent creating escrow when paused", async function () {
            await marketplace.pause();

            // Mock USDT Address
            const mockUSDT = await (await ethers.getContractFactory("MockUSDT")).deploy();

            const orderId = ethers.keccak256(ethers.toUtf8Bytes("ORDER_1"));

            await expect(
                marketplace.createEscrowForOrder(orderId, seller.address, await mockUSDT.getAddress(), 3600)
            ).to.be.revertedWithCustomError(marketplace, "EnforcedPause");
        });

        it("should allow owner to update delivery oracle", async function () {
            const newOracle = user.address;

            await expect(marketplace.setDeliveryOracle(newOracle))
                .to.emit(marketplace, "OracleUpdated")
                .withArgs(DELIVERY_ORACLE, newOracle);

            expect(await marketplace.deliveryOracle()).to.equal(newOracle);
        });

        it("should prevent non-owner from updating delivery oracle", async function () {
            await expect(marketplace.connect(attacker).setDeliveryOracle(attacker.address))
                .to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
        });
    });

    describe("PlasmaPayment Hardening", function () {
        it("should allow owner to set Merkle Root", async function () {
            const newRoot = ethers.keccak256(ethers.toUtf8Bytes("NEW_ROOT"));
            await plasmaPayment.setMerkleRoot(newRoot);
            expect(await plasmaPayment.latestMerkleRoot()).to.equal(newRoot);
        });

        it("should prevent non-owner from setting Merkle Root (CRITICAL FIX)", async function () {
            const maliciousRoot = ethers.keccak256(ethers.toUtf8Bytes("MALICIOUS"));
            await expect(plasmaPayment.connect(attacker).setMerkleRoot(maliciousRoot))
                .to.be.revertedWithCustomError(plasmaPayment, "OwnableUnauthorizedAccount");
        });

        it("should process releaseFunds securely", async function () {
            // Setup Order
            const amount = ethers.parseEther("1.0");
            const trackingId = "TRACK_123";
            await plasmaPayment.connect(user).createOrder(seller.address, trackingId, amount, 100, 3600, { value: amount });

            const orderId = (await plasmaPayment.queryFilter("OrderCreated"))[0].args[0];

            // Set Root (Mock)
            const root = ethers.keccak256(ethers.toUtf8Bytes("ROOT"));
            await plasmaPayment.setMerkleRoot(root);

            // Proof
            const proof = [ethers.hexlify(ethers.randomBytes(32))];

            // Canonical Data
            const attestationType = ethers.hexlify(ethers.randomBytes(32));
            const sourceId = ethers.hexlify(ethers.randomBytes(32));

            // Calculate Leaf for PlasmaPayment (Canonical)
            const requestBody = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["string", "string"], [trackingId, "Delivered"]));
            const leaf = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["bytes32", "bytes32", "bytes32"], [attestationType, sourceId, requestBody]));

            // Register valid proof
            await mockFDC.setProofValidity(root, leaf, true);

            // Verify Balance Change
            await expect(
                plasmaPayment.releaseFunds(orderId, proof, attestationType, sourceId)
            ).to.changeEtherBalances([plasmaPayment, seller], [-amount, amount]);
        });
    });
});
