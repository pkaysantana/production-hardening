import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useSetActiveWallet } from '@privy-io/wagmi'
import { useChainId } from 'wagmi'
import { payIntoEscrow } from "../lib/escrow/payIntoEscrow.js";

import { useState } from "react";
import { ethers } from "ethers";

import { MARKETPLACE_ADDRESS } from "../lib/blockchain/marketplaceConfig";
import { marketplaceAbi } from "../lib/blockchain/marketplaceAbi";
import { USDT_ADDRESS } from "../lib/escrow/escrowConfig";


const MOCK_ITEM = {
    id: 'item-038',
    name: 'Test Sneakers',
    price: '5', // pretend 5 USDC
    seller: '0x48F4068b8c704bec2cb51d3a4e8585c8c5Fb68D5'
}

export default function Dashboard() {
    const [escrowAddress, setEscrowAddress] = useState(null);

    const navigate = useNavigate()
    const { ready, authenticated, logout: privyLogout } = usePrivy()
    const { wallets } = useWallets()
    const { setActiveWallet } = useSetActiveWallet()
    const chainId = useChainId()

    const wallet = wallets[0]
    const address = wallet?.address
    const isConnected = !!address

    useEffect(() => {
        if (!ready || !authenticated || !wallet) return

        const setupWallet = async () => {
            try {
                await wallet.switchChain(9746)
                setActiveWallet(wallet)
                console.log('Switched to Plasma chain')
            } catch (err) {
                console.error(err)
            }
        }

        setupWallet()
    }, [ready, authenticated, wallet])

    const handleBuy = async () => {
        if (!wallet) return;

        // 1. Provider + signer
        const ethProvider = await wallet.getEthereumProvider();
        const provider = new ethers.BrowserProvider(ethProvider);
        const signer = await provider.getSigner();

        // 2. Marketplace contract
        const marketplace = new ethers.Contract(
            MARKETPLACE_ADDRESS,
            marketplaceAbi,
            signer
        );

        // 3. Fake order id for now (no Supabase)
        const orderId = MOCK_ITEM.id;
        const orderIdBytes32 = ethers.keccak256(
            ethers.toUtf8Bytes(orderId)
        );

        // 4. Create escrow
        const tx = await marketplace.createEscrowForOrder(
            orderIdBytes32,
            "0x48F4068b8c704bec2cb51d3a4e8585c8c5Fb68D5",          // seller(Fake address for now)
            USDT_ADDRESS,
            86400             // 1 day
        );

        const receipt = await tx.wait();

        // 5. Extract escrow address from event
        const event = receipt.logs
            .map(log => {
                try {
                    return marketplace.interface.parseLog(log);
                } catch {
                    return null;
                }
            })
            .find(e => e?.name === "EscrowCreated");

        const escrow = event.args.escrow;
        console.log("Escrow created:", escrow);

        setEscrowAddress(escrow);

        await payIntoEscrow(
            wallet,
            escrow,               // escrow address (PaymentEscrow)
            MOCK_ITEM.price,      // amount
            6                     // decimals
        );

        alert("✅ Escrow created & funded");
    };

    // const handleRelease = async () => {
    //     await releaseEscrow(wallet);
    //     alert("Delivery confiremd - Funds released 🎉");
    // };

    const logout = async () => {
        await privyLogout()
        navigate('/login')
    }

    if (!ready || !authenticated) return <p>Loading wallet…</p>

    return (
        <div style={{ padding: 32 }}>
            <h1>Dashboard</h1>

            <p>Connected: {isConnected ? 'yes' : 'no'}</p>
            <p>Address: {address}</p>
            <p>Chain ID: {chainId}</p>


            <div style={{ marginTop: 24, padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
                <h2>Mock Item</h2>
                <p><b>ID:</b> item-001</p>
                <p><b>Name:</b> Test Sneakers</p>
                <p><b>Price:</b> 5 USDC (test)</p>

                <button onClick={handleBuy}>
                    Buy Item
                </button>
                {escrowAddress && (
                    <p><b>Escrow:</b> {escrowAddress}</p>
                )}

                {/* <button onClick={handleRelease}>
                    Confirm delivery & release funds
                </button> */}
            </div>
            <button onClick={logout}>Logout</button>
        </div>
    )
}




// import { useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { usePrivy, useWallets } from '@privy-io/react-auth'
// import { useSetActiveWallet } from '@privy-io/wagmi'
// import { useChainId } from 'wagmi'
// import { payIntoEscrow } from "../lib/escrow/payIntoEscrow.js";
// import { releaseEscrow } from "../lib/escrow/releaseEscrow.js";


// const MOCK_ITEM = {
//     id: 'item-001',
//     name: 'Test Sneakers',
//     price: '5', // pretend 5 USDC
// }
// export default function Dashboard() {
//     const navigate = useNavigate()
//     const { ready, authenticated, logout: privyLogout } = usePrivy()
//     const { wallets } = useWallets()
//     const { setActiveWallet } = useSetActiveWallet()
//     const chainId = useChainId()

//     const wallet = wallets[0]
//     const address = wallet?.address
//     const isConnected = !!address

//     useEffect(() => {
//         if (!ready || !authenticated || !wallet) return

//         const setupWallet = async () => {
//             try {
//                 await wallet.switchChain(9746)
//                 setActiveWallet(wallet)
//                 console.log('Switched to Plasma chain')
//             } catch (err) {
//                 console.error(err)
//             }
//         }

//         setupWallet()
//     }, [ready, authenticated, wallet])

//     const handleBuy = async () => {
//         if (!wallet) return
//         console.log(wallet)
//         // Deposit 0.01 USDT (6 decimals) into escrow
//         await payIntoEscrow(wallet, "0.01", 6);
//     };

//     const handleRelease = async () => {
//         await releaseEscrow(wallet);
//         alert("Delivery confiremd - Funds released 🎉");
//     };

//     const logout = async () => {
//         await privyLogout()
//         navigate('/login')
//     }

//     if (!ready || !authenticated) return <p>Loading wallet…</p>

//     return (
//         <div style={{ padding: 32 }}>
//             <h1>Dashboard</h1>

//             <p>Connected: {isConnected ? 'yes' : 'no'}</p>
//             <p>Address: {address}</p>
//             <p>Chain ID: {chainId}</p>


//             <div style={{ marginTop: 24, padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
//                 <h2>Mock Item</h2>
//                 <p><b>ID:</b> item-001</p>
//                 <p><b>Name:</b> Test Sneakers</p>
//                 <p><b>Price:</b> 5 USDC (test)</p>

//                 <button onClick={handleBuy}>
//                     Buy Item
//                 </button>

//                 <button onClick={handleRelease}>
//                     Confirm delivery & release funds
//                 </button>
//             </div>
//             <button onClick={logout}>Logout</button>
//         </div>
//     )
// }
