import { expect } from "chai";
import { ethers } from "hardhat";

describe("PlasmaPaymentERC20 Verification", function () {
    let plasmaPayment: any;
    let shipmentTracker: any;
    let mockFDC: any;
    let mockUSDT: any;
    let owner: any;
    let seller: any;
    let buyer: any;
    let relayer: any;
    let arbiter: any;

    const AMOUNT = ethers.parseUnits("100", 6); // 100 USDT (6 decimals usually, but Mock is 18? Let's check or assume 18 for simplicity or adjust)
    // Actually typically ERC20 mocks in hardhat often default to 18 unless specified. 
    // Let's use ethers.parseEther("100") if MockUSDT is standard OpenZeppelin ERC20 mock.

    beforeEach(async function () {
        [owner, seller, buyer, relayer, arbiter] = await ethers.getSigners();

        // Deploy Mock FDC
        const MockFDC = await ethers.getContractFactory("MockFlareDataConnector");
        mockFDC = await MockFDC.deploy();

        // Deploy ShipmentTracker
        const ShipmentTracker = await ethers.getContractFactory("ShipmentTracker");
        shipmentTracker = await ShipmentTracker.deploy();

        // Deploy MockUSDT
        const MockUSDT = await ethers.getContractFactory("MockUSDT");
        mockUSDT = await MockUSDT.deploy();

        // Deploy PlasmaPaymentERC20
        const PlasmaPaymentERC20 = await ethers.getContractFactory("PlasmaPaymentERC20");
        plasmaPayment = await PlasmaPaymentERC20.deploy(
            await mockFDC.getAddress(),
            await shipmentTracker.getAddress(),
            await mockUSDT.getAddress()
        );

        // Setup Tokens: Mint to Buyer and Relayer
        await mockUSDT.mint(buyer.address, ethers.parseEther("1000"));
        await mockUSDT.mint(relayer.address, ethers.parseEther("1000"));

        // Approve Payment Contract
        await mockUSDT.connect(buyer).approve(await plasmaPayment.getAddress(), ethers.MaxUint256);
        await mockUSDT.connect(relayer).approve(await plasmaPayment.getAddress(), ethers.MaxUint256);

        // Set Arbiter
        await plasmaPayment.setArbiter(arbiter.address);

        // KYB Verify Seller
        await plasmaPayment.setKybedStatus(seller.address, true);
    });

    it("should prevent non-KYB seller from receiving orders", async function () {
        const amount = ethers.parseEther("100");
        const trackingId = "SHIP-FAIL-KYB";

        await expect(plasmaPayment.connect(buyer).createOrder(buyer.address, trackingId, amount, 100)) // Buyer trying to be seller? or Random
            .to.be.revertedWith("Seller not KYB verified");
    });

    it("should process standard ERC20 order and settlement", async function () {
        const amount = ethers.parseEther("100");
        const trackingId = "SHIP-ERC20-1";

        // Create Order
        await plasmaPayment.connect(buyer).createOrder(seller.address, trackingId, amount, 100);
        const orderId = (await plasmaPayment.queryFilter("OrderCreated"))[0].args[0];

        // Check Escrow Balance
        expect(await mockUSDT.balanceOf(await plasmaPayment.getAddress())).to.equal(amount);

        // Mock FDC Verification
        const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("ROOT"));
        await plasmaPayment.setMerkleRoot(merkleRoot);

        const attestationType = ethers.hexlify(ethers.randomBytes(32));
        const sourceId = ethers.hexlify(ethers.randomBytes(32));
        const requestBody = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["string", "string"], [trackingId, "Delivered"]));
        const leaf = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["bytes32", "bytes32", "bytes32"], [attestationType, sourceId, requestBody]));

        await mockFDC.setProofValidity(merkleRoot, leaf, true);
        const proof = [ethers.hexlify(ethers.randomBytes(32))];

        // Release Funds
        await plasmaPayment.releaseFunds(orderId, proof, attestationType, sourceId);

        // Verify Seller Balance
        expect(await mockUSDT.balanceOf(seller.address)).to.equal(amount);
    });

    it("should handle ERC20 disputes (Refund Buyer)", async function () {
        const amount = ethers.parseEther("100");
        const trackingId = "SHIP-ERC20-DISPUTE";

        await plasmaPayment.connect(buyer).createOrder(seller.address, trackingId, amount, 100);
        const orderId = (await plasmaPayment.queryFilter("OrderCreated"))[0].args[0];

        // Initiate Dispute
        await plasmaPayment.connect(buyer).initiateDispute(orderId);

        // Resolve (Refund)
        const initialBuyerBal = await mockUSDT.balanceOf(buyer.address);
        await plasmaPayment.connect(arbiter).resolveDispute(orderId, true);

        expect(await mockUSDT.balanceOf(buyer.address)).to.equal(initialBuyerBal + amount);
    });

    it("should support authorized relayer advance in ERC20", async function () {
        const amount = ethers.parseEther("100");
        const advanceAmount = ethers.parseEther("95");
        const trackingId = "SHIP-ERC20-OPT";

        await plasmaPayment.connect(buyer).createOrder(seller.address, trackingId, amount, 100);
        const orderId = (await plasmaPayment.queryFilter("OrderCreated"))[0].args[0];

        // Authorize Relayer
        await plasmaPayment.connect(seller).authorizeRelayer(orderId, relayer.address, advanceAmount);

        // Advance Payment (Relayer pays Seller in USDT)
        const initialSellerBal = await mockUSDT.balanceOf(seller.address);
        const initialRelayerBal = await mockUSDT.balanceOf(relayer.address);

        await plasmaPayment.connect(relayer).advancePaymentWithAmount(orderId, advanceAmount);

        expect(await mockUSDT.balanceOf(seller.address)).to.equal(initialSellerBal + advanceAmount);
        expect(await mockUSDT.balanceOf(relayer.address)).to.equal(initialRelayerBal - advanceAmount);

        // Verify new ownership
        const order = await plasmaPayment.orders(orderId);
        expect(order.seller).to.equal(relayer.address);
    });
});
