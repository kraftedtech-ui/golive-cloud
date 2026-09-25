'use client'

import { useEffect, useRef, useState } from 'react'
import {
  SOLUTIONS, CATEGORY_INFO, DECLARATIONS, ACKNOWLEDGEMENTS, MAX_NAMED_ACCOUNTS, PARTNER_EMAIL,
} from '@/lib/partnerConfig'

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}

const TURNSTILE_SITEKEY = '0x4AAAAAADnfiHKMINlWRfJ7'
const DRAFT_KEY = 'gl-partner-apply-v1'

type Account = { organisation: string; sector: string; contactName: string; contactRole: string; requirement: string; timing: string }
type Referee = { name: string; position: string; phone: string }
type YN = boolean | null

type Form = {
  category: 'referral' | 'sales' | ''
  applicant: {
    name: string; preferredName: string; email: string; phone: string; linkedin: string
    city: string; state: string; applyingAs: 'individual' | 'business'; businessName: string; cacNumber: string; tin: string
  }
  background: { occupation: string; yearsB2B: string; sectors: string; productsSold: string; largestDeal: string; referees: Referee[] }
  namedAccounts: Account[]
  solutions: string[]
  engagement: { jointMeetings: 'none' | 'corporate' | 'technical' | 'both'; hoursPerWeek: string; firstIntroduction: string; firstSale: string; supportNeeded: string }
  declarations: Record<string, YN>
  particulars: string
  acknowledgements: Record<string, boolean>
  signatureName: string
}

const emptyAccount = (): Account => ({ organisation: '', sector: '', contactName: '', contactRole: '', requirement: '', timing: '' })

const INITIAL: Form = {
  category: '',
  applicant: { name: '', preferredName: '', email: '', phone: '', linkedin: '', city: '', state: '', applyingAs: 'individual', businessName: '', cacNumber: '', tin: '' },
  background: { occupation: '', yearsB2B: '', sectors: '', productsSold: '', largestDeal: '', referees: [{ name: '', position: '', phone: '' }, { name: '', position: '', phone: '' }] },
  namedAccounts: [emptyAccount(), emptyAccount(), emptyAccount()],
  solutions: [],
  engagement: { jointMeetings: 'none', hoursPerWeek: '', firstIntroduction: '', firstSale: '', supportNeeded: '' },
  declarations: Object.fromEntries(DECLARATIONS.map((d) => [d.key, null])) as Record<string, YN>,
  particulars: '',
  acknowledgements: Object.fromEntries(ACKNOWLEDGEMENTS.map((a) => [a.key, false])),
  signatureName: '',
}

const STEPS = ['Your details', 'Background', 'Named accounts', 'Solutions', 'Declarations', 'Review and sign']
const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())

export default function PartnerApplyForm() {
  const [f, setF] = useState<Form>(INITIAL)
  const [step, setStep] = useState(0)
  const [maxStep, setMaxStep] = useState(0)
  const [err, setErr] = useState('')
  const [restored, setRestored] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // email verification
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState('')
  const [verifyToken, setVerifyToken] = useState('')
  const [verifiedFor, setVerifiedFor] = useState('')
  const [verifyBusy, setVerifyBusy] = useState(false)
  const [verifyMsg, setVerifyMsg] = useState('')

  // turnstile
  const [tsReady, setTsReady] = useState(false)
  const [tsToken, setTsToken] = useState('')
  const tsRef = useRef<HTMLDivElement>(null)
  const tsId = useRef<string | null>(null)

  const [hp, setHp] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ ref: string; emailSent: boolean } | null>(null)
  const topRef = useRef<HTMLDivElement>(null)

  // Restore a saved draft from this device.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as { f: Form; step: number; maxStep: number }
        if (saved?.f?.applicant) {
          setF({ ...INITIAL, ...saved.f, acknowledgements: INITIAL.acknowledgements, signatureName: '' })
          setStep(Math.min(saved.step || 0, 4))
          setMaxStep(Math.min(saved.maxStep || 0, 4))
          setRestored(true)
        }
      }
    } catch { /* ignore a corrupt draft */ }
    setLoaded(true)
  }, [])

  // Save the draft on every change. Acknowledgements and signature are never stored.
  useEffect(() => {
    if (!loaded || done) return
    try {
      const { acknowledgements: _a, signatureName: _s, ...rest } = f
      void _a; void _s
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ f: rest, step, maxStep }))
    } catch { /* storage full or blocked: the form still works */ }
  }, [f, step, maxStep, loaded, done])

  // Load Turnstile once.
  useEffect(() => {
    if (document.getElementById('turnstile-script')) { if (window.turnstile) setTsReady(true); return }
    const s = document.createElement('script')
    s.id = 'turnstile-script'
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    s.async = true
    s.defer = true
    s.onload = () => setTsReady(true)
    document.head.appendChild(s)
  }, [])

  // Render the widget whenever the final step is on screen.
  useEffect(() => {
    if (step !== 5 || !tsReady || !tsRef.current || !window.turnstile || tsId.current) return
    tsId.current = window.turnstile.render(tsRef.current, {
      sitekey: TURNSTILE_SITEKEY,
      size: 'flexible',
      callback: (t: string) => setTsToken(t),
      'expired-callback': () => setTsToken(''),
      'error-callback': () => setTsToken(''),
    })
    return () => {
      if (tsId.current && window.turnstile) { try { window.turnstile.remove(tsId.current) } catch { /* already gone */ } }
      tsId.current = null
      setTsToken('')
    }
  }, [step, tsReady])

  // Any edit clears a shown error, so a fixed problem does not keep shouting.
  useEffect(() => { setErr('') }, [f])

  // A changed email address invalidates any earlier verification.
  const emailVerified = verifyToken !== '' && verifiedFor === f.applicant.email.trim().toLowerCase()

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }))
  const setA = (k: keyof Form['applicant'], v: string) => setF((p) => ({ ...p, applicant: { ...p.applicant, [k]: v } }))
  const setB = (k: keyof Omit<Form['background'], 'referees'>, v: string) => setF((p) => ({ ...p, background: { ...p.background, [k]: v } }))
  const setE = (k: keyof Form['engagement'], v: string) => setF((p) => ({ ...p, engagement: { ...p.engagement, [k]: v } as Form['engagement'] }))
  const setRef = (i: number, k: keyof Referee, v: string) =>
    setF((p) => ({ ...p, background: { ...p.background, referees: p.background.referees.map((r, j) => (j === i ? { ...r, [k]: v } : r)) } }))
  const setAcc = (i: number, k: keyof Account, v: string) =>
    setF((p) => ({ ...p, namedAccounts: p.namedAccounts.map((a, j) => (j === i ? { ...a, [k]: v } : a)) }))

  function validate(s: number): string {
    const a = f.applicant
    if (s === 0) {
      if (!f.category) return 'Choose the partner category you are applying for.'
      if (a.name.trim().length < 3 || !a.name.trim().includes(' ')) return 'Enter your full name, first name and surname.'
      if (!isEmail(a.email)) return 'Enter a valid email address.'
      if (a.phone.replace(/\D/g, '').length < 7) return 'Enter a mobile number we can reach you on.'
      if (a.applyingAs === 'business' && !a.businessName.trim()) return 'Enter the registered business name, or choose Individual.'
    }
    if (s === 1) {
      if (!f.background.occupation.trim()) return 'Tell us your current occupation and organisation.'
      if (!f.background.referees.some((r) => r.name.trim())) return 'Give at least one professional referee.'
    }
    if (s === 2) {
      const filled = f.namedAccounts.filter((x) => Object.values(x).some((v) => v.trim()))
      if (filled.some((x) => !x.organisation.trim())) return 'Each account you start needs the organisation name, or clear the row.'
    }
    if (s === 3) {
      if (!f.solutions.length) return 'Choose at least one solution you intend to sell.'
    }
    if (s === 4) {
      if (DECLARATIONS.some((d) => f.declarations[d.key] === null)) return 'Answer every declaration with Yes or No.'
      if (DECLARATIONS.some((d) => f.declarations[d.key] === true) && f.particulars.trim().length < 10) {
        return 'Give particulars for each declaration you answered Yes.'
      }
    }
    return ''
  }

  function go(to: number) {
    if (to > step) {
      for (let s = step; s < to; s++) {
        const e = validate(s)
        if (e) { setErr(e); setStep(s); topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return }
      }
    }
    setErr('')
    setStep(to)
    setMaxStep((m) => Math.max(m, to))
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function sendCode() {
    if (!isEmail(f.applicant.email)) { setVerifyMsg('Your email address in step 1 is not valid.'); return }
    setVerifyBusy(true); setVerifyMsg('')
    try {
      const r = await fetch('/api/verify-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: f.applicant.email.trim().toLowerCase(), turnstileToken: 'bypassed' }),
      })
      const d = await r.json()
      if (d.success) { setCodeSent(true); setVerifyMsg(`A six-digit code has been sent to ${f.applicant.email.trim()}.`) }
      else setVerifyMsg(d.error || 'The code could not be sent. Please try again.')
    } catch { setVerifyMsg('Network error. Please try again.') }
    finally { setVerifyBusy(false) }
  }

  async function checkCode() {
    if (!/^\d{6}$/.test(code.trim())) { setVerifyMsg('Enter the six-digit code from the email.'); return }
    setVerifyBusy(true); setVerifyMsg('')
    try {
      const email = f.applicant.email.trim().toLowerCase()
      const r = await fetch('/api/verify-email/check', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code: code.trim() }),
      })
      const d = await r.json()
      if (d.success && d.verificationToken) { setVerifyToken(d.verificationToken); setVerifiedFor(email); setVerifyMsg('') }
      else setVerifyMsg(d.error || 'That code was not accepted.')
    } catch { setVerifyMsg('Network error. Please try again.') }
    finally { setVerifyBusy(false) }
  }

  async function submit() {
    for (let s = 0; s < 5; s++) { const e = validate(s); if (e) { setErr(e); setStep(s); return } }
    if (ACKNOWLEDGEMENTS.some((a) => !f.acknowledgements[a.key])) { setErr('Confirm every acknowledgement before submitting.'); return }
    if (f.signatureName.trim().toLowerCase().replace(/\s+/g, ' ') !== f.applicant.name.trim().toLowerCase().replace(/\s+/g, ' ')) {
      setErr(`Type your full name exactly as entered in step 1 (${f.applicant.name.trim()}) to sign.`); return
    }
    if (!emailVerified) { setErr('Verify your email address before submitting.'); return }
    if (!tsToken) { setErr('Complete the security check before submitting.'); return }

    setSubmitting(true); setErr('')
    const namedAccounts = f.namedAccounts.filter((x) => x.organisation.trim())
    const referees = f.background.referees.filter((r) => r.name.trim())
    const declarations = { ...f.declarations, particulars: f.particulars }
    try {
      const r = await fetch('/api/partners/apply', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: f.category,
          applicant: { ...f.applicant, email: f.applicant.email.trim().toLowerCase() },
          background: { ...f.background, referees },
          namedAccounts,
          solutions: f.solutions,
          engagement: f.engagement,
          declarations,
          acknowledgements: f.acknowledgements,
          signatureName: f.signatureName.trim(),
          verificationToken: verifyToken,
          turnstileToken: tsToken,
          website: hp,
        }),
      })
      const d = await r.json()
      if (!r.ok || !d.ok) {
        setErr(d.error || 'The application could not be submitted. Please try again.')
        if (window.turnstile && tsId.current) window.turnstile.reset(tsId.current)
        setTsToken('')
        return
      }
      try { localStorage.removeItem(DRAFT_KEY) } catch { /* nothing to clear */ }
      setDone({ ref: d.ref, emailSent: !!d.emailSent })
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch {
      setErr('Network error. Your answers are still saved on this device; please try again.')
    } finally { setSubmitting(false) }
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
    setF(INITIAL); setStep(0); setMaxStep(0); setRestored(false); setErr('')
  }

  if (done) {
    return (
      <div ref={topRef} className="gp-pane gp-done">
        <h1 style={{ fontSize: 28, lineHeight: '34px' }}>Application received</h1>
        <p className="gp-lede" style={{ margin: '0 auto' }}>Thank you. Your application reference is</p>
        <div className="ref">{done.ref}</div>
        <p className="gp-lede" style={{ margin: '0 auto' }}>
          {done.emailSent
            ? `A confirmation has been sent to ${f.applicant.email.trim()}. `
            : 'We could not send your confirmation email, but your application is safely recorded. '}
          We review applications within five working days. Please do not approach the organisations you listed on
          GoLive&rsquo;s behalf until you have been appointed and those accounts are confirmed as registered to you.
        </p>
        <p className="gp-muted" style={{ marginTop: 16 }}>Questions: <a href={`mailto:${PARTNER_EMAIL}`}>{PARTNER_EMAIL}</a></p>
      </div>
    )
  }

  const decl = f.declarations
  const anyYes = DECLARATIONS.some((d) => decl[d.key] === true)

  return (
    <div ref={topRef} style={{ scrollMarginTop: 16 }}>
      <ol className="gp-progress" aria-label="Application progress">
        {STEPS.map((label, i) => (
          <li key={label} className={i <= maxStep ? 'on' : ''}>
            <button type="button" disabled={i > maxStep} onClick={() => go(i)} className={i === step ? 'cur' : ''} aria-current={i === step ? 'step' : undefined}>
              <span className="bar" aria-hidden="true" />
              <small>{i + 1}. {label}</small>
            </button>
          </li>
        ))}
      </ol>

      {restored && step < 5 && (
        <div className="gp-alert gp-note" style={{ margin: '0 0 16px' }}>
          Your saved answers from this device have been restored. <button type="button" className="gp-link" onClick={clearDraft}>Start again</button>
        </div>
      )}

      <section className="gp-pane">
        {step === 0 && (
          <>
            <h2>Your details</h2>
            <p className="gp-muted" style={{ margin: '-6px 0 16px' }}>Your answers are saved on this device as you go, so you can come back and finish later.</p>
            <div className="gp-grid2" role="radiogroup" aria-label="Partner category" style={{ marginBottom: 20 }}>
              {(['referral', 'sales'] as const).map((k) => (
                <label key={k} className={`gp-choice${f.category === k ? ' sel' : ''}`}>
                  <input type="radio" name="category" checked={f.category === k} onChange={() => set('category', k)} />
                  <span><b>{CATEGORY_INFO[k].label}</b><span>{CATEGORY_INFO[k].detail}</span></span>
                </label>
              ))}
            </div>
            <div className="gp-fields">
              <label className="gp-field"><span>Full name <em>*</em></span><input type="text" autoComplete="name" value={f.applicant.name} onChange={(e) => setA('name', e.target.value)} /></label>
              <label className="gp-field">Preferred name<input type="text" value={f.applicant.preferredName} onChange={(e) => setA('preferredName', e.target.value)} /></label>
              <label className="gp-field"><span>Email address <em>*</em></span><input type="email" autoComplete="email" value={f.applicant.email} onChange={(e) => setA('email', e.target.value)} /><small>You will verify it with a code before submitting.</small></label>
              <label className="gp-field"><span>Mobile number <em>*</em></span><input type="tel" autoComplete="tel" value={f.applicant.phone} onChange={(e) => setA('phone', e.target.value)} /></label>
              <label className="gp-field wide">LinkedIn profile<input type="url" placeholder="https://www.linkedin.com/in/..." value={f.applicant.linkedin} onChange={(e) => setA('linkedin', e.target.value)} /></label>
              <label className="gp-field">City<input type="text" value={f.applicant.city} onChange={(e) => setA('city', e.target.value)} /></label>
              <label className="gp-field">State<input type="text" value={f.applicant.state} onChange={(e) => setA('state', e.target.value)} /></label>
              <label className="gp-field">Applying as
                <select value={f.applicant.applyingAs} onChange={(e) => setA('applyingAs', e.target.value)}>
                  <option value="individual">Individual</option>
                  <option value="business">Registered business</option>
                </select>
              </label>
              <label className="gp-field">Tax Identification Number (TIN)<input type="text" value={f.applicant.tin} onChange={(e) => setA('tin', e.target.value)} /><small>Needed before any commission can be paid, as withholding tax is deducted at source.</small></label>
              {f.applicant.applyingAs === 'business' && (
                <>
                  <label className="gp-field"><span>Registered business name <em>*</em></span><input type="text" value={f.applicant.businessName} onChange={(e) => setA('businessName', e.target.value)} /></label>
                  <label className="gp-field">CAC registration number<input type="text" value={f.applicant.cacNumber} onChange={(e) => setA('cacNumber', e.target.value)} /></label>
                </>
              )}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2>Professional background</h2>
            <div className="gp-fields">
              <label className="gp-field wide"><span>Current occupation and organisation <em>*</em></span><input type="text" value={f.background.occupation} onChange={(e) => setB('occupation', e.target.value)} /></label>
              <label className="gp-field">Years of business-to-business selling<input type="text" value={f.background.yearsB2B} onChange={(e) => setB('yearsB2B', e.target.value)} /></label>
              <label className="gp-field">Sectors you sell into most effectively<input type="text" placeholder="e.g. banking, healthcare, oil and gas" value={f.background.sectors} onChange={(e) => setB('sectors', e.target.value)} /></label>
              <label className="gp-field wide">Solutions or products you have sold before<textarea value={f.background.productsSold} onChange={(e) => setB('productsSold', e.target.value)} /></label>
              <label className="gp-field wide">Largest contract you have closed, and its approximate value<textarea value={f.background.largestDeal} onChange={(e) => setB('largestDeal', e.target.value)} /></label>
            </div>
            <p className="gp-subhead">Professional referees (at least one)</p>
            {f.background.referees.map((r, i) => (
              <div className="gp-fields" key={i} style={{ marginBottom: 12 }}>
                <label className="gp-field"><span>Referee {i + 1}: name{i === 0 && <em> *</em>}</span><input type="text" value={r.name} onChange={(e) => setRef(i, 'name', e.target.value)} /></label>
                <label className="gp-field">Position and organisation<input type="text" value={r.position} onChange={(e) => setRef(i, 'position', e.target.value)} /></label>
                <label className="gp-field">Telephone<input type="tel" value={r.phone} onChange={(e) => setRef(i, 'phone', e.target.value)} /></label>
              </div>
            ))}
          </>
        )}

        {step === 2 && (
          <>
            <h2>Market access and named accounts</h2>
            <p className="gp-lede" style={{ fontSize: 14, lineHeight: '21px', marginBottom: 16 }}>
              List the organisations you are well placed to open. Once you are appointed, accounts confirmed as
              registered to you are protected from other partners for 90 days. Organisations that are already
              GoLive clients or in our sales pipeline cannot be registered, and we will tell you if that applies.
              Do not list organisations you are restricted from approaching.
            </p>
            {f.namedAccounts.map((a, i) => (
              <div className="gp-acc" key={i}>
                <div className="gp-acc-head">
                  <span>Account {i + 1}</span>
                  {f.namedAccounts.length > 1 && (
                    <button type="button" className="gp-link" onClick={() => set('namedAccounts', f.namedAccounts.filter((_, j) => j !== i))}>Remove</button>
                  )}
                </div>
                <div className="gp-fields">
                  <label className="gp-field">Organisation<input type="text" value={a.organisation} onChange={(e) => setAcc(i, 'organisation', e.target.value)} /></label>
                  <label className="gp-field">Sector<input type="text" value={a.sector} onChange={(e) => setAcc(i, 'sector', e.target.value)} /></label>
                  <label className="gp-field">Your contact there<input type="text" value={a.contactName} onChange={(e) => setAcc(i, 'contactName', e.target.value)} /></label>
                  <label className="gp-field">Their role<input type="text" value={a.contactRole} onChange={(e) => setAcc(i, 'contactRole', e.target.value)} /></label>
                  <label className="gp-field">Likely requirement<input type="text" placeholder="e.g. Microsoft 365 for 80 staff" value={a.requirement} onChange={(e) => setAcc(i, 'requirement', e.target.value)} /></label>
                  <label className="gp-field">Expected timing<input type="text" placeholder="e.g. Q1 2027" value={a.timing} onChange={(e) => setAcc(i, 'timing', e.target.value)} /></label>
                </div>
              </div>
            ))}
            {f.namedAccounts.length < MAX_NAMED_ACCOUNTS && (
              <button type="button" className="gp-btn" onClick={() => set('namedAccounts', [...f.namedAccounts, emptyAccount()])}>Add another account</button>
            )}
            <p className="gp-muted" style={{ marginTop: 10 }}>Empty rows are ignored. You can list up to {MAX_NAMED_ACCOUNTS}.</p>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Solutions and engagement</h2>
            <p className="gp-subhead">Which solutions do you intend to introduce? <em style={{ color: 'var(--danger)', fontStyle: 'normal' }}>*</em></p>
            <div className="gp-checks">
              {SOLUTIONS.map((s) => (
                <label key={s} className="gp-check">
                  <input type="checkbox" checked={f.solutions.includes(s)}
                    onChange={(e) => set('solutions', e.target.checked ? [...f.solutions, s] : f.solutions.filter((x) => x !== s))} />
                  <span>{s}</span>
                </label>
              ))}
            </div>
            <p className="gp-subhead">How you would like to work</p>
            <div className="gp-fields">
              <label className="gp-field wide">Do you need GoLive to attend client meetings with you?
                <select value={f.engagement.jointMeetings} onChange={(e) => setE('jointMeetings', e.target.value)}>
                  <option value="none">No</option>
                  <option value="corporate">Yes, corporate (commercial) meetings</option>
                  <option value="technical">Yes, technical meetings</option>
                  <option value="both">Yes, both corporate and technical</option>
                </select>
                <small>GoLive attends client meetings between 12:00 and 17:00 West Africa Time.</small>
              </label>
              <label className="gp-field">Hours per week you can realistically commit<input type="text" value={f.engagement.hoursPerWeek} onChange={(e) => setE('hoursPerWeek', e.target.value)} /></label>
              <label className="gp-field">When do you expect your first introduction?<input type="text" value={f.engagement.firstIntroduction} onChange={(e) => setE('firstIntroduction', e.target.value)} /></label>
              <label className="gp-field">When do you expect your first closed sale?<input type="text" value={f.engagement.firstSale} onChange={(e) => setE('firstSale', e.target.value)} /></label>
              <label className="gp-field wide">Support you consider essential from GoLive<textarea value={f.engagement.supportNeeded} onChange={(e) => setE('supportNeeded', e.target.value)} /></label>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2>Declarations</h2>
            <p className="gp-lede" style={{ fontSize: 14, lineHeight: '21px', marginBottom: 8 }}>
              Answer each question. A Yes answer does not necessarily disqualify an application; failing to disclose does.
            </p>
            {DECLARATIONS.map((d) => (
              <div className="gp-yn" key={d.key}>
                <span>{d.text}</span>
                <span className="gp-seg" role="group" aria-label={d.text}>
                  <button type="button" aria-pressed={decl[d.key] === true} onClick={() => set('declarations', { ...decl, [d.key]: true })}>Yes</button>
                  <button type="button" aria-pressed={decl[d.key] === false} onClick={() => set('declarations', { ...decl, [d.key]: false })}>No</button>
                </span>
              </div>
            ))}
            {anyYes && (
              <label className="gp-field wide" style={{ marginTop: 14 }}><span>Particulars for each Yes answer <em>*</em></span>
                <textarea value={f.particulars} onChange={(e) => set('particulars', e.target.value)} />
              </label>
            )}
          </>
        )}

        {step === 5 && (
          <>
            <h2>Review and sign</h2>
            <dl className="gp-review">
              <dt>Category</dt><dd>{f.category ? CATEGORY_INFO[f.category].label : ''}</dd>
              <dt>Name</dt><dd>{f.applicant.name}</dd>
              <dt>Email</dt><dd>{f.applicant.email}</dd>
              <dt>Mobile</dt><dd>{f.applicant.phone}</dd>
              <dt>Applying as</dt><dd>{f.applicant.applyingAs === 'business' ? `Business: ${f.applicant.businessName}` : 'Individual'}</dd>
              <dt>Occupation</dt><dd>{f.background.occupation}</dd>
              <dt>Named accounts</dt><dd>{f.namedAccounts.filter((a) => a.organisation.trim()).map((a) => a.organisation.trim()).join(', ') || 'None listed'}</dd>
              <dt>Solutions</dt><dd>{f.solutions.join('; ')}</dd>
              <dt>Declarations</dt><dd>{anyYes ? `Yes to ${DECLARATIONS.filter((d) => decl[d.key]).length}, particulars given` : 'No to all'}</dd>
            </dl>
            <p className="gp-muted" style={{ marginTop: 8 }}>To change an answer, select its step at the top.</p>

            <p className="gp-subhead">Acknowledgements</p>
            <div className="gp-checks">
              {ACKNOWLEDGEMENTS.map((a) => (
                <label key={a.key} className="gp-check">
                  <input type="checkbox" checked={!!f.acknowledgements[a.key]}
                    onChange={(e) => set('acknowledgements', { ...f.acknowledgements, [a.key]: e.target.checked })} />
                  <span>{a.text}</span>
                </label>
              ))}
            </div>

            <p className="gp-subhead">Signature</p>
            <div className="gp-fields">
              <label className="gp-field wide"><span>Type your full name to sign <em>*</em></span>
                <input type="text" value={f.signatureName} onChange={(e) => set('signatureName', e.target.value)} placeholder={f.applicant.name} />
                <small>Your typed name, the date and time, and your connection details are recorded as your signature.</small>
              </label>
            </div>

            <p className="gp-subhead">Verify your email address</p>
            {emailVerified ? (
              <div className="gp-alert gp-okbox" style={{ marginTop: 0 }}>{f.applicant.email.trim()} is verified.</div>
            ) : (
              <div className="gp-verify">
                <button type="button" className="gp-btn" onClick={sendCode} disabled={verifyBusy}>{codeSent ? 'Send a new code' : `Send a code to ${f.applicant.email.trim() || 'your email'}`}</button>
                {codeSent && (
                  <>
                    <label className="gp-field">Six-digit code<input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} /></label>
                    <button type="button" className="gp-btn gp-primary" onClick={checkCode} disabled={verifyBusy}>Verify</button>
                  </>
                )}
              </div>
            )}
            {verifyMsg && <div className="gp-alert gp-note">{verifyMsg}</div>}

            <p className="gp-subhead">Security check</p>
            <div ref={tsRef} />
            <div className="gp-hp" aria-hidden="true">
              <label>Website<input type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} /></label>
            </div>
          </>
        )}

        {err && <div className="gp-alert gp-err" role="alert">{err}</div>}

        <div className="gp-nav">
          {step > 0 ? <button type="button" className="gp-btn" onClick={() => go(step - 1)}>Back</button> : <span />}
          {step < 5
            ? <button type="button" className="gp-btn gp-primary" onClick={() => go(step + 1)}>Continue</button>
            : <button type="button" className="gp-btn gp-primary gp-lg" onClick={submit} disabled={submitting}>{submitting ? 'Submitting' : 'Submit application'}</button>}
        </div>
      </section>
    </div>
  )
}
