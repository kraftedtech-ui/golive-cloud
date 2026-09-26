import { NextResponse } from 'next/server'
import { currentPartner } from '@/lib/partnerSession'
import DealRegistration from '@/models/DealRegistration'
import CommissionSchedule from '@/models/CommissionSchedule'
import { currentSchedule, changeLines } from '@/lib/commissionSchedule'
import { refreshLapse, ensureApplicationDeals, STATUS_LABEL, MILESTONE_LABEL, INITIAL_DAYS, MILESTONE_DAYS, LIMIT_DAYS } from '@/lib/dealRegistration'
import { docLinks } from '@/lib/partnerAgreementFlow'
import { certStatus, verifyUrl, linkedInAddUrl } from '@/lib/partnerCertificate'

export const dynamic = 'force-dynamic'

/** Partner (session): everything the dashboard shows. Never includes GoLive margins or other partners' data. */
export async function GET() {
  const app = await currentPartner()
  if (!app) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  await ensureApplicationDeals(app)

  const [current, history, deals] = await Promise.all([
    currentSchedule(),
    CommissionSchedule.find({ status: 'published' }).sort({ version: -1 }).lean(),
    DealRegistration.find({ partnerApplication: app._id }).sort({ submittedAt: -1 }),
  ])
  for (const d of deals) if (refreshLapse(d)) await d.save()

  const rate = (r: { referral: string; sales: string }) => (app.category === 'sales' ? r.sales : r.referral)
  const ackVersion = app.scheduleAck?.version ?? app.agreement?.scheduleVersion ?? 0
  const c = app.certificate!
  const links = docLinks(app)
  return NextResponse.json({
    partner: {
      name: app.applicant.name, email: app.applicant.email, partnerNumber: app.partnerNumber, category: app.category,
      title: c.title, appointedAt: app.agreement?.mdSignedAt,
    },
    certificate: {
      number: c.number, issuedAt: c.issuedAt, expiresAt: c.expiresAt, status: certStatus(c),
      verifyUrl: verifyUrl(c.number), linkedInUrl: linkedInAddUrl(c), pdf: links.certificatePdf,
    },
    agreement: { version: app.agreement?.version, pdf: links.agreementPdf, scheduleVersion: app.agreement?.scheduleVersion },
    schedule: current ? {
      version: current.version, effectiveAt: current.effectiveAt, summary: current.summary,
      rows: current.rows.map((r) => ({ line: r.line, basis: r.basis, rate: rate(r) })),
      acknowledged: ackVersion >= (current.version || 0),
    } : null,
    history: history.map((v) => ({
      version: v.version, effectiveAt: v.effectiveAt, summary: v.summary,
      changes: changeLines(v.changes || [], app.category),
    })),
    lines: current ? [...new Set(current.rows.filter((r) => !/no commission|available once/i.test(rate(r))).map((r) => r.line))] : [],
    rules: { initialDays: INITIAL_DAYS, milestoneDays: MILESTONE_DAYS, limitDays: LIMIT_DAYS, milestones: MILESTONE_LABEL },
    deals: deals.map((d) => ({
      id: String(d._id), ref: d.ref, organisation: d.organisation, lineOfBusiness: d.lineOfBusiness, requirement: d.requirement,
      estimatedValue: d.estimatedValue, expectedClose: d.expectedClose, status: d.status, statusLabel: STATUS_LABEL[d.status],
      submittedAt: d.submittedAt, approvedAt: d.approvedAt, validUntil: d.validUntil, hardLimit: d.hardLimit,
      scheduleVersion: d.scheduleVersion, decisionNote: d.status === 'refused' ? d.decisionNote : undefined,
      milestones: d.milestones.map((m) => ({ kind: m.kind, label: MILESTONE_LABEL[m.kind], at: m.at })),
      source: d.source,
    })),
  })
}
