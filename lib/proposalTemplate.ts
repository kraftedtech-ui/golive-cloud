/**
 * proposalTemplate.ts — the customer-facing proposal document.
 *
 * Rendered server-side by Puppeteer into a PDF, so this is print CSS first
 * and screen CSS never. The previous version was a screen stylesheet sent to
 * window.print(), which is why pages broke mid-table, the dark footer printed
 * blank, and every page carried the browser's URL and timestamp.
 *
 * Design intent: a document, not a printed web page. Navy ink, teal used only
 * as a structural rule, figures right-aligned in tabular columns, and nothing
 * decorative competing with the numbers.
 */

export interface ProposalLine {
  label: string
  sublabel?: string
  value: string
  muted?: boolean
  small?: boolean
  accent?: boolean
}

export interface ProposalData {
  /** The saved SalesDocument reference — never a generated placeholder. */
  reference: string
  issuedOn: string
  validUntil: string
  validityDays: number

  logoDataUri?: string

  buyer: {
    company: string
    contact?: string
    email?: string
    phone?: string
    country?: string
    industry?: string
    taxId?: string
    migratingFrom?: string
  }

  packageLabel: string
  userCount: number
  currency: string
  billingLabel: string

  /** Pricing rows, in order, already formatted for display. */
  lines: ProposalLine[]
  /** The headline row. */
  totalLabel: string
  totalValue: string
  /** Optional line beneath the total, e.g. USD equivalent. */
  totalNote?: string

  features: string[]
  azureNote?: string

  bank: {
    accountName: string
    accountNumber: string
    bankName: string
    taxId: string
  }

  /** Terms parameters, so the document states what was actually agreed. */
  terms: {
    renewalNoticeDays: number
    latePaymentDaysDue: number
    latePaymentRatePctPerMonth: number
    vatRatePct: number
    vatAuthority: string
    vatName: string
    jurisdiction: string
    courts: string
  }
}

const esc = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  )

/** Running header — Puppeteer injects this outside the page margin box. */
export function proposalHeaderTemplate(data: ProposalData): string {
  return `
    <div style="width:100%;font-family:'Liberation Sans',Arial,sans-serif;font-size:7pt;
                color:#8a99a5;padding:0 18mm;display:flex;justify-content:space-between;">
      <span>${esc(data.buyer.company)}</span>
      <span>${esc(data.reference)}</span>
    </div>`
}

/** Running footer with real page numbering. */
export function proposalFooterTemplate(): string {
  return `
    <div style="width:100%;font-family:'Liberation Sans',Arial,sans-serif;font-size:7pt;
                color:#8a99a5;padding:0 18mm;display:flex;justify-content:space-between;">
      <span>The GoLive Digital Solutions Company Ltd · RC1644767 · Microsoft CSP Partner 6787357</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>`
}

