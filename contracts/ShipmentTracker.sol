// Optional Flare FDC shipping verifications

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

    mapping(string => Shipment) public shipments;
    mapping(string => bytes32) public attestationRequests;
    mapping(address => bool) public authorizedUpdaters;

    event AttestationRequested(string shipmentId, bytes32 indexed attestationId);

    function setAuthorizedUpdater(address _updater, bool _authorized) external {
        authorizedUpdaters[_updater] = _authorized;
    }

    function createShipment(
        string memory _shipmentId,
        address _receiver
    ) public {
        shipments[_shipmentId] = Shipment({
            shipmentId: _shipmentId,
            sender: msg.sender,
            receiver: _receiver,
            status: Status.Created,
            lastUpdated: block.timestamp
        });
    }

    function requestAttestation(string memory _shipmentId) public {
        Shipment storage s = shipments[_shipmentId];
        require(s.sender != address(0), "Shipment not found");
        
        // specific logic to generate attestation ID would go here
        bytes32 attestationId = keccak256(abi.encodePacked(_shipmentId, block.timestamp));
        attestationRequests[_shipmentId] = attestationId;
        
        emit AttestationRequested(_shipmentId, attestationId);
    }

    function updateStatus(
        string memory _shipmentId,
        Status _status
    ) public {
        Shipment storage s = shipments[_shipmentId];

        require(
            msg.sender == s.sender || 
            msg.sender == s.receiver || 
            authorizedUpdaters[msg.sender],
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