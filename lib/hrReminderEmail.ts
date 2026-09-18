/**
 * hrReminderEmail.ts — one digest per sweep, not one email per reminder.
 * A daily job that sends five separate emails trains the recipient to ignore it.
 */

import { Resend } from 'resend'
import { PORTAL_URL, COMPANY, COMPANY_RC } from './offerConfig'
import type { Reminder } from './hrReminders'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'GoLive Digital Solutions <hello@golivecompany.com>'
const NOTIFY = process.env.NOTIFY_EMAIL || 'contact@golivecompany.com'

const esc = (s: string) =>
  String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const TONE: Record<string, { bg: string; fg: string; label: string }> = {
  overdue: { bg: '#fdecea', fg: '#a12a2a', label: 'Overdue' },
  urgent:  { bg: '#fff5e6', fg: '#a86a12', label: 'Urgent' },
  soon:    { bg: '#eef4fb', fg: '#1d4e89', label: 'Upcoming' },
}

export async function sendReminderDigest(reminders: Reminder[]): Promise<void> {
  if (!reminders.length) return

  const rows = reminders.map((r) => {
    const t = TONE[r.severity] || TONE.soon
    return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eef1f4;vertical-align:top">
          <span style="display:inline-block;background:${t.bg};color:${t.fg};font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:99px;letter-spacing:0.03em;text-transform:uppercase">${t.label}</span>
          <div style="font-size:14px;font-weight:600;color:#14304a;margin-top:6px">${esc(r.title)}</div>
          <div style="font-size:13px;color:#4b5563;margin-top:2px;line-height:1.55">${esc(r.detail)}</div>
        </td>
      </tr>`
  }).join('')

  const overdue = reminders.filter((r) => r.severity === 'overdue').length

  try {
    await resend.emails.send({
      from: FROM,
      to: NOTIFY,
      subject: overdue
        ? `HR: ${overdue} overdue item${overdue === 1 ? '' : 's'} and ${reminders.length - overdue} upcoming`
        : `HR: ${reminders.length} item${reminders.length === 1 ? '' : 's'} need attention`,
      html: `
<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#2d3436;line-height:1.6;max-width:620px;margin:0 auto">
  <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#0e7c86;font-weight:700;margin:0">People — lifecycle</p>
  <h2 style="font-size:19px;color:#14304a;margin:6px 0 14px">${reminders.length} item${reminders.length === 1 ? '' : 's'} need attention</h2>
  <table style="width:100%;border-collapse:collapse">${rows}</table>
  <p style="margin:22px 0">
    <a href="${PORTAL_URL}/portal/people" style="display:inline-block;background:#0e7c86;color:#ffffff;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13.5px">Open People (HR)</a>
  </p>
  <p style="font-size:12px;color:#9ca3af">Each item is reported once per stage, not daily. ${esc(COMPANY)} &middot; ${esc(COMPANY_RC)}</p>
</div>`,
    })
  } catch (e) {
    console.error('[hr-reminders] digest send failed:', e)
  }
}
