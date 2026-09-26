'use client'

import { useState } from 'react'
import SignaturePreview from '@/components/SignaturePreview'

export default function OfferSignForm({
  token,
  candidateName,
  alreadySignedAt,
  fullyExecuted,
}: {
  token: string
  candidateName: string
  alreadySignedAt: string | null
  fullyExecuted: boolean
}) {
  const [typedName, setTypedName] = useState('')
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const box: React.CSSProperties = {
    marginTop: 24, borderTop: '3px solid #0e7c86', paddingTop: 18,
    fontFamily: "Arial, 'Segoe UI', sans-serif",
  }

  if (fullyExecuted) {
    return (
      <div style={box}>
        <p style={{ background: '#eef8f0', border: '1px solid #b7e0c1', color: '#1a5c2a', padding: '12px 16px', borderRadius: 8, fontSize: 14 }}>
          ✓ This offer is fully executed. A copy of the signed letter has been emailed to you — please keep it for your records.
        </p>
      </div>
    )
  }

  if (alreadySignedAt || done) {
    return (
      <div style={box}>
        <p style={{ background: '#eef8f0', border: '1px solid #b7e0c1', color: '#1a5c2a', padding: '12px 16px', borderRadius: 8, fontSize: 14 }}>
          ✓ Thank you — your signature has been recorded. The Managing Director will now countersign, and you will receive the fully executed letter by email shortly.
        </p>
      </div>
    )
  }

  async function sign() {
    setError('')
    const clean = typedName.trim()
    if (clean.length < 5 || !clean.includes(' ')) {
      setError('Please type your full legal name (first and last name) exactly as it should appear on the letter.')
      return
    }
    if (!agree) {
      setError('Please tick the acceptance box to sign.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/offer/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, typedName: clean }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Signing failed — please try again or contact talent.acquisition@golivecompany.com')
        return
      }
      setDone(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={box}>
      <h3 style={{ color: '#0e7c86', fontSize: 16, margin: '0 0 8px' }}>Sign your acceptance</h3>
      <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6, margin: '0 0 12px' }}>
        To accept this offer, type your full legal name below and tick the box. Your typed name, together with the
        date, time, and network address of this submission, constitutes your electronic signature on this letter.
      </p>

      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>
        Full legal name
      </label>
      <input
        value={typedName}
        onChange={(e) => setTypedName(e.target.value)}
        placeholder={candidateName}
        style={{ width: '100%', maxWidth: 420, padding: '10px 12px', border: '1px solid #cbd5d8', borderRadius: 8, fontSize: 15, fontFamily: 'inherit' }}
      />
      <SignaturePreview name={typedName} />

      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#2d3436', margin: '14px 0' }}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 3 }} />
        <span>
          I have read the offer letter above in full and I <strong>accept the offer of employment</strong> on the terms
          set out, including the 90-day probationary period and the governing documents referenced.
        </span>
      </label>

      {error && (
        <p style={{ background: '#fdf1f0', border: '1px solid #f2c4bf', color: '#b42318', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
          {error}
        </p>
      )}

      <button
        onClick={sign}
        disabled={busy}
        style={{
          background: busy ? '#7fb6bb' : '#0e7c86', color: '#ffffff', border: 'none', borderRadius: 8,
          padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: busy ? 'default' : 'pointer',
        }}
      >
        {busy ? 'Recording signature…' : 'Sign & accept offer'}
      </button>
    </div>
  )
}
