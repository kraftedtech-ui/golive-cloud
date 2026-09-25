import mongoose, { Schema, Document } from 'mongoose'

/**
 * CommissionSettings: the single set of inputs from which the automatic lines
 * of the partner commission schedule are derived (lib/commissionRules.ts).
 * Changing any of these produces a new draft for the MD to review; nothing is
 * published automatically.
 */
export type OdooLevel = 'none' | 'ready' | 'silver' | 'gold'

export interface ICommissionSettings extends Document {
  key: 'partner'
  /** Share of GoLive's margin paid to a Sales Partner on a first-year sale (0.25 = 25%). */
  salesShare: number
  /** Share of GoLive's margin paid to a Referral Partner on a first-year sale. */
  referralShare: number
  /** Renewal rate as a fraction of the first-year rate (0.5 = half). */
  renewalFactor: number
  odooLevel: OdooLevel
  updatedBy?: string
  createdAt: Date
  updatedAt: Date
}

const CommissionSettingsSchema = new Schema<ICommissionSettings>(
  {
    key: { type: String, default: 'partner', unique: true },
    salesShare: { type: Number, default: 0.25 },
    referralShare: { type: Number, default: 0.125 },
    renewalFactor: { type: Number, default: 0.5 },
    odooLevel: { type: String, enum: ['none', 'ready', 'silver', 'gold'], default: 'none' },
    updatedBy: String,
  },
  { timestamps: true }
)

export default (mongoose.models.CommissionSettings as mongoose.Model<ICommissionSettings>) ||
  mongoose.model<ICommissionSettings>('CommissionSettings', CommissionSettingsSchema)
