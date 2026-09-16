/**
 * executedPack.ts — builds the executed onboarding pack as one merged PDF.
 *
 * Structure:
 *   page 1      certificate of acknowledgement (every document, its own
 *               timestamp, both signatures, statutory basis)
 *   then, per uploaded PDF: the document itself, followed by a signature
 *               page carrying both signatures and that document's timestamp
 *
 * Non-PDF uploads (.docx and the like) cannot be merged. They are still
 * listed on the certificate with their acknowledgement time, and flagged
 * there as held separately — the record stays complete either way.
 *
 * Signatures render in Great Vibes (SIL Open Font License), the same face
 * the onboarding page shows on screen, so the paper artefact matches what
 * the signer saw.
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import fs from 'fs'
import path from 'path'

const TEAL = rgb(0.055, 0.486, 0.525)
const SLATE = rgb(0.176, 0.204, 0.212)
const MUTED = rgb(0.42, 0.447, 0.463)
const INK = rgb(0.078, 0.188, 0.29)
const RULE = rgb(0.796, 0.835, 0.847)

const A4: [number, number] = [595.28, 841.89]
const M = 56

export interface ExecutedDoc {
  filename: string
  label: string
  acknowledgedAt?: Date | null
}

export interface ExecutedPackInput {
  ref: string
  name: string
  role: string
  employeeNumber?: string
  jobCode?: string
  docs: ExecutedDoc[]
  signatureName: string
  signedAt: Date
  ip?: string
  mdAckName: string
  mdAckAt: Date
  docsDir: string
}

const fmt = (d?: Date | null) =>
  d
    ? new Date(d).toLocaleString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos',
      }) + ' WAT'
    : '\u2014'

function loadScriptFont(): Uint8Array | null {
  const p = path.join(process.cwd(), 'public', 'fonts', 'GreatVibes-Regular.ttf')
  try {
    return fs.existsSync(p) ? new Uint8Array(fs.readFileSync(p)) : null
  } catch {
    return null
  }
}

/** Signature block: script name over a rule, with role and timestamp beneath. */
function signatureBlock(
  page: ReturnType<PDFDocument['addPage']>,
  opts: {
    x: number; y: number; width: number
    caption: string; name: string; sub: string
    script: PDFFont; label: PDFFont; body: PDFFont
  }
) {
  const { x, y, width, caption, name, sub, script, label, body } = opts
  // Great Vibes is a wide face and legal names vary in length, so the
  // signature is shrunk to fit its block rather than running into the next one.
  let size = 26
  while (size > 11 && script.widthOfTextAtSize(name, size) > width - 6) size -= 0.5
  page.drawText(caption.toUpperCase(), { x, y: y + 46, size: 7.5, font: label, color: MUTED })
  // Drawn one character at a time. Laying out a whole string lets the fonts
  // ligature table substitute pairs such as "em" and "en" for decorative
  // glyphs outside the basic range, which corrupts both the rendered
  // signature and the extractable text.
  let cx = x
  for (const ch of name) {
    page.drawText(ch, { x: cx, y: y + 14, size, font: script, color: INK })
    cx += script.widthOfTextAtSize(ch, size)
  }
  page.drawLine({ start: { x, y: y + 8 }, end: { x: x + width, y: y + 8 }, thickness: 0.75, color: RULE })
  page.drawText(sub, { x, y: y - 4, size: 8, font: body, color: MUTED })
}

export async function buildExecutedPack(input: ExecutedPackInput): Promise<Buffer> {
  const out = await PDFDocument.create()
  out.registerFontkit(fontkit)

  const body = await out.embedFont(StandardFonts.Helvetica)
  const bold = await out.embedFont(StandardFonts.HelveticaBold)
  const italic = await out.embedFont(StandardFonts.HelveticaOblique)

  const scriptBytes = loadScriptFont()
  const script: PDFFont = scriptBytes
    ? await out.embedFont(scriptBytes, { subset: false })
    : await out.embedFont(StandardFonts.TimesRomanItalic)

  // ---------- certificate ----------
  const cert = out.addPage(A4)
  let y = A4[1] - M

  cert.drawText('go', { x: M, y, size: 20, font: bold, color: TEAL })
  cert.drawText('live', { x: M + 24, y, size: 20, font: bold, color: SLATE })
  cert.drawText('The GoLive Digital Solutions Company Ltd.', { x: M + 72, y: y + 3, size: 9, font: body, color: MUTED })
  y -= 12
  cert.drawLine({ start: { x: M, y }, end: { x: A4[0] - M, y }, thickness: 2, color: TEAL })

  y -= 38
  cert.drawText('CERTIFICATE OF ACKNOWLEDGEMENT', { x: M, y, size: 16, font: bold, color: TEAL })
  y -= 16
  cert.drawText('Onboarding documentation \u2014 electronically executed', { x: M, y, size: 9.5, font: italic, color: MUTED })

  // identity table
  y -= 30
  const rows: [string, string][] = [
    ['Employee', input.name],
    ['Position', input.role],
    ['Job code', input.jobCode || '\u2014'],
    ['Employee number', input.employeeNumber || '\u2014'],
    ['Application reference', input.ref],
  ]
  for (const [k, v] of rows) {
    cert.drawText(k, { x: M, y, size: 9, font: bold, color: MUTED })
    cert.drawText(v, { x: M + 130, y, size: 9.5, font: body, color: SLATE })
    y -= 17
  }

  // documents
  y -= 16
  cert.drawText('DOCUMENTS ACKNOWLEDGED', { x: M, y, size: 9, font: bold, color: TEAL })
  y -= 6
  cert.drawLine({ start: { x: M, y }, end: { x: A4[0] - M, y }, thickness: 0.75, color: RULE })
  y -= 18

  for (const d of input.docs) {
    const isPdf = /\.pdf$/i.test(d.filename)
    cert.drawText(d.label.slice(0, 62), { x: M, y, size: 9.5, font: bold, color: SLATE })
    y -= 13
    cert.drawText(`Acknowledged ${fmt(d.acknowledgedAt)}${isPdf ? '' : '  \u00b7  held separately (non-PDF original)'}`, {
      x: M + 10, y, size: 8.5, font: body, color: MUTED,
    })
    y -= 20
  }

  // statutory basis
  y -= 6
  cert.drawText('BASIS OF EXECUTION', { x: M, y, size: 9, font: bold, color: TEAL })
  y -= 6
  cert.drawLine({ start: { x: M, y }, end: { x: A4[0] - M, y }, thickness: 0.75, color: RULE })
  y -= 16

  const lines = [
    'Each document above was delivered to the employee through a personal, expiring link issued by the',
    'GoLive Cloud Portal and confirmed individually by the employee before signature. The employee signed',
    'by typing their full legal name; the date, time and originating network address were recorded at that',
    'moment. Electronic signatures are valid and binding under section 93 of the Evidence Act 2011 and',
    'section 17 of the Cybercrimes (Prohibition, Prevention, etc.) Act 2015.',
  ]
  for (const l of lines) {
    cert.drawText(l, { x: M, y, size: 8.5, font: body, color: SLATE })
    y -= 12
  }
  y -= 4
  cert.drawText(`Originating network address recorded: ${input.ip || 'not recorded'}`, { x: M, y, size: 8.5, font: body, color: MUTED })

  // signatures
  y -= 70
  signatureBlock(cert, {
    x: M, y, width: 300, caption: 'Signed by the employee',
    name: input.signatureName, sub: `${input.name} \u2014 ${fmt(input.signedAt)}`, script, label: bold, body,
  })
  y -= 86
  signatureBlock(cert, {
    x: M, y, width: 300, caption: 'For The GoLive Digital Solutions Company Ltd',
    name: input.mdAckName, sub: `Managing Director / CEO \u2014 ${fmt(input.mdAckAt)}`, script, label: bold, body,
  })

  cert.drawText(
    'The GoLive Digital Solutions Company Ltd \u00b7 RC1644767 \u00b7 Certificate generated by the GoLive Cloud Portal',
    { x: M, y: 40, size: 7.5, font: body, color: MUTED }
  )

  // ---------- each PDF document + its signature page ----------
  for (const d of input.docs) {
    if (!/\.pdf$/i.test(d.filename)) continue
    const full = path.join(input.docsDir, d.filename)
    if (!fs.existsSync(full)) continue

    try {
      const src = await PDFDocument.load(fs.readFileSync(full), { ignoreEncryption: true })
      const pages = await out.copyPages(src, src.getPageIndices())
      for (const p of pages) out.addPage(p)
    } catch (e) {
      console.error('[executedPack] could not merge', d.filename, e)
      continue
    }

    const sig = out.addPage(A4)
    let sy = A4[1] - M

    sig.drawText('EXECUTION PAGE', { x: M, y: sy, size: 13, font: bold, color: TEAL })
    sy -= 10
    sig.drawLine({ start: { x: M, y: sy }, end: { x: A4[0] - M, y: sy }, thickness: 2, color: TEAL })
    sy -= 28
    sig.drawText(d.label.slice(0, 70), { x: M, y: sy, size: 11, font: bold, color: SLATE })
    sy -= 16
    sig.drawText(
      `${input.role}${input.jobCode ? '  \u00b7  ' + input.jobCode : ''}${input.employeeNumber ? '  \u00b7  ' + input.employeeNumber : ''}  \u00b7  ${input.ref}`,
      { x: M, y: sy, size: 8.5, font: body, color: MUTED }
    )

    sy -= 34
    const para = [
      'The employee confirmed that they had downloaded and read this document, and agreed to be bound by it',
      'from their start date, before signing electronically. Electronic signatures are valid and binding under',
      'section 93 of the Evidence Act 2011 and section 17 of the Cybercrimes (Prohibition, Prevention, etc.) Act 2015.',
    ]
    for (const l of para) {
      sig.drawText(l, { x: M, y: sy, size: 8.5, font: body, color: SLATE })
      sy -= 12
    }

    sy -= 10
    sig.drawText(`This document acknowledged: ${fmt(d.acknowledgedAt)}`, { x: M, y: sy, size: 9, font: bold, color: SLATE })
    sy -= 14
    sig.drawText(`Network address recorded: ${input.ip || 'not recorded'}`, { x: M, y: sy, size: 8.5, font: body, color: MUTED })

    sy -= 70
    signatureBlock(sig, {
      x: M, y: sy, width: 230, caption: 'Signed by the employee',
      name: input.signatureName, sub: `${input.name} \u2014 ${fmt(input.signedAt)}`, script, label: bold, body,
    })
    sy -= 90
    signatureBlock(sig, {
      x: M, y: sy, width: 230, caption: 'For The GoLive Digital Solutions Company Ltd',
      name: input.mdAckName, sub: `Managing Director / CEO \u2014 ${fmt(input.mdAckAt)}`, script, label: bold, body,
    })

    sig.drawText(
      'The GoLive Digital Solutions Company Ltd \u00b7 RC1644767 \u00b7 Execution page generated by the GoLive Cloud Portal',
      { x: M, y: 40, size: 7.5, font: body, color: MUTED }
    )
  }

  const bytes = await out.save()
  return Buffer.from(bytes)
}
