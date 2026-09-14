'use client'

import { useState } from 'react'

export default function OnboardAckForm({
  token,
  candidateName,
  docCount,
  alreadyAcknowledged,
}: {
  token: string
  candidateName: string
  docCount: number
  alreadyAcknowledged: boolean
}) {
  const [typedName, setTypedName] = useState('')
  const [readAll, setReadAll] = useState(false)
  const [bci, setBci] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const box: React.CSSProperties = { borderTop: '3px solid #0e7c86', paddingTop: 18 }

  if (alreadyAcknowledged || done) {
    return (
      <div style={box}>
        <p style={{ background: '#eef8f0', border: '1px solid #b7e0c1', color: '#1a5c2a', padding: '12px 16px', borderRadius: 8, fontSize: 14 }}>
          \u2713 Onboarding acknowledgement complete \u2014 thank you. Keep your downloaded documents safe; the countersigned
          copies will be handled during your first-day induction. See you on day one!
        </p>
      </div>
    )
  }

  async function submit() {
    setError('')
    const clean = typedName.trim()
    if (clean.length < 5 || !clean.includes(' ')) {
      setError('Please type your full legal name (first and last name).')
      return
    }
    if (!readAll) { setError('Please confirm you have downloaded and read every document.'); return }
    if (!bci) { setError('Background-check consent is required to complete onboarding.'); return }
    setBusy(true)
    try {
      const res = await fetch('/api/onboarding/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, typedName: clean, bciConsent: true }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Submission failed \u2014 please try again or contact talent.acquisition@golivecompany.com')
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
      <h3 style={{ color: '#0e7c86', fontSize: 16, margin: '0 0 8px' }}>Acknowledgement</h3>

      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#2d3436', margin: '10px 0' }}>
        <input type="checkbox" checked={readAll} onChange={(e) => setReadAll(e.target.checked)} style={{ marginTop: 3 }} />
        <span>
          I confirm that I have downloaded and read all <strong>{docCount} document{docCount === 1 ? '' : 's'}</strong> above,
          including the Role Charter, the Employee Handbook, and any undertakings, and I agree to be bound by them from my start date.
        </span>
      </label>

      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#2d3436', margin: '10px 0 16px' }}>
        <input type="checkbox" checked={bci} onChange={(e) => setBci(e.target.checked)} style={{ marginTop: 3 }} />
        <span>
          I consent to pre-employment background verification conducted by <strong>Background Check International (BCI)</strong> on
          behalf of GoLive, I understand I will be contacted by BCI directly, and I understand my employment remains conditional on
          satisfactory completion of these checks.
        </span>
      </label>

      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>
        Full legal name
      </label>
      <input
        value={typedName}
        onChange={(e) => setTypedName(e.target.value)}
        placeholder={candidateName}
        style={{ width: '100%', maxWidth: 420, padding: '10px 12px', border: '1px solid #cbd5d8', borderRadius: 8, fontSize: 15, fontFamily: 'inherit' }}
      />

      {error && (
        <p style={{ background: '#fdf1f0', border: '1px solid #f2c4bf', color: '#b42318', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginTop: 12 }}>
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={busy}
        style={{
          marginTop: 14, background: busy ? '#7fb6bb' : '#0e7c86', color: '#ffffff', border: 'none',
          borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: busy ? 'default' : 'pointer',
        }}
      >
        {busy ? 'Submitting\u2026' : 'Complete onboarding acknowledgement'}
      </button>
    </div>
  )
}
