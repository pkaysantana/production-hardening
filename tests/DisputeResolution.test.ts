import { expect } from "chai";
import { ethers } from "hardhat";

describe("Dispute Resolution Verification", function () {
    let plasmaPayment: any;
    let shipmentTracker: any;
    let mockFDC: any;
    let owner: any;
    let seller: any;
    let buyer: any;
    let arbiter: any;
    let attacker: any;

    beforeEach(async function () {
        [owner, seller, buyer, arbiter, attacker] = await ethers.getSigners();

        // Deploy Mock FDC
        const MockFDC = await ethers.getContractFactory("MockFlareDataConnector");
        mockFDC = await MockFDC.deploy();

        // Deploy ShipmentTracker
        const ShipmentTracker = await ethers.getContractFactory("ShipmentTracker");
        shipmentTracker = await ShipmentTracker.deploy();

        // Deploy PlasmaPayment
        const PlasmaPayment = await ethers.getContractFactory("PlasmaPayment");
        plasmaPayment = await PlasmaPayment.deploy(await mockFDC.getAddress(), await shipmentTracker.getAddress());

        // Set Arbiter
        await plasmaPayment.setArbiter(arbiter.address);
    });

    it("should allow buyer to initiate a dispute", async function () {
        const trackingId = "SHIP-DISPUTE";
        const amount = ethers.parseEther("1.0");

        // Create Order
        await plasmaPayment.connect(buyer).createOrder(seller.address, trackingId, amount, 100, 3600, { value: amount });
        const orderId = (await plasmaPayment.queryFilter("OrderCreated"))[0].args[0];

        // Initiate Dispute
        await expect(plasmaPayment.connect(buyer).initiateDispute(orderId))
            .to.emit(plasmaPayment, "DisputeInitiated")
            .withArgs(orderId, buyer.address);

        const order = await plasmaPayment.orders(orderId);
        expect(order.status).to.equal(5); // Disputed (index 5)
    });

    it("should allow arbiter to resolve dispute (Refund Buyer)", async function () {
        const trackingId = "SHIP-REFUND";
        const amount = ethers.parseEther("1.0");

        // Create Order & Dispute
        await plasmaPayment.connect(buyer).createOrder(seller.address, trackingId, amount, 100, 3600, { value: amount });
        const orderId = (await plasmaPayment.queryFilter("OrderCreated"))[0].args[0];
        await plasmaPayment.connect(buyer).initiateDispute(orderId);

        // Resolve (Refund)
        const tx = await plasmaPayment.connect(arbiter).resolveDispute(orderId, true);

        // Check balance change
        await expect(tx).to.changeEtherBalances([plasmaPayment, buyer], [-amount, amount]);

        // Check event emission
        await expect(tx).to.emit(plasmaPayment, "DisputeResolved")
            .withArgs(orderId, arbiter.address, true);

        const order = await plasmaPayment.orders(orderId);
        expect(order.status).to.equal(6); // Refunded (index 6)
    });

    it("should allow arbiter to resolve dispute (Force Settle to Seller)", async function () {
        const trackingId = "SHIP-SETTLE";
        const amount = ethers.parseEther("1.0");

        // Create Order & Dispute
        await plasmaPayment.connect(buyer).createOrder(seller.address, trackingId, amount, 100, 3600, { value: amount });
        const orderId = (await plasmaPayment.queryFilter("OrderCreated"))[0].args[0];
        await plasmaPayment.connect(buyer).initiateDispute(orderId);

        // Resolve (Settle)
        const tx = await plasmaPayment.connect(arbiter).resolveDispute(orderId, false);

        // Check balance change
        await expect(tx).to.changeEtherBalances([plasmaPayment, seller], [-amount, amount]);

        // Check event emission
        await expect(tx).to.emit(plasmaPayment, "DisputeResolved")
            .withArgs(orderId, arbiter.address, false);

        const order = await plasmaPayment.orders(orderId);
        expect(order.status).to.equal(4); // Settled (index 4)
    });

    it("should prevent non-arbiter from resolving dispute", async function () {
        const trackingId = "SHIP-ATTACK";
        const amount = ethers.parseEther("1.0");

        await plasmaPayment.connect(buyer).createOrder(seller.address, trackingId, amount, 100, 3600, { value: amount });
        const orderId = (await plasmaPayment.queryFilter("OrderCreated"))[0].args[0];
        await plasmaPayment.connect(buyer).initiateDispute(orderId);

        await expect(plasmaPayment.connect(attacker).resolveDispute(orderId, true))
            .to.be.revertedWith("Only arbiter can resolve");
    });

    it("should prevent dispute if not in Escrowed state", async function () {
        const trackingId = "SHIP-FAIL";
        const amount = ethers.parseEther("1.0");
        await plasmaPayment.connect(buyer).createOrder(seller.address, trackingId, amount, 100, 3600, { value: amount });
        const orderId = (await plasmaPayment.queryFilter("OrderCreated"))[0].args[0];

        // Dispute once
        await plasmaPayment.connect(buyer).initiateDispute(orderId);

        // Try to dispute again
        await expect(plasmaPayment.connect(buyer).initiateDispute(orderId))
            .to.be.revertedWith("Order not in escrow");
    });

    it("should allow buyer to claim timeout refund", async function () {
        const trackingId = "SHIP-TIMEOUT";
        const amount = ethers.parseEther("1.0");
        const deliveryWindow = 100; // 100 seconds

        await plasmaPayment.connect(buyer).createOrder(seller.address, trackingId, amount, 100, deliveryWindow, { value: amount });
        const orderId = (await plasmaPayment.queryFilter("OrderCreated"))[0].args[0];

        // Fast forward time
        await ethers.provider.send("evm_increaseTime", [200]);
        await ethers.provider.send("evm_mine", []);

        // Claim Timeout
        const tx = await plasmaPayment.connect(buyer).claimTimeout(orderId);

        await expect(tx).to.changeEtherBalances([plasmaPayment, buyer], [-amount, amount]);

        const order = await plasmaPayment.orders(orderId);
        expect(order.status).to.equal(6); // Refunded
    });
});
