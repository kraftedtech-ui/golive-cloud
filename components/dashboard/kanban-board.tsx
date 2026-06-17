"use client"

import { useState } from "react"
import { Users, Hash } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { deals as initialDeals, STAGES, type Deal, type PipelineStage } from "@/lib/data"

const stageDot: Record<PipelineStage, string> = {
  "new-lead": "bg-[var(--color-chart-5)]",
  "assessment-done": "bg-[var(--color-chart-4)]",
  "quote-sent": "bg-[var(--color-chart-1)]",
  negotiating: "bg-warning",
  won: "bg-success",
}

const ownerColor: Record<string, string> = {
  AM: "bg-[var(--color-chart-1)]",
  TK: "bg-[var(--color-chart-2)]",
  NB: "bg-[var(--color-chart-4)]",
}

function DealCard({
  deal,
  onStageChange,
}: {
  deal: Deal
  onStageChange: (id: string, stage: PipelineStage) => void
}) {
  return (
    <div className="group rounded-xl border border-border bg-card p-3 shadow-xs ring-1 ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/20">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {deal.company}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {deal.flag} {deal.country}
          </p>
        </div>
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-card",
            ownerColor[deal.owner] ?? "bg-muted-foreground",
          )}
          title={`Owner: ${deal.owner}`}
        >
          {deal.owner}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Users className="size-3.5" />
          {deal.users}
        </span>
        <span className="inline-flex items-center gap-1 font-mono text-[11px]">
          <Hash className="size-3" />
          {deal.ref}
        </span>
        <span className="ml-auto font-semibold text-foreground tabular-nums">
          ${deal.value.toLocaleString()}
          <span className="font-normal text-muted-foreground">/mo</span>
        </span>
      </div>

      <div className="mt-3">
        <Select
          value={deal.stage}
          onValueChange={(v) => onStageChange(deal.id, v as PipelineStage)}
        >
          <SelectTrigger size="sm" className="h-8 w-full text-xs">
            <span className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", stageDot[deal.stage])} />
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            {STAGES.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-xs">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export function KanbanBoard() {
  const [deals, setDeals] = useState<Deal[]>(initialDeals)

  const handleStageChange = (id: string, stage: PipelineStage) => {
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, stage } : d)))
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
            Pipeline
          </p>
          <h2 className="mt-0.5 text-base font-semibold tracking-tight text-foreground">
            CRM Pipeline
          </h2>
          <p className="text-xs text-muted-foreground">
            {deals.length} active opportunities · update status inline
          </p>
        </div>
        <span className="hidden rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
          ${deals.reduce((s, d) => s + d.value, 0).toLocaleString()}/mo total
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {STAGES.map((stage) => {
          const column = deals.filter((d) => d.stage === stage.id)
          const total = column.reduce((sum, d) => sum + d.value, 0)
          return (
            <div
              key={stage.id}
              className="flex flex-col rounded-xl border border-border/60 bg-secondary/50 p-2.5"
            >
              <div className="mb-1 flex items-center justify-between px-1.5">
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", stageDot[stage.id])} />
                  <span className="text-xs font-semibold text-foreground">
                    {stage.label}
                  </span>
                </div>
                <span className="flex size-5 items-center justify-center rounded-full bg-card text-[10px] font-semibold text-muted-foreground ring-1 ring-border">
                  {column.length}
                </span>
              </div>
              <p className="mb-2 px-1.5 text-[11px] font-medium text-muted-foreground tabular-nums">
                ${total.toLocaleString()}/mo
              </p>
              <div className="flex flex-1 flex-col gap-2.5">
                {column.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onStageChange={handleStageChange}
                  />
                ))}
                {column.length === 0 && (
                  <p className="rounded-lg border border-dashed border-border px-2 py-6 text-center text-[11px] text-muted-foreground">
                    No deals
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
