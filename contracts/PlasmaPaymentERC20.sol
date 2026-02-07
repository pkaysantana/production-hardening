// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./OrderTypes.sol";
import "./IFlareDataConnector.sol";
import "./ShipmentTracker.sol";

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract PlasmaPaymentERC20 {
    using OrderTypes for OrderTypes.Order;

    IFlareDataConnector public fdc;
    ShipmentTracker public shipmentTracker;
    IERC20 public paymentToken; // Renamed from usdt to be generic
    
    mapping(bytes32 => OrderTypes.Order) public orders;
    bytes32 public latestMerkleRoot; 

    event OrderCreated(bytes32 indexed orderId, address indexed buyer, address indexed seller, uint256 amount);
    event FundsReleased(bytes32 indexed orderId, address indexed seller, uint256 amount);

    constructor(address _fdcAddress, address _shipmentTrackerAddress, address _tokenAddress) {
        fdc = IFlareDataConnector(_fdcAddress);
        shipmentTracker = ShipmentTracker(_shipmentTrackerAddress);
        paymentToken = IERC20(_tokenAddress);
    }

    function createOrder(
        address _seller,
        string memory _trackingId, 
        uint256 _amount,
        uint256 _fxRate
    ) external {
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
            trackingId: _trackingId,
            status: OrderTypes.OrderStatus.Escrowed
        });

        emit OrderCreated(orderId, msg.sender, _seller, _amount);
    }

    function setMerkleRoot(bytes32 _newRoot) external {
        latestMerkleRoot = _newRoot;
    }

    function releaseFunds(bytes32 _orderId, bytes32[] calldata _proof) external {
        OrderTypes.Order storage order = orders[_orderId];
        require(order.status == OrderTypes.OrderStatus.Escrowed, "Order not in escrow");
        
        bytes32 leaf = keccak256(abi.encodePacked(order.trackingId, "Delivered"));

        // Verify FDC Proof
        require(fdc.verifyMerkleProof(_proof, latestMerkleRoot, leaf), "Invalid Merkle proof");

        order.status = OrderTypes.OrderStatus.Delivered;
        
        // Release Tokens to the Seller
        require(paymentToken.transfer(order.seller, order.amount), "Token Release failed");
        
        emit FundsReleased(_orderId, order.seller, order.amount);
    }
}
