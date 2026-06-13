import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface LeadEmailData {
  company: string
  contact: string
  email: string
  phone: string
  country: string
  industry: string
  users: string
  currentEmail: string
  services: string[]
  notes: string
  ref: string
}

export async function sendLeadNotification(data: LeadEmailData) {
  const servicesHtml = data.services.map(s => `<li>${s}</li>`).join('')

  await transporter.sendMail({
    from: `"GoLive Cloud Portal" <${process.env.SMTP_USER}>`,
    to: process.env.NOTIFY_EMAIL,
    subject: `New Lead: ${data.company} (${data.country}) — Ref ${data.ref}`,
    html: `
      <div style="font-family:Segoe UI,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#0d2233;padding:20px;border-radius:8px 8px 0 0">
          <span style="color:#00b4d8;font-size:18px;font-weight:700">go</span>
          <span style="color:#00c8c8;font-size:18px;font-weight:700">live</span>
          <span style="color:#fff;font-size:14px;margin-left:8px">New Assessment Lead</span>
        </div>
        <div style="background:#f4fafd;padding:20px;border:1px solid #c8e6f0">
          <p style="color:#0d2233;font-size:14px;font-weight:700;margin-bottom:16px">
            New lead from the GoLive Cloud Marketplace
          </p>
          <table style="width:100%;font-size:13px;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#5a7a8a;width:140px">Reference</td><td style="font-weight:700;color:#0096c7">${data.ref}</td></tr>
            <tr><td style="padding:6px 0;color:#5a7a8a">Company</td><td style="font-weight:700">${data.company}</td></tr>
            <tr><td style="padding:6px 0;color:#5a7a8a">Contact</td><td>${data.contact}</td></tr>
            <tr><td style="padding:6px 0;color:#5a7a8a">Email</td><td><a href="mailto:${data.email}">${data.email}</a></td></tr>
            <tr><td style="padding:6px 0;color:#5a7a8a">WhatsApp</td><td><a href="https://wa.me/${data.phone.replace(/\D/g,'')}">${data.phone}</a></td></tr>
            <tr><td style="padding:6px 0;color:#5a7a8a">Country</td><td>${data.country}</td></tr>
            <tr><td style="padding:6px 0;color:#5a7a8a">Industry</td><td>${data.industry}</td></tr>
            <tr><td style="padding:6px 0;color:#5a7a8a">Staff count</td><td>${data.users}</td></tr>
            <tr><td style="padding:6px 0;color:#5a7a8a">Current email</td><td>${data.currentEmail}</td></tr>
          </table>
          <div style="margin-top:14px">
            <p style="color:#5a7a8a;font-size:12px;margin-bottom:6px">Services interested in:</p>
            <ul style="font-size:13px;margin:0;padding-left:16px">${servicesHtml}</ul>
          </div>
          ${data.notes ? `<div style="margin-top:14px;background:#fff;border:1px solid #c8e6f0;border-radius:6px;padding:12px"><p style="color:#5a7a8a;font-size:12px;margin:0 0 6px">Notes:</p><p style="font-size:13px;margin:0">${data.notes}</p></div>` : ''}
          <div style="margin-top:20px;text-align:center">
            <a href="${process.env.NEXTAUTH_URL}/portal" style="background:#0096c7;color:#fff;padding:10px 24px;border-radius:7px;text-decoration:none;font-weight:700;font-size:13px">Open GoLive Portal →</a>
          </div>
        </div>
        <div style="background:#0d2233;padding:12px 20px;border-radius:0 0 8px 8px;text-align:center">
          <span style="color:rgba(255,255,255,.4);font-size:11px">GoLive Digital Solutions Company Ltd · Authorized Microsoft CSP · Africa</span>
        </div>
      </div>
    `,
  })
}

export async function sendLeadConfirmation(to: string, name: string, ref: string) {
  await transporter.sendMail({
    from: `"GoLive Digital Solutions" <${process.env.SMTP_USER}>`,
    to,
    subject: `Your Microsoft Cloud Assessment Request — Ref ${ref}`,
    html: `
      <div style="font-family:Segoe UI,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#0d2233;padding:20px;border-radius:8px 8px 0 0">
          <span style="color:#00b4d8;font-size:18px;font-weight:700">go</span>
          <span style="color:#00c8c8;font-size:18px;font-weight:700">live</span>
          <span style="color:#fff;font-size:14px;margin-left:8px">Cloud Marketplace</span>
        </div>
        <div style="background:#f4fafd;padding:24px;border:1px solid #c8e6f0">
          <p style="font-size:15px;font-weight:700;color:#0d2233">Hi ${name},</p>
          <p style="font-size:13px;color:#4a6572;line-height:1.7">
            Thank you for submitting your Microsoft Cloud Readiness Assessment. Your request has been received and logged in our system.
          </p>
          <div style="background:#fff;border:1px solid #c8e6f0;border-radius:8px;padding:14px;margin:16px 0;text-align:center">
            <p style="font-size:11px;color:#5a7a8a;margin:0 0 4px">Your reference number</p>
            <p style="font-size:20px;font-weight:700;color:#0096c7;margin:0">${ref}</p>
          </div>
          <p style="font-size:13px;color:#4a6572;line-height:1.7">
            A dedicated GoLive cloud advisor will contact you within <strong>24 hours</strong> via email and WhatsApp with a custom Microsoft cloud plan and pricing in your local currency.
          </p>
          <p style="font-size:13px;color:#4a6572">Need an immediate response? WhatsApp us: <a href="https://wa.me/${process.env.NEXT_PUBLIC_WA_NUMBER}" style="color:#0096c7">+${process.env.NEXT_PUBLIC_WA_NUMBER}</a></p>
        </div>
        <div style="background:#0d2233;padding:12px 20px;border-radius:0 0 8px 8px;text-align:center">
          <span style="color:rgba(255,255,255,.4);font-size:11px">GoLive Digital Solutions Company Ltd · Authorized Microsoft CSP · Africa · golivenaija.com</span>
        </div>
      </div>
    `,
  })
}
