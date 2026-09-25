/**
 * brandedDocument.ts: the GoLive branded document template, used for every
 * document the portal generates for signature (partner agreements, offer
 * letters, and anything added later).
 *
 * Reproduces the approved Word template (September 2026): full-bleed cover,
 * "Particulars" table, sections under titled bands each starting a new page,
 * teal-numbered clauses, an Execution page with signature blocks, a running
 * header and footer with page numbers, and a full-bleed back cover.
 * US Letter, Arial (Liberation Sans in the container).
 *
 * One description of a document drives both outputs:
 *   brandedWebHtml()  the signing page in the browser
 *   renderBrandedPdf() the PDF: cover + body (header/footer) + back cover
 *
 * Callers pass pre-escaped HTML for clause bodies (use esc() for any value
 * that came from a person) and plain strings everywhere else.
 */

import fs from 'fs'
import path from 'path'
import { COMPANY, COMPANY_RC } from '@/lib/offerConfig'

export const BRAND = {
  teal: '#00A5A8',
  navy: '#071923',
  ink: '#11181D',
  muted: '#5D6A72',
  amber: '#9B6500',
  tint: '#EAF7F8',
  band: '#EDF6FC',
  pending: '#FFF6E5',
  signed: '#EEF8F0',
  signedInk: '#1A5C2A',
}

/** Shown in the footer of every page. */
export const FOOTER_LINE = `${COMPANY.replace(/\.$/, '').toUpperCase()}  |  ${COMPANY_RC}  |  MICROSOFT CSP PARTNER 6787357`

export const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export type SignParty = {
  /** Band heading, e.g. "Partner" or "For The GoLive Digital Solutions Company Ltd". */
  heading: string
  /** Name line, e.g. "Adeniyi Olayemi  |  Managing Director / CEO". */
  name: string
  signed?: { name: string; at: string; ip?: string | null; extra?: string } | null
  /** Shown while unsigned, e.g. "Awaiting the Partner's signature". */
  pending: string
}

export type BrandedSection = { title: string; note?: string; html: string }

export type BrandedDoc = {
  /** Cover and back-cover title, e.g. "Independent Sales Partner Agreement". */
  title: string
  /** Running header title; defaults to the title. */
  headerTitle?: string
  preparedFor: string
  /** Small caps line on the cover, e.g. ["Partner network", "Sales governance", "Commission"]. */
  coverTags: string[]
  /** Dark band at the foot of the cover, e.g. "PSA-2026-v2 · Draft for execution". */
  coverFooterLeft: string
  coverFooterRight?: string
  /** Red banner at the top of the body, for TEST or VOID documents. */
  warning?: string
  particulars: { title: string; note?: string; rows: [string, string][] }
  /** HTML directly after the particulars table (the opening paragraph). */
  intro?: string
  /** Clauses shown on the particulars page, under the table. */
  firstHtml?: string
  sections: BrandedSection[]
  execution: {
    note: string
    refLabel: string
    refValue: string
    parties: SignParty[]
    closing?: string
    footnote: string
  }
}

/* ------------------------------------------------------------------ styles */

const BODY_CSS = `
.bd { font-family: Arial, 'Liberation Sans', 'Helvetica Neue', sans-serif; color: ${BRAND.ink}; font-size: 10pt; line-height: 1.38; }
.bd * { box-sizing: border-box; }
.bd p { margin: 0 0 6pt; }
.bd .band { display: flex; align-items: center; background: ${BRAND.band}; border-left: 4pt solid ${BRAND.teal}; padding: 3pt 8pt; margin: 0 0 4pt; }
.bd .band h2 { font-size: 15.5pt; line-height: 1.2; font-weight: 700; margin: 0; color: ${BRAND.ink}; }
.bd .bandnote { font-style: italic; color: ${BRAND.muted}; font-size: 9pt; margin: 0 0 10pt; }
.bd .page { break-before: page; page-break-before: always; }
.bd .page.first { break-before: auto; page-break-before: auto; }
@media screen { .bd .page { margin-top: 30pt; } .bd .page.first { margin-top: 0; } }
.bd h3 { font-size: 11pt; font-weight: 700; margin: 12pt 0 5pt; color: ${BRAND.ink}; break-after: avoid; }
.bd h3 .n { color: ${BRAND.teal}; margin-right: 6pt; }
.bd .cl { margin: 0 0 6pt; }
.bd .cl .n { color: ${BRAND.teal}; font-weight: 700; margin-right: 5pt; }
.bd table { border-collapse: collapse; width: 100%; }
.bd .parts { margin: 2pt 0 8pt; font-size: 10pt; }
.bd .parts td { padding: 6pt 8pt; border-bottom: 1pt solid #ffffff; vertical-align: top; }
.bd .parts td.k { background: ${BRAND.navy}; color: #ffffff; font-size: 7.5pt; font-weight: 700; letter-spacing: .03em; text-transform: uppercase; width: 26%; }
.bd .parts td.v { font-weight: 700; }
.bd .parts tr:nth-child(odd) td.v { background: ${BRAND.tint}; }
.bd .sched { margin: 4pt 0 10pt; font-size: 8.5pt; }
.bd .sched th { background: ${BRAND.navy}; color: #ffffff; text-transform: uppercase; font-size: 7pt; letter-spacing: .03em; text-align: left; padding: 5pt 7pt; }
.bd .sched td { padding: 5pt 7pt; border-bottom: 1pt solid #dfe8ea; vertical-align: top; }
.bd .sched tr:nth-child(even) td { background: ${BRAND.tint}; }
.bd .sched td.r { font-weight: 700; width: 34%; }
.bd .sched td.r span { display: block; }
.bd .warn { border: 1.5pt solid #c50f1f; color: #c50f1f; font-weight: 700; text-align: center; padding: 6pt; margin: 0 0 10pt; }
.bd .ref { font-size: 9.5pt; margin: 0 0 14pt; } .bd .ref b.k { color: ${BRAND.teal}; margin-right: 6pt; }
.bd .party { margin: 0 0 16pt; break-inside: avoid; }
.bd .party .ph { background: ${BRAND.band}; color: ${BRAND.teal}; font-weight: 700; text-transform: uppercase; font-size: 9.5pt; padding: 6pt 8pt; }
.bd .party .row { display: flex; justify-content: space-between; gap: 16pt; padding: 6pt 8pt 2pt; font-size: 9.5pt; }
.bd .party .row b { font-weight: 700; }
.bd .party .sig { display: flex; justify-content: space-between; gap: 16pt; padding: 6pt 8pt 8pt; font-size: 9.5pt; }
.bd .party .line { flex: 1; } .bd .party .line span.u { display: inline-block; border-bottom: .8pt solid ${BRAND.ink}; min-width: 70%; height: 11pt; vertical-align: bottom; margin-left: 4pt; }
.bd .party .date { width: 24%; } .bd .party .date span.u { display: inline-block; border-bottom: .8pt solid ${BRAND.ink}; width: 100%; height: 11pt; }
.bd .party .done { color: ${BRAND.signedInk}; font-weight: 700; }
.bd .party .st { padding: 6pt 8pt; font-size: 9pt; font-weight: 700; }
.bd .party .st.pending { background: ${BRAND.pending}; color: ${BRAND.amber}; }
.bd .party .st.signed { background: ${BRAND.signed}; color: ${BRAND.signedInk}; }
.bd .closing { font-weight: 700; font-size: 9.5pt; margin: 4pt 0 6pt; }
.bd .foot { font-style: italic; color: ${BRAND.muted}; font-size: 8.5pt; }
`

const COVER_CSS = `
.bcov { position: relative; width: 100%; aspect-ratio: 1700 / 2200; container-type: inline-size; background-size: 100% 100%; background-repeat: no-repeat;
  font-family: Arial, 'Liberation Sans', 'Helvetica Neue', sans-serif; overflow: hidden; }
.bcov .kick { position: absolute; left: 10.6%; top: 35.7%; color: ${BRAND.teal}; font-weight: 700; font-size: 1.95cqw; letter-spacing: .02em; text-transform: uppercase; }
.bcov .title { position: absolute; left: 10.3%; width: 60%; bottom: 40.4%; color: ${BRAND.ink}; font-weight: 700; font-size: 7.5cqw; line-height: 1.12; letter-spacing: -.01em; }
.bcov .prep { position: absolute; left: 10.6%; top: 62%; color: ${BRAND.ink}; font-size: 2.75cqw; }
.bcov .tags { position: absolute; left: 10.6%; top: 75.8%; color: ${BRAND.muted}; font-weight: 700; font-size: 1.4cqw; letter-spacing: .02em; text-transform: uppercase; }
.bcov .fl { position: absolute; left: 10.6%; top: 92.6%; color: #ffffff; font-weight: 700; font-size: 1.45cqw; letter-spacing: .02em; text-transform: uppercase; }
.bcov .fr { position: absolute; left: 74.6%; top: 92.6%; color: #d8e1e5; font-size: 1.45cqw; }
.bback { position: relative; width: 100%; aspect-ratio: 1700 / 2200; container-type: inline-size; background-size: 100% 100%; background-repeat: no-repeat;
  font-family: Arial, 'Liberation Sans', 'Helvetica Neue', sans-serif; }
.bback .bt { position: absolute; left: 0; right: 0; top: 57.2%; text-align: center; color: #ffffff; font-weight: 700; font-size: 1.75cqw; letter-spacing: .02em; text-transform: uppercase; }
`

/* -------------------------------------------------------------- fragments */

/** A rate cell: banded rates written with semicolons are shown one band per line. */
export function rateCell(rate: string): string {
  return `<td class="r">${String(rate || '').split(/;\s*/).filter(Boolean).map((b) => `<span>${esc(b)}</span>`).join('')}</td>`
}

export function clause(num: string, html: string): string {
  return `<p class="cl"><span class="n">${esc(num)}</span>${html}</p>`
}
export function heading(num: string, title: string): string {
  return `<h3><span class="n">${esc(num)}</span>${esc(title)}</h3>`
}

function band(title: string, note?: string): string {
  return `<div class="band"><h2>${esc(title)}</h2></div>${note ? `<p class="bandnote">${esc(note)}</p>` : ''}`
}

function partyHtml(p: SignParty): string {
  const signedLine = p.signed
    ? `<div class="sig"><div class="line done">\u2713 Digitally signed by ${esc(p.signed.name)}${p.signed.ip ? ` &middot; IP ${esc(p.signed.ip)}` : ''}${p.signed.extra ? ` &middot; ${esc(p.signed.extra)}` : ''}</div><div class="date done">${esc(p.signed.at)}</div></div>`
    : `<div class="sig"><div class="line">Signature<span class="u"></span></div><div class="date"><span class="u"></span></div></div>`
  return `<div class="party">
  <div class="ph">${esc(p.heading)}</div>
  <div class="row"><b>${esc(p.name)}</b><b class="date">Date</b></div>
  ${signedLine}
  <div class="st ${p.signed ? 'signed' : 'pending'}">Status&nbsp; ${p.signed ? 'Signed' : esc(p.pending)}</div>
</div>`
}

