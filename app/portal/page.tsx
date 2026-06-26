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
import { SUPPORTED_CURRENCIES, currencyForCountry, CURRENCY_SYMBOLS, convertFromUSD } from '@/lib/currency'
import CommissionDashboard from '@/components/dashboard/CommissionDashboard'
import AnnouncementsPanel from '@/components/dashboard/AnnouncementsPanel'
import KnowledgeBase from '@/components/dashboard/KnowledgeBase'
import LeadAssign from '@/components/dashboard/LeadAssign'
import TransferAssign from '@/components/dashboard/TransferAssign'
import AccountSettings from '@/components/dashboard/AccountSettings'
import PricingCatalogAdmin from '@/components/dashboard/PricingCatalogAdmin'

export const dynamic = 'force-dynamic'

interface Lead {
  _id: string; ref: string; company: string; contact: string; email: string
  phone: string; country: string; industry: string; users: string
  services: string[]; status: string; createdAt: string; assignedTo?: string; assignedToEmail?: string
  convertedToCustomer?: boolean
}
interface Customer {
  _id: string; company: string; tenantDomain: string; package: string
  users: number; mrr: number; arr: number; renewalDate: string
  healthScore: string; country: string; status: string
  contact?: string; adminEmail?: string; phone?: string
  cspOnboarding?: {
    hasExistingTenant: boolean; companyRegistrationId?: string; vatNumber?: string
    preferredDomain?: string; secondChoiceDomain?: string; thirdChoiceDomain?: string
    physicalAddress?: string; city?: string; postalCode?: string
  }
}
interface Transfer {
  _id: string; ref: string; transferType: string; company: string
  contact: string; email: string; phone: string; domain: string; users: string
  country: string; status: string; createdAt: string; currentProvider?: string; notes?: string
  assignedTo?: string; assignedToEmail?: string
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
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null)
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null)
  const [deletingLeadBusy, setDeletingLeadBusy] = useState(false)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)
  const [viewingCspInfo, setViewingCspInfo] = useState<Customer | null>(null)
  const [deletingCustomerBusy, setDeletingCustomerBusy] = useState(false)

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
      } else if (Array.isArray(data.errors) && data.errors.length > 0) {
        setNewLeadError(data.errors.map((e: { message: string }) => e.message).join(' · '))
      } else {
        setNewLeadError(data.error || 'Failed to save lead. Please try again.')
      }
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
              <StatCards isAdmin={isAdmin} />
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
                    {['Ref','Company','Contact','Country','Users','Assigned','Status','Date','Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">Loading...</td></tr>
                    : leads.length === 0 ? <tr><td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">No leads yet</td></tr>
                    : leads.map(lead => (
                      <tr key={lead._id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="px-4 py-3 font-mono text-[11px] text-primary">{lead.ref}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{lead.company}</td>
                        <td className="px-4 py-3 text-muted-foreground">{lead.contact}<div className="text-[11px]">{lead.email}</div></td>
                        <td className="px-4 py-3 text-muted-foreground">{lead.country}</td>
                        <td className="px-4 py-3">{lead.users}</td>
                        <td className="px-4 py-3">
                          <LeadAssign
                            leadId={lead._id}
                            currentAssignee={lead.assignedTo}
                            currentAssigneeEmail={lead.assignedToEmail}
                            userRole={role}
                            userName={(session?.user as any)?.name ?? ''}
                            userEmail={session?.user?.email ?? ''}
                            onAssigned={fetchData}
                          />
                        </td>
                        <td className="px-4 py-3">
                          {(isAdmin || (lead.assignedToEmail && lead.assignedToEmail === session?.user?.email)) ? (
                            <select value={lead.status} onChange={async e => {
                              await fetch(`/api/leads/${lead._id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: e.target.value }) })
                              fetchData()
                            }} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border-0 outline-none cursor-pointer ${STATUS_COLORS[lead.status] || 'bg-gray-50 text-gray-600'}`}>
                              {['New Lead','Assessment Done','Quote Sent','Negotiating','Won','Lost'].map(s => <option key={s}>{s}</option>)}
                            </select>
                          ) : (
                            <span title={lead.assignedTo ? `Only ${lead.assignedTo} or an admin can change this` : 'Assign this lead first to change its status'}
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold cursor-not-allowed opacity-70 ${STATUS_COLORS[lead.status] || 'bg-gray-50 text-gray-600'}`}>
                              🔒 {lead.status}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[11px] text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {lead.status === 'Won' && !lead.convertedToCustomer && (
                              <button onClick={() => setConvertingLead(lead)}
                                className="rounded-lg bg-green-50 px-3 py-1 text-[11px] font-semibold text-green-700 hover:bg-green-100 ring-1 ring-green-200">
                                ✦ Convert
                              </button>
                            )}
                            {lead.status === 'Won' && lead.convertedToCustomer && (
                              <span className="rounded-lg bg-gray-50 px-3 py-1 text-[11px] font-semibold text-gray-500 ring-1 ring-gray-200">
                                ✓ Converted
                              </span>
                            )}
                            {isAdmin && (
                              <button onClick={() => setDeletingLead(lead)}
                                className="rounded-lg bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100 ring-1 ring-red-200">
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {page === 'transfers' && (
            <TransfersView transfers={transfers} loading={loading} onUpdate={fetchData} isAdmin={isAdmin} userEmail={session?.user?.email ?? ''} userName={(session?.user as any)?.name ?? ''} />
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
                    {['Company','Tenant','Package','Users','MRR','Renewal','Health','Country','Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">Loading...</td></tr>
                    : customers.length === 0 ? <tr><td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">No customers yet</td></tr>
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
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              {c.cspOnboarding && !c.cspOnboarding.hasExistingTenant && (
                                <button onClick={() => setViewingCspInfo(c)}
                                  className="rounded-lg bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 ring-1 ring-blue-200">
                                  CSP Info
                                </button>
                              )}
                              {isAdmin && (
                                <button onClick={() => setDeletingCustomer(c)}
                                  className="rounded-lg bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100 ring-1 ring-red-200">
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {page === 'team' && isAdmin && (
            <TeamManagement users={users} loading={loading} onUpdate={fetchData} />
          )}

          {page === 'pricing' && isAdmin && (
            <PricingCatalogAdmin userRole={role} />
          )}

          {page === 'pipeline' && <KanbanBoard />}
          {page === 'commissions' && <CommissionDashboard userRole={role} userName={(session?.user as any)?.name ?? ''} userEmail={session?.user?.email ?? ''} />}
          {page === 'account' && <AccountSettings />}
          {page === 'announcements' && <AnnouncementsPanel userRole={role} userName={(session?.user as any)?.name ?? ''} />}
          {page === 'knowledge' && <KnowledgeBase userRole={role} userName={(session?.user as any)?.name ?? ''} />}

          {page === 'proposals' && (
            <div className="rounded-2xl border border-border bg-white shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">Tools</p>
                <h2 className="mt-0.5 text-base font-semibold text-foreground">Proposal Generator</h2>
              </div>
              <ProposalContent leads={leads} isAdmin={isAdmin} userEmail={session?.user?.email ?? ''} />
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

          {page === 'resources_cert' && (
            <CertificationPage role={role} />
          )}
        {convertingLead && (
          <ConvertModal
            lead={convertingLead}
            onClose={() => setConvertingLead(null)}
            onConverted={() => { setConvertingLead(null); fetchData(); setPage('customers') }}
          />
        )}
        {deletingLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="text-base font-semibold text-foreground mb-1">Delete this lead?</h2>
              <p className="text-sm text-muted-foreground mb-1">
                <strong className="text-foreground">{deletingLead.company}</strong> ({deletingLead.ref}) will be permanently removed. This cannot be undone.
              </p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setDeletingLead(null)} disabled={deletingLeadBusy}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary/40">
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setDeletingLeadBusy(true)
                    await fetch(`/api/leads/${deletingLead._id}`, { method: 'DELETE' })
                    setDeletingLeadBusy(false)
                    setDeletingLead(null)
                    fetchData()
                  }}
                  disabled={deletingLeadBusy}
                  className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60">
                  {deletingLeadBusy ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}
        {deletingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="text-base font-semibold text-foreground mb-1">Delete this customer?</h2>
              <p className="text-sm text-muted-foreground mb-1">
                <strong className="text-foreground">{deletingCustomer.company}</strong> will be permanently removed. This cannot be undone.
              </p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setDeletingCustomer(null)} disabled={deletingCustomerBusy}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary/40">
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setDeletingCustomerBusy(true)
                    await fetch(`/api/customers/${deletingCustomer._id}`, { method: 'DELETE' })
                    setDeletingCustomerBusy(false)
                    setDeletingCustomer(null)
                    fetchData()
                  }}
                  disabled={deletingCustomerBusy}
                  className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60">
                  {deletingCustomerBusy ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}

        {viewingCspInfo && (
          <CspInfoModal customer={viewingCspInfo} onClose={() => setViewingCspInfo(null)} />
        )}

        </main>
      </div>
    </div>
  )
}

function TransfersView({ transfers, loading, onUpdate, isAdmin, userEmail, userName }: { transfers: Transfer[]; loading: boolean; onUpdate: () => void; isAdmin: boolean; userEmail: string; userName: string }) {
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
              {['Ref','Type','Company','Domain','Country','Assigned','Status','Date'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">Loading...</td></tr>
              : transfers.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center">
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
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <TransferAssign transfer={t} isAdmin={isAdmin} userEmail={userEmail} userName={userName} onAssigned={onUpdate} />
                    </td>
                    <td className="px-4 py-3">
                      {(isAdmin || (t.assignedToEmail && t.assignedToEmail === userEmail)) ? (
                        <select value={t.status} onClick={e => e.stopPropagation()} onChange={async e => {
                          await fetch('/api/transfers', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id: t._id, status: e.target.value, updatedBy: userName }) })
                          onUpdate()
                        }} className="rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-[11px] font-semibold border-0 outline-none cursor-pointer">
                          {Object.entries(STATUS_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      ) : (
                        <span onClick={e => e.stopPropagation()} title={t.assignedTo ? `Only ${t.assignedTo} or an admin can change this` : 'Assign this transfer first to change its status'}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-[11px] font-semibold cursor-not-allowed opacity-70">
                          🔒 {STATUS_LABELS[t.status] || t.status}
                        </span>
                      )}
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

const NCE_OPTIONS = [
  {
    value: 'annual_upfront', label: 'Annual commitment — billed upfront', termDuration: 'P1Y', billingPlan: 'Annual',
    periodsPerYear: 1,
    note: 'Lowest total cost. 12-month term — licenses can be added anytime but the count cannot be reduced mid-term.',
  },
  {
    value: 'annual_monthly', label: 'Annual commitment — billed monthly', termDuration: 'P1Y', billingPlan: 'Monthly',
    periodsPerYear: 12,
    note: 'Same 12-month term as upfront, paid in 12 instalments — a small financing premium versus paying upfront.',
  },
  {
    value: 'flex_monthly', label: 'Monthly commitment — billed monthly', termDuration: 'P1M', billingPlan: 'Monthly',
    periodsPerYear: 12,
    note: 'Cancel anytime, no annual lock-in — costs about 20% more over a year than committing annually.',
  },
] as const

type NceOptionValue = typeof NCE_OPTIONS[number]['value']

// Maps a customer-facing package name to the real distributor SKU(s) that make
// it up. "AI-Ready Enterprise" uses the actual Microsoft bundle SKU rather than
// summing Business Premium + Copilot separately — the bundle is priced lower
// than the sum of its parts, so this also gets the customer a better number.
const PACKAGE_SKUS: Record<string, string[]> = {
  'Starter Cloud Office': ['Microsoft 365 Business Basic'],
  'Secure Business Cloud': ['Microsoft 365 Business Premium'],
  'AI-Ready Enterprise': ['Microsoft 365 Business Premium and Microsoft 365 Copilot Business'],
}

// Optional bolt-ons available on top of any package. These are real,
// separately-licensed SKUs — not bundled into any package price above.
// Azure is deliberately NOT here: it's consumption-billed (compute/storage
// usage varies monthly), so it can't be flat-rated per user like these can.
// It's surfaced as a manual "billed separately" note instead, further down.
const ADD_ONS: { key: string; label: string; skuTitle: string; blurb: string }[] = [
  { key: 'defenderOffice', label: 'Microsoft Defender for Office 365 (Plan 2)', skuTitle: 'Microsoft Defender for Office 365 (Plan 2)', blurb: 'Advanced anti-phishing, anti-malware & attack simulation for email' },
  { key: 'defenderEndpoint', label: 'Microsoft Defender for Endpoint (P2)', skuTitle: 'Microsoft Defender for Endpoint P2', blurb: 'Advanced threat detection & response across devices' },
  { key: 'defenderCloudApps', label: 'Microsoft Defender for Cloud Apps', skuTitle: 'Microsoft Defender for Cloud Apps', blurb: 'Visibility & control over third-party cloud app usage (shadow IT)' },
  { key: 'powerAutomate', label: 'Power Automate (per user plan)', skuTitle: 'Power Automate per user plan', blurb: 'Workflow automation across Microsoft & third-party apps' },
  { key: 'powerApps', label: 'Power Apps (per app plan)', skuTitle: 'Power Apps per app plan (1 app or website)', blurb: 'Build custom business apps with low-code tools' },
]

const PROPOSAL_CUSTOMER_TYPE = 'corporate' // academic/charity pricing can be wired in later if needed

interface CatalogPriceRow {
  skuTitle: string
  termDuration: string
  billingPlan: string
  retailUSD: number
  marginUSD: number
  marginPercent: number
}

function ProposalContent({ leads, isAdmin, userEmail }: { leads: Lead[]; isAdmin: boolean; userEmail: string }) {
  const [selectedLead, setSelectedLead] = useState('')
  const [pkg, setPkg] = useState('Secure Business Cloud')
  const [users, setUsers] = useState('10')
  const [currency, setCurrency] = useState('USD')
  const [setup, setSetup] = useState('300')
  const [billingOption, setBillingOption] = useState<NceOptionValue>('annual_upfront')
  const [catalogRows, setCatalogRows] = useState<CatalogPriceRow[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [fxRates, setFxRates] = useState<Record<string, number>>({ NGN: 1 })
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, boolean>>({})
  const [azureNote, setAzureNote] = useState('')

  useEffect(() => {
    const allSkus = Array.from(new Set([...Object.values(PACKAGE_SKUS).flat(), ...ADD_ONS.map(a => a.skuTitle)]))
    const params = new URLSearchParams({ skuTitles: allSkus.join(','), customerType: PROPOSAL_CUSTOMER_TYPE, limit: '100' })
    fetch(`/api/pricing-catalog?${params.toString()}`)
      .then(r => r.json())
      .then(data => setCatalogRows(Array.isArray(data?.items) ? data.items : []))
      .catch(() => {})
      .finally(() => setCatalogLoading(false))

    fetch('/api/exchange-rates')
      .then(r => r.json())
      .then(data => { if (data?.success) setFxRates(data.rates || { NGN: 1 }) })
      .catch(() => {})
  }, [])

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
    setCurrency(currencyForCountry(lead.country))
    // Auto-set setup fee based on likely package
    const emailProvider = (lead.services?.[0] || (lead as any).currentEmail || '').toLowerCase()
    if (emailProvider.includes('google')) { setPkg('Secure Business Cloud'); setSetup('300') }
    else if (emailProvider.includes('cpanel') || emailProvider.includes('webmail')) { setPkg('Starter Cloud Office'); setSetup('150') }
    else { setPkg('Secure Business Cloud'); setSetup('300') }
  }

  const pkgFeatures: Record<string, string[]> = {
    'Starter Cloud Office': ['Microsoft 365 Business Basic','Custom domain business email','1 TB OneDrive per user','Teams, Word, Excel & PowerPoint (web)','DNS setup & email migration','SPF / DKIM / DMARC configuration','30-day onboarding support'],
    'Secure Business Cloud': ['Microsoft 365 Business Premium','Microsoft Defender for Business','Desktop Office apps + 1 TB storage','Multi-Factor Authentication (MFA)','Conditional Access & data loss prevention','Email security hardening','Monthly managed support'],
    'AI-Ready Enterprise': ['Microsoft 365 Business Premium (desktop apps, Exchange, SharePoint, Teams)','Microsoft 365 Copilot in Word, Excel, PowerPoint, Outlook & Teams','Copilot Chat with web grounding','Microsoft Defender for Business','Multi-Factor Authentication & Conditional Access','Data loss prevention & email security hardening','Premium managed support'],
  }

  const nce = NCE_OPTIONS.find(o => o.value === billingOption)!
  const skusForPkg = PACKAGE_SKUS[pkg] || []

  function findRow(skuTitle: string): CatalogPriceRow | undefined {
    return catalogRows.find(r => r.skuTitle === skuTitle && r.termDuration === nce.termDuration && r.billingPlan === nce.billingPlan)
  }

  const pricePerUserUSD = skusForPkg.reduce((sum, sku) => sum + (findRow(sku)?.retailUSD || 0), 0)
  const marginPerUserUSD = skusForPkg.reduce((sum, sku) => sum + (findRow(sku)?.marginUSD || 0), 0)
  const blendedMarginPercent = pricePerUserUSD > 0 ? marginPerUserUSD / pricePerUserUSD : 0
  const catalogMissing = !catalogLoading && skusForPkg.length > 0 && pricePerUserUSD === 0

  const activeAddOns = ADD_ONS.filter(a => selectedAddOns[a.key])
  const addOnRows = activeAddOns.map(a => ({ ...a, row: findRow(a.skuTitle) }))
  const addOnsMissing = !catalogLoading && addOnRows.some(a => !a.row)
  const addOnsPerUserUSD = addOnRows.reduce((sum, a) => sum + (a.row?.retailUSD || 0), 0)
  const addOnsMarginPerUserUSD = addOnRows.reduce((sum, a) => sum + (a.row?.marginUSD || 0), 0)
  const addOnsPerUserConverted = convertFromUSD(addOnsPerUserUSD, currency, fxRates)

  const pricePerUserConverted = convertFromUSD(pricePerUserUSD, currency, fxRates)
  const userCount = parseInt(users) || 0
  const packagePeriodTotal = pricePerUserConverted * userCount
  const addOnsPeriodTotal = addOnsPerUserConverted * userCount
  const periodTotal = packagePeriodTotal + addOnsPeriodTotal // amount per billed period (the period this NCE option actually bills in)
  const annualTotal = periodTotal * nce.periodsPerYear
  const setupFee = parseInt(setup || '0')
  const sym = CURRENCY_SYMBOLS[currency] || currency + ' '
  const periodLabel = nce.periodsPerYear === 1 ? '/ user / year' : '/ user / month'
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
            <div style="font-size:12px;color:#5c7184;margin-top:2px">${userCount} users · Billed in ${currency} · ${nce.label}</div>
            ${lead?.services?.[0] ? `<div style="font-size:11px;color:#0096c7;margin-top:4px">Migrating from: ${lead.services[0]}</div>` : ''}
          </div>
        </div>

        <div class="section-title">Pricing Summary</div>
        <table class="pricing-table">
          <tr><td style="color:#5c7184">Package</td><td>${pkg}</td></tr>
          <tr><td style="color:#5c7184">Billing plan</td><td>${nce.label}</td></tr>
          <tr><td style="color:#5c7184">Number of users</td><td>${userCount}</td></tr>
          <tr><td style="color:#5c7184">Package price per user</td><td>${sym}${pricePerUserConverted.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${periodLabel}</td></tr>
          ${activeAddOns.length > 0 ? `<tr><td style="color:#5c7184">Add-ons: ${activeAddOns.map(a => a.label).join(', ')}</td><td>${sym}${addOnsPerUserConverted.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${periodLabel}</td></tr>` : ''}
          <tr><td style="color:#5c7184">${nce.periodsPerYear === 1 ? 'Annual subscription total' : 'Monthly subscription total'}</td><td>${sym}${periodTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td></tr>
          ${nce.periodsPerYear > 1 ? `<tr><td style="color:#5c7184">12-month subscription total</td><td>${sym}${annualTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td></tr>` : ''}
          <tr><td style="color:#5c7184">One-time setup & migration fee</td><td>${sym}${setupFee.toLocaleString()}</td></tr>
          <tr class="total-row"><td>Total first year investment</td><td>${sym}${(annualTotal + setupFee).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td></tr>
        </table>
        ${azureNote.trim() ? `<div class="validity" style="margin-bottom:16px;">☁ Azure: ${azureNote} — billed separately and directly by Microsoft based on actual consumption. Not included in the totals above.</div>` : ''}

        <div class="section-title">What's Included</div>
        <div class="features">
          ${(pkgFeatures[pkg] || []).map(f => `<div class="feature"><span class="check">✓</span><span>${f}</span></div>`).join('')}
          ${activeAddOns.map(a => `<div class="feature"><span class="check">✓</span><span>${a.label}</span></div>`).join('')}
        </div>

        <div class="validity">
          ⏱ This proposal is valid for 14 days from ${today}. ${nce.note}
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
            {leads.filter(l => !['Won','Lost'].includes(l.status)).filter(l => isAdmin || l.assignedToEmail === userEmail).map(l => <option key={l._id} value={l._id}>{l.company} — {l.country} ({l.status})</option>)}
          </select>
          {!isAdmin && leads.filter(l => !['Won','Lost'].includes(l.status)).filter(l => l.assignedToEmail === userEmail).length === 0 && (
            <p className="mt-1.5 text-[11px] text-amber-600">You don't have any assigned leads yet. Ask your admin to assign you a lead first.</p>
          )}
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
            {Object.keys(PACKAGE_SKUS).map(name => <option key={name}>{name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Billing Plan (NCE)</label>
          <select value={billingOption} onChange={e => setBillingOption(e.target.value as NceOptionValue)} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30">
            {NCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <p className="mt-1 text-[11px] text-muted-foreground">{nce.note}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">Users</label>
            <input type="number" value={users} onChange={e => setUsers(e.target.value)} min="1" className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30">
              {SUPPORTED_CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Setup Fee ({sym.trim()})</label>
          <input type="number" value={setup} onChange={e => setSetup(e.target.value)} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Add-ons (optional, priced separately from the package)</label>
          <div className="space-y-1.5 rounded-lg border border-border p-2.5">
            {ADD_ONS.map(addOn => {
              const row = findRow(addOn.skuTitle)
              return (
                <label key={addOn.key} className="flex items-start gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={!!selectedAddOns[addOn.key]}
                    onChange={e => setSelectedAddOns(prev => ({ ...prev, [addOn.key]: e.target.checked }))}
                  />
                  <span className="flex-1">
                    <span className="font-medium text-foreground">{addOn.label}</span>
                    <span className="text-muted-foreground"> — {addOn.blurb}</span>
                  </span>
                  <span className="flex-shrink-0 text-muted-foreground">
                    {row ? `${sym}${convertFromUSD(row.retailUSD, currency, fxRates).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${periodLabel}` : catalogLoading ? '…' : 'n/a'}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Azure (optional note — billed separately, usage-based)</label>
          <input
            value={azureNote}
            onChange={e => setAzureNote(e.target.value)}
            placeholder='e.g. "Est. $80–120/mo for a small App Service + SQL DB — confirm with customer post-assessment"'
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">Azure is metered by Microsoft directly. This is a free-text note only — it never affects the totals below.</p>
        </div>

        {catalogLoading ? (
          <p className="rounded-lg bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">Loading live pricing from the catalog…</p>
        ) : catalogMissing ? (
          <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            No catalog price found for {pkg} under "{nce.label}". Check the SKU exists in the Pricing Catalog for this term/billing combination before quoting.
          </p>
        ) : addOnsMissing ? (
          <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            One or more selected add-ons have no catalog price under "{nce.label}". Uncheck it or check the Pricing Catalog import.
          </p>
        ) : (
          <div className="rounded-lg bg-teal-50 border border-teal-200 px-3 py-2 text-[11px] text-teal-800">
            📎 Live catalog price: ${pricePerUserUSD.toFixed(2)} USD per user {periodLabel}
            {activeAddOns.length > 0 && <span> + ${addOnsPerUserUSD.toFixed(2)} USD in add-ons</span>}
            {currency !== 'USD' && <span> · ≈ {sym}{(pricePerUserConverted + addOnsPerUserConverted).toLocaleString(undefined, { maximumFractionDigits: 2 })} at today's FX rate</span>}
            {isAdmin && (
              <span className="block mt-0.5 text-teal-600">
                Margin: package {(blendedMarginPercent * 100).toFixed(1)}%
                {activeAddOns.length > 0 && ` · add-ons ${((addOnsMarginPerUserUSD / addOnsPerUserUSD) * 100 || 0).toFixed(1)}%`}
                {' '}— internal only, not shown on the proposal.
              </span>
            )}
          </div>
        )}

        <button onClick={printProposal} disabled={!selectedLead || catalogMissing || addOnsMissing}
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
          <div className="flex justify-between py-1 border-b border-border/50"><span className="text-muted-foreground">Billing plan</span><span className="font-medium">{nce.label}</span></div>
          <div className="flex justify-between py-1 border-b border-border/50"><span className="text-muted-foreground">Users</span><span className="font-medium">{users}</span></div>
          <div className="flex justify-between py-1 border-b border-border/50"><span className="text-muted-foreground">Package price per user {periodLabel}</span><span className="font-medium">{sym}{pricePerUserConverted.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
          {activeAddOns.length > 0 && (
            <div className="flex justify-between py-1 border-b border-border/50"><span className="text-muted-foreground">Add-ons ({activeAddOns.length}) per user {periodLabel}</span><span className="font-medium">{sym}{addOnsPerUserConverted.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
          )}
          <div className="flex justify-between py-1 border-b border-border/50"><span className="text-muted-foreground">{nce.periodsPerYear === 1 ? 'Annual total' : 'Monthly total'}</span><span className="font-semibold text-sm">{sym}{periodTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
          {nce.periodsPerYear > 1 && (
            <div className="flex justify-between py-1 border-b border-border/50"><span className="text-muted-foreground">12-month total</span><span className="font-semibold">{sym}{annualTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
          )}
          <div className="flex justify-between py-1 border-b border-border/50"><span className="text-muted-foreground">Setup fee</span><span className="font-medium">{sym}{setupFee.toLocaleString()}</span></div>
          <div className="flex justify-between py-2 mt-1"><span className="font-bold text-foreground">Total first year</span><span className="font-bold text-primary text-base">{sym}{(annualTotal + setupFee).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
        </div>
        {azureNote.trim() && (
          <div className="mt-2 rounded-lg bg-sky-50 border border-sky-200 px-2.5 py-2 text-[10px] text-sky-800">☁ Azure: {azureNote} — billed separately by Microsoft, not included above.</div>
        )}
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

function TeamManagement({ users, loading, onUpdate }: { users: User[]; loading: boolean; onUpdate: () => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'sales' })
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', password: '', active: true })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null)

  const inp = "w-full rounded-lg border border-[#e3e9f0] bg-white px-3 py-2 text-sm text-[#0d2233] outline-none focus:border-[#0096c7] focus:ring-2 focus:ring-[#0096c7]/20"

  const ROLE_LABELS: Record<string, { label: string; desc: string; color: string }> = {
    admin:  { label: 'Admin',  desc: 'Full access — team management, all data', color: 'bg-purple-50 text-purple-700' },
    sales:  { label: 'Sales',  desc: 'Leads, pipeline, proposals, transfers', color: 'bg-blue-50 text-blue-700' },
    viewer: { label: 'Viewer', desc: 'Read-only — cannot edit any records', color: 'bg-gray-50 text-gray-600' },
  }

  const openEdit = (u: User) => {
    setEditUser(u)
    setEditForm({ name: u.name, email: u.email, role: u.role, password: '', active: u.active })
    setError('')
  }

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (data.success) {
        setSuccess(`✓ ${form.name} added. They can log in at /portal/login.`)
        setForm({ name: '', email: '', password: '', role: 'sales' })
        setShowAdd(false); onUpdate()
      } else setError(data.error || 'Failed to add. Email may already exist.')
    } catch { setError('Network error.') }
    setSaving(false)
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return
    setSaving(true); setError('')
    try {
      const payload: any = { name: editForm.name, email: editForm.email, role: editForm.role, active: editForm.active }
      if (editForm.password) payload.password = editForm.password
      const res = await fetch(`/api/users/${editUser._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (data.success) { setEditUser(null); onUpdate(); setSuccess(`✓ ${editForm.name} updated successfully.`) }
      else setError(data.error || 'Failed to update.')
    } catch { setError('Network error.') }
    setSaving(false)
  }

  const deleteUser = async (u: User) => {
    await fetch(`/api/users/${u._id}`, { method: 'DELETE' })
    setConfirmDelete(null); onUpdate()
    setSuccess(`✓ ${u.name} removed from the team.`)
  }

  const [togglingId, setTogglingId] = useState<string | null>(null)
  const toggleActive = async (u: User) => {
    setTogglingId(u._id)
    await fetch(`/api/users/${u._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !u.active }) })
    setTogglingId(null)
    onUpdate()
    setSuccess(u.active ? `○ ${u.name} deactivated — login blocked.` : `● ${u.name} reactivated — can log in again.`)
  }

  return (
    <div className="space-y-4">
      {success && <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm font-medium text-green-700">{success}</div>}

      <div className="rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">Admin</p>
            <h2 className="mt-0.5 text-base font-semibold text-foreground">Team & Access Control</h2>
            <p className="text-xs text-muted-foreground">{users.length} team members · Click Edit to change details or reset password</p>
          </div>
          <button onClick={() => { setShowAdd(true); setError('') }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90">
            + Add Team Member
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 border-b border-border px-5 py-4">
          {Object.entries(ROLE_LABELS).map(([key, r]) => (
            <div key={key} className="rounded-lg border border-border bg-secondary/30 p-3">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold mb-1 ${r.color}`}>{r.label}</span>
              <p className="text-[11px] text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {['Member','Email','Role','Status','Last Login','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">Loading...</td></tr>
              : users.length === 0 ? <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No team members yet</td></tr>
              : users.map(u => {
                const roleInfo = ROLE_LABELS[u.role] || ROLE_LABELS.viewer
                return (
                  <tr key={u._id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0096c7]/10 text-[11px] font-bold text-[#0096c7]">
                          {u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span className="font-medium text-foreground">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${roleInfo.color}`}>{roleInfo.label}</span></td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${u.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{u.active ? '● Active' : '○ Inactive'}</span></td>
                    <td className="px-4 py-3 text-[11px] text-muted-foreground">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(u)} className="rounded-lg bg-[#e8f4fb] px-3 py-1.5 text-[11px] font-semibold text-[#0096c7] hover:bg-[#0096c7] hover:text-white transition-colors">Edit</button>
                        <button onClick={() => toggleActive(u)} disabled={togglingId === u._id}
                          className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-60 ${u.active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                          {togglingId === u._id ? '...' : u.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => setConfirmDelete(u)} className="rounded-lg bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-100 transition-colors">Remove</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD MODAL */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,34,51,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e3e9f0] px-6 py-4">
              <div><h2 className="text-base font-semibold text-[#0d2233]">Add Team Member</h2><p className="text-xs text-[#5c7184]">New member can log in immediately</p></div>
              <button onClick={() => setShowAdd(false)} className="flex size-8 items-center justify-center rounded-lg text-[#5c7184] hover:bg-[#f4f7fb] text-lg">×</button>
            </div>
            <form onSubmit={addUser} className="p-6 space-y-4">
              <div><label className="mb-1.5 block text-xs font-medium text-[#0d2233]">Full name *</label><input required className={inp} placeholder="e.g. Amara Okafor" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></div>
              <div><label className="mb-1.5 block text-xs font-medium text-[#0d2233]">Work email *</label><input required type="email" className={inp} placeholder="amara@golivecompany.com" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} /></div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#0d2233]">Temporary password *</label>
                <input required type="password" minLength={8} className={inp} placeholder="Minimum 8 characters" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} />
                <p className="mt-1 text-[11px] text-[#5c7184]">Share privately — admin can reset anytime from this page</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#0d2233]">Role *</label>
                <select className={inp} value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}>
                  <option value="sales">Sales — leads, pipeline, proposals</option>
                  <option value="admin">Admin — full access including team management</option>
                  <option value="viewer">Viewer — read-only</option>
                </select>
              </div>
              {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 rounded-lg border border-[#e3e9f0] px-4 py-2.5 text-sm font-medium text-[#5c7184] hover:bg-[#f4f7fb]">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-[#0096c7] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0096c7]/90 disabled:opacity-60">{saving ? 'Adding...' : 'Add Team Member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,34,51,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e3e9f0] px-6 py-4">
              <div><h2 className="text-base font-semibold text-[#0d2233]">Edit — {editUser.name}</h2><p className="text-xs text-[#5c7184]">Leave password blank to keep existing password</p></div>
              <button onClick={() => setEditUser(null)} className="flex size-8 items-center justify-center rounded-lg text-[#5c7184] hover:bg-[#f4f7fb] text-lg">×</button>
            </div>
            <form onSubmit={saveEdit} className="p-6 space-y-4">
              <div><label className="mb-1.5 block text-xs font-medium text-[#0d2233]">Full name *</label><input required className={inp} value={editForm.name} onChange={e => setEditForm(f => ({...f, name: e.target.value}))} /></div>
              <div><label className="mb-1.5 block text-xs font-medium text-[#0d2233]">Email address *</label><input required type="email" className={inp} value={editForm.email} onChange={e => setEditForm(f => ({...f, email: e.target.value}))} /></div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#0d2233]">Role</label>
                <select className={inp} value={editForm.role} onChange={e => setEditForm(f => ({...f, role: e.target.value}))}>
                  <option value="sales">Sales</option><option value="admin">Admin</option><option value="viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#0d2233]">Account Status</label>
                <select className={inp} value={editForm.active ? 'true' : 'false'} onChange={e => setEditForm(f => ({...f, active: e.target.value === 'true'}))}>
                  <option value="true">Active — can log in</option><option value="false">Inactive — login blocked</option>
                </select>
              </div>
              <div className="rounded-xl border border-[#e3e9f0] bg-[#f4f7fb] p-4">
                <label className="mb-1.5 block text-xs font-semibold text-[#0d2233]">🔑 Reset Password</label>
                <p className="mb-2 text-[11px] text-[#5c7184]">Leave blank to keep their current password unchanged</p>
                <input type="password" minLength={8} className={inp} placeholder="New password (min 8 characters)" value={editForm.password} onChange={e => setEditForm(f => ({...f, password: e.target.value}))} />
              </div>
              {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditUser(null)} className="flex-1 rounded-lg border border-[#e3e9f0] px-4 py-2.5 text-sm font-medium text-[#5c7184] hover:bg-[#f4f7fb]">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-[#0096c7] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0096c7]/90 disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,34,51,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-red-50 text-2xl">⚠️</div>
            <h2 className="text-base font-semibold text-[#0d2233] mb-1">Remove Team Member?</h2>
            <p className="text-sm text-[#5c7184] mb-1"><strong className="text-[#0d2233]">{confirmDelete.name}</strong> will be permanently removed.</p>
            <p className="text-xs text-[#5c7184] mb-6">They will no longer be able to log in. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-lg border border-[#e3e9f0] px-4 py-2.5 text-sm font-medium text-[#5c7184] hover:bg-[#f4f7fb]">Cancel</button>
              <button onClick={() => deleteUser(confirmDelete)} className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600">Remove Permanently</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const CERT_MILESTONES = [
  {
    id: 'ab900_study', phase: 'Month 1', category: 'Skilling',
    title: 'AB-900 study started',
    desc: 'Team member enrolled in Microsoft Learn AB-900 path',
    link: 'https://learn.microsoft.com', linkLabel: 'Start on Microsoft Learn →'
  },
  {
    id: 'ab900_passed', phase: 'Month 1', category: 'Skilling',
    title: 'AB-900 exam passed ✦ Intermediate cert earned',
    desc: 'Microsoft 365 Copilot & Agent Administration Fundamentals — $99 on Pearson VUE',
    link: 'https://home.pearsonvue.com/microsoft', linkLabel: 'Register on Pearson VUE →'
  },
  {
    id: 'ms102_study', phase: 'Month 1–3', category: 'Skilling',
    title: 'MS-102 study started',
    desc: 'Technical lead set up free M365 E5 dev tenant and began learning path',
    link: 'https://developer.microsoft.com/en-us/microsoft-365/dev-program', linkLabel: 'Get free dev tenant →'
  },
  {
    id: 'customer_2', phase: 'Month 2', category: 'Performance',
    title: '2 net new M365 customers signed',
    desc: 'Two businesses onboarded on Microsoft 365 via GoLive CSP — linked in Partner Center',
    link: 'https://partner.microsoft.com', linkLabel: 'Check Partner Center score →'
  },
  {
    id: 'ms102_passed', phase: 'Month 3', category: 'Skilling',
    title: 'MS-102 exam passed ✦ Advanced cert earned',
    desc: 'Microsoft 365 Administrator Expert — $165 on Pearson VUE. REQUIRED for designation.',
    link: 'https://home.pearsonvue.com/microsoft', linkLabel: 'Register MS-102 →'
  },
  {
    id: 'customer_4', phase: 'Month 4', category: 'Performance',
    title: '4 net new M365 customers signed',
    desc: 'Four qualifying businesses onboarded. Microsoft evaluates on SMB CSP track.',
    link: 'https://partner.microsoft.com', linkLabel: 'Track in Partner Center →'
  },
  {
    id: 'workloads', phase: 'Month 4', category: 'Customer Success',
    title: 'Teams + OneDrive activated for all clients',
    desc: 'Ensure every customer has Teams and OneDrive enabled — this builds usage growth score',
    link: null, linkLabel: null
  },
  {
    id: 'applied', phase: 'Month 4–5', category: 'Admin',
    title: 'Applied for designation in Partner Center',
    desc: 'Partner Center → Membership → Solutions Partner → Modern Work → Apply',
    link: 'https://partner.microsoft.com', linkLabel: 'Go to Partner Center →'
  },
  {
    id: 'badge_live', phase: 'Month 5–6', category: 'Complete',
    title: '🎉 Solutions Partner badge awarded',
    desc: 'GoLive listed in Microsoft Marketplace partner directory for Nigeria. Badge live.',
    link: 'https://marketplace.microsoft.com', linkLabel: 'View Microsoft Marketplace →'
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  'Skilling': 'bg-purple-50 text-purple-700',
  'Performance': 'bg-blue-50 text-blue-700',
  'Customer Success': 'bg-teal-50 text-teal-700',
  'Admin': 'bg-orange-50 text-orange-700',
  'Complete': 'bg-green-50 text-green-700',
}

function CertificationPage({ role }: { role: string }) {
  const [milestones, setMilestones] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const isAdmin = role === 'admin'

  useEffect(() => {
    fetch('/api/milestones').then(r => r.json()).then(d => {
      if (d.success) setMilestones(d.milestones || {})
    })
  }, [])

  const toggle = async (id: string) => {
    if (!isAdmin) return
    const next = { ...milestones, [id]: !milestones[id] }
    setMilestones(next)
    setSaving(true)
    await fetch('/api/milestones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ milestones: next }) })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const completed = CERT_MILESTONES.filter(m => milestones[m.id]).length
  const total = CERT_MILESTONES.length
  const pct = Math.round((completed / total) * 100)

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-2xl bg-[#0d2233] p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#00c8c8]">Resources · Internal</p>
            <h2 className="mt-1 text-xl font-bold">Microsoft Solutions Partner</h2>
            <p className="text-sm text-white/70">Modern Work Designation — SMB Track · 2026</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-[#00c8c8]">{completed}/{total}</div>
            <div className="text-xs text-white/50">milestones complete</div>
            {saving && <div className="text-[10px] text-white/40 mt-1">Saving...</div>}
            {saved && <div className="text-[10px] text-[#00c8c8] mt-1">✓ Saved</div>}
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs text-white/50">
            <span>Progress to Solutions Partner badge</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-2.5 rounded-full bg-[#00c8c8] transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
        {/* Stat pills */}
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            { label: 'Points needed', val: '70 / 100' },
            { label: 'Min exams', val: '2' },
            { label: 'Exam cost', val: '~$264' },
            { label: 'Timeline', val: '6 months' },
          ].map(s => (
            <div key={s.label} className="rounded-lg bg-white/10 px-3 py-1.5 text-center">
              <div className="text-sm font-bold text-[#00c8c8]">{s.val}</div>
              <div className="text-[10px] text-white/50">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Score breakdown */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Scoring Breakdown — 70 points needed</h3>
        <div className="space-y-3">
          {[
            { label: 'Performance — Net New M365 Customers', max: 50, note: 'Sign 4+ qualifying customers via CSP' },
            { label: 'Skilling — Intermediate (AB-900 / MS-900)', max: 12.5, note: '1 person certified — MANDATORY' },
            { label: 'Skilling — Advanced (MS-102)', max: 12.5, note: '1 person certified — MANDATORY' },
            { label: 'Customer Success — Usage Growth', max: 12.5, note: 'Auto — activate Teams & OneDrive per client' },
            { label: 'Customer Success — Deployments', max: 12.5, note: 'Auto — grows with client base' },
          ].map((s, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-foreground">{s.label}</span>
                <span className="text-muted-foreground">{s.max} pts</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#eaf0f7]">
                <div className="h-1.5 rounded-full bg-[#0096c7]" style={{ width: milestones['badge_live'] ? '100%' : '0%', transition: 'width 0.5s' }} />
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{s.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Action Plan & Milestones</h3>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? 'Click any milestone to mark complete — visible to all team members' : 'Milestones updated by admin · read only'}
            </p>
          </div>
          <a href="/certification-guide.html" target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground shadow-xs hover:bg-secondary">
            Full guide ↗
          </a>
        </div>
        <div className="divide-y divide-border">
          {CERT_MILESTONES.map((m) => {
            const done = !!milestones[m.id]
            return (
              <div
                key={m.id}
                onClick={() => toggle(m.id)}
                className={`flex items-start gap-4 px-5 py-4 transition-colors ${isAdmin ? 'cursor-pointer hover:bg-[#f4f7fb]' : ''} ${done ? 'bg-green-50/40' : ''}`}
              >
                {/* Checkbox */}
                <div className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${done ? 'border-green-500 bg-green-500' : 'border-[#c8e6f0] bg-white'}`}>
                  {done && (
                    <svg className="size-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[m.category]}`}>{m.category}</span>
                    <span className="text-[10px] text-muted-foreground">{m.phase}</span>
                    {done && <span className="text-[10px] font-semibold text-green-600">✓ Complete</span>}
                  </div>
                  <p className={`mt-1 text-sm font-semibold ${done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{m.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{m.desc}</p>
                  {m.link && (
                    <a href={m.link} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="mt-1.5 inline-flex items-center text-[11px] font-medium text-[#0096c7] hover:underline">
                      {m.linkLabel}
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Key links */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Key Links</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            { label: 'Partner Center', desc: 'Track GoLive\'s live PCS score', href: 'https://partner.microsoft.com' },
            { label: 'Microsoft Learn', desc: 'Free study paths for all exams', href: 'https://learn.microsoft.com' },
            { label: 'Free M365 Dev Tenant', desc: '90-day E5 sandbox for MS-102 practice', href: 'https://developer.microsoft.com/en-us/microsoft-365/dev-program' },
            { label: 'Pearson VUE — Register Exams', desc: 'Book AB-900 and MS-102 online', href: 'https://home.pearsonvue.com/microsoft' },
            { label: 'Virtual Training Days', desc: 'Free prep — sometimes includes voucher', href: 'https://events.microsoft.com' },
            { label: 'Modern Work Requirements', desc: 'Official Microsoft documentation', href: 'https://learn.microsoft.com/en-us/partner-center/membership/solutions-partner-modern-work' },
          ].map(l => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm transition-colors hover:border-[#0096c7]/30 hover:bg-[#e8f4fb]">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-[#e8f4fb] text-[#0096c7] text-xs">↗</span>
              <div>
                <div className="font-medium text-foreground">{l.label}</div>
                <div className="text-xs text-muted-foreground">{l.desc}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

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

function ConvertModal({ lead, onClose, onConverted }: { lead: Lead; onClose: () => void; onConverted: () => void }) {
  const [tenantDomain, setTenantDomain] = useState(lead.email?.split('@')[1] || '')
  const [adminEmail, setAdminEmail] = useState(lead.email || '')
  const [pkg, setPkg] = useState<'starter' | 'secure' | 'ai' | 'custom'>('secure')
  const [users, setUsers] = useState(String(lead.users || '1').split('-')[0] || '1')
  const [mrr, setMrr] = useState('')
  const [currency, setCurrency] = useState(currencyForCountry(lead.country))
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // CSP onboarding (4Sight Dynamics Africa) — mirrors their two customer-add
  // paths: an existing tenant (they send an association link) vs a brand-new
  // tenant (needs the full "NEW CSP CUSTOMER INFORMATION REQUEST" fields).
  const [hasExistingTenant, setHasExistingTenant] = useState(false)
  const [companyRegistrationId, setCompanyRegistrationId] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [preferredDomain, setPreferredDomain] = useState('')
  const [secondChoiceDomain, setSecondChoiceDomain] = useState('')
  const [thirdChoiceDomain, setThirdChoiceDomain] = useState('')
  const [physicalAddress, setPhysicalAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [copied, setCopied] = useState(false)

  const cspRequestText = [
    'NEW CSP CUSTOMER INFORMATION REQUEST',
    '',
    `Country: ${lead.country || ''}`,
    `Company Name: ${lead.company || ''}`,
    `Company Registration ID: ${companyRegistrationId}`,
    `VAT number (if applicable): ${vatNumber}`,
    `Preferred onmicrosoft Domain: ${preferredDomain}`,
    `Second Choice onmicrosoft Domain: ${secondChoiceDomain}`,
    `Third Choice onmicrosoft Domain: ${thirdChoiceDomain}`,
    `Full Physical Address: ${physicalAddress}`,
    `City: ${city}`,
    `Postal code: ${postalCode}`,
    `Primary Contact Name & Last Name: ${lead.contact || ''}`,
    `Primary Contact Email Address: ${adminEmail}`,
    `Primary Contact Phone Number: ${lead.phone || ''}`,
  ].join('\n')

  const copyCspRequest = async () => {
    try {
      await navigator.clipboard.writeText(cspRequestText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy automatically — select the text box and copy manually.')
    }
  }

  const mailtoHref = `mailto:annri.steyn@4sight.cloud?subject=${encodeURIComponent(`New CSP Customer: ${lead.company}`)}&body=${encodeURIComponent(cspRequestText)}`

  const handleSubmit = async () => {
    if (!tenantDomain.trim() || !adminEmail.trim() || !mrr.trim()) {
      setError('Domain, admin email, and MRR are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: lead.company,
          contact: lead.contact,
          email: lead.email,
          phone: lead.phone,
          country: lead.country,
          tenantDomain,
          adminEmail,
          package: pkg,
          users: parseInt(users) || 1,
          mrr: parseFloat(mrr) || 0,
          currency,
          billingCycle,
          startDate: new Date().toISOString(),
          leadRef: lead.ref,
          leadId: lead._id,
          cspOnboarding: {
            hasExistingTenant,
            ...(hasExistingTenant ? {} : {
              companyRegistrationId, vatNumber, preferredDomain, secondChoiceDomain,
              thirdChoiceDomain, physicalAddress, city, postalCode,
            }),
          },
        }),
      })
      const data = await res.json()
      if (data.success === false) {
        setError(data.error || 'Failed to create customer.')
        setSaving(false)
        return
      }
      onConverted()
    } catch {
      setError('Network error. Please try again.')
      setSaving(false)
    }
  }

  const inp = "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl my-auto">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Convert to Customer</h2>
          <p className="text-xs text-muted-foreground">{lead.company} — confirm tenant details</p>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Tenant Domain</label>
            <input value={tenantDomain} onChange={e => setTenantDomain(e.target.value)} placeholder="company.onmicrosoft.com"
              className={inp} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Tenant Admin Email</label>
            <input value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@company.com"
              className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Package</label>
              <select value={pkg} onChange={e => setPkg(e.target.value as any)}
                className={inp}>
                <option value="starter">Starter Cloud Office</option>
                <option value="secure">Secure Business Cloud</option>
                <option value="ai">AI-Ready Enterprise</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Users</label>
              <input type="number" min="1" value={users} onChange={e => setUsers(e.target.value)}
                className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">MRR</label>
              <input type="number" min="0" value={mrr} onChange={e => setMrr(e.target.value)} placeholder="220"
                className={inp} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value as typeof currency)}
                className={inp}>
                {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Billing Cycle</label>
              <select value={billingCycle} onChange={e => setBillingCycle(e.target.value as any)}
                className={inp}>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-secondary/20 p-3">
            <p className="mb-2 text-xs font-semibold text-foreground">4Sight Dynamics Africa (CSP) onboarding</p>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setHasExistingTenant(false)}
                className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors ${!hasExistingTenant ? 'border-primary bg-primary text-white' : 'border-border text-foreground hover:bg-secondary'}`}>
                New tenant
              </button>
              <button type="button" onClick={() => setHasExistingTenant(true)}
                className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors ${hasExistingTenant ? 'border-primary bg-primary text-white' : 'border-border text-foreground hover:bg-secondary'}`}>
                Existing M365 tenant
              </button>
            </div>

            {hasExistingTenant ? (
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Request a customer association link from Annri (4Sight PRO) — the customer or their admin accepts it,
                then confirm with Annri once it shows up on the CSP portal. No further info needed here.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input value={companyRegistrationId} onChange={e => setCompanyRegistrationId(e.target.value)} placeholder="Company Reg. ID" className={inp + ' text-xs'} />
                  <input value={vatNumber} onChange={e => setVatNumber(e.target.value)} placeholder="VAT number (if any)" className={inp + ' text-xs'} />
                </div>
                <p className="mb-1 text-[11px] font-medium text-muted-foreground">onmicrosoft.com domain choices</p>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <input value={preferredDomain} onChange={e => setPreferredDomain(e.target.value)} placeholder="1st choice" className={inp + ' text-xs'} />
                  <input value={secondChoiceDomain} onChange={e => setSecondChoiceDomain(e.target.value)} placeholder="2nd choice" className={inp + ' text-xs'} />
                  <input value={thirdChoiceDomain} onChange={e => setThirdChoiceDomain(e.target.value)} placeholder="3rd choice" className={inp + ' text-xs'} />
                </div>
                <input value={physicalAddress} onChange={e => setPhysicalAddress(e.target.value)} placeholder="Full physical address" className={inp + ' text-xs mb-2'} />
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" className={inp + ' text-xs'} />
                  <input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="Postal code" className={inp + ' text-xs'} />
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={copyCspRequest}
                    className="flex-1 rounded-lg border border-border px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-secondary">
                    {copied ? '✓ Copied!' : '📋 Copy request text'}
                  </button>
                  <a href={mailtoHref}
                    className="flex-1 rounded-lg border border-border px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-secondary text-center">
                    ✉️ Email Annri
                  </a>
                </div>
                <textarea readOnly value={cspRequestText} rows={3}
                  className="mt-2 w-full resize-none rounded-lg border border-border bg-white px-2 py-1.5 text-[10px] font-mono text-muted-foreground" />
              </>
            )}
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
            {saving ? 'Converting...' : 'Convert to Customer'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CspInfoModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const c = customer.cspOnboarding

  const requestText = [
    'NEW CSP CUSTOMER INFORMATION REQUEST',
    '',
    `Country: ${customer.country || ''}`,
    `Company Name: ${customer.company || ''}`,
    `Company Registration ID: ${c?.companyRegistrationId || ''}`,
    `VAT number (if applicable): ${c?.vatNumber || ''}`,
    `Preferred onmicrosoft Domain: ${c?.preferredDomain || ''}`,
    `Second Choice onmicrosoft Domain: ${c?.secondChoiceDomain || ''}`,
    `Third Choice onmicrosoft Domain: ${c?.thirdChoiceDomain || ''}`,
    `Full Physical Address: ${c?.physicalAddress || ''}`,
    `City: ${c?.city || ''}`,
    `Postal code: ${c?.postalCode || ''}`,
    `Primary Contact Name & Last Name: ${customer.contact || ''}`,
    `Primary Contact Email Address: ${customer.adminEmail || ''}`,
    `Primary Contact Phone Number: ${customer.phone || ''}`,
  ].join('\n')

  const copyRequest = async () => {
    try {
      await navigator.clipboard.writeText(requestText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard permissions denied — textarea below still works */ }
  }

  const mailtoHref = `mailto:annri.steyn@4sight.cloud?subject=${encodeURIComponent(`New CSP Customer: ${customer.company}`)}&body=${encodeURIComponent(requestText)}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl my-auto">
        <div className="border-b border-border px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">CSP Onboarding Info</h2>
            <p className="text-xs text-muted-foreground">{customer.company}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">×</button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            This is the same info captured at conversion — use it if you need to resend or follow up the request with Annri.
          </p>
          <textarea readOnly value={requestText} rows={9}
            className="w-full resize-none rounded-lg border border-border bg-secondary/30 px-2.5 py-2 text-[11px] font-mono text-foreground" />
          <div className="flex gap-2">
            <button onClick={copyRequest}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary">
              {copied ? '✓ Copied!' : '📋 Copy request text'}
            </button>
            <a href={mailtoHref}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary text-center">
              ✉️ Email Annri
            </a>
          </div>
        </div>
        <div className="flex justify-end border-t border-border px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary">Close</button>
        </div>
      </div>
    </div>
  )
}
