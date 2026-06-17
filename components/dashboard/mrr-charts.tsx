"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, XAxis, YAxis, Pie, PieChart, Cell, LabelList, Tooltip } from "recharts"

const PACKAGE_COLORS = ["#0096c7","#00c8c8","#6aa9e0","#0d2233","#b4cdf6"]
const COUNTRY_COLORS: Record<string, string> = {
  Nigeria: "#0096c7", Ghana: "#00c8c8", Kenya: "#6aa9e0",
  "South Africa": "#0d2233", Rwanda: "#b4cdf6", Uganda: "#e08a00", Other: "#5c7184"
}

function TooltipBox({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[#e3e9f0] bg-white p-2.5 shadow-xl text-xs">
      {label && <p className="mb-1.5 font-medium text-[#5c7184]">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="font-medium">{formatter ? formatter(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function MrrCharts() {
  const [countryData, setCountryData] = useState<any[]>([])
  const [packageData, setPackageData] = useState<any[]>([])
  const [totalMRR, setTotalMRR] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/customers')
      .then(r => r.json())
      .then(d => {
        const customers = d.customers || []
        const total = customers.reduce((s: number, c: any) => s + (c.mrr || 0), 0)
        setTotalMRR(total)

        // Group by country
        const byCountry: Record<string, number> = {}
        customers.forEach((c: any) => {
          const country = c.country || 'Other'
          byCountry[country] = (byCountry[country] || 0) + (c.mrr || 0)
        })
        const countryArr = Object.entries(byCountry)
          .map(([country, mrr]) => ({ country, mrr }))
          .sort((a, b) => b.mrr - a.mrr)
          .slice(0, 6)
        setCountryData(countryArr)

        // Group by package
        const byPackage: Record<string, number> = {}
        customers.forEach((c: any) => {
          const pkg = c.package || 'Other'
          byPackage[pkg] = (byPackage[pkg] || 0) + (c.mrr || 0)
        })
        const pkgArr = Object.entries(byPackage)
          .map(([name, value], i) => ({ name, value, fill: PACKAGE_COLORS[i % PACKAGE_COLORS.length] }))
          .sort((a, b) => b.value - a.value)
        setPackageData(pkgArr)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="rounded-2xl border border-[#e3e9f0] bg-white p-5 shadow-sm py-12 text-center text-sm text-[#5c7184]">
      Loading revenue data...
    </div>
  )

  if (totalMRR === 0) return (
    <div className="rounded-2xl border border-[#e3e9f0] bg-white p-5 shadow-sm">
      <div className="mb-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0096c7]">Revenue</p>
        <h2 className="mt-0.5 text-base font-semibold tracking-tight text-[#0d2233]">MRR Charts</h2>
      </div>
      <div className="py-10 text-center">
        <div className="text-3xl mb-2">📊</div>
        <p className="text-sm font-medium text-[#0d2233] mb-1">No revenue data yet</p>
        <p className="text-xs text-[#5c7184]">Add customer accounts with MRR values to see charts</p>
      </div>
    </div>
  )

  const totalPkg = packageData.reduce((s, p) => s + p.value, 0)

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
            ${totalMRR.toLocaleString()}/mo
          </span>
        </div>
        {countryData.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#5c7184]">No country data</div>
        ) : (
          <div className="mt-2 w-full overflow-x-auto">
            <BarChart width={460} height={240} data={countryData} layout="vertical" margin={{ left: 8, right: 48 }}>
              <XAxis type="number" dataKey="mrr" hide />
              <YAxis type="category" dataKey="country" tickLine={false} axisLine={false} width={100} tick={{ fontSize: 12, fill: "#5c7184" }} />
              <Tooltip content={(props) => <TooltipBox {...props} formatter={(v: number) => `$${v.toLocaleString()}/mo`} />} cursor={false} />
              <Bar dataKey="mrr" radius={6} barSize={22}>
                {countryData.map((entry, i) => <Cell key={i} fill={COUNTRY_COLORS[entry.country] || "#0096c7"} />)}
                <LabelList dataKey="mrr" position="right" offset={8} style={{ fill: "#0d2233" }} fontSize={11} formatter={(v: number) => `$${v.toLocaleString()}`} />
              </Bar>
            </BarChart>
          </div>
        )}
      </div>

      {/* MRR by package */}
      <div className="rounded-xl border border-[#e3e9f0] bg-white p-5 shadow-sm lg:col-span-2">
        <div className="mb-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0096c7]">License Mix</p>
          <h2 className="mt-0.5 text-base font-semibold tracking-tight text-[#0d2233]">MRR by Package</h2>
        </div>
        {packageData.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#5c7184]">No package data</div>
        ) : (
          <>
            <div className="relative mx-auto mt-2 flex items-center justify-center" style={{ height: 208, width: 208 }}>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] font-medium text-[#5c7184]">Total MRR</span>
                <span className="text-xl font-semibold tracking-tight text-[#0d2233] tabular-nums">${totalMRR.toLocaleString()}</span>
              </div>
              <PieChart width={208} height={208}>
                <Tooltip content={(props) => <TooltipBox {...props} formatter={(v: number) => `$${v.toLocaleString()}/mo`} />} />
                <Pie data={packageData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} strokeWidth={2} stroke="#ffffff">
                  {packageData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
              </PieChart>
            </div>
            <div className="mt-1 space-y-1.5">
              {packageData.map(p => (
                <div key={p.name} className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: p.fill }} />
                  <span className="text-[#5c7184] truncate">{p.name}</span>
                  <span className="ml-auto font-medium text-[#0d2233]">{Math.round((p.value/totalPkg)*100)}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
