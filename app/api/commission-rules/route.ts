import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { CommissionRule } from '@/models/CommissionRule'

const SEED_RULES = [
  { type: 'do', text: 'Log every deal in the CRM portal immediately after verbal agreement', section: 'CRM & Deal Tracking', order: 1 },
  { type: 'do', text: 'Confirm the customer\'s domain and licence count before quoting', section: 'Pre-Sale', order: 2 },
  { type: 'do', text: 'Get MD written approval before quoting a renewal commission deal during probation', section: 'Probation', order: 3 },
  { type: 'do', text: 'Confirm setup/migration project rate in writing with the MD before starting work', section: 'Pre-Sale', order: 4 },
  { type: 'do', text: 'Log all customer follow-ups and testimonials in the CRM for monthly bonus qualification', section: 'CRM & Deal Tracking', order: 5 },
  { type: 'do', text: 'Inform the MD immediately if a customer expresses intent to cancel or raise a dispute', section: 'Customer Management', order: 6 },
  { type: 'do', text: 'Respond to all support tickets within the SLA window to qualify for the monthly support bonus', section: 'Support', order: 7 },
  { type: 'dont', text: 'Never promise a discount, credit term, or special pricing without prior written MD approval', section: 'Pricing & Commitments', order: 1 },
  { type: 'dont', text: 'Never commit to an implementation timeline or service guarantee without MD sign-off', section: 'Pricing & Commitments', order: 2 },
  { type: 'dont', text: 'Never pitch commission on gross revenue — always use Gross Profit as the base', section: 'Commission', order: 3 },
  { type: 'dont', text: 'Never approach a pre-existing GoLive customer and claim commission on their next purchase', section: 'Commission', order: 4 },
  { type: 'dont', text: 'Never solicit customers to contact you directly outside company channels for deals', section: 'Customer Management', order: 5 },
  { type: 'dont', text: 'Never share pricing spreadsheets or distributor cost details with customers or external parties', section: 'Confidentiality', order: 6 },
]

export async function GET() {
  try {
    await connectDB()
    const count = await CommissionRule.countDocuments()
    if (count === 0) {
      await CommissionRule.insertMany(SEED_RULES)
    }
    const rules = await CommissionRule.find().sort({ type: 1, section: 1, order: 1 })
    return NextResponse.json(rules)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const rule = await CommissionRule.create(body)
    return NextResponse.json(rule, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 })
  }
}
