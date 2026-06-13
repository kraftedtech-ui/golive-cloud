import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/mongodb'
import { Lead } from '@/models/Lead'
import { sendLeadNotification, sendLeadConfirmation } from '@/lib/email'

const LeadSchema = z.object({
  company: z.string().min(2, 'Company name required'),
  contact: z.string().min(2, 'Contact name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(7, 'Phone/WhatsApp required'),
  country: z.string().default('Nigeria'),
  industry: z.string().default('General SME'),
  users: z.string().default('1–5'),
  currentEmail: z.string().default('cPanel / Webmail'),
  domain: z.string().optional(),
  services: z.array(z.string()).default([]),
  billing: z.string().default('Monthly'),
  notes: z.string().optional(),
})

function generateRef(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  const ts = Date.now().toString().slice(-4)
  return `GL-${year}-${random}${ts}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = LeadSchema.parse(body)
    const ref = generateRef()

    await connectDB()

    const lead = await Lead.create({ ...data, ref })

    // Send notifications (non-blocking — don't fail the request if email fails)
    Promise.allSettled([
      sendLeadNotification({ ...data, ref, notes: data.notes || '' }),
      sendLeadConfirmation(data.email, data.contact, ref),
    ]).catch(console.error)

    return NextResponse.json(
      { success: true, ref, leadId: lead._id },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: err.errors },
        { status: 400 }
      )
    }
    console.error('Lead API error:', err)
    return NextResponse.json(
      { success: false, error: 'Server error — please try again' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  // Portal-only: returns all leads for CRM pipeline
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const country = searchParams.get('country')

  try {
    await connectDB()
    const filter: Record<string, string> = {}
    if (status) filter.status = status
    if (country) filter.country = country

    const leads = await Lead.find(filter).sort({ createdAt: -1 }).limit(100)
    return NextResponse.json({ success: true, leads })
  } catch (err) {
    console.error('Leads GET error:', err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
