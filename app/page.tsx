'use client'

import { useState } from 'react'

const CY = '#0096c7'
const TEAL = '#00c8c8'
const NAVY = '#0d2233'
const LIGHT = '#e8f4fb'
const BORDER = '#c8e6f0'
const MUTED = '#5a7a8a'

const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER || '2348083587801'

function GoLiveLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 50" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="sw" x1="10" y1="38" x2="44" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00c8c8" />
          <stop offset="100%" stopColor="#00b4d8" />
        </linearGradient>
        <radialGradient id="dot" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00c8c8" />
          <stop offset="80%" stopColor="#00b4d8" />
        </radialGradient>
      </defs>
      <path d="M12 38 Q16 18 44 8" stroke="url(#sw)" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <circle cx="14" cy="34" r="5" fill="url(#dot)" />
      <line x1="14" y1="34" x2="3" y2="40" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="14" y1="34" x2="2" y2="32" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="14" y1="34" x2="4" y2="24" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="14" y1="34" x2="7" y2="43" stroke="#00c8c8" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

const PILLARS = [
  { icon: '✉', name: 'Microsoft 365', desc: 'Email, Teams, OneDrive, SharePoint, and the full Office suite.', tags: ['Basic', 'Premium', 'Exchange'] },
  { icon: '🤖', name: 'Microsoft Copilot', desc: 'AI readiness audit, Copilot licensing, prompt training and adoption planning.', tags: ['AI Audit', 'Training', 'Adoption'] },
  { icon: '☁', name: 'Azure Cloud', desc: 'Virtual machines, Azure backup, SQL, app hosting and disaster recovery.', tags: ['VMs', 'Backup', 'Storage'] },
  { icon: '🔒', name: 'Microsoft Defender', desc: 'Endpoint protection, MFA, anti-phishing, DMARC/DKIM and security training.', tags: ['Defender', 'MFA', 'DMARC'] },
  { icon: '⚡', name: 'Power Platform', desc: 'Power Apps, Power Automate, Power BI, SharePoint workflows and approvals.', tags: ['Apps', 'Automate', 'BI'] },
]

const PACKAGES = [
  {
    id: 'starter',
    icon: '✉',
    name: 'Starter Cloud Office',
    target: 'Small business · 1–10 users',
    price: 'From $6',
    priceNote: '/user/month + setup fee',
    featured: false,
    includes: ['Microsoft 365 Business Basic', 'Professional domain email', 'Teams, OneDrive & SharePoint', 'DNS & mailbox setup', 'SPF / DKIM / DMARC', '30-day onboarding support'],
  },
  {
    id: 'secure',
    icon: '🔒',
    name: 'Secure Business Cloud',
    target: 'Serious SME · 10–50 users',
    price: 'From $22',
    priceNote: '/user/month + setup fee',
    featured: true,
    includes: ['Microsoft 365 Business Premium', 'Microsoft Defender for Business', 'MFA & Conditional Access', 'SharePoint document library', 'Email security hardening', 'Security awareness training', 'Monthly managed support'],
  },
  {
    id: 'ai',
    icon: '🤖',
    name: 'AI-Ready Enterprise Lite',
    target: 'Growing firms · 25+ users',
    price: 'Custom quote',
    priceNote: 'Tailored to your organisation',
    featured: false,
    includes: ['Microsoft 365 + Copilot pilot', 'Copilot Readiness Audit', 'SharePoint structure cleanup', 'Prompt engineering training', 'Power Automate workflows', 'Power BI reporting setup', 'Premium managed support'],
  },
]

const VERTICALS = [
  { icon: '⚖', name: 'Legal Workspace', sub: 'Law firms', items: ['Secure client folders', 'SharePoint document library', 'MFA & Defender', 'Teams client meetings'] },
  { icon: '🏫', name: 'Cloud for Schools', sub: 'Education', items: ['Staff & teacher email', 'Teams classrooms', 'OneDrive storage', 'Admin training'] },
  { icon: '✝', name: 'Ministry Cloud', sub: 'Churches', items: ['Staff & volunteer email', 'Teams coordination', 'Media archive', 'Donation tracking'] },
  { icon: '🏥', name: 'Secure Clinic Cloud', sub: 'Healthcare', items: ['Secure staff email', 'Defender & MFA', 'Device protection', 'Cloud backup'] },
  { icon: '⚡', name: 'Business Automation', sub: 'Operations', items: ['Power Apps forms', 'Approval workflows', 'Power BI dashboards', 'Inventory automation'] },
]

