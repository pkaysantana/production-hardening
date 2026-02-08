import { useEffect, useState } from "react";
import { Layout, Card, Typography, Tag, Spin, message } from "antd";
import { getSupabase } from "../lib/supabase";

const { Content } = Layout;
const { Title, Text } = Typography;

export default function Orders({ profileId, role }) {
    const supabase = getSupabase();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            const column = role === "buyer" ? "buyer_id" : "seller_id";

            const { data, error } = await supabase
                .from("orders")
                .select(`
        *,
        products (
          title,
          price_usdt
        )
      `)
                .eq(column, profileId)
                .order("created_at", { ascending: false });

            if (error) {
                console.error(error);
                message.error("Failed to load orders");
            } else {
                setOrders(data || []);
            }

            setLoading(false);
        };

        fetchOrders();
    }, [profileId, role]);

    if (loading) return <Spin />;

    return (
        <Content>
            <Title level={3}>
                {role === "buyer" ? "My Orders" : "Orders to Fulfil"}
            </Title>
            {orders.map(order => (
                <Card key={order.id} style={{ marginBottom: 16 }}>
                    <Title level={5}>{order.products?.title}</Title>
                    <Text>Price: {order.products?.price_usdt} USDT</Text>
                    <br />
                    <Text>Status:</Text>{" "}
                    <Tag color="green">{order.status}</Tag>
                    <br />
                    <Text code>{order.escrow_address}</Text>
                </Card>
            ))}
        </Content>
    );
}