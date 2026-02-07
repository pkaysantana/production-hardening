// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {
    ContractRegistry
} from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";

import {
    FtsoV2Interface
} from "@flarenetwork/flare-periphery-contracts/coston2/FtsoV2Interface.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DeliveryEscrowFtsoV2_USDT {
    address public buyer;
    address public seller;

    IERC20 public usdtToken;
    uint256 public amount;

    FtsoV2Interface public ftsoV2;
    bytes21[] public feedIds;

    constructor(
        address _seller,
        address _usdtAddress,
        bytes21[] memory _feedIds
    ) {
        buyer = msg.sender;
        seller = _seller;
        usdtToken = IERC20(_usdtAddress);
        feedIds = _feedIds;

    
        ftsoV2 = ContractRegistry.getFtsoV2();
    }

  
    function deposit(uint256 _amount) external {
        require(msg.sender == buyer, "Only buyer can deposit");
        require(amount == 0, "Already deposited");

        usdtToken.transferFrom(msg.sender, address(this), _amount);
        amount = _amount;
    }


    function releasePaymentIfDelivered() external {
        require(msg.sender == buyer, "Only buyer can release");
        require(amount > 0, "No funds");

        (
            uint256[] memory values,
            ,
            uint64 timestamp
        ) = ftsoV2.getFeedsById(feedIds);

 
        require(values[0] > 0, "Delivery not confirmed");

        uint256 payout = amount;
        amount = 0;

        usdtToken.transfer(seller, payout);
    }
}
