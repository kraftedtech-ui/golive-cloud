'use client'
import { useState, useEffect, useCallback } from 'react'
import { fmtCurrency } from '@/lib/currency'
import { computeSuspensionRisk, RISK_SEVERITY, RISK_COLORS, type RiskLevel } from '@/lib/suspensionRisk'

interface Customer {
  _id: string
  company: string
  mrr: number
  currency: string
  billingCycle: 'monthly' | 'annual'
  status: string
  renewalDate: string
  closedByEmail?: string
  closedByName?: string
  lastPaymentConfirmedDate?: string
}

export default function PaymentRiskPanel({ isAdmin, userEmail }: { isAdmin: boolean; userEmail: string }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/customers?status=active')
      const data = await res.json()
      setCustomers(Array.isArray(data?.customers) ? data.customers : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  async function confirmPayment(id: string) {
    setConfirmingId(id)
    try {
      await fetch(`/api/customers/${id}/payment-confirm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: new Date().toISOString() }),
      })
      fetchCustomers()
    } finally {
      setConfirmingId(null)
    }
  }

  const now = new Date()
  const monthly = customers.filter(c => c.billingCycle === 'monthly')
  const withRisk = monthly.map(c => ({ ...c, risk: computeSuspensionRisk(now, c.lastPaymentConfirmedDate) }))
  const sorted = [...withRisk].sort((a, b) => RISK_SEVERITY[b.risk.level] - RISK_SEVERITY[a.risk.level])

  const annual = customers.filter(c => c.billingCycle === 'annual')
  const upcomingRenewals = annual
    .map(c => ({ ...c, daysLeft: Math.ceil((new Date(c.renewalDate).getTime() - now.getTime()) / 86400000) }))
    .filter(c => c.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft)

  const counts = {
    overdue: sorted.filter(c => c.risk.level === 'overdue').length,
    notice2: sorted.filter(c => c.risk.level === 'notice2').length,
    notice1: sorted.filter(c => c.risk.level === 'notice1').length,
  }
  const atRiskCount = counts.overdue + counts.notice2 + counts.notice1

  const canConfirm = (c: Customer) => isAdmin || c.closedByEmail === userEmail

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">Revenue Continuity</p>
          <h2 className="mt-0.5 text-base font-semibold text-foreground">Payment & Suspension Risk</h2>
          <p className="text-xs text-muted-foreground">
            Tracks 4Sight Dynamics Africa's monthly cadence — billed the 10th, notices the 16th & 19th, suspension the 20th.
            {atRiskCount > 0 && <span className="ml-1 font-semibold text-red-600">{atRiskCount} customer{atRiskCount !== 1 ? 's' : ''} at risk right now.</span>}
          </p>
        </div>

        <div className="divide-y divide-border">
          {loading ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : sorted.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No active monthly-billed customers.</p>
          ) : sorted.map(c => (
            <div key={c._id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{c.company}</p>
                <p className="text-[11px] text-muted-foreground">
                  {fmtCurrency(c.mrr || 0, c.currency)}/mo
                  {c.closedByName && <span> · {c.closedByName}</span>}
                  {c.risk.nextCheckpointLabel && <span> · next: {c.risk.nextCheckpointLabel}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${RISK_COLORS[c.risk.level as RiskLevel]}`}>
                  {c.risk.label}
                </span>
                {canConfirm(c) && c.risk.level !== 'paid' && (
                  <button
                    onClick={() => confirmPayment(c._id)}
                    disabled={confirmingId === c._id}
                    className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-secondary disabled:opacity-50"
                  >
                    {confirmingId === c._id ? '…' : '✓ Mark paid'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {upcomingRenewals.length > 0 && (
        <div className="rounded-2xl border border-border bg-white shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">Annual Renewals — Next 30 Days</h2>
            <p className="text-xs text-muted-foreground">Different risk: these customers prepaid for the year — flagging the term ending, not a missed monthly payment.</p>
          </div>
          <div className="divide-y divide-border">
            {upcomingRenewals.map(c => (
              <div key={c._id} className="flex items-center justify-between px-5 py-3">
                <p className="text-sm font-medium text-foreground">{c.company}</p>
                <span className={`text-xs font-semibold ${c.daysLeft <= 7 ? 'text-red-600' : 'text-amber-600'}`}>
                  {c.daysLeft <= 0 ? 'Renewal due' : `${c.daysLeft}d left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
