import mongoose, { Schema, Document } from 'mongoose'

/**
 * PartnerCommission: one commission line, created when GoLive records a
 * payment received on a partner's won deal (agreement clause 5).
 * Nothing is edited after creation except its payment and clawback status;
 * a correction is a clawback plus a new line.
 *
 *   accrued      payment cleared; commission due within 30 days (dueAt)
 *   paid         GoLive has paid the partner (paidAt, paymentReference)
 *   clawed_back  the client cancelled, was refunded or defaulted within 90 days
 */
export interface IPartnerCommission extends Document {
  ref: string
  deal: mongoose.Types.ObjectId
  dealRef: string
  partnerApplication: mongoose.Types.ObjectId
  partnerNumber: string
  partnerName: string
  organisation: string
  kind: 'first_year' | 'renewal'
  invoiceReference?: string
  receivedAt: Date
  /** Amount GoLive received for the line of business, excluding VAT and at-cost items. */
  amount: number
  contractValue?: number
  scheduleVersion: number
  line: string
  basis: string
  rateText: string
  band?: string
  ratePct: number
  actualMargin?: number
  usualMargin?: number
  marginLimited: boolean
  effectivePct: number
  gross: number
  whtRate: number
  wht: number
  net: number
  status: 'accrued' | 'paid' | 'clawed_back'
  dueAt: Date
  clawbackUntil: Date
  paidAt?: Date
  paymentReference?: string
  clawbackReason?: string
  clawedBackAt?: Date
  recordedBy: string
  source: 'manual' | 'automatic'
  note?: string
  createdAt: Date
  updatedAt: Date
}

const PartnerCommissionSchema = new Schema<IPartnerCommission>(
  {
    ref: { type: String, required: true, unique: true },
    deal: { type: Schema.Types.ObjectId, ref: 'DealRegistration', required: true, index: true },
    dealRef: String,
    partnerApplication: { type: Schema.Types.ObjectId, ref: 'PartnerApplication', required: true, index: true },
    partnerNumber: { type: String, index: true },
    partnerName: String,
    organisation: String,
    kind: { type: String, enum: ['first_year', 'renewal'], required: true },
    invoiceReference: String,
    receivedAt: { type: Date, required: true },
    amount: { type: Number, required: true },
    contractValue: Number,
    scheduleVersion: Number,
    line: String,
    basis: String,
    rateText: String,
    band: String,
    ratePct: Number,
    actualMargin: Number,
    usualMargin: Number,
    marginLimited: Boolean,
    effectivePct: Number,
    gross: Number,
    whtRate: Number,
    wht: Number,
    net: Number,
    status: { type: String, enum: ['accrued', 'paid', 'clawed_back'], default: 'accrued', index: true },
    dueAt: Date,
    clawbackUntil: Date,
    paidAt: Date,
    paymentReference: String,
    clawbackReason: String,
    clawedBackAt: Date,
    recordedBy: String,
    source: { type: String, enum: ['manual', 'automatic'], default: 'manual' },
    note: String,
  },
  { timestamps: true }
)

export default (mongoose.models.PartnerCommission as mongoose.Model<IPartnerCommission>) ||
  mongoose.model<IPartnerCommission>('PartnerCommission', PartnerCommissionSchema)
