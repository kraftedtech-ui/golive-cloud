import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireAdmin } from '@/lib/apiAuth'
import PartnerApplication from '@/models/PartnerApplication'

export const dynamic = 'force-dynamic'

/** Admin: every partner application, newest first, with the fields the list needs. */
export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  await connectDB()
  const apps = await PartnerApplication.find({})
    .select('ref status category applicant.name applicant.email applicant.phone applicant.city namedAccounts.decision namedAccounts.conflict declarations partnerNumber createdAt updatedAt')
    .sort({ createdAt: -1 })
    .lean()
  return NextResponse.json({ applications: apps })
}
