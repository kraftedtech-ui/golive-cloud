'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function PortalLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    if (res?.ok) {
      router.push('/portal')
    } else {
      setError('Invalid email or password.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d2233', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 36, width: '100%', maxWidth: 400, borderTop: '4px solid #00c8c8' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div><span style={{ color: '#00b4d8', fontSize: 22, fontWeight: 700 }}>go</span><span style={{ color: '#00c8c8', fontSize: 22, fontWeight: 700 }}>live</span></div>
          <div style={{ fontSize: 11, color: '#5a7a8a', marginTop: 4 }}>Microsoft Cloud Portal · GoLive Staff Only</div>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#5a7a8a', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 4 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', border: '1.5px solid #c8e6f0', borderRadius: 7, padding: '9px 11px', fontSize: 13, color: '#0d2233', outline: 'none', fontFamily: 'inherit' }}
              placeholder="admin@golivenaija.com" />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#5a7a8a', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 4 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', border: '1.5px solid #c8e6f0', borderRadius: 7, padding: '9px 11px', fontSize: 13, color: '#0d2233', outline: 'none', fontFamily: 'inherit' }}
              placeholder="••••••••" />
          </div>
          {error && <div style={{ fontSize: 11, color: '#dc2626', background: '#fee2e2', padding: '8px 11px', borderRadius: 6 }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', background: loading ? '#5a7a8a' : '#0096c7', color: '#fff', border: 'none', borderRadius: 8, padding: 11, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {loading ? 'Signing in...' : 'Sign in to portal'}
          </button>
        </form>
        <p style={{ fontSize: 10, color: '#5a7a8a', textAlign: 'center', marginTop: 16 }}>
          GoLive Digital Solutions · Authorized Microsoft CSP · Africa
        </p>
      </div>
    </div>
  )
}
