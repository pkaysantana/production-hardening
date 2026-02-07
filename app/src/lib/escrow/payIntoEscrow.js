import { ethers } from "ethers";
import { escrowAbi, erc20Abi } from "./abi";

export async function payIntoEscrow(wallet, escrowAddress, amount, decimals = 6) {
    const ethProvider = await wallet.getEthereumProvider();
    const provider = new ethers.BrowserProvider(ethProvider);
    const signer = await provider.getSigner();

    const user = await signer.getAddress();

    const escrow = new ethers.Contract(escrowAddress, escrowAbi, signer);

    // IMPORTANT: use the token the escrow is actually configured with
    const tokenAddr = await escrow.usdtToken();
    const token = new ethers.Contract(tokenAddr, erc20Abi, signer);

    const value = ethers.parseUnits(String(amount), decimals);

    // 1️⃣ Approve
    await (await token.approve(escrowAddress, value)).wait();

    console.log("Value:", value.toString());
    console.log("Balance:", (await token.balanceOf(user)).toString());
    console.log("Allowance:", (await token.allowance(user, escrowAddress)).toString());
    // 2️⃣ Deposit
    const tx = await escrow.deposit(value);
    console.log("Deposit tx sent:", tx.hash);

    await tx.wait();
    console.log("Funds deposited into escrow");
}