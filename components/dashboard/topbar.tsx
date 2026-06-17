"use client"

import { Search, Bell, Plus } from "lucide-react"

const PAGE_LABELS: Record<string, { section: string; title: string }> = {
  dashboard:    { section: "Admin",   title: "Sales Dashboard" },
  assessments:  { section: "Sales",  title: "Cloud Assessment Leads" },
  transfers:    { section: "Sales",  title: "Transfer Requests" },
  pipeline:     { section: "Sales",  title: "CRM Pipeline" },
  proposals:    { section: "Tools",  title: "Proposal Generator" },
  onboarding:   { section: "Tools",  title: "Onboarding Checklist" },
  customers:    { section: "Admin",  title: "Customer Accounts" },
  team:         { section: "Admin",  title: "Team & Access Control" },
}

export function Topbar({ page = "dashboard" }: { page?: string }) {
  const info = PAGE_LABELS[page] || PAGE_LABELS.dashboard

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
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5c7184]" />
          <input type="search" placeholder="Search customers, refs…" aria-label="Search"
            className="h-9 w-56 rounded-lg border border-[#e3e9f0] bg-white pl-9 pr-3 text-sm text-[#0d2233] shadow-xs outline-none transition-colors placeholder:text-[#5c7184] focus:border-[#0096c7] focus:ring-2 focus:ring-[#0096c7]/30" />
        </div>
        <button className="hidden h-9 items-center gap-1.5 rounded-lg border border-[#e3e9f0] bg-white px-3 text-sm font-normal text-[#5c7184] shadow-xs lg:inline-flex">
          Last 30 days
        </button>
        <button className="relative flex size-9 items-center justify-center rounded-lg border border-[#e3e9f0] bg-white shadow-xs" aria-label="Notifications">
          <Bell className="size-4 text-[#5c7184]" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#0096c7] px-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0096c7]/90">
          <Plus className="size-4" />
          <span className="hidden sm:inline">New Lead</span>
        </button>
      </div>
    </header>
  )
}
