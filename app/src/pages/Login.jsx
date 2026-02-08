// Login.jsx
import { useState } from 'react'
import { getSupabase } from '../lib/supabase'

export default function Login() {
    const supabase = getSupabase()
    const [email, setEmail] = useState('')
    const [sent, setSent] = useState(false)

    const sendMagicLink = async () => {
        await supabase.auth.signInWithOtp({ email })
        setSent(true)
    }

    return (
        <div style={styles.container}>
            <h2>Sign in</h2>

            {!sent ? (
                <>
                    <input
                        placeholder="you@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        style={styles.input}
                    />
                    <button onClick={sendMagicLink} style={styles.button}>
                        Send magic link
                    </button>
                </>
            ) : (
                <p>Check your email for the login link.</p>
            )}
        </div>
    )
}

const styles = {
    container: { maxWidth: 420, margin: '100px auto', textAlign: 'center' },
    input: { width: '100%', padding: 12, marginBottom: 12, fontSize: 16 },
    button: { width: '100%', padding: 12, fontSize: 16 }
}