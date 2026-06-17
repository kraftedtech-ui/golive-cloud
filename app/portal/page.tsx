'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Topbar } from '@/components/dashboard/topbar'
import { StatCards } from '@/components/dashboard/stat-cards'
import { KanbanBoard } from '@/components/dashboard/kanban-board'
import { RecentLeads } from '@/components/dashboard/recent-leads'
import { MrrCharts } from '@/components/dashboard/mrr-charts'

export const dynamic = 'force-dynamic'

interface Lead {
  _id: string; ref: string; company: string; contact: string; email: string
  phone: string; country: string; industry: string; users: string
  services: string[]; status: string; createdAt: string
}
interface Customer {
  _id: string; company: string; tenantDomain: string; package: string
  users: number; mrr: number; arr: number; renewalDate: string
  healthScore: string; country: string; status: string
}
interface Transfer {
  _id: string; ref: string; transferType: string; company: string
  contact: string; email: string; domain: string; users: string
  country: string; status: string; createdAt: string
}
interface User {
  _id: string; name: string; email: string; role: string; active: boolean; lastLogin: string
}

export default function PortalPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [page, setPage] = useState('dashboard')
  const [leads, setLeads] = useState<Lead[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/portal/login')
  }, [status, router])

  const fetchData = () => {
    if (status !== 'authenticated') return
    Promise.all([
      fetch('/api/leads').then(r => r.json()),
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/transfers').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]).then(([l, c, t, u]) => {
      if (l.success) setLeads(l.leads || [])
      if (c.success) setCustomers(c.customers || [])
      if (t.success) setTransfers(t.transfers || [])
      if (u.success) setUsers(u.users || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [status])

  if (status === 'loading') return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
      <div className="text-sm text-[#5c7184]">Loading portal...</div>
    </div>
  )
  if (status === 'unauthenticated') return null

  const role = (session?.user as any)?.role || 'viewer'
  const isAdmin = role === 'admin'

  const STATUS_COLORS: Record<string, string> = {
    'New Lead': 'bg-blue-50 text-blue-700',
    'Assessment Done': 'bg-purple-50 text-purple-700',
    'Quote Sent': 'bg-yellow-50 text-yellow-700',
    'Negotiating': 'bg-orange-50 text-orange-700',
    'Won': 'bg-green-50 text-green-700',
    'Lost': 'bg-gray-50 text-gray-500',
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <Sidebar active={page} onNavigate={setPage} />
      <div className="lg:pl-64">
        <Topbar />
        <main className="mx-auto max-w-[1600px] space-y-6 px-5 py-6 md:px-8">

          {page === 'dashboard' && (
            <>
              <StatCards />
              <KanbanBoard />
              <div className="grid grid-cols-1 gap-6">
                <MrrCharts />
                <RecentLeads />
              </div>
            </>
          )}

          {page === 'assessments' && (
            <div className="rounded-2xl border border-border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">Sales</p>
                  <h2 className="mt-0.5 text-base font-semibold text-foreground">Cloud Assessment Leads</h2>
                  <p className="text-xs text-muted-foreground">{leads.length} total</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-secondary/30">
                    {['Ref','Company','Contact','Country','Users','Status','Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">Loading...</td></tr>
                    : leads.length === 0 ? <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">No leads yet</td></tr>
                    : leads.map(lead => (
                      <tr key={lead._id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="px-4 py-3 font-mono text-[11px] text-primary">{lead.ref}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{lead.company}</td>
                        <td className="px-4 py-3 text-muted-foreground">{lead.contact}<div className="text-[11px]">{lead.email}</div></td>
                        <td className="px-4 py-3 text-muted-foreground">{lead.country}</td>
                        <td className="px-4 py-3">{lead.users}</td>
                        <td className="px-4 py-3">
                          <select value={lead.status} onChange={async e => {
                            await fetch(`/api/leads/${lead._id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: e.target.value }) })
                            fetchData()
                          }} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border-0 outline-none cursor-pointer ${STATUS_COLORS[lead.status] || 'bg-gray-50 text-gray-600'}`}>
                            {['New Lead','Assessment Done','Quote Sent','Negotiating','Won','Lost'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {page === 'transfers' && (
            <div className="rounded-2xl border border-border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">Sales</p>
                  <h2 className="mt-0.5 text-base font-semibold text-foreground">Transfer Requests</h2>
                  <p className="text-xs text-muted-foreground">{transfers.length} total — <a href="/migrate" className="text-primary hover:underline">View /migrate page</a></p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-secondary/30">
                    {['Ref','Type','Company','Domain','Country','Status','Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">Loading...</td></tr>
                    : transfers.length === 0 ? <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">No transfer requests yet</td></tr>
                    : transfers.map(t => (
                      <tr key={t._id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="px-4 py-3 font-mono text-[11px] text-primary">{t.ref}</td>
                        <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{{csp:'CSP',google:'Google→M365',cpanel:'cPanel'}[t.transferType] || t.transferType}</span></td>
                        <td className="px-4 py-3 font-medium text-foreground">{t.company}<div className="text-[11px] text-muted-foreground">{t.contact}</div></td>
                        <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{t.domain}</td>
                        <td className="px-4 py-3 text-muted-foreground">{t.country}</td>
                        <td className="px-4 py-3">
                          <select value={t.status} onChange={async e => {
                            await fetch('/api/transfers', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id: t._id, status: e.target.value }) })
                            fetchData()
                          }} className="rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-[11px] font-semibold border-0 outline-none cursor-pointer">
                            {[['new','New'],['contacted','Contacted'],['in_progress','In Progress'],['completed','Completed'],['lost','Lost']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {page === 'customers' && (
            <div className="rounded-2xl border border-border bg-white shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">Admin</p>
                <h2 className="mt-0.5 text-base font-semibold text-foreground">Customer Accounts</h2>
                <p className="text-xs text-muted-foreground">{customers.length} customers · ${customers.reduce((s,c) => s+(c.mrr||0),0).toLocaleString()}/mo MRR</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-secondary/30">
                    {['Company','Tenant','Package','Users','MRR','Renewal','Health','Country'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">Loading...</td></tr>
                    : customers.length === 0 ? <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No customers yet</td></tr>
                    : customers.map(c => {
                      const renewal = c.renewalDate ? new Date(c.renewalDate) : null
                      const daysLeft = renewal ? Math.ceil((renewal.getTime() - Date.now()) / 86400000) : null
                      const healthColors: Record<string,string> = { Green: 'bg-green-50 text-green-700', Amber: 'bg-yellow-50 text-yellow-700', Red: 'bg-red-50 text-red-700' }
                      return (
                        <tr key={c._id} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="px-4 py-3 font-medium text-foreground">{c.company}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{c.tenantDomain}</td>
                          <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{c.package}</span></td>
                          <td className="px-4 py-3">{c.users}</td>
                          <td className="px-4 py-3 font-semibold tabular-nums">${(c.mrr||0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-[11px]">{daysLeft !== null ? <span className={daysLeft <= 30 ? 'font-semibold text-red-600' : 'text-muted-foreground'}>{daysLeft <= 0 ? 'Expired' : `${daysLeft}d`}</span> : '—'}</td>
                          <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${healthColors[c.healthScore] || 'bg-gray-50 text-gray-500'}`}>{c.healthScore}</span></td>
                          <td className="px-4 py-3 text-muted-foreground">{c.country}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {page === 'team' && isAdmin && (
            <div className="rounded-2xl border border-border bg-white shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">Admin</p>
                <h2 className="mt-0.5 text-base font-semibold text-foreground">Team & Access Control</h2>
                <p className="text-xs text-muted-foreground">{users.length} team members</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-secondary/30">
                    {['Name','Email','Role','Status','Last Login','Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                        <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium capitalize">{u.role}</span></td>
                        <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${u.active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>{u.active ? 'Active' : 'Inactive'}</span></td>
                        <td className="px-4 py-3 text-[11px] text-muted-foreground">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</td>
                        <td className="px-4 py-3">
                          <button onClick={async () => {
                            await fetch(`/api/users/${u._id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ active: !u.active }) })
                            fetchData()
                          }} className={`rounded-lg px-3 py-1 text-[11px] font-medium ${u.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                            {u.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {page === 'pipeline' && <KanbanBoard />}

          {page === 'proposals' && (
            <div className="rounded-2xl border border-border bg-white shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">Tools</p>
                <h2 className="mt-0.5 text-base font-semibold text-foreground">Proposal Generator</h2>
              </div>
              <ProposalContent leads={leads} />
            </div>
          )}

          {page === 'onboarding' && (
            <div className="rounded-2xl border border-border bg-white shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">Tools</p>
                <h2 className="mt-0.5 text-base font-semibold text-foreground">Customer Onboarding Checklist</h2>
              </div>
              <OnboardingChecklist />
            </div>
          )}

        </main>
      </div>
    </div>
  )
}

function ProposalContent({ leads }: { leads: Lead[] }) {
  const [selectedLead, setSelectedLead] = useState('')
  const [pkg, setPkg] = useState('Secure Business Cloud')
  const [users, setUsers] = useState('10')
  const [currency, setCurrency] = useState('USD')
  const [setup, setSetup] = useState('300')
  const prices: Record<string, Record<string, number>> = {
    'Starter Cloud Office': { USD: 6, NGN: 9600, GHS: 90, KES: 774, ZAR: 108 },
    'Secure Business Cloud': { USD: 22, NGN: 35200, GHS: 330, KES: 2838, ZAR: 396 },
    'AI-Ready Enterprise': { USD: 38, NGN: 60800, GHS: 570, KES: 4902, ZAR: 684 },
  }
  const symbols: Record<string, string> = { USD: '$', NGN: '₦', GHS: 'GH₵', KES: 'KSh', ZAR: 'R' }
  const pricePerUser = prices[pkg]?.[currency] || 0
  const userCount = parseInt(users) || 0
  const monthlyTotal = pricePerUser * userCount
  const annualTotal = monthlyTotal * 10
  const sym = symbols[currency]
  const lead = leads.find(l => l._id === selectedLead)
  return (
    <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Select Lead</label>
          <select value={selectedLead} onChange={e => setSelectedLead(e.target.value)} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30">
            <option value="">Select a lead...</option>
            {leads.filter(l => ['Assessment Done','Quote Sent','Negotiating'].includes(l.status)).map(l => <option key={l._id} value={l._id}>{l.company} — {l.country}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Package</label>
          <select value={pkg} onChange={e => setPkg(e.target.value)} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30">
            <option>Starter Cloud Office</option><option>Secure Business Cloud</option><option>AI-Ready Enterprise</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">Users</label>
            <input type="number" value={users} onChange={e => setUsers(e.target.value)} min="1" className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30">
              {['USD','NGN','GHS','KES','ZAR'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Setup Fee ({sym})</label>
          <input type="number" value={setup} onChange={e => setSetup(e.target.value)} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
        </div>
        <button onClick={() => window.print()} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">Generate & Print PDF</button>
      </div>
      <div className="rounded-xl border border-border bg-secondary/30 p-5">
        <div className="mb-4 border-b border-border pb-4">
          <div className="text-lg font-bold text-foreground">GoLive Digital Solutions</div>
          <div className="text-xs text-muted-foreground">RC1644767 · CSP Partner ID: 6787357</div>
        </div>
        <h3 className="mb-4 text-base font-semibold text-foreground">Microsoft 365 Proposal</h3>
        {lead && <div className="mb-3 text-sm text-muted-foreground">For: <strong className="text-foreground">{lead.company}</strong> — {lead.contact}</div>}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Package</span><span className="font-medium">{pkg}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Users</span><span className="font-medium">{users}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Per user/month</span><span className="font-medium">{sym}{pricePerUser.toLocaleString()}</span></div>
          <div className="flex justify-between border-t border-border pt-2"><span className="text-muted-foreground">Monthly total</span><span className="text-lg font-bold">{sym}{monthlyTotal.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Annual (10 months)</span><span className="font-semibold">{sym}{annualTotal.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Setup fee</span><span className="font-medium">{sym}{parseInt(setup||'0').toLocaleString()}</span></div>
        </div>
        <div className="mt-4 rounded-lg bg-primary/10 p-3 text-xs text-primary">Valid 14 days · Migration included · NDPA 2023 compliant</div>
      </div>
    </div>
  )
}

const CHECKLIST = [
  { phase: 'Setup (Days 1-2)', items: ['Create Microsoft 365 tenant','Verify custom domain','Create all user accounts','Configure Teams and SharePoint','Set up shared mailboxes'] },
  { phase: 'Migration (Days 3-5)', items: ['Back up existing emails','Import emails to Microsoft 365','Update MX records','Configure SPF record','Configure DKIM signing','Configure DMARC policy'] },
  { phase: 'Security (Days 5-6)', items: ['Enable MFA for all users','Configure Conditional Access','Set up Microsoft Defender','Configure anti-phishing policies','Review Microsoft Secure Score'] },
  { phase: 'Training (Days 7-14)', items: ['Run staff Outlook training','Run Teams training session','Run OneDrive training','Admin training session','Hand over credentials and docs','Schedule 30-day check-in'] },
]

function OnboardingChecklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const total = CHECKLIST.reduce((s, p) => s + p.items.length, 0)
  const done = checked.size
  return (
    <div className="p-5">
      <div className="mb-4 flex items-center gap-3">
        <p className="text-xs text-muted-foreground">{done}/{total} tasks completed</p>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
          <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${(done/total)*100}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CHECKLIST.map(phase => (
          <div key={phase.phase} className="rounded-xl border border-border bg-secondary/30 p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">{phase.phase}</h3>
            <ul className="space-y-2">
              {phase.items.map(item => {
                const key = `${phase.phase}-${item}`
                const isDone = checked.has(key)
                return (
                  <li key={item} className="flex cursor-pointer items-center gap-3" onClick={() => { const n = new Set(checked); isDone ? n.delete(key) : n.add(key); setChecked(n) }}>
                    <div className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${isDone ? 'border-primary bg-primary' : 'border-border bg-card'}`}>
                      {isDone && <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`text-sm ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{item}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
