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
      {nav('leads','Cloud assessments','📋',0)}
      {nav('pipeline','CRM pipeline','🔄',0)}
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
        {leads.length === 0 && <div style={{ textAlign:'center', padding:'40px', color:MUTED, fontSize:13 }}>No leads yet. Assessment form submissions will appear here.</div>}
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
          const sc = STATUS_COLORS[col]
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
            <div style={{ fontSize:11, fontWeight:700, color:NAVY, marginBottom:8, display:'flex', alignItems:'center', gap:6, padding:'6px 10px', background:LIGHT, borderRadius:6, borderLeft:`3px solid ${CY}` }}>{sec.section}</div>
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
          {!loading && (page === 'proposal' || page === 'customers') && (
            <div style={{ textAlign:'center', padding:'60px 20px', color:MUTED }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🚧</div>
              <div style={{ fontSize:14, fontWeight:600, color:NAVY, marginBottom:8 }}>{PAGE_TITLES[page]} — coming next</div>
              <div style={{ fontSize:12 }}>This section will be built in the next sprint.</div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
