import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useSetActiveWallet } from '@privy-io/wagmi'
import { useChainId } from 'wagmi'
import { ethers } from 'ethers'
import { getContracts } from '../lib/contracts'

const MOCK_ITEM = {
    id: 'item-001',
    name: 'Test Sneakers',
    price: '5', // 5 USDT
}

export default function Dashboard() {
    const navigate = useNavigate()
    const { ready, authenticated, logout: privyLogout } = usePrivy()
    const { wallets } = useWallets()
    const { setActiveWallet } = useSetActiveWallet()
    const chainId = useChainId()
    const [buying, setBuying] = useState(false)

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

    const logout = async () => {
        await privyLogout()
        navigate('/login')
    }

    const handleBuy = async () => {
        if (!wallet) {
            alert('Please connect wallet first')
            return
        }

        setBuying(true)
        try {
            // Get ethers provider and signer from Privy wallet
            const provider = await wallet.getEthersProvider()
            const signer = provider.getSigner()

            const { usdtContract, relayerContract } = getContracts(signer)

            const amount = ethers.parseUnits(MOCK_ITEM.price, 18) // 5 USDT
            const sellerAddress = "0xDD1435DF633a266A5f1d973CEc417C1F51aF18ae" // Deployer as seller for demo
            const orderId = `order-${Date.now()}-${address.slice(0, 6)}`

            console.log('🛒 Creating order:', { orderId, amount: MOCK_ITEM.price })

            // Step 1: Approve USDT
            console.log('📝 Approving USDT...')
            const approveTx = await usdtContract.approve(
                await relayerContract.getAddress(),
                amount
            )
            await approveTx.wait()
            console.log('✅ USDT Approved')

            // Step 2: Create Order
            console.log('🚀 Creating order on Plasma...')
            const createTx = await relayerContract.createOrder(orderId, sellerAddress, amount)
            await createTx.wait()
            console.log('✅ Order Created:', orderId)

            alert(`✅ Purchase successful! Order ID: ${orderId}`)

            // Save to Supabase
            const { error: supabaseError } = await getSupabase()
                .from('orders')
                .insert([
                    {
                        order_id: orderId,
                        buyer: address,
                        seller: sellerAddress,
                        amount: MOCK_ITEM.price,
                        transaction_hash: createTx.hash,
                        created_at: new Date().toISOString(),
                    }
                ])

            if (supabaseError) {
                console.error('Supabase save error:', supabaseError)
                alert('⚠️ Payment worked, but saving to history failed.')
            } else {
                console.log('✅ Order saved to Supabase')
                navigate('/orders') // Redirect to Orders page
            }
        } catch (error) {
            console.error('Purchase failed:', error)
            alert(`❌ Purchase failed: ${error.message}`)
        } finally {
            setBuying(false)
        }
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
                <p><b>Price:</b> {MOCK_ITEM.price} USDT</p>

                <button onClick={handleBuy} disabled={buying}>
                    {buying ? 'Processing...' : 'Buy Item'}
                </button>
            </div>
            <button onClick={logout}>Logout</button>
        </div>
    )
}