const MARKETS = [
  { flag: '🇳🇬', name: 'Nigeria', badge: 'Active · Priority 1', badgeStyle: { background: '#e0f7f4', color: '#006655' }, desc: 'Primary market. Largest SME base in Africa. Billing in NGN.' },
  { flag: '🇬🇭', name: 'Ghana', badge: 'Active · Priority 2', badgeStyle: { background: '#e0f7f4', color: '#006655' }, desc: 'English-speaking, fast-growing cloud market. Billing in GHS.' },
  { flag: '🇰🇪', name: 'Kenya', badge: 'Expanding', badgeStyle: { background: '#dbeafe', color: '#1e40af' }, desc: 'Strong tech and startup ecosystem. Billing in KES.' },
  { flag: '🇿🇦', name: 'South Africa', badge: 'Expanding', badgeStyle: { background: '#dbeafe', color: '#1e40af' }, desc: 'Mature Microsoft ecosystem. Billing in ZAR.' },
  { flag: '🇷🇼', name: 'Rwanda', badge: 'Coming soon', badgeStyle: { background: '#f3f4f6', color: '#4b5563' }, desc: 'Rapidly digitalizing economy.' },
  { flag: '🇺🇬', name: 'Uganda', badge: 'Coming soon', badgeStyle: { background: '#f3f4f6', color: '#4b5563' }, desc: 'Growing SME demand for cloud tools.' },
  { flag: '🇸🇳', name: 'Senegal', badge: 'Coming soon', badgeStyle: { background: '#f3f4f6', color: '#4b5563' }, desc: 'Francophone West Africa hub.' },
  { flag: '🇨🇲', name: 'Cameroon', badge: 'Coming soon', badgeStyle: { background: '#f3f4f6', color: '#4b5563' }, desc: 'Bilingual market, growing SME base.' },
]

interface FormData {
  company: string; contact: string; email: string; phone: string
  country: string; industry: string; users: string; currentEmail: string
  domain: string; notes: string; billing: string; services: string[]
}

const INITIAL_FORM: FormData = {
  company: '', contact: '', email: '', phone: '',
  country: 'Nigeria', industry: 'General SME', users: '1–5', currentEmail: 'cPanel / Webmail',
  domain: '', notes: '', billing: 'Monthly', services: [],
}