/** The document body: particulars, sections, execution. Same HTML on screen and in the PDF. */
export function brandedBodyHtml(d: BrandedDoc): string {
  const rows = d.particulars.rows.map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td class="v">${esc(v)}</td></tr>`).join('')
  const sections = d.sections.map((s) => `<section class="page">${band(s.title, s.note)}${s.html}</section>`).join('')
  const x = d.execution
  return `<style>${BODY_CSS}</style>
<div class="bd">
  <section class="page first">
    ${d.warning ? `<div class="warn">${esc(d.warning)}</div>` : ''}
    ${band(d.particulars.title, d.particulars.note)}
    <table class="parts">${rows}</table>
    ${d.intro || ''}
    ${d.firstHtml || ''}
  </section>
  ${sections}
  <section class="page">
    ${band('Execution', x.note)}
    <p class="ref"><b class="k">${esc(x.refLabel)}</b><b>${esc(x.refValue)}</b></p>
    ${x.parties.map(partyHtml).join('')}
    ${x.closing ? `<p class="closing">${esc(x.closing)}</p>` : ''}
    <p class="foot">${esc(x.footnote)}</p>
  </section>
</div>`
}

export function coverHtml(d: BrandedDoc, imageUrl: string): string {
  return `<style>${COVER_CSS}</style>
<div class="bcov" style="background-image:url('${imageUrl}')">
  <div class="kick">${esc(COMPANY.replace(/\.$/, ''))}</div>
  <div class="title">${esc(d.title)}</div>
  <div class="prep">Prepared for ${esc(d.preparedFor)}</div>
  <div class="tags">${d.coverTags.map(esc).join('&nbsp; &bull; &nbsp;')}</div>
  <div class="fl">${esc(d.coverFooterLeft)}</div>
  <div class="fr">${esc(d.coverFooterRight || COMPANY_RC)}</div>
</div>`
}

export function backCoverHtml(d: BrandedDoc, imageUrl: string): string {
  return `<style>${COVER_CSS}</style>
<div class="bback" style="background-image:url('${imageUrl}')"><div class="bt">${esc(d.title)}</div></div>`
}

/** For the signing page: the cover (scaled) followed by the body. */
export function brandedWebHtml(d: BrandedDoc): string {
  return `<div style="max-width:720px;margin:0 auto 28px;box-shadow:0 1px 6px rgba(0,0,0,.18)">${coverHtml(d, '/brand/doc-cover.jpg')}</div>${brandedBodyHtml(d)}`
}

/* --------------------------------------------------------------------- PDF */

const cache: Record<string, string> = {}
function dataUri(file: string): string {
  if (cache[file]) return cache[file]
  const buf = fs.readFileSync(path.join(process.cwd(), 'public', 'brand', file))
  cache[file] = `data:image/jpeg;base64,${buf.toString('base64')}`
  return cache[file]
}

const page = (inner: string) => `<!doctype html><html><head><meta charset="utf-8"><style>
@page { size: Letter; margin: 0; } html, body { margin: 0; padding: 0; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style></head><body>${inner}</body></html>`

function headerTemplate(title: string): string {
  return `<div style="width:100%;margin:0 0.72in;font-family:Arial,'Liberation Sans',sans-serif;-webkit-print-color-adjust:exact;">
  <div style="display:flex;align-items:flex-end;gap:0.9in;border-bottom:1.5pt solid ${BRAND.teal};padding-bottom:4pt;">
    <span style="font-size:10.5pt;font-weight:700;color:${BRAND.teal};">go/live</span>
    <span style="font-size:6.5pt;font-weight:700;color:${BRAND.muted};letter-spacing:.03em;text-transform:uppercase;">${esc(title)}</span>
  </div></div>`
}
function footerTemplate(): string {
  return `<div style="width:100%;margin:0 0.72in;font-family:Arial,'Liberation Sans',sans-serif;display:flex;justify-content:space-between;align-items:center;-webkit-print-color-adjust:exact;">
  <span style="font-size:5.5pt;font-weight:700;color:${BRAND.muted};letter-spacing:.02em;">${esc(FOOTER_LINE)}</span>
  <span style="font-size:6.5pt;font-weight:700;color:${BRAND.teal};">PAGE&nbsp; <span class="pageNumber" style="color:${BRAND.ink};font-size:9pt;font-weight:400;"></span></span>
</div>`
}

/** Cover, body and back cover as one PDF. Body pages carry the running header, footer and page numbers. */
export async function renderBrandedPdf(d: BrandedDoc): Promise<Buffer> {
  const puppeteer = (await import('puppeteer')).default
  const { PDFDocument } = await import('pdf-lib')
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] })
    const tab = await browser.newPage()
    const full = async (html: string) => {
      await tab.setContent(page(`<div style="width:8.5in">${html}</div>`), { waitUntil: 'load' })
      await tab.emulateMediaType('print')
      return tab.pdf({ format: 'Letter', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, pageRanges: '1' })
    }
    const cover = await full(coverHtml(d, dataUri('doc-cover.jpg')))
    const back = await full(backCoverHtml(d, dataUri('doc-back.jpg')))

    await tab.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>* { -webkit-print-color-adjust: exact; print-color-adjust: exact; } body { margin: 0; }</style></head><body>${brandedBodyHtml(d)}</body></html>`, { waitUntil: 'load' })
    await tab.emulateMediaType('print')
    const body = await tab.pdf({
      format: 'Letter', printBackground: true, displayHeaderFooter: true,
      headerTemplate: headerTemplate(d.headerTitle || d.title), footerTemplate: footerTemplate(),
      margin: { top: '0.95in', right: '0.72in', bottom: '0.75in', left: '0.72in' },
    })

    const out = await PDFDocument.create()
    out.setTitle(`${d.title}: ${d.preparedFor}`)
    out.setAuthor(COMPANY)
    out.setCreator('GoLive Cloud Portal')
    for (const bytes of [cover, body, back]) {
      const src = await PDFDocument.load(bytes)
      const pages = await out.copyPages(src, src.getPageIndices())
      pages.forEach((p) => out.addPage(p))
    }
    return Buffer.from(await out.save())
  } finally {
    if (browser) { try { await browser.close() } catch { /* already gone */ } }
  }
}
