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
  const closeRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  const shown = team === 'all' ? open : open.filter((r) => r.department === team)

  function show(r: CareerRole, el: HTMLElement) {
    returnFocus.current = el
    setActive(r)
  }
  function close() {
    setActive(null)
    returnFocus.current?.focus()
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

  const mail = (r: CareerRole) =>
    `mailto:${contact}?subject=${encodeURIComponent('Application: ' + r.title)}`

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
              <span className="cb-title">{r.title}</span>
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
                  <p>{active.department}</p>
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
              <footer className="cb-df">
                <p>Send your CV and a short note on why this role fits you.</p>
                <div className="cb-actions">
                  <button className="cb-btn" onClick={close}>Close</button>
                  <a className="cb-btn cb-primary" href={mail(active)}>Apply for this role</a>
                </div>
              </footer>
            </>
          )}
        </aside>
      </div>
    </>
  )
}
