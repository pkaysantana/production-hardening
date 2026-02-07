import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useSetActiveWallet } from '@privy-io/wagmi'
import { useChainId } from 'wagmi'
const MOCK_ITEM = {
    id: 'item-001',
    name: 'Test Sneakers',
    price: '5', // pretend 5 USDC
}
export default function Dashboard() {
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
                <p><b>Price:</b> 5 USDC (test)</p>

                <button onClick={() => alert('Buying item-001')}>
                    Buy Item
                </button>
            </div>
            <button onClick={logout}>Logout</button>
        </div>
    )
}