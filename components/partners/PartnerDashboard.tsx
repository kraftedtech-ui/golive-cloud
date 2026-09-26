'use client'

import { useCallback, useEffect, useState } from 'react'
import { PARTNER_EMAIL } from '@/lib/partnerConfig'

type Deal = {
  id: string; ref: string; organisation: string; lineOfBusiness?: string; requirement?: string; estimatedValue?: number; expectedClose?: string
  status: string; statusLabel: string; submittedAt: string; approvedAt?: string; validUntil?: string; hardLimit?: string
  scheduleVersion?: number; decisionNote?: string; milestones: { kind: string; label: string; at: string }[]; source: string
}
type Data = {
  partner: { name: string; email: string; partnerNumber: string; category: 'referral' | 'sales'; title: string; appointedAt?: string }
  certificate: { number: string; issuedAt: string; expiresAt: string; status: 'valid' | 'expired' | 'revoked'; verifyUrl: string; linkedInUrl: string; pdf: string }
  agreement: { version?: string; pdf: string; scheduleVersion?: number }
  schedule: { version: number; effectiveAt: string; summary?: string; rows: { line: string; basis: string; rate: string }[]; acknowledged: boolean } | null
  history: { version: number; effectiveAt: string; summary?: string; changes: string[] }[]
  lines: string[]
  rules: { initialDays: number; milestoneDays: number; limitDays: number; milestones: Record<string, string> }
  deals: Deal[]
  statement: {
    ref: string; dealRef: string; organisation: string; kind: string; invoiceReference?: string; receivedAt: string; amount: number
    scheduleVersion: number; line: string; basis: string; band?: string; effectivePct: number; marginLimited: boolean
    gross: number; wht: number; net: number; status: string; dueAt: string; paidAt?: string; paymentReference?: string; clawbackUntil: string; clawbackReason?: string
  }[]
}

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Lagos' }) : '')
const naira = (n?: number) => (typeof n === 'number' ? `\u20a6${n.toLocaleString('en-NG')}` : '')
const TONE: Record<string, string> = { pending: '#8a5100', active: '#0e700e', lapsed: '#c50f1f', refused: '#c50f1f', won: '#0b7e9b', lost: '#616161', released: '#616161' }
const EMPTY = { organisation: '', sector: '', contactName: '', contactRole: '', contactEmail: '', contactPhone: '', lineOfBusiness: '', requirement: '', expectedClose: '', estimatedValue: '' }

export default function PartnerDashboard() {
  const [d, setD] = useState<Data | null>(null)
  const [err, setErr] = useState('')
  const [tab, setTab] = useState<'overview' | 'deals' | 'statement' | 'commission'>('overview')
  const [form, setForm] = useState(EMPTY)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/partner-portal/me', { cache: 'no-store' })
      if (r.status === 401) { window.location.href = '/partner/login'; return }
      const j = await r.json()
      if (!r.ok) { setErr(j.error || 'Could not load your dashboard.'); return }
      setD(j)
    } catch { setErr('Network error. Please refresh.') }
  }, [])
  useEffect(() => { load() }, [load])

  async function acknowledge() {
    setBusy(true)
    try { await fetch('/api/partner-portal/acknowledge', { method: 'POST' }); await load() } finally { setBusy(false) }
  }
  async function signOut() {
    await fetch('/api/partner-portal/session', { method: 'DELETE' })
    window.location.href = '/partner/login'
  }
  async function register() {
    setMsg(null)
    if (form.organisation.trim().length < 2) { setMsg({ ok: false, text: 'Enter the organisation name.' }); return }
    const v = form.estimatedValue.replace(/[^\d.]/g, '')
    setBusy(true)
    try {
      const r = await fetch('/api/partner-portal/deals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, estimatedValue: v ? Number(v) : undefined }),
      })
      const j = await r.json()
      if (!r.ok) { setMsg({ ok: false, text: j.error || 'The registration was not saved.' }); return }
      setMsg({ ok: true, text: `Registered as ${j.ref}. GoLive will review it; please do not approach ${form.organisation.trim()} on GoLive\u2019s behalf until it is approved.` })
      setForm(EMPTY); setShowForm(false); await load()
    } catch { setMsg({ ok: false, text: 'Network error. Please try again.' }) } finally { setBusy(false) }
  }

  if (err) return <section className="gp-pane"><div className="gp-alert gp-err">{err}</div></section>
  if (!d) return <section className="gp-pane"><p className="gp-muted">Loading your dashboard…</p></section>

  const c = d.certificate
  const live = d.deals.filter((x) => x.status === 'active')
  const soon = live.filter((x) => x.validUntil && new Date(x.validUntil).getTime() - Date.now() < 21 * 864e5)
  const f = (k: keyof typeof EMPTY, label: string, extra: Record<string, unknown> = {}, wide = false) => (
    <label className={`gp-field${wide ? ' wide' : ''}`}><span>{label}</span>
      <input type="text" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} {...extra} />
    </label>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <span className="gp-tag">{d.partner.partnerNumber}</span>
          <h1 style={{ marginTop: 8, fontSize: 32, lineHeight: '38px' }}>{d.partner.name}</h1>
          <p className="gp-muted" style={{ margin: 0 }}>{d.partner.title}{d.partner.appointedAt ? ` since ${fmt(d.partner.appointedAt)}` : ''}</p>
        </div>
        <button type="button" className="gp-btn" onClick={signOut}>Sign out</button>
      </div>

      {d.schedule && !d.schedule.acknowledged && (() => {
        const h = d.history.find((x) => x.version === d.schedule!.version)
        return (
          <section className="gp-pane" style={{ borderLeft: '4px solid var(--brand)', marginBottom: 20 }} role="alert">
            <h2 style={{ fontSize: 18, marginBottom: 6 }}>Commission schedule updated: version {d.schedule.version}</h2>
            <p className="gp-muted" style={{ margin: '0 0 8px' }}>Effective {fmt(d.schedule.effectiveAt)}.{d.schedule.summary ? ` ${d.schedule.summary}` : ''}</p>
            {h && h.changes.length > 0
              ? <ul className="gp-list">{h.changes.map((x, i) => <li key={i}>{x}</li>)}</ul>
              : <p style={{ margin: '0 0 8px' }}>No rate in your category changed in this version.</p>}
            <p className="gp-muted">Prospects you registered before this version keep their registration-date rates for first-year commission while their registration stays valid. Renewals are paid at the rates in force at each renewal.</p>
            <div className="gp-actions" style={{ marginTop: 10 }}>
              <button type="button" className="gp-btn gp-primary" disabled={busy} onClick={acknowledge}>I have read this update</button>
              <button type="button" className="gp-btn" onClick={() => setTab('commission')}>See the full schedule</button>
            </div>
          </section>
        )
      })()}

      <div className="gp-seg" role="tablist" aria-label="Dashboard sections" style={{ marginBottom: 16 }}>
        {(['overview', 'deals', 'statement', 'commission'] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-pressed={tab === t} aria-selected={tab === t} onClick={() => setTab(t)}>
            {t === 'overview' ? 'Overview' : t === 'deals' ? `Deals (${d.deals.length})` : t === 'statement' ? 'Statement' : 'Rates'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="gp-grid2">
          <section className="gp-pane" style={{ marginTop: 0 }}>
            <h2 style={{ fontSize: 18 }}>Your certificate</h2>
            <p style={{ margin: '0 0 4px' }}><strong>{c.number}</strong>{' '}
              <span style={{ color: c.status === 'valid' ? 'var(--ok)' : 'var(--danger)', fontWeight: 700 }}>{c.status === 'valid' ? 'Valid' : c.status === 'expired' ? 'Expired' : 'Revoked'}</span></p>
            <p className="gp-muted" style={{ margin: '0 0 12px' }}>Issued {fmt(c.issuedAt)}, valid until {fmt(c.expiresAt)}</p>
            <div className="gp-actions" style={{ marginTop: 0 }}>
              <a className="gp-btn gp-primary" href={c.pdf}>Download certificate</a>
              <a className="gp-btn" href={c.linkedInUrl} target="_blank" rel="noopener noreferrer">Add to LinkedIn</a>
              <a className="gp-btn" href={c.verifyUrl} target="_blank" rel="noopener noreferrer">Verification page</a>
            </div>
            <p className="gp-muted" style={{ marginTop: 12 }}>Describe yourself only as a &ldquo;{d.partner.title}&rdquo;, never as certified by or partnered with any vendor.</p>
          </section>
          <section className="gp-pane" style={{ marginTop: 0 }}>
            <h2 style={{ fontSize: 18 }}>Your deals</h2>
            <p style={{ margin: '0 0 4px' }}><strong>{live.length}</strong> registered &middot; <strong>{d.deals.filter((x) => x.status === 'pending').length}</strong> awaiting approval &middot; <strong>{d.deals.filter((x) => x.status === 'won').length}</strong> won</p>
            {soon.length > 0 && <div className="gp-alert gp-note">{soon.length} registration{soon.length === 1 ? ' lapses' : 's lapse'} within three weeks. Involve GoLive now: a meeting GoLive attends or a GoLive quotation extends it.</div>}
            <div className="gp-actions"><button type="button" className="gp-btn gp-primary" onClick={() => { setTab('deals'); setShowForm(true) }}>Register a prospect</button></div>
            <h2 style={{ fontSize: 18, marginTop: 20 }}>Your agreement</h2>
            <p className="gp-muted" style={{ margin: '0 0 10px' }}>{d.agreement.version}{d.agreement.scheduleVersion ? `, signed with commission schedule version ${d.agreement.scheduleVersion}` : ''}</p>
            <a className="gp-btn" href={d.agreement.pdf}>Download the signed agreement</a>
          </section>
        </div>
      )}

      {tab === 'deals' && (
        <>
          <section className="gp-pane" style={{ marginTop: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, margin: 0 }}>Register a prospect</h2>
              {!showForm && <button type="button" className="gp-btn gp-primary" onClick={() => setShowForm(true)}>New registration</button>}
            </div>
            <p className="gp-muted" style={{ margin: '8px 0 0' }}>
              {`Register before you approach an organisation. Once approved it is held for you for ${d.rules.initialDays} days, extended to ${d.rules.milestoneDays} days after each milestone GoLive records (a meeting GoLive attends, a GoLive quotation, or the prospect\u2019s written confirmation to GoLive), up to ${d.rules.limitDays} days in total. Existing GoLive customers and prospects already in a GoLive pipeline cannot be registered.`}
            </p>
            {showForm && (
              <>
                <div className="gp-fields" style={{ marginTop: 16 }}>
                  {f('organisation', 'Organisation *')}
                  {f('sector', 'Sector')}
                  {f('contactName', 'Your contact there')}
                  {f('contactRole', 'Their role')}
                  {f('contactEmail', 'Contact email', { type: 'email' })}
                  {f('contactPhone', 'Contact phone', { type: 'tel' })}
                  <label className="gp-field"><span>Line of business</span>
                    <select value={form.lineOfBusiness} onChange={(e) => setForm({ ...form, lineOfBusiness: e.target.value })}>
                      <option value="">Not sure yet</option>
                      {d.lines.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </label>
                  {f('estimatedValue', 'Estimated value (\u20a6, optional)', { inputMode: 'numeric' })}
                  {f('expectedClose', 'Expected timing', { placeholder: 'e.g. Q1 2027' })}
                  <label className="gp-field wide"><span>Requirement</span>
                    <textarea value={form.requirement} onChange={(e) => setForm({ ...form, requirement: e.target.value })} placeholder="e.g. Microsoft 365 for 80 staff, moving from Google Workspace" />
                  </label>
                </div>
                <div className="gp-nav">
                  <button type="button" className="gp-btn" onClick={() => { setShowForm(false); setMsg(null) }}>Cancel</button>
                  <button type="button" className="gp-btn gp-primary" disabled={busy} onClick={register}>Submit registration</button>
                </div>
              </>
            )}
            {msg && <div className={`gp-alert ${msg.ok ? 'gp-okbox' : 'gp-err'}`}>{msg.text}</div>}
          </section>

          <section className="gp-pane">
            <h2 style={{ fontSize: 18 }}>Your registrations</h2>
            {d.deals.length === 0 && <p className="gp-muted">None yet.</p>}
            <ul className="gp-track">
              {d.deals.map((x) => (
                <li key={x.id} style={{ gridTemplateColumns: '1fr auto' }}>
                  <span>
                    <b>{x.organisation}</b>
                    <small>
                      {x.ref}{x.lineOfBusiness ? ` \u00b7 ${x.lineOfBusiness}` : ''}{x.estimatedValue ? ` \u00b7 ${naira(x.estimatedValue)}` : ''}
                      {x.source === 'application' ? ' \u00b7 from your application' : ''}
                    </small>
                    <small style={{ display: 'block', marginTop: 2 }}>
                      {x.status === 'active' && x.validUntil ? `Held until ${fmt(x.validUntil)} (limit ${fmt(x.hardLimit)})${x.scheduleVersion ? ` \u00b7 rates locked to schedule version ${x.scheduleVersion}` : ''}` : ''}
                      {x.status === 'pending' ? `Submitted ${fmt(x.submittedAt)}, awaiting GoLive\u2019s approval` : ''}
                      {x.status === 'lapsed' && x.validUntil ? `Lapsed ${fmt(x.validUntil)}. You may register it again; a new registration carries the rates then in force.` : ''}
                      {x.status === 'refused' && x.decisionNote ? `Not accepted: ${x.decisionNote}` : ''}
                    </small>
                    {x.milestones.length > 0 && <small style={{ display: 'block', marginTop: 2 }}>Milestones: {x.milestones.map((m) => `${m.label} (${fmt(m.at)})`).join('; ')}</small>}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: TONE[x.status] || 'var(--fg2)' }}>{x.statusLabel}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {tab === 'statement' && (() => {
        const n2 = (x: number) => `\u20a6${x.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        const sum = (st: string) => d.statement.filter((x) => x.status === st).reduce((a, x) => a + x.net, 0)
        return (
          <section className="gp-pane" style={{ marginTop: 0 }}>
            <h2 style={{ fontSize: 18 }}>Commission statement</h2>
            <div className="gp-grid2" style={{ gridTemplateColumns: 'repeat(3, 1fr)', margin: '8px 0 14px' }}>
              <div className="gp-fact"><b>{n2(sum('accrued'))}</b><span>Due to you (after withholding tax)</span></div>
              <div className="gp-fact"><b>{n2(sum('paid'))}</b><span>Paid to you</span></div>
              <div className="gp-fact"><b>{n2(sum('clawed_back'))}</b><span>Clawed back</span></div>
            </div>
            {d.statement.length === 0 ? <p className="gp-muted">No commission yet. Commission is recorded when GoLive receives payment on a deal you registered.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 760 }}>
                  <thead><tr style={{ textAlign: 'left', color: 'var(--fg3)', fontSize: 12 }}>
                    <th style={{ padding: '6px 8px 6px 0' }}>Deal</th><th style={{ padding: 6 }}>Payment received</th><th style={{ padding: 6 }}>Rate</th>
                    <th style={{ padding: 6 }}>Commission</th><th style={{ padding: 6 }}>Withholding tax</th><th style={{ padding: 6 }}>Net</th><th style={{ padding: '6px 0 6px 6px' }}>Status</th>
                  </tr></thead>
                  <tbody>{d.statement.map((x) => (
                    <tr key={x.ref} style={{ borderTop: '1px solid var(--stroke3)', verticalAlign: 'top' }}>
                      <td style={{ padding: '8px 8px 8px 0' }}><b>{x.organisation}</b><div className="gp-muted" style={{ fontSize: 12 }}>{x.ref} · {x.kind === 'renewal' ? 'renewal' : 'first year'}</div></td>
                      <td style={{ padding: 6 }}>{n2(x.amount)}<div className="gp-muted" style={{ fontSize: 12 }}>{fmt(x.receivedAt)}</div></td>
                      <td style={{ padding: 6 }}>{Number((x.effectivePct * 100).toFixed(3))}%<div className="gp-muted" style={{ fontSize: 12 }}>v{x.scheduleVersion}{x.marginLimited ? ', clause 5.2' : ''}</div></td>
                      <td style={{ padding: 6 }}>{n2(x.gross)}</td>
                      <td style={{ padding: 6 }}>{n2(x.wht)}</td>
                      <td style={{ padding: 6, fontWeight: 700 }}>{n2(x.net)}</td>
                      <td style={{ padding: '6px 0 6px 6px' }}>
                        {x.status === 'accrued' ? <>Due by {fmt(x.dueAt)}</> : x.status === 'paid' ? <>Paid {fmt(x.paidAt)}<div className="gp-muted" style={{ fontSize: 12 }}>{x.paymentReference}</div></> : <>Clawed back<div className="gp-muted" style={{ fontSize: 12 }}>{x.clawbackReason}</div></>}
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
            <p className="gp-muted" style={{ marginTop: 12 }}>Commission is calculated on amounts GoLive receives, excluding VAT, and is recoverable if the client cancels, is refunded or defaults within 90 days of payment (clause 5.3).</p>
          </section>
        )
      })()}

      {tab === 'commission' && (
        <>
          <section className="gp-pane" style={{ marginTop: 0 }}>
            <h2 style={{ fontSize: 18 }}>{d.schedule ? `Current rates for a ${d.partner.category === 'sales' ? 'Sales' : 'Referral'} Partner: version ${d.schedule.version}` : 'No schedule published yet'}</h2>
            {d.schedule && (
              <>
                <p className="gp-muted" style={{ margin: '0 0 10px' }}>Effective {fmt(d.schedule.effectiveAt)}. Commission is paid on amounts GoLive receives, excluding VAT, within 30 days of payment clearing, less withholding tax (agreement clause 5).</p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead><tr style={{ textAlign: 'left', color: 'var(--fg3)', fontSize: 12 }}><th style={{ padding: '6px 8px 6px 0' }}>Line of business</th><th style={{ padding: '6px 8px' }}>Basis</th><th style={{ padding: '6px 0 6px 8px' }}>Rate</th></tr></thead>
                    <tbody>
                      {d.schedule.rows.map((r, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--stroke3)', verticalAlign: 'top' }}>
                          <td style={{ padding: '8px 8px 8px 0', fontWeight: 600 }}>{r.line}</td>
                          <td style={{ padding: 8, color: 'var(--fg2)' }}>{r.basis}</td>
                          <td style={{ padding: '8px 0 8px 8px', fontWeight: 600 }}>{r.rate.split(/;\s*/).map((b, j) => <div key={j}>{b}</div>)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
          {d.history.length > 0 && (
            <section className="gp-pane">
              <h2 style={{ fontSize: 18 }}>Schedule history</h2>
              <ul className="gp-track">
                {d.history.map((h) => (
                  <li key={h.version} style={{ gridTemplateColumns: '1fr' }}>
                    <span>
                      <b>Version {h.version}, effective {fmt(h.effectiveAt)}</b>
                      {h.summary && <small>{h.summary}</small>}
                      {h.changes.length > 0 && <small style={{ display: 'block', marginTop: 2 }}>{h.changes.join('; ')}</small>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <p className="gp-muted" style={{ marginTop: 20 }}>Questions: <a href={`mailto:${PARTNER_EMAIL}`}>{PARTNER_EMAIL}</a></p>
    </div>
  )
}
