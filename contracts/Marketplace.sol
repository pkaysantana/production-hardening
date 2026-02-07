// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DeliveryEscrow.sol";

contract Marketplace {
    // orderId = hash of your Supabase UUID
    mapping(bytes32 => address) public escrowOfOrder;

    event EscrowCreated(
        bytes32 indexed orderId,
        address indexed buyer,
        address indexed seller,
        address escrow,
        address usdt,
        uint256 deadlineDuration
    );

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

        DeliveryEscrow e = new DeliveryEscrow(
            msg.sender,        // buyer
            seller,
            usdtAddress,
            deadlineDuration
        );

        escrow = address(e);
        escrowOfOrder[orderId] = escrow;

        emit EscrowCreated(
            orderId,
            msg.sender,
            seller,
            escrow,
            usdtAddress,
            deadlineDuration
        );
    }
}