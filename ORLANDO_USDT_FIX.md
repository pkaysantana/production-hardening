# Orlando's USDT Issue - FIXED ✅

## The Problem
Orlando was using USDT address `0x502012b361AebCE43b26Ec812B74D9a51dB4D412` in `escrowConfig.js`, but our deployed MockUSDT is at `0xa9fe73d102fE4A7bFa0B68a9E4c2f38fe9FA57c9`.

This caused his "USDT was working fine earlier but seems not be anymore" error.

## The Fix
Updated `app/src/lib/escrow/escrowConfig.js` to use the correct MockUSDT address.

## Correct Addresses (Plasma Testnet)
- **MockUSDT**: `0xa9fe73d102fE4A7bFa0B68a9E4c2f38fe9FA57c9`
- **PlasmaPaymentRelayer**: `0x6533AEdD2369a5583959B244bADd797eB7333818`

## How to Get Test USDT
Since MockUSDT is a test token, you need to mint it:

```javascript
const mockUSDT = await ethers.getContractAt("MockUSDT", "0xa9fe73d102fE4A7bFa0B68a9E4c2f38fe9FA57c9");
// Check balance
const balance = await mockUSDT.balanceOf(yourAddress);
console.log("Balance:", ethers.formatUnits(balance, 6), "USDT");
```

If you need more test USDT, we may need to deploy a new MockUSDT with a `mint()` function.
