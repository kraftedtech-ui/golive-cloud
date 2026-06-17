import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { recentLeads, type Lead } from "@/lib/data"

const statusStyle: Record<Lead["status"], string> = {
  Hot: "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20",
  Warm: "bg-warning/10 text-warning ring-1 ring-inset ring-warning/20",
  Cold: "bg-secondary text-muted-foreground ring-1 ring-inset ring-border",
}

const statusDot: Record<Lead["status"], string> = {
  Hot: "bg-destructive",
  Warm: "bg-warning",
  Cold: "bg-muted-foreground",
}

export function RecentLeads() {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
            Inbound
          </p>
          <h2 className="mt-0.5 text-base font-semibold tracking-tight text-foreground">
            Recent Leads
          </h2>
        </div>
        <button
          type="button"
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-secondary"
        >
          View all
        </button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="pl-5">Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Package</TableHead>
              <TableHead className="text-right">Users</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-5 text-right">Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentLeads.map((lead) => (
              <TableRow
                key={lead.company}
                className="border-border transition-colors hover:bg-secondary/40"
              >
                <TableCell className="pl-5">
                  <div className="font-medium text-foreground">
                    {lead.company}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {lead.flag} {lead.country}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {lead.contact}
                </TableCell>
                <TableCell>
                  <span className="inline-flex rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                    {lead.package}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium text-foreground">
                  {lead.users}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                      statusStyle[lead.status],
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        statusDot[lead.status],
                      )}
                    />
                    {lead.status}
                  </span>
                </TableCell>
                <TableCell className="pr-5 text-right text-xs text-muted-foreground">
                  {lead.added}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
