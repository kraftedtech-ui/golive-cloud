import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import mongoose, { Schema } from 'mongoose'

async function verifyTurnstile(token: string, remoteIp?: string) {
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
import { Resend } from 'resend'
import { Notification } from '@/models/Notification'

const resend = new Resend(process.env.RESEND_API_KEY)

const TransferSchema = new Schema({
  ref: { type: String, required: true, unique: true },
  transferType: { type: String, enum: ['csp', 'google', 'cpanel'], required: true },
  company: { type: String, required: true },
  contact: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  domain: { type: String, required: true },
  users: String,
  country: { type: String, default: 'Nigeria' },
  currentProvider: String,
  notes: String,
  status: { type: String, enum: ['new', 'contacted', 'in_progress', 'completed', 'lost'], default: 'new' },
  assignedTo: String,
  assignedToEmail: String,
  mrr: { type: Number, default: 0 },
}, { timestamps: true })

const Transfer = mongoose.models.Transfer || mongoose.model('Transfer', TransferSchema)

const STATUS_LABELS: Record<string, string> = {
  new: 'New', contacted: 'Contacted', in_progress: 'In Progress', completed: 'Completed', lost: 'Lost',
}

function generateRef(type: string) {
  const prefix = type === 'csp' ? 'CSP' : type === 'google' ? 'GWS' : 'CPL'
  return `${prefix}-${new Date().getFullYear()}-${Math.floor(10000000 + Math.random() * 90000000)}`
}

export async function GET() {
  try {
    await connectDB()
    const transfers = await Transfer.find({}).sort({ createdAt: -1 }).limit(200)
    return NextResponse.json({ success: true, transfers })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()

    if (!body.turnstileToken) {
      return NextResponse.json({ success: false, error: 'captcha_required' }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined
    const isHuman = await verifyTurnstile(body.turnstileToken, ip)
    if (!isHuman) {
      return NextResponse.json({ success: false, error: 'captcha_failed' }, { status: 403 })
    }

    const { turnstileToken, ...transferData } = body
    const ref = generateRef(transferData.transferType || 'csp')
    const transfer = await Transfer.create({ ...transferData, ref })
    return NextResponse.json({ success: true, transfer, ref }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const { id, updatedBy, ...update } = body
    const prevTransfer = await Transfer.findById(id)
    const transfer = await Transfer.findByIdAndUpdate(id, update, { new: true })

    if (!transfer) return NextResponse.json({ success: false, error: 'Transfer not found' }, { status: 404 })

    // Notify on new assignment
    if (update.assignedToEmail && prevTransfer?.assignedToEmail !== update.assignedToEmail) {
      try {
        await Notification.create({
          recipientEmail: update.assignedToEmail,
          type: 'transfer_assigned',
          title: 'New transfer request assigned to you',
          message: `${transfer.company} — ${transfer.transferType.toUpperCase()} transfer`,
          link: 'transfers',
        })
      } catch (e) { console.error('In-app notification failed:', e) }

      try {
        await resend.emails.send({
          from: 'GoLive Portal <hello@golivecompany.com>',
          to: update.assignedToEmail,
          subject: `Transfer request assigned to you: ${transfer.company}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e0f0f0">
              <div style="background:#00B5AD;padding:20px 24px">
                <span style="color:#fff;font-size:20px;font-weight:700">golive</span>
                <span style="color:rgba(255,255,255,0.7);font-size:13px;margin-left:8px">Cloud Marketplace</span>
              </div>
              <div style="padding:28px 24px">
                <p style="font-size:15px;color:#1a1a1a;margin:0 0 6px">Hi ${transfer.assignedTo},</p>
                <p style="font-size:14px;color:#444;line-height:1.7;margin:0 0 20px">
                  A transfer request has been assigned to you${updatedBy ? ` by <strong>${updatedBy}</strong>` : ''}:
                </p>
                <div style="background:#f5fffe;border:1px solid #c8f0ee;border-radius:8px;padding:16px 20px;margin-bottom:20px">
                  <table style="width:100%;border-collapse:collapse;font-size:13px;color:#333">
                    <tr><td style="padding:5px 0;color:#888;width:120px">Company</td><td style="font-weight:600">${transfer.company}</td></tr>
                    <tr><td style="padding:5px 0;color:#888">Type</td><td style="text-transform:uppercase">${transfer.transferType}</td></tr>
                    <tr><td style="padding:5px 0;color:#888">Domain</td><td>${transfer.domain}</td></tr>
                    <tr><td style="padding:5px 0;color:#888">Ref</td><td style="font-family:monospace">${transfer.ref}</td></tr>
                  </table>
                </div>
                <a href="https://cloud.golivecompany.com/portal" style="display:inline-block;background:#00B5AD;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">
                  Open in CRM Portal →
                </a>
              </div>
              <div style="background:#f9f9f9;padding:12px 24px;text-align:center;font-size:11px;color:#aaa;border-top:1px solid #eee">
                The GoLive Digital Solutions Company Ltd · contact@golivecompany.com · +234 808 358 7801
              </div>
            </div>
          `,
        })
      } catch (e) { console.error('Assign email failed:', e) }
    }
    // Notify on status change (only if already assigned and status actually changed)
    else if (transfer.assignedToEmail && update.status && prevTransfer?.status !== update.status) {
      try {
        await Notification.create({
          recipientEmail: transfer.assignedToEmail,
          type: 'transfer_status',
          title: `Transfer status updated: ${transfer.company}`,
          message: `${STATUS_LABELS[prevTransfer?.status || ''] || prevTransfer?.status} → ${STATUS_LABELS[transfer.status] || transfer.status}`,
          link: 'transfers',
        })
      } catch (e) { console.error('In-app notification failed:', e) }

      try {
        await resend.emails.send({
          from: 'GoLive Portal <hello@golivecompany.com>',
          to: transfer.assignedToEmail,
          subject: `Transfer update: ${transfer.company} → ${STATUS_LABELS[transfer.status] || transfer.status}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e0f0f0">
              <div style="background:#00B5AD;padding:20px 24px">
                <span style="color:#fff;font-size:20px;font-weight:700">golive</span>
                <span style="color:rgba(255,255,255,0.7);font-size:13px;margin-left:8px">Cloud Marketplace</span>
              </div>
              <div style="padding:28px 24px">
                <p style="font-size:14px;color:#444;margin:0 0 16px">Hi ${transfer.assignedTo},</p>
                <p style="font-size:14px;color:#444;line-height:1.7;margin:0 0 20px">A transfer request assigned to you has been updated:</p>
                <div style="background:#f5fffe;border:1px solid #c8f0ee;border-radius:8px;padding:16px 20px;margin-bottom:20px">
                  <p style="margin:0 0 10px;font-size:15px;font-weight:600;color:#1a1a1a">${transfer.company}</p>
                  <table style="width:100%;border-collapse:collapse;font-size:13px;color:#333">
                    <tr><td style="padding:5px 0;color:#888;width:120px">Ref</td><td style="font-family:monospace">${transfer.ref}</td></tr>
                    <tr><td style="padding:5px 0;color:#888">Status</td><td><span style="color:#888;text-decoration:line-through;font-size:12px">${STATUS_LABELS[prevTransfer?.status || ''] || prevTransfer?.status}</span> → <strong style="color:#00B5AD">${STATUS_LABELS[transfer.status] || transfer.status}</strong></td></tr>
                  </table>
                </div>
                <a href="https://cloud.golivecompany.com/portal" style="display:inline-block;background:#00B5AD;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">View in CRM Portal →</a>
              </div>
              <div style="background:#f9f9f9;padding:12px 24px;text-align:center;font-size:11px;color:#aaa;border-top:1px solid #eee">
                The GoLive Digital Solutions Company Ltd · contact@golivecompany.com · +234 808 358 7801
              </div>
            </div>
          `,
        })
      } catch (e) { console.error('Status email failed:', e) }
    }

    return NextResponse.json({ success: true, transfer })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
