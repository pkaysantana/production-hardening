// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library OrderTypes {
    enum OrderStatus { Pending, Escrowed, Shipped, Delivered, Settled, Disputed }

    struct Order {
        bytes32 orderId;        // keccak256 hash of (buyer, seller, timestamp)
        address buyer;
        address seller;
        uint256 amount;         // Amount in stablecoins (Plasma)
        uint256 fxRate;         // Captured from Flare FTSO
        string trackingId;      // Web2 ID for Flare FDC verification
        OrderStatus status;
    }
}