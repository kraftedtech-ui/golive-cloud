import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/apiAuth'
import { connectDB } from '@/lib/mongodb'
import Employee from '@/models/Employee'

export const dynamic = 'force-dynamic'

// Admin: list all employee records, GL-EMP order.
export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  await connectDB()
  const employees = await Employee.find({}).sort({ employeeNumber: 1 }).lean()
  return NextResponse.json({ employees })
}
