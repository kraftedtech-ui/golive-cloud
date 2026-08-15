import mongoose, { Schema, Document } from 'mongoose'

/**
 * A saved proposal or invoice.
 *
 * The Proposal Generator used to render a PDF into a popup and keep nothing,
 * so a deal quoted three times left no trace of what was actually sent. This
 * stores every version.
 *
 * Versioning model
 * ----------------
 * All versions of the same deal share a `revisionGroupId`. Each save creates
 * a new version and supersedes the previous one, so history is complete and
 * immutable — nothing is ever edited in place.
 *
 *   v1  outcome: superseded
 *   v2  outcome: superseded
 *   v3  outcome: accepted     <- the one that closed
 *
 * Numbering
 * ---------
 * Proposals get a reference per version (GL-PROP-2026-000042-v3). Invoice
 * numbers are deliberately NOT allocated until a version is accepted: a tax
 * authority expects an unbroken invoice sequence, and abandoned quotes would
 * punch holes in it. The invoice number is issued once, at acceptance.
 *
 * Once accepted, a document is frozen. Changing a closed deal means a new
 * revision group or a credit note, never an edit.
 */

export type DocumentType = 'proposal' | 'invoice'

export type DocumentOutcome =
  | 'open' // current version, awaiting a decision
  | 'accepted' // customer agreed — this is the one that closed
  | 'superseded' // replaced by a later version
  | 'declined' // customer said no
  | 'expired' // validity window lapsed

export type ClearanceStatus =
  | 'not_required'
  | 'pending'
  | 'cleared'
  | 'rejected'

export interface ISalesDocumentLine {
  description: string
  skuTitle?: string
  productId?: string
  termDuration?: string
  billingPlan?: string
  quantity: number
  unitPriceNet: number
  lineNet: number
}

export interface ISalesDocument extends Document {
  // --- identity & versioning ---
  documentType: DocumentType
  revisionGroupId: string
  version: number
  reference: string // GL-PROP-2026-000042-v3
  invoiceNumber?: string // allocated only on acceptance
  outcome: DocumentOutcome

  // --- who it's for ---
  leadId?: string
  customerId?: string
  buyerName: string
  buyerContact?: string
  buyerEmail?: string
  buyerPhone?: string
  buyerCountry?: string
  buyerTIN?: string

  // --- what was quoted ---
  packageKey?: string
  packageLabel?: string
  addOnKeys: string[]
  userCount: number
  billingOption?: string
  termDuration?: string
  billingPlan?: string
  lines: ISalesDocumentLine[]

  // --- money (all in `currency`) ---
  currency: string
  fxRateToNGN?: number // frozen at issue for the audit trail
  subscriptionNet: number
  setupFee: number
  discountPercent: number
  discountAmount: number
  netTotal: number
  vatRatePercent: number
  vatTotal: number
  grossTotal: number

  /**
   * Prepayment. On a monthly-commitment (P1M) deal the customer may pay
   * several months in advance while GoLive keeps the monthly commitment
   * upstream. This is an advance for services, not a refundable deposit —
   * VAT is charged on the whole amount at issue and revenue is recognised
   * across the coverage window.
   *
   *   advanceMonths  months this document covers (1 = plain monthly)
   *   monthlyNet     one month's net charge, for revenue recognition
   *   coverageStart  first day of the period paid for
   *   coverageEnd    last day of the period paid for
   */
  advanceMonths?: number
  monthlyNet?: number
  coverageStart?: Date
  coverageEnd?: Date

  /**
   * Internal economics, snapshotted so a closed deal can be reconciled later
   * even after catalog prices move. Never rendered on the customer document.
   */
  grossProfitUSD?: number
  commissionRate?: number
  commissionNGN?: number

  // --- lifecycle ---
  issuedAt: Date
  validUntil?: Date
  issuedByEmail?: string
  issuedByName?: string
  acceptedAt?: Date
  acceptedByEmail?: string
  outcomeNote?: string

  // --- e-invoicing (dormant until the mandate reaches this turnover band) ---
  clearanceStatus: ClearanceStatus
  irn?: string
  csid?: string
  qrCode?: string
  clearedAt?: Date
  clearanceProvider?: string
  clearanceResponse?: unknown
  buyerReviewDeadline?: Date

  // --- statutory archive ---
  renderedHtml?: string
  retentionUntil: Date

  /** Append-only. Never mutate or delete entries. */
  auditTrail: {
    at: Date
    actorEmail?: string
    action: string
    detail?: string
  }[]

  createdAt: Date
  updatedAt: Date
}

