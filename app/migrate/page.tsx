'use client'
import { useState, useEffect, useRef } from 'react'

const CY = '#0096c7'
const TEAL = '#00c8c8'
const NAVY = '#0d2233'
const LIGHT = '#e8f4fb'
const BORDER = '#c8e6f0'
const MUTED = '#5a7a8a'
const WA = process.env.NEXT_PUBLIC_WA_NUMBER || '2348083587801'

type TransferType = 'csp' | 'google' | 'cpanel'

const TRANSFER_TYPES: Record<TransferType, { label: string; icon: string; title: string; desc: string; color: string }> = {
  csp: { label: 'Switch CSP', icon: '🔄', title: 'Switch Your Microsoft CSP to GoLive', desc: 'Already on Microsoft 365 but unhappy with your current provider? Transfer to GoLive in 48 hours — no downtime, no data loss.', color: '#0078d4' },
  google: { label: 'Google Workspace', icon: '📧', title: 'Move from Google Workspace to Microsoft 365', desc: 'Migrate your team from Google Workspace to Microsoft 365 with full email, contacts and calendar migration handled by GoLive.', color: '#ea4335' },
  cpanel: { label: 'cPanel / Other', icon: '🌐', title: 'Upgrade from cPanel or Webmail', desc: 'Running your business on cPanel, Zoho or basic webmail? Upgrade to enterprise Microsoft 365 with professional email, Teams and SharePoint.', color: '#ff6600' },
}

const PROCESS_STEPS: Record<TransferType, { step: string; title: string; desc: string }[]> = {
  csp: [
    { step: '1', title: 'Submit this form', desc: 'Tell us your tenant domain and current provider. We review within 4 hours.' },
    { step: '2', title: 'GoLive sends transfer request', desc: 'We initiate the CSP transfer in Microsoft Partner Center on your behalf.' },
    { step: '3', title: 'You approve via email', desc: 'Microsoft sends you an approval email. One click and the transfer is initiated.' },
    { step: '4', title: 'Transfer completes', desc: 'Within 48 hours GoLive becomes your CSP. No downtime. No data loss.' },
  ],
  google: [
    { step: '1', title: 'Submit this form', desc: 'Tell us your Google Workspace domain and number of users. We plan the migration.' },
    { step: '2', title: 'Microsoft 365 setup', desc: 'We create your new Microsoft 365 tenant and configure all user accounts.' },
    { step: '3', title: 'Email & data migration', desc: 'We migrate all emails, contacts and calendar events from Google to Microsoft 365.' },
    { step: '4', title: 'DNS cutover & go live', desc: 'We update your DNS records. Your team starts using Microsoft 365 immediately.' },
  ],
  cpanel: [
    { step: '1', title: 'Submit this form', desc: 'Share your domain and cPanel details. We audit your current setup.' },
    { step: '2', title: 'Microsoft 365 setup', desc: 'We create your tenant, configure accounts and set up Teams and SharePoint.' },
    { step: '3', title: 'Email migration', desc: 'All existing emails imported into Microsoft 365. No messages lost.' },
    { step: '4', title: 'DNS switch & training', desc: 'We handle the DNS cutover and train your team on their new tools.' },
  ],
}

const PRICING = [
  { name: 'Starter Cloud Office', price: '$6', per: 'user/month', best: 'Small teams 1–20 users', features: ['Microsoft 365 Business Basic', 'Professional domain email', 'Teams, OneDrive & SharePoint', 'Email migration included', 'SPF / DKIM / DMARC setup', '30-day onboarding support'], color: CY },
  { name: 'Secure Business Cloud', price: '$22', per: 'user/month', best: 'Businesses handling sensitive data', features: ['Microsoft 365 Business Premium', 'Microsoft Defender for Business', 'MFA & Conditional Access', 'Email security hardening', 'Security awareness training', 'Monthly managed support'], color: NAVY, popular: true },
  { name: 'AI-Ready Enterprise', price: 'Custom', per: 'quote', best: 'Mid-size teams ready for Copilot AI', features: ['Microsoft 365 + Copilot pilot', 'Copilot Readiness Audit', 'Power Automate workflows', 'Power BI reporting setup', 'Prompt engineering training', 'Premium managed support'], color: TEAL },
]

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}

