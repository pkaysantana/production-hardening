// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PaymentEscrow.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract Marketplace is Ownable, Pausable {
    // orderId = hash of your Supabase UUID
    mapping(bytes32 => address) public escrowOfOrder;

    // 🔒 Stationary delivery oracle (updatable)
    address public deliveryOracle;

    event EscrowCreated(
        bytes32 indexed orderId,
        address indexed buyer,
        address indexed seller,
        address escrow,
        address usdt,
        uint256 deadlineDuration,
        address deliveryOracle
    );

    event OracleUpdated(address indexed oldOracle, address indexed newOracle);

    constructor(address _deliveryOracle) Ownable(msg.sender) {
        require(_deliveryOracle != address(0), "Invalid oracle");
        deliveryOracle = _deliveryOracle;
    }

    function setDeliveryOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "Invalid oracle");
        emit OracleUpdated(deliveryOracle, _newOracle);
        deliveryOracle = _newOracle;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function createEscrowForOrder(
        bytes32 orderId,
        address seller,
        address usdtAddress,
        uint256 deadlineDuration
    ) external whenNotPaused returns (address escrow) {
        require(escrowOfOrder[orderId] == address(0), "Escrow already exists");
        require(seller != address(0), "Invalid seller");
        require(usdtAddress != address(0), "Invalid token");
        require(seller != msg.sender, "Buyer cannot be seller");

        PaymentEscrow e = new PaymentEscrow(
            msg.sender,        // buyer
            seller,            // seller
            usdtAddress,       // token
            deadlineDuration,  // deadline
            deliveryOracle     // 🚚 oracle
        );

        escrow = address(e);
        escrowOfOrder[orderId] = escrow;

        emit EscrowCreated(
            orderId,
            msg.sender,
            seller,
            escrow,
            usdtAddress,
            deadlineDuration,
            deliveryOracle
        );
    }
}