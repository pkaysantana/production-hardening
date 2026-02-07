// SPDX-License-Identifier: MIT
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
