// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DeliveryEscrow {
    
    address public buyer;
    address public seller;
    address public marketplace;

    
    IERC20 public usdtToken;

    
    uint256 public amount;
    bool public released;
    bool public cancelled;
    uint256 public deadline;

    
    event Deposited(uint256 amount);
    event Released(address indexed seller, uint256 amount);
    event Refunded(address indexed buyer, uint256 amount);

    constructor(
        address _buyer,
        address _seller,
        address _marketplace,
        address _usdtAddress,
        uint256 _deadlineDuration
    ) {
        buyer = _buyer;
        seller = _seller;
        marketplace = _marketplace;
        usdtToken = IERC20(_usdtAddress);
        deadline = block.timestamp + _deadlineDuration;
    }

    
    function deposit(uint256 _amount) external {
        require(msg.sender == marketplace, "Only marketplace");
        require(amount == 0, "Already funded");
        require(!released && !cancelled, "Already settled");

        usdtToken.transferFrom(msg.sender, address(this), _amount);
        amount = _amount;

        emit Deposited(_amount);
    }

    
    function releaseToSeller() external {
        require(msg.sender == buyer, "Only buyer");
        require(amount > 0, "No funds");
        require(!released && !cancelled, "Already settled");
        require(block.timestamp <= deadline, "Deadline passed");

        released = true;
        usdtToken.transfer(seller, amount);

        emit Released(seller, amount);
    }

    
    function refundBuyer() external {
        require(msg.sender == buyer, "Only buyer");
        require(amount > 0, "No funds");
        require(!released && !cancelled, "Already settled");
        require(block.timestamp > deadline, "Deadline not reached");

        cancelled = true;
        usdtToken.transfer(buyer, amount);

        emit Refunded(buyer, amount);
    }
}