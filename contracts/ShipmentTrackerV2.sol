// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IFlareDataConnector.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ShipmentTrackerV2 is Ownable {
    enum Status {
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
    
    // V2: FDC Contract Reference
    address public fdcContract;

    event ShipmentCreated(string shipmentId, address indexed sender, address indexed receiver);
    event AttestationRequested(string shipmentId, bytes32 indexed attestationId);
    event ShipmentDelivered(string shipmentId);

    constructor(address _fdcContract) Ownable(msg.sender) {
        require(_fdcContract != address(0), "FDC address cannot be zero");
        fdcContract = _fdcContract;
    }

    function setAuthorizedUpdater(address _updater, bool _authorized) external onlyOwner {
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

        emit ShipmentCreated(_shipmentId, msg.sender, _receiver);
    }

    function requestAttestation(string memory _shipmentId) public {
        Shipment storage s = shipments[_shipmentId];
        require(s.sender != address(0), "Shipment not found");
        
        // V2: In real mode, this event signals the off-chain operator to start the FDC round.
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

        // V2: Prevent manual 'Delivered' status. Must use verifyDelivery() via FDC.
        require(_status != Status.Delivered, "Cannot manually set Delivered. Use FDC.");

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

    // V2: FDC Verification Logic
    function verifyDelivery(
        string memory _shipmentId,
        bytes32[] calldata proof,
        bytes32 merkleRoot,
        bytes32 attestationType,
        bytes32 sourceId
    ) external {
        Shipment storage s = shipments[_shipmentId];
        require(s.sender != address(0), "Shipment not found");
        require(s.status != Status.Delivered, "Already delivered");

        // Canonical FDC: Reconstruct the leaf to bind proof to THIS shipment
        // expectedLeaf = keccak256(abi.encode(attestationType, sourceId, keccak256(abi.encode(_shipmentId, "Delivered"))))
        bytes32 requestBody = keccak256(abi.encode(_shipmentId, "Delivered"));
        bytes32 expectedLeaf = keccak256(abi.encode(attestationType, sourceId, requestBody));

        // Call FDC to verify the proof against the RECONSTRUCTED leaf
        bool isValid = IFlareDataConnector(fdcContract).verifyMerkleProof(
            proof,
            merkleRoot,
            expectedLeaf
        );

        require(isValid, "FDC: Invalid Merkle Proof for this Shipment");

        // If valid, update state
        s.status = Status.Delivered;
        s.lastUpdated = block.timestamp;
        
        emit ShipmentDelivered(_shipmentId);
    }
}