export function renderProposalHtml(d: ProposalData): string {
  const t = d.terms

  const pricingRows = d.lines
    .map(
      (l) => `
      <tr class="${l.small ? 'small' : ''}">
        <td class="label ${l.muted ? 'muted' : ''} ${l.accent ? 'accent' : ''}">
          ${esc(l.label)}${l.sublabel ? `<span class="sub">${esc(l.sublabel)}</span>` : ''}
        </td>
        <td class="figure ${l.accent ? 'accent' : ''}">${esc(l.value)}</td>
      </tr>`
    )
    .join('')

  const featureCells = d.features
    .map((f) => `<li>${esc(f)}</li>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(d.reference)}</title>
<style>
  /* ── page geometry ─────────────────────────────────────────────────────
     Margins leave room for the running header and footer Puppeteer injects.
     Without an explicit @page the browser supplies its own, along with the
     URL and timestamp that made the old output look like a printout.        */
  @page { size: A4; margin: 20mm 18mm 18mm 18mm; }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  body {
    font-family: 'Liberation Sans', Arial, Helvetica, sans-serif;
    font-size: 9.5pt;
    line-height: 1.45;
    color: #16232e;
  }

  /* Figures align only if they share a column width. Arial-metric fonts are
     tabular by default; this makes it explicit and survives a font swap.    */
  /* Liberation Sans sets the naira sign tight against the following digit.
     DejaVu carries a better-spaced glyph and matching tabular figures.      */
  .figure, .fig, td.figure, td.total-value {
    font-family: 'DejaVu Sans', 'Liberation Sans', Arial, sans-serif;
    font-variant-numeric: tabular-nums; font-feature-settings: 'tnum' 1;
  }

  /* ── letterhead ───────────────────────────────────────────────────────── */
  .letterhead {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding-bottom: 10pt; border-bottom: 2pt solid #16232e;
  }
  /* The source PNG is square (2400x2400) with transparent padding around the
     lockup. Cropping to the wordmark needs the real offsets, and guessing at
     them cut the logo in half — so it is shown whole at a controlled height.
     A tightly-trimmed export would let this sit larger in the same space.   */
  .logo-clip { height: 42pt; display: flex; align-items: center; }
  .logo-clip img { height: 42pt; width: auto; display: block; }

  .issuer { text-align: right; font-size: 7.5pt; color: #5c7184; line-height: 1.6; }
  .issuer strong { display: block; font-size: 9pt; color: #16232e; letter-spacing: 0.2pt; }

  /* ── document title band ──────────────────────────────────────────────── */
  .doc-band { display: flex; justify-content: space-between; align-items: baseline;
              margin-top: 14pt; padding-bottom: 4pt; }
  .doc-type { font-size: 15pt; font-weight: 700; letter-spacing: -0.2pt; }
  .doc-ref { font-size: 8pt; color: #5c7184; text-align: right; line-height: 1.6; }
  .doc-ref strong { color: #16232e; }

  .accent-rule { height: 2pt; background: #0096c7; width: 44pt; margin-bottom: 14pt; }

  /* ── parties ──────────────────────────────────────────────────────────── */
  .parties { display: flex; gap: 24pt; margin-bottom: 16pt; }
  .party { flex: 1; }
  .party-label { font-size: 7pt; font-weight: 700; letter-spacing: 1pt;
                 text-transform: uppercase; color: #8a99a5; margin-bottom: 4pt; }
  .party-name { font-size: 11pt; font-weight: 700; margin-bottom: 2pt; }
  .party-line { font-size: 8.5pt; color: #4a5b68; }

  /* ── section headings ─────────────────────────────────────────────────── */
  h2 {
    font-size: 8pt; font-weight: 700; letter-spacing: 0.7pt; text-transform: uppercase;
    color: #16232e; padding-bottom: 4pt; border-bottom: 0.75pt solid #16232e;
    margin: 13pt 0 7pt;
    /* A heading must never be the last thing on a page. */
    break-after: avoid; page-break-after: avoid;
  }

  /* ── pricing ──────────────────────────────────────────────────────────── */
  table.pricing { width: 100%; border-collapse: collapse; }
  table.pricing td { padding: 5.5pt 0; border-bottom: 0.5pt solid #e4e9ed; vertical-align: top; }
  table.pricing tr { break-inside: avoid; page-break-inside: avoid; }
  td.label { color: #4a5b68; }
  td.label .sub { display: block; font-size: 7.5pt; color: #8a99a5; margin-top: 1pt; }
  td.figure { text-align: right; white-space: nowrap; padding-left: 12pt; font-weight: 500; }
  tr.small td { font-size: 8pt; color: #8a99a5; padding: 3.5pt 0; }
  .muted { color: #8a99a5; }
  .accent { color: #0096c7; }

  /* The headline total and everything that qualifies it stay together —
     the old template let VAT, the total and the USD line orphan onto a
     second page away from the figures that produced them.                   */
  .totals { break-inside: avoid; page-break-inside: avoid; margin-top: 2pt; }
  table.total-row { width: 100%; border-collapse: collapse; border-top: 1.5pt solid #16232e; }
  table.total-row td { padding: 9pt 0 3pt; }
  td.total-label { font-size: 10.5pt; font-weight: 700; }
  td.total-value { text-align: right; font-size: 15pt; font-weight: 700; letter-spacing: -0.3pt; }
  .total-note { font-size: 7.5pt; color: #8a99a5; text-align: right; }

  /* ── included ─────────────────────────────────────────────────────────── */
  /* break-inside on the multicol container pushed the whole Payment section
     onto page two even with room to spare. The list items still avoid
     splitting individually, which is what actually matters.                 */
  ul.features { columns: 2; column-gap: 24pt; list-style: none; }
  ul.features li { font-size: 8.5pt; padding-left: 10pt; margin-bottom: 3.5pt;
                   position: relative; break-inside: avoid; }
  ul.features li::before { content: ''; position: absolute; left: 0; top: 4.5pt;
                           width: 3.5pt; height: 3.5pt; background: #0096c7; }

  /* ── callouts ─────────────────────────────────────────────────────────── */
  .callout { border-left: 2pt solid #0096c7; background: #f4f8fb; padding: 8pt 10pt;
             font-size: 8.5pt; margin: 10pt 0; break-inside: avoid; }

  /* ── bank ─────────────────────────────────────────────────────────────── */
  /* The bank details and the instruction that tells the customer what to
     do with them must travel together — split across a page break, page one
     ends with an account number and no context. */
  .payment-block { break-inside: avoid; page-break-inside: avoid; }
  table.bank { width: 100%; border-collapse: collapse; break-inside: avoid; }
  table.bank td { padding: 5pt 0; border-bottom: 0.5pt solid #e4e9ed; font-size: 9pt; }
  table.bank td:first-child { color: #4a5b68; width: 38%; }
  table.bank td:last-child { font-weight: 700; }

  /* ── terms ────────────────────────────────────────────────────────────── */
  ol.terms { columns: 2; column-gap: 22pt; padding-left: 11pt; font-size: 7.5pt;
             color: #4a5b68; line-height: 1.5; }
  ol.terms li { margin-bottom: 6pt; break-inside: avoid; page-break-inside: avoid; }
  ol.terms strong { color: #16232e; }

  /* ── acceptance ───────────────────────────────────────────────────────── */
  .acceptance { break-inside: avoid; page-break-inside: avoid; margin-top: 16pt;
                border: 0.75pt solid #16232e; padding: 12pt 14pt; }
  .acceptance-note { font-size: 8pt; color: #4a5b68; margin-bottom: 14pt; }
  .sig-row { display: flex; gap: 24pt; }
  .sig { flex: 1; }
  .sig-line { border-bottom: 0.75pt solid #16232e; height: 26pt; }
  .sig-label { font-size: 7pt; letter-spacing: 0.8pt; text-transform: uppercase;
               color: #8a99a5; margin-top: 4pt; }
</style>
</head>
<body>

  <div class="letterhead">
    <div class="logo-clip">
      ${d.logoDataUri ? `<img src="${d.logoDataUri}" alt="GoLive Digital Solutions">` : ''}
    </div>
    <div class="issuer">
      <strong>The GoLive Digital Solutions Company Ltd</strong>
      RC1644767 · Authorised Microsoft CSP Partner 6787357<br>
      7 Ibiyinka Olorunbe Close, Victoria Island, Lagos<br>
      contact@golivecompany.com · +234 808 358 7801
    </div>
  </div>

  <div class="doc-band">
    <div class="doc-type">Microsoft 365 Proposal</div>
    <div class="doc-ref">
      <strong>${esc(d.reference)}</strong><br>
      Issued ${esc(d.issuedOn)} · Valid until ${esc(d.validUntil)}
    </div>
  </div>
  <div class="accent-rule"></div>

  <div class="parties">
    <div class="party">
      <div class="party-label">Prepared for</div>
      <div class="party-name">${esc(d.buyer.company)}</div>
      ${d.buyer.contact ? `<div class="party-line">${esc(d.buyer.contact)}</div>` : ''}
      ${d.buyer.email ? `<div class="party-line">${esc(d.buyer.email)}</div>` : ''}
      ${d.buyer.phone ? `<div class="party-line">${esc(d.buyer.phone)}</div>` : ''}
      ${d.buyer.country ? `<div class="party-line">${esc(d.buyer.country)}${d.buyer.industry ? ' · ' + esc(d.buyer.industry) : ''}</div>` : ''}
      ${d.buyer.taxId ? `<div class="party-line">Tax ID ${esc(d.buyer.taxId)}</div>` : ''}
    </div>
    <div class="party">
      <div class="party-label">Solution</div>
      <div class="party-name">${esc(d.packageLabel)}</div>
      <div class="party-line">${esc(d.userCount)} users · billed in ${esc(d.currency)}</div>
      <div class="party-line">${esc(d.billingLabel)}</div>
      ${d.buyer.migratingFrom ? `<div class="party-line">Migrating from ${esc(d.buyer.migratingFrom)}</div>` : ''}
    </div>
  </div>

  <h2>Pricing</h2>
  <table class="pricing">${pricingRows}</table>

  <div class="totals">
    <table class="total-row">
      <tr>
        <td class="total-label">${esc(d.totalLabel)}</td>
        <td class="total-value figure">${esc(d.totalValue)}</td>
      </tr>
    </table>
    ${d.totalNote ? `<div class="total-note">${esc(d.totalNote)}</div>` : ''}
  </div>

  ${d.azureNote ? `<div class="callout"><strong>Azure:</strong> ${esc(d.azureNote)} — metered and billed directly by Microsoft on actual consumption. Not included in the totals above.</div>` : ''}

  <h2>What is included</h2>
  <ul class="features">${featureCells}</ul>

  <div class="payment-block">
  <h2>Payment</h2>
  <table class="bank">
    <tr><td>Account name</td><td>${esc(d.bank.accountName)}</td></tr>
    <tr><td>Account number</td><td class="fig">${esc(d.bank.accountNumber)}</td></tr>
    <tr><td>Bank</td><td>${esc(d.bank.bankName)}</td></tr>
    <tr><td>National Tax ID</td><td class="fig">${esc(d.bank.taxId)}</td></tr>
  </table>
  <div class="callout">
    Quote <strong>${esc(d.reference)}</strong> as the payment reference and email the remittance
    advice to contact@golivecompany.com. Provisioning begins once payment is confirmed.
  </div>

  </div>

  <h2>Terms</h2>
  <ol class="terms">
    <li><strong>Validity.</strong> This proposal is valid for ${d.validityDays} days from ${esc(d.issuedOn)}. After that date we re-check prevailing Microsoft list pricing and the exchange rate and re-quote; any difference is settled before provisioning, in either direction.</li>
    <li><strong>Payment.</strong> Payment in full is required before provisioning. Licences are not ordered from the distributor until funds are confirmed.</li>
    <li><strong>Term and commitment.</strong> On an annual commitment the seat count is fixed for twelve months: seats may be added at any time but cannot be reduced until renewal. On a monthly commitment the subscription may be cancelled with effect from the end of any billed period.</li>
    <li><strong>Renewal.</strong> Subscriptions renew automatically on the same terms. To cancel or change the seat count at renewal, written notice is required at least ${t.renewalNoticeDays} days before the renewal date.</li>
    <li><strong>Late payment.</strong> Renewal and recurring invoices fall due within ${t.latePaymentDaysDue} days of issue. Amounts outstanding after that may attract interest at ${t.latePaymentRatePctPerMonth}% per month, and continued non-payment may result in suspension of the affected subscriptions.</li>
    <li><strong>Taxes.</strong> ${t.vatName} at ${t.vatRatePct}% is charged where applicable and is collected on behalf of ${t.vatAuthority}; it is not revenue to GoLive. A customer tax identification number is required for electronic invoice clearance. Customers outside ${t.jurisdiction} are quoted according to the tax treatment of their own jurisdiction, confirmed before issue.</li>
    <li><strong>Setup and migration.</strong> The one-time fee covers the scope recorded in the Discovery Assessment for this engagement. Work outside that scope is quoted separately before it begins.</li>
    <li><strong>Microsoft terms.</strong> The customer accepts the Microsoft Customer Agreement directly with Microsoft. GoLive acts as an authorised Cloud Solution Provider reseller and not as the licensor; service availability is governed by Microsoft's own service level agreement.</li>
    <li><strong>Data protection.</strong> Personal data is processed in accordance with the Nigeria Data Protection Act 2023. As your CSP, GoLive holds administrative access to your tenant but does not access the content of mail, files or messages except where you expressly request it for a specific support purpose.</li>
    <li><strong>Governing law.</strong> This proposal and any resulting agreement are governed by the laws of ${t.jurisdiction}, and the parties submit to the exclusive jurisdiction of ${t.courts}.</li>
  </ol>

  <div class="acceptance">
    <div class="party-label">Acceptance</div>
    <div class="acceptance-note">
      By signing below, ${esc(d.buyer.company)} accepts this proposal and the terms set out above,
      and authorises GoLive to proceed on confirmation of payment.
    </div>
    <div class="sig-row">
      <div class="sig">
        <div class="sig-line"></div>
        <div class="sig-label">Signature</div>
      </div>
      <div class="sig">
        <div class="sig-line"></div>
        <div class="sig-label">Name and position</div>
      </div>
      <div class="sig">
        <div class="sig-line"></div>
        <div class="sig-label">Date</div>
      </div>
    </div>
  </div>

</body></html>`
}
