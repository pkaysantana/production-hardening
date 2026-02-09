// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./OrderTypes.sol";
import "./interfaces/IFlareDataConnector.sol";
import "./ShipmentTracker.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PlasmaPayment is Ownable, ReentrancyGuard {
    using OrderTypes for OrderTypes.Order;

    IFlareDataConnector public fdc;
    ShipmentTracker public shipmentTracker;
    
    mapping(bytes32 => OrderTypes.Order) public orders;
    mapping(string => bytes32) public orderIdByTrackingId;
    bytes32 public latestMerkleRoot; 
    address public arbiter;

    struct RelayerInfo {
        address authorizedRelayer;
        uint256 minAdvanceAmount;
    }
    mapping(bytes32 => RelayerInfo) public relayerInfos;

    event OrderCreated(bytes32 indexed orderId, address indexed buyer, address indexed seller, uint256 amount);
    event FundsReleased(bytes32 indexed orderId, address indexed seller, uint256 amount);
    event DisputeInitiated(bytes32 indexed orderId, address indexed initiator);
    event DisputeResolved(bytes32 indexed orderId, address indexed resolver, bool refundedToBuyer);
    event RelayerAuthorized(bytes32 indexed orderId, address indexed relayer, uint256 minAmount);
    event PaymentAdvanced(bytes32 indexed orderId, address indexed oldSeller, address indexed newSeller, uint256 amount);

    constructor(address _fdcAddress, address _shipmentTrackerAddress) Ownable(msg.sender) {
        fdc = IFlareDataConnector(_fdcAddress);
        shipmentTracker = ShipmentTracker(_shipmentTrackerAddress);
        arbiter = msg.sender; // Initial arbiter is owner
    }

    function setArbiter(address _arbiter) external onlyOwner {
        arbiter = _arbiter;
    }

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
            (bool success, ) = payable(order.buyer).call{value: order.amount}("");
            require(success, "Refund failed");
        } else {
            order.status = OrderTypes.OrderStatus.Settled; // Force settle to seller
            (bool success, ) = payable(order.seller).call{value: order.amount}("");
            require(success, "Transfer failed");
        }

        emit DisputeResolved(_orderId, msg.sender, _refundBuyer);
    }

    function createOrder(
        address _seller,
        string memory _trackingId, 
        uint256 _amount,
        uint256 _fxRate,
        uint256 _deliveryWindow
    ) external payable {
        require(msg.value == _amount, "Incorrect amount sent");

        bytes32 orderId = keccak256(abi.encodePacked(msg.sender, _seller, block.timestamp));
        
        orders[orderId] = OrderTypes.Order({
            orderId: orderId,
            buyer: msg.sender,
            seller: _seller,
            amount: _amount,
            fxRate: _fxRate,
            deliveryDeadline: block.timestamp + _deliveryWindow,
            trackingId: _trackingId,
            status: OrderTypes.OrderStatus.Escrowed
        });

        require(orderIdByTrackingId[_trackingId] == bytes32(0), "Tracking ID already used");
        orderIdByTrackingId[_trackingId] = orderId;

        emit OrderCreated(orderId, msg.sender, _seller, _amount);
    }

    function claimTimeout(bytes32 _orderId) external nonReentrant {
        OrderTypes.Order storage order = orders[_orderId];
        require(order.status == OrderTypes.OrderStatus.Escrowed, "Order not in escrow");
        require(block.timestamp > order.deliveryDeadline, "Deadline not passed");
        require(msg.sender == order.buyer, "Only buyer can claim timeout");

        order.status = OrderTypes.OrderStatus.Refunded;
        (bool success, ) = payable(order.buyer).call{value: order.amount}("");
        require(success, "Refund failed");

        emit DisputeResolved(_orderId, msg.sender, true); // Reusing event or create new "TimeoutClaimed"
    }

    function authorizeRelayer(bytes32 _orderId, address _relayer, uint256 _minAmount) external {
        OrderTypes.Order storage order = orders[_orderId];
        require(msg.sender == order.seller, "Only seller can authorize");
        require(order.status == OrderTypes.OrderStatus.Escrowed, "Order not in escrow");
        
        relayerInfos[_orderId] = RelayerInfo(_relayer, _minAmount);
        emit RelayerAuthorized(_orderId, _relayer, _minAmount);
    }

    function advancePayment(bytes32 _orderId) external payable nonReentrant {
        OrderTypes.Order storage order = orders[_orderId];
        RelayerInfo memory info = relayerInfos[_orderId];
        
        require(order.status == OrderTypes.OrderStatus.Escrowed, "Order not in escrow");
        require(msg.sender == info.authorizedRelayer, "Not authorized relayer");
        require(msg.value >= info.minAdvanceAmount, "Insufficient advance amount");
        
        address oldSeller = order.seller;
        
        // Transfer Order Ownership to Relayer
        order.seller = msg.sender;
        
        // Pay Old Seller immediately from Relayer's funds
        (bool success, ) = payable(oldSeller).call{value: msg.value}("");
        require(success, "Transfer failed");
        
        emit PaymentAdvanced(_orderId, oldSeller, msg.sender, msg.value);
    }

    function setMerkleRoot(bytes32 _newRoot) external onlyOwner {
        // In a real scenario, this would be restricted to a trusted governance or FDC system update
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
        // expectedLeaf = keccak256(abi.encode(attestationType, sourceId, keccak256(abi.encode(trackingId, "Delivered"))))
        bytes32 requestBody = keccak256(abi.encode(order.trackingId, "Delivered"));
        bytes32 leaf = keccak256(abi.encode(_attestationType, _sourceId, requestBody));

        require(fdc.verifyMerkleProof(_proof, latestMerkleRoot, leaf), "Invalid Merkle proof");

        order.status = OrderTypes.OrderStatus.Delivered;
        
        (bool success, ) = payable(order.seller).call{value: order.amount}("");
        require(success, "Transfer failed");
        
        emit FundsReleased(_orderId, order.seller, order.amount);
    }
}
