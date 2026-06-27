"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import {
  ArrowLeftRight, KanbanSquare, FileText, ListChecks,
  Users, ShieldCheck, LayoutDashboard, LogOut, BadgeCheck,
  BookOpen, Award, GraduationCap, ExternalLink, ChevronDown,
  DollarSign, Bell, Settings, Tags, AlertTriangle,
  type LucideIcon, Cloud,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = { label: string; icon: LucideIcon; key: string; adminOnly?: boolean }
type NavSection = { heading: string; items: NavItem[] }

const sections: NavSection[] = [
  {
    heading: "Sales",
    items: [
      { label: "Cloud Assessments", icon: Cloud, key: "assessments" },
      { label: "Transfer Requests", icon: ArrowLeftRight, key: "transfers" },
      { label: "CRM Pipeline", icon: KanbanSquare, key: "pipeline" },
      { label: "Commissions", icon: DollarSign, key: "commissions" },
    ],
  },
  {
    heading: "Tools",
    items: [
      { label: "Proposal Generator", icon: FileText, key: "proposals" },
      { label: "Product Mapping", icon: Tags, key: "product-mapping" },
      { label: "Onboarding Checklist", icon: ListChecks, key: "onboarding" },
    ],
  },
  {
    heading: "Team",
    items: [
      { label: "Announcements", icon: Bell, key: "announcements" },
      { label: "Knowledge Base", icon: BookOpen, key: "knowledge" },
    ],
  },
  {
    heading: "Admin",
    items: [
      { label: "Customer Accounts", icon: Users, key: "customers" },
      { label: "Payment Risk", icon: AlertTriangle, key: "payment-risk" },
      { label: "Pricing Catalog", icon: Tags, key: "pricing", adminOnly: true },
      { label: "Team & Access", icon: ShieldCheck, key: "team", adminOnly: true },
      { label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
    ],
  },
]

const resources = [
  {
    label: "Certification Guide",
    desc: "MS Solutions Partner path",
    icon: GraduationCap,
    key: "resources_cert",
    badge: "NEW",
  },
  {
    label: "Partner Resources",
    desc: "Microsoft Partner Center",
    icon: Award,
    key: "resources_partner",
    href: "https://partner.microsoft.com",
  },
  {
    label: "Learn Platform",
    desc: "Free exam study paths",
    icon: BookOpen,
    key: "resources_learn",
    href: "https://learn.microsoft.com",
  },
]

export function Sidebar({ active, onNavigate }: { active: string; onNavigate: (key: string) => void }) {
  const { data: session } = useSession()
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const name = session?.user?.name || "Admin"
  const role = (session?.user as any)?.role || "admin"
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-gradient-to-b from-[#10293c] via-sidebar to-[#0a1c2b] text-sidebar-foreground lg:flex">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-sidebar-border/60 px-5 py-[18px]">
        <img src="/images/logo-dark.png" alt="GoLive" style={{ height: 80, width: 'auto', mixBlendMode: 'screen' }} />
      </div>

      {/* User */}
      <div className="mx-4 mt-4 flex items-center gap-3 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/60 px-3 py-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-chart-2)] to-primary text-sm font-semibold text-white ring-2 ring-white/10">
          {initials}
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-medium text-white">{name}</p>
          <span className="mt-1 inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-chart-5)] ring-1 ring-inset ring-primary/30">
            {role}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-2 flex-1 overflow-y-auto px-3 pb-4">
        {sections.map((section) => (
          <div key={section.heading} className="mb-5">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50">
              {section.heading}
            </p>
            <ul className="space-y-1">
              {section.items.filter((item) => !item.adminOnly || role === "admin").map((item) => {
                const isActive = active === item.key
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => onNavigate(item.key)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                        isActive
                          ? "bg-sidebar-accent text-white shadow-sm ring-1 ring-inset ring-white/10"
                          : "text-sidebar-foreground/90 hover:bg-sidebar-accent/50 hover:text-white",
                      )}
                    >
                      {isActive && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[var(--color-chart-2)]" />}
                      <item.icon className={cn("size-4 shrink-0", isActive ? "text-[var(--color-chart-2)]" : "text-sidebar-foreground/70")} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}

        {/* Resources Section */}
        <div className="mb-5">
          <button
            type="button"
            onClick={() => setResourcesOpen(v => !v)}
            className="flex w-full items-center justify-between px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors"
          >
            <span>Resources</span>
            <ChevronDown className={cn("size-3 transition-transform", resourcesOpen && "rotate-180")} />
          </button>

          {resourcesOpen && (
            <ul className="space-y-1">
              {resources.map((item) => {
                const isActive = active === item.key
                const Icon = item.icon
                const isExternal = !!item.href

                return (
                  <li key={item.key}>
                    {isExternal ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all text-sidebar-foreground/90 hover:bg-sidebar-accent/50 hover:text-white"
                      >
                        <Icon className="size-4 shrink-0 text-sidebar-foreground/70" />
                        <div className="min-w-0 flex-1">
                          <span className="truncate block text-sm">{item.label}</span>
                          <span className="text-[10px] text-sidebar-foreground/50 truncate block">{item.desc}</span>
                        </div>
                        <ExternalLink className="size-3 shrink-0 text-sidebar-foreground/40" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onNavigate(item.key)}
                        className={cn(
                          "relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                          isActive
                            ? "bg-sidebar-accent text-white shadow-sm ring-1 ring-inset ring-white/10"
                            : "text-sidebar-foreground/90 hover:bg-sidebar-accent/50 hover:text-white",
                        )}
                      >
                        {isActive && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[var(--color-chart-2)]" />}
                        <Icon className={cn("size-4 shrink-0", isActive ? "text-[var(--color-chart-2)]" : "text-sidebar-foreground/70")} />
                        <div className="min-w-0 flex-1 text-left">
                          <span className="truncate block text-sm">{item.label}</span>
                          <span className="text-[10px] text-sidebar-foreground/50 truncate block">{item.desc}</span>
                        </div>
                        {item.badge && (
                          <span className="shrink-0 rounded-full bg-[var(--color-chart-2)]/20 px-1.5 py-0.5 text-[9px] font-bold text-[var(--color-chart-2)]">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border/60 px-4 py-4">
        <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-[var(--color-chart-2)]/20 bg-[var(--color-chart-2)]/10 px-3 py-2.5">
          <BadgeCheck className="size-4 shrink-0 text-[var(--color-chart-2)]" />
          <div className="leading-tight">
            <p className="text-[11px] font-semibold text-white">Indirect Provider</p>
            <p className="text-[10px] text-sidebar-foreground/70">Microsoft CSP · ID 6787357</p>
          </div>
          <span className="ml-auto size-1.5 animate-pulse rounded-full bg-[var(--color-chart-2)]" />
        </div>
        <button
          type="button"
          onClick={() => onNavigate('account')}
          className={cn(
            "mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            active === 'account'
              ? "bg-sidebar-accent text-white"
              : "text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-white"
          )}
        >
          <Settings className="size-4" />
          Account Settings
        </button>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/portal/login' })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-white"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
