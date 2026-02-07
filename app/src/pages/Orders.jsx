import { useEffect, useState } from 'react'
import { getSupabase } from '../lib/supabase'
const supabase = getSupabase()
import { useNavigate } from 'react-router-dom'

export default function Orders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const fetchOrders = async () => {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })

            if (!error) setOrders(data)
            setLoading(false)
        }

        fetchOrders()
    }, [])

    if (loading) return <p>Loading orders…</p>

    return (
        <div style={{ padding: 32 }}>
            <h1>Your Orders</h1>

            {orders.length === 0 && <p>No orders yet</p>}

            <ul style={{ listStyle: 'none', padding: 0 }}>
                {orders.map(order => (
                    <li
                        key={order.id}
                        onClick={() => navigate(`/orders/${order.id}`)}
                        style={{
                            padding: 16,
                            border: '1px solid #ddd',
                            marginBottom: 12,
                            cursor: 'pointer'
                        }}
                    >
                        <p><b>Order ID:</b> {order.id}</p>
                        <p><b>Amount:</b> ${order.amount}</p>
                        <p><b>Status:</b> {order.status}</p>
                    </li>
                ))}
            </ul>
        </div>
    )
}