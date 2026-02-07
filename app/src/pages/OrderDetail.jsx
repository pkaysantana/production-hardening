import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getSupabase } from '../lib/supabase'
const supabase = getSupabase()

export default function OrderDetail() {
    const { id } = useParams()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchOrder = async () => {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', id)
                .single()

            if (!error) setOrder(data)
            setLoading(false)
        }

        fetchOrder()
    }, [id])

    const updateStatus = async status => {
        await supabase
            .from('orders')
            .update({ status })
            .eq('id', id)

        setOrder({ ...order, status })
    }

    if (loading) return <p>Loading order…</p>
    if (!order) return <p>Order not found</p>

    return (
        <div style={{ padding: 32 }}>
            <h1>Order Details</h1>

            <p><b>Order ID:</b> {order.id}</p>
            <p><b>Amount:</b> ${order.amount}</p>
            <p><b>Token:</b> {order.token_address}</p>
            <p><b>Status:</b> {order.status}</p>

            <hr style={{ margin: '24px 0' }} />

            {/* ACTIONS */}
            {order.status === 'CREATED' && (
                <button onClick={() => updateStatus('FUNDED')}>
                    Fund Order (demo)
                </button>
            )}

            {order.status === 'FUNDED' && (
                <button onClick={() => updateStatus('SHIPPED')}>
                    Mark as Shipped
                </button>
            )}

            {order.status === 'SHIPPED' && (
                <button onClick={() => updateStatus('DELIVERED')}>
                    Confirm Delivery
                </button>
            )}

            {order.status !== 'DELIVERED' && (
                <button
                    style={{ marginLeft: 12 }}
                    onClick={() => updateStatus('DISPUTED')}
                >
                    Raise Dispute
                </button>
            )}
        </div>
    )
}