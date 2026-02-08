import { ethers } from "ethers";
import { escrowAbi, erc20Abi } from "./abi";

export async function payIntoEscrow(wallet, escrowAddress, amount, decimals = 6) {
    const ethProvider = await wallet.getEthereumProvider();
    const provider = new ethers.BrowserProvider(ethProvider);
    const signer = await provider.getSigner();

    const user = await signer.getAddress();
    const escrow = new ethers.Contract(escrowAddress, escrowAbi, signer);

    const tokenAddr = await escrow.usdtToken();
    const token = new ethers.Contract(tokenAddr, erc20Abi, signer);

    const value = ethers.parseUnits(String(amount), decimals);

    // ✅ Only approve if needed (approve once, reuse forever)
    const allowance = await token.allowance(user, escrowAddress);
    if (allowance < value) {
        await (await token.approve(escrowAddress, ethers.MaxUint256)).wait();
    }

    // ✅ Single tx for repeat payments
    const tx = await escrow.deposit(value);
    await tx.wait();
}