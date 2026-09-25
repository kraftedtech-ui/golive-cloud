import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/mongodb'
import PartnerApplication from '@/models/PartnerApplication'
import { verifyTurnstile, verifyEmailToken } from '@/lib/publicVerification'
import { nextApplicationRef, findConflicts, sendPartnerApplicationReceived, sendPartnerApplicationNotice } from '@/lib/partners'
import { SOLUTIONS, DECLARATIONS, MAX_NAMED_ACCOUNTS } from '@/lib/partnerConfig'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * Public: submit a GoLive Partner Network application from /partners/apply.
 *
 * The email address must have been verified with a one-time code in the same
 * session, and the submission must pass Cloudflare Turnstile. One open
 * application per email address; a declined or withdrawn applicant may apply
 * again. Named accounts are checked for conflicts on arrival so the Managing
 * Director sees them flagged before the first review.
 */

const s = (max: number) => z.string().trim().max(max)
const opt = (max: number) => s(max).optional().default('')

const Schema = z.object({
  category: z.enum(['referral', 'sales']),
  applicant: z.object({
    name: s(100).min(3),
    preferredName: opt(60),
    email: z.string().trim().toLowerCase().email().max(200),
    phone: s(40).min(7),
    linkedin: opt(300),
    city: opt(80),
    state: opt(80),
    applyingAs: z.enum(['individual', 'business']),
    businessName: opt(160),
    cacNumber: opt(40),
    tin: opt(40),
  }),
  background: z.object({
    occupation: opt(300),
    yearsB2B: opt(40),
    sectors: opt(500),
    productsSold: opt(800),
    largestDeal: opt(500),
    referees: z.array(z.object({ name: s(100), position: opt(120), phone: opt(40) })).max(2).default([]),
  }),
  namedAccounts: z.array(z.object({
    organisation: s(160).min(2),
    sector: opt(80),
    contactName: opt(100),
    contactRole: opt(100),
    requirement: opt(300),
    timing: opt(80),
  })).max(MAX_NAMED_ACCOUNTS).default([]),
  solutions: z.array(z.string()).min(1).max(SOLUTIONS.length),
  engagement: z.object({
    jointMeetings: z.enum(['none', 'corporate', 'technical', 'both']),
    hoursPerWeek: opt(40),
    firstIntroduction: opt(80),
    firstSale: opt(80),
    supportNeeded: opt(800),
  }),
  declarations: z.object({
    otherAppointments: z.boolean(),
    competingAppointments: z.boolean(),
    politicallyExposed: z.boolean(),
    dishonestyRecord: z.boolean(),
    restricted: z.boolean(),
    particulars: opt(1500),
  }),
  acknowledgements: z.object({
    accurate: z.literal(true),
    noContract: z.literal(true),
    noAuthority: z.literal(true),
    accreditation: z.literal(true),
    dataConsent: z.literal(true),
  }),
  signatureName: s(100).min(3),
  verificationToken: z.string().min(1),
  turnstileToken: z.string().min(1),
  website: z.string().max(0).optional().default(''), // honeypot: real people never fill it
})

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Please complete the form and try again.' }, { status: 400 })
  }
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const where = issue?.path?.join('.') || 'form'
    const friendly = where.startsWith('acknowledgements') ? 'Please confirm every acknowledgement before submitting.'
      : where === 'solutions' ? 'Choose at least one solution you intend to sell.'
      : where.startsWith('signatureName') ? 'Type your full name to sign the application.'
      : where.startsWith('namedAccounts') ? 'Each named account needs at least the organisation name.'
      : `Please check this answer: ${where}.`
    return NextResponse.json({ error: friendly }, { status: 400 })
  }
  const d = parsed.data
  const email = d.applicant.email

  if (!verifyEmailToken(d.verificationToken, email)) {
    return NextResponse.json({ error: 'Your email verification has expired. Please verify your email again, then submit.' }, { status: 403 })
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined
  if (!(await verifyTurnstile(d.turnstileToken, ip))) {
    return NextResponse.json({ error: 'The security check failed. Please try it again.' }, { status: 403 })
  }
  if (d.signatureName.toLowerCase().replace(/\s+/g, ' ') !== d.applicant.name.toLowerCase().replace(/\s+/g, ' ')) {
    return NextResponse.json({ error: 'Your signature must match your full name exactly as entered in your details.' }, { status: 400 })
  }
  const solutions = d.solutions.filter((x) => (SOLUTIONS as readonly string[]).includes(x))
  if (!solutions.length) return NextResponse.json({ error: 'Choose at least one solution you intend to sell.' }, { status: 400 })

  await connectDB()
  const open = await PartnerApplication.findOne({ 'applicant.email': email, status: { $nin: ['declined', 'withdrawn'] } })
    .select('ref').lean() as { ref: string } | null
  if (open) {
    return NextResponse.json({ error: `You already have an open application (reference ${open.ref}). If you need to update it, email partners@golivecompany.com.` }, { status: 409 })
  }

  const conflicts = await findConflicts(d.namedAccounts.map((a) => a.organisation))
  const now = new Date()
  const ref = await nextApplicationRef()

  await PartnerApplication.create({
    ref,
    status: 'applied',
    category: d.category,
    applicant: d.applicant,
    background: d.background,
    namedAccounts: d.namedAccounts.map((a, i) => ({ ...a, conflict: conflicts[i], decision: 'pending' })),
    solutions,
    engagement: d.engagement,
    declarations: d.declarations,
    acknowledgements: d.acknowledgements,
    signature: { name: d.signatureName, signedAt: now, ip, userAgent: req.headers.get('user-agent')?.slice(0, 300) || undefined },
    emailVerifiedAt: now,
    timeline: [{ at: now, by: email, action: 'Application submitted', note: `${d.namedAccounts.length} named account(s), ${conflicts.filter(Boolean).length} conflict(s) flagged` }],
  })

  const flags = DECLARATIONS.filter((x) => (d.declarations as Record<string, unknown>)[x.key] === true).map((x) => x.text)
  const [mail, notice] = await Promise.all([
    sendPartnerApplicationReceived({ name: d.applicant.name, email, ref, category: d.category }),
    sendPartnerApplicationNotice({
      name: d.applicant.name, email, phone: d.applicant.phone, ref, category: d.category,
      accounts: d.namedAccounts.map((a, i) => ({ organisation: a.organisation, conflict: conflicts[i] })), flags,
    }),
  ])
  if (!mail.ok) console.error(`[partners/apply] receipt to ${ref} failed:`, mail.error)
  if (!notice.ok) console.error(`[partners/apply] notice for ${ref} failed:`, notice.error)

  return NextResponse.json({ ok: true, ref, emailSent: mail.ok })
}
