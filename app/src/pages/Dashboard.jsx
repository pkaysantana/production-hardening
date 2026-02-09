import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useSetActiveWallet } from '@privy-io/wagmi'
import { useChainId } from 'wagmi'
import { ethers } from "ethers";
import { getContracts } from '../lib/contracts'

const MOCK_ITEM = {
    id: 'item-0101',
    name: 'Test Sneakers',
    price: '0.001',
    seller: '0x48F4068b8c704bec2cb51d3a4e8585c8c5Fb68D5' // Hardcoded seller
}

export default function Dashboard() {
    const [loading, setLoading] = useState(false)
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
                await wallet.switchChain(114) // Coston2
                setActiveWallet(wallet)
            } catch (err) {
                console.error(err)
            }
        }
        setupWallet()
    }, [ready, authenticated, wallet])

    const handleBuy = async () => {
        if (!wallet) return;
        setLoading(true)

        try {
            const ethProvider = await wallet.getEthereumProvider();
            const provider = new ethers.BrowserProvider(ethProvider);
            const signer = await provider.getSigner();
            const { usdtContract, plasmaPaymentContract } = getContracts(signer)
            const plasmaAddress = await plasmaPaymentContract.getAddress()

            // 1. Approve
            const amount = ethers.parseUnits(MOCK_ITEM.price, 18)
            console.log("Approving...")
            const txApprove = await usdtContract.approve(plasmaAddress, amount)
            await txApprove.wait()
            console.log("Approved.")

            // 2. Create Order
            const trackingId = `SHIP-${Date.now()}`
            const deliveryWindow = 3600 // 1 hour
            // Use 100 as FX rate for 1:1 parity mock
            console.log("Creating Order...")
            const txCreate = await plasmaPaymentContract.createOrder(
                MOCK_ITEM.seller,
                trackingId,
                amount,
                100,
                deliveryWindow
            )
            await txCreate.wait()

            alert(`✅ Order Created! Tracking ID: ${trackingId}`)
            navigate('/orders')
        } catch (err) {
            console.error(err)
            alert("Transaction failed: " + (err.reason || err.message))
        } finally {
            setLoading(false)
        }
    };

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
                <p><b>ID:</b> {MOCK_ITEM.id}</p>
                <p><b>Name:</b> {MOCK_ITEM.name}</p>
                <p><b>Price:</b> {MOCK_ITEM.price} USDT (Test)</p>

                <button onClick={handleBuy} disabled={loading} style={{ background: '#4caf50', color: 'white' }}>
                    {loading ? 'Processing...' : 'Buy Item (Create Escrow)'}
                </button>
            </div>

            <button onClick={logout} style={{ marginTop: 20 }}>Logout</button>
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
