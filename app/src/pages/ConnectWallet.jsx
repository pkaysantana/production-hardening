import { useCreateProfile } from '../hooks/useCreateProfile'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { getSupabase } from '../lib/supabase'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ConnectWallet() {
    useCreateProfile()

    const { login } = usePrivy()
    const { wallets } = useWallets()
    const supabase = getSupabase()
    const navigate = useNavigate()

    useEffect(() => {
        const linkWallet = async () => {
            if (!wallets[0]) return

            const { data } = await supabase.auth.getUser()

            await supabase.from('profiles').upsert({
                id: data.user.id,
                wallet_address: wallets[0].address,
            })

            navigate('/dashboard')
        }

        linkWallet()
    }, [wallets])

    return (
        <div style={{ textAlign: 'center', marginTop: 100 }}>
            <h2>Connect your wallet</h2>
            <button onClick={() => login()}>Connect Privy Wallet</button>
        </div>
    )
}