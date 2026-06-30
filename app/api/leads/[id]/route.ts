import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Lead } from '@/models/Lead'
import { Notification } from '@/models/Notification'
import { DiscoveryAssessment } from '@/models/DiscoveryAssessment'
import { DeploymentChecklist } from '@/models/DeploymentChecklist'
import { Resend } from 'resend'
import { requireSession, requireAdmin } from '@/lib/apiAuth'

const resend = new Resend(process.env.RESEND_API_KEY)

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  assessment: 'Assessment',
  quoted: 'Quoted',
  negotiating: 'Negotiating',
  won: 'Won 🎉',
  lost: 'Lost',
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  try {
    await connectDB()
    const body = await req.json()
    const prevLead = await Lead.findById(id)
    const updated = await Lead.findByIdAndUpdate(id, body, { new: true })

    if (!updated) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    // Notify assigned rep if status changed and they have an email
    if (
      updated.assignedToEmail &&
      prevLead?.status !== updated.status &&
      body.status
    ) {
      try {
        await Notification.create({
          recipientEmail: updated.assignedToEmail,
          type: 'lead_status',
          title: `Lead status updated: ${updated.company}`,
          message: `${STATUS_LABELS[prevLead?.status || ''] || prevLead?.status} → ${STATUS_LABELS[updated.status] || updated.status}`,
          link: 'assessments',
        })
      } catch (e) { console.error('In-app notification failed:', e) }

      try {
        await resend.emails.send({
          from: 'GoLive Portal <hello@golivecompany.com>',
          to: updated.assignedToEmail,
          subject: `Lead update: ${updated.company} → ${STATUS_LABELS[updated.status] || updated.status}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e0f0f0">
              <div style="background:#00B5AD;padding:20px 24px">
                <span style="color:#fff;font-size:20px;font-weight:700">golive</span>
                <span style="color:rgba(255,255,255,0.7);font-size:13px;margin-left:8px">Cloud Marketplace</span>
              </div>
              <div style="padding:28px 24px">
                <p style="font-size:14px;color:#444;margin:0 0 16px">Hi ${updated.assignedTo},</p>
                <p style="font-size:14px;color:#444;line-height:1.7;margin:0 0 20px">
                  A lead assigned to you has been updated:
                </p>
                <div style="background:#f5fffe;border:1px solid #c8f0ee;border-radius:8px;padding:16px 20px;margin-bottom:20px">
                  <p style="margin:0 0 10px;font-size:15px;font-weight:600;color:#1a1a1a">${updated.company}</p>
                  <table style="width:100%;border-collapse:collapse;font-size:13px;color:#333">
                    <tr><td style="padding:5px 0;color:#888;width:120px">Contact</td><td>${updated.contact}</td></tr>
                    <tr><td style="padding:5px 0;color:#888">Ref</td><td style="font-family:monospace">${updated.ref}</td></tr>
                    <tr>
                      <td style="padding:5px 0;color:#888">Status</td>
                      <td>
                        <span style="color:#888;text-decoration:line-through;font-size:12px">${STATUS_LABELS[prevLead?.status || ''] || prevLead?.status}</span>
                        &nbsp;→&nbsp;
                        <strong style="color:#00B5AD">${STATUS_LABELS[updated.status] || updated.status}</strong>
                      </td>
                    </tr>
                    ${body.notes ? `<tr><td style="padding:5px 0;color:#888;vertical-align:top">Notes</td><td style="font-style:italic;color:#555">${body.notes}</td></tr>` : ''}
                  </table>
                </div>
                <a href="https://cloud.golivecompany.com/portal" style="display:inline-block;background:#00B5AD;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">
                  View in CRM Portal →
                </a>
              </div>
              <div style="background:#f9f9f9;padding:12px 24px;text-align:center;font-size:11px;color:#aaa;border-top:1px solid #eee">
                The GoLive Digital Solutions Company Ltd · contact@golivecompany.com · +234 808 358 7801
              </div>
            </div>
          `,
        })
      } catch (emailErr) {
        console.error('Status update email failed:', emailErr)
      }
    }

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  try {
    await connectDB()
    await Lead.findByIdAndDelete(id)
    // Without this, Discovery Assessments and Deployment Checklists tied to
    // this lead become permanent orphans — they keep showing up in lists
    // (e.g. "Saved Assessments — All leads") referencing a lead that no
    // longer exists, with no way to clean them up from the UI.
    await Promise.all([
      DiscoveryAssessment.deleteMany({ leadId: id }),
      DeploymentChecklist.deleteMany({ leadId: id }),
    ])
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }
}
