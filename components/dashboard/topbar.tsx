"use client"
import { useEffect, useState, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { Search, Bell, Plus, Settings, LogOut } from "lucide-react"

const PAGE_LABELS: Record<string, { section: string; title: string }> = {
  dashboard:         { section: "Home",           title: "Sales dashboard" },
  assessments:       { section: "Sales",          title: "Cloud assessment leads" },
  transfers:         { section: "Sales",          title: "Transfer requests" },
  pipeline:          { section: "Sales",          title: "CRM pipeline" },
  commissions:       { section: "Sales",          title: "Commissions" },
  discovery:         { section: "Tools",          title: "Discovery questionnaire" },
  proposals:         { section: "Tools",          title: "Proposal generator" },
  "product-mapping": { section: "Tools",          title: "Product mapping" },
  onboarding:        { section: "Tools",          title: "Deployment workflow" },
  announcements:     { section: "Team",           title: "Announcements" },
  knowledge:         { section: "Team",           title: "Knowledge base" },
  "hr-assessments":  { section: "People",         title: "Candidate assessments" },
  "hr-people":       { section: "People",         title: "Employees" },
  positions:         { section: "People",         title: "Positions" },
  customers:         { section: "Administration", title: "Customer accounts" },
  "payment-risk":    { section: "Administration", title: "Payment and suspension risk" },
  pricing:           { section: "Administration", title: "Pricing catalogue" },
  "setup-fees":      { section: "Administration", title: "Setup fee catalogue" },
  team:              { section: "Administration", title: "Team and access" },
  account:           { section: "Account",        title: "Account settings" },
  resources_cert:    { section: "Resources",      title: "Certification guide" },
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
  const userName = session?.user?.name || 'Signed in'
  const userRole = (session?.user as { role?: string } | undefined)?.role || ''
  const initials = userName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
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

  // Notification links are either a portal panel key ("pipeline") or a route
  // ("/portal/people"). A route must be navigated to, not passed to setPage.
  function openLink(link?: string) {
    if (!link) return
    setOpen(false)
    if (link.startsWith('/')) { window.location.href = link; return }
    if (onNavigate) onNavigate(link)
    else window.location.href = `/portal#${link}`
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
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-4 border-b border-[#e0e0e0] bg-white pl-3 pr-4 lg:pl-4">
        <a href="/portal" className="flex shrink-0 items-center gap-3 lg:w-[252px]" aria-label="GoLive Cloud portal, home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/golive-logo.png" alt="GoLive Digital Solutions Company" className="h-10 w-auto" />
          <span className="hidden border-l border-[#d1d1d1] pl-3 text-[13px] font-semibold text-[#424242] sm:inline">Cloud portal</span>
        </a>

        <div className="relative mx-auto hidden w-full max-w-[560px] md:block" ref={searchRef}>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#616161]" />
          <input
            type="search"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true) }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search customers, leads and references"
            aria-label="Search"
            className="h-8 w-full rounded-[4px] border border-[#d1d1d1] bg-[#fafafa] pl-9 pr-3 text-sm text-[#242424] outline-none placeholder:text-[#616161] focus:border-[#0b7e9b] focus:bg-white focus:ring-1 focus:ring-[#0b7e9b]"
          />
          {searchOpen && q.length >= 2 && (
            <div className="absolute inset-x-0 z-40 mt-1 overflow-hidden rounded-lg border border-[#e0e0e0] bg-white shadow-[0_0_2px_rgba(0,0,0,.12),0_8px_16px_rgba(0,0,0,.14)]">
              {!hasResults ? (
                <p className="px-4 py-3 text-sm text-[#616161]">No matches for &ldquo;{searchQuery}&rdquo;</p>
              ) : (
                <div className="max-h-80 overflow-y-auto py-1">
                  {matchedLeads.length > 0 && (
                    <div>
                      <p className="px-3 pb-1 pt-2 text-xs font-semibold text-[#616161]">Leads</p>
                      {matchedLeads.map(l => (
                        <button key={l._id} onClick={() => selectResult('lead', l._id)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[#f5f5f5]">
                          <span className="truncate"><span className="font-semibold text-[#242424]">{l.company}</span> <span className="text-[#616161]">{l.contact}</span></span>
                          <span className="shrink-0 text-xs text-[#0b7e9b]">{l.ref}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {matchedCustomers.length > 0 && (
                    <div>
                      <p className="px-3 pb-1 pt-2 text-xs font-semibold text-[#616161]">Customers</p>
                      {matchedCustomers.map(c => (
                        <button key={c._id} onClick={() => selectResult('customer', c._id)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[#f5f5f5]">
                          <span className="truncate font-semibold text-[#242424]">{c.company}</span>
                          <span className="shrink-0 text-xs text-[#616161]">{c.tenantDomain}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {matchedTransfers.length > 0 && (
                    <div>
                      <p className="px-3 pb-1 pt-2 text-xs font-semibold text-[#616161]">Transfers</p>
                      {matchedTransfers.map(t => (
                        <button key={t._id} onClick={() => selectResult('transfer', t._id)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[#f5f5f5]">
                          <span className="truncate"><span className="font-semibold text-[#242424]">{t.company}</span> <span className="text-[#616161]">{t.domain}</span></span>
                          <span className="shrink-0 text-xs text-[#0b7e9b]">{t.ref}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <div className="relative" ref={ref}>
            <button onClick={() => setOpen(!open)} aria-label="Notifications" aria-expanded={open}
              className="relative grid size-9 place-items-center rounded-[4px] text-[#424242] hover:bg-[#f5f5f5]">
              <Bell className="size-5" strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#c50f1f] px-1 text-[9px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {open && (
              <div className="absolute right-0 top-11 z-50 w-96 overflow-hidden rounded-lg border border-[#e0e0e0] bg-white shadow-[0_0_2px_rgba(0,0,0,.12),0_8px_16px_rgba(0,0,0,.14)]">
                <div className="flex items-center justify-between border-b border-[#e0e0e0] px-4 py-3">
                  <span className="text-sm font-semibold text-[#242424]">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs font-semibold text-[#0b7e9b] hover:underline">Mark all as read</button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-[#616161]">You have no notifications.</p>
                  ) : (
                    notifications.map(n => (
                      <button key={n._id} onClick={() => { markAsRead(n._id); openLink(n.link) }}
                        className={`flex w-full items-start gap-3 border-b border-[#f0f0f0] px-4 py-3 text-left hover:bg-[#f5f5f5] ${!n.read ? 'bg-[#e8f7fb]' : ''}`}>
                        <span className={`mt-1.5 size-2 shrink-0 rounded-full ${!n.read ? 'bg-[#0b7e9b]' : 'bg-transparent'}`} aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#242424]">{n.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-[#616161]">{n.message}</p>
                          <p className="mt-1 text-[11px] text-[#8a8a8a]">{timeAgo(n.createdAt)}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {onNewLead && (
            <button onClick={() => onNewLead()}
              className="ml-1 hidden h-8 items-center gap-1.5 rounded-[4px] bg-[#0b7e9b] px-3 text-sm font-semibold text-white hover:bg-[#0a7390] sm:inline-flex">
              <Plus className="size-4" />
              New lead
            </button>
          )}

          <div className="relative ml-2" ref={menuRef}>
            <button onClick={() => setMenuOpen(v => !v)} aria-label="Account menu" aria-expanded={menuOpen}
              className="grid size-8 place-items-center rounded-full bg-[#12a2c6] text-xs font-bold text-white outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#242424]">
              {initials}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-lg border border-[#e0e0e0] bg-white shadow-[0_0_2px_rgba(0,0,0,.12),0_8px_16px_rgba(0,0,0,.14)]">
                <div className="border-b border-[#e0e0e0] px-4 py-3">
                  <p className="truncate text-sm font-semibold text-[#242424]">{userName}</p>
                  {userEmail && <p className="truncate text-xs text-[#616161]">{userEmail}</p>}
                  {userRole && <p className="mt-1 text-xs capitalize text-[#616161]">{userRole}</p>}
                </div>
                <button onClick={() => { setMenuOpen(false); openLink('account') }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[#242424] hover:bg-[#f5f5f5]">
                  <Settings className="size-4 text-[#616161]" strokeWidth={1.75} /> Account settings
                </button>
                <button onClick={() => signOut({ callbackUrl: '/portal/login' })}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[#242424] hover:bg-[#f5f5f5]">
                  <LogOut className="size-4 text-[#616161]" strokeWidth={1.75} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-5 pb-1 pt-6 md:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-[#616161]">
          <span>{info.section}</span>
          <span aria-hidden="true">&rsaquo;</span>
          <span>{info.title}</span>
        </nav>
        <h1 className="mt-1 text-[28px] font-semibold leading-[34px] tracking-[-0.4px] text-[#242424]">{info.title}</h1>
      </div>
    </>
  )
}
