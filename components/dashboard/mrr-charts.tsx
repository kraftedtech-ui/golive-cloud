"use client"

import { Bar, BarChart, XAxis, YAxis, Pie, PieChart, Cell, LabelList } from "recharts"
import { Card } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { mrrByCountry, mrrByPackage } from "@/lib/data"

const countryConfig = {
  mrr: { label: "MRR", color: "var(--chart-1)" },
} satisfies ChartConfig

const packageConfig = {
  value: { label: "MRR" },
} satisfies ChartConfig

const totalPackage = mrrByPackage.reduce((s, d) => s + d.value, 0)

export function MrrCharts() {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      {/* MRR by country */}
      <Card className="gap-0 p-5 shadow-sm lg:col-span-3">
        <div className="mb-1 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
              Revenue
            </p>
            <h2 className="mt-0.5 text-base font-semibold tracking-tight text-foreground">
              MRR by Country
            </h2>
            <p className="text-xs text-muted-foreground">Top markets</p>
          </div>
          <span className="rounded-lg border border-border bg-secondary/60 px-2.5 py-1 text-xs font-semibold text-foreground tabular-nums">
            $63.4k/mo
          </span>
        </div>
        <ChartContainer config={countryConfig} className="mt-2 h-64 w-full">
          <BarChart
            accessibilityLayer
            data={mrrByCountry}
            layout="vertical"
            margin={{ left: 8, right: 36 }}
          >
            <XAxis type="number" dataKey="mrr" hide />
            <YAxis
              type="category"
              dataKey="country"
              tickLine={false}
              axisLine={false}
              width={92}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => `$${Number(value).toLocaleString()}/mo`}
                />
              }
            />
            <Bar dataKey="mrr" fill="var(--color-mrr)" radius={6} barSize={22}>
              <LabelList
                dataKey="mrr"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={11}
                formatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </Card>

      {/* MRR by package */}
      <Card className="gap-0 p-5 shadow-sm lg:col-span-2">
        <div className="mb-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
            License Mix
          </p>
          <h2 className="mt-0.5 text-base font-semibold tracking-tight text-foreground">
            MRR by Package
          </h2>
        </div>
        <div className="relative mx-auto mt-2 h-52 w-52">
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] font-medium text-muted-foreground">
              Total MRR
            </span>
            <span className="text-xl font-semibold tracking-tight text-foreground tabular-nums">
              ${(totalPackage / 1000).toFixed(1)}k
            </span>
          </div>
          <ChartContainer config={packageConfig} className="h-52 w-52">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => (
                    <span className="flex w-full items-center justify-between gap-3">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-medium text-foreground">
                        ${Number(value).toLocaleString()}/mo
                      </span>
                    </span>
                  )}
                />
              }
            />
            <Pie
              data={mrrByPackage}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={80}
              strokeWidth={2}
              stroke="var(--card)"
            >
              {mrrByPackage.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
          </ChartContainer>
        </div>
        <div className="mt-1 space-y-1.5">
          {mrrByPackage.map((p) => (
            <div key={p.name} className="flex items-center gap-2 text-xs">
              <span
                className="size-2.5 rounded-[3px]"
                style={{ backgroundColor: p.fill }}
              />
              <span className="text-muted-foreground">{p.name}</span>
              <span className="ml-auto font-medium text-foreground">
                {Math.round((p.value / totalPackage) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </Card>
    </section>
  )
}
