'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'

const CY = '#0096c7'
const TEAL = '#00c8c8'
const NAVY = '#0d2233'
const SB = '#b4cdf6'
const SB_TEXT = '#0d1f3c'
const SB_MUTED = '#3a5a8a'
const BORDER = '#c8e6f0'
const MUTED = '#5a7a8a'
const LIGHT = '#e8f4fb'

type Page = 'dashboard' | 'leads' | 'pipeline' | 'proposal' | 'onboarding' | 'customers'

interface Lead {
  _id: string; ref: string; company: string; contact: string; email: string
  phone: string; country: string; industry: string; users: string
  services: string[]; status: string; createdAt: string; mrr?: number
}

const STATUS_COLS = ['new','assessment','quoted','negotiating','won','lost']
const STATUS_LABELS: Record<string, string> = { new:'New lead', assessment:'Assessment done', quoted:'Quote sent', negotiating:'Negotiating', won:'Won', lost:'Lost' }
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  new:{ bg:'#e0f7fa', color:'#006064' }, assessment:{ bg:'#fff8e1', color:'#f57f17' },
  quoted:{ bg:'#e8f5e9', color:'#2e7d32' }, negotiating:{ bg:'#fce4ec', color:'#880e4f' },
  won:{ bg:'#e0f7f4', color:'#006655' }, lost:{ bg:'#f3f4f6', color:'#4b5563' }
}

const PACKAGES: Record<string, { name: string; price: string; features: string[] }> = {
  starter: {
    name: 'Starter Cloud Office',
    price: '$6/user/month',
    features: ['Microsoft 365 Business Basic','Professional domain email','Teams, OneDrive & SharePoint','DNS & mailbox migration','SPF / DKIM / DMARC setup','30-day onboarding support']
  },
  secure: {
    name: 'Secure Business Cloud',
    price: '$22/user/month',
    features: ['Microsoft 365 Business Premium','Microsoft Defender for Business','MFA & Conditional Access','SharePoint document library','Email security hardening','Security awareness training','Monthly managed support']
  },
  ai: {
    name: 'AI-Ready Enterprise Lite',
    price: 'Custom quote',
    features: ['Microsoft 365 + Copilot pilot','Copilot Readiness Audit','SharePoint structure cleanup','Prompt engineering training','Power Automate workflows','Power BI reporting setup','Premium managed support']
  }
}

