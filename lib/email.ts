import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'GoLive Digital Solutions <hello@golivecompany.com>'
const NOTIFY = process.env.NOTIFY_EMAIL || 'contact@golivecompany.com'

// ── Lead submission notification ─────────────────────────────────────────────
export async function sendLeadNotification(lead: {
  ref: string; company: string; contact: string; email: string
  phone: string; country: string; industry: string; users: string
  services: string[]; notes?: string; currentEmail?: string
}) {
  await resend.emails.send({
    from: FROM,
    to: NOTIFY,
    subject: `New Assessment Lead — ${lead.company} [${lead.ref}]`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f7fb;padding:24px;border-radius:12px">
        <div style="background:#0d2233;border-radius:8px;padding:20px 24px;margin-bottom:24px">
          <h1 style="color:#00c8c8;margin:0;font-size:20px">New Cloud Assessment Lead</h1>
          <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:13px">Ref: ${lead.ref}</p>
        </div>
        <div style="background:white;border-radius:8px;padding:20px 24px;border:1px solid #e3e9f0">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#5c7184;width:140px">Company</td><td style="padding:8px 0;font-weight:600;color:#0d2233">${lead.company}</td></tr>
            <tr><td style="padding:8px 0;color:#5c7184">Contact</td><td style="padding:8px 0;color:#0d2233">${lead.contact}</td></tr>
            <tr><td style="padding:8px 0;color:#5c7184">Email</td><td style="padding:8px 0"><a href="mailto:${lead.email}" style="color:#0096c7">${lead.email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#5c7184">Phone</td><td style="padding:8px 0;color:#0d2233">${lead.phone}</td></tr>
            <tr><td style="padding:8px 0;color:#5c7184">Country</td><td style="padding:8px 0;color:#0d2233">${lead.country}</td></tr>
            <tr><td style="padding:8px 0;color:#5c7184">Industry</td><td style="padding:8px 0;color:#0d2233">${lead.industry}</td></tr>
            <tr><td style="padding:8px 0;color:#5c7184">Users</td><td style="padding:8px 0;color:#0d2233">${lead.users}</td></tr>
            <tr><td style="padding:8px 0;color:#5c7184">Current email</td><td style="padding:8px 0;color:#0d2233">${lead.services?.join(', ') || '—'}</td></tr>
          </table>
          <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e3e9f0">
            <a href="https://cloud.golivecompany.com/portal" style="display:inline-block;background:#0096c7;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px">View in Portal →</a>
          </div>
        </div>
        <p style="color:#5c7184;font-size:11px;text-align:center;margin-top:16px">The GoLive Digital Solutions Company Ltd. · RC1644767 · contact@golivecompany.com</p>
      </div>
    `
  })
}

// ── Lead confirmation to prospect ────────────────────────────────────────────
export async function sendLeadConfirmation(lead: {
  contact: string; company: string; ref: string; email: string
}) {
  await resend.emails.send({
    from: FROM,
    to: lead.email,
    subject: `We received your Microsoft 365 assessment — ${lead.company}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f7fb;padding:24px;border-radius:12px">
        <div style="background:#0d2233;border-radius:8px;padding:24px;margin-bottom:24px;text-align:center">
          <h1 style="color:#00c8c8;margin:0;font-size:22px">GoLive Cloud Marketplace</h1>
          <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:13px">Microsoft 365 for African Businesses</p>
        </div>
        <div style="background:white;border-radius:8px;padding:24px;border:1px solid #e3e9f0">
          <h2 style="color:#0d2233;font-size:18px;margin:0 0 12px">Hi ${lead.contact},</h2>
          <p style="color:#444;line-height:1.6;margin:0 0 16px">Thank you for submitting your Microsoft 365 cloud assessment. We have received your request for <strong>${lead.company}</strong> and our team will review it within <strong>24 hours</strong>.</p>
          <div style="background:#e8f4fb;border-left:4px solid #0096c7;border-radius:0 8px 8px 0;padding:14px 16px;margin:16px 0">
            <p style="margin:0;font-size:13px;color:#0d2233"><strong>Your reference number:</strong> ${lead.ref}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#5c7184">Keep this for your records</p>
          </div>
          <p style="color:#444;line-height:1.6;margin:16px 0">Our team will contact you shortly to discuss:</p>
          <ul style="color:#444;line-height:1.8;padding-left:20px;margin:0 0 16px">
            <li>The right Microsoft 365 package for your business</li>
            <li>Migration timeline and process</li>
            <li>Pricing in your local currency</li>
          </ul>
          <p style="color:#444;line-height:1.6;margin:0 0 20px">In the meantime, feel free to WhatsApp us on <a href="https://wa.me/2348083587801" style="color:#0096c7">+234 808 358 7801</a> if you have any questions.</p>
          <a href="https://cloud.golivecompany.com" style="display:inline-block;background:#0096c7;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Visit GoLive Cloud →</a>
        </div>
        <div style="text-align:center;margin-top:20px">
          <p style="color:#5c7184;font-size:11px;margin:0">The GoLive Digital Solutions Company Ltd. · RC1644767</p>
          <p style="color:#5c7184;font-size:11px;margin:4px 0">7 Ibiyinka Olorunbe Close, Victoria Island, Lagos · contact@golivecompany.com</p>
          <p style="color:#5c7184;font-size:11px;margin:4px 0"><a href="https://cloud.golivecompany.com/privacy" style="color:#0096c7">Privacy Policy</a> · <a href="https://cloud.golivecompany.com/terms" style="color:#0096c7">Terms of Service</a></p>
        </div>
      </div>
    `
  })
}

// ── Transfer request notification ────────────────────────────────────────────
export async function sendTransferNotification(transfer: {
  ref: string; company: string; contact: string; email: string
  phone: string; transferType: string; domain: string; country: string; users: string
}) {
  const typeLabels: Record<string, string> = {
    csp: 'CSP Transfer', google: 'Google → Microsoft 365', cpanel: 'cPanel → Microsoft 365'
  }
  await resend.emails.send({
    from: FROM,
    to: NOTIFY,
    subject: `New Transfer Request — ${transfer.company} [${transfer.ref}]`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f7fb;padding:24px;border-radius:12px">
        <div style="background:#0d2233;border-radius:8px;padding:20px 24px;margin-bottom:24px">
          <h1 style="color:#00c8c8;margin:0;font-size:20px">New Transfer Request</h1>
          <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:13px">Ref: ${transfer.ref} · ${typeLabels[transfer.transferType] || transfer.transferType}</p>
        </div>
        <div style="background:white;border-radius:8px;padding:20px 24px;border:1px solid #e3e9f0">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#5c7184;width:140px">Company</td><td style="padding:8px 0;font-weight:600;color:#0d2233">${transfer.company}</td></tr>
            <tr><td style="padding:8px 0;color:#5c7184">Contact</td><td style="padding:8px 0;color:#0d2233">${transfer.contact}</td></tr>
            <tr><td style="padding:8px 0;color:#5c7184">Email</td><td style="padding:8px 0"><a href="mailto:${transfer.email}" style="color:#0096c7">${transfer.email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#5c7184">Phone</td><td style="padding:8px 0;color:#0d2233">${transfer.phone}</td></tr>
            <tr><td style="padding:8px 0;color:#5c7184">Domain</td><td style="padding:8px 0;color:#0d2233">${transfer.domain}</td></tr>
            <tr><td style="padding:8px 0;color:#5c7184">Country</td><td style="padding:8px 0;color:#0d2233">${transfer.country}</td></tr>
            <tr><td style="padding:8px 0;color:#5c7184">Users</td><td style="padding:8px 0;color:#0d2233">${transfer.users}</td></tr>
            <tr><td style="padding:8px 0;color:#5c7184">Type</td><td style="padding:8px 0;color:#0d2233">${typeLabels[transfer.transferType] || transfer.transferType}</td></tr>
          </table>
          <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e3e9f0">
            <a href="https://cloud.golivecompany.com/portal" style="display:inline-block;background:#0096c7;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px">View in Portal →</a>
          </div>
        </div>
        <p style="color:#5c7184;font-size:11px;text-align:center;margin-top:16px">The GoLive Digital Solutions Company Ltd. · RC1644767</p>
      </div>
    `
  })
}

// ── Transfer confirmation to prospect ────────────────────────────────────────
export async function sendTransferConfirmation(transfer: {
  contact: string; company: string; ref: string; email: string; transferType: string
}) {
  const typeLabels: Record<string, string> = {
    csp: 'CSP Transfer', google: 'Google Workspace Migration', cpanel: 'cPanel Email Migration'
  }
  await resend.emails.send({
    from: FROM,
    to: transfer.email,
    subject: `Your migration request is confirmed — ${transfer.company}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f7fb;padding:24px;border-radius:12px">
        <div style="background:#0d2233;border-radius:8px;padding:24px;margin-bottom:24px;text-align:center">
          <h1 style="color:#00c8c8;margin:0;font-size:22px">GoLive Cloud Marketplace</h1>
          <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:13px">Microsoft 365 for African Businesses</p>
        </div>
        <div style="background:white;border-radius:8px;padding:24px;border:1px solid #e3e9f0">
          <h2 style="color:#0d2233;font-size:18px;margin:0 0 12px">Hi ${transfer.contact},</h2>
          <p style="color:#444;line-height:1.6;margin:0 0 16px">We have received your <strong>${typeLabels[transfer.transferType] || 'migration'}</strong> request for <strong>${transfer.company}</strong>. Our team will be in touch within <strong>48 hours</strong> to walk you through the next steps.</p>
          <div style="background:#e8f4fb;border-left:4px solid #0096c7;border-radius:0 8px 8px 0;padding:14px 16px;margin:16px 0">
            <p style="margin:0;font-size:13px;color:#0d2233"><strong>Reference:</strong> ${transfer.ref}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#5c7184">Migration typically completes within 48 hours of kickoff</p>
          </div>
          <p style="color:#444;line-height:1.6;margin:0 0 20px">Questions? WhatsApp us on <a href="https://wa.me/2348083587801" style="color:#0096c7">+234 808 358 7801</a></p>
          <a href="https://cloud.golivecompany.com/migrate" style="display:inline-block;background:#0096c7;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">View Migration Details →</a>
        </div>
        <div style="text-align:center;margin-top:20px">
          <p style="color:#5c7184;font-size:11px;margin:0">The GoLive Digital Solutions Company Ltd. · RC1644767</p>
          <p style="color:#5c7184;font-size:11px;margin:4px 0">7 Ibiyinka Olorunbe Close, Victoria Island, Lagos</p>
          <p style="color:#5c7184;font-size:11px;margin:4px 0"><a href="https://cloud.golivecompany.com/privacy" style="color:#0096c7">Privacy Policy</a> · <a href="https://cloud.golivecompany.com/terms" style="color:#0096c7">Terms of Service</a></p>
        </div>
      </div>
    `
  })
}
