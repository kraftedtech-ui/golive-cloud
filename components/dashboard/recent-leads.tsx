"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

type LeadStatus = "New Lead" | "Assessment Done" | "Quote Sent" | "Negotiating" | "Won" | "Lost"

const statusStyle: Record<string, string> = {
  "New Lead": "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  "Assessment Done": "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200",
  "Quote Sent": "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-200",
  "Negotiating": "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200",
  "Won": "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
  "Lost": "bg-gray-50 text-gray-500 ring-1 ring-inset ring-gray-200",
}

const statusDot: Record<string, string> = {
  "New Lead": "bg-blue-500",
  "Assessment Done": "bg-purple-500",
  "Quote Sent": "bg-yellow-500",
  "Negotiating": "bg-orange-500",
  "Won": "bg-green-500",
  "Lost": "bg-gray-400",
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return 'Just now'
}

export function RecentLeads() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leads')
      .then(r => r.json())
      .then(d => {
        if (d.success) setLeads((d.leads || []).slice(0, 6))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <section className="rounded-2xl border border-[#e3e9f0] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#e3e9f0] px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0096c7]">Inbound</p>
          <h2 className="mt-0.5 text-base font-semibold tracking-tight text-[#0d2233]">Recent Leads</h2>
        </div>
        <span className="text-xs text-[#5c7184]">{leads.length} shown</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e3e9f0]">
              {['Company','Contact','Country','Users','Status','Added'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#5c7184]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-sm text-[#5c7184]">Loading...</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-sm text-[#5c7184]">No leads yet — submit the assessment form at cloud.golivecompany.com</td></tr>
            ) : leads.map((lead, i) => (
              <tr key={lead._id || i} className="border-b border-[#e3e9f0]/50 transition-colors hover:bg-[#eaf0f7]/40">
                <td className="px-5 py-3">
                  <div className="font-medium text-[#0d2233] text-sm">{lead.company}</div>
                  <div className="text-xs text-[#5c7184]">{lead.industry}</div>
                </td>
                <td className="px-5 py-3 text-sm text-[#5c7184]">{lead.contact}</td>
                <td className="px-5 py-3 text-sm text-[#5c7184]">{lead.country}</td>
                <td className="px-5 py-3 text-sm font-medium text-[#0d2233]">{lead.users}</td>
                <td className="px-5 py-3">
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold", statusStyle[lead.status] || statusStyle['New Lead'])}>
                    <span className={cn("size-1.5 rounded-full", statusDot[lead.status] || statusDot['New Lead'])} />
                    {lead.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-[#5c7184]">{timeAgo(lead.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
