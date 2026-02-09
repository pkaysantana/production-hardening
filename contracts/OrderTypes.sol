// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library OrderTypes {
    enum OrderStatus { Pending, Escrowed, Shipped, Delivered, Settled, Disputed, Refunded, Cancelled }

    struct Order {
        bytes32 orderId;        // keccak256 hash of (buyer, seller, timestamp)
        address buyer;
        address seller;
        uint256 amount;         // Amount in stablecoins (Plasma)
        uint256 fxRate;         // Captured from Flare FTSO
        uint256 deliveryDeadline; // Timestamp after which buyer can claim timeout
        string trackingId;      // Web2 ID for Flare FDC verification
        OrderStatus status;
    }
}