/**
 * partnerCertificate.ts: GoLive Partner Network certificates. SERVER ONLY.
 *
 * - Numbers: partners GL-PTR-001 onwards; certificates GL-CERT-YYYY-NNN, both
 *   minted at the MD's countersignature. Test agreements mint GL-PTR-T001 and
 *   GL-CERT-TEST-YYYY-NNN, which never use up a real number.
 * - Valid 12 months. Anyone can check a certificate at /verify/<number>.
 * - GoLive branding only: no vendor names, logos or marks, as the
 *   distribution agreements require.
 */

import fs from 'fs'
import path from 'path'
import QRCode from 'qrcode'
import PartnerApplication from '@/models/PartnerApplication'
import { PORTAL_URL, COMPANY, COMPANY_RC, MD_NAME, MD_TITLE } from '@/lib/offerConfig'

export const CERT_VALID_MONTHS = 12

export async function nextPartnerNumber(test: boolean): Promise<string> {
  const re = test ? /^GL-PTR-T(\d+)$/ : /^GL-PTR-(\d+)$/
  const nums = (await PartnerApplication.distinct('partnerNumber', { partnerNumber: { $regex: re.source } })) as string[]
  const max = nums.reduce((m, n) => Math.max(m, parseInt(n.match(re)?.[1] || '0', 10)), 0)
  return test ? `GL-PTR-T${String(max + 1).padStart(3, '0')}` : `GL-PTR-${String(max + 1).padStart(3, '0')}`
}

export async function nextCertificateNumber(test: boolean, now = new Date()): Promise<string> {
  const prefix = test ? `GL-CERT-TEST-${now.getFullYear()}-` : `GL-CERT-${now.getFullYear()}-`
  const nums = (await PartnerApplication.distinct('certificate.number', { 'certificate.number': { $regex: `^${prefix}` } })) as string[]
  const max = nums.reduce((m, n) => Math.max(m, parseInt(n.slice(prefix.length), 10) || 0), 0)
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

export const verifyUrl = (certNumber: string) => `${PORTAL_URL}/verify/${encodeURIComponent(certNumber)}`

export type CertStatus = 'valid' | 'expired' | 'revoked'
export function certStatus(c: { expiresAt: Date | string; revokedAt?: Date | string | null }, now = new Date()): CertStatus {
  if (c.revokedAt) return 'revoked'
  return now.getTime() > new Date(c.expiresAt).getTime() ? 'expired' : 'valid'
}

/**
 * LinkedIn "Add to profile" link for a certification. The partner lands on
 * LinkedIn's own form, pre-filled; nothing is posted without them saving it.
 */
export function linkedInAddUrl(c: { title: string; number: string; issuedAt: Date | string; expiresAt: Date | string }): string {
  const i = new Date(c.issuedAt)
  const e = new Date(c.expiresAt)
  const q = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: c.title,
    organizationName: 'The GoLive Digital Solutions Company Ltd',
    issueYear: String(i.getFullYear()),
    issueMonth: String(i.getMonth() + 1),
    expirationYear: String(e.getFullYear()),
    expirationMonth: String(e.getMonth() + 1),
    certUrl: verifyUrl(c.number),
    certId: c.number,
  })
  return `https://www.linkedin.com/profile/add?${q.toString()}`
}

let fontCache: string | null = null
function signatureFont(): string | null {
  if (fontCache !== null) return fontCache || null
  try { fontCache = `data:font/ttf;base64,${fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'GreatVibes-Regular.ttf')).toString('base64')}` } catch { fontCache = '' }
  return fontCache || null
}

let logoCache: string | null = null
function logoDataUri(): string | null {
  if (logoCache !== null) return logoCache || null
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), 'public', 'brand', 'golive-logo.png'))
    logoCache = `data:image/png;base64,${buf.toString('base64')}`
  } catch { logoCache = '' }
  return logoCache || null
}

const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const longDate = (d: Date | string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' })

export async function buildCertificateHtml(c: {
  name: string; title: string; number: string; partnerNumber: string; issuedAt: Date | string; expiresAt: Date | string
  test?: boolean; revoked?: boolean
}): Promise<string> {
  const url = verifyUrl(c.number)
  const qr = await QRCode.toDataURL(url, { margin: 0, width: 360, errorCorrectionLevel: 'M', color: { dark: '#0b3d45', light: '#ffffff' } })
  const logo = logoDataUri()
  const stamp = c.revoked ? 'REVOKED' : c.test ? 'TEST: NOT VALID' : ''
  const font = signatureFont()
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  ${font ? `@font-face { font-family: 'GL Signature'; src: url('${font}') format('truetype'); }` : ''}
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 297mm; height: 210mm; }
  body { font-family: 'Liberation Sans', 'DejaVu Sans', Arial, sans-serif; color: #1f2d33; background: #ffffff; }
  .page { position: relative; width: 297mm; height: 210mm; padding: 12mm; }
  .frame { position: relative; height: 100%; border: 1.2mm solid #0e7c86; padding: 3mm; }
  .inner { position: relative; height: 100%; border: 0.3mm solid #9fcfd4; padding: 13mm 18mm 11mm; display: flex; flex-direction: column; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; }
  .logo { height: 21mm; width: auto; }
  .wordmark { font-size: 22pt; font-weight: 700; color: #0e7c86; }
  .ids { text-align: right; font-size: 8.5pt; color: #5b6b72; line-height: 1.6; }
  .ids b { color: #1f2d33; letter-spacing: .03em; }
  .kicker { margin-top: 9mm; font-size: 10pt; letter-spacing: .32em; text-transform: uppercase; color: #0e7c86; font-weight: 700; }
  h1 { margin-top: 2mm; font-family: 'Liberation Serif', 'DejaVu Serif', Georgia, serif; font-weight: 400; font-size: 34pt; letter-spacing: .01em; color: #12262c; }
  .certifies { margin-top: 7mm; font-size: 11pt; color: #5b6b72; }
  .name { margin-top: 2mm; font-family: 'Liberation Serif', 'DejaVu Serif', Georgia, serif; font-size: 30pt; color: #0b3d45; border-bottom: 0.4mm solid #0e7c86; padding-bottom: 2mm; display: inline-block; min-width: 150mm; }
  .body { margin-top: 5mm; font-size: 11pt; line-height: 1.6; color: #34454c; max-width: 185mm; }
  .body b { color: #12262c; }
  .bottom { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; gap: 10mm; }
  .sig { font-size: 9pt; color: #5b6b72; line-height: 1.5; }
  .sig .typed { font-family: 'GL Signature', 'Liberation Serif', Georgia, serif; font-size: 25pt; font-variant-ligatures: none; font-feature-settings: "liga" 0, "dlig" 0, "calt" 0, "clig" 0; color: #12262c; border-bottom: 0.3mm solid #9aa9ae; padding-bottom: 1mm; margin-bottom: 1.5mm; min-width: 70mm; display: inline-block; }
  .dates { font-size: 9pt; color: #5b6b72; line-height: 1.7; }
  .dates b { color: #12262c; }
  .verify { display: flex; align-items: flex-end; gap: 4mm; text-align: right; }
  .verify img { width: 27mm; height: 27mm; }
  .verify p { font-size: 7.5pt; color: #5b6b72; line-height: 1.5; max-width: 52mm; }
  .verify b { color: #0e7c86; white-space: nowrap; }
  .foot { position: absolute; left: 18mm; right: 18mm; bottom: 4mm; font-size: 7pt; color: #8a99a0; text-align: center; }
  .stamp { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-18deg); border: 1.4mm solid #c50f1f; color: #c50f1f;
    font-size: 40pt; font-weight: 700; padding: 3mm 10mm; letter-spacing: .08em; opacity: .75; white-space: nowrap; }
</style></head><body><div class="page"><div class="frame"><div class="inner">
  <div class="top">
    ${logo ? `<img class="logo" src="${logo}" alt="GoLive">` : '<div class="wordmark">golive</div>'}
    <div class="ids">Certificate No. <b>${esc(c.number)}</b><br>Partner No. <b>${esc(c.partnerNumber)}</b></div>
  </div>
  <div class="kicker">GoLive Partner Network</div>
  <h1>Certificate of Accreditation</h1>
  <div class="certifies">This certifies that</div>
  <div class="name">${esc(c.name)}</div>
  <div class="body">has completed the accreditation of the GoLive Partner Network, including training in anti-bribery and business integrity and the partner assessment, and is appointed a <b>${esc(c.title)}</b> of ${esc(COMPANY.replace(/\.$/, ''))}.</div>
  <div class="bottom">
    <div class="sig"><span class="typed">${esc(MD_NAME)}</span><br>${esc(MD_NAME)}, ${esc(MD_TITLE)}<br>${esc(COMPANY.replace(/\.$/, ''))}</div>
    <div class="dates">Issued <b>${longDate(c.issuedAt)}</b><br>Valid until <b>${longDate(c.expiresAt)}</b></div>
    <div class="verify"><p>Scan or visit to confirm this certificate is current:<br><b>${esc(url.replace(/^https:\/\//, '').replace(/[^/]+$/, ''))}</b><br><b>${esc(c.number)}</b></p><img src="${qr}" alt="QR code"></div>
  </div>
  <div class="foot">${esc(COMPANY)} &middot; ${esc(COMPANY_RC)} &middot; Lagos, Nigeria. This certificate confers no authority to bind the company or any vendor, and is valid only while shown as current at the address above.</div>
  ${stamp ? `<div class="stamp">${stamp}</div>` : ''}
</div></div></div></body></html>`
}

/** Landscape A4, no running header or footer, so it cannot share renderPdfFromHtml. */
export async function renderCertificatePdf(html: string): Promise<Buffer> {
  const puppeteer = (await import('puppeteer')).default
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    await page.emulateMediaType('print')
    const pdf = await page.pdf({ format: 'A4', landscape: true, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, preferCSSPageSize: true })
    return Buffer.from(pdf)
  } finally {
    if (browser) { try { await browser.close() } catch { /* already gone */ } }
  }
}
