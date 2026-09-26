import mongoose, { Schema, Document } from 'mongoose'

/**
 * WhmcsInvoiceEvent: one "invoice paid" notice from GoLive Naija's billing
 * (WHMCS). The invoice id is unique, so a notice sent twice is recorded once.
 */
export interface IWhmcsInvoiceEvent extends Document {
  invoiceId: number
  invoiceNum?: string
  clientId: number
  companyName?: string
  currency?: string
  datePaid?: Date
  total?: number
  status: 'recorded' | 'skipped' | 'error'
  reason?: string
  commissionRefs: string[]
  deal?: mongoose.Types.ObjectId
  payload: object
  createdAt: Date
}

const WhmcsInvoiceEventSchema = new Schema<IWhmcsInvoiceEvent>(
  {
    invoiceId: { type: Number, required: true, unique: true },
    invoiceNum: String,
    clientId: { type: Number, index: true },
    companyName: String,
    currency: String,
    datePaid: Date,
    total: Number,
    status: { type: String, enum: ['recorded', 'skipped', 'error'], required: true },
    reason: String,
    commissionRefs: [String],
    deal: { type: Schema.Types.ObjectId, ref: 'DealRegistration' },
    payload: Schema.Types.Mixed,
  },
  { timestamps: true }
)

export default (mongoose.models.WhmcsInvoiceEvent as mongoose.Model<IWhmcsInvoiceEvent>) ||
  mongoose.model<IWhmcsInvoiceEvent>('WhmcsInvoiceEvent', WhmcsInvoiceEventSchema)
