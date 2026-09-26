import mongoose, { Schema, Document } from 'mongoose'

/**
 * DealRegistration: a prospect registered by a GoLive partner (agreement
 * clause 4). Validity rules live in lib/dealRegistration.ts:
 *   - 90 days from the Company's approval;
 *   - extended to 60 days after each Company-confirmed milestone (a meeting
 *     the Company attended, a Company quotation or proposal, or the
 *     prospect's written confirmation to the Company);
 *   - never beyond 180 days from approval unless the MD extends it in writing.
 * The commission schedule version in force at approval is locked here and
 * governs first-year commission (clause 5.5).
 */

export const DEAL_STATUSES = ['pending', 'active', 'lapsed', 'refused', 'won', 'lost', 'released'] as const
export type DealStatus = (typeof DEAL_STATUSES)[number]
export const MILESTONE_KINDS = ['meeting', 'quotation', 'written_confirmation'] as const
export type MilestoneKind = (typeof MILESTONE_KINDS)[number]

export interface IDealRegistration extends Document {
  ref: string
  partnerApplication: mongoose.Types.ObjectId
  partnerNumber: string
  partnerName: string
  partnerEmail: string
  category: 'referral' | 'sales'
  source: 'portal' | 'application'
  sourceAccountId?: string
  organisation: string
  sector?: string
  contactName?: string
  contactRole?: string
  contactEmail?: string
  contactPhone?: string
  lineOfBusiness?: string
  requirement?: string
  estimatedValue?: number
  expectedClose?: string
  status: DealStatus
  conflict?: { kind: 'customer' | 'lead' | 'partner'; match: string; owner?: string } | null
  submittedAt: Date
  approvedAt?: Date
  approvedBy?: string
  decisionNote?: string
  /** Commission schedule version locked at approval (clause 5.5). */
  scheduleVersion?: number
  validUntil?: Date
  /** approvedAt + 180 days, or a later date the MD agreed in writing. */
  hardLimit?: Date
  milestones: { kind: MilestoneKind; at: Date; by: string; note?: string; recordedAt: Date }[]
  closedAt?: Date
  /** True when the registration was valid at close, so first-year commission applies. */
  validAtClose?: boolean
  timeline: { at: Date; by: string; action: string; note?: string }[]
  createdAt: Date
  updatedAt: Date
}

const DealRegistrationSchema = new Schema<IDealRegistration>(
  {
    ref: { type: String, required: true, unique: true },
    partnerApplication: { type: Schema.Types.ObjectId, ref: 'PartnerApplication', required: true, index: true },
    partnerNumber: { type: String, required: true, index: true },
    partnerName: String,
    partnerEmail: String,
    category: { type: String, enum: ['referral', 'sales'] },
    source: { type: String, enum: ['portal', 'application'], default: 'portal' },
    sourceAccountId: String,
    organisation: { type: String, required: true },
    sector: String,
    contactName: String,
    contactRole: String,
    contactEmail: String,
    contactPhone: String,
    lineOfBusiness: String,
    requirement: String,
    estimatedValue: Number,
    expectedClose: String,
    status: { type: String, enum: DEAL_STATUSES, default: 'pending', index: true },
    conflict: { type: Schema.Types.Mixed, default: null },
    submittedAt: { type: Date, default: Date.now },
    approvedAt: Date,
    approvedBy: String,
    decisionNote: String,
    scheduleVersion: Number,
    validUntil: Date,
    hardLimit: Date,
    milestones: [{ kind: { type: String, enum: MILESTONE_KINDS }, at: Date, by: String, note: String, recordedAt: Date, _id: false }],
    closedAt: Date,
    validAtClose: Boolean,
    timeline: [{ at: Date, by: String, action: String, note: String, _id: false }],
  },
  { timestamps: true }
)

export default (mongoose.models.DealRegistration as mongoose.Model<IDealRegistration>) ||
  mongoose.model<IDealRegistration>('DealRegistration', DealRegistrationSchema)
