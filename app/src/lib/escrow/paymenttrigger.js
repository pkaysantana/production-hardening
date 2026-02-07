import { ethers } from "ethers";
import { ESCROW_ADDRESS } from "./escrowConfig";
import { escrowAbi } from "./abi";

export async function releaseEscrow(wallet) {
    const ethProvider = await wallet.getEthereumProvider();
    const provider = new ethers.BrowserProvider(ethProvider);
    const signer = await provider.getSigner();

    const escrow = new ethers.Contract(
        ESCROW_ADDRESS,
        escrowAbi,
        signer
    );

    const tx = await escrow.releaseToSeller();
    await tx.wait();

    return tx.hash;
}