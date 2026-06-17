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
  contact: string; email: string; phone: string; domain: string; users: string
  country: string; status: string; createdAt: string; currentProvider?: string; notes?: string
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

  const [showNewLead, setShowNewLead] = useState(false)
  const [newLeadForm, setNewLeadForm] = useState({ company: '', contact: '', email: '', phone: '', country: 'Nigeria', industry: '', users: '', currentEmail: '', notes: '' })
  const [newLeadLoading, setNewLeadLoading] = useState(false)
  const [newLeadError, setNewLeadError] = useState('')

  const submitNewLead = async (e: React.FormEvent) => {
    e.preventDefault()
    setNewLeadLoading(true)
    setNewLeadError('')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newLeadForm, services: [newLeadForm.currentEmail], source: 'portal' })
      })
      const data = await res.json()
      if (data.success) {
        setShowNewLead(false)
        setNewLeadForm({ company: '', contact: '', email: '', phone: '', country: 'Nigeria', industry: '', users: '', currentEmail: '', notes: '' })
        setPage('assessments')
        fetchData()
      } else setNewLeadError('Failed to save lead. Please try again.')
    } catch { setNewLeadError('Network error. Please try again.') }
    setNewLeadLoading(false)
  }

  const inp = "w-full rounded-lg border border-[#e3e9f0] bg-white px-3 py-2 text-sm text-[#0d2233] outline-none focus:border-[#0096c7] focus:ring-2 focus:ring-[#0096c7]/20"

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
        <Topbar page={page} onNavigate={setPage} onNewLead={() => setShowNewLead(true)} />
        <main className="mx-auto max-w-[1600px] space-y-6 px-5 py-6 md:px-8">

          {/* NEW LEAD MODAL */}
          {showNewLead && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,34,51,0.6)', backdropFilter: 'blur(4px)' }}>
              <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#e3e9f0] px-6 py-4">
                  <div>
                    <h2 className="text-base font-semibold text-[#0d2233]">Add New Lead</h2>
                    <p className="text-xs text-[#5c7184]">Manually add a lead from a call, referral or event</p>
                  </div>
                  <button onClick={() => setShowNewLead(false)} className="flex size-8 items-center justify-center rounded-lg hover:bg-[#f4f7fb] text-[#5c7184] text-lg">×</button>
                </div>
                <form onSubmit={submitNewLead} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-[#0d2233]">Company name *</label>
                      <input required className={inp} placeholder="Acme Ltd" value={newLeadForm.company} onChange={e => setNewLeadForm(f => ({...f, company: e.target.value}))} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#0d2233]">Contact name *</label>
                      <input required className={inp} placeholder="Jane Doe" value={newLeadForm.contact} onChange={e => setNewLeadForm(f => ({...f, contact: e.target.value}))} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#0d2233]">Email *</label>
                      <input required type="email" className={inp} placeholder="jane@company.com" value={newLeadForm.email} onChange={e => setNewLeadForm(f => ({...f, email: e.target.value}))} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#0d2233]">WhatsApp / Phone</label>
                      <input className={inp} placeholder="+234..." value={newLeadForm.phone} onChange={e => setNewLeadForm(f => ({...f, phone: e.target.value}))} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#0d2233]">Country</label>
                      <select className={inp} value={newLeadForm.country} onChange={e => setNewLeadForm(f => ({...f, country: e.target.value}))}>
                        {['Nigeria','Ghana','Kenya','South Africa','Tanzania','Uganda','Rwanda','Egypt','Other'].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#0d2233]">Industry</label>
                      <select className={inp} value={newLeadForm.industry} onChange={e => setNewLeadForm(f => ({...f, industry: e.target.value}))}>
                        <option value="">Select industry</option>
                        {['Legal','Education / Schools','Religious / Churches','Healthcare / Clinics','Financial Services','Retail & E-commerce','Manufacturing','Government / NGO','Other'].map(i => <option key={i}>{i}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#0d2233]">Number of users *</label>
                      <select required className={inp} value={newLeadForm.users} onChange={e => setNewLeadForm(f => ({...f, users: e.target.value}))}>
                        <option value="">Select range</option>
                        {['1–5','6–20','21–50','51–100','100+'].map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#0d2233]">Current email provider</label>
                      <select className={inp} value={newLeadForm.currentEmail} onChange={e => setNewLeadForm(f => ({...f, currentEmail: e.target.value}))}>
                        <option value="">Select provider</option>
                        {['Google Workspace','cPanel / Webmail','Microsoft 365 (existing)','Zoho Mail','Other / None'].map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-[#0d2233]">Notes</label>
                      <textarea className={`${inp} min-h-16 resize-none`} placeholder="How did you meet them? What are their key needs?" value={newLeadForm.notes} onChange={e => setNewLeadForm(f => ({...f, notes: e.target.value}))} />
                    </div>
                  </div>
                  {newLeadError && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-600">{newLeadError}</p>}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowNewLead(false)} className="flex-1 rounded-lg border border-[#e3e9f0] px-4 py-2.5 text-sm font-medium text-[#5c7184] hover:bg-[#f4f7fb]">Cancel</button>
                    <button type="submit" disabled={newLeadLoading} className="flex-1 rounded-lg bg-[#0096c7] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0096c7]/90 disabled:opacity-60">
                      {newLeadLoading ? 'Saving...' : 'Save Lead'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

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
                    {['Ref','Company','Contact','Country','Users','Status','Date','Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">Loading...</td></tr>
                    : leads.length === 0 ? <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No leads yet</td></tr>
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
                        <td className="px-4 py-3">
                          {lead.status === 'Won' && (
                            <button onClick={() => setPage('customers')}
                              className="rounded-lg bg-green-50 px-3 py-1 text-[11px] font-semibold text-green-700 hover:bg-green-100 ring-1 ring-green-200">
                              ✦ Convert
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {page === 'transfers' && (
            <TransfersView transfers={transfers} loading={loading} onUpdate={fetchData} />
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

function TransfersView({ transfers, loading, onUpdate }: { transfers: Transfer[]; loading: boolean; onUpdate: () => void }) {
  const [selected, setSelected] = useState<Transfer | null>(null)

  const TYPE_LABELS: Record<string, { label: string; color: string }> = {
    csp:    { label: 'CSP Transfer',   color: 'bg-blue-50 text-blue-700' },
    google: { label: 'Google → M365', color: 'bg-red-50 text-red-700' },
    cpanel: { label: 'cPanel Upgrade', color: 'bg-orange-50 text-orange-700' },
  }
  const STATUS_LABELS: Record<string, string> = {
    new: 'New', contacted: 'Contacted', in_progress: 'In Progress', completed: 'Completed', lost: 'Lost'
  }

  return (
    <div className="flex gap-4">
      {/* Table */}
      <div className={`rounded-2xl border border-border bg-white shadow-sm ${selected ? 'flex-1' : 'w-full'}`}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">Sales</p>
            <h2 className="mt-0.5 text-base font-semibold text-foreground">Transfer Requests</h2>
            <p className="text-xs text-muted-foreground">{transfers.length} total — <a href="/migrate" target="_blank" className="text-primary hover:underline">View /migrate page →</a></p>
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
              : transfers.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center">
                  <div className="text-3xl mb-2">🔄</div>
                  <div className="text-sm font-medium text-foreground mb-1">No transfer requests yet</div>
                  <div className="text-xs text-muted-foreground">Requests submitted at <a href="/migrate" className="text-primary hover:underline">cloud.golivecompany.com/migrate</a> will appear here</div>
                </td></tr>
              ) : transfers.map(t => {
                const tc = TYPE_LABELS[t.transferType] || { label: t.transferType, color: 'bg-gray-50 text-gray-600' }
                const isSelected = selected?._id === t._id
                return (
                  <tr key={t._id} onClick={() => setSelected(isSelected ? null : t)}
                    className={`border-b border-border/50 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : 'hover:bg-secondary/30'}`}>
                    <td className="px-4 py-3 font-mono text-[11px] text-primary">{t.ref}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tc.color}`}>{tc.label}</span></td>
                    <td className="px-4 py-3 font-medium text-foreground">{t.company}<div className="text-[11px] text-muted-foreground">{t.contact}</div></td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{t.domain}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{t.country}</td>
                    <td className="px-4 py-3">
                      <select value={t.status} onClick={e => e.stopPropagation()} onChange={async e => {
                        await fetch('/api/transfers', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id: t._id, status: e.target.value }) })
                        onUpdate()
                      }} className="rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-[11px] font-semibold border-0 outline-none cursor-pointer">
                        {Object.entries(STATUS_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-80 shrink-0 rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-foreground">Request Details</h3>
            <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Reference</div>
              <div className="font-mono text-sm text-primary">{selected.ref}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Type</div>
              <div className="text-sm font-medium">{TYPE_LABELS[selected.transferType]?.label || selected.transferType}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Company</div>
              <div className="text-sm font-semibold text-foreground">{selected.company}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Contact</div>
              <div className="text-sm">{selected.contact}</div>
              <div className="text-xs text-primary">{selected.email}</div>
            {selected.phone && (
              <div className="text-xs text-muted-foreground">{selected.phone}</div>
            )}
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Domain</div>
              <div className="font-mono text-sm text-muted-foreground">{selected.domain}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Users</div>
                <div className="text-sm">{selected.users}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Country</div>
                <div className="text-sm">{selected.country}</div>
              </div>
            </div>
            {selected.currentProvider && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Current Provider</div>
                <div className="text-sm">{selected.currentProvider}</div>
              </div>
            )}
            {selected.notes && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Notes</div>
                <div className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3">{selected.notes}</div>
              </div>
            )}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Received</div>
              <div className="text-xs text-muted-foreground">{new Date(selected.createdAt).toLocaleString()}</div>
            </div>
            <div className="pt-2 space-y-2">
              <a href={`mailto:${selected.email}?subject=Re: Your Microsoft 365 Migration Request (${selected.ref})&body=Dear ${selected.contact},%0A%0AThank you for submitting a migration request to GoLive Digital Solutions.%0A%0AWe have reviewed your request and would like to schedule a call to discuss the next steps.%0A%0ARef: ${selected.ref}%0A%0ABest regards,%0AGoLive Digital Solutions Team`}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90">
                ✉️ Send email response
              </a>
              <a href={`https://wa.me/${selected.phone?.replace(/\D/g,'') || ''}?text=Hi ${selected.contact}, this is GoLive Digital Solutions regarding your migration request (${selected.ref}). We'd like to discuss the next steps.`}
                target="_blank" rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25d366] px-3 py-2 text-xs font-semibold text-white hover:bg-[#25d366]/90">
                💬 WhatsApp response
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProposalContent({ leads }: { leads: Lead[] }) {
  const [selectedLead, setSelectedLead] = useState('')
  const [pkg, setPkg] = useState('Secure Business Cloud')
  const [users, setUsers] = useState('10')
  const [currency, setCurrency] = useState('USD')
  const [setup, setSetup] = useState('300')

  const handleLeadSelect = (leadId: string) => {
    setSelectedLead(leadId)
    const lead = leads.find(l => l._id === leadId)
    if (!lead) return
    // Auto-populate users from lead data
    const userRange = lead.users || ''
    const userNum = userRange.includes('–') ? userRange.split('–')[1] : userRange.replace('+', '')
    const parsed = parseInt(userNum)
    if (!isNaN(parsed)) setUsers(String(parsed))
    // Auto-set currency based on country
    const currencyMap: Record<string, string> = { Nigeria: 'NGN', Ghana: 'GHS', Kenya: 'KES', 'South Africa': 'ZAR' }
    if (currencyMap[lead.country]) setCurrency(currencyMap[lead.country])
    // Auto-set setup fee based on likely package
    const emailProvider = (lead.services?.[0] || (lead as any).currentEmail || '').toLowerCase()
    if (emailProvider.includes('google')) { setPkg('Secure Business Cloud'); setSetup('300') }
    else if (emailProvider.includes('cpanel') || emailProvider.includes('webmail')) { setPkg('Starter Cloud Office'); setSetup('150') }
    else { setPkg('Secure Business Cloud'); setSetup('300') }
  }

  const prices: Record<string, Record<string, number>> = {
    'Starter Cloud Office': { USD: 6, NGN: 9600, GHS: 90, KES: 774, ZAR: 108 },
    'Secure Business Cloud': { USD: 22, NGN: 35200, GHS: 330, KES: 2838, ZAR: 396 },
    'AI-Ready Enterprise': { USD: 38, NGN: 60800, GHS: 570, KES: 4902, ZAR: 684 },
  }
  const symbols: Record<string, string> = { USD: '$', NGN: '₦', GHS: 'GH₵', KES: 'KSh', ZAR: 'R' }
  const pkgFeatures: Record<string, string[]> = {
    'Starter Cloud Office': ['Microsoft 365 Business Basic','Custom domain business email','1 TB OneDrive per user','Teams, Word, Excel & PowerPoint (web)','DNS setup & email migration','SPF / DKIM / DMARC configuration','30-day onboarding support'],
    'Secure Business Cloud': ['Microsoft 365 Business Premium','Microsoft Defender for Business','Desktop Office apps + 1 TB storage','Multi-Factor Authentication (MFA)','Conditional Access & data loss prevention','Email security hardening','Monthly managed support'],
    'AI-Ready Enterprise': ['Microsoft 365 + Copilot licensing','Azure cloud & infrastructure','Defender for Office, Endpoint & Cloud','Power Platform automation','Dedicated account manager','Architecture & compliance review','Premium managed support'],
  }
  const pricePerUser = prices[pkg]?.[currency] || 0
  const userCount = parseInt(users) || 0
  const monthlyTotal = pricePerUser * userCount
  const annualTotal = monthlyTotal * 10
  const setupFee = parseInt(setup || '0')
  const sym = symbols[currency]
  const lead = leads.find(l => l._id === selectedLead)
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const expiry = new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const proposalRef = `GL-PROP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

  const printProposal = () => {
    const printContent = document.getElementById('proposal-print')?.innerHTML
    if (!printContent) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html><html><head>
      <title>GoLive Proposal — ${lead?.company || 'Client'}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #0d2233; background: #fff; }
        .page { max-width: 800px; margin: 0 auto; padding: 48px 48px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 3px solid #0096c7; margin-bottom: 32px; }
        .logo-area { display: flex; flex-direction: column; gap: 4px; }
        .company-name { font-size: 24px; font-weight: 800; color: #0d2233; }
        .company-sub { font-size: 11px; color: #5c7184; }
        .ms-badge { display: flex; align-items: center; gap: 8px; background: #f0f8ff; border: 1px solid #c8e6f0; border-radius: 8px; padding: 8px 14px; }
        .ms-logo { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; width: 20px; height: 20px; }
        .ms-logo span { display: block; border-radius: 1px; }
        .ms-badge-text { font-size: 10px; font-weight: 600; color: #0d2233; line-height: 1.3; }
        .proposal-title { font-size: 20px; font-weight: 700; color: #0096c7; margin-bottom: 4px; }
        .proposal-ref { font-size: 11px; color: #5c7184; margin-bottom: 24px; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
        .meta-card { background: #f4f7fb; border-radius: 8px; padding: 14px 16px; }
        .meta-label { font-size: 10px; font-weight: 700; color: #5c7184; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .meta-value { font-size: 13px; font-weight: 600; color: #0d2233; }
        .section-title { font-size: 13px; font-weight: 700; color: #0d2233; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e3e9f0; }
        .pricing-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .pricing-table td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
        .pricing-table td:last-child { text-align: right; font-weight: 500; }
        .pricing-table .total-row td { font-size: 16px; font-weight: 800; color: #0096c7; border-bottom: none; padding-top: 14px; }
        .features { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 32px; }
        .feature { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: #333; }
        .check { color: #00c8c8; font-weight: 700; flex-shrink: 0; }
        .footer-box { background: #0d2233; color: #fff; border-radius: 10px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; margin-top: 32px; }
        .footer-text { font-size: 11px; color: rgba(255,255,255,0.7); line-height: 1.6; }
        .validity { background: #e8f4fb; border-left: 3px solid #0096c7; border-radius: 0 6px 6px 0; padding: 12px 16px; margin-bottom: 24px; font-size: 12px; color: #0d2233; }
        .ndpr { font-size: 10px; color: rgba(255,255,255,0.5); }
      </style>
      </head><body>
      <div class="page">
        <div class="header">
          <div class="logo-area">
            <img src="https://cloud.golivecompany.com/images/logo-dark.png" style="height:80px;width:auto;" alt="GoLive" onerror="this.style.display='none'" />
            <div class="company-sub">RC1644767 · 7 Ibiyinka Olorunbe Close, Victoria Island, Lagos</div>
            <div class="company-sub">contact@golivecompany.com · +234 808 358 7801</div>
          </div>
          <div class="ms-badge">
            <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
              <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
            <div class="ms-badge-text">Authorized Microsoft<br/>CSP Partner · ID 6787357</div>
          </div>
        </div>

        <div class="proposal-title">Microsoft 365 Proposal</div>
        <div class="proposal-ref">Ref: ${proposalRef} · Prepared: ${today} · Valid until: ${expiry}</div>

        <div class="meta-grid">
          <div class="meta-card">
            <div class="meta-label">Prepared for</div>
            <div class="meta-value">${lead?.company || '—'}</div>
            <div style="font-size:12px;color:#5c7184;margin-top:2px">${lead?.contact || ''}</div>
            <div style="font-size:12px;color:#5c7184;">${lead?.email || ''}</div>
            ${lead?.phone ? `<div style="font-size:12px;color:#5c7184;">${lead.phone}</div>` : ''}
            <div style="font-size:12px;color:#5c7184;">${lead?.country || ''}${lead?.industry ? ' · ' + lead.industry : ''}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Package</div>
            <div class="meta-value">${pkg}</div>
            <div style="font-size:12px;color:#5c7184;margin-top:2px">${userCount} users · Billed in ${currency}</div>
            ${lead?.services?.[0] ? `<div style="font-size:11px;color:#0096c7;margin-top:4px">Migrating from: ${lead.services[0]}</div>` : ''}
          </div>
        </div>

        <div class="section-title">Pricing Summary</div>
        <table class="pricing-table">
          <tr><td style="color:#5c7184">Package</td><td>${pkg}</td></tr>
          <tr><td style="color:#5c7184">Number of users</td><td>${userCount}</td></tr>
          <tr><td style="color:#5c7184">Price per user / month</td><td>${sym}${pricePerUser.toLocaleString()}</td></tr>
          <tr><td style="color:#5c7184">Monthly subscription total</td><td>${sym}${monthlyTotal.toLocaleString()}</td></tr>
          <tr><td style="color:#5c7184">Annual plan (10 months — 2 months free)</td><td>${sym}${annualTotal.toLocaleString()}</td></tr>
          <tr><td style="color:#5c7184">One-time setup & migration fee</td><td>${sym}${setupFee.toLocaleString()}</td></tr>
          <tr class="total-row"><td>Total first year investment</td><td>${sym}${(annualTotal + setupFee).toLocaleString()}</td></tr>
        </table>

        <div class="section-title">What's Included</div>
        <div class="features">
          ${(pkgFeatures[pkg] || []).map(f => `<div class="feature"><span class="check">✓</span><span>${f}</span></div>`).join('')}
        </div>

        <div class="validity">
          ⏱ This proposal is valid for 14 days from ${today}. Annual plan discount (2 months free) applies when signed before ${expiry}.
        </div>

        <div class="footer-box">
          <div class="footer-text">
            <strong style="color:#fff">The GoLive Digital Solutions Company Ltd.</strong><br/>
            RC1644767 · Microsoft CSP Partner ID: 6787357<br/>
            cloud.golivecompany.com · contact@golivecompany.com
          </div>
          <div class="ndpr">NDPA 2023 Compliant<br/>Migration Included<br/>30-Day Support</div>
        </div>
      </div>
      </body></html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 500)
  }

  return (
    <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Select Lead</label>
          <select value={selectedLead} onChange={e => handleLeadSelect(e.target.value)} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30">
            <option value="">Select a lead...</option>
            {leads.filter(l => !['Won','Lost'].includes(l.status)).map(l => <option key={l._id} value={l._id}>{l.company} — {l.country} ({l.status})</option>)}
          </select>
          {lead && (
            <div className="mt-2 rounded-lg bg-[#e8f4fb] border border-[#c8e6f0] px-3 py-2 text-xs">
              <div className="font-semibold text-[#0d2233]">{lead.company}</div>
              <div className="text-[#5c7184]">{lead.contact} · {lead.email}</div>
              {lead.phone && <div className="text-[#5c7184]">{lead.phone}</div>}
              <div className="text-[#5c7184]">{lead.industry} · {lead.users} users · {lead.country}</div>
              {(lead.services?.[0] || (lead as any).currentEmail) && <div className="text-[#0096c7] mt-0.5">Current: {lead.services?.[0] || (lead as any).currentEmail}</div>}
            </div>
          )}
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
        <button onClick={printProposal} disabled={!selectedLead}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed">
          🖨️ Generate & Print PDF
        </button>
        {!selectedLead && <p className="text-center text-xs text-muted-foreground">Select a lead to enable proposal generation</p>}
      </div>

      {/* Preview */}
      <div id="proposal-print" className="rounded-xl border border-border bg-white p-5 text-sm">
        <div className="flex items-start justify-between border-b border-border pb-4 mb-4">
          <div>
            <img src="/images/logo-dark.png" alt="GoLive" style={{ height: 60, width: 'auto' }} />
            <div className="text-[10px] text-muted-foreground mt-1">RC1644767 · contact@golivecompany.com</div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-[#f0f8ff] px-3 py-2">
            <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
              <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
            <div className="text-[10px] font-semibold text-foreground leading-tight">Authorized Microsoft<br/>CSP · ID 6787357</div>
          </div>
        </div>
        <div className="text-base font-bold text-foreground mb-1">Microsoft 365 Proposal</div>
        <div className="text-[10px] text-muted-foreground mb-4">Ref: {proposalRef} · Valid 14 days from {today}</div>
        {lead && <div className="mb-3 rounded-lg bg-secondary/50 px-3 py-2 text-xs"><span className="text-muted-foreground">Prepared for: </span><strong>{lead.company}</strong> — {lead.contact}</div>}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-border/50"><span className="text-muted-foreground">Package</span><span className="font-medium">{pkg}</span></div>
          <div className="flex justify-between py-1 border-b border-border/50"><span className="text-muted-foreground">Users</span><span className="font-medium">{users}</span></div>
          <div className="flex justify-between py-1 border-b border-border/50"><span className="text-muted-foreground">Per user / month</span><span className="font-medium">{sym}{pricePerUser.toLocaleString()}</span></div>
          <div className="flex justify-between py-1 border-b border-border/50"><span className="text-muted-foreground">Monthly total</span><span className="font-semibold text-sm">{sym}{monthlyTotal.toLocaleString()}</span></div>
          <div className="flex justify-between py-1 border-b border-border/50"><span className="text-muted-foreground">Annual (10 months)</span><span className="font-semibold">{sym}{annualTotal.toLocaleString()}</span></div>
          <div className="flex justify-between py-1 border-b border-border/50"><span className="text-muted-foreground">Setup fee</span><span className="font-medium">{sym}{setupFee.toLocaleString()}</span></div>
          <div className="flex justify-between py-2 mt-1"><span className="font-bold text-foreground">Total first year</span><span className="font-bold text-primary text-base">{sym}{(annualTotal + setupFee).toLocaleString()}</span></div>
        </div>
        <div className="mt-3 rounded-lg bg-primary/10 p-2.5 text-[10px] text-primary">✓ Migration included &nbsp;·&nbsp; ✓ NDPA 2023 compliant &nbsp;·&nbsp; ✓ 30-day support</div>
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
