// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract PaymentEscrow {
    using SafeERC20 for IERC20;

    address public buyer;
    address public seller;
    address public deliveryOracle;
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
        address _usdtAddress,
        uint256 _deadlineDuration,
        address _deliveryOracle
    ) {
        buyer = _buyer;
        seller = _seller;
        deliveryOracle = _deliveryOracle;
        usdtToken = IERC20(_usdtAddress);
        deadline = block.timestamp + _deadlineDuration;
    }

    function setDeliveryOracle(address _oracle) external {
    require(deliveryOracle == address(0), "Oracle already set");
    require(_oracle != address(0), "Invalid oracle");
    deliveryOracle = _oracle;
}

    function deposit(uint256 _amount) external {
        require(msg.sender == buyer, "Only buyer");
        require(amount == 0, "Already funded");
        require(_amount > 0, "Amount zero");

        amount = _amount;
        usdtToken.safeTransferFrom(msg.sender, address(this), _amount);

        emit Deposited(_amount);
    }

   function releaseToSeller() external {
        require(msg.sender == deliveryOracle, "Only delivery oracle");
        require(amount > 0, "No funds");
        require(!released && !cancelled, "Already settled");
        require(block.timestamp <= deadline, "Deadline passed");

        released = true;

        usdtToken.safeTransfer(seller, amount);

        emit Released(seller, amount);
    }

    function refundBuyer() external {
        require(msg.sender == buyer, "Only buyer");
        require(amount > 0, "No funds");
        require(!released && !cancelled, "Already settled");
        require(block.timestamp > deadline, "Deadline not reached");

        cancelled = true;

        usdtToken.safeTransfer(buyer, amount);

        emit Refunded(buyer, amount);
    }
}