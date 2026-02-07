// SPDX-License-Identifier: MIT
<<<<<<< HEAD
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
=======
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDT
 * @notice Mock Tether USD for Plasma Testnet demonstration
 * @dev Mints 1,000,000 USDT to deployer on construction
 */
contract MockUSDT is ERC20 {
    constructor() ERC20("Tether USD", "USDT") {
        // Mint 1,000,000 USDT (18 decimals) to msg.sender
        _mint(msg.sender, 1_000_000 * 10**18);
    }

    /**
     * @notice Allows anyone to mint additional tokens for testing
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
>>>>>>> 3b62e20654a84d1b2785072dc0e7969f5f2da691
