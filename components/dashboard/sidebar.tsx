"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import {
  Home, Cloud, ArrowLeftRight, KanbanSquare, DollarSign, ClipboardList, FileText, Tags,
  ListChecks, Bell, BookOpen, ClipboardCheck, UserRound, BriefcaseBusiness, Users,
  AlertTriangle, ShieldCheck, GraduationCap, Award, ExternalLink, Handshake, Percent,
  ChevronDown, type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Portal navigation, Fluent 2.
 *
 * Grouping (approved Sept 2026): Home first; Sales, Tools, Team as before; a
 * People group for hiring and staff; Administration last. Items marked
 * adminOnly are filtered per user, and a heading is hidden when none of its
 * items are visible, so a sales rep never sees an empty People group.
 *
 * Works in two places:
 * - inside the single-page portal (/portal), where onNavigate switches panels;
 * - on standalone routes (/portal/people...), where there is no onNavigate,
 *   so panel items link back to /portal#key, which the portal opens directly.
 */

type NavItem = { label: string; icon: LucideIcon; key: string; adminOnly?: boolean; href?: string }
type NavSection = { heading: string | null; items: NavItem[] }

const sections: NavSection[] = [
  { heading: null, items: [{ label: "Home", icon: Home, key: "dashboard" }] },
  {
    heading: "Sales",
    items: [
      { label: "Cloud assessments", icon: Cloud, key: "assessments" },
      { label: "Transfer requests", icon: ArrowLeftRight, key: "transfers" },
      { label: "CRM pipeline", icon: KanbanSquare, key: "pipeline" },
      { label: "Commissions", icon: DollarSign, key: "commissions" },
    ],
  },
  {
    heading: "Tools",
    items: [
      { label: "Discovery questionnaire", icon: ClipboardList, key: "discovery" },
      { label: "Proposal generator", icon: FileText, key: "proposals" },
      { label: "Product mapping", icon: Tags, key: "product-mapping" },
      { label: "Deployment workflow", icon: ListChecks, key: "onboarding" },
    ],
  },
  {
    heading: "Team",
    items: [
      { label: "Announcements", icon: Bell, key: "announcements" },
      { label: "Knowledge base", icon: BookOpen, key: "knowledge" },
    ],
  },
  {
    heading: "People",
    items: [
      { label: "Candidate assessments", icon: ClipboardCheck, key: "hr-assessments", adminOnly: true },
      { label: "Employees", icon: UserRound, key: "hr-people", adminOnly: true, href: "/portal/people" },
      { label: "Positions", icon: BriefcaseBusiness, key: "positions", adminOnly: true, href: "/portal/people/positions" },
    ],
  },
  {
    heading: "Partner Network",
    items: [
      { label: "Partner applications", icon: Handshake, key: "partners", adminOnly: true, href: "/portal/partners" },
      { label: "Deal registrations", icon: ClipboardCheck, key: "partner_deals", adminOnly: true, href: "/portal/partners/deals" },
      { label: "Commission schedule", icon: Percent, key: "partner_commission", adminOnly: true, href: "/portal/partners/commission" },
    ],
  },
  {
    heading: "Administration",
    items: [
      { label: "Customer accounts", icon: Users, key: "customers" },
      { label: "Payment risk", icon: AlertTriangle, key: "payment-risk" },
      { label: "Pricing catalogue", icon: Tags, key: "pricing", adminOnly: true },
      { label: "Setup fee catalogue", icon: Tags, key: "setup-fees", adminOnly: true },
      { label: "Team and access", icon: ShieldCheck, key: "team", adminOnly: true },
    ],
  },
]

const resources = [
  { label: "Certification guide", desc: "Microsoft Solutions Partner path", icon: GraduationCap, key: "resources_cert" },
  { label: "Partner resources", desc: "Microsoft Partner Center", icon: Award, key: "resources_partner", href: "https://partner.microsoft.com" },
  { label: "Learn platform", desc: "Free exam study paths", icon: BookOpen, key: "resources_learn", href: "https://learn.microsoft.com" },
]

const itemBase =
  "relative flex h-8 w-full items-center gap-3 rounded-[4px] px-3 text-left text-sm transition-colors " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#242424]"
const itemIdle = "text-[#424242] hover:bg-[#f0f0f0] hover:text-[#242424]"
const itemOn = "bg-[#f0f0f0] font-semibold text-[#242424]"

export function Sidebar({ active, onNavigate }: { active: string; onNavigate?: (key: string) => void }) {
  const { data: session } = useSession()
  const role = (session?.user as { role?: string } | undefined)?.role || "viewer"
  const [resourcesOpen, setResourcesOpen] = useState(false)
  // Show a fade at the bottom edge while navigation items are hidden below,
  // so it is obvious the list continues on shorter screens.
  const navRef = useRef<HTMLElement>(null)
  const [moreBelow, setMoreBelow] = useState(false)
  useEffect(() => {
    const el = navRef.current
    if (!el) return
    const check = () => setMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 4)
    check()
    el.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => { el.removeEventListener('scroll', check); window.removeEventListener('resize', check) }
  }, [resourcesOpen, role])

  const go = (key: string) => {
    if (onNavigate) onNavigate(key)
    else window.location.href = `/portal#${key}`
  }

  const visible = sections
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.adminOnly || role === "admin") }))
    .filter((s) => s.items.length > 0)

  const Item = ({ item }: { item: NavItem }) => {
    const on = active === item.key
    const inner = (
      <>
        {on && <span className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-full bg-[#12a2c6]" aria-hidden="true" />}
        <item.icon className={cn("size-[18px] shrink-0", on ? "text-[#0b7e9b]" : "text-[#616161]")} strokeWidth={1.75} />
        <span className="truncate">{item.label}</span>
      </>
    )
    return (
      <li>
        {item.href ? (
          <a href={item.href} aria-current={on ? "page" : undefined} className={cn(itemBase, on ? itemOn : itemIdle)}>{inner}</a>
        ) : (
          <button type="button" onClick={() => go(item.key)} aria-current={on ? "page" : undefined} className={cn(itemBase, on ? itemOn : itemIdle)}>{inner}</button>
        )}
      </li>
    )
  }

  return (
    <aside
      className="fixed bottom-0 left-0 top-14 z-20 hidden w-[268px] flex-col border-r border-[#e0e0e0] bg-[#fafafa] lg:flex"
      aria-label="Portal navigation"
    >
      <div className="relative flex min-h-0 flex-1 flex-col">
      <nav ref={navRef} className="flex-1 overflow-y-auto px-2 py-3">
        {visible.map((section, i) => (
          <div key={section.heading || i} className={section.heading ? "mt-3" : ""}>
            {section.heading && <p className="px-3 pb-0.5 text-xs font-semibold text-[#616161]">{section.heading}</p>}
            <ul className="space-y-0.5">
              {section.items.map((item) => <Item key={item.key} item={item} />)}
            </ul>
          </div>
        ))}

        <div className="mt-3">
          <button
            type="button"
            onClick={() => setResourcesOpen((v) => !v)}
            aria-expanded={resourcesOpen}
            className="flex w-full items-center justify-between rounded-[4px] px-3 py-1 text-xs font-semibold text-[#616161] hover:text-[#242424]"
          >
            <span>Resources</span>
            <ChevronDown className={cn("size-3.5 transition-transform", resourcesOpen && "rotate-180")} />
          </button>
          {resourcesOpen && (
            <ul className="mt-1 space-y-0.5">
              {resources.map((r) => {
                const Icon = r.icon
                const inner = (
                  <>
                    <Icon className="size-[18px] shrink-0 text-[#616161]" strokeWidth={1.75} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{r.label}</span>
                      <span className="block truncate text-[11px] text-[#8a8a8a]">{r.desc}</span>
                    </span>
                    {r.href && <ExternalLink className="size-3.5 shrink-0 text-[#8a8a8a]" />}
                  </>
                )
                return (
                  <li key={r.key}>
                    {r.href ? (
                      <a href={r.href} target="_blank" rel="noopener noreferrer" className={cn(itemBase, itemIdle, "h-auto py-1.5")}>{inner}</a>
                    ) : (
                      <button type="button" onClick={() => go(r.key)} className={cn(itemBase, active === r.key ? itemOn : itemIdle, "h-auto py-1.5")}>{inner}</button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </nav>
      {moreBelow && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#fafafa] to-transparent" aria-hidden="true" />
      )}
      </div>

      <div className="border-t border-[#e0e0e0] px-2 py-3">
        <div className="mx-1 flex items-center gap-2.5 rounded-lg border border-[#e0e0e0] bg-white px-3 py-2">
          <span className="size-2 shrink-0 rounded-full bg-[#107c10]" aria-hidden="true" />
          <div className="leading-tight">
            <p className="text-xs font-semibold text-[#242424]">Indirect provider</p>
            <p className="text-[11px] text-[#616161]">Microsoft CSP, ID 6787357</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