function Sidebar({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const nav = (id: Page, label: string, icon: string, badge?: number) => (
    <button key={id} onClick={() => setPage(id)}
      style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 12px', margin:'1px 8px', borderRadius:8, cursor:'pointer', fontSize:12, color: page===id ? '#fff' : SB_TEXT, background: page===id ? CY : 'none', border:'none', width:'calc(100% - 16px)', textAlign:'left', fontFamily:'inherit', fontWeight:500 }}>
      <span style={{ fontSize:15, minWidth:17 }}>{icon}</span> {label}
      {badge ? <span style={{ marginLeft:'auto', background: page===id ? 'rgba(255,255,255,.3)' : 'rgba(13,31,60,.14)', color: page===id ? '#fff' : SB_TEXT, fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:10 }}>{badge}</span> : null}
    </button>
  )
  return (
    <aside style={{ width:232, minWidth:232, background:SB, display:'flex', flexDirection:'column', height:'100vh', overflow:'auto', position:'sticky', top:0 }}>
      <div style={{ padding:'16px 16px 13px', borderBottom:`1px solid rgba(13,31,60,.12)` }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <svg width="34" height="32" viewBox="0 0 52 50" fill="none"><defs><linearGradient id="sw2" x1="10" y1="38" x2="44" y2="6" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#00c8c8"/><stop offset="100%" stopColor="#00b4d8"/></linearGradient></defs><path d="M12 38 Q16 18 44 8" stroke="url(#sw2)" strokeWidth="4.5" strokeLinecap="round" fill="none"/><circle cx="14" cy="34" r="5" fill="#00c8c8"/><line x1="14" y1="34" x2="3" y2="40" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round"/><line x1="14" y1="34" x2="2" y2="32" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round"/><line x1="14" y1="34" x2="4" y2="24" stroke="#00b4d8" strokeWidth="1.8" strokeLinecap="round"/></svg>
          <div>
            <div><span style={{ color:'#0069a0', fontSize:14, fontWeight:700 }}>go</span><span style={{ color:'#007a82', fontSize:14, fontWeight:700 }}>live</span></div>
            <div style={{ fontSize:9, color:SB_MUTED, letterSpacing:'.2px' }}>Microsoft Cloud · Africa</div>
          </div>
        </div>
      </div>
      <div style={{ fontSize:9, fontWeight:700, color:SB_MUTED, textTransform:'uppercase', letterSpacing:'1.1px', padding:'12px 14px 4px' }}>Sales</div>
      {nav('leads','Cloud assessments','📋')}
      {nav('pipeline','CRM pipeline','🔄')}
      <div style={{ fontSize:9, fontWeight:700, color:SB_MUTED, textTransform:'uppercase', letterSpacing:'1.1px', padding:'12px 14px 4px' }}>Tools</div>
      {nav('proposal','Proposal generator','📄')}
      {nav('onboarding','Onboarding checklist','✅')}
      <div style={{ fontSize:9, fontWeight:700, color:SB_MUTED, textTransform:'uppercase', letterSpacing:'1.1px', padding:'12px 14px 4px' }}>Admin</div>
      {nav('customers','Customer accounts','👥')}
      {nav('dashboard','Dashboard','📊')}
      <div style={{ marginTop:'auto', padding:'12px 14px 14px', borderTop:`1px solid rgba(13,31,60,.12)` }}>
        <div style={{ fontSize:9, fontWeight:700, color:SB_MUTED, textTransform:'uppercase', letterSpacing:'.8px', marginBottom:5 }}>Distributor status</div>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:SB_TEXT, fontWeight:500 }}>
          <div style={{ width:7, height:7, background:'#f59e0b', borderRadius:'50%' }} /> Pending selection
        </div>
        <div style={{ fontSize:10, color:SB_MUTED, marginTop:2 }}>Manual pricing active</div>
        <button onClick={() => signOut({ callbackUrl: '/portal/login' })}
          style={{ marginTop:12, width:'100%', background:'rgba(13,31,60,.1)', color:SB_TEXT, border:'none', borderRadius:6, padding:'6px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
          Sign out
        </button>
      </div>
    </aside>
  )
}

function StatCard({ label, value, sub, subOk }: { label: string; value: string; sub: string; subOk?: boolean }) {
  return (
    <div style={{ background:'#fff', border:`1.5px solid ${BORDER}`, borderRadius:10, padding:'15px 17px', borderTop:`3px solid ${CY}` }}>
      <div style={{ fontSize:10, color:MUTED, fontWeight:700, marginBottom:4, textTransform:'uppercase', letterSpacing:'.4px' }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700, color:NAVY, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:10, marginTop:3, color: subOk ? '#00a07a' : '#d97706' }}>{sub}</div>
    </div>
  )
}

function Dashboard({ leads }: { leads: Lead[] }) {
  const won = leads.filter(l => l.status === 'won')
  const mrr = won.reduce((a, l) => a + (l.mrr || 0), 0)
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:13, marginBottom:18 }}>
        <StatCard label="Total MRR" value={`$${mrr}`} sub={`${won.length} active customers`} subOk />
        <StatCard label="Total leads" value={String(leads.length)} sub="All time" subOk />
        <StatCard label="New this week" value={String(leads.filter(l => new Date(l.createdAt) > new Date(Date.now()-7*86400000)).length)} sub="Last 7 days" subOk />
        <StatCard label="Distributor" value="Pending" sub="Manual mode active" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ background:'#fff', border:`1.5px solid ${BORDER}`, borderRadius:10, padding:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:NAVY, marginBottom:12 }}>Target markets</div>
          {[['🇳🇬 Nigeria','Primary','#e0f7f4','#006655'],['🇬🇭 Ghana','Priority 2','#e3f0fb','#0a4c8a'],['🇰🇪 Kenya','Priority 3','#fff9c4','#7a5700'],['🇿🇦 South Africa','Priority 4','#f3e5f5','#6a1b9a']].map(([name,badge,bg,color]) => (
            <div key={name as string} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 9px', borderRadius:7, border:`1.5px solid ${BORDER}`, marginBottom:6, background: name?.toString().includes('Nigeria') ? LIGHT : '#fff' }}>
              <strong style={{ fontSize:12 }}>{name}</strong>
              <span style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:10, background:bg as string, color:color as string }}>{badge}</span>
            </div>
          ))}
        </div>
        <div style={{ background:'#fff', border:`1.5px solid ${BORDER}`, borderRadius:10, padding:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:NAVY, marginBottom:12 }}>30-day action plan</div>
          {[['Week 1','Package the offer — 3 sellable bundles',CY,'#e8f4fb'],['Week 2','Build sales materials — proposals, scripts',TEAL,'#e6faf5'],['Week 3','Target existing clients — hosting, domains','#d97706','#fffbeb'],['Week 4','Launch cPanel → M365 migration campaign','#7c3aed','#f5f3ff']].map(([w,t,c,bg]) => (
            <div key={w as string} style={{ borderLeft:`3px solid ${c}`, padding:'8px 11px', background:bg as string, borderRadius:'0 7px 7px 0', marginBottom:7 }}>
              <div style={{ fontSize:9, fontWeight:700, color:c as string, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:3 }}>{w}</div>
              <div style={{ fontSize:11, color:NAVY }}>{t}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LeadsTable({ leads, onUpdate }: { leads: Lead[]; onUpdate: () => void }) {
  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    onUpdate()
  }
  return (
    <div style={{ background:'#fff', border:`1.5px solid ${BORDER}`, borderRadius:10, overflow:'hidden' }}>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:'#f4fafd' }}>
              {['Ref','Company','Contact','Country','Users','Services','Status','Created','Action'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'9px 12px', fontSize:10, fontWeight:700, color:MUTED, textTransform:'uppercase', letterSpacing:'.5px', borderBottom:`1.5px solid ${BORDER}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map(l => {
              const sc = STATUS_COLORS[l.status] || STATUS_COLORS.new
              return (
                <tr key={l._id} style={{ borderBottom:`1px solid #eef3f0` }}>
                  <td style={{ padding:'10px 12px', fontFamily:'monospace', fontSize:11, color:CY, fontWeight:700 }}>{l.ref}</td>
                  <td style={{ padding:'10px 12px', fontWeight:700 }}>{l.company}</td>
                  <td style={{ padding:'10px 12px' }}><div>{l.contact}</div><div style={{ fontSize:10, color:MUTED }}>{l.email}</div></td>
                  <td style={{ padding:'10px 12px' }}>{l.country}</td>
                  <td style={{ padding:'10px 12px' }}>{l.users}</td>
                  <td style={{ padding:'10px 12px', maxWidth:160 }}><div style={{ fontSize:10, color:MUTED }}>{l.services.slice(0,2).join(', ')}{l.services.length > 2 ? ` +${l.services.length-2}` : ''}</div></td>
                  <td style={{ padding:'10px 12px' }}>
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, ...sc }}>{STATUS_LABELS[l.status]}</span>
                  </td>
                  <td style={{ padding:'10px 12px', fontSize:10, color:MUTED }}>{new Date(l.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding:'10px 12px' }}>
                    <select value={l.status} onChange={e => updateStatus(l._id, e.target.value)}
                      style={{ border:`1px solid ${BORDER}`, borderRadius:5, padding:'3px 6px', fontSize:10, color:NAVY, cursor:'pointer', fontFamily:'inherit' }}>
                      {STATUS_COLS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {leads.length === 0 && <div style={{ textAlign:'center', padding:'40px', color:MUTED, fontSize:13 }}>No leads yet.</div>}
      </div>
    </div>
  )
}

function Pipeline({ leads, onUpdate }: { leads: Lead[]; onUpdate: () => void }) {
  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    onUpdate()
  }
  return (
    <div style={{ overflowX:'auto', paddingBottom:8 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,minmax(180px,1fr))', gap:10, minWidth:940 }}>
        {STATUS_COLS.filter(s => s !== 'lost').map(col => {
          const colLeads = leads.filter(l => l.status === col)
          return (
            <div key={col} style={{ background:'#f4fafd', border:`1.5px solid ${BORDER}`, borderRadius:10, padding:11 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:9 }}>
                <span style={{ fontSize:10, fontWeight:700, color:MUTED, textTransform:'uppercase', letterSpacing:'.5px' }}>{STATUS_LABELS[col]}</span>
                <span style={{ background:BORDER, color:MUTED, padding:'1px 6px', borderRadius:10, fontSize:10 }}>{colLeads.length}</span>
              </div>
              {colLeads.map(l => (
                <div key={l._id} style={{ background:'#fff', border:`1.5px solid ${BORDER}`, borderRadius:8, padding:10, marginBottom:7 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:NAVY, marginBottom:3 }}>{l.company}</div>
                  <div style={{ fontSize:10, color:MUTED, marginBottom:5 }}>{l.country} · {l.users} users</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:10, fontWeight:700, color:CY }}>{l.ref}</span>
                    <select value={l.status} onChange={e => updateStatus(l._id, e.target.value)}
                      style={{ border:`1px solid ${BORDER}`, borderRadius:4, padding:'2px 4px', fontSize:9, cursor:'pointer', fontFamily:'inherit' }}>
                      {STATUS_COLS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              {colLeads.length === 0 && <div style={{ fontSize:10, color:BORDER, textAlign:'center', padding:'20px 0', fontStyle:'italic' }}>Empty</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const CHECKLIST_ITEMS = [
  { section:'Pre-setup (day 1–2)', items:['Collect company info & signed agreement','Verify domain ownership via DNS','Gather list of users & roles','Backup existing emails (if migrating)','Get admin credentials for old system'] },
  { section:'Licensing & provisioning (day 2–3)', items:['Raise order with distributor','Create customer tenant in Partner Center','Assign licenses to all users','Configure custom domain in M365 admin'] },
  { section:'Email setup (day 3–5)', items:['Create all mailboxes & distribution lists','Configure SPF record in DNS','Configure DKIM signing','Set up DMARC policy','Migrate emails from old provider','Cut over MX records'] },
  { section:'Security hardening (day 5–7)', items:['Enable MFA for all admin accounts','Enable MFA for all user accounts','Configure Microsoft Defender (if included)','Set up anti-phishing policy','Review and restrict admin roles'] },
  { section:'Collaboration setup (day 6–8)', items:['Create SharePoint site(s) & folder structure','Set up Teams channels & groups','Configure OneDrive policies','Set sharing & external access rules'] },
  { section:'Training & handover (day 8–14)', items:['Deliver Outlook / M365 user training','Admin handover session with IT contact','Provide password & MFA guide to users','Send 30-day support contact info','Schedule 30-day check-in call'] },
]

function Onboarding() {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const total = CHECKLIST_ITEMS.reduce((a, s) => a + s.items.length, 0)
  const pct = Math.round(checked.size / total * 100)
  const toggle = (key: string) => setChecked(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
        <span style={{ fontSize:12, fontWeight:700, color:NAVY }}>Onboarding progress</span>
        <span style={{ fontSize:13, color:CY, fontWeight:700 }}>{pct}%</span>
      </div>
      <div style={{ height:6, background:BORDER, borderRadius:3, overflow:'hidden', marginBottom:20 }}>
        <div style={{ height:'100%', background:CY, borderRadius:3, width:`${pct}%`, transition:'width .3s' }} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {CHECKLIST_ITEMS.map(sec => (
          <div key={sec.section}>
            <div style={{ fontSize:11, fontWeight:700, color:NAVY, marginBottom:8, padding:'6px 10px', background:LIGHT, borderRadius:6, borderLeft:`3px solid ${CY}` }}>{sec.section}</div>
            {sec.items.map(item => {
              const key = `${sec.section}:${item}`
              const done = checked.has(key)
              return (
                <div key={item} onClick={() => toggle(key)} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 11px', marginBottom:3, border:`1.5px solid ${done ? TEAL : BORDER}`, borderRadius:7, cursor:'pointer', background: done ? '#f0faf5' : '#fff', fontSize:11, color: done ? MUTED : NAVY, textDecoration: done ? 'line-through' : 'none' }}>
                  <input type="checkbox" readOnly checked={done} style={{ accentColor:CY, width:13, height:13, flexShrink:0 }} /> {item}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── PROPOSAL GENERATOR ──────────────────────────────────────────
function ProposalGenerator({ leads }: { leads: Lead[] }) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [pkg, setPkg] = useState<'starter' | 'secure' | 'ai'>('secure')
  const [users, setUsers] = useState('10')
  const [setupFee, setSetupFee] = useState('150')
  const [currency, setCurrency] = useState('USD')
  const [rate, setRate] = useState(1)
  const [validDays, setValidDays] = useState('14')
  const [notes, setNotes] = useState('')
  const [includeTimeline, setIncludeTimeline] = useState(true)
  const [includeSecurity, setIncludeSecurity] = useState(true)

  const CURRENCY_SYMBOLS: Record<string, string> = { USD:'$', NGN:'₦', GHS:'GH₵', KES:'KSh', ZAR:'R' }
  const RATES: Record<string, number> = { USD:1, NGN:1580, GHS:15.2, KES:129, ZAR:18.6 }

  useEffect(() => { setRate(RATES[currency] || 1) }, [currency])

  const pricePerUser = pkg === 'starter' ? 6 : pkg === 'secure' ? 22 : 0
  const usersN = parseInt(users) || 1
  const monthlyUSD = pricePerUser * usersN
  const annualUSD = monthlyUSD * 12
  const setupUSD = parseInt(setupFee) || 0
  const sym = CURRENCY_SYMBOLS[currency] || '$'
  const fmt = (usd: number) => {
    const v = Math.round(usd * rate)
    return sym + v.toLocaleString()
  }

  const inp: React.CSSProperties = { border:`1.5px solid ${BORDER}`, borderRadius:7, padding:'7px 10px', fontSize:12, color:NAVY, fontFamily:'inherit', outline:'none', width:'100%' }
  const lbl: React.CSSProperties = { fontSize:10, fontWeight:700, color:MUTED, textTransform:'uppercase' as const, letterSpacing:'.4px', display:'block', marginBottom:3 }

  const generatePDF = () => {
    if (!selectedLead) return
    const today = new Date()
    const expiry = new Date(today.getTime() + parseInt(validDays) * 86400000)
    const proposalRef = `PROP-${selectedLead.ref}-${Date.now().toString().slice(-4)}`

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Microsoft Cloud Proposal — ${selectedLead.company}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0d2233; background: #fff; }
  .page { max-width: 780px; margin: 0 auto; padding: 48px 48px; }
  .header { background: #0d2233; color: #fff; padding: 36px 48px; display: flex; justify-content: space-between; align-items: flex-start; }
  .logo-text { font-size: 28px; font-weight: 700; }
  .logo-go { color: #00b4d8; }
  .logo-live { color: #00c8c8; }
  .logo-sub { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 3px; }
  .header-right { text-align: right; font-size: 12px; color: rgba(255,255,255,.6); line-height: 1.8; }
  .header-right strong { color: #fff; font-size: 14px; display: block; margin-bottom: 4px; }
  .hero { background: linear-gradient(135deg, #0096c7 0%, #00c8c8 100%); color: #fff; padding: 32px 48px; }
  .hero h1 { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
  .hero p { font-size: 13px; opacity: .85; }
  .content { padding: 36px 48px; }
  .section { margin-bottom: 32px; }
  .section-title { font-size: 13px; font-weight: 700; color: #0096c7; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 14px; padding-bottom: 6px; border-bottom: 2px solid #e8f4fb; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .info-box { background: #f4fafd; border: 1.5px solid #c8e6f0; border-radius: 8px; padding: 14px; }
  .info-box .label { font-size: 9px; font-weight: 700; color: #5a7a8a; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
  .info-box .value { font-size: 14px; font-weight: 700; color: #0d2233; }
  .info-box .sub { font-size: 11px; color: #5a7a8a; margin-top: 2px; }
  .package-box { background: #f4fafd; border: 2px solid #0096c7; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
  .package-name { font-size: 16px; font-weight: 700; color: #0d2233; margin-bottom: 4px; }
  .package-price { font-size: 13px; color: #0096c7; font-weight: 600; margin-bottom: 12px; }
  .feature-list { list-style: none; }
  .feature-list li { font-size: 12px; padding: 4px 0; display: flex; align-items: flex-start; gap: 8px; color: #0d2233; }
  .feature-list li::before { content: "✓"; color: #00c8c8; font-weight: 700; flex-shrink: 0; }
  .pricing-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .pricing-table th { background: #0d2233; color: #fff; padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; }
  .pricing-table td { padding: 11px 14px; border-bottom: 1px solid #e8f4fb; }
  .pricing-table tr:last-child td { border-bottom: none; background: #f4fafd; font-weight: 700; }
  .pricing-table .amount { font-weight: 700; color: #0096c7; }
  .timeline { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .tl-step { background: #f4fafd; border: 1.5px solid #c8e6f0; border-radius: 8px; padding: 14px; text-align: center; }
  .tl-num { width: 32px; height: 32px; background: #0096c7; border-radius: 50%; color: #fff; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; }
  .tl-title { font-size: 11px; font-weight: 700; color: #0d2233; margin-bottom: 4px; }
  .tl-desc { font-size: 10px; color: #5a7a8a; line-height: 1.5; }
  .security-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .sec-item { background: #f0faf5; border: 1.5px solid #6ee7b7; border-radius: 7px; padding: 11px 13px; font-size: 11px; color: #065f46; display: flex; align-items: center; gap: 8px; }
  .sec-item::before { content: "🔒"; font-size: 14px; flex-shrink: 0; }
  .validity { background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 8px; padding: 14px 18px; font-size: 12px; color: #92400e; margin-bottom: 20px; }
  .notes-box { background: #f4fafd; border: 1.5px solid #c8e6f0; border-radius: 8px; padding: 16px; font-size: 12px; color: #4a6572; line-height: 1.7; margin-bottom: 20px; }
  .cta { background: #0d2233; color: #fff; border-radius: 10px; padding: 24px 28px; display: flex; justify-content: space-between; align-items: center; }
  .cta h3 { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
  .cta p { font-size: 12px; color: rgba(255,255,255,.6); }
  .cta-contacts { text-align: right; font-size: 12px; color: rgba(255,255,255,.8); line-height: 1.9; }
  .footer { background: #f4fafd; border-top: 1.5px solid #c8e6f0; padding: 20px 48px; text-align: center; font-size: 11px; color: #5a7a8a; }
  .ms-badge { display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #c8e6f0; border-radius: 6px; padding: 4px 10px; font-size: 10px; color: #0d2233; font-weight: 600; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header { -webkit-print-color-adjust: exact; }
    .hero { -webkit-print-color-adjust: exact; }
  }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo-text"><span class="logo-go">go</span><span class="logo-live">live</span></div>
    <div class="logo-sub">Digital Solutions Company · Authorized Microsoft CSP</div>
  </div>
  <div class="header-right">
    <strong>Microsoft Cloud Proposal</strong>
    Ref: ${proposalRef}<br>
    Date: ${today.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}<br>
    Valid until: ${expiry.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}
  </div>
</div>

<div class="hero">
  <h1>Microsoft Cloud Solution for ${selectedLead.company}</h1>
  <p>Prepared exclusively for ${selectedLead.contact} · ${selectedLead.industry} · ${selectedLead.country}</p>
</div>

<div class="content">

  <div class="section">
    <div class="section-title">Client information</div>
    <div class="info-grid">
      <div class="info-box"><div class="label">Company</div><div class="value">${selectedLead.company}</div></div>
      <div class="info-box"><div class="label">Contact person</div><div class="value">${selectedLead.contact}</div><div class="sub">${selectedLead.email}</div></div>
      <div class="info-box"><div class="label">Country</div><div class="value">${selectedLead.country}</div></div>
      <div class="info-box"><div class="label">Industry</div><div class="value">${selectedLead.industry}</div><div class="sub">${selectedLead.users} staff members</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Recommended package</div>
    <div class="package-box">
      <div class="package-name">${PACKAGES[pkg].name}</div>
      <div class="package-price">${PACKAGES[pkg].price}</div>
      <ul class="feature-list">
        ${PACKAGES[pkg].features.map(f => `<li>${f}</li>`).join('')}
      </ul>
    </div>
    ${selectedLead.services.length > 0 ? `
    <p style="font-size:12px;color:#5a7a8a;margin-top:10px"><strong style="color:#0d2233">Services requested:</strong> ${selectedLead.services.join(', ')}</p>
    ` : ''}
  </div>

  <div class="section">
    <div class="section-title">Investment summary</div>
    <table class="pricing-table">
      <thead>
        <tr><th>Item</th><th>Details</th><th>Amount (${currency})</th></tr>
      </thead>
      <tbody>
        ${pricePerUser > 0 ? `
        <tr><td>Microsoft 365 License</td><td>${PACKAGES[pkg].name} × ${usersN} users</td><td class="amount">${fmt(pricePerUser * usersN)}/month</td></tr>
        <tr><td>Annual commitment</td><td>${usersN} users × 12 months</td><td class="amount">${fmt(annualUSD)}/year</td></tr>
        ` : `<tr><td>Microsoft 365 License</td><td>Custom quote — based on requirements</td><td class="amount">TBC</td></tr>`}
        <tr><td>Setup & migration fee</td><td>One-time · includes email migration, DNS, security config</td><td class="amount">${fmt(setupUSD)}</td></tr>
        ${pricePerUser > 0 ? `<tr><td><strong>Total first year investment</strong></td><td></td><td class="amount">${fmt(annualUSD + setupUSD)}</td></tr>` : ''}
      </tbody>
    </table>
    ${currency !== 'USD' ? `<p style="font-size:10px;color:#5a7a8a;margin-top:8px">* Prices shown in ${currency} at indicative rate of 1 USD = ${rate} ${currency}. Final invoice in local currency confirmed at time of order.</p>` : ''}
  </div>

  ${includeTimeline ? `
  <div class="section">
    <div class="section-title">Delivery timeline</div>
    <div class="timeline">
      <div class="tl-step"><div class="tl-num">1</div><div class="tl-title">Day 1–2</div><div class="tl-desc">Agreement signed, domain verified, user list collected</div></div>
      <div class="tl-step"><div class="tl-num">2</div><div class="tl-title">Day 2–4</div><div class="tl-desc">Tenant created, licenses assigned, mailboxes configured</div></div>
      <div class="tl-step"><div class="tl-num">3</div><div class="tl-title">Day 4–7</div><div class="tl-desc">Email migration, DNS cutover, SPF/DKIM/DMARC setup</div></div>
      <div class="tl-step"><div class="tl-num">4</div><div class="tl-title">Day 7–14</div><div class="tl-desc">Security hardening, user training, admin handover</div></div>
    </div>
  </div>
  ` : ''}

  ${includeSecurity ? `
  <div class="section">
    <div class="section-title">Security & compliance included</div>
    <div class="security-grid">
      <div class="sec-item">Multi-factor authentication (MFA) for all users</div>
      <div class="sec-item">SPF, DKIM & DMARC email authentication</div>
      <div class="sec-item">Anti-phishing & anti-malware policies</div>
      <div class="sec-item">Microsoft Secure Score baseline setup</div>
      <div class="sec-item">Admin roles & least-privilege access review</div>
      <div class="sec-item">30-day post-migration security monitoring</div>
    </div>
  </div>
  ` : ''}

  ${notes ? `
  <div class="section">
    <div class="section-title">Additional notes</div>
    <div class="notes-box">${notes}</div>
  </div>
  ` : ''}

  <div class="validity">
    ⏱ This proposal is valid for <strong>${validDays} days</strong> from the date above (until ${expiry.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}). Pricing subject to change after this date.
  </div>

  <div class="cta">
    <div>
      <h3>Ready to move to Microsoft cloud?</h3>
      <p>Reply to this proposal or contact your GoLive advisor to proceed.</p>
    </div>
    <div class="cta-contacts">
      <strong style="color:#00c8c8">GoLive Digital Solutions</strong><br>
      info@golivenaija.com<br>
      wa.me/2348083587801<br>
      cloud.golivecompany.com
    </div>
  </div>

</div>

<div class="footer">
  <div class="ms-badge">
    <svg width="14" height="14" viewBox="0 0 23 23" fill="none"><rect x="1" y="1" width="10" height="10" fill="#f25022"/><rect x="12" y="1" width="10" height="10" fill="#7fba00"/><rect x="1" y="12" width="10" height="10" fill="#00a4ef"/><rect x="12" y="12" width="10" height="10" fill="#ffb900"/></svg>
    Authorized Microsoft Cloud Solution Provider
  </div>
  <p style="margin-top:10px">GoLive Digital Solutions Company Ltd · Ref: ${proposalRef} · This document is confidential and prepared exclusively for ${selectedLead.company}</p>
</div>

</body>
</html>`

    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      setTimeout(() => win.print(), 800)
    }
  }

  const quotedLeads = leads.filter(l => ['new','assessment','quoted','negotiating'].includes(l.status))

  return (
    <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:18, alignItems:'start' }}>

      {/* LEFT — CONFIG PANEL */}
      <div style={{ background:'#fff', border:`1.5px solid ${BORDER}`, borderRadius:10, padding:18 }}>
        <div style={{ fontSize:13, fontWeight:700, color:NAVY, marginBottom:14, paddingBottom:10, borderBottom:`1.5px solid ${BORDER}` }}>Configure proposal</div>

        <div style={{ marginBottom:12 }}>
          <label style={lbl}>Select lead</label>
          <select style={inp} value={selectedLead?._id || ''} onChange={e => setSelectedLead(leads.find(l => l._id === e.target.value) || null)}>
            <option value="">— choose a lead —</option>
            {quotedLeads.map(l => <option key={l._id} value={l._id}>{l.company} · {l.ref}</option>)}
          </select>
          {leads.length > 0 && quotedLeads.length === 0 && <p style={{ fontSize:10, color:MUTED, marginTop:4 }}>Move leads to Assessment or Quoted status to generate proposals.</p>}
        </div>

        {selectedLead && (
          <div style={{ background:LIGHT, border:`1px solid ${BORDER}`, borderRadius:7, padding:10, marginBottom:14, fontSize:11, color:NAVY, lineHeight:1.8 }}>
            <strong>{selectedLead.company}</strong><br/>
            {selectedLead.contact} · {selectedLead.email}<br/>
            {selectedLead.country} · {selectedLead.users} users · {selectedLead.industry}
          </div>
        )}

        <div style={{ marginBottom:12 }}>
          <label style={lbl}>Package</label>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {(['starter','secure','ai'] as const).map(p => (
              <label key={p} onClick={() => setPkg(p)} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'9px 11px', border:`1.5px solid ${pkg===p ? CY : BORDER}`, borderRadius:7, cursor:'pointer', background: pkg===p ? LIGHT : '#fff', fontSize:11, color:NAVY }}>
                <input type="radio" readOnly checked={pkg===p} style={{ accentColor:CY, marginTop:1 }} />
                <div>
                  <div style={{ fontWeight:700 }}>{PACKAGES[p].name}</div>
                  <div style={{ fontSize:10, color:MUTED }}>{PACKAGES[p].price}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          <div>
            <label style={lbl}>No. of users</label>
            <input style={inp} type="number" min="1" value={users} onChange={e => setUsers(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Setup fee (USD)</label>
            <input style={inp} type="number" min="0" value={setupFee} onChange={e => setSetupFee(e.target.value)} />
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          <div>
            <label style={lbl}>Currency</label>
            <select style={inp} value={currency} onChange={e => setCurrency(e.target.value)}>
              {['USD','NGN','GHS','KES','ZAR'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Valid for (days)</label>
            <input style={inp} type="number" min="7" value={validDays} onChange={e => setValidDays(e.target.value)} />
          </div>
        </div>

        <div style={{ marginBottom:12 }}>
          <label style={lbl}>Include sections</label>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {[['includeTimeline','Delivery timeline',includeTimeline,setIncludeTimeline],['includeSecurity','Security & compliance included',includeSecurity,setIncludeSecurity]].map(([key,label,val,setter]) => (
              <label key={key as string} onClick={() => (setter as (v:boolean)=>void)(!(val as boolean))} style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:NAVY, cursor:'pointer', padding:'6px 0' }}>
                <input type="checkbox" readOnly checked={val as boolean} style={{ accentColor:CY, width:13, height:13 }} /> {label as string}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={lbl}>Additional notes</label>
          <textarea style={{ ...inp, minHeight:70, resize:'none' }} placeholder="Payment terms, special conditions, referral details..." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <button onClick={generatePDF} disabled={!selectedLead}
          style={{ width:'100%', background: selectedLead ? CY : '#c8e6f0', color: selectedLead ? '#fff' : MUTED, border:'none', borderRadius:8, padding:'12px', fontSize:13, fontWeight:700, cursor: selectedLead ? 'pointer' : 'not-allowed', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          📄 Generate PDF proposal
        </button>
        {!selectedLead && <p style={{ fontSize:10, color:MUTED, textAlign:'center', marginTop:6 }}>Select a lead above to generate a proposal</p>}
      </div>

      {/* RIGHT — PREVIEW PANEL */}
      <div style={{ background:'#fff', border:`1.5px solid ${BORDER}`, borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:`1.5px solid ${BORDER}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:13, fontWeight:700, color:NAVY }}>Proposal preview</div>
          {selectedLead && <div style={{ fontSize:10, color:MUTED }}>Click Generate to open printable PDF</div>}
        </div>

        {!selectedLead ? (
          <div style={{ textAlign:'center', padding:'60px 20px', color:MUTED }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📄</div>
            <div style={{ fontSize:14, fontWeight:600, color:NAVY, marginBottom:8 }}>Select a lead to preview the proposal</div>
            <div style={{ fontSize:12 }}>Configure the options on the left and click Generate PDF to create a print-ready proposal.</div>
          </div>
        ) : (
          <div style={{ padding:24 }}>
            {/* Mini preview */}
            <div style={{ background:'#0d2233', borderRadius:'8px 8px 0 0', padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div><span style={{ color:'#00b4d8', fontSize:16, fontWeight:700 }}>go</span><span style={{ color:TEAL, fontSize:16, fontWeight:700 }}>live</span><div style={{ fontSize:9, color:'rgba(255,255,255,.4)', marginTop:1 }}>Digital Solutions Company</div></div>
              <div style={{ textAlign:'right', fontSize:10, color:'rgba(255,255,255,.6)', lineHeight:1.8 }}>
                <div style={{ color:'#fff', fontWeight:700, fontSize:12 }}>Microsoft Cloud Proposal</div>
                <div>Date: {new Date().toLocaleDateString()}</div>
                <div>Valid: {validDays} days</div>
              </div>
            </div>
            <div style={{ background:`linear-gradient(135deg, ${CY} 0%, ${TEAL} 100%)`, padding:'18px 20px' }}>
              <div style={{ color:'#fff', fontWeight:700, fontSize:15, marginBottom:3 }}>Microsoft Cloud Solution for {selectedLead.company}</div>
              <div style={{ color:'rgba(255,255,255,.8)', fontSize:11 }}>Prepared for {selectedLead.contact} · {selectedLead.industry} · {selectedLead.country}</div>
            </div>
            <div style={{ padding:'16px 20px', background:'#f4fafd', borderBottom:`1px solid ${BORDER}` }}>
              <div style={{ fontSize:10, fontWeight:700, color:MUTED, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>Package selected</div>
              <div style={{ fontWeight:700, color:NAVY, fontSize:13 }}>{PACKAGES[pkg].name}</div>
              <div style={{ fontSize:11, color:CY, marginTop:2 }}>{PACKAGES[pkg].price}</div>
            </div>
            <div style={{ padding:'16px 20px', background:'#f4fafd' }}>
              <div style={{ fontSize:10, fontWeight:700, color:MUTED, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:10 }}>Investment summary</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                {pkg !== 'ai' && <>
                  <div style={{ background:'#fff', border:`1.5px solid ${BORDER}`, borderRadius:7, padding:10, textAlign:'center' }}>
                    <div style={{ fontSize:9, color:MUTED, marginBottom:3 }}>Monthly</div>
                    <div style={{ fontSize:14, fontWeight:700, color:CY }}>{sym}{Math.round(monthlyUSD * rate).toLocaleString()}</div>
                    <div style={{ fontSize:9, color:MUTED }}>{usersN} users</div>
                  </div>
                  <div style={{ background:'#fff', border:`1.5px solid ${BORDER}`, borderRadius:7, padding:10, textAlign:'center' }}>
                    <div style={{ fontSize:9, color:MUTED, marginBottom:3 }}>Annual</div>
                    <div style={{ fontSize:14, fontWeight:700, color:CY }}>{sym}{Math.round(annualUSD * rate).toLocaleString()}</div>
                    <div style={{ fontSize:9, color:MUTED }}>12 months</div>
                  </div>
                </>}
                <div style={{ background:'#fff', border:`1.5px solid ${BORDER}`, borderRadius:7, padding:10, textAlign:'center' }}>
                  <div style={{ fontSize:9, color:MUTED, marginBottom:3 }}>Setup fee</div>
                  <div style={{ fontSize:14, fontWeight:700, color:CY }}>{sym}{Math.round(setupUSD * rate).toLocaleString()}</div>
                  <div style={{ fontSize:9, color:MUTED }}>one-time</div>
                </div>
              </div>
            </div>
            <div style={{ padding:'16px 20px', background:'#fff', borderTop:`1.5px solid ${BORDER}`, display:'flex', justifyContent:'center' }}>
              <button onClick={generatePDF}
                style={{ background:CY, color:'#fff', border:'none', borderRadius:7, padding:'10px 28px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:7 }}>
                📄 Open & Print PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MAIN PORTAL ─────────────────────────────────────────────────
export default function Portal() {
  const [page, setPage] = useState<Page>('dashboard')
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads')
      const data = await res.json()
      if (data.success) setLeads(data.leads)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchLeads() }, [])

  const PAGE_TITLES: Record<Page, string> = {
    dashboard:'Dashboard', leads:'Cloud assessment leads', pipeline:'CRM pipeline',
    proposal:'Proposal generator', onboarding:'Customer onboarding checklist', customers:'Customer accounts'
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar page={page} setPage={setPage} />
      <main style={{ flex:1, overflow:'hidden', background:'#f0f7fb' }}>
        <div style={{ background:'#fff', borderBottom:`2px solid ${BORDER}`, padding:'11px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
          <div style={{ fontSize:14, fontWeight:700, color:NAVY }}>{PAGE_TITLES[page]}</div>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <span style={{ fontSize:10, color:MUTED }}>June 2026 · Africa Region</span>
            {(page === 'leads' || page === 'pipeline') && (
              <button onClick={fetchLeads} style={{ background:CY, color:'#fff', border:'none', borderRadius:6, padding:'6px 12px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                ↻ Refresh
              </button>
            )}
          </div>
        </div>
        <div style={{ padding:'18px 22px', overflowY:'auto', maxHeight:'calc(100vh - 56px)' }}>
          {loading && <div style={{ textAlign:'center', padding:40, color:MUTED }}>Loading...</div>}
          {!loading && page === 'dashboard' && <Dashboard leads={leads} />}
          {!loading && page === 'leads' && <LeadsTable leads={leads} onUpdate={fetchLeads} />}
          {!loading && page === 'pipeline' && <Pipeline leads={leads} onUpdate={fetchLeads} />}
          {!loading && page === 'onboarding' && <Onboarding />}
          {!loading && page === 'proposal' && <ProposalGenerator leads={leads} />}
          {!loading && page === 'customers' && (
            <div style={{ textAlign:'center', padding:'60px 20px', color:MUTED }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🚧</div>
              <div style={{ fontSize:14, fontWeight:600, color:NAVY, marginBottom:8 }}>Customer accounts — coming next</div>
              <div style={{ fontSize:12 }}>Track active Microsoft 365 tenants, renewal dates and MRR per customer.</div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