function AssessmentForm({ compact = false }: { compact?: boolean }) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [ref, setRef] = useState('')
  const [error, setError] = useState('')

  const toggleService = (s: string) =>
    setForm(f => ({ ...f, services: f.services.includes(s) ? f.services.filter(x => x !== s) : [...f.services, s] }))

  const submit = async () => {
    if (!form.company || !form.contact || !form.email || !form.phone) {
      setError('Please fill in company name, your name, email and WhatsApp number.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (data.success) setRef(data.ref)
      else setError(data.error || 'Something went wrong. Please try again.')
    } catch {
      setError('Network error. Please check your connection and try again.')
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = { border: `1.5px solid ${BORDER}`, borderRadius: 7, padding: '8px 10px', fontSize: 12, color: NAVY, background: '#fff', outline: 'none', width: '100%', fontFamily: 'inherit' }
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 3 }

  if (ref) return (
    <div style={{ textAlign: 'center', padding: '28px 16px' }}>
      <div style={{ fontSize: 40, color: TEAL, marginBottom: 10 }}>✓</div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Assessment submitted!</h3>
      <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.7, marginBottom: 12 }}>
        Your request has been logged. A GoLive cloud advisor will contact you within <strong>24 hours</strong> with a custom plan and local-currency pricing.
      </p>
      <div style={{ display: 'inline-block', background: LIGHT, color: CY, padding: '5px 16px', borderRadius: 20, fontSize: 11, fontWeight: 700, marginBottom: 14 }}>{ref}</div>
      <br />
      <a href={`https://wa.me/${WA_NUMBER}?text=Hi GoLive, my ref is ${ref}`} target="_blank" rel="noopener noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#25d366', color: '#fff', padding: '9px 18px', borderRadius: 7, fontSize: 12, fontWeight: 700, textDecoration: 'none', marginTop: 6 }}>
        💬 WhatsApp us now
      </a>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={lbl}>Company name *</label><input style={inp} placeholder="Your company" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} /></div>
        <div><label style={lbl}>Your name *</label><input style={inp} placeholder="Full name" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} /></div>
        <div><label style={lbl}>Email *</label><input style={inp} type="email" placeholder="name@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
        <div><label style={lbl}>WhatsApp *</label><input style={inp} placeholder="+234 800 000 0000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
        <div><label style={lbl}>Country</label><select style={inp} value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}>
          {['Nigeria','Ghana','Kenya','South Africa','Rwanda','Uganda','Tanzania','Cameroon','Senegal','Other'].map(c => <option key={c}>{c}</option>)}
        </select></div>
        <div><label style={lbl}>Staff count</label><select style={inp} value={form.users} onChange={e => setForm(f => ({ ...f, users: e.target.value }))}>
          {['1–5','6–20','21–50','51–100','100+'].map(u => <option key={u}>{u}</option>)}
        </select></div>
      </div>

      {!compact && <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><label style={lbl}>Industry</label><select style={inp} value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}>
            {['General SME','Law firm','School / University','Church / Ministry','Clinic / Healthcare','NGO / Non-profit','Real estate','Logistics','Consulting','Financial services','Startup / Tech','Other'].map(i => <option key={i}>{i}</option>)}
          </select></div>
          <div><label style={lbl}>Current email</label><select style={inp} value={form.currentEmail} onChange={e => setForm(f => ({ ...f, currentEmail: e.target.value }))}>
            {['cPanel / Webmail','Gmail / Google Workspace','Zoho Mail','Yahoo Mail','No business email yet','Microsoft 365 already','Other'].map(e => <option key={e}>{e}</option>)}
          </select></div>
        </div>
        <div><label style={lbl}>Business domain</label><input style={inp} placeholder="yourcompany.com" value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} /></div>
        <div><label style={lbl}>Notes / pain points</label><textarea style={{ ...inp, minHeight: 60, resize: 'none' }} placeholder="Email issues, security concerns, cloud migration needs..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
      </>}

      <div>
        <label style={lbl}>Services interested in</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          {['Microsoft 365 & email','Copilot / AI tools','Azure cloud & backup','Defender security','Power Platform','Teams & SharePoint'].map(s => (
            <label key={s} onClick={() => toggleService(s)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '6px 9px', border: `1.5px solid ${form.services.includes(s) ? CY : BORDER}`, borderRadius: 6, cursor: 'pointer', background: form.services.includes(s) ? LIGHT : '#fff', color: NAVY }}>
              <input type="checkbox" readOnly checked={form.services.includes(s)} style={{ accentColor: CY, width: 13, height: 13 }} /> {s}
            </label>
          ))}
        </div>
      </div>

      {error && <p style={{ fontSize: 11, color: '#dc2626', background: '#fee2e2', padding: '8px 11px', borderRadius: 6 }}>{error}</p>}

      <button onClick={submit} disabled={loading}
        style={{ width: '100%', background: loading ? MUTED : CY, color: '#fff', border: 'none', borderRadius: 8, padding: '11px', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
        {loading ? 'Sending...' : '📤 Send my free assessment request'}
      </button>
      <p style={{ fontSize: 10, color: MUTED, textAlign: 'center' }}>GoLive Digital Solutions · Authorized Microsoft CSP · We never share your details.</p>
    </div>
  )
}

