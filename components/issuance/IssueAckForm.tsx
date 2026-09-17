'use client'

import { useState } from 'react'

const SCRIPT_FONT =
  "'Segoe Script', 'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', cursive"

export interface IssueDoc {
  filename: string
  label: string
  acknowledgedAt?: string | null
}

export default function IssueAckForm({
  token,
  employeeName,
  docs,
  alreadySigned,
  signatureName,
  signedAt,
  mdSignedName,
  mdSignedAt,
}: {
  token: string
  employeeName: string
  docs: IssueDoc[]
  alreadySigned: boolean
  signatureName?: string | null
  signedAt?: string | null
  mdSignedName?: string | null
  mdSignedAt?: string | null
}) {
  const [ticked, setTicked] = useState<Record<string, boolean>>({})
  const [typedName, setTypedName] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const box: React.CSSProperties = { borderTop: '3px solid #0e7c86', paddingTop: 18, marginTop: 24 }
  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' }) + ' WAT' : ''

  // ---- already executed or just completed: show the signature blocks ----
  if (alreadySigned || done) {
    return (
      <div style={box}>
        <p style={{ background: '#eef8f0', border: '1px solid #b7e0c1', color: '#1a5c2a', padding: '12px 16px', borderRadius: 8, fontSize: 14 }}>
          ✓ Signed. Thank you. Each document is recorded individually below, and a copy is held on your employee file.
        </p>

        {docs.map((d) => (
          <p key={d.filename} style={{ fontSize: 13, color: '#4b5563', margin: '4px 0' }}>
            ✓ <strong>{d.label}</strong>{d.acknowledgedAt ? ` — confirmed ${fmt(d.acknowledgedAt)}` : ''}
          </p>
        ))}

        <div style={{ marginTop: 22, display: 'grid', gap: 18 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: 4 }}>
              Signed by the employee
            </div>
            <div style={{ fontFamily: SCRIPT_FONT, fontSize: 30, color: '#14304a', borderBottom: '1px solid #cbd5d8', paddingBottom: 4, maxWidth: 420 }}>
              {signatureName || employeeName}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{fmt(signedAt)}</div>
          </div>

          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: 4 }}>
              Countersigned for the Company
            </div>
            {mdSignedAt ? (
              <>
                <div style={{ fontFamily: SCRIPT_FONT, fontSize: 30, color: '#14304a', borderBottom: '1px solid #cbd5d8', paddingBottom: 4, maxWidth: 420 }}>
                  {mdSignedName}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                  Managing Director / CEO &middot; {fmt(mdSignedAt)}
                </div>
              </>
            ) : (
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Awaiting countersignature by the Managing Director.</p>
            )}
          </div>
        </div>

        <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6, marginTop: 22 }}>
          Electronic signatures are valid and binding under section 93 of the Evidence Act 2011 and section 17 of the
          Cybercrimes (Prohibition, Prevention, etc.) Act 2015.
        </p>
      </div>
    )
  }

  const allTicked = docs.length > 0 && docs.every((d) => ticked[d.filename])
  const nameOk = typedName.trim().length >= 5 && typedName.trim().includes(' ')

  async function submit() {
    setError('')
    if (!allTicked) { setError('Please confirm each document before signing.'); return }
    if (!nameOk) { setError('Please type your full legal name.'); return }
    setBusy(true)
    try {
      const res = await fetch('/api/issuance/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          typedName: typedName.trim(),
          documents: docs.filter((d) => ticked[d.filename]).map((d) => d.filename),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not record your signature. Please try again.'); return }
      setDone(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={box}>
      <h3 style={{ fontSize: 15, color: '#14304a', margin: '0 0 6px' }}>1. Read each document</h3>
      <p style={{ fontSize: 13, color: '#6b7280', marginTop: 0 }}>
        Open each one, then confirm it individually. Each confirmation is timestamped separately.
      </p>

      <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
        {docs.map((d) => (
          <div key={d.filename} style={{ border: '1px solid #e3e9f0', borderRadius: 8, padding: '12px 14px', background: ticked[d.filename] ? '#f7fdf9' : '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: 14, color: '#14304a' }}>{d.label}</strong>
              <a
                href={`/api/issuance/file?token=${encodeURIComponent(token)}&f=${encodeURIComponent(d.filename)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12.5, fontWeight: 600, color: '#0e7c86', textDecoration: 'none', border: '1px solid #cfe3e5', borderRadius: 6, padding: '5px 10px' }}
              >
                Open document
              </a>
            </div>
            <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginTop: 10, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!ticked[d.filename]}
                onChange={(e) => setTicked((t) => ({ ...t, [d.filename]: e.target.checked }))}
                style={{ marginTop: 2 }}
              />
              <span>I have read and understood <strong>{d.label}</strong>.</span>
            </label>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 15, color: '#14304a', margin: '26px 0 6px' }}>2. Sign</h3>
      <p style={{ fontSize: 13, color: '#6b7280', marginTop: 0 }}>
        Type your full legal name. The date, time and your network address are recorded at the moment you sign.
      </p>
      <input
        value={typedName}
        onChange={(e) => setTypedName(e.target.value)}
        placeholder="Your full legal name"
        style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #cbd5d8', borderRadius: 8, padding: '10px 12px', fontSize: 15, outline: 'none' }}
      />
      {typedName.trim() && (
        <div style={{ fontFamily: SCRIPT_FONT, fontSize: 30, color: '#14304a', borderBottom: '1px solid #cbd5d8', paddingBottom: 4, marginTop: 12, maxWidth: 420 }}>
          {typedName.trim()}
        </div>
      )}

      {error && (
        <p style={{ background: '#fdf1f1', border: '1px solid #f2c4c4', color: '#a12a2a', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginTop: 16 }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={busy || !allTicked || !nameOk}
        style={{
          marginTop: 18, width: '100%', padding: '12px 16px', borderRadius: 8, border: 'none',
          background: busy || !allTicked || !nameOk ? '#9fc4c8' : '#0e7c86',
          color: '#ffffff', fontSize: 14.5, fontWeight: 600,
          cursor: busy || !allTicked || !nameOk ? 'not-allowed' : 'pointer',
        }}
      >
        {busy ? 'Recording your signature…' : 'Sign and submit'}
      </button>

      <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6, marginTop: 16 }}>
        If anything here is unclear, email contact@golivecompany.com before signing rather than after.
        Electronic signatures are valid and binding under section 93 of the Evidence Act 2011 and section 17 of the
        Cybercrimes (Prohibition, Prevention, etc.) Act 2015.
      </p>
    </div>
  )
}
