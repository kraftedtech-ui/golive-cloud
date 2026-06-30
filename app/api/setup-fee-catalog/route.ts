import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { SetupFeeCatalogItem } from '@/models/SetupFeeCatalog'
import { requireSession, requireAdmin } from '@/lib/apiAuth'

// Seeded once on first load. Amounts are deliberately modest SME-scale
// defaults — admin can edit every figure from the Setup Fee Catalog page.
const SEED_ITEMS = [
  { key: 'tenant_setup', label: 'Tenant setup & DNS configuration', category: 'Foundation', unit: 'flat', amountUSD: 150, autoSuggestTags: ['net_new', 'existing_m365'], brdTrigger: false, order: 1 },
  { key: 'mailbox_migration', label: 'Mailbox migration (per user)', category: 'Migration', unit: 'per_user', amountUSD: 12, autoSuggestTags: ['existing_m365'], brdTrigger: false, order: 2 },
  { key: 'google_migration_surcharge', label: 'Google Workspace migration complexity', category: 'Migration', unit: 'flat', amountUSD: 200, autoSuggestTags: ['source:google'], brdTrigger: false, order: 3 },
  { key: 'exchange_onprem_migration', label: 'On-premise Exchange migration', category: 'Migration', unit: 'flat', amountUSD: 450, autoSuggestTags: ['source:exchange_onprem'], brdTrigger: false, order: 4 },
  { key: 'intune_device_setup', label: 'Intune device enrollment & policy setup', category: 'Security', unit: 'flat', amountUSD: 250, autoSuggestTags: ['device_management'], brdTrigger: false, order: 5 },
  { key: 'conditional_access_baseline', label: 'Conditional Access & MFA baseline configuration', category: 'Security', unit: 'flat', amountUSD: 200, autoSuggestTags: ['device_security', 'sensitive_data'], brdTrigger: false, order: 6 },
  { key: 'defender_office_rollout', label: 'Defender for Office 365 rollout & tuning', category: 'Security', unit: 'flat', amountUSD: 120, autoSuggestTags: ['email_security'], brdTrigger: false, order: 7 },
  { key: 'defender_endpoint_rollout', label: 'Defender for Endpoint rollout', category: 'Security', unit: 'flat', amountUSD: 150, autoSuggestTags: ['device_security'], brdTrigger: false, order: 8 },
  { key: 'defender_cloudapps_rollout', label: 'Defender for Cloud Apps configuration', category: 'Security', unit: 'flat', amountUSD: 150, autoSuggestTags: ['shadow_it'], brdTrigger: false, order: 9 },
  { key: 'power_automate_build', label: 'Power Automate initial workflow build', category: 'Automation', unit: 'flat', amountUSD: 350, autoSuggestTags: ['manual_processes'], brdTrigger: false, order: 10 },
  { key: 'power_apps_build', label: 'Power Apps custom app build', category: 'Automation', unit: 'flat', amountUSD: 600, autoSuggestTags: ['custom_apps'], brdTrigger: true, order: 11 },
  { key: 'backup_compliance_setup', label: 'Backup & compliance/retention configuration', category: 'Compliance', unit: 'flat', amountUSD: 400, autoSuggestTags: ['backup_compliance'], brdTrigger: true, order: 12 },
  { key: 'teams_calling_setup', label: 'Teams calling/meeting room configuration', category: 'Collaboration', unit: 'flat', amountUSD: 250, autoSuggestTags: ['collaboration'], brdTrigger: false, order: 13 },
  { key: 'copilot_enablement', label: 'Copilot rollout & prompt training session', category: 'AI', unit: 'flat', amountUSD: 200, autoSuggestTags: ['ai_productivity'], brdTrigger: false, order: 14 },
  { key: 'brd_engagement', label: 'Business Requirement Document (BRD) engagement', category: 'Consulting', unit: 'flat', amountUSD: 800, autoSuggestTags: [], brdTrigger: false, order: 15 },
  { key: 'hypercare_support', label: 'Hypercare support (5–10 business days post go-live)', category: 'Support', unit: 'flat', amountUSD: 180, autoSuggestTags: ['net_new', 'existing_m365'], brdTrigger: false, order: 16 },
  { key: 'enduser_training', label: 'End-user training session', category: 'Support', unit: 'flat', amountUSD: 150, autoSuggestTags: [], brdTrigger: false, order: 17 },
]

export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const count = await SetupFeeCatalogItem.countDocuments()
    if (count === 0) await SetupFeeCatalogItem.insertMany(SEED_ITEMS)
    const items = await SetupFeeCatalogItem.find({ active: true }).sort({ order: 1 })
    return NextResponse.json(items)
  } catch (err) {
    console.error('GET /api/setup-fee-catalog failed:', err)
    return NextResponse.json({ error: 'Failed to fetch setup fee catalog' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const body = await req.json()
    const item = await SetupFeeCatalogItem.create(body)
    return NextResponse.json(item, { status: 201 })
  } catch (err: any) {
    if (err?.code === 11000) return NextResponse.json({ error: 'A fee item with this key already exists.' }, { status: 409 })
    console.error('POST /api/setup-fee-catalog failed:', err)
    return NextResponse.json({ error: 'Failed to create fee item' }, { status: 500 })
  }
}
