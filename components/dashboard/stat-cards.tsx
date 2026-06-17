"use client"

import {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Users,
  UserPlus,
  ArrowUpRight,
} from "lucide-react"
import { Area, AreaChart } from "recharts"
import { Card } from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import { stats } from "@/lib/data"

const icons = [DollarSign, Users, UserPlus, AlertTriangle]

const sparkConfig = {
  v: { label: "Trend" },
} satisfies ChartConfig

export function StatCards() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, i) => {
        const Icon = icons[i]
        const isAlert = stat.trend === "alert"
        const data = stat.spark.map((v, idx) => ({ idx, v }))
        const sparkColor = isAlert ? "var(--destructive)" : "var(--chart-1)"
        return (
          <Card
            key={stat.label}
            className="group relative gap-0 overflow-hidden p-5 shadow-sm ring-1 ring-border/60 transition-all hover:shadow-md hover:ring-border"
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg",
                  isAlert
                    ? "bg-destructive/10 text-destructive"
                    : "bg-accent text-accent-foreground",
                )}
              >
                <Icon className="size-4" />
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                  isAlert
                    ? "bg-destructive/10 text-destructive"
                    : "bg-success/10 text-success",
                )}
              >
                {isAlert ? (
                  <AlertTriangle className="size-3" />
                ) : (
                  <TrendingUp className="size-3" />
                )}
                {stat.change}
              </span>
            </div>

            <p className="mt-4 text-sm font-medium text-muted-foreground">
              {stat.label}
            </p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <p className="text-[28px] font-semibold leading-none tracking-tight text-foreground tabular-nums">
                {stat.value}
              </p>
              <ChartContainer
                config={sparkConfig}
                className="h-9 w-20 shrink-0"
              >
                <AreaChart
                  data={data}
                  margin={{ top: 2, bottom: 2, left: 0, right: 0 }}
                >
                  <defs>
                    <linearGradient
                      id={`spark-${i}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={sparkColor}
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="100%"
                        stopColor={sparkColor}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    dataKey="v"
                    type="monotone"
                    stroke={sparkColor}
                    strokeWidth={2}
                    fill={`url(#spark-${i})`}
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{stat.hint}</p>
          </Card>
        )
      })}
    </section>
  )
}