const LineSchema = new Schema<ISalesDocumentLine>(
  {
    description: { type: String, required: true },
    skuTitle: String,
    productId: String,
    termDuration: String,
    billingPlan: String,
    quantity: { type: Number, required: true },
    unitPriceNet: { type: Number, required: true },
    lineNet: { type: Number, required: true },
  },
  { _id: false }
)

const SalesDocumentSchema = new Schema<ISalesDocument>(
  {
    documentType: { type: String, enum: ['proposal', 'invoice'], default: 'proposal', index: true },
    revisionGroupId: { type: String, required: true, index: true },
    version: { type: Number, required: true, default: 1 },
    reference: { type: String, required: true, unique: true },
    invoiceNumber: { type: String, unique: true, sparse: true },
    outcome: {
      type: String,
      enum: ['open', 'accepted', 'superseded', 'declined', 'expired'],
      default: 'open',
      index: true,
    },

    leadId: { type: String, index: true },
    customerId: { type: String, index: true },
    buyerName: { type: String, required: true },
    buyerContact: String,
    buyerEmail: String,
    buyerPhone: String,
    buyerCountry: String,
    buyerTIN: String,

    packageKey: String,
    packageLabel: String,
    addOnKeys: { type: [String], default: [] },
    userCount: { type: Number, default: 0 },
    billingOption: String,
    termDuration: String,
    billingPlan: String,
    lines: { type: [LineSchema], default: [] },

    currency: { type: String, required: true },
    fxRateToNGN: Number,
    subscriptionNet: { type: Number, default: 0 },
    setupFee: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    netTotal: { type: Number, required: true },
    vatRatePercent: { type: Number, default: 0 },
    vatTotal: { type: Number, default: 0 },
    grossTotal: { type: Number, required: true },

    advanceMonths: { type: Number, default: 1 },
    monthlyNet: { type: Number, default: 0 },
    coverageStart: Date,
    coverageEnd: Date,

    grossProfitUSD: Number,
    commissionRate: Number,
    commissionNGN: Number,

    issuedAt: { type: Date, default: Date.now },
    validUntil: Date,
    issuedByEmail: String,
    issuedByName: String,
    acceptedAt: Date,
    acceptedByEmail: String,
    outcomeNote: String,

    clearanceStatus: {
      type: String,
      enum: ['not_required', 'pending', 'cleared', 'rejected'],
      default: 'not_required',
    },
    irn: { type: String, sparse: true },
    csid: String,
    qrCode: String,
    clearedAt: Date,
    clearanceProvider: String,
    clearanceResponse: Schema.Types.Mixed,
    buyerReviewDeadline: Date,

    renderedHtml: String,
    retentionUntil: { type: Date, required: true },

    auditTrail: [
      {
        _id: false,
        at: { type: Date, default: Date.now },
        actorEmail: String,
        action: { type: String, required: true },
        detail: String,
      },
    ],
  },
  { timestamps: true }
)

// One accepted version per deal — enforced at the database level so a race
// between two reps can't close the same deal twice.
SalesDocumentSchema.index(
  { revisionGroupId: 1, outcome: 1 },
  { unique: true, partialFilterExpression: { outcome: 'accepted' } }
)
SalesDocumentSchema.index({ revisionGroupId: 1, version: -1 })

export const SalesDocument =
  (mongoose.models.SalesDocument as mongoose.Model<ISalesDocument>) ||
  mongoose.model<ISalesDocument>('SalesDocument', SalesDocumentSchema)

/** Next version number within a revision group. */
export async function nextVersion(revisionGroupId: string): Promise<number> {
  const last = await SalesDocument.findOne({ revisionGroupId })
    .sort({ version: -1 })
    .select('version')
    .lean()
  return last ? (last as any).version + 1 : 1
}

/**
 * Gapless sequential invoice number, allocated only when a version is
 * accepted. Reads the highest issued number rather than counting documents —
 * a count would reuse numbers after any deletion.
 */
export async function allocateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `GL-INV-${year}-`
  const last = await SalesDocument.findOne({ invoiceNumber: new RegExp('^' + prefix) })
    .sort({ invoiceNumber: -1 })
    .select('invoiceNumber')
    .lean()
  const lastSeq = last ? parseInt(String((last as any).invoiceNumber).slice(prefix.length), 10) : 0
  return prefix + String(lastSeq + 1).padStart(6, '0')
}

/** Six years from issue, per the electronic archiving requirement. */
export function retentionDateFrom(issuedAt: Date): Date {
  const d = new Date(issuedAt)
  d.setFullYear(d.getFullYear() + 6)
  return d
}