export default function MigratePage() {
  const [type, setType] = useState<TransferType>('csp')
  const [form, setForm] = useState({ company: '', contact: '', email: '', phone: '', domain: '', users: '', currentProvider: '', country: 'Nigeria', notes: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [ref, setRef] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileReady, setTurnstileReady] = useState(false)
  const widgetRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | undefined>(undefined)

  const [emailTurnstileToken, setEmailTurnstileToken] = useState('')
  const emailWidgetRef = useRef<HTMLDivElement>(null)
  const emailWidgetIdRef = useRef<string | undefined>(undefined)

  const [emailVerified, setEmailVerified] = useState(false)
  const [verificationToken, setVerificationToken] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [otpCooldown, setOtpCooldown] = useState(0)

  useEffect(() => {
    if (otpCooldown <= 0) return
    const t = setTimeout(() => setOtpCooldown(cd => cd - 1), 1000)
    return () => clearTimeout(t)
  }, [otpCooldown])

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  function resetEmailVerification() {
    setEmailVerified(false)
    setVerificationToken('')
    setOtpSent(false)
    setOtpCode('')
    setOtpError('')
  }

  async function handleSendOtp() {
    if (!isValidEmail(form.email)) {
      setOtpError('Please enter a valid email address first.')
      return
    }
    if (!emailTurnstileToken) {
      setOtpError('Please complete the security check below first.')
      return
    }
    setOtpError('')
    setSendingOtp(true)
    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, turnstileToken: emailTurnstileToken }),
      })
      const result = await res.json()
      if (result.success) {
        setOtpSent(true)
        setOtpCooldown(60)
      } else if (result.error === 'captcha_failed' || result.error === 'captcha_required') {
        setOtpError('Security check failed. Please try again.')
        if (window.turnstile && emailWidgetIdRef.current) window.turnstile.reset(emailWidgetIdRef.current)
        setEmailTurnstileToken('')
      } else {
        setOtpError(result.error || 'Failed to send code. Please try again.')
      }
    } catch {
      setOtpError('Network error. Please try again.')
    } finally {
      setSendingOtp(false)
    }
  }

  async function handleVerifyOtp() {
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Enter the 6-digit code from your email.')
      return
    }
    setOtpError('')
    setVerifyingOtp(true)
    try {
      const res = await fetch('/api/verify-email/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, code: otpCode }),
      })
      const result = await res.json()
      if (result.success) {
        setEmailVerified(true)
        setVerificationToken(result.verificationToken)
      } else {
        setOtpError(result.error || 'Incorrect code.')
      }
    } catch {
      setOtpError('Network error. Please try again.')
    } finally {
      setVerifyingOtp(false)
    }
  }

  useEffect(() => {
    if (document.getElementById('turnstile-script')) {
      if (window.turnstile) setTurnstileReady(true)
      return
    }
    const script = document.createElement('script')
    script.id = 'turnstile-script'
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    script.onload = () => setTurnstileReady(true)
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!turnstileReady || !widgetRef.current || !window.turnstile) return
    if (widgetIdRef.current) return
    widgetIdRef.current = window.turnstile.render(widgetRef.current, {
      sitekey: '0x4AAAAAADnfiHKMINlWRfJ7',
      callback: (token: string) => setTurnstileToken(token),
      'expired-callback': () => setTurnstileToken(''),
      'error-callback': () => setTurnstileToken(''),
    })
  }, [turnstileReady])

  useEffect(() => {
    if (!turnstileReady || !emailWidgetRef.current || !window.turnstile) return
    if (emailWidgetIdRef.current) return
    emailWidgetIdRef.current = window.turnstile.render(emailWidgetRef.current, {
      sitekey: '0x4AAAAAADnfiHKMINlWRfJ7',
      callback: (token: string) => setEmailTurnstileToken(token),
      'expired-callback': () => setEmailTurnstileToken(''),
      'error-callback': () => setEmailTurnstileToken(''),
    })
  }, [turnstileReady])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailVerified || !verificationToken) {
      setStatus('error')
      return
    }
    if (!turnstileToken) {
      setStatus('error')
      return
    }
    setStatus('sending')
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, transferType: type, turnstileToken, verificationToken })
      })
      const data = await res.json()
      if (data.success) { setStatus('done'); setRef(data.ref) }
      else {
        setStatus('error')
        if (data.error === 'email_not_verified') {
          resetEmailVerification()
        }
        if (window.turnstile && widgetIdRef.current) window.turnstile.reset(widgetIdRef.current)
        setTurnstileToken('')
      }
    } catch { setStatus('error') }
  }

  const inp: React.CSSProperties = { width: '100%', border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: '10px 13px', fontSize: 14, color: NAVY, fontFamily: 'Segoe UI,system-ui,sans-serif', outline: 'none', background: '#fff' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase' as const, letterSpacing: '.4px', display: 'block', marginBottom: 4 }

  return (
    <div style={{ fontFamily: 'Segoe UI,system-ui,sans-serif', background: '#f4fafd', minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{ background: NAVY, padding: '14px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="32" height="30" viewBox="0 0 52 50" fill="none"><defs><linearGradient id="sw" x1="10" y1="38" x2="44" y2="6" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#00c8c8"/><stop offset="100%" stopColor="#00b4d8"/></linearGradient></defs><path d="M12 38 Q16 18 44 8" stroke="url(#sw)" strokeWidth="4.5" strokeLinecap="round" fill="none"/><circle cx="14" cy="34" r="5" fill="#00c8c8"/><line x1="14" y1="34" x2="3" y2="40" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round"/><line x1="14" y1="34" x2="2" y2="32" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round"/><line x1="14" y1="34" x2="4" y2="24" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round"/></svg>
          <div><span style={{ color: '#00b4d8', fontSize: 18, fontWeight: 700 }}>go</span><span style={{ color: TEAL, fontSize: 18, fontWeight: 700 }}>live</span><span style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, marginLeft: 8 }}>Cloud Marketplace</span></div>
        </a>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a href="/" style={{ color: 'rgba(255,255,255,.7)', textDecoration: 'none', fontSize: 13 }}>Home</a>
          <a href="/portal/login" style={{ background: CY, color: '#fff', textDecoration: 'none', padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600 }}>Portal login</a>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #0a3a5c 100%)`, padding: '64px 48px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12 }}>Microsoft CSP Partner ID: 6787357</div>
        <h1 style={{ color: '#fff', fontSize: 40, fontWeight: 800, margin: '0 0 16px', lineHeight: 1.2 }}>
          Switch to GoLive —<br /><span style={{ color: TEAL }}>No Downtime. No Data Loss.</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 17, maxWidth: 580, margin: '0 auto 32px', lineHeight: 1.7 }}>
          Whether you're on Microsoft 365 with another provider, Google Workspace, or cPanel email — switching to GoLive is fast, free and fully managed by our team.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          {(['csp', 'google', 'cpanel'] as TransferType[]).map(t => (
            <button key={t} onClick={() => { setType(t); document.getElementById('transfer-form')?.scrollIntoView({ behavior: 'smooth' }) }}
              style={{ background: type === t ? CY : 'rgba(255,255,255,.1)', color: '#fff', border: `1.5px solid ${type === t ? CY : 'rgba(255,255,255,.2)'}`, borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7 }}>
              {TRANSFER_TYPES[t].icon} {TRANSFER_TYPES[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* TRUST BAR */}
      <div style={{ background: '#fff', borderBottom: `1.5px solid ${BORDER}`, padding: '14px 48px', display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
        {[['✓', 'No downtime during transfer'], ['✓', 'All emails preserved'], ['✓', 'Same Microsoft 365 licenses'], ['✓', 'Free migration assessment'], ['✓', 'Authorized Microsoft CSP']].map(([icon, text]) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: NAVY, fontWeight: 500 }}>
            <span style={{ color: TEAL, fontWeight: 700 }}>{icon}</span> {text}
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>

        {/* TRANSFER TYPE TABS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 40 }}>
          {(['csp', 'google', 'cpanel'] as TransferType[]).map(t => {
            const tc = TRANSFER_TYPES[t]
            return (
              <button key={t} onClick={() => setType(t)}
                style={{ background: type === t ? '#fff' : '#f4fafd', border: `2px solid ${type === t ? CY : BORDER}`, borderRadius: 12, padding: '20px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all .2s' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{tc.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 6 }}>{tc.title}</div>
                <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>{tc.desc}</div>
              </button>
            )
          })}
        </div>

        {/* PROCESS STEPS */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: NAVY, marginBottom: 20, textAlign: 'center' }}>How the {TRANSFER_TYPES[type].label} process works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {PROCESS_STEPS[type].map((s, i) => (
              <div key={i} style={{ background: '#fff', border: `1.5px solid ${BORDER}`, borderRadius: 10, padding: '20px', position: 'relative' }}>
                <div style={{ width: 36, height: 36, background: CY, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 12 }}>{s.step}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>{s.desc}</div>
                {i < 3 && <div style={{ position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', color: BORDER, fontSize: 20, fontWeight: 700 }}>›</div>}
              </div>
            ))}
          </div>
        </div>

        {/* PRICING */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: NAVY, marginBottom: 6, textAlign: 'center' }}>Transparent pricing — no hidden fees</h2>
          <p style={{ textAlign: 'center', color: MUTED, fontSize: 14, marginBottom: 24 }}>Setup and migration included in all packages. Annual plans include 2 months free.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {PRICING.map(pkg => (
              <div key={pkg.name} style={{ background: pkg.popular ? NAVY : '#fff', border: `2px solid ${pkg.popular ? NAVY : BORDER}`, borderRadius: 12, padding: '24px', position: 'relative' }}>
                {pkg.popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: TEAL, color: NAVY, fontSize: 10, fontWeight: 700, padding: '3px 14px', borderRadius: 20 }}>MOST POPULAR</div>}
                <div style={{ fontSize: 14, fontWeight: 700, color: pkg.popular ? 'rgba(255,255,255,.7)' : MUTED, marginBottom: 6 }}>{pkg.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: pkg.popular ? '#fff' : pkg.color }}>{pkg.price}</span>
                  {pkg.price !== 'Custom' && <span style={{ fontSize: 13, color: pkg.popular ? 'rgba(255,255,255,.6)' : MUTED }}>/{pkg.per}</span>}
                </div>
                <div style={{ fontSize: 11, color: pkg.popular ? 'rgba(255,255,255,.5)' : MUTED, marginBottom: 16 }}>Best for: {pkg.best}</div>
                {pkg.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, fontSize: 12, color: pkg.popular ? 'rgba(255,255,255,.8)' : '#333' }}>
                    <span style={{ color: TEAL, fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                  </div>
                ))}
                <button onClick={() => document.getElementById('transfer-form')?.scrollIntoView({ behavior: 'smooth' })}
                  style={{ width: '100%', marginTop: 16, background: pkg.popular ? CY : 'transparent', color: pkg.popular ? '#fff' : CY, border: `2px solid ${CY}`, borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Get started →
                </button>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', color: MUTED, fontSize: 12, marginTop: 12 }}>* One-time setup fee applies: $150 (Starter) · $300 (Secure Business) · Custom (Enterprise). Includes full migration.</p>
        </div>

        {/* TRANSFER FORM */}
        <div id="transfer-form" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 24, alignItems: 'start' }}>
          
          {/* WHY SWITCH */}
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: NAVY, marginBottom: 20 }}>Why African businesses switch to GoLive</h2>
            {[
              { icon: '💰', title: 'Local support at African prices', desc: 'GoLive is based in Lagos. We understand African business needs, time zones and billing requirements — including Naira, Cedi, Shilling and Rand pricing.' },
              { icon: '🔒', title: 'Enterprise security included', desc: 'Every GoLive client gets MFA, SPF, DKIM, DMARC and anti-phishing configured as standard. Most resellers charge extra for this.' },
              { icon: '📞', title: 'Real support that responds', desc: 'WhatsApp support, same-day responses, and a dedicated GoLive advisor who knows your setup. No anonymous helpdesk tickets.' },
              { icon: '🚀', title: 'We handle everything', desc: 'The migration, the DNS changes, the user training, the security setup — all handled by GoLive. Your team just shows up on day one.' },
              { icon: '✅', title: 'Authorized Microsoft CSP', desc: 'GoLive is a verified Microsoft Indirect Reseller (Partner ID: 6787357). Your licenses are legitimate and backed by Microsoft.' },
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* FORM */}
          <div style={{ background: '#fff', border: `2px solid ${BORDER}`, borderRadius: 14, padding: 24, position: 'sticky', top: 20 }}>
            <div style={{ background: CY, borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{TRANSFER_TYPES[type].icon}</span>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{TRANSFER_TYPES[type].label} Request</div>
                <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 11 }}>Free assessment — response within 4 hours</div>
              </div>
            </div>

            {status === 'done' ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Transfer request received!</div>
                <div style={{ fontSize: 13, color: MUTED, marginBottom: 16, lineHeight: 1.6 }}>Your reference is <strong style={{ color: CY }}>{ref}</strong>. A GoLive advisor will contact you within 4 hours to discuss next steps.</div>
                <a href={`https://wa.me/${WA}?text=Hi GoLive, I just submitted a transfer request. My ref is ${ref}`}
                  style={{ display: 'inline-block', background: '#25d366', color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                  💬 Chat on WhatsApp
                </a>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div><label style={lbl}>Company *</label><input style={inp} required placeholder="Company name" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} /></div>
                  <div><label style={lbl}>Contact name *</label><input style={inp} required placeholder="Your name" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} /></div>
                  <div>
                    <label style={lbl}>Email *</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input style={{ ...inp, background: emailVerified ? '#f0fdf4' : '#fff', borderColor: emailVerified ? '#86efac' : BORDER }} required type="email" placeholder="you@company.com" disabled={emailVerified}
                        value={form.email} onChange={e => { setForm(f => ({ ...f, email: e.target.value })); resetEmailVerification() }} />
                      {!emailVerified && (
                        <button type="button" onClick={handleSendOtp} disabled={sendingOtp || otpCooldown > 0 || !isValidEmail(form.email) || !emailTurnstileToken}
                          style={{ flexShrink: 0, whiteSpace: 'nowrap', background: CY, color: '#fff', border: 'none', borderRadius: 6, padding: '0 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: (sendingOtp || otpCooldown > 0 || !isValidEmail(form.email) || !emailTurnstileToken) ? 0.5 : 1 }}>
                          {sendingOtp ? 'Sending...' : otpCooldown > 0 ? `Resend (${otpCooldown}s)` : otpSent ? 'Resend' : 'Verify'}
                        </button>
                      )}
                    </div>
                    {!emailVerified && (
                      <div style={{ marginTop: 6 }}>
                        <div ref={emailWidgetRef} />
                      </div>
                    )}
                    {emailVerified && (
                      <p style={{ marginTop: 4, fontSize: 11, fontWeight: 600, color: '#16a34a' }}>✓ Email verified</p>
                    )}
                    {otpSent && !emailVerified && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <input type="text" inputMode="numeric" maxLength={6} placeholder="6-digit code" value={otpCode}
                          onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          style={{ ...inp, width: 110, letterSpacing: 4, textAlign: 'center' }} />
                        <button type="button" onClick={handleVerifyOtp} disabled={verifyingOtp || otpCode.length !== 6}
                          style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 6, padding: '0 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: (verifyingOtp || otpCode.length !== 6) ? 0.5 : 1 }}>
                          {verifyingOtp ? 'Checking...' : 'Confirm'}
                        </button>
                      </div>
                    )}
                    {otpError && <p style={{ marginTop: 4, fontSize: 11, color: '#dc2626' }}>{otpError}</p>}
                  </div>
                  <div><label style={lbl}>WhatsApp / Phone</label><input style={inp} placeholder="+234..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={lbl}>{type === 'csp' ? 'Microsoft tenant domain *' : type === 'google' ? 'Google Workspace domain *' : 'Your domain / website *'}</label>
                  <input style={inp} required placeholder={type === 'csp' ? 'yourcompany.onmicrosoft.com or yourcompany.com' : 'yourcompany.com'} value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={lbl}>Number of users *</label>
                    <select style={inp} required value={form.users} onChange={e => setForm(f => ({ ...f, users: e.target.value }))}>
                      <option value="">Select range</option>
                      {['1–5', '6–10', '11–20', '21–50', '51–100', '100+'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Country</label>
                    <select style={inp} value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}>
                      {['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Rwanda', 'Uganda', 'Other'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                {type === 'csp' && (
                  <div style={{ marginBottom: 10 }}>
                    <label style={lbl}>Current Microsoft CSP / reseller</label>
                    <input style={inp} placeholder="Who is your current provider?" value={form.currentProvider} onChange={e => setForm(f => ({ ...f, currentProvider: e.target.value }))} />
                  </div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>Anything else we should know?</label>
                  <textarea style={{ ...inp, minHeight: 70, resize: 'none' }} placeholder="Special requirements, timeline, concerns..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <div ref={widgetRef} />
                </div>
                {status === 'error' && <div style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 7, padding: '10px 12px', fontSize: 12, marginBottom: 12 }}>{!turnstileToken ? 'Please complete the security check above.' : 'Something went wrong. Please try again or WhatsApp us directly.'}</div>}
                <button type="submit" disabled={status === 'sending' || !turnstileToken || !emailVerified}
                  style={{ width: '100%', background: (status === 'sending' || !turnstileToken || !emailVerified) ? MUTED : CY, color: '#fff', border: 'none', borderRadius: 8, padding: '13px', fontSize: 14, fontWeight: 700, cursor: (status === 'sending' || !turnstileToken || !emailVerified) ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {status === 'sending' ? 'Submitting...' : !emailVerified ? 'Verify your email to continue' : `Submit ${TRANSFER_TYPES[type].label} Request →`}
                </button>
                <p style={{ textAlign: 'center', fontSize: 11, color: MUTED, marginTop: 10 }}>No commitment required. Free assessment call included.</p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background: NAVY, padding: '32px 48px', textAlign: 'center', marginTop: 48 }}>
        <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 12 }}>
          The GoLive Digital Solutions Company Ltd. · RC1644767 · Lagos, Nigeria<br />
           contact@golivecompany.com · +234 808 358 7801
        </div>
      </div>

      {/* WhatsApp FAB */}
      <a href={`https://wa.me/${WA}?text=Hi GoLive, I want to migrate to Microsoft 365`} target="_blank" rel="noopener noreferrer"
        style={{ position: 'fixed', bottom: 24, right: 24, background: '#25d366', borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,.2)', zIndex: 100, textDecoration: 'none' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
    </div>
  )
}
