'use client'

import { useState } from 'react'

/** Certificate number lookup: goes to /verify/<number>. */
export default function VerifyLookup({ initial = '' }: { initial?: string }) {
  const [v, setV] = useState(initial)
  return (
    <form className="gp-verify" onSubmit={(e) => { e.preventDefault(); const n = v.trim().toUpperCase(); if (n) window.location.href = `/verify/${encodeURIComponent(n)}` }}>
      <label className="gp-field" style={{ flex: '1 1 260px' }}><span>Certificate number</span>
        <input type="text" value={v} placeholder="GL-CERT-2026-001" onChange={(e) => setV(e.target.value)} />
      </label>
      <button type="submit" className="gp-btn gp-primary">Check</button>
    </form>
  )
}
