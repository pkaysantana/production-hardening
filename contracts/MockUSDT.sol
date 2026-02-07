// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDT is ERC20 {
    constructor() ERC20("Mock USDT", "USDT") {
        // Mint 1,000,000 USDT to the deployer
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    // Extra mint function for testing (optional but useful)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}