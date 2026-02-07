// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./OrderTypes.sol";
import "./IFlareDataConnector.sol";
import "./ShipmentTracker.sol";

contract PlasmaPayment {
    using OrderTypes for OrderTypes.Order;

    IFlareDataConnector public fdc;
    ShipmentTracker public shipmentTracker;
    
    mapping(bytes32 => OrderTypes.Order) public orders;
    bytes32 public latestMerkleRoot; // This would be updated by the FDC attestation provider

    event OrderCreated(bytes32 indexed orderId, address indexed buyer, address indexed seller, uint256 amount);
    event FundsReleased(bytes32 indexed orderId, address indexed seller, uint256 amount);

    constructor(address _fdcAddress, address _shipmentTrackerAddress) {
        fdc = IFlareDataConnector(_fdcAddress);
        shipmentTracker = ShipmentTracker(_shipmentTrackerAddress);
    }

    function createOrder(
        address _seller,
        string memory _trackingId, 
        uint256 _amount,
        uint256 _fxRate
    ) external payable {
        require(msg.value == _amount, "Incorrect amount sent");

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

        // Optionally create the shipment in ShipmentTracker if it doesn't exist?
        // shipmentTracker.createShipment(_trackingId, msg.sender); 

        emit OrderCreated(orderId, msg.sender, _seller, _amount);
    }

    function setMerkleRoot(bytes32 _newRoot) external {
        // In a real scenario, this would be restricted to a trusted governance or FDC system update
        latestMerkleRoot = _newRoot;
    }

    function releaseFunds(bytes32 _orderId, bytes32[] calldata _proof) external {
        OrderTypes.Order storage order = orders[_orderId];
        require(order.status == OrderTypes.OrderStatus.Escrowed, "Order not in escrow");
        
        // Construct the leaf node that represents the successful delivery state.
        // This format depends on how the attestation is packed.
        // For simplicity, we assume the leaf is just the hash of the tracking ID + "Delivered" status.
        bytes32 leaf = keccak256(abi.encodePacked(order.trackingId, "Delivered"));

        require(fdc.verifyMerkleProof(_proof, latestMerkleRoot, leaf), "Invalid Merkle proof");

        order.status = OrderTypes.OrderStatus.Delivered;
        
        payable(order.seller).transfer(order.amount);
        
        // Update ShipmentTracker status
        // Note: ShipmentTracker.updateStatus checks msg.sender, so PlasmaPayment needs to be authorized 
        // OR we just assume PlasmaPayment is handled separately.
        // Assuming PlasmaPayment can call if logic permits, or we skip if not needed for this step.
        
        emit FundsReleased(_orderId, order.seller, order.amount);
    }
}