export default function Home() {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  const openWA = () => window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hello GoLive! I am interested in Microsoft cloud services.')}`, '_blank')

  return (
    <>
      {/* NAV */}
      <nav style={{ background: NAVY, position: 'sticky', top: 0, zIndex: 100, borderBottom: '2px solid rgba(0,180,216,.25)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <GoLiveLogo size={36} />
            <div>
              <div><span style={{ color: '#00b4d8', fontSize: 16, fontWeight: 700 }}>go</span><span style={{ color: TEAL, fontSize: 16, fontWeight: 700 }}>live</span></div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', letterSpacing: '.3px' }}>cloud.golivecompany.com</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {['pillars','packages','verticals','how','markets'].map(id => (
              <button key={id} onClick={() => scrollTo(id)} style={{ color: 'rgba(255,255,255,.65)', fontSize: 11, fontWeight: 500, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={() => scrollTo('assess')} style={{ background: CY, color: '#fff', fontSize: 11, fontWeight: 700, padding: '7px 16px', borderRadius: 7, cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}>
            Get free assessment
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: NAVY, padding: '56px 24px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 48, alignItems: 'start' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,180,216,.14)', border: '1px solid rgba(0,180,216,.28)', color: '#00b4d8', fontSize: 10, fontWeight: 700, padding: '4px 11px', borderRadius: 20, marginBottom: 18, letterSpacing: '.3px' }}>
              <span style={{ width: 5, height: 5, background: TEAL, borderRadius: '50%', display: 'inline-block' }} /> Africa-authorized Microsoft CSP partner
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1.18, marginBottom: 14, letterSpacing: '-.4px' }}>
              GoLive Cloud Marketplace<br />
              <span style={{ color: '#00b4d8' }}>Microsoft 365, Copilot,</span><br />
              <span style={{ color: TEAL }}>Azure & Defender</span>
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', marginBottom: 22, lineHeight: 1.7, maxWidth: 440 }}>
              Microsoft 365, Copilot, Azure, Defender, domains, hosting, and managed cloud services for African businesses. Professional setup, migration, security, training and monthly support — all in one place.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 30 }}>
              {['✉ Business email','🤖 Copilot AI','🔒 Defender security','☁ Azure cloud','⚡ Power Platform','🎧 Managed support'].map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.11)', color: 'rgba(255,255,255,.78)', fontSize: 10, fontWeight: 500, padding: '4px 10px', borderRadius: 20 }}>{p}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,.09)' }}>
              {[['5','Microsoft cloud pillars'],['6+','African markets served'],['24h','Setup turnaround']].map(([val, lbl]) => (
                <div key={lbl}><div style={{ fontSize: 24, fontWeight: 700, color: '#00b4d8' }}>{val}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>{lbl}</div></div>
              ))}
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: '14px 14px 0 0', padding: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: LIGHT, color: CY, fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 20, marginBottom: 12, border: `1px solid ${BORDER}` }}>✦ Free · No commitment</div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Get your free Microsoft Cloud assessment</h2>
            <p style={{ fontSize: 11, color: MUTED, marginBottom: 16 }}>Tell us about your business — we&apos;ll build a custom plan in 24 hours.</p>
            <AssessmentForm compact />
          </div>
        </div>
      </section>

      {/* WAVE */}
      <div style={{ background: NAVY, lineHeight: 0 }}>
        <svg viewBox="0 0 1440 40" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 40 }}>
          <path d="M0,40 L0,14 Q360,40 720,20 Q1080,0 1440,28 L1440,40 Z" fill="#f4fafd" />
        </svg>
      </div>

      {/* PILLARS */}
      <section id="pillars" style={{ background: '#f4fafd', padding: '56px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: CY, textTransform: 'uppercase', letterSpacing: '1.1px', marginBottom: 6 }}>5 Microsoft cloud pillars</div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Everything your business needs</h2>
          <p style={{ fontSize: 13, color: MUTED, maxWidth: 520, marginBottom: 32 }}>GoLive delivers Microsoft cloud services built for African businesses — email, AI, security, automation, and cloud infrastructure.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 13 }}>
            {PILLARS.map(p => (
              <div key={p.name} style={{ background: '#fff', border: `1.5px solid ${BORDER}`, borderRadius: 11, padding: '16px 13px', borderTop: `3px solid ${CY}` }}>
                <div style={{ width: 36, height: 36, background: LIGHT, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, fontSize: 18 }}>{p.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 5 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: MUTED, lineHeight: 1.55, marginBottom: 9 }}>{p.desc}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {p.tags.map(t => <span key={t} style={{ fontSize: 8, fontWeight: 600, background: LIGHT, color: CY, padding: '2px 6px', borderRadius: 9, border: `1px solid ${BORDER}` }}>{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PACKAGES */}
      <section id="packages" style={{ background: '#fff', padding: '56px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: CY, textTransform: 'uppercase', letterSpacing: '1.1px', marginBottom: 6 }}>Simple, clear packages</div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Pick the right plan</h2>
          <p style={{ fontSize: 13, color: MUTED, maxWidth: 540, marginBottom: 32 }}>All plans include GoLive setup, migration, training, and support. License pricing confirmed in local currency after your free assessment.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
            {PACKAGES.map(pkg => (
              <div key={pkg.id} style={{ border: `2px solid ${pkg.featured ? CY : BORDER}`, borderRadius: 14, padding: 24, position: 'relative', background: pkg.featured ? '#f4fafd' : '#fff' }}>
                {pkg.featured && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: CY, color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>Most popular</div>}
                <div style={{ width: 38, height: 38, background: LIGHT, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 11, fontSize: 20 }}>{pkg.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 3 }}>{pkg.name}</div>
                <div style={{ fontSize: 10, color: MUTED, marginBottom: 11, fontStyle: 'italic' }}>{pkg.target}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: CY }}>{pkg.price}</div>
                <div style={{ fontSize: 10, color: MUTED, marginBottom: 14 }}>{pkg.priceNote}</div>
                <div style={{ height: 1, background: BORDER, margin: '12px 0' }} />
                <ul style={{ listStyle: 'none' }}>
                  {pkg.includes.map(item => (
                    <li key={item} style={{ fontSize: 11, color: NAVY, padding: '3px 0', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <span style={{ color: TEAL, fontWeight: 700, fontSize: 10, marginTop: 1, flexShrink: 0 }}>✓</span>{item}
                    </li>
                  ))}
                </ul>
                <button onClick={() => scrollTo('assess')} style={{ width: '100%', marginTop: 16, padding: 10, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: pkg.featured ? CY : 'transparent', color: pkg.featured ? '#fff' : CY, border: `2px solid ${CY}` }}>
                  {pkg.id === 'ai' ? 'Request quote' : 'Get started'}
                </button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, background: '#f4fafd', border: `1.5px solid ${BORDER}`, borderRadius: 9, padding: '11px 15px', fontSize: 11, color: MUTED, display: 'flex', alignItems: 'center', gap: 8 }}>
            ℹ Pricing shown in USD (indicative). Final invoicing in NGN, GHS, KES, ZAR confirmed after your free assessment. Annual billing saves ~17%.
          </div>
        </div>
      </section>

      {/* VERTICALS */}
      <section id="verticals" style={{ background: NAVY, padding: '56px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '1.1px', marginBottom: 6 }}>Built for every industry</div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Sector-specific packages</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', maxWidth: 520, marginBottom: 32 }}>Tailored offers for the industries that matter most across Africa.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 11 }}>
            {VERTICALS.map(v => (
              <div key={v.name} onClick={() => scrollTo('assess')} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 11, padding: '18px 14px', cursor: 'pointer' }}>
                <div style={{ width: 36, height: 36, background: 'rgba(0,180,216,.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, fontSize: 18 }}>{v.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{v.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', marginBottom: 9 }}>{v.sub}</div>
                <ul style={{ listStyle: 'none' }}>
                  {v.items.map(i => <li key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', padding: '2px 0', display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: TEAL }}>·</span>{i}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ background: '#f4fafd', padding: '56px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: CY, textTransform: 'uppercase', letterSpacing: '1.1px', marginBottom: 6 }}>How it works</div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Live in days, not months</h2>
          <p style={{ fontSize: 13, color: MUTED, marginBottom: 36 }}>GoLive handles everything. You stay focused on running your business.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 27, left: '12%', right: '12%', height: 2, background: BORDER }} />
            {[['1','Free assessment','Fill in our quick form. A GoLive advisor builds your custom Microsoft cloud plan.',false],['2','Custom proposal','We send clear pricing in your local currency with a migration timeline.',false],['3','Setup & migration','GoLive configures your M365, migrates email, sets up security, onboards your team.',true],['4','Ongoing support','Monthly managed support, renewals and a direct line to your GoLive advisor.',true]].map(([n, title, desc, done]) => (
              <div key={n as string} style={{ textAlign: 'center', padding: '0 14px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: 54, height: 54, background: done ? TEAL : CY, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 18, fontWeight: 700, color: '#fff', border: '3px solid #f4fafd', boxShadow: `0 0 0 2px ${done ? TEAL : CY}` }}>{n}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 6 }}>{title as string}</div>
                <div style={{ fontSize: 10, color: MUTED, lineHeight: 1.6 }}>{desc as string}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARKETS */}
      <section id="markets" style={{ background: '#fff', padding: '56px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: CY, textTransform: 'uppercase', letterSpacing: '1.1px', marginBottom: 6 }}>Africa-authorized</div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Countries we serve</h2>
          <p style={{ fontSize: 13, color: MUTED, maxWidth: 520, marginBottom: 32 }}>GoLive is an authorized Microsoft CSP for Africa with local-currency billing across these markets.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 13 }}>
            {MARKETS.map(m => (
              <div key={m.name} style={{ background: '#fff', border: `1.5px solid ${BORDER}`, borderRadius: 11, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 26, marginBottom: 7 }}>{m.flag}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 3 }}>{m.name}</div>
                <div style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10, marginBottom: 7, ...m.badgeStyle }}>{m.badge}</div>
                <div style={{ fontSize: 10, color: MUTED, lineHeight: 1.5 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FULL ASSESSMENT */}
      <section id="assess" style={{ background: NAVY, padding: '60px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 480px', gap: 52, alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '1.1px', marginBottom: 6 }}>Free Microsoft Cloud assessment</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Ready to move to Microsoft cloud?</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', marginBottom: 22 }}>Get a custom plan with local-currency pricing within 24 hours — no cost, no commitment.</p>
            <ul style={{ listStyle: 'none' }}>
              {['No cost, no commitment — 100% free','Custom pricing in NGN, GHS, KES, ZAR','Full email migration included','SPF, DKIM, DMARC configured for you','Microsoft 365 tenant setup within 24 hours','Dedicated GoLive advisor on your account'].map(b => (
                <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12, color: 'rgba(255,255,255,.72)', marginBottom: 10 }}>
                  <span style={{ fontSize: 14, color: TEAL, flexShrink: 0, marginTop: 1 }}>✓</span>{b}
                </li>
              ))}
            </ul>
            <button onClick={openWA} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#25d366', color: '#fff', fontSize: 12, fontWeight: 700, padding: '10px 20px', borderRadius: 8, cursor: 'pointer', border: 'none', fontFamily: 'inherit', marginTop: 20 }}>
              💬 Chat on WhatsApp
            </button>
          </div>
          <div style={{ background: '#fff', borderRadius: 13, padding: 26 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Microsoft Cloud Readiness Check</h3>
            <p style={{ fontSize: 10, color: MUTED, marginBottom: 16 }}>Takes 2 minutes. Your GoLive advisor responds within 24 hours.</p>
            <AssessmentForm />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0a1a27', borderTop: '1px solid rgba(255,255,255,.07)', padding: '44px 24px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 28, marginBottom: 32 }}>
            <div>
              <div style={{ marginBottom: 4 }}><span style={{ color: '#00b4d8', fontSize: 17, fontWeight: 700 }}>go</span><span style={{ color: TEAL, fontSize: 17, fontWeight: 700 }}>live</span></div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>Digital Solutions Company</div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', margin: '10px 0 14px', lineHeight: 1.65, maxWidth: 220 }}>Africa-authorized Microsoft Cloud Solution Provider. Microsoft AI Cloud Partner Program member.</p>
              {[['🌐 cloud.golivecompany.com','https://cloud.golivecompany.com'],['🌐 golivenaija.com','https://golivenaija.com'],['💬 WhatsApp: +234 808 358 7801',`https://wa.me/${WA_NUMBER}`],['📞 +234 808 358 7801','tel:+2348083587801']].map(([label, href]) => (
                <a key={label as string} href={href as string} style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,.45)', textDecoration: 'none', marginBottom: 5 }}>{label}</a>
              ))}
            </div>
            {[['Microsoft services',['Microsoft 365 Business','Copilot & AI','Azure Cloud','Microsoft Defender','Power Platform','Teams & SharePoint']],['Industry packages',['Legal Workspace','Cloud for Schools','Ministry Cloud','Secure Clinic Cloud','Business Automation','SME Email Migration']],['Company',['About GoLive','golivecompany.com','golivenaija.com','Portal login','Terms of service','Privacy policy']]].map(([title, links]) => (
              <div key={title as string}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.28)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>{title}</div>
                {(links as string[]).map(l => <div key={l} style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginBottom: 6 }}>{l}</div>)}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.25)' }}>© 2026 GoLive Digital Solutions Company Ltd. All rights reserved. Prices exclude VAT.</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', padding: '5px 10px', borderRadius: 7 }}>
              <svg width="16" height="16" viewBox="0 0 23 23" fill="none"><rect x="1" y="1" width="10" height="10" fill="#f25022"/><rect x="12" y="1" width="10" height="10" fill="#7fba00"/><rect x="1" y="12" width="10" height="10" fill="#00a4ef"/><rect x="12" y="12" width="10" height="10" fill="#ffb900"/></svg>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', fontWeight: 500 }}>Authorized Microsoft CSP · Africa</span>
            </div>
          </div>
        </div>
      </footer>

      {/* WHATSAPP FAB */}
      <button onClick={openWA} aria-label="Chat on WhatsApp" style={{ position: 'fixed', bottom: 24, right: 24, width: 52, height: 52, background: '#25d366', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', fontSize: 24, zIndex: 200 }}>
        💬
      </button>
    </>
  )
}
