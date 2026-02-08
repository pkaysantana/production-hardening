// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract DeliveryRegistry {
    event DeliveryConfirmed(bytes32 orderId);

    function confirmDelivery(bytes32 orderId) external {
        emit DeliveryConfirmed(orderId);
    }
}