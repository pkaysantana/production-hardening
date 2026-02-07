import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSupabase } from '../lib/supabase'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { getContracts } from '../lib/contracts'

const supabase = getSupabase()

export default function OrderDetail() {
    const { id } = useParams() // This is the Supabase UUID or order_id
    const navigate = useNavigate()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const { wallets } = useWallets()
    const wallet = wallets[0]

    useEffect(() => {
        const fetchOrder = async () => {
            // 1. Fetch from Supabase
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', id)
                .single()

            if (error || !data) {
                console.error('Order not found', error)
                setLoading(false)
                return
            }

            // 2. Fetch Blockchain Status
            let onChainStatus = 'Unknown'
            if (wallet) {
                try {
                    const provider = await wallet.getEthersProvider()
                    const signer = provider.getSigner()
                    const { relayerContract } = getContracts(signer)

                    const onChainData = await relayerContract.orders(data.order_id)
                    onChainStatus = onChainData.released ? 'Released' : 'Escrowed'
                } catch (err) {
                    console.error('Blockchain fetch failed:', err)
                }
            }

            setOrder({ ...data, status: onChainStatus })
            setLoading(false)
        }

        fetchOrder()
    }, [id, wallet])

    if (loading) return <p style={{ padding: 32 }}>Loading order…</p>
    if (!order) return <p style={{ padding: 32 }}>Order not found</p>

    return (
        <div style={{ padding: 32 }}>
            <button onClick={() => navigate('/orders')} style={{ marginBottom: 20 }}>← Back to Orders</button>

            <h1>Order Details</h1>

            <div style={{
                padding: 24,
                border: '1px solid #444',
                borderRadius: 12,
                backgroundColor: '#1a1a1a'
            }}>
                <p><b>Order Ref:</b> {order.order_id}</p>
                <p><b>Amount:</b> {order.amount} USDT</p>
                <p><b>Status:</b> <span style={{
                    color: order.status === 'Released' ? '#4caf50' : '#ff9800',
                    fontWeight: 'bold'
                }}>{order.status}</span></p>

                <hr style={{ borderColor: '#333', margin: '20px 0' }} />

                <h3>Tracking Information</h3>
                {order.status === 'Released' ? (
                    <div style={{ color: '#4caf50' }}>
                        <p>✅ <b>Delivered & Paid</b></p>
                        <p>Funds successfully released to seller.</p>
                    </div>
                ) : (
                    <div>
                        <p>📦 <b>In Transit</b></p>
                        <p>Waiting for Flare FDC verification...</p>
                        <p style={{ fontSize: '0.9em', color: '#888' }}>
                            (Once delivered, the bot will auto-release funds)
                        </p>
                    </div>
                )}

                <div style={{ marginTop: 24 }}>
                    <a
                        href={`https://explorer.plasma.to/tx/${order.transaction_hash}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#646cff' }}
                    >
                        View Transaction on Explorer ↗
                    </a>
                </div>
            </div>
        </div>
    )
}
