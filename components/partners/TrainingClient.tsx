'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MODULES, ASSESSMENT_RULES, INTEGRITY_DISCLOSURE } from '@/lib/partnerTraining'
import { PARTNER_EMAIL } from '@/lib/partnerConfig'

type Kind = 'integrity' | 'final'
type Question = { id: string; sec: string; type: 'mcq' | 'tf' | 'text'; text: string; opts?: string[] }
type State = {
  open: boolean; closedReason?: string; required: number[]; completed: Record<string, string>; nextModule: number | null
  integrity: { passed: boolean; passedAt?: string; attempts: number; canBegin: boolean; reason?: string }
  final: { passed: boolean; passedAt?: string; attempts: number; allowed: number; canBegin: boolean; reason?: string; availableFrom?: string; lastPct?: number }
}
type Review = { question: string; answer: string; correctAnswer: string | null; explanation: string | null }
type Data = {
  ref: string; name: string; category: 'referral' | 'sales'; state: State
  inProgress: { kind: Kind; number: number; questions: Question[]; secondsLeft: number } | null
  integrityLast: { pct?: number; passed: boolean; abandoned: boolean } | null
  integrityReview: Review[]
}
type Result = { kind: Kind; pct: number; passed: boolean; late: boolean; passPct: number; review: Review[] }
type View =
  | { v: 'home' } | { v: 'module'; no: number } | { v: 'intro'; kind: Kind }
  | { v: 'test'; kind: Kind; number: number; questions: Question[]; deadline: number } | { v: 'result'; r: Result }

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '')
const first = (n: string) => (n || '').trim().split(/\s+/)[0]
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export default function TrainingClient({ token }: { token: string }) {
  const [data, setData] = useState<Data | null>(null)
  const [fatal, setFatal] = useState('')
  const [view, setView] = useState<View>({ v: 'home' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)
  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const load = useCallback(async (resume = false) => {
    try {
      const r = await fetch(`/api/partner-training?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
      const d = await r.json()
      if (!r.ok) { setFatal(d.error || 'This link could not be opened.'); return }
      setData(d)
      if (resume && d.inProgress) {
        setView({ v: 'test', kind: d.inProgress.kind, number: d.inProgress.number, questions: d.inProgress.questions, deadline: Date.now() + d.inProgress.secondsLeft * 1000 })
      }
    } catch { setFatal('Network error. Please refresh the page.') }
  }, [token])

  useEffect(() => { load(true) }, [load])

  if (fatal) {
    return (
      <div className="gp-pane" ref={topRef}>
        <h1 style={{ fontSize: 28, lineHeight: '34px' }}>Partner training</h1>
        <div className="gp-alert gp-err">{fatal}</div>
        <p className="gp-muted" style={{ marginTop: 12 }}>Contact <a href={`mailto:${PARTNER_EMAIL}`}>{PARTNER_EMAIL}</a> if you need help.</p>
      </div>
    )
  }
  if (!data) return <div className="gp-pane" ref={topRef}><p className="gp-muted">Loading your training…</p></div>

  const st = data.state
  const moduleRow = (no: number) => {
    const m = MODULES.find((x) => x.no === no)!
    const done = st.completed[no]
    const isNext = st.nextModule === no
    return (
      <li key={`m${no}`}>
        <span className={`gp-dot${done ? ' done' : isNext ? ' next' : ''}`}>{done ? '✓' : no}</span>
        <span><b>Module {no}: {m.title}</b><small>{done ? `Completed ${fmt(done)}` : `About ${m.minutes} minutes. ${m.summary}`}</small></span>
        {done
          ? <button type="button" className="gp-btn" onClick={() => { setView({ v: 'module', no }); scrollTop() }}>Review</button>
          : <button type="button" className={`gp-btn${isNext ? ' gp-primary' : ''}`} disabled={!isNext} onClick={() => { setView({ v: 'module', no }); setErr(''); scrollTop() }}>{isNext ? 'Start' : 'Locked'}</button>}
      </li>
    )
  }
  const testRow = (kind: Kind) => {
    const r = ASSESSMENT_RULES[kind]
    const s = kind === 'integrity' ? st.integrity : st.final
    const inProg = data.inProgress?.kind === kind
    const detail = s.passed
      ? `Passed ${fmt(s.passedAt)}`
      : kind === 'integrity'
        ? `${r.questions} questions, ${r.minutes} minutes. Every answer must be correct; you may retake it straight away.`
        : `${r.questions} questions, ${r.minutes} minutes, pass mark ${r.passPct}%. Attempt ${Math.min(st.final.attempts + 1, st.final.allowed)} of ${st.final.allowed}.${st.final.availableFrom ? ` Next attempt opens ${fmt(st.final.availableFrom)}.` : ''}`
    return (
      <li key={kind}>
        <span className={`gp-dot${s.passed ? ' done' : s.canBegin || inProg ? ' next' : ''}`}>{s.passed ? '✓' : '★'}</span>
        <span><b>{r.title}</b><small>{detail}</small></span>
        {!s.passed && (
          <button type="button" className={`gp-btn${s.canBegin || inProg ? ' gp-primary' : ''}`} disabled={!s.canBegin && !inProg}
            onClick={() => { setView({ v: 'intro', kind }); setErr(''); scrollTop() }}>
            {inProg ? 'Resume' : s.canBegin ? 'Begin' : 'Locked'}
          </button>
        )}
      </li>
    )
  }

  async function completeModule(no: number) {
    setBusy(true); setErr('')
    try {
      const r = await fetch('/api/partner-training/module', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, no, confirmed: true }) })
      const d = await r.json()
      if (!r.ok) { setErr(d.error || 'That did not save.'); return }
      await load()
      setView({ v: 'home' }); scrollTop()
    } catch { setErr('Network error. Please try again.') } finally { setBusy(false) }
  }

  async function begin(kind: Kind) {
    setBusy(true); setErr('')
    try {
      const r = await fetch('/api/partner-training/begin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, kind }) })
      const d = await r.json()
      if (!r.ok) { setErr(d.error || 'The assessment could not be started.'); return }
      setView({ v: 'test', kind, number: d.number, questions: d.questions, deadline: Date.now() + d.secondsLeft * 1000 })
      scrollTop()
    } catch { setErr('Network error. Please try again.') } finally { setBusy(false) }
  }

  return (
    <div ref={topRef} style={{ scrollMarginTop: 16 }}>
      {view.v === 'home' && (
        <>
          <div style={{ marginBottom: 20 }}>
            <span className="gp-tag">{data.ref}</span>
            <h1 style={{ marginTop: 10 }}>Welcome, {first(data.name)}</h1>
            <p className="gp-lede">Complete each step in order. You can stop at any point and return with the same link; your progress is saved as you go.</p>
          </div>
          {!st.open && <div className="gp-alert gp-err" style={{ marginBottom: 16 }}>{st.closedReason}</div>}
          {st.final.passed && (
            <div className="gp-alert gp-okbox" style={{ margin: '0 0 16px' }}>
              Training complete. Your Independent Sales Partner Agreement will be sent to you to sign online.
            </div>
          )}
          <section className="gp-pane">
            <ol className="gp-track">
              {st.required.includes(1) && moduleRow(1)}
              {testRow('integrity')}
              {st.required.filter((n) => n !== 1).map(moduleRow)}
              {testRow('final')}
            </ol>
          </section>
        </>
      )}

      {view.v === 'module' && (() => {
        const m = MODULES.find((x) => x.no === view.no)!
        const done = !!st.completed[m.no]
        return <ModuleReader key={m.no} m={m} done={done} busy={busy} err={err}
          onBack={() => { setView({ v: 'home' }); setErr(''); scrollTop() }} onComplete={() => completeModule(m.no)} />
      })()}

      {view.v === 'intro' && (() => {
        const r = ASSESSMENT_RULES[view.kind]
        const inProg = data.inProgress?.kind === view.kind
        return (
          <section className="gp-pane">
            <h2>{r.title}</h2>
            <p className="gp-lede" style={{ fontSize: 15 }}>
              {view.kind === 'integrity'
                ? `${r.questions} questions on Module 1. Every answer must be correct. If any are wrong, you will see why, and you may retake it straight away with a fresh set of questions.`
                : `${r.questions} questions on Modules 2 to 4. The pass mark is ${r.passPct}%. You have ${st.final.allowed - st.final.attempts} attempt${st.final.allowed - st.final.attempts === 1 ? '' : 's'} remaining; a second attempt opens seven days after the first. Answers are not shown after this assessment.`}
            </p>
            <div className="gp-meter" style={{ marginTop: 12 }}>
              <span><b>Time:</b> {r.minutes} minutes, running from when you press Begin, even if you close the page</span>
            </div>
            <h3 style={{ marginTop: 20 }}>What is monitored, and what is not</h3>
            <p className="gp-muted">This is disclosed before the first question, and nothing beyond this list is recorded.</p>
            <div className="gp-disclose">
              <div><b>Recorded</b><ul>{INTEGRITY_DISCLOSURE.recorded.map((x) => <li key={x}>{x}</li>)}</ul></div>
              <div><b>Not recorded</b><ul>{INTEGRITY_DISCLOSURE.notRecorded.map((x) => <li key={x}>{x}</li>)}</ul></div>
            </div>
            <p className="gp-muted">Copying and pasting are disabled inside the assessment. Please complete it on your own, without assistance, in one sitting.</p>
            {err && <div className="gp-alert gp-err" role="alert">{err}</div>}
            <div className="gp-nav">
              <button type="button" className="gp-btn" onClick={() => { setView({ v: 'home' }); setErr('') }}>Back</button>
              <button type="button" className="gp-btn gp-primary gp-lg" disabled={busy} onClick={() => begin(view.kind)}>{inProg ? 'Resume' : 'Begin'}</button>
            </div>
          </section>
        )
      })()}

      {view.v === 'test' && (
        <TestRunner key={`${view.kind}-${view.number}`} token={token} kind={view.kind} number={view.number} questions={view.questions} deadline={view.deadline}
          onDone={async (r) => { await load(); setView({ v: 'result', r }); scrollTop() }} />
      )}

      {view.v === 'result' && (
        <section className="gp-pane">
          <h2>{ASSESSMENT_RULES[view.r.kind].title}: {view.r.passed ? 'passed' : 'not passed'}</h2>
          <p className="gp-big" style={{ color: view.r.passed ? 'var(--ok)' : 'var(--danger)' }}>{view.r.pct}%</p>
          <p className="gp-muted">Pass mark {view.r.passPct}%.{view.r.late ? ' This was submitted after the time allowed, so it cannot count as a pass.' : ''}</p>
          {view.r.kind === 'integrity' && !view.r.passed && (
            <>
              <h3 style={{ marginTop: 18 }}>What to review</h3>
              {view.r.review.map((q, i) => (
                <div className="gp-review-item" key={i}>
                  <p><b>{q.question}</b></p>
                  <p>Your answer: {q.answer}</p>
                  <p>Correct answer: {q.correctAnswer}</p>
                  {q.explanation && <p style={{ color: 'var(--fg2)' }}>{q.explanation}</p>}
                </div>
              ))}
            </>
          )}
          {view.r.kind === 'integrity' && view.r.passed && <p>Well done. Modules 2 to 4 are now open.</p>}
          {view.r.kind === 'final' && view.r.passed && <p>Congratulations. Your training is complete. We will send your Independent Sales Partner Agreement to sign online; your partner number and certificate follow its countersignature.</p>}
          {view.r.kind === 'final' && !view.r.passed && (
            <p>{data.state.final.availableFrom
              ? `Your next attempt opens on ${fmt(data.state.final.availableFrom)}. Reviewing Modules 2 to 4 is the best preparation.`
              : `Please contact ${PARTNER_EMAIL} about next steps.`}</p>
          )}
          <div className="gp-nav">
            <span />
            {view.r.kind === 'integrity' && !view.r.passed
              ? <button type="button" className="gp-btn gp-primary" onClick={() => { setView({ v: 'intro', kind: 'integrity' }); scrollTop() }}>Retake the integrity check</button>
              : <button type="button" className="gp-btn gp-primary" onClick={() => { setView({ v: 'home' }); scrollTop() }}>Back to your training</button>}
          </div>
        </section>
      )}
    </div>
  )
}

function ModuleReader({ m, done, busy, err, onBack, onComplete }: {
  m: (typeof MODULES)[number]; done: boolean; busy: boolean; err: string; onBack: () => void; onComplete: () => void
}) {
  const [ok, setOk] = useState(false)
  return (
    <section className="gp-pane">
      <span className="gp-tag">Module {m.no} · about {m.minutes} minutes</span>
      <h2 style={{ marginTop: 10 }}>{m.title}</h2>
      <div className="gp-reader">
        {m.sections.map((s) => (
          <div key={s.heading}>
            <h3>{s.heading}</h3>
            {s.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
            {s.points && <ul>{s.points.map((p, i) => <li key={i}>{p}</li>)}</ul>}
          </div>
        ))}
      </div>
      {!done && (
        <label className="gp-check" style={{ marginTop: 22, padding: 14, border: '1px solid var(--stroke2)', borderRadius: 8 }}>
          <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
          <span>{m.confirm}</span>
        </label>
      )}
      {err && <div className="gp-alert gp-err" role="alert">{err}</div>}
      <div className="gp-nav">
        <button type="button" className="gp-btn" onClick={onBack}>Back</button>
        {done
          ? <span className="gp-muted">Completed</span>
          : <button type="button" className="gp-btn gp-primary" disabled={!ok || busy} onClick={onComplete}>Mark module complete</button>}
      </div>
    </section>
  )
}

function TestRunner({ token, kind, number, questions, deadline, onDone }: {
  token: string; kind: Kind; number: number; questions: Question[]; deadline: number; onDone: (r: Result) => void
}) {
  const store = `gl-ptr-${kind}-${number}`
  const [answers, setAnswers] = useState<Record<string, number | string>>(() => {
    try { return JSON.parse(sessionStorage.getItem(store) || '{}') } catch { return {} }
  })
  const [left, setLeft] = useState(Math.max(0, Math.floor((deadline - Date.now()) / 1000)))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const counts = useRef({ tabSwitches: 0, focusLoss: 0, pasteTries: 0, copyTries: 0 })
  const [shown, setShown] = useState(counts.current)
  const started = useRef(Date.now())
  const submitted = useRef(false)

  useEffect(() => { try { sessionStorage.setItem(store, JSON.stringify(answers)) } catch { /* ignore */ } }, [answers, store])

  // Only what the disclosure screen listed: tab switches, focus loss, paste and copy attempts.
  useEffect(() => {
    const bump = (k: keyof typeof counts.current) => { counts.current = { ...counts.current, [k]: counts.current[k] + 1 }; setShown(counts.current) }
    const onVis = () => { if (document.hidden) bump('tabSwitches') }
    const onBlur = () => { if (!document.hidden) bump('focusLoss') }
    const onPaste = (e: ClipboardEvent) => { e.preventDefault(); bump('pasteTries') }
    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); bump('copyTries') }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('blur', onBlur)
    document.addEventListener('paste', onPaste)
    document.addEventListener('copy', onCopy)
    document.addEventListener('cut', onCopy)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('paste', onPaste)
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('cut', onCopy)
    }
  }, [])

  const submit = useCallback(async (auto = false) => {
    if (submitted.current) return
    submitted.current = true
    setBusy(true); setErr('')
    try {
      const r = await fetch('/api/partner-training/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, kind, answers, integrity: { ...counts.current, seconds: Math.round((Date.now() - started.current) / 1000) } }),
      })
      const d = await r.json()
      if (!r.ok) { submitted.current = false; setErr(d.error || 'The submission failed. Please try again.'); return }
      try { sessionStorage.removeItem(store) } catch { /* ignore */ }
      onDone({ kind, pct: d.pct, passed: d.passed, late: d.late, passPct: d.passPct, review: d.review || [] })
    } catch {
      submitted.current = false
      setErr(auto ? 'Time is up, but the submission failed. Please press Submit now.' : 'Network error. Your answers are kept; please try again.')
    } finally { setBusy(false) }
  }, [token, kind, answers, store, onDone])

  useEffect(() => {
    const t = setInterval(() => {
      const s = Math.max(0, Math.floor((deadline - Date.now()) / 1000))
      setLeft(s)
      if (s === 0) { clearInterval(t); submit(true) }
    }, 1000)
    return () => clearInterval(t)
  }, [deadline, submit])

  const answered = questions.filter((q) => answers[q.id] !== undefined).length

  function trySubmit() {
    const missing = questions.length - answered
    if (missing > 0 && !window.confirm(`${missing} question${missing === 1 ? ' is' : 's are'} unanswered and will be marked wrong. Submit anyway?`)) return
    submit(false)
  }

  return (
    <section className="gp-pane gp-noselect" onContextMenu={(e) => e.preventDefault()}>
      <div className="gp-testbar">
        <span><b>{ASSESSMENT_RULES[kind].title}</b> <span className="gp-muted">· {answered} of {questions.length} answered</span></span>
        <span className={`gp-timer${left <= 120 ? ' low' : ''}`} aria-live="off">{mmss(left)}</span>
      </div>
      <p className="gp-muted" style={{ margin: '0 0 8px' }}>
        Recorded so far: {shown.tabSwitches} tab switches · {shown.focusLoss} focus losses · {shown.pasteTries + shown.copyTries} copy or paste attempts
      </p>
      {questions.map((q, i) => (
        <fieldset className="gp-q" key={q.id} style={{ border: 0, margin: 0 }}>
          <legend className="gp-q-n">Question {i + 1} of {questions.length}</legend>
          <p>{q.text}</p>
          {(q.type === 'tf' ? ['True', 'False'] : q.opts || []).map((o, j) => {
            const val: number | string = q.type === 'tf' ? o : j
            const sel = answers[q.id] === val
            return (
              <label key={j} className={`gp-opt${sel ? ' sel' : ''}`}>
                <input type="radio" name={q.id} checked={sel} onChange={() => setAnswers((a) => ({ ...a, [q.id]: val }))} />
                <span>{o}</span>
              </label>
            )
          })}
        </fieldset>
      ))}
      {err && <div className="gp-alert gp-err" role="alert">{err}</div>}
      <div className="gp-nav">
        <span className="gp-muted">{answered} of {questions.length} answered</span>
        <button type="button" className="gp-btn gp-primary gp-lg" disabled={busy} onClick={trySubmit}>{busy ? 'Submitting' : 'Submit answers'}</button>
      </div>
    </section>
  )
}
