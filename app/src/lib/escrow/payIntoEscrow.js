import { ethers } from "ethers";
import { escrowAbi, erc20Abi } from "./abi";
import { ESCROW_ADDRESS, USDT_ADDRESS } from "./escrowConfig";

// Approves USDT and deposits into the escrow contract
export async function payIntoEscrow(wallet, amount, decimals = 6) {
    const ethereumProvider = await wallet.getEthereumProvider();
    const provider = new ethers.BrowserProvider(ethereumProvider);
    const signer = await provider.getSigner();

    const usdt = new ethers.Contract(USDT_ADDRESS, erc20Abi, signer);
    const escrow = new ethers.Contract(ESCROW_ADDRESS, escrowAbi, signer);

    const value = ethers.parseUnits(String(amount), decimals);

    await usdt.approve(ESCROW_ADDRESS, value);
    await escrow.deposit(value);
}