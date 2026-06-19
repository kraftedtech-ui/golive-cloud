import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { EmailOTP } from '@/models/EmailOTP'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
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

// In-memory IP rate limiter — single-server deployment, no Redis needed.
// Resets on server restart, which is acceptable for this protective layer.
const ipRequestLog = new Map<string, number[]>()
const IP_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const IP_MAX_REQUESTS = 10 // max OTP sends per IP per window

function isIpRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = (ipRequestLog.get(ip) || []).filter(t => now - t < IP_WINDOW_MS)
  if (timestamps.length >= IP_MAX_REQUESTS) {
    ipRequestLog.set(ip, timestamps)
    return true
  }
  timestamps.push(now)
  ipRequestLog.set(ip, timestamps)
  return false
}

// Periodic cleanup to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now()
  for (const [ip, timestamps] of Array.from(ipRequestLog.entries())) {
    const fresh = timestamps.filter((t: number) => now - t < IP_WINDOW_MS)
    if (fresh.length === 0) ipRequestLog.delete(ip)
    else ipRequestLog.set(ip, fresh)
  }
}, 15 * 60 * 1000)

// POST /api/verify-email — send a new OTP code
export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { email, turnstileToken } = await req.json()

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'

    // 1. IP-based rate limit — blocks bots rotating through many emails from one source
    if (isIpRateLimited(ip)) {
      return NextResponse.json({ success: false, error: 'Too many requests from this network. Please try again later.' }, { status: 429 })
    }

    // 2. Turnstile — blocks automated requests before any email is sent
    if (!turnstileToken) {
      return NextResponse.json({ success: false, error: 'captcha_required' }, { status: 400 })
    }
    const isHuman = await verifyTurnstile(turnstileToken, ip === 'unknown' ? undefined : ip)
    if (!isHuman) {
      return NextResponse.json({ success: false, error: 'captcha_failed' }, { status: 403 })
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'A valid email address is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // 3. Per-email rate limit — existing protection, kept as-is
    const recentCount = await EmailOTP.countDocuments({
      email: normalizedEmail,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    })
    if (recentCount >= 5) {
      return NextResponse.json({ success: false, error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const code = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await EmailOTP.create({ email: normalizedEmail, code, expiresAt })

    await resend.emails.send({
      from: 'GoLive Cloud Marketplace <hello@golivecompany.com>',
      to: normalizedEmail,
      subject: `Your verification code: ${code}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e0f0f0">
          <div style="background:#0096c7;padding:20px 24px">
            <span style="color:#fff;font-size:18px;font-weight:700">GoLive Cloud Marketplace</span>
          </div>
          <div style="padding:28px 24px;text-align:center">
            <p style="font-size:14px;color:#444;margin:0 0 20px">Your verification code is:</p>
            <div style="font-size:32px;font-weight:700;letter-spacing:6px;color:#0096c7;background:#f0f9ff;border-radius:8px;padding:16px;margin-bottom:20px">
              ${code}
            </div>
            <p style="font-size:12px;color:#888;margin:0">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
          </div>
          <div style="background:#f9f9f9;padding:12px 24px;text-align:center;font-size:11px;color:#aaa;border-top:1px solid #eee">
            The GoLive Digital Solutions Company Ltd · contact@golivecompany.com
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: 'Verification code sent' })
  } catch (err) {
    console.error('Send OTP error:', err)
    return NextResponse.json({ success: false, error: 'Failed to send verification code' }, { status: 500 })
  }
}
