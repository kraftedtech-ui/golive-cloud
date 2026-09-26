'use client'

import { useState } from 'react'
import { PARTNER_EMAIL } from '@/lib/partnerConfig'

/** Email + one-time code sign-in for appointed partners. No passwords. */
export default function PartnerLogin() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function send() {
    const e = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setMsg({ ok: false, text: 'Enter the email address on your partner agreement.' }); return }
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: e, turnstileToken: 'bypassed' }) })
      const d = await r.json()
      if (d.success) { setSent(true); setMsg({ ok: true, text: `If ${e} belongs to an appointed partner, a six-digit code is on its way.` }) }
      else setMsg({ ok: false, text: d.error || 'The code could not be sent.' })
    } catch { setMsg({ ok: false, text: 'Network error. Please try again.' }) } finally { setBusy(false) }
  }

  async function verify() {
    const e = email.trim().toLowerCase()
    if (!/^\d{6}$/.test(code.trim())) { setMsg({ ok: false, text: 'Enter the six-digit code from the email.' }); return }
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/verify-email/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: e, code: code.trim() }) })
      const d = await r.json()
      if (!d.success || !d.verificationToken) { setMsg({ ok: false, text: d.error || 'That code was not accepted.' }); return }
      const s = await fetch('/api/partner-portal/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: e, verificationToken: d.verificationToken }) })
      const sd = await s.json()
      if (!s.ok) { setMsg({ ok: false, text: sd.error || 'Sign-in failed.' }); return }
      window.location.href = '/partner'
    } catch { setMsg({ ok: false, text: 'Network error. Please try again.' }) } finally { setBusy(false) }
  }

  return (
    <section className="gp-pane" style={{ maxWidth: 520, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, lineHeight: '34px' }}>Partner sign-in</h1>
      <p className="gp-lede" style={{ fontSize: 15, marginBottom: 18 }}>Use the email address on your partner agreement. We send you a one-time code; there is no password.</p>
      <div className="gp-fields" style={{ gridTemplateColumns: '1fr' }}>
        <label className="gp-field"><span>Email address</span>
          <input type="email" autoComplete="email" value={email} disabled={sent} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !sent) send() }} />
        </label>
        {sent && (
          <label className="gp-field"><span>Six-digit code</span>
            <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => { if (e.key === 'Enter') verify() }} />
          </label>
        )}
      </div>
      {msg && <div className={`gp-alert ${msg.ok ? 'gp-note' : 'gp-err'}`}>{msg.text}</div>}
      <div className="gp-nav">
        {sent ? <button type="button" className="gp-link" onClick={() => { setSent(false); setCode(''); setMsg(null) }}>Use a different email</button> : <span />}
        {sent
          ? <button type="button" className="gp-btn gp-primary" disabled={busy} onClick={verify}>Sign in</button>
          : <button type="button" className="gp-btn gp-primary" disabled={busy} onClick={send}>Send me a code</button>}
      </div>
      <p className="gp-muted" style={{ marginTop: 14 }}>Not a partner yet? <a href="/partners">Find out about the GoLive Partner Network</a>. Trouble signing in? {PARTNER_EMAIL}</p>
    </section>
  )
}
