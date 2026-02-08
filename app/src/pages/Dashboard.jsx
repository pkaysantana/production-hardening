import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Layout,
    Card,
    Typography,
    Button,
    Row,
    Col,
    Spin,
    message,
    Modal,
    Descriptions,
    Tag,
    Switch,
    Tooltip,
    FloatButton,
} from "antd";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { useChainId } from "wagmi";

import { ethers } from "ethers";
import { getSupabase } from "../lib/supabase";

import { payIntoEscrow } from "../lib/escrow/payIntoEscrow";
import { MARKETPLACE_ADDRESS } from "../lib/blockchain/marketplaceConfig";
import { marketplaceAbi } from "../lib/blockchain/marketplaceAbi";
import { USDT_ADDRESS } from "../lib/escrow/escrowConfig";

import { User, ShoppingBag, Code } from "react-feather";

const { Content } = Layout;
const { Title, Text } = Typography;

export default function Dashboard({ profile }) {
    const navigate = useNavigate();
    const supabase = getSupabase();

    const { ready, authenticated, logout: privyLogout } = usePrivy();
    const { wallets } = useWallets();
    const { setActiveWallet } = useSetActiveWallet();
    const chainId = useChainId();

    const wallet = wallets[0];
    const address = wallet?.address;

    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [buyingId, setBuyingId] = useState(null);
    const [showDevInfo, setShowDevInfo] = useState(false);
    const [role, setRole] = useState(localStorage.getItem("role") || "buyer");

    /* -----------------------------
       Wallet setup
    ------------------------------ */
    useEffect(() => {
        if (!ready || !authenticated || !wallet) return;

        const setupWallet = async () => {
            try {
                await wallet.switchChain(9746);
                setActiveWallet(wallet);
            } catch (err) {
                console.error(err);
            }
        };

        setupWallet();
    }, [ready, authenticated, wallet]);

    /* -----------------------------
       Fetch products + stock
    ------------------------------ */
    useEffect(() => {
        const fetchProducts = async () => {
            setLoadingProducts(true);

            let query = supabase
                .from("products")
                .select(`
          *,
          profiles (
            wallet_address
          ),
          product_stock (
            id,
            status
          )
        `)
                .order("created_at", { ascending: false });

            if (role === "seller") {
                query = query.eq("seller_id", profile.id);
            }

            const { data, error } = await query;

            if (error) {
                console.error(error);
                message.error("Failed to load products");
            } else {
                const formatted = (data || []).map((p) => ({
                    ...p,
                    seller_wallet_address: p.profiles?.wallet_address ?? null,
                    stock_available:
                        p.product_stock?.filter((s) => s.status === "available").length ?? 0,
                }));

                setProducts(formatted);
            }

            setLoadingProducts(false);
        };

        fetchProducts();
    }, [role]);

    useEffect(() => {
        localStorage.setItem("role", role);
    }, [role]);

    /* -----------------------------
       Buy flow (stock-aware)
    ------------------------------ */
    const handleBuy = async (product) => {
        if (!wallet) return;

        let stock = null;

        try {
            setBuyingId(product.id);

            // 🔒 Reserve exactly ONE stock unit
            const { data: reservedStock } = await supabase
                .from("product_stock")
                .update({ status: "reserved" })
                .eq("product_id", product.id)
                .eq("status", "available")
                .select()
                .limit(1)
                .single();

            if (!reservedStock) {
                message.error("Out of stock");
                return;
            }

            stock = reservedStock;

            const ethProvider = await wallet.getEthereumProvider();
            const provider = new ethers.BrowserProvider(ethProvider);
            const signer = await provider.getSigner();

            const marketplace = new ethers.Contract(
                MARKETPLACE_ADDRESS,
                marketplaceAbi,
                signer
            );

            const orderIdBytes32 = ethers.keccak256(
                ethers.toUtf8Bytes(stock.id)
            );

            const tx = await marketplace.createEscrowForOrder(
                orderIdBytes32,
                product.seller_wallet_address ?? product.seller_id,
                USDT_ADDRESS,
                86400
            );

            const receipt = await tx.wait();

            const event = receipt.logs
                .map((log) => {
                    try {
                        return marketplace.interface.parseLog(log);
                    } catch {
                        return null;
                    }
                })
                .find((e) => e?.name === "EscrowCreated");

            const escrow = event.args.escrow;

            await payIntoEscrow(wallet, escrow, product.price_usdt, 6);

            await supabase.from("orders").insert({
                buyer_id: profile.id,
                seller_id: product.seller_id,
                product_id: product.id,
                stock_id: stock.id,
                escrow_address: escrow,
                order_id_bytes32: orderIdBytes32,
                status: "FUNDED",
            });

            await supabase
                .from("product_stock")
                .update({ status: "sold" })
                .eq("id", stock.id);

            message.success("Purchase successful ✅");
        } catch (err) {
            console.error(err);

            if (stock?.id) {
                await supabase
                    .from("product_stock")
                    .update({ status: "available" })
                    .eq("id", stock.id);
            }

            message.error("Purchase failed");
        } finally {
            setBuyingId(null);
        }
    };

    /* -----------------------------
       Logout
    ------------------------------ */
    const logout = async () => {
        await privyLogout();
        await supabase.auth.signOut();
        navigate("/login");
    };

    if (!ready || !authenticated) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Spin />
            </div>
        );
    }

    return (
        <Layout style={{ width: "100vw", minHeight: "100vh", background: "#fafafa" }}>
            <Content style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 32px" }}>
                <Row justify="space-between" align="middle" style={{ marginBottom: 40 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <Title level={2} style={{ margin: 0 }}>
                            Marketplace
                        </Title>

                        <Tooltip title={role === "buyer" ? "Buyer view" : "Seller view"}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <ShoppingBag size={14} />
                                <Switch
                                    checked={role === "seller"}
                                    onChange={(checked) => setRole(checked ? "seller" : "buyer")}
                                    checkedChildren="Seller"
                                    unCheckedChildren="Buyer"
                                />
                                <User size={14} />
                            </div>
                        </Tooltip>
                    </div>

                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        {role === "buyer" && (
                            <Button onClick={() => navigate("/orders")}>My Orders</Button>
                        )}

                        <Button type="text" onClick={logout}>
                            Logout
                        </Button>
                    </div>
                </Row>
                {role === "seller" && !loadingProducts && products.length === 0 && (
                    <div
                        style={{
                            marginTop: 120,
                            textAlign: "center",
                            color: "#999",
                        }}
                    >
                        <Title level={4} style={{ marginBottom: 8 }}>
                            No items for sale
                        </Title>
                        <Text type="secondary">
                            You haven’t listed any products yet.
                        </Text>
                    </div>
                )}
                {(role === "buyer" || products.length > 0) && (
                    <Row gutter={[32, 32]}>
                        {loadingProducts &&
                            Array.from({ length: 6 }).map((_, i) => (
                                <Col xs={24} sm={12} md={8} key={i}>
                                    <Card loading />
                                </Col>
                            ))}

                        {!loadingProducts &&
                            products.map((product) => (
                                <Col xs={24} sm={12} md={8} key={product.id}>
                                    <Card
                                        hoverable
                                        style={{
                                            borderRadius: 18,
                                            height: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                        }}
                                        bodyStyle={{
                                            display: "flex",
                                            flexDirection: "column",
                                            flexGrow: 1,
                                        }}
                                    >                                    <div style={{ height: 180, background: "#f0f2f5", borderRadius: 12, marginBottom: 16 }} />

                                        <Title level={4}>{product.title}</Title>
                                        <Text type="secondary">{product.description || "No description"}</Text>

                                        <Title level={5} style={{ marginTop: 12 }}>
                                            {product.price_usdt} USDT
                                        </Title>

                                        <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                                            {product.stock_available > 0
                                                ? `${product.stock_available} left in stock`
                                                : "Out of stock"}
                                        </Text>

                                        {role === "buyer" && (
                                            <Button
                                                type="primary"
                                                block
                                                disabled={product.stock_available === 0}
                                                loading={buyingId === product.id}
                                                onClick={() => handleBuy(product)}
                                            >
                                                Buy now
                                            </Button>
                                        )}
                                    </Card>
                                </Col>
                            ))}
                    </Row>
                )}
            </Content>

            <FloatButton
                icon={<Code size={16} />}
                tooltip="Developer info"
                onClick={() => setShowDevInfo(true)}
            />
            <Modal
                title="Developer Info"
                open={showDevInfo}
                onCancel={() => setShowDevInfo(false)}
                footer={null}
                width={640}   // 👈 wider (nice on Mac)
            >
                <Descriptions bordered column={1}>
                    <Descriptions.Item label="Wallet">
                        <Text code>{address}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Chain ID">
                        <Tag color={chainId === 9746 ? "green" : "red"}>{chainId}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Marketplace">
                        <Text code>{MARKETPLACE_ADDRESS}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="USDT">
                        <Text code>{USDT_ADDRESS}</Text>
                    </Descriptions.Item>
                </Descriptions>
            </Modal>
        </Layout>
    );
}