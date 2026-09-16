'use client'

import { useState } from 'react'

const SCRIPT_FONT =
  "'Segoe Script', 'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', cursive"

export interface AckDoc {
  filename: string
  label: string
  acknowledgedAt?: string | null
}

export default function OnboardAckForm({
  token,
  candidateName,
  docs,
  alreadyAcknowledged,
  signatureName,
  signedAt,
  mdAckName,
  mdAckAt,
}: {
  token: string
  candidateName: string
  docs: AckDoc[]
  alreadyAcknowledged: boolean
  signatureName?: string | null
  signedAt?: string | null
  mdAckName?: string | null
  mdAckAt?: string | null
}) {
  const [ticked, setTicked] = useState<Record<string, boolean>>({})
  const [bci, setBci] = useState(false)
  const [typedName, setTypedName] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const box: React.CSSProperties = { borderTop: '3px solid #0e7c86', paddingTop: 18, marginTop: 24 }
  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' }) + ' WAT' : ''

  // ---- already complete: show the executed signature blocks ----
  if (alreadyAcknowledged || done) {
    return (
      <div style={box}>
        <p style={{ background: '#eef8f0', border: '1px solid #b7e0c1', color: '#1a5c2a', padding: '12px 16px', borderRadius: 8, fontSize: 14 }}>
          ✓ Onboarding acknowledgement complete. Thank you. Each document is recorded individually below.
        </p>

        {docs.map((d) => (
          <p key={d.filename} style={{ fontSize: 13, color: '#4b5563', margin: '4px 0' }}>
            ✓ <strong>{d.label}</strong> — acknowledged {fmt(d.acknowledgedAt)}
          </p>
        ))}

        <div style={{ marginTop: 22, display: 'grid', gap: 18 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: 4 }}>
              Signed by the employee
            </div>
            <div style={{ fontFamily: SCRIPT_FONT, fontSize: 30, color: '#14304a', borderBottom: '1px solid #cbd5d8', paddingBottom: 4, maxWidth: 420 }}>
              {signatureName || candidateName}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{fmt(signedAt)}</div>
          </div>

          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: 4 }}>
              For The GoLive Digital Solutions Company Ltd
            </div>
            {mdAckAt ? (
              <>
                <div style={{ fontFamily: SCRIPT_FONT, fontSize: 30, color: '#14304a', borderBottom: '1px solid #cbd5d8', paddingBottom: 4, maxWidth: 420 }}>
                  {mdAckName}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                  Managing Director / CEO — {fmt(mdAckAt)}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: '#7a5b00', background: '#fff8ec', border: '1px solid #f0d9a8', borderRadius: 8, padding: '10px 14px' }}>
                Awaiting countersignature by the Managing Director.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const allTicked = docs.every((d) => ticked[d.filename])

  async function submit() {
    setError('')
    const clean = typedName.trim().replace(/\s+/g, ' ')
    if (!allTicked) { setError('Please confirm each document individually before signing.'); return }
    if (!bci) { setError('Background-check consent is required to complete onboarding.'); return }
    if (clean.length < 5 || !clean.includes(' ')) { setError('Please type your full legal name (first and last name).'); return }

    setBusy(true)
    try {
      const res = await fetch('/api/onboarding/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          typedName: clean,
          bciConsent: true,
          documents: docs.filter((d) => ticked[d.filename]).map((d) => d.filename),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error || 'Submission failed. Please try again or contact talent.acquisition@golivecompany.com'); return }
      setDone(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={box}>
      <h3 style={{ color: '#0e7c86', fontSize: 16, margin: '0 0 6px' }}>Acknowledgement and signature</h3>
      <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6, margin: '0 0 14px' }}>
        Confirm each document separately. Each confirmation is recorded with its own date and time, so the record
        reflects what you actually read and when.
      </p>

      {docs.map((d) => (
        <label key={d.filename} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#2d3436', margin: '10px 0', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', background: ticked[d.filename] ? '#f4fbf8' : '#fff' }}>
          <input
            type="checkbox"
            checked={!!ticked[d.filename]}
            onChange={(e) => setTicked((p) => ({ ...p, [d.filename]: e.target.checked }))}
            style={{ marginTop: 3 }}
          />
          <span>
            I have downloaded and read <strong>{d.label}</strong>, and I agree to be bound by it from my start date.
          </span>
        </label>
      ))}

      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#2d3436', margin: '14px 0', border: '1px solid #f0d9a8', background: '#fff8ec', borderRadius: 8, padding: '10px 12px' }}>
        <input type="checkbox" checked={bci} onChange={(e) => setBci(e.target.checked)} style={{ marginTop: 3 }} />
        <span>
          I consent to pre-employment background verification conducted by <strong>Background Check International (BCI)</strong> on
          behalf of GoLive, I understand I will be contacted by BCI directly, and I understand my employment remains
          conditional on satisfactory completion of these checks.
        </span>
      </label>

      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7280', margin: '16px 0 4px' }}>
        Type your full legal name to sign
      </label>
      <input
        value={typedName}
        onChange={(e) => setTypedName(e.target.value)}
        placeholder={candidateName}
        style={{ width: '100%', maxWidth: 420, padding: '10px 12px', border: '1px solid #cbd5d8', borderRadius: 8, fontSize: 15, fontFamily: 'inherit' }}
      />

      {typedName.trim().length > 2 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: 2 }}>
            Your signature will appear as
          </div>
          <div style={{ fontFamily: SCRIPT_FONT, fontSize: 30, color: '#14304a', borderBottom: '1px solid #cbd5d8', paddingBottom: 4, maxWidth: 420 }}>
            {typedName.trim()}
          </div>
        </div>
      )}

      <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, marginTop: 14 }}>
        Your typed name, together with the date, time and network address of this submission, constitutes your
        electronic signature. Electronic signatures are valid and binding under the Evidence Act 2011 and the
        Cybercrimes (Prohibition, Prevention, etc.) Act 2015.
      </p>

      {error && (
        <p style={{ background: '#fdf1f0', border: '1px solid #f2c4bf', color: '#b42318', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={busy}
        style={{ marginTop: 14, background: busy ? '#7fb6bb' : '#0e7c86', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: busy ? 'default' : 'pointer' }}
      >
        {busy ? 'Recording signature…' : 'Sign and complete onboarding'}
      </button>
    </div>
  )
}
