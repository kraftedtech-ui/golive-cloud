"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Users, Hash } from "lucide-react"
import { cn } from "@/lib/utils"

type PipelineStage = "New Lead" | "Assessment Done" | "Quote Sent" | "Negotiating" | "Won" | "Lost"

const STAGES: { id: PipelineStage; label: string; dot: string }[] = [
  { id: "New Lead", label: "New Lead", dot: "bg-[#b4cdf6]" },
  { id: "Assessment Done", label: "Assessment Done", dot: "bg-[#6aa9e0]" },
  { id: "Quote Sent", label: "Quote Sent", dot: "bg-[#0096c7]" },
  { id: "Negotiating", label: "Negotiating", dot: "bg-[#e08a00]" },
  { id: "Won", label: "Won", dot: "bg-[#0f9d6e]" },
]

const ownerColors = ["bg-[#0096c7]","bg-[#00c8c8]","bg-[#6aa9e0]","bg-[#0d2233]","bg-[#e08a00]"]

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function DealCard({ lead, onStageChange, isAdmin, userEmail }: { lead: any; onStageChange: (id: string, stage: string) => void; isAdmin: boolean; userEmail?: string | null }) {
  const initials = getInitials(lead.contact || lead.company || 'U')
  const colorIdx = lead.company?.charCodeAt(0) % ownerColors.length || 0
  const canEdit = isAdmin || (lead.assignedToEmail && lead.assignedToEmail === userEmail)
  return (
    <div className="group rounded-xl border border-[#e3e9f0] bg-white p-3 shadow-xs ring-1 ring-transparent transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-[#0096c7]/20">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#0d2233]">{lead.company}</p>
          <p className="mt-0.5 text-xs text-[#5c7184]">{lead.country}</p>
        </div>
        <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-white", ownerColors[colorIdx])}>
          {initials}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-[#5c7184]">
        <span className="inline-flex items-center gap-1"><Users className="size-3.5" />{lead.users}</span>
        <span className="inline-flex items-center gap-1 font-mono text-[11px]"><Hash className="size-3" />{lead.ref?.slice(-8)}</span>
      </div>
      {lead.assignedTo && (
        <p className="mt-2 text-[10px] text-[#5c7184]">Assigned: <span className="font-medium text-[#0d2233]">{lead.assignedTo}</span></p>
      )}
      <div className="mt-3">
        {canEdit ? (
          <select value={lead.status} onChange={e => onStageChange(lead._id, e.target.value)}
            className="w-full rounded-md border border-[#e3e9f0] bg-[#f4f7fb] px-2 py-1.5 text-xs text-[#0d2233] outline-none focus:border-[#0096c7] focus:ring-1 focus:ring-[#0096c7]/30">
            {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        ) : (
          <div title={lead.assignedTo ? `Only ${lead.assignedTo} or an admin can change this` : 'Assign this lead first to change its status'}
            className="w-full cursor-not-allowed rounded-md border border-[#e3e9f0] bg-[#f4f7fb] px-2 py-1.5 text-xs text-[#5c7184] opacity-70">
            🔒 {lead.status}
          </div>
        )}
      </div>
    </div>
  )
}

export function KanbanBoard() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role || "viewer"
  const isAdmin = role === "admin"
  const userEmail = session?.user?.email
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeads = () => {
    fetch('/api/leads')
      .then(r => r.json())
      .then(d => { if (d.success) setLeads(d.leads || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchLeads() }, [])

  const handleStageChange = async (id: string, status: string) => {
    setLeads(prev => prev.map(l => l._id === id ? { ...l, status } : l))
    await fetch(`/api/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
  }

  const activeLeads = leads.filter(l => l.status !== 'Lost')
  const totalValue = activeLeads.length * 500 // estimated

  return (
    <section className="rounded-2xl border border-[#e3e9f0] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0096c7]">Pipeline</p>
          <h2 className="mt-0.5 text-base font-semibold tracking-tight text-[#0d2233]">CRM Pipeline</h2>
          <p className="text-xs text-[#5c7184]">{activeLeads.length} active opportunities · update status inline</p>
        </div>
        <span className="hidden rounded-lg border border-[#e3e9f0] bg-[#eaf0f7] px-3 py-1.5 text-xs font-medium text-[#5c7184] sm:inline-flex">
          {leads.length} total leads
        </span>
      </div>
      {loading ? (
        <div className="py-12 text-center text-sm text-[#5c7184]">Loading pipeline...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {STAGES.map(stage => {
            const column = leads.filter(l => l.status === stage.id)
            return (
              <div key={stage.id} className="flex flex-col rounded-xl border border-[#e3e9f0]/60 bg-[#eaf0f7]/50 p-2.5">
                <div className="mb-1 flex items-center justify-between px-1.5">
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", stage.dot)} />
                    <span className="text-xs font-semibold text-[#0d2233]">{stage.label}</span>
                  </div>
                  <span className="flex size-5 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-[#5c7184] ring-1 ring-[#e3e9f0]">{column.length}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2.5 mt-2">
                  {column.map(lead => (
                    <DealCard key={lead._id} lead={lead} onStageChange={handleStageChange} isAdmin={isAdmin} userEmail={userEmail} />
                  ))}
                  {column.length === 0 && (
                    <p className="rounded-lg border border-dashed border-[#e3e9f0] px-2 py-6 text-center text-[11px] text-[#5c7184]">No leads</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
