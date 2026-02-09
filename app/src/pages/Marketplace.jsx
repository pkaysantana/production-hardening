import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { ethers } from 'ethers'
import { getContracts } from '../lib/contracts'
import { getSupabase } from '../lib/supabase'

const PRODUCTS = [
    { id: '001', name: 'White Running Sneakers', description: 'Lightweight running sneakers with breathable mesh and cushioned sole.', price: '0.01', image: null },
    { id: '002', name: 'Minimal Leather Backpack', description: 'Slim leather backpack suitable for work or travel.', price: '0.01', image: null },
    { id: '003', name: 'Wireless Noise-Cancelling Headphones', description: 'Over-ear headphones with active noise cancellation and 30h battery.', price: '0.01', image: null },
    { id: '004', name: 'Smart Fitness Watch', description: 'Track workouts, heart rate, and sleep with a sleek OLED display.', price: '0.01', image: null },
    { id: '005', name: 'Modern Desk Lamp', description: 'LED desk lamp with adjustable arm and warm lighting.', price: '0.01', image: null },
]

export default function Marketplace() {
    const [isBuyer, setIsBuyer] = useState(true)
    const [deliveryWindow, setDeliveryWindow] = useState(3600) // Default 1 hour
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { logout: privyLogout } = usePrivy()
    const { wallets } = useWallets()
    const supabase = getSupabase()

    const handleBuy = async (product) => {
        if (!wallets[0]) {
            alert('Please connect your wallet first')
            return
        }

        setLoading(true)
        try {
            const wallet = wallets[0]
            await wallet.switchChain(114) // Coston2 or 14 for Flare. Using 114 for testnet default.
            const provider = await wallet.getEthersProvider()
            const signer = provider.getSigner()

            const { usdtContract, plasmaPaymentContract } = getContracts(signer)
            const plasmaAddress = await plasmaPaymentContract.getAddress()

            // 1. Approve USDT
            const amount = ethers.parseUnits(product.price, 18) // MockUSDT uses 18 decimals
            console.log("Approving...")
            const approveTx = await usdtContract.approve(plasmaAddress, amount)
            await approveTx.wait()
            console.log("Approved!")

            // 2. Create Order
            // Seller is hardcoded for demo or we'd need a real one. 
            // Let's use a random address or the deployer if known? 
            // For now, I'll use the user's address as seller if they uncheck "Buyer", but here we are buying.
            // Let's us a placeholder "Institutional Seller" address.
            const SELLER_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" // Hardhat Account #1
            const trackingId = `SHIP-${Date.now()}`
            const fxRate = 100 // 1:1

            console.log("Creating Order...")
            const createTx = await plasmaPaymentContract.createOrder(
                SELLER_ADDRESS,
                trackingId,
                amount,
                fxRate,
                deliveryWindow
            )
            const receipt = await createTx.wait()
            console.log("Order Created!", receipt)

            // 3. Save to Supabase (Optional for now if table doesn't exist, but good practice)
            // Extract orderId from events?
            // const event = receipt.logs.find(...) 
            // For now just alert success
            alert(`Order Successful! Tracking ID: ${trackingId}`)
            navigate('/orders')

        } catch (err) {
            console.error(err)
            alert('Transaction failed: ' + (err.reason || err.message))
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await privyLogout()
        navigate('/login')
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', padding: '40px', minHeight: '100vh', opacity: loading ? 0.5 : 1 }}>
            {/* Header */}
            <header style={{ gridColumn: 'span 12', borderBottom: '4px solid var(--swiss-black)', paddingBottom: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0 }}>Marketplace</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <select
                        value={deliveryWindow}
                        onChange={(e) => setDeliveryWindow(Number(e.target.value))}
                        style={{ padding: '8px', borderRadius: '4px' }}
                    >
                        <option value={3600}>1 Hour Delivery</option>
                        <option value={86400}>1 Day Delivery</option>
                        <option value={604800}>1 Week Delivery</option>
                    </select>

                    <button className="outline" onClick={() => navigate('/orders')} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                        My Orders
                    </button>
                    <button className="outline" onClick={handleLogout} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                        Logout
                    </button>
                </div>
            </header>

            {/* Product Grid */}
            <div style={{ gridColumn: 'span 12', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
                {PRODUCTS.map(product => (
                    <div key={product.id} className="swiss-module" style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Image Placeholder */}
                        <div style={{
                            height: '180px',
                            background: '#F5F5F5',
                            border: '1px solid var(--swiss-grid)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                            fontSize: '0.85rem',
                            marginBottom: '20px'
                        }}>
                            {product.name}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                            <span style={{ fontWeight: 700, fontSize: '1rem' }}>{product.price} USDT</span>
                        </div>

                        <button
                            className="primary"
                            onClick={() => handleBuy(product)}
                            disabled={loading}
                            style={{ currentPage: '15px', width: '100%', padding: '12px', marginTop: '10px' }}
                        >
                            {loading ? 'Processing...' : 'Buy Now'}
                        </button>
                    </div>
                ))}
            </div>
            <div style={{ gridColumn: 'span 12', borderTop: '1px solid var(--swiss-grid)', paddingTop: '20px', marginTop: '40px', fontSize: '0.75rem', color: '#999', textAlign: 'center' }}>
                VERIFIABLE COMMERCE INITIATIVE • ETHOXFORD 2026 • PLASMA NETWORK
            </div>
        </div>
    )
}
