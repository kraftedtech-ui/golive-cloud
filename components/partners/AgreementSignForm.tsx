'use client'

import { useState } from 'react'

/** Typed-name signature for the partner agreement, with an explicit statement of what signing means. */
export default function AgreementSignForm({ token, partnerName, signedAt, executed }: {
  token: string; partnerName: string; signedAt: string | null; executed: boolean
}) {
  const [name, setName] = useState('')
  const [read, setRead] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(!!signedAt)

  if (executed) {
    return <div className="gp-alert gp-okbox" style={{ marginTop: 20 }}>This agreement is fully executed. Your certificate and a copy of the signed agreement were emailed to you.</div>
  }
  if (done) {
    return <div className="gp-alert gp-okbox" style={{ marginTop: 20 }}>Thank you. You have signed the agreement. It takes effect when the Managing Director countersigns it; you will then receive your partner number, your certificate and a signed copy by email.</div>
  }

  async function sign() {
    setErr('')
    if (!read) { setErr('Please confirm you have read the whole agreement, including the commission schedule.'); return }
    if (name.trim().toLowerCase().replace(/\s+/g, ' ') !== partnerName.trim().toLowerCase().replace(/\s+/g, ' ')) {
      setErr(`Type your full name exactly as on your application: ${partnerName.trim()}`); return
    }
    setBusy(true)
    try {
      const r = await fetch('/api/partner-agreement/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, typedName: name.trim() }) })
      const d = await r.json()
      if (!r.ok) { setErr(d.error || 'The signature could not be recorded.'); return }
      setDone(true)
    } catch { setErr('Network error. Please try again.') } finally { setBusy(false) }
  }

  return (
    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--stroke2)' }}>
      <h2 style={{ fontSize: 20 }}>Sign the agreement</h2>
      <label className="gp-check" style={{ marginBottom: 14 }}>
        <input type="checkbox" checked={read} onChange={(e) => setRead(e.target.checked)} />
        <span>I have read the whole agreement, including the commission schedule, and I agree to be bound by it.</span>
      </label>
      <div className="gp-fields">
        <label className="gp-field wide"><span>Type your full name to sign <em>*</em></span>
          <input type="text" value={name} placeholder={partnerName} onChange={(e) => setName(e.target.value)} />
          <small>Your typed name, the date and time, and your connection details are recorded as your electronic signature.</small>
        </label>
      </div>
      {err && <div className="gp-alert gp-err" role="alert">{err}</div>}
      <div className="gp-nav">
        <span className="gp-muted">Questions first? Reply to the email that brought you here.</span>
        <button type="button" className="gp-btn gp-primary gp-lg" disabled={busy} onClick={sign}>{busy ? 'Signing' : 'Sign the agreement'}</button>
      </div>
    </div>
  )
}
