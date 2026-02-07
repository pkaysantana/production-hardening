// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PaymentEscrow.sol";

contract Marketplace {
    // orderId = hash of your Supabase UUID
    mapping(bytes32 => address) public escrowOfOrder;

    // 🔒 Stationary delivery oracle (set once)
    address public immutable deliveryOracle;

    event EscrowCreated(
        bytes32 indexed orderId,
        address indexed buyer,
        address indexed seller,
        address escrow,
        address usdt,
        uint256 deadlineDuration,
        address deliveryOracle
    );

    constructor(address _deliveryOracle) {
        require(_deliveryOracle != address(0), "Invalid oracle");
        deliveryOracle = _deliveryOracle;
    }

    function createEscrowForOrder(
        bytes32 orderId,
        address seller,
        address usdtAddress,
        uint256 deadlineDuration
    ) external returns (address escrow) {
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