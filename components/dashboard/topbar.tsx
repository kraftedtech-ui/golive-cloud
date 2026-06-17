"use client"

import { Search, Bell, Plus, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-5 backdrop-blur-md md:px-8">
      <div className="min-w-0">
        <nav
          aria-label="Breadcrumb"
          className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"
        >
          <span>Sales</span>
          <ChevronRight className="size-3" />
          <span className="font-medium text-foreground">Dashboard</span>
        </nav>
        <h1 className="truncate text-base font-semibold tracking-tight text-foreground md:text-lg">
          Sales Dashboard
        </h1>
      </div>

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search customers, refs…"
            aria-label="Search"
            className="h-9 w-56 rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="hidden h-9 gap-1.5 bg-card font-normal text-muted-foreground shadow-xs lg:inline-flex"
        >
          <Calendar className="size-4" />
          Last 30 days
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="relative size-9 bg-card shadow-xs"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive ring-2 ring-card" />
        </Button>

        <Button size="sm" className="h-9 gap-1.5 shadow-sm">
          <Plus className="size-4" />
          <span className="hidden sm:inline">New Lead</span>
        </Button>
      </div>
    </header>
  )
}
