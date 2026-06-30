"use client"
import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { Search, Bell, Plus } from "lucide-react"

const PAGE_LABELS: Record<string, { section: string; title: string }> = {
  dashboard:    { section: "Admin",   title: "Sales Dashboard" },
  assessments:  { section: "Sales",  title: "Cloud Assessment Leads" },
  transfers:    { section: "Sales",  title: "Transfer Requests" },
  pipeline:     { section: "Sales",  title: "CRM Pipeline" },
  commissions:  { section: "Sales",  title: "Commissions" },
  discovery:    { section: "Tools",  title: "Discovery Questionnaire (Internal Assessment)" },
  proposals:    { section: "Tools",  title: "Proposal Generator" },
  "product-mapping": { section: "Tools", title: "Product Mapping" },
  onboarding:   { section: "Tools",  title: "Deployment Workflow" },
  announcements:{ section: "Team",   title: "Announcements" },
  knowledge:    { section: "Team",   title: "Knowledge Base" },
  customers:    { section: "Admin",  title: "Customer Accounts" },
  "payment-risk": { section: "Admin", title: "Payment & Suspension Risk" },
  pricing:      { section: "Admin",  title: "Pricing Catalog" },
  "setup-fees": { section: "Admin",  title: "Setup Fee Catalog" },
  team:         { section: "Admin",  title: "Team & Access" },
  resources_cert: { section: "Resources", title: "Certification Guide" },
}

interface NotificationItem {
  _id: string
  type: string
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: string
}

