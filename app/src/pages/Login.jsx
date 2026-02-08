// Login.jsx - Dribbble-inspired E-Store Login (SHARP EDGES VERSION)
import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { getSupabase } from '../lib/supabase'

export default function Login() {
    const supabase = getSupabase()
    const { login: privyLogin } = usePrivy()
    const [email, setEmail] = useState('')
    const [sent, setSent] = useState(false)
    const [loading, setLoading] = useState(false)

    const sendMagicLink = async () => {
        setLoading(true)
        await supabase.auth.signInWithOtp({ email })
        setSent(true)
        setLoading(false)
    }

    const handleConnectWallet = () => {
        // Trigger Privy wallet connection modal
        privyLogin()
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {/* Logo/Brand */}
                <div style={styles.logoSection}>
                    <div style={styles.logo}>ESTORE</div>
                    <p style={styles.tagline}>Verifiable Commerce</p>
                </div>

                {!sent ? (
                    <>
                        <h2 style={styles.heading}>Welcome back</h2>
                        <p style={styles.subtext}>
                            Enter your email to receive a magic link
                        </p>

                        <input
                            type="email"
                            placeholder="you@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            style={styles.input}
                        />

                        <button
                            onClick={sendMagicLink}
                            style={styles.button}
                            disabled={loading || !email}
                        >
                            {loading ? 'Sending...' : 'Continue with Email'}
                        </button>

                        <div style={styles.divider}>
                            <span style={styles.dividerLine}></span>
                            <span style={styles.dividerText}>or</span>
                            <span style={styles.dividerLine}></span>
                        </div>

                        <button
                            onClick={handleConnectWallet}
                            style={styles.socialButton}
                        >
                            🔗 Connect Wallet
                        </button>
                    </>
                ) : (
                    <div style={styles.successBox}>
                        <div style={styles.successIcon}>✉️</div>
                        <h2 style={styles.heading}>Check your email</h2>
                        <p style={styles.subtext}>
                            We sent a login link to <strong>{email}</strong>
                        </p>
                        <button
                            onClick={() => setSent(false)}
                            style={styles.linkButton}
                        >
                            Use a different email
                        </button>
                    </div>
                )}
            </div>

            <p style={styles.footer}>
                Powered by Plasma Network & Flare Data Connector
            </p>
        </div>
    )
}

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 20px',
        background: '#f5f0e8',
    },
    card: {
        width: '100%',
        maxWidth: '420px',
        background: '#ffffff',
        borderRadius: '0px', // SHARP EDGES - Arina's preference
        padding: '48px 40px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid #e0e0e0',
    },
    logoSection: {
        textAlign: 'center',
        marginBottom: '32px',
    },
    logo: {
        fontSize: '28px',
        fontWeight: '700',
        letterSpacing: '-0.5px',
        color: '#1a1a1a',
    },
    tagline: {
        fontSize: '14px',
        color: '#888',
        marginTop: '4px',
    },
    heading: {
        fontSize: '24px',
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: '8px',
        textAlign: 'center',
    },
    subtext: {
        fontSize: '15px',
        color: '#666',
        marginBottom: '24px',
        textAlign: 'center',
        lineHeight: '1.5',
    },
    input: {
        width: '100%',
        padding: '16px 18px',
        fontSize: '16px',
        border: '1px solid #e0e0e0',
        borderRadius: '0px', // SHARP EDGES
        marginBottom: '16px',
        outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
    },
    button: {
        width: '100%',
        padding: '16px',
        fontSize: '16px',
        fontWeight: '600',
        color: '#ffffff',
        background: '#2563eb',
        border: 'none',
        borderRadius: '0px', // SHARP EDGES
        cursor: 'pointer',
        transition: 'background 0.2s, transform 0.1s',
    },
    divider: {
        display: 'flex',
        alignItems: 'center',
        margin: '24px 0',
    },
    dividerLine: {
        flex: 1,
        height: '1px',
        background: '#e0e0e0',
    },
    dividerText: {
        padding: '0 16px',
        color: '#999',
        fontSize: '14px',
    },
    socialButton: {
        width: '100%',
        padding: '14px',
        fontSize: '15px',
        fontWeight: '500',
        color: '#333',
        background: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: '0px', // SHARP EDGES
        cursor: 'pointer',
        transition: 'background 0.2s',
    },
    successBox: {
        textAlign: 'center',
        padding: '20px 0',
    },
    successIcon: {
        fontSize: '48px',
        marginBottom: '20px',
    },
    linkButton: {
        background: 'none',
        border: 'none',
        color: '#2563eb',
        fontSize: '14px',
        cursor: 'pointer',
        marginTop: '16px',
    },
    footer: {
        marginTop: '32px',
        fontSize: '13px',
        color: '#999',
    },
}