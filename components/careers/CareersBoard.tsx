'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { fmtNairaRange, type CareerRole } from '@/lib/careersConfig'

/**
 * CareersBoard: the interactive part of /careers, built on Fluent 2 patterns
 * (vertical tab list, data table, overlay drawer) so it reads like the
 * Microsoft 365 surfaces GoLive's customers already work in.
 */
export default function CareersBoard({ roles, contact }: { roles: CareerRole[]; contact: string }) {
  const open = useMemo(() => roles.filter((r) => r.open), [roles])
  const filled = useMemo(() => roles.filter((r) => !r.open), [roles])
  const teams = useMemo(
    () => [...new Set(open.map((r) => r.department))].map((t) => ({ t, n: open.filter((r) => r.department === t).length })),
    [open]
  )

  const [team, setTeam] = useState<string>('all')
  const [active, setActive] = useState<CareerRole | null>(null)
  const [applying, setApplying] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<{ ref: string; emailSent: boolean } | null>(null)
  const [err, setErr] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', note: '' })
  const [cv, setCv] = useState<File | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  const shown = team === 'all' ? open : open.filter((r) => r.department === team)

  function show(r: CareerRole, el: HTMLElement) {
    returnFocus.current = el
    setApplying(false); setDone(null); setErr('')
    setActive(r)
  }
  function close() {
    if (busy) return
    setActive(null)
    returnFocus.current?.focus()
  }

  async function submit() {
    if (!active) return
    setErr('')
    if (!form.name.trim().includes(' ')) { setErr('Enter your full name.'); return }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) { setErr('Enter a valid email address. Your assessment code will be sent to it.'); return }
    if (!cv) { setErr('Attach your CV as a PDF or Word document.'); return }
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('position', active.slug)
      fd.append('name', form.name.trim())
      fd.append('email', form.email.trim())
      fd.append('phone', form.phone.trim())
      fd.append('note', form.note.trim())
      fd.append('cv', cv)
      const res = await fetch('/api/careers/apply', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setErr(data.error || 'We could not submit your application. Please try again.'); return }
      setDone({ ref: data.ref, emailSent: !!data.emailSent })
    } catch {
      setErr('We could not submit your application. Please check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!active) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [active])

  return (
    <>
      <div className="cb-layout">
        <nav className="cb-pane cb-filters" aria-label="Filter roles by team">
          <p className="cb-filters-label">Team</p>
          <div role="tablist" aria-orientation="vertical">
            <button role="tab" aria-selected={team === 'all'} className="cb-tab" onClick={() => setTeam('all')}>
              <span>All teams</span><small>{open.length}</small>
            </button>
            {teams.map(({ t, n }) => (
              <button key={t} role="tab" aria-selected={team === t} className="cb-tab" onClick={() => setTeam(t)}>
                <span>{t}</span><small>{n}</small>
              </button>
            ))}
          </div>
        </nav>

        <section className="cb-pane cb-table" aria-label="Roles">
          <div className="cb-thead" aria-hidden="true">
            <span>Role</span><span>Team</span><span>Type</span><span className="cb-num">Monthly gross</span>
          </div>

          {shown.map((r) => (
            <button key={r.slug} className="cb-row" onClick={(e) => show(r, e.currentTarget)} aria-haspopup="dialog">
              <span className="cb-title">
                {r.title}
                {(r.openingsLeft ?? 1) > 1 && <span className="cb-openings">{r.openingsLeft} openings</span>}
              </span>
              <span className="cb-meta">{r.department}</span>
              <span className="cb-meta cb-type">{r.type}</span>
              <span className="cb-num">{fmtNairaRange(r.salaryLower, r.salaryUpper)}</span>
            </button>
          ))}

          {open.length === 0 && (
            <p className="cb-empty">
              We are not recruiting at the moment. You are welcome to send your CV to{' '}
              <a href={`mailto:${contact}`}>{contact}</a> for future roles.
            </p>
          )}

          {filled.length > 0 && team === 'all' && (
            <>
              <div className="cb-group">Recently filled</div>
              {filled.map((r) => (
                // Filled roles show only that they are filled: for a one-person
                // role, the pay band would describe an identifiable employee.
                <div key={r.slug} className="cb-row cb-filled">
                  <span className="cb-title">{r.title}</span>
                  <span className="cb-meta">{r.department}</span>
                  <span className="cb-meta cb-type">{r.type}</span>
                  <span className="cb-num"><span className="cb-badge">Filled{r.filledOn ? ` ${r.filledOn}` : ''}</span></span>
                </div>
              ))}
            </>
          )}
        </section>
      </div>

      <div className={active ? 'cb-overlay is-open' : 'cb-overlay'} aria-hidden={!active}>
        <div className="cb-scrim" onClick={close} />
        <aside className="cb-drawer" role="dialog" aria-modal="true" aria-labelledby="cb-drawer-title">
          {active && (
            <>
              <header className="cb-dh">
                <div>
                  <h2 id="cb-drawer-title">{active.title}</h2>
                  <p>
                    {active.department}
                    {(active.openingsLeft ?? 1) > 1 ? `, ${active.openingsLeft} openings` : ''}
                  </p>
                </div>
                <button ref={closeRef} className="cb-x" onClick={close} aria-label="Close">
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9m0-9l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </button>
              </header>
              <div className="cb-db">
                <p className="cb-summary">{active.summary}</p>
                <div className="cb-facts">
                  <div><small>Type</small><b>{active.type}</b></div>
                  <div><small>Location</small><b>{active.location}</b></div>
                  <div>
                    <small>Monthly gross</small>
                    <b>{fmtNairaRange(active.salaryLower, active.salaryUpper)}</b>
                    {active.commission && <small className="cb-plus">plus commission and bonuses</small>}
                  </div>
                </div>
                <h3>What you will do</h3>
                <ul>{active.responsibilities.map((x, i) => <li key={i}>{x}</li>)}</ul>
                <h3>What we are looking for</h3>
                <ul>{active.requirements.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
              {done ? (
                <footer className="cb-df cb-done">
                  <p className="cb-done-title">Application received</p>
                  <p className="cb-done-text">
                    Your reference is <strong>{done.ref}</strong>.{' '}
                    {done.emailSent
                      ? 'We have emailed your personal code for the online assessment, which is the first stage. You have 14 days to take it, at a time that suits you.'
                      : 'We could not send your assessment code just now. Please email talent.acquisition@golivecompany.com quoting your reference and we will send it by hand.'}
                  </p>
                  <div className="cb-actions"><button className="cb-btn cb-primary" onClick={close}>Done</button></div>
                </footer>
              ) : applying ? (
                <footer className="cb-df cb-form">
                  <div className="cb-fields">
                    <label><span>Full name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" /></label>
                    <label><span>Email address</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></label>
                    <label><span>Phone (optional)</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" /></label>
                    <label><span>CV (PDF or Word, up to 5 MB)</span><input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCv(e.target.files?.[0] || null)} /></label>
                    <label className="cb-wide"><span>Why this role fits you (optional, a few sentences)</span><textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
                  </div>
                  {err && <p className="cb-err" role="alert">{err}</p>}
                  <p className="cb-consent">By applying you agree to your details being processed for recruitment under the Nigeria Data Protection Act 2023 and our <a href="/privacy">Privacy Policy</a>. The first stage is a proctored online assessment; your access code is emailed to you when you apply.</p>
                  <div className="cb-actions">
                    <button className="cb-btn" onClick={() => setApplying(false)} disabled={busy}>Back</button>
                    <button className="cb-btn cb-primary" onClick={submit} disabled={busy}>{busy ? 'Submitting' : 'Submit application'}</button>
                  </div>
                </footer>
              ) : (
                <footer className="cb-df">
                  <p>Applying takes two minutes. The first stage is an online assessment you can take within 14 days.</p>
                  <div className="cb-actions">
                    <button className="cb-btn" onClick={close}>Close</button>
                    <button className="cb-btn cb-primary" onClick={() => { setErr(''); setApplying(true) }}>Apply for this role</button>
                  </div>
                </footer>
              )}
            </>
          )}
        </aside>
      </div>
    </>
  )
}
