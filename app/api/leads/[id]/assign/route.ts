import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Lead } from '@/models/Lead'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await connectDB()
    const { assignedTo, assignedToEmail, updatedBy } = await req.json()

    const lead = await Lead.findByIdAndUpdate(
      id,
      { assignedTo, assignedToEmail },
      { new: true }
    )

    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    // Send email notification to assigned rep
    if (assignedToEmail) {
      try {
        await resend.emails.send({
          from: 'GoLive Portal <hello@golivecompany.com>',
          to: assignedToEmail,
          subject: `Lead assigned to you: ${lead.company}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e0f0f0">
              <div style="background:#00B5AD;padding:20px 24px">
                <span style="color:#fff;font-size:20px;font-weight:700">golive</span>
                <span style="color:rgba(255,255,255,0.7);font-size:13px;margin-left:8px">Cloud Marketplace</span>
              </div>
              <div style="padding:28px 24px">
                <p style="font-size:15px;color:#1a1a1a;margin:0 0 6px">Hi ${assignedTo},</p>
                <p style="font-size:14px;color:#444;line-height:1.7;margin:0 0 20px">
                  A lead has been assigned to you${updatedBy ? ` by <strong>${updatedBy}</strong>` : ''}. Here are the details:
                </p>
                <div style="background:#f5fffe;border:1px solid #c8f0ee;border-radius:8px;padding:16px 20px;margin-bottom:20px">
                  <table style="width:100%;border-collapse:collapse;font-size:13px;color:#333">
                    <tr><td style="padding:5px 0;color:#888;width:120px">Company</td><td style="padding:5px 0;font-weight:600">${lead.company}</td></tr>
                    <tr><td style="padding:5px 0;color:#888">Contact</td><td style="padding:5px 0">${lead.contact}</td></tr>
                    <tr><td style="padding:5px 0;color:#888">Email</td><td style="padding:5px 0">${lead.email}</td></tr>
                    <tr><td style="padding:5px 0;color:#888">Phone</td><td style="padding:5px 0">${lead.phone}</td></tr>
                    <tr><td style="padding:5px 0;color:#888">Country</td><td style="padding:5px 0">${lead.country}</td></tr>
                    <tr><td style="padding:5px 0;color:#888">Status</td><td style="padding:5px 0;text-transform:capitalize">${lead.status}</td></tr>
                    <tr><td style="padding:5px 0;color:#888">Ref</td><td style="padding:5px 0;font-family:monospace">${lead.ref}</td></tr>
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
      } catch (emailErr) {
        console.error('Email notification failed:', emailErr)
        // Don't fail the whole request if email fails
      }
    }

    return NextResponse.json(lead)
  } catch {
    return NextResponse.json({ error: 'Failed to assign lead' }, { status: 500 })
  }
}
