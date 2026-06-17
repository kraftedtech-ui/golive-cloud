"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipProps } from "recharts"

export type ChartConfig = Record<string, { label?: string; color?: string }>

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
}

export function ChartContainer({ config, className, children, ...props }: ChartContainerProps) {
  const cssVars = Object.entries(config).reduce<Record<string, string>>((acc, [key, val]) => {
    if (val.color) acc[`--color-${key}`] = val.color
    return acc
  }, {})
  return (
    <div className={cn("flex aspect-video justify-center text-xs", className)} style={cssVars as React.CSSProperties} {...props}>
      {children}
    </div>
  )
}

export function ChartTooltip({ content, ...props }: TooltipProps<any, any>) {
  return <Tooltip content={content} {...props} />
}

interface ChartTooltipContentProps {
  formatter?: (value: any, name?: any) => React.ReactNode
  hideLabel?: boolean
}

export function ChartTooltipContent({ formatter, hideLabel }: ChartTooltipContentProps) {
  return ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-lg border border-border bg-card p-2.5 shadow-xl">
        {!hideLabel && label && <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">{label}</p>}
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
            {formatter ? formatter(p.value, p.name) : (
              <span className="flex gap-2"><span className="text-muted-foreground">{p.name}</span><span className="font-medium">{p.value}</span></span>
            )}
          </div>
        ))}
      </div>
    )
  }
}
