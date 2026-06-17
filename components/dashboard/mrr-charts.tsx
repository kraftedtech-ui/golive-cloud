"use client"

import { Bar, BarChart, XAxis, YAxis, Pie, PieChart, Cell, LabelList, Tooltip } from "recharts"
import { mrrByCountry, mrrByPackage } from "@/lib/data"

const totalPackage = mrrByPackage.reduce((s, d) => s + d.value, 0)

function TooltipBox({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[#e3e9f0] bg-white p-2.5 shadow-xl text-xs">
      {label && <p className="mb-1.5 font-medium text-[#5c7184]">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="text-[#5c7184]">{p.name}</span>
          <span className="font-medium">{formatter ? formatter(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function MrrCharts() {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      {/* MRR by country */}
      <div className="rounded-xl border border-[#e3e9f0] bg-white p-5 shadow-sm lg:col-span-3">
        <div className="mb-1 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0096c7]">Revenue</p>
            <h2 className="mt-0.5 text-base font-semibold tracking-tight text-[#0d2233]">MRR by Country</h2>
            <p className="text-xs text-[#5c7184]">Top markets</p>
          </div>
          <span className="rounded-lg border border-[#e3e9f0] bg-[#eaf0f7] px-2.5 py-1 text-xs font-semibold text-[#0d2233] tabular-nums">
            $63.4k/mo
          </span>
        </div>
        <div className="mt-2 h-64 w-full">
          <BarChart width={480} height={240} data={mrrByCountry} layout="vertical" margin={{ left: 8, right: 48 }}>
            <XAxis type="number" dataKey="mrr" hide />
            <YAxis type="category" dataKey="country" tickLine={false} axisLine={false} width={92} tick={{ fontSize: 12, fill: "#5c7184" }} />
            <Tooltip content={(props) => <TooltipBox {...props} formatter={(v: number) => `$${v.toLocaleString()}/mo`} />} cursor={false} />
            <Bar dataKey="mrr" fill="#0096c7" radius={6} barSize={22}>
              <LabelList dataKey="mrr" position="right" offset={8} style={{ fill: "#0d2233" }} fontSize={11} formatter={(v: number) => `$${(v/1000).toFixed(1)}k`} />
            </Bar>
          </BarChart>
        </div>
      </div>

      {/* MRR by package */}
      <div className="rounded-xl border border-[#e3e9f0] bg-white p-5 shadow-sm lg:col-span-2">
        <div className="mb-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0096c7]">License Mix</p>
          <h2 className="mt-0.5 text-base font-semibold tracking-tight text-[#0d2233]">MRR by Package</h2>
        </div>
        <div className="relative mx-auto mt-2 flex items-center justify-center" style={{ height: 208, width: 208 }}>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] font-medium text-[#5c7184]">Total MRR</span>
            <span className="text-xl font-semibold tracking-tight text-[#0d2233] tabular-nums">${(totalPackage/1000).toFixed(1)}k</span>
          </div>
          <PieChart width={208} height={208}>
            <Tooltip content={(props) => <TooltipBox {...props} formatter={(v: number) => `$${v.toLocaleString()}/mo`} />} />
            <Pie data={mrrByPackage} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} strokeWidth={2} stroke="#ffffff">
              {mrrByPackage.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
            </Pie>
          </PieChart>
        </div>
        <div className="mt-1 space-y-1.5">
          {mrrByPackage.map((p) => (
            <div key={p.name} className="flex items-center gap-2 text-xs">
              <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: p.fill }} />
              <span className="text-[#5c7184]">{p.name}</span>
              <span className="ml-auto font-medium text-[#0d2233]">{Math.round((p.value/totalPackage)*100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
