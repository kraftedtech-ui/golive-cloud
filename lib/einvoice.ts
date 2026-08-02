import type { ISalesDocument } from '@/models/SalesDocument'

/**
 * Pluggable e-invoicing transport.
 *
 * Nigeria's Merchant-Buyer Solution is a *pre-clearance* system: a structured
 * invoice (JSON or XML, Peppol BIS 3.0 aligned, ECDSA-signed) is submitted for
 * validation, and only once the revenue service returns an Invoice Reference
 * Number, cryptographic stamp and QR code may it be sent to the buyer.
 *
 * Transmission is either direct against FIRSMBS with a digital certificate, or
 * through an accredited Access Point Provider. That choice determines the wire
 * format and auth, so it lives behind this interface — swapping provider
 * should be one new file, not a refactor.
 *
 * To add a provider:
 *   1. implement EInvoiceProvider below
 *   2. register it in getProvider()
 *   3. set EINVOICE_PROVIDER in the environment
 *
 * Nothing here transmits anything until that is done. The default provider
 * fails loudly rather than pretending an invoice was cleared — a silent no-op
 * would mean shipping uncleared invoices, which costs the buyer their input
 * VAT credit.
 */

/** Supplier identity, fixed for every document we issue. */
export const SUPPLIER = {
  name: 'The GoLive Digital Solutions Company Ltd',
  tin: '2522598389709',
  rc: 'RC1644767',
  address: '7 Ibiyinka Olorunbe Close, Victoria Island, Lagos 106104, Nigeria',
} as const

export interface ClearanceResult {
  irn: string
  csid: string
  qrCode?: string
  clearedAt: Date
  raw?: unknown
}

export interface EInvoiceProvider {
  readonly name: string
  /** Submit for clearance. Throws on rejection with a readable reason. */
  submit(doc: ISalesDocument): Promise<ClearanceResult>
  /** Poll status, for providers that clear asynchronously. */
  status?(irn: string): Promise<{ status: string; raw?: unknown }>
  /** Void or credit an already-cleared invoice. */
  cancel?(irn: string, reason: string): Promise<{ ok: boolean; raw?: unknown }>
}

export class EInvoiceNotConfiguredError extends Error {
  constructor() {
    super(
      'E-invoicing is not configured. Set EINVOICE_PROVIDER and register a provider ' +
        'in lib/einvoice.ts before submitting documents for clearance.'
    )
    this.name = 'EInvoiceNotConfiguredError'
  }
}

export class EInvoiceValidationError extends Error {
  issues: string[]
  constructor(issues: string[]) {
    super('Document is not ready for clearance: ' + issues.join('; '))
    this.name = 'EInvoiceValidationError'
    this.issues = issues
  }
}

const notConfigured: EInvoiceProvider = {
  name: 'not-configured',
  async submit() {
    throw new EInvoiceNotConfiguredError()
  },
}

export function getProvider(): EInvoiceProvider {
  switch (process.env.EINVOICE_PROVIDER) {
    // case 'firs-direct': return firsDirectProvider
    // case 'app-<vendor>': return vendorProvider
    default:
      return notConfigured
  }
}

export function isEInvoicingEnabled(): boolean {
  return getProvider().name !== 'not-configured'
}

/**
 * Everything that must hold before a document can be submitted for clearance.
 * Checked locally first so a rep gets a useful message rather than an opaque
 * rejection from the platform.
 *
 * Note VAT is held at document level, not per line — a single rate applies to
 * the whole document in the current model.
 */
export function validateForClearance(doc: ISalesDocument): string[] {
  const issues: string[] = []

  // Only an accepted document is an invoice. Proposals are not submitted, and
  // an invoice number is not allocated until acceptance.
  if (doc.outcome !== 'accepted') {
    issues.push('only an accepted document can be cleared as an invoice')
  }
  if (!doc.invoiceNumber) issues.push('no invoice number allocated')

  if (!SUPPLIER.tin) issues.push('missing supplier TIN')
  if (!doc.buyerName) issues.push('missing buyer name')
  if (!doc.buyerTIN) issues.push('missing buyer TIN (required for B2B clearance)')
  if (!doc.currency) issues.push('missing currency')
  if (!doc.lines?.length) issues.push('document has no line items')

  for (const [i, l] of (doc.lines || []).entries()) {
    if (!l.description) issues.push(`line ${i + 1}: missing description`)
    if (!(l.quantity > 0)) issues.push(`line ${i + 1}: quantity must be greater than zero`)
    if (l.unitPriceNet < 0) issues.push(`line ${i + 1}: negative unit price`)
  }

  // Totals must reconcile, or the platform rejects on arithmetic anyway.
  const lineNetSum = (doc.lines || []).reduce((s, l) => s + l.lineNet, 0)
  const expectedNet = lineNetSum + (doc.setupFee || 0) - (doc.discountAmount || 0)
  if (Math.abs(expectedNet - doc.netTotal) > 0.5) {
    issues.push('net total does not reconcile with line items plus setup fee less discount')
  }
  const expectedVat = doc.netTotal * ((doc.vatRatePercent || 0) / 100)
  if (Math.abs(expectedVat - (doc.vatTotal || 0)) > 0.5) {
    issues.push('VAT total does not match the stated rate applied to the net total')
  }
  if (Math.abs(doc.netTotal + (doc.vatTotal || 0) - doc.grossTotal) > 0.5) {
    issues.push('gross total does not equal net plus VAT')
  }

  if (doc.clearanceStatus === 'cleared') {
    issues.push('this invoice has already been cleared')
  }
  if (doc.clearanceStatus === 'pending') {
    issues.push('clearance is already in progress for this invoice')
  }

  return issues
}

/** Buyers get 72 hours from issue to accept or reject, after which it is final. */
export function buyerReviewDeadlineFrom(issuedAt: Date): Date {
  return new Date(new Date(issuedAt).getTime() + 72 * 60 * 60 * 1000)
}

export function isWithinBuyerReviewWindow(doc: ISalesDocument): boolean {
  if (!doc.buyerReviewDeadline) return false
  return Date.now() < new Date(doc.buyerReviewDeadline).getTime()
}
