import { useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useNavigate } from 'react-router-dom'
import { getSupabase } from '../lib/supabase'

export default function Login() {
    const { login, authenticated, getAccessToken } = usePrivy()
    const supabase = getSupabase()
    const navigate = useNavigate()

    useEffect(() => {
        const linkSupabase = async () => {
            if (!authenticated) return

            const token = await getAccessToken()

            await supabase.auth.signInWithIdToken({
                provider: 'privy',
                token,
            })

            navigate('/dashboard')
        }

        linkSupabase()
    }, [authenticated])

    return (
        <div style={{ maxWidth: 400, margin: '80px auto' }}>
            <h2>Login with wallet</h2>

            <button
                onClick={() => login()}
                style={{ padding: 12, width: '100%', fontSize: 16 }}
            >
                Login with Privy
            </button>
        </div>
    )
}