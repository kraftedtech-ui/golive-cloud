"use client"

import { TrendingUp, AlertTriangle, DollarSign, Users, UserPlus } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { stats } from "@/lib/data"

const icons = [DollarSign, Users, UserPlus, AlertTriangle]

export function StatCards() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, i) => {
        const Icon = icons[i]
        const isAlert = stat.trend === "alert"
        const data = stat.spark.map((v, idx) => ({ idx, v }))
        const sparkColor = isAlert ? "#e5484d" : "#0096c7"
        return (
          <div key={stat.label} className="relative overflow-hidden rounded-xl border border-[#e3e9f0] bg-white p-5 shadow-sm ring-1 ring-[#e3e9f0]/60 transition-all hover:shadow-md">
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
                  <AreaChart data={data} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
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
