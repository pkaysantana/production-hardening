import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSupabase } from '../lib/supabase'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { getContracts } from '../lib/contracts'

const supabase = getSupabase()

export default function OrderDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const { wallets } = useWallets()
    const wallet = wallets[0]

    // Status Enums matching Contract
    const STATUS_MAP = {
        0: 'Pending',
        1: 'Escrowed',
        2: 'Shipped', // Unused in this logic but present in enum
        3: 'Delivered',
        4: 'Settled',
        5: 'Disputed',
        6: 'Refunded',
        7: 'Cancelled'
    }

    const fetchOrder = async () => {
        // ... Supabase fetch omitted, relying on contract for status mostly or assume passed status keys
        // For now, let's just fetch from Contract using the ID passed (assuming ID is the bytes32 hash or we have it)
        // If 'id' is supabase ID, we need to get the 'order_id' (bytes32) from it.
        // Let's assume for this mock that ID passed IS the orderId or we mock the data.

        if (wallet) {
            try {
                const provider = await wallet.getEthersProvider()
                const signer = provider.getSigner()
                const { plasmaPaymentContract } = getContracts(signer)

                // We need the orderId (bytes32). 
                // If the URL param 'id' is not it, we would query Supabase.
                // For simplicity, let's assume we can query by the tracking ID via contract? 
                // No, contract orderIdByTrackingId.

                // Let's fetch the order directly if 'id' looks like bytes32, else we'd need a lookup.
                // Assuming 'id' is the 0x hash.
                const onChainData = await plasmaPaymentContract.orders(id)

                setOrder({
                    id: id,
                    amount: ethers.formatEther(onChainData.amount),
                    status: Number(onChainData.status),
                    deliveryDeadline: Number(onChainData.deliveryDeadline),
                    seller: onChainData.seller,
                    buyer: onChainData.buyer
                })
            } catch (err) {
                console.error('Fetch failed:', err)
            }
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchOrder()
    }, [id, wallet])

    const handleAction = async (actionName) => {
        if (!wallet) return
        const provider = await wallet.getEthersProvider()
        const signer = provider.getSigner()
        const { plasmaPaymentContract } = getContracts(signer)

        try {
            let tx
            if (actionName === 'dispute') {
                tx = await plasmaPaymentContract.initiateDispute(id)
            } else if (actionName === 'timeout') {
                tx = await plasmaPaymentContract.claimTimeout(id)
            } else if (actionName === 'authorize_relayer') {
                // Hardcoded relayer for demo
                const RELAYER = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
                const minAmount = ethers.parseEther("0.009") // 90%
                tx = await plasmaPaymentContract.authorizeRelayer(id, RELAYER, minAmount)
            }

            await tx.wait()
            alert('Action Successful!')
            fetchOrder()
        } catch (err) {
            console.error(err)
            alert('Action Failed: ' + (err.reason || err.message))
        }
    }

    if (loading) return <p style={{ padding: 32 }}>Loading order...</p>
    if (!order) return <p style={{ padding: 32 }}>Order not found (Check wallet connection)</p>

    const statusText = STATUS_MAP[order.status] || 'Unknown'
    const isEscrowed = order.status === 1
    const isDisputed = order.status === 5

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
                <p><b>Order ID:</b> <small>{order.id}</small></p>
                <p><b>Amount:</b> {order.amount} USDT</p>
                <p><b>Status:</b> <span style={{ fontWeight: 'bold', color: '#4caf50' }}>{statusText}</span></p>
                <p><b>Deadline:</b> {new Date(order.deliveryDeadline * 1000).toLocaleString()}</p>

                <hr style={{ borderColor: '#333', margin: '20px 0' }} />

                <h3>Actions</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {isEscrowed && (
                        <>
                            <button onClick={() => handleAction('dispute')} style={{ background: '#ff9800', color: 'black' }}>
                                ⚠️ Initiate Dispute
                            </button>
                            <button onClick={() => handleAction('timeout')}>
                                ⏳ Claim Timeout
                            </button>
                            {/* Assuming User is Seller logic can be added here */}
                            <button onClick={() => handleAction('authorize_relayer')} style={{ background: '#2196f3' }}>
                                ⚡ Authorize Fast Settlement
                            </button>
                        </>
                    )}
                    {isDisputed && (
                        <p style={{ color: '#ff9800' }}>Dispute in progress. Arbiter reviewing.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
