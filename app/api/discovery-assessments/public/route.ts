import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/mongodb'
import { Lead } from '@/models/Lead'
import { DiscoveryAssessment } from '@/models/DiscoveryAssessment'
import { ProductMapping } from '@/models/ProductMapping'
import { sendDiscoveryNotification } from '@/lib/email'
import { verifyTurnstile, verifyEmailToken } from '@/lib/publicVerification'
import { DISCOVERY_PAIN_POINTS, computeRecommendation } from '@/lib/discoveryRecommendation'

const PublicDiscoverySchema = z.object({
  company: z.string().min(2, 'Company name required'),
  contact: z.string().min(2, 'Contact name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(7, 'Phone/WhatsApp required'),
  country: z.string().default('Nigeria'),

  isExistingM365Customer: z.boolean(),
  currentPlan: z.string().optional(),
  currentLicenseCount: z.number().optional(),
  currentCSPManager: z.string().optional(),
  contractRenewalDate: z.string().optional(),
  switchReasons: z.array(z.string()).default([]),

  currentEmailProvider: z.string().optional(),
  currentProviderChallenges: z.string().optional(),

  employeeCount: z.string().min(1),
  deviceTypes: z.array(z.string()).default([]),
  remoteHybridWork: z.boolean().default(false),
  itSupportModel: z.string().default('none'),
  handlesSensitiveData: z.boolean().default(false),
  sensitiveDataTypes: z.array(z.string()).default([]),

  painPoints: z.array(z.string()).default([]),
  otherPainPointNotes: z.string().optional(),

  dataScope: z.array(z.string()).default([]),
  cutoverTolerance: z.string().optional(),

  budgetRange: z.string().optional(),
  decisionTimeline: z.string().optional(),
  additionalNotes: z.string().optional(),

  turnstileToken: z.string().min(1, 'Security verification required'),
  verificationToken: z.string().min(1, 'Email verification required'),
})

function generateRef(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  const ts = Date.now().toString().slice(-4)
  return `GL-DSC-${year}-${random}${ts}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = PublicDiscoverySchema.parse(body)

    const emailOk = verifyEmailToken(data.verificationToken, data.email)
    if (!emailOk) {
      return NextResponse.json({ success: false, error: 'email_not_verified' }, { status: 403 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined
    const isHuman = await verifyTurnstile(data.turnstileToken, ip)
    if (!isHuman) {
      return NextResponse.json({ success: false, error: 'captcha_failed' }, { status: 403 })
    }

    await connectDB()

    // Reuse an existing lead for this email if one already exists (e.g. they
    // already submitted the short assessment form), rather than creating a
    // duplicate every time the same prospect fills this in.
    let lead = await Lead.findOne({ email: { $regex: `^${data.email}$`, $options: 'i' } })
    const ref = generateRef()
    if (!lead) {
      lead = await Lead.create({
        ref,
        company: data.company,
        contact: data.contact,
        email: data.email,
        phone: data.phone,
        country: data.country,
        currentEmail: data.isExistingM365Customer ? 'Microsoft 365 (existing)' : (data.currentEmailProvider || 'cPanel / Webmail'),
        users: data.employeeCount,
        notes: 'Submitted via self-serve Discovery Questionnaire',
      })
    }

    // Recommendation is computed server-side from the live catalog — never
    // trust a client-submitted recommendation, since this endpoint has no
    // session and the request body is fully attacker-controlled.
    const mappings = await ProductMapping.find({ active: true })
    const validPackageKeys = mappings.filter((m: any) => m.type === 'package').map((m: any) => m.key)
    const validAddOnKeys = mappings.filter((m: any) => m.type === 'addon').map((m: any) => m.key)
    const recommendation = computeRecommendation({
      painPoints: data.painPoints,
      handlesSensitiveData: data.handlesSensitiveData,
      validPackageKeys,
      validAddOnKeys,
    })

    const { turnstileToken, verificationToken, ...assessmentData } = data
    await DiscoveryAssessment.create({
      ...assessmentData,
      leadId: String(lead._id),
      leadRef: lead.ref,
      company: data.company,
      source: 'public',
      completedByName: data.contact,
      completedByEmail: data.email,
      contractRenewalDate: data.contractRenewalDate || undefined,
      recommendedPackageKey: recommendation.packageKey,
      recommendedAddOnKeys: recommendation.addOnKeys,
      needsOfflineConsult: recommendation.needsOfflineConsult,
      consultReasons: recommendation.consultReasons,
      status: 'completed',
    })

    const packageLabel = mappings.find((m: any) => m.key === recommendation.packageKey)?.label
    const addOnLabels = mappings.filter((m: any) => recommendation.addOnKeys.includes(m.key)).map((m: any) => m.label)
    const painPointLabels = data.painPoints.map(k => DISCOVERY_PAIN_POINTS.find(p => p.key === k)?.label || k)

    sendDiscoveryNotification({
      ref,
      company: data.company,
      contact: data.contact,
      email: data.email,
      phone: data.phone,
      isExistingM365Customer: data.isExistingM365Customer,
      employeeCount: data.employeeCount,
      painPointLabels,
      recommendedPackageLabel: packageLabel,
      recommendedAddOnLabels: addOnLabels,
      needsOfflineConsult: recommendation.needsOfflineConsult,
      consultReasons: recommendation.consultReasons,
    }).catch(console.error)

    return NextResponse.json({
      success: true,
      ref,
      recommendation: {
        packageLabel: packageLabel || 'A GoLive specialist will confirm the right package',
        addOnLabels,
        needsOfflineConsult: recommendation.needsOfflineConsult,
      },
    }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: err.errors }, { status: 400 })
    }
    console.error('Public discovery submission error:', err)
    return NextResponse.json({ success: false, error: 'Server error — please try again' }, { status: 500 })
  }
}
