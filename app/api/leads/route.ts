import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { connectDB } from '@/lib/mongodb'
import { Lead } from '@/models/Lead'
import { sendLeadNotification, sendLeadConfirmation } from '@/lib/email'
import { requireSession } from '@/lib/apiAuth'

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
  turnstileToken: z.string().min(1, 'Security verification required'),
  verificationToken: z.string().min(1, 'Email verification required'),
})

function generateRef(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  const ts = Date.now().toString().slice(-4)
  return `GL-${year}-${random}${ts}`
}

async function verifyTurnstile(token: string, remoteIp?: string): Promise<boolean> {
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY || '',
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }),
    })
    const data = await res.json()
    return data.success === true
  } catch (err) {
    console.error('Turnstile verification error:', err)
    return false
  }
}

function verifyEmailToken(token: string, email: string): boolean {
  try {
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me'
    const decoded = Buffer.from(token, 'base64').toString('utf8')
    const [tokenEmail, expiresAtStr, signature] = decoded.split(':')
    const expiresAt = parseInt(expiresAtStr, 10)

    if (tokenEmail !== email.toLowerCase()) return false
    if (Date.now() > expiresAt) return false

    const expectedPayload = `${tokenEmail}:${expiresAtStr}`
    const expectedSignature = crypto.createHmac('sha256', secret).update(expectedPayload).digest('hex')
    return signature === expectedSignature
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = LeadSchema.parse(body)

    // 1. Verify email was actually OTP-verified
    const emailOk = verifyEmailToken(data.verificationToken, data.email)
    if (!emailOk) {
      return NextResponse.json(
        { success: false, error: 'email_not_verified' },
        { status: 403 }
      )
    }

    // 2. Verify Turnstile (bot protection)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined
    const isHuman = await verifyTurnstile(data.turnstileToken, ip)
    if (!isHuman) {
      return NextResponse.json(
        { success: false, error: 'captcha_failed' },
        { status: 403 }
      )
    }

    const { turnstileToken, verificationToken, ...leadData } = data
    const ref = generateRef()
    await connectDB()
    const lead = await Lead.create({ ...leadData, ref })

    Promise.allSettled([
      sendLeadNotification({ ...leadData, ref }),
      sendLeadConfirmation({ email: leadData.email, contact: leadData.contact, company: leadData.company, ref }),
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
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
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
