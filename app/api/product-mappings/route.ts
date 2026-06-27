import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ProductMapping } from '@/models/ProductMapping'
import { requireSession, requireAdmin } from '@/lib/apiAuth'

// Seeded once, on first load, from what was previously hardcoded in the
// Proposal Generator — so nothing changes for existing proposals, it just
// becomes editable here instead of requiring a code deploy.
const SEED_MAPPINGS = [
  {
    type: 'package', key: 'starter', label: 'Starter Cloud Office', order: 1,
    skuTitles: ['Microsoft 365 Business Basic'],
    features: ['Microsoft 365 Business Basic', 'Custom domain business email', '1 TB OneDrive per user', 'Teams, Word, Excel & PowerPoint (web)', 'DNS setup & email migration', 'SPF / DKIM / DMARC configuration', '30-day onboarding support'],
  },
  {
    type: 'package', key: 'secure', label: 'Secure Business Cloud', order: 2,
    skuTitles: ['Microsoft 365 Business Premium'],
    features: ['Microsoft 365 Business Premium', 'Microsoft Defender for Business', 'Desktop Office apps + 1 TB storage', 'Multi-Factor Authentication (MFA)', 'Conditional Access & data loss prevention', 'Email security hardening', 'Monthly managed support'],
  },
  {
    type: 'package', key: 'ai', label: 'AI-Ready Enterprise', order: 3,
    skuTitles: ['Microsoft 365 Business Premium and Microsoft 365 Copilot Business'],
    features: ['Microsoft 365 Business Premium (desktop apps, Exchange, SharePoint, Teams)', 'Microsoft 365 Copilot in Word, Excel, PowerPoint, Outlook & Teams', 'Copilot Chat with web grounding', 'Microsoft Defender for Business', 'Multi-Factor Authentication & Conditional Access', 'Data loss prevention & email security hardening', 'Premium managed support'],
  },
  {
    type: 'addon', key: 'defenderOffice', label: 'Microsoft Defender for Office 365 (Plan 2)', order: 1,
    skuTitles: ['Microsoft Defender for Office 365 (Plan 2)'],
    blurb: 'Advanced anti-phishing, anti-malware & attack simulation for email',
  },
  {
    type: 'addon', key: 'defenderEndpoint', label: 'Microsoft Defender for Endpoint (P2)', order: 2,
    skuTitles: ['Microsoft Defender for Endpoint P2'],
    blurb: 'Advanced threat detection & response across devices',
  },
  {
    type: 'addon', key: 'defenderCloudApps', label: 'Microsoft Defender for Cloud Apps', order: 3,
    skuTitles: ['Microsoft Defender for Cloud Apps'],
    blurb: 'Visibility & control over third-party cloud app usage (shadow IT)',
  },
  {
    type: 'addon', key: 'powerAutomate', label: 'Power Automate (per user plan)', order: 4,
    skuTitles: ['Power Automate per user plan'],
    blurb: 'Workflow automation across Microsoft & third-party apps',
  },
  {
    type: 'addon', key: 'powerApps', label: 'Power Apps (per app plan)', order: 5,
    skuTitles: ['Power Apps per app plan (1 app or website)'],
    blurb: 'Build custom business apps with low-code tools',
  },
]

export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const count = await ProductMapping.countDocuments()
    if (count === 0) {
      await ProductMapping.insertMany(SEED_MAPPINGS)
    }
    const items = await ProductMapping.find({ active: true }).sort({ type: 1, order: 1 })
    return NextResponse.json(items)
  } catch (err) {
    console.error('GET /api/product-mappings failed:', err)
    return NextResponse.json({ error: 'Failed to fetch product mappings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const body = await req.json()
    const item = await ProductMapping.create(body)
    return NextResponse.json(item, { status: 201 })
  } catch (err: any) {
    if (err?.code === 11000) {
      return NextResponse.json({ error: 'A mapping with this key already exists.' }, { status: 409 })
    }
    console.error('POST /api/product-mappings failed:', err)
    return NextResponse.json({ error: 'Failed to create product mapping' }, { status: 500 })
  }
}
