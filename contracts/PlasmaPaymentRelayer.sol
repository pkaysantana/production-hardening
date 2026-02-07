// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PlasmaPaymentRelayer is Ownable {
    
    // The trusted off-chain relayer (our bot)
    address public relayer;
    IERC20 public usdtToken;

    struct Order {
        uint256 amount;
        address seller;
        bool released;
        bool exists;
    }

    // Mapping from Order ID (string) to Order details
    mapping(string => Order) public orders;

    event OrderCreated(string orderId, uint256 amount, address seller);
    event FundsReleased(string orderId, uint256 amount, address seller);
    event RelayerUpdated(address newRelayer);

    constructor(address _relayer, address _usdtToken) Ownable(msg.sender) {
        relayer = _relayer;
        usdtToken = IERC20(_usdtToken);
    }

    modifier onlyRelayer() {
        require(msg.sender == relayer, "Only Relayer can call this");
        _;
    }

    // 1. Buyer creates an order and locks funds
    function createOrder(string memory _orderId, uint256 _amount, address _seller) external {
        require(!orders[_orderId].exists, "Order already exists");
        require(_amount > 0, "Amount must be > 0");

        // Transfer USDT from Buyer to Contract
        usdtToken.transferFrom(msg.sender, address(this), _amount);

        orders[_orderId] = Order({
            amount: _amount,
            seller: _seller,
            released: false,
            exists: true
        });

        emit OrderCreated(_orderId, _amount, _seller);
    }

    // 2. Relayer releases funds after verifying Flare proof
    function releaseFunds(string memory _orderId) external onlyRelayer {
        Order storage order = orders[_orderId];
        require(order.exists, "Order not found");
        require(!order.released, "Funds already released");

        order.released = true;
        usdtToken.transfer(order.seller, order.amount);

        emit FundsReleased(_orderId, order.amount, order.seller);
    }

    // Admin function to update relayer if key is compromised
    function setRelayer(address _newRelayer) external onlyOwner {
        relayer = _newRelayer;
        emit RelayerUpdated(_newRelayer);
    }
}
