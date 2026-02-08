import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrivy, useWallets } from '@privy-io/react-auth'

const PRODUCTS = [
    { id: '001', name: 'White Running Sneakers', description: 'Lightweight running sneakers with breathable mesh and cushioned sole.', price: '0.01', image: null },
    { id: '002', name: 'Minimal Leather Backpack', description: 'Slim leather backpack suitable for work or travel.', price: '0.01', image: null },
    { id: '003', name: 'Wireless Noise-Cancelling Headphones', description: 'Over-ear headphones with active noise cancellation and 30h battery.', price: '0.01', image: null },
    { id: '004', name: 'Smart Fitness Watch', description: 'Track workouts, heart rate, and sleep with a sleek OLED display.', price: '0.01', image: null },
    { id: '005', name: 'Modern Desk Lamp', description: 'LED desk lamp with adjustable arm and warm lighting.', price: '0.01', image: null },
]

export default function Marketplace() {
    const [isBuyer, setIsBuyer] = useState(true)
    const navigate = useNavigate()
    const { logout: privyLogout } = usePrivy()
    const { wallets } = useWallets()

    const handleBuy = (product) => {
        alert(`Initiating escrow for: ${product.name}\nPrice: ${product.price} USDT`)
        // Future: integrate with escrow logic
    }

    const handleLogout = async () => {
        await privyLogout()
        navigate('/login')
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', padding: '40px', minHeight: '100vh' }}>

            {/* Header */}
            <header style={{ gridColumn: 'span 12', borderBottom: '4px solid var(--swiss-black)', paddingBottom: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0 }}>Marketplace</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                        <span>🛒</span>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={isBuyer}
                                onChange={() => setIsBuyer(!isBuyer)}
                                style={{ accentColor: 'var(--swiss-blue)' }}
                            />
                            <span style={{ fontWeight: isBuyer ? 700 : 400 }}>Buyer</span>
                        </label>
                        <span>👤</span>
                    </div>
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
                            Image placeholder
                        </div>

                        <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', textTransform: 'none', letterSpacing: 'normal' }}>
                            {product.name}
                        </h3>

                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '20px', flex: 1, lineHeight: 1.4 }}>
                            {product.description}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                            <span style={{ fontWeight: 700, fontSize: '1rem' }}>{product.price} USDT</span>
                        </div>

                        <button
                            className="primary"
                            onClick={() => handleBuy(product)}
                            style={{ marginTop: '15px', width: '100%', padding: '12px' }}
                        >
                            Buy now
                        </button>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            <div style={{
                position: 'fixed', left: '20px', top: '50%', transform: 'translateY(-50%)',
                width: '50px', height: '50px', background: 'var(--swiss-black)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                fontSize: '1.5rem'
            }}>
                ‹
            </div>
            <div style={{
                position: 'fixed', right: '20px', top: '50%', transform: 'translateY(-50%)',
                width: '50px', height: '50px', background: 'var(--swiss-black)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                fontSize: '1.5rem'
            }}>
                ›
            </div>

            {/* Footer */}
            <div style={{ gridColumn: 'span 12', borderTop: '1px solid var(--swiss-grid)', paddingTop: '20px', marginTop: '40px', fontSize: '0.75rem', color: '#999', textAlign: 'center' }}>
                VERIFIABLE COMMERCE INITIATIVE • ETHOXFORD 2026 • PLASMA NETWORK
            </div>
        </div>
    )
}
