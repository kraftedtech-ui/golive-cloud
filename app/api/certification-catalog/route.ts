import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { CertificationCatalog } from '@/models/CertificationCatalog'
import { requireSession, requireAdmin } from '@/lib/apiAuth'

const SEED_CATALOG = [
  { name: 'Microsoft 365 Fundamentals (MS-900)', vendor: 'Microsoft', level: 'foundational', bonusAmount: 25000 },
  { name: 'Microsoft Security, Compliance, and Identity Fundamentals (SC-900)', vendor: 'Microsoft', level: 'foundational', bonusAmount: 25000 },
  { name: 'Microsoft 365 Certified: Administrator Expert (MS-102)', vendor: 'Microsoft', level: 'intermediate', bonusAmount: 50000 },
  { name: 'Microsoft 365 Certified: Endpoint Administrator (MD-102)', vendor: 'Microsoft', level: 'intermediate', bonusAmount: 50000 },
  { name: 'Microsoft Certified: Security Operations Analyst Associate (SC-200)', vendor: 'Microsoft', level: 'intermediate', bonusAmount: 50000 },
]

export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const count = await CertificationCatalog.countDocuments()
    if (count === 0) {
      await CertificationCatalog.insertMany(SEED_CATALOG)
    }
    const items = await CertificationCatalog.find({ active: true }).sort({ level: 1, name: 1 })
    return NextResponse.json(items)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch certification catalog' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const body = await req.json()
    const item = await CertificationCatalog.create(body)
    return NextResponse.json(item, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create catalog item' }, { status: 500 })
  }
}
