import mongoose, { Schema, Document } from 'mongoose'

/**
 * CommissionSchedule: one version of the GoLive Partner Network commission
 * schedule. Versions are never edited once published; a change is always a new
 * version, so every partner can see exactly what applied when.
 *
 * At most one draft exists at a time. Publishing it stamps the version number,
 * the effective time and the list of changes against the previous version.
 */

export interface IScheduleRow { line: string; basis: string; referral: string; sales: string }
export interface IScheduleChange {
  kind: 'added' | 'removed' | 'changed'
  line: string
  basis: string
  field?: 'referral' | 'sales' | 'basis'
  from?: string
  to?: string
}

export interface ICommissionSchedule extends Document {
  status: 'draft' | 'published'
  version?: number
  rows: IScheduleRow[]
  /** Why the rates are changing. Shown to partners. */
  summary?: string
  changes: IScheduleChange[]
  effectiveAt?: Date
  publishedBy?: string
  notified?: { sent: number; failed: number }
  createdAt: Date
  updatedAt: Date
}

const CommissionScheduleSchema = new Schema<ICommissionSchedule>(
  {
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    version: { type: Number, sparse: true, unique: true },
    rows: [{ line: String, basis: String, referral: String, sales: String, _id: false }],
    summary: String,
    changes: [{ kind: String, line: String, basis: String, field: String, from: String, to: String, _id: false }],
    effectiveAt: Date,
    publishedBy: String,
    notified: { sent: Number, failed: Number },
  },
  { timestamps: true }
)

export default (mongoose.models.CommissionSchedule as mongoose.Model<ICommissionSchedule>) ||
  mongoose.model<ICommissionSchedule>('CommissionSchedule', CommissionScheduleSchema)
