// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./OrderTypes.sol";
import "./interfaces/IFlareDataConnector.sol";
import "./ShipmentTracker.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract PlasmaPaymentERC20 is Ownable, ReentrancyGuard {
    using OrderTypes for OrderTypes.Order;

    IFlareDataConnector public fdc;
    ShipmentTracker public shipmentTracker;
    IERC20 public paymentToken; // Renamed from usdt to be generic
    
    mapping(bytes32 => OrderTypes.Order) public orders;
    bytes32 public latestMerkleRoot; 
    address public arbiter;

    struct RelayerInfo {
        address authorizedRelayer;
        uint256 minAdvanceAmount;
    }
    mapping(bytes32 => RelayerInfo) public relayerInfos;
    mapping(address => bool) public isKybed;

    event OrderCreated(bytes32 indexed orderId, address indexed buyer, address indexed seller, uint256 amount);
    event FundsReleased(bytes32 indexed orderId, address indexed seller, uint256 amount);
    event DisputeInitiated(bytes32 indexed orderId, address indexed initiator);
    event DisputeResolved(bytes32 indexed orderId, address indexed resolver, bool refundedToBuyer);
    event RelayerAuthorized(bytes32 indexed orderId, address indexed relayer, uint256 minAmount);
    event PaymentAdvanced(bytes32 indexed orderId, address indexed oldSeller, address indexed newSeller, uint256 amount);
    event KybStatusSet(address indexed seller, bool status);

    constructor(address _fdcAddress, address _shipmentTrackerAddress, address _tokenAddress) Ownable(msg.sender) {
        fdc = IFlareDataConnector(_fdcAddress);
        shipmentTracker = ShipmentTracker(_shipmentTrackerAddress);
        paymentToken = IERC20(_tokenAddress);
        arbiter = msg.sender;
    }

    function setArbiter(address _arbiter) external onlyOwner {
        arbiter = _arbiter;
    }

    function setKybedStatus(address _seller, bool _status) external onlyOwner {
        isKybed[_seller] = _status;
        emit KybStatusSet(_seller, _status);
    }

    // --- Dispute Resolution ---

    function initiateDispute(bytes32 _orderId) external nonReentrant {
        OrderTypes.Order storage order = orders[_orderId];
        require(order.status == OrderTypes.OrderStatus.Escrowed, "Order not in escrow");
        require(msg.sender == order.buyer || msg.sender == order.seller, "Only buyer or seller can dispute");

        order.status = OrderTypes.OrderStatus.Disputed;
        emit DisputeInitiated(_orderId, msg.sender);
    }

    function resolveDispute(bytes32 _orderId, bool _refundBuyer) external nonReentrant {
        require(msg.sender == arbiter, "Only arbiter can resolve");
        OrderTypes.Order storage order = orders[_orderId];
        require(order.status == OrderTypes.OrderStatus.Disputed, "Order not disputed");

        if (_refundBuyer) {
            order.status = OrderTypes.OrderStatus.Refunded;
            require(paymentToken.transfer(order.buyer, order.amount), "Refund failed");
        } else {
            order.status = OrderTypes.OrderStatus.Settled;
            require(paymentToken.transfer(order.seller, order.amount), "Transfer failed");
        }

        emit DisputeResolved(_orderId, msg.sender, _refundBuyer);
    }

    function claimTimeout(bytes32 _orderId) external nonReentrant {
        OrderTypes.Order storage order = orders[_orderId];
        require(order.status == OrderTypes.OrderStatus.Escrowed, "Order not in escrow");
        require(block.timestamp > order.deliveryDeadline, "Deadline not passed");
        require(msg.sender == order.buyer, "Only buyer can claim timeout");

        order.status = OrderTypes.OrderStatus.Refunded;
        require(paymentToken.transfer(order.buyer, order.amount), "Refund failed");

        emit DisputeResolved(_orderId, msg.sender, true);
    }

    // --- Optimistic Settlement ---

    function authorizeRelayer(bytes32 _orderId, address _relayer, uint256 _minAmount) external {
        OrderTypes.Order storage order = orders[_orderId];
        require(msg.sender == order.seller, "Only seller can authorize");
        require(order.status == OrderTypes.OrderStatus.Escrowed, "Order not in escrow");
        
        relayerInfos[_orderId] = RelayerInfo(_relayer, _minAmount);
        emit RelayerAuthorized(_orderId, _relayer, _minAmount);
    }

    function advancePayment(bytes32 _orderId) external nonReentrant {
        OrderTypes.Order storage order = orders[_orderId];
        RelayerInfo memory info = relayerInfos[_orderId];
        
        require(order.status == OrderTypes.OrderStatus.Escrowed, "Order not in escrow");
        require(msg.sender == info.authorizedRelayer, "Not authorized relayer");
        
        // Relayer pays via ERC20 TransferFrom (must approve first)
        // Check allowance? transferFrom handles it.
        // Relayer pays the seller immediately.
        // NOTE: Does Relayer pay the 'amount' or 'minAdvanceAmount'? 
        // Logic: Relayer should probably pay 'minAdvanceAmount' or more.
        // Let's assume passed amount isn't an argument, we just allow them to pay the stored min? 
        // Or wait, in native ETH version `msg.value` was used. Here we need an amount param?
        // Let's add `_amount` param to be flexible, but must be >= min.
    }

   function advancePaymentWithAmount(bytes32 _orderId, uint256 _amount) external nonReentrant {
        OrderTypes.Order storage order = orders[_orderId];
        RelayerInfo memory info = relayerInfos[_orderId];
        
        require(order.status == OrderTypes.OrderStatus.Escrowed, "Order not in escrow");
        require(msg.sender == info.authorizedRelayer, "Not authorized relayer");
        require(_amount >= info.minAdvanceAmount, "Insufficient advance amount");

        address oldSeller = order.seller;
        
        // Transfer ownership
        order.seller = msg.sender;

        // Transfer Tokens from Relayer to Old Seller
        require(paymentToken.transferFrom(msg.sender, oldSeller, _amount), "Token Transfer failed");
        
        emit PaymentAdvanced(_orderId, oldSeller, msg.sender, _amount);
    }

    function createOrder(
        address _seller,
        string memory _trackingId, 
        uint256 _amount,
        uint256 _fxRate
    ) external {
        require(isKybed[_seller], "Seller not KYB verified");
        // Funds are transferred FROM the buyer TO this contract contract (Escrow)
        // User must Approve this contract first!
        require(paymentToken.transferFrom(msg.sender, address(this), _amount), "Token Transfer failed");

        bytes32 orderId = keccak256(abi.encodePacked(msg.sender, _seller, block.timestamp));
        
        orders[orderId] = OrderTypes.Order({
            orderId: orderId,
            buyer: msg.sender,
            seller: _seller,
            amount: _amount,
            fxRate: _fxRate,
            deliveryDeadline: block.timestamp + 3600, // Default 1 hour for ERC20 version for now
            trackingId: _trackingId,
            status: OrderTypes.OrderStatus.Escrowed
        });

        emit OrderCreated(orderId, msg.sender, _seller, _amount);
    }

    function setMerkleRoot(bytes32 _newRoot) external onlyOwner {
        latestMerkleRoot = _newRoot;
    }

    function releaseFunds(
        bytes32 _orderId, 
        bytes32[] calldata _proof,
        bytes32 _attestationType,
        bytes32 _sourceId
    ) external nonReentrant {
        OrderTypes.Order storage order = orders[_orderId];
        require(order.status == OrderTypes.OrderStatus.Escrowed, "Order not in escrow");
        
        // Canonical FDC: Reconstruct the leaf to bind proof to THIS shipment
        bytes32 requestBody = keccak256(abi.encode(order.trackingId, "Delivered"));
        bytes32 leaf = keccak256(abi.encode(_attestationType, _sourceId, requestBody));

        // Verify FDC Proof
        require(fdc.verifyMerkleProof(_proof, latestMerkleRoot, leaf), "Invalid Merkle proof");

        order.status = OrderTypes.OrderStatus.Delivered;
        
        // Release Tokens to the Seller
        require(paymentToken.transfer(order.seller, order.amount), "Token Release failed");
        
        emit FundsReleased(_orderId, order.seller, order.amount);
    }
}
