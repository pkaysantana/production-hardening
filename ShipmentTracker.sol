// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.20;
contract ShipmentTracker {
    enum Status { //shipment status
        Created,
        PickedUp,
        InTransit,
        Delivered,
        Cancelled
    }
    struct Shipment {
        string shipmentId;
        address sender;
        address receiver;
        Status status;
        uint256 lastUpdated;
    }
    mapping(string=>Shipment) public shipments; //links shipment ID to shipment data
    function createShipment(
        string memory _shipmentId,
        address _receiver
    ) public{ //call from wallet to create shipment
        shipments[_shipmentId]=Shipment({
            shipmentId:_shipmentId,
            sender:msg.sender,
            receiver:_receiver,
            status:Status.Created,
            lastUpdated:block.timestamp
        });

    }
        function updateStatus( //only sender or reciever can update status
            string memory _shipmentId, // prevets randomers from modifying shipments
            Status _status
        ) public {
            Shipment storage s = shipments[_shipmentId];

            require(
                msg.sender == s.sender || msg.sender == s.receiver,
                "Not authorized"
            );

            s.status = _status;
            s.lastUpdated = block.timestamp;
        }

        function cancelShipment(string memory _shipmentId) public {
            Shipment storage s = shipments[_shipmentId];

            require(msg.sender == s.sender, "Only sender can cancel");
            require(s.status != Status.Delivered, "Already delivered");

            s.status = Status.Cancelled;
            s.lastUpdated = block.timestamp;
        }
    }
