import type { ISalesDocument } from '@/models/SalesDocument'

/**
 * Pluggable e-invoicing transport.
 *
 * Nigeria's FIRS Merchant-Buyer Solution is a *pre-clearance* system: a
 * structured invoice (JSON or XML, Peppol BIS 3.0 aligned, digitally signed)
 * is submitted for validation, and only once FIRS returns an Invoice Reference
 * Number, cryptographic stamp and QR code may it be sent to the buyer.
 *
 * Transmission happens either directly against FIRSMBS with a digital
 * certificate, or through a NITDA-accredited Access Point Provider. That
 * choice determines the wire format and auth, so it lives behind this
 * interface — swapping provider should be one new file, not a refactor.
 *
 * To add a provider:
 *   1. implement EInvoiceProvider below
 *   2. register it in getProvider()
 *   3. set EINVOICE_PROVIDER in the environment
 *
 * Nothing here transmits anything until that is done. The default provider
 * fails loudly rather than pretending an invoice was cleared — a silent no-op
 * would mean shipping uncleared invoices to customers, which costs them their
 * input VAT credit.
 */

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
  submit(invoice: ISalesDocument): Promise<ClearanceResult>
  /** Poll status, for providers that clear asynchronously. */
  status?(irn: string): Promise<{ status: string; raw?: unknown }>
  /** Void or credit an already-cleared invoice. */
  cancel?(irn: string, reason: string): Promise<{ ok: boolean; raw?: unknown }>
}

export class EInvoiceNotConfiguredError extends Error {
  constructor() {
    super(
      'E-invoicing is not configured. Set EINVOICE_PROVIDER and register a provider ' +
        'in lib/einvoice.ts before submitting invoices for clearance.'
    )
    this.name = 'EInvoiceNotConfiguredError'
  }
}

export class EInvoiceValidationError extends Error {
  issues: string[]
  constructor(issues: string[]) {
    super('Invoice is not ready for clearance: ' + issues.join('; '))
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
 * Everything that must be present before an invoice can be submitted.
 * Checked locally first so a rep gets a useful message instead of an opaque
 * rejection from the clearance platform.
 */
export function validateForClearance(invoice: ISalesDocument): string[] {
  const issues: string[] = []

  if (!invoice.invoiceNumber) issues.push('missing invoice number')
  if (!invoice.supplierTIN) issues.push('missing supplier TIN')
  if (!invoice.buyerName) issues.push('missing buyer name')
  if (!invoice.buyerTIN) issues.push('missing buyer TIN (required for B2B clearance)')
  if (!invoice.currency) issues.push('missing currency')
  if (!invoice.lines?.length) issues.push('invoice has no line items')

  for (const [i, l] of (invoice.lines || []).entries()) {
    if (!l.description) issues.push(`line ${i + 1}: missing description`)
    if (!(l.quantity > 0)) issues.push(`line ${i + 1}: quantity must be greater than zero`)
    if (l.unitPriceNet < 0) issues.push(`line ${i + 1}: negative unit price`)
  }

  // Totals must reconcile, or the platform will reject on arithmetic anyway.
  const lineNetSum = (invoice.lines || []).reduce((s, l) => s + l.lineNet, 0)
  const expectedNet = lineNetSum - (invoice.discountAmount || 0)
  if (Math.abs(expectedNet - invoice.netTotal) > 0.01) {
    issues.push('net total does not reconcile with line items less discount')
  }
  const expectedVat = invoice.netTotal * ((invoice.vatRatePercent || 0) / 100)
  if (Math.abs(expectedVat - (invoice.vatTotal || 0)) > 0.01) {
    issues.push('VAT total does not match the stated rate applied to the net total')
  }
  if (Math.abs(invoice.netTotal + (invoice.vatTotal || 0) - invoice.grossTotal) > 0.01) {
    issues.push('gross total does not equal net plus VAT')
  }

  if (invoice.status !== 'draft' && invoice.status !== 'rejected') {
    issues.push(`invoice status is "${invoice.status}" — only draft or rejected can be submitted`)
  }

  return issues
}

/** Buyers get 72 hours from issue to accept or reject, after which it is final. */
export function buyerReviewDeadlineFrom(issueDate: Date): Date {
  return new Date(new Date(issueDate).getTime() + 72 * 60 * 60 * 1000)
}

export function isWithinBuyerReviewWindow(invoice: ISalesDocument): boolean {
  if (!invoice.buyerReviewDeadline) return false
  return Date.now() < new Date(invoice.buyerReviewDeadline).getTime()
}
