import mongoose, { Schema, Document } from 'mongoose'

export interface IDeploymentChecklist extends Document {
  customerId?: string
  leadId?: string
  leadRef?: string
  company: string
  discoveryAssessmentId?: string

  migrationType: 'existing_m365' | 'other_platform' | 'net_new'
  sourcePlatform?: string
  existingTenantId?: string
  dnsAccessType?: 'credentials_provided' | 'customer_will_make_changes' | 'not_yet_confirmed'
  dnsContactName?: string
  dnsContactEmail?: string

  userCount: number
  userInventoryReceived: boolean
  dataScope: string[]
  cutoverTolerance?: 'zero_downtime' | 'maintenance_window' | 'flexible'
  mfaApproach?: 'enforced_day_one' | 'grace_period'

  scopeOfWork: string[]
  completedTaskKeys: string[]
  setupFeeLines: { key: string; label: string; unit: string; amountUSD: number; quantity: number; lineTotalUSD: number }[]
  setupFeeTotalUSD: number
  setupFeeOverrideUSD?: number

  brdRecommended: boolean
  brdReasons: string[]
  brdStatus: 'not_needed' | 'recommended' | 'requested' | 'in_progress' | 'completed'

  goLiveDate?: Date
  hypercareEndDate?: Date
  assignedEngineerName?: string
  assignedEngineerEmail?: string

  status: 'planning' | 'in_progress' | 'live' | 'closed'
  notes?: string

  createdByName?: string
  createdByEmail?: string

  createdAt: Date
  updatedAt: Date
}

const DeploymentChecklistSchema = new Schema<IDeploymentChecklist>(
  {
    customerId: String,
    leadId: { type: String, index: true },
    leadRef: String,
    company: { type: String, required: true },
    discoveryAssessmentId: String,

    migrationType: { type: String, enum: ['existing_m365', 'other_platform', 'net_new'], required: true },
    sourcePlatform: String,
    existingTenantId: String,
    dnsAccessType: { type: String, enum: ['credentials_provided', 'customer_will_make_changes', 'not_yet_confirmed'] },
    dnsContactName: String,
    dnsContactEmail: String,

    userCount: { type: Number, default: 1 },
    userInventoryReceived: { type: Boolean, default: false },
    dataScope: [{ type: String }],
    cutoverTolerance: { type: String, enum: ['zero_downtime', 'maintenance_window', 'flexible'] },
    mfaApproach: { type: String, enum: ['enforced_day_one', 'grace_period'] },

    scopeOfWork: [{ type: String }],
    completedTaskKeys: [{ type: String }],
    setupFeeLines: [{ key: String, label: String, unit: String, amountUSD: Number, quantity: Number, lineTotalUSD: Number }],
    setupFeeTotalUSD: { type: Number, default: 0 },
    setupFeeOverrideUSD: Number,

    brdRecommended: { type: Boolean, default: false },
    brdReasons: [{ type: String }],
    brdStatus: { type: String, enum: ['not_needed', 'recommended', 'requested', 'in_progress', 'completed'], default: 'not_needed' },

    goLiveDate: Date,
    hypercareEndDate: Date,
    assignedEngineerName: String,
    assignedEngineerEmail: String,

    status: { type: String, enum: ['planning', 'in_progress', 'live', 'closed'], default: 'planning' },
    notes: String,

    createdByName: String,
    createdByEmail: String,
  },
  { timestamps: true }
)

export const DeploymentChecklist =
  mongoose.models.DeploymentChecklist ||
  mongoose.model<IDeploymentChecklist>('DeploymentChecklist', DeploymentChecklistSchema)