const TYPE_ICON: Record<string, string> = {
  lead_assigned: "📋",
  lead_status: "🔄",
  transfer_assigned: "🔁",
  transfer_status: "🔁",
  announcement: "📢",
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

interface SearchLead { _id: string; ref: string; company: string; email: string; contact: string }
interface SearchCustomer { _id: string; company: string; tenantDomain: string }
interface SearchTransfer { _id: string; ref: string; company: string; domain: string }

export function Topbar({
  page = "dashboard", onNavigate, onNewLead,
  leads = [], customers = [], transfers = [], onSelectResult,
}: {
  page?: string; onNavigate?: (page: string) => void; onNewLead?: () => void
  leads?: SearchLead[]; customers?: SearchCustomer[]; transfers?: SearchTransfer[]
  onSelectResult?: (type: 'lead' | 'customer' | 'transfer', id: string) => void
}) {
  const info = PAGE_LABELS[page] || PAGE_LABELS.dashboard
  const { data: session } = useSession()
  const userEmail = session?.user?.email
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = () => {
    if (!userEmail) return
    fetch(`/api/notifications?email=${encodeURIComponent(userEmail)}`)
      .then(r => r.json())
      .then(d => { if (d.success) { setNotifications(d.notifications || []); setUnreadCount(d.unreadCount || 0) } })
      .catch(() => {})
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [userEmail])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const q = searchQuery.trim().toLowerCase()
  const matchedLeads = q.length < 2 ? [] : leads.filter(l =>
    l.ref?.toLowerCase().includes(q) || l.company?.toLowerCase().includes(q) ||
    l.email?.toLowerCase().includes(q) || l.contact?.toLowerCase().includes(q)
  ).slice(0, 5)
  const matchedCustomers = q.length < 2 ? [] : customers.filter(c =>
    c.company?.toLowerCase().includes(q) || c.tenantDomain?.toLowerCase().includes(q)
  ).slice(0, 5)
  const matchedTransfers = q.length < 2 ? [] : transfers.filter(t =>
    t.ref?.toLowerCase().includes(q) || t.company?.toLowerCase().includes(q) || t.domain?.toLowerCase().includes(q)
  ).slice(0, 5)
  const hasResults = matchedLeads.length + matchedCustomers.length + matchedTransfers.length > 0

  function selectResult(type: 'lead' | 'customer' | 'transfer', id: string) {
    onSelectResult?.(type, id)
    setSearchQuery("")
    setSearchOpen(false)
  }

  async function markAsRead(id: string) {
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, read: true }) })
  }

  async function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    if (userEmail) {
      await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAllReadForEmail: userEmail }) })
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-[#e3e9f0] bg-[#f4f7fb]/80 px-5 backdrop-blur-md md:px-8">
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-xs text-[#5c7184] sm:flex">
          <span>{info.section}</span>
          <span className="text-[#5c7184]">›</span>
          <span className="font-medium text-[#0d2233]">{info.title}</span>
        </nav>
        <h1 className="truncate text-base font-semibold tracking-tight text-[#0d2233] md:text-lg">{info.title}</h1>
      </div>
      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <div className="relative hidden md:block" ref={searchRef}>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5c7184]" />
          <input
            type="search"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true) }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search customers, refs…"
            aria-label="Search"
            className="h-9 w-56 rounded-lg border border-[#e3e9f0] bg-white pl-9 pr-3 text-sm text-[#0d2233] shadow-xs outline-none transition-colors placeholder:text-[#5c7184] focus:border-[#0096c7] focus:ring-2 focus:ring-[#0096c7]/30"
          />
          {searchOpen && q.length >= 2 && (
            <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-lg border border-[#e3e9f0] bg-white shadow-lg">
              {!hasResults ? (
                <p className="px-4 py-3 text-xs text-[#5c7184]">No matches for "{searchQuery}"</p>
              ) : (
                <div className="max-h-80 overflow-y-auto py-1">
                  {matchedLeads.length > 0 && (
                    <div>
                      <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[#5c7184]">Leads</p>
                      {matchedLeads.map(l => (
                        <button key={l._id} onClick={() => selectResult('lead', l._id)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-[#f4f7fb]">
                          <span className="truncate"><span className="font-medium text-[#0d2233]">{l.company}</span> <span className="text-[#5c7184]">— {l.contact}</span></span>
                          <span className="flex-shrink-0 font-mono text-[10px] text-[#0096c7]">{l.ref}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {matchedCustomers.length > 0 && (
                    <div>
                      <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[#5c7184]">Customers</p>
                      {matchedCustomers.map(c => (
                        <button key={c._id} onClick={() => selectResult('customer', c._id)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-[#f4f7fb]">
                          <span className="truncate font-medium text-[#0d2233]">{c.company}</span>
                          <span className="flex-shrink-0 font-mono text-[10px] text-[#5c7184]">{c.tenantDomain}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {matchedTransfers.length > 0 && (
                    <div>
                      <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[#5c7184]">Transfers</p>
                      {matchedTransfers.map(t => (
                        <button key={t._id} onClick={() => selectResult('transfer', t._id)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-[#f4f7fb]">
                          <span className="truncate"><span className="font-medium text-[#0d2233]">{t.company}</span> <span className="text-[#5c7184]">— {t.domain}</span></span>
                          <span className="flex-shrink-0 font-mono text-[10px] text-[#0096c7]">{t.ref}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <button className="hidden h-9 items-center gap-1.5 rounded-lg border border-[#e3e9f0] bg-white px-3 text-sm font-normal text-[#5c7184] shadow-xs lg:inline-flex">
          Last 30 days
        </button>

        <div className="relative" ref={ref}>
          <button onClick={() => setOpen(!open)} className="relative flex size-9 items-center justify-center rounded-lg border border-[#e3e9f0] bg-white shadow-xs" aria-label="Notifications">
            <Bell className="size-4 text-[#5c7184]" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-[#e3e9f0] bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-[#e3e9f0] px-4 py-3">
                <span className="text-sm font-semibold text-[#0d2233]">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[11px] font-medium text-[#0096c7] hover:underline">Mark all read</button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-xs text-[#5c7184]">No notifications yet</p>
                ) : (
                  notifications.map(n => (
                    <button key={n._id} onClick={() => { markAsRead(n._id); if (n.link && onNavigate) onNavigate(n.link) }}
                      className={`flex w-full items-start gap-2.5 border-b border-[#f0f3f7] px-4 py-3 text-left transition-colors hover:bg-[#f4f7fb] ${!n.read ? 'bg-[#eaf6fb]' : ''}`}>
                      <span className="mt-0.5 text-base">{TYPE_ICON[n.type] || '🔔'}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#0d2233]">{n.title}</p>
                        <p className="mt-0.5 text-[11px] text-[#5c7184] line-clamp-2">{n.message}</p>
                        <p className="mt-1 text-[10px] text-[#8a9bb0]">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#0096c7]" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button onClick={() => onNewLead?.()}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#0096c7] px-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0096c7]/90">
          <Plus className="size-4" />
          <span className="hidden sm:inline">New Lead</span>
        </button>
      </div>
    </header>
  )
}
