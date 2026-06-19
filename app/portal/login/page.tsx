'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type Step = 'credentials' | 'setup' | 'verify'

export default function PortalLogin() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [setupCode, setSetupCode] = useState('')

  const [totpCode, setTotpCode] = useState('')

  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/check-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Invalid email or password.')
        setLoading(false)
        return
      }

      if (data.breakGlass) {
        const result = await signIn('credentials', { email, password, redirect: false })
        if (result?.ok) { router.push('/portal') } else { setError('Sign in failed.') }
        setLoading(false)
        return
      }

      if (data.needsSetup) {
        const setupRes = await fetch('/api/2fa/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const setupData = await setupRes.json()
        if (setupData.success) {
          setQrCode(setupData.qrCode)
          setSecret(setupData.secret)
          setStep('setup')
        } else {
          setError(setupData.error || 'Failed to start 2FA setup.')
        }
      } else {
        setStep('verify')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function confirmSetup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/2fa/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: setupCode }),
      })
      const data = await res.json()
      if (data.success) {
        const result = await signIn('credentials', { email, password, totpCode: setupCode, redirect: false })
        if (result?.ok) { router.push('/portal') } else { setError('Setup succeeded but sign-in failed. Please try logging in again.') }
      } else {
        setError(data.error || 'Incorrect code.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function submitTotp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await signIn('credentials', { email, password, totpCode, redirect: false })
      if (result?.ok) {
        router.push('/portal')
      } else {
        setError('Incorrect code. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const labelStyle: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: '#5a7a8a', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 4 }
  const inputStyle: React.CSSProperties = { width: '100%', border: '1.5px solid #c8e6f0', borderRadius: 7, padding: '9px 11px', fontSize: 13, color: '#0d2233', outline: 'none', fontFamily: 'inherit' }
  const buttonStyle = (disabled: boolean): React.CSSProperties => ({ width: '100%', background: disabled ? '#5a7a8a' : '#0096c7', color: '#fff', border: 'none', borderRadius: 8, padding: 11, fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit' })

  return (
    <div style={{ minHeight: '100vh', background: '#0d2233', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 36, width: '100%', maxWidth: 420, borderTop: '4px solid #00c8c8' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div><span style={{ color: '#00b4d8', fontSize: 22, fontWeight: 700 }}>go</span><span style={{ color: '#00c8c8', fontSize: 22, fontWeight: 700 }}>live</span></div>
          <div style={{ fontSize: 11, color: '#5a7a8a', marginTop: 4 }}>Microsoft Cloud Portal · GoLive Staff Only</div>
        </div>

        {step === 'credentials' && (
          <form onSubmit={submitCredentials} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={inputStyle} placeholder="admin@golivenaija.com" />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                style={inputStyle} placeholder="••••••••" />
            </div>
            {error && <div style={{ fontSize: 11, color: '#dc2626', background: '#fee2e2', padding: '8px 11px', borderRadius: 6 }}>{error}</div>}
            <button type="submit" disabled={loading} style={buttonStyle(loading)}>
              {loading ? 'Checking...' : 'Continue'}
            </button>
          </form>
        )}

        {step === 'setup' && (
          <form onSubmit={confirmSetup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 12, color: '#0d2233', lineHeight: 1.5, background: '#f0f9ff', borderRadius: 8, padding: 12 }}>
              <strong>Set up two-factor authentication</strong>
              <p style={{ margin: '6px 0 0', color: '#5a7a8a' }}>This is required for all staff accounts. Scan this QR code with Google Authenticator, Authy, or any TOTP app.</p>
            </div>
            {qrCode && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <img src={qrCode} alt="2FA QR Code" style={{ width: 180, height: 180 }} />
              </div>
            )}
            <div style={{ fontSize: 10, color: '#5a7a8a', textAlign: 'center', wordBreak: 'break-all' }}>
              Can't scan? Enter this code manually: <code style={{ background: '#f4f7fb', padding: '2px 6px', borderRadius: 4 }}>{secret}</code>
            </div>
            <div>
              <label style={labelStyle}>Enter the 6-digit code from your app</label>
              <input type="text" inputMode="numeric" maxLength={6} value={setupCode}
                onChange={e => setSetupCode(e.target.value.replace(/\D/g, ''))}
                style={{ ...inputStyle, textAlign: 'center', letterSpacing: 6, fontSize: 18 }} placeholder="000000" required />
            </div>
            {error && <div style={{ fontSize: 11, color: '#dc2626', background: '#fee2e2', padding: '8px 11px', borderRadius: 6 }}>{error}</div>}
            <button type="submit" disabled={loading || setupCode.length !== 6} style={buttonStyle(loading || setupCode.length !== 6)}>
              {loading ? 'Verifying...' : 'Confirm & Enable 2FA'}
            </button>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={submitTotp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 12, color: '#5a7a8a', textAlign: 'center' }}>
              Enter the 6-digit code from your authenticator app
            </div>
            <div>
              <input type="text" inputMode="numeric" maxLength={6} value={totpCode}
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                style={{ ...inputStyle, textAlign: 'center', letterSpacing: 6, fontSize: 18 }} placeholder="000000" required autoFocus />
            </div>
            {error && <div style={{ fontSize: 11, color: '#dc2626', background: '#fee2e2', padding: '8px 11px', borderRadius: 6 }}>{error}</div>}
            <button type="submit" disabled={loading || totpCode.length !== 6} style={buttonStyle(loading || totpCode.length !== 6)}>
              {loading ? 'Verifying...' : 'Sign in'}
            </button>
            <button type="button" onClick={() => { setStep('credentials'); setTotpCode(''); setError('') }}
              style={{ background: 'none', border: 'none', color: '#5a7a8a', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
              ← Back
            </button>
          </form>
        )}

        <p style={{ fontSize: 10, color: '#5a7a8a', textAlign: 'center', marginTop: 16 }}>
          GoLive Digital Solutions · Authorized Microsoft CSP · Africa
        </p>
      </div>
    </div>
  )
}
