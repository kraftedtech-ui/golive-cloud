"use client"

import { useEffect, useState } from "react"
import { TrendingUp, AlertTriangle, DollarSign, Users, UserPlus } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"

export function StatCards({ isAdmin = true }: { isAdmin?: boolean }) {
  const [data, setData] = useState({
    totalMRR: 0, activeCustomers: 0, newLeadsThisWeek: 0, renewalAlerts: 0, loading: true
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/leads').then(r => r.json()),
      fetch('/api/customers').then(r => r.json()),
    ]).then(([leads, customers]) => {
      const allLeads = leads.leads || []
      const allCustomers = customers.customers || []

      const totalMRR = allCustomers.reduce((s: number, c: any) => s + (c.mrr || 0), 0)
      const activeCustomers = allCustomers.filter((c: any) => c.status !== 'churned').length

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const newLeadsThisWeek = allLeads.filter((l: any) => new Date(l.createdAt) > weekAgo).length

      const renewalAlerts = allCustomers.filter((c: any) => {
        if (!c.renewalDate) return false
        const d = new Date(c.renewalDate)
        return (d.getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000
      }).length

      setData({ totalMRR, activeCustomers, newLeadsThisWeek, renewalAlerts, loading: false })
    }).catch(() => setData(d => ({ ...d, loading: false })))
  }, [])

  const stats = [
    { label: isAdmin ? "Total MRR" : "Your MRR", value: data.loading ? "—" : `$${data.totalMRR.toLocaleString()}`, change: "Monthly", trend: "up" as const, hint: isAdmin ? "from active customers" : "from customers you closed", icon: DollarSign, spark: [0, data.totalMRR * 0.7, data.totalMRR * 0.8, data.totalMRR * 0.9, data.totalMRR] },
    { label: isAdmin ? "Active Customers" : "Your Customers", value: data.loading ? "—" : String(data.activeCustomers), change: "Total", trend: "up" as const, hint: "Microsoft 365 accounts", icon: Users, spark: [0, data.activeCustomers * 0.8, data.activeCustomers * 0.9, data.activeCustomers] },
    { label: "New Leads this week", value: data.loading ? "—" : String(data.newLeadsThisWeek), change: "Last 7 days", trend: "up" as const, hint: "from assessment form", icon: UserPlus, spark: [0, data.newLeadsThisWeek * 0.5, data.newLeadsThisWeek * 0.8, data.newLeadsThisWeek] },
    { label: "Renewal alerts", value: data.loading ? "—" : String(data.renewalAlerts), change: "Due ≤ 30 days", trend: data.renewalAlerts > 0 ? "alert" as const : "up" as const, hint: "customers renewing soon", icon: AlertTriangle, spark: [0, data.renewalAlerts] },
  ]

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon
        const isAlert = stat.trend === "alert"
        const sparkColor = isAlert ? "#e5484d" : "#0096c7"
        const sparkData = stat.spark.map((v, idx) => ({ idx, v }))
        return (
          <div key={stat.label} className="relative overflow-hidden rounded-xl border border-[#e3e9f0] bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className={`flex size-9 items-center justify-center rounded-lg ${isAlert ? "bg-red-50 text-red-600" : "bg-[#e4f5fa] text-[#075066]"}`}>
                <Icon className="size-4" />
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${isAlert ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
                {isAlert ? <AlertTriangle className="size-3" /> : <TrendingUp className="size-3" />}
                {stat.change}
              </span>
            </div>
            <p className="mt-4 text-sm font-medium text-[#5c7184]">{stat.label}</p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <p className="text-[28px] font-semibold leading-none tracking-tight text-[#0d2233] tabular-nums">{stat.value}</p>
              <div className="h-9 w-20 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
                    <defs>
                      <linearGradient id={`spark-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={sparkColor} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area dataKey="v" type="monotone" stroke={sparkColor} strokeWidth={2} fill={`url(#spark-${i})`} dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="mt-2 text-xs text-[#5c7184]">{stat.hint}</p>
          </div>
        )
      })}
    </section>
  )
}
