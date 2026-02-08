// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FXSettlement
 * @notice Protects SMEs from FX volatility during the shipping window by locking
 *         exchange rates at order creation using Flare's FTSO.
 * @dev This contract works alongside PlasmaPaymentRelayer to provide FX protection
 *      for cross-border B2B transactions.
 * 
 * Flow:
 * 1. Buyer creates order with local currency amount (e.g., 1000 EUR)
 * 2. Contract queries FTSO for current EUR/USD rate and locks it
 * 3. Buyer deposits equivalent USDT based on locked rate
 * 4. At settlement (after delivery), seller receives USDT at the LOCKED rate
 *    - NOT the current market rate, protecting both parties from volatility
 */

/// @notice Interface for Flare's FTSO Registry to fetch FX rates
interface IFtsoRegistry {
    function getCurrentPriceWithDecimals(string memory _symbol) 
        external view 
        returns (uint256 _price, uint256 _timestamp, uint256 _decimals);
    
    function getSupportedSymbols() 
        external view 
        returns (string[] memory);
}

contract FXSettlement is Ownable {
    
    // ======================== STATE VARIABLES ========================
    
    /// @notice The FTSO Registry contract for fetching FX rates
    IFtsoRegistry public ftsoRegistry;
    
    /// @notice The stablecoin used for settlement (USDT)
    IERC20 public settlementToken;
    
    /// @notice Trusted relayer address (same as PlasmaPaymentRelayer)
    address public relayer;
    
    /// @notice Maximum age of a price feed (default: 2 hours)
    uint256 public maxPriceAge = 7200;
    
    /// @notice Struct to store FX order details
    struct FXOrder {
        string symbol;           // FX pair symbol (e.g., "EUR", "GBP")
        uint256 localAmount;     // Amount in local currency (with decimals)
        uint256 lockedRate;      // FTSO price at order creation
        uint256 rateDecimals;    // Decimals for the locked rate
        uint256 usdtAmount;      // Calculated USDT amount at locked rate
        uint256 timestamp;       // When the rate was locked
        address buyer;
        address seller;
        bool settled;
        bool exists;
    }
    
    /// @notice Mapping from Order ID to FX Order details
    mapping(string => FXOrder) public fxOrders;
    
    // ======================== EVENTS ========================
    
    event FXOrderCreated(
        string indexed orderId,
        string symbol,
        uint256 localAmount,
        uint256 lockedRate,
        uint256 usdtAmount,
        address buyer,
        address seller
    );
    
    event FXOrderSettled(
        string indexed orderId,
        uint256 usdtAmount,
        address seller,
        uint256 originalRate,
        uint256 settlementRate  // For audit/comparison
    );
    
    event RelayerUpdated(address newRelayer);
    event FtsoRegistryUpdated(address newRegistry);
    
    // ======================== CONSTRUCTOR ========================
    
    /**
     * @param _ftsoRegistry Address of Flare's FTSO Registry contract
     * @param _settlementToken Address of the USDT token
     * @param _relayer Address of the trusted relayer
     */
    constructor(
        address _ftsoRegistry,
        address _settlementToken,
        address _relayer
    ) Ownable(msg.sender) {
        ftsoRegistry = IFtsoRegistry(_ftsoRegistry);
        settlementToken = IERC20(_settlementToken);
        relayer = _relayer;
    }
    
    // ======================== MODIFIERS ========================
    
    modifier onlyRelayer() {
        require(msg.sender == relayer, "FXSettlement: Only relayer");
        _;
    }
    
    // ======================== CORE FUNCTIONS ========================
    
    /**
     * @notice Create an FX-protected order by locking the current FTSO rate
     * @param _orderId Unique order identifier (from Supabase)
     * @param _symbol FX symbol (e.g., "EUR", "GBP", "XAU" for gold)
     * @param _localAmount Amount in local currency (scaled by currency decimals)
     * @param _seller Address of the seller to receive funds
     */
    function createFXOrder(
        string memory _orderId,
        string memory _symbol,
        uint256 _localAmount,
        address _seller
    ) external {
        require(!fxOrders[_orderId].exists, "FXSettlement: Order exists");
        require(_localAmount > 0, "FXSettlement: Amount must be > 0");
        require(_seller != address(0), "FXSettlement: Invalid seller");
        
        // 1. Fetch current rate from FTSO
        (uint256 rate, uint256 timestamp, uint256 decimals) = ftsoRegistry.getCurrentPriceWithDecimals(_symbol);
        
        // 2. Validate price freshness
        require(block.timestamp - timestamp <= maxPriceAge, "FXSettlement: Stale price");
        require(rate > 0, "FXSettlement: Invalid rate");
        
        // 3. Calculate USDT amount at locked rate
        // Formula: usdtAmount = localAmount * rate / 10^decimals
        // Note: Assumes localAmount has 2 decimal places (cents) and USDT has 6
        uint256 usdtAmount = (_localAmount * rate) / (10 ** decimals);
        
        // 4. Transfer USDT from buyer to contract
        settlementToken.transferFrom(msg.sender, address(this), usdtAmount);
        
        // 5. Store the FX order with locked rate
        fxOrders[_orderId] = FXOrder({
            symbol: _symbol,
            localAmount: _localAmount,
            lockedRate: rate,
            rateDecimals: decimals,
            usdtAmount: usdtAmount,
            timestamp: timestamp,
            buyer: msg.sender,
            seller: _seller,
            settled: false,
            exists: true
        });
        
        emit FXOrderCreated(
            _orderId,
            _symbol,
            _localAmount,
            rate,
            usdtAmount,
            msg.sender,
            _seller
        );
    }
    
    /**
     * @notice Settle an FX order after delivery verification
     * @dev Called by relayer after Flare FDC confirms delivery
     * @param _orderId The order to settle
     */
    function settleFXOrder(string memory _orderId) external onlyRelayer {
        FXOrder storage order = fxOrders[_orderId];
        require(order.exists, "FXSettlement: Order not found");
        require(!order.settled, "FXSettlement: Already settled");
        
        // Get current rate for audit trail (not used for calculation)
        (uint256 currentRate, , ) = ftsoRegistry.getCurrentPriceWithDecimals(order.symbol);
        
        // Mark as settled
        order.settled = true;
        
        // Transfer at LOCKED rate (not current rate!)
        settlementToken.transfer(order.seller, order.usdtAmount);
        
        emit FXOrderSettled(
            _orderId,
            order.usdtAmount,
            order.seller,
            order.lockedRate,
            currentRate
        );
    }
    
    // ======================== VIEW FUNCTIONS ========================
    
    /**
     * @notice Get a quote for an FX order without creating it
     * @param _symbol FX symbol (e.g., "EUR")
     * @param _localAmount Amount in local currency
     * @return usdtAmount Equivalent USDT amount at current rate
     * @return rate Current FTSO rate
     * @return decimals Rate decimals
     */
    function getQuote(string memory _symbol, uint256 _localAmount) 
        external view 
        returns (uint256 usdtAmount, uint256 rate, uint256 decimals) 
    {
        (rate, , decimals) = ftsoRegistry.getCurrentPriceWithDecimals(_symbol);
        usdtAmount = (_localAmount * rate) / (10 ** decimals);
    }
    
    /**
     * @notice Check the FX protection provided by locking the rate
     * @param _orderId The order to check
     * @return savedAmount Positive if seller benefits, negative if buyer benefits
     * @return percentageChange The percentage change since order creation
     */
    function getFXProtectionSavings(string memory _orderId) 
        external view 
        returns (int256 savedAmount, int256 percentageChange) 
    {
        FXOrder storage order = fxOrders[_orderId];
        require(order.exists, "FXSettlement: Order not found");
        
        // Get current rate
        (uint256 currentRate, , ) = ftsoRegistry.getCurrentPriceWithDecimals(order.symbol);
        
        // Calculate what the USDT amount would be at current rate
        uint256 currentUsdtAmount = (order.localAmount * currentRate) / (10 ** order.rateDecimals);
        
        // Calculate savings (positive = seller saved money, negative = buyer saved money)
        savedAmount = int256(order.usdtAmount) - int256(currentUsdtAmount);
        
        // Calculate percentage change (basis points * 100)
        if (order.lockedRate > 0) {
            percentageChange = (int256(currentRate) - int256(order.lockedRate)) * 10000 / int256(order.lockedRate);
        }
    }
    
    // ======================== ADMIN FUNCTIONS ========================
    
    function setRelayer(address _newRelayer) external onlyOwner {
        relayer = _newRelayer;
        emit RelayerUpdated(_newRelayer);
    }
    
    function setFtsoRegistry(address _newRegistry) external onlyOwner {
        ftsoRegistry = IFtsoRegistry(_newRegistry);
        emit FtsoRegistryUpdated(_newRegistry);
    }
    
    function setMaxPriceAge(uint256 _maxAge) external onlyOwner {
        maxPriceAge = _maxAge;
    }
}
