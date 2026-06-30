import mongoose, { Schema, Document } from 'mongoose'

export interface IDiscoveryAssessment extends Document {
  leadId: string
  leadRef: string
  company: string
  completedByName?: string
  completedByEmail?: string

  // Branch point: changes which follow-up section applies
  isExistingM365Customer: boolean

  // Existing M365 customer branch
  currentPlan?: string
  currentLicenseCount?: number
  currentCSPManager?: 'self_managed' | 'another_csp' | 'microsoft_direct' | 'not_sure'
  contractRenewalDate?: Date
  switchReasons?: string[]

  // Net-new / not-on-M365-yet branch
  currentEmailProvider?: string
  currentProviderChallenges?: string

  // Always asked
  employeeCount: string
  deviceTypes: string[]
  remoteHybridWork: boolean
  itSupportModel: 'in_house' | 'outsourced' | 'none' | 'other'
  handlesSensitiveData: boolean
  sensitiveDataTypes?: string[] // only relevant if handlesSensitiveData

  painPoints: string[] // keys from DISCOVERY_PAIN_POINTS
  otherPainPointNotes?: string

  budgetRange?: string
  decisionTimeline?: string
  additionalNotes?: string

  // Computed recommendation (re-derivable, but stored so a rep can see what
  // was recommended at the time even if the catalog changes later)
  recommendedPackageKey?: string
  recommendedAddOnKeys?: string[]
  needsOfflineConsult: boolean
  consultReasons?: string[]

  status: 'draft' | 'completed'
  createdAt: Date
  updatedAt: Date
}

const DiscoveryAssessmentSchema = new Schema<IDiscoveryAssessment>(
  {
    leadId: { type: String, required: true, index: true },
    leadRef: { type: String, required: true },
    company: { type: String, required: true },
    completedByName: String,
    completedByEmail: String,

    isExistingM365Customer: { type: Boolean, required: true },

    currentPlan: String,
    currentLicenseCount: Number,
    currentCSPManager: { type: String, enum: ['self_managed', 'another_csp', 'microsoft_direct', 'not_sure'] },
    contractRenewalDate: Date,
    switchReasons: [{ type: String }],

    currentEmailProvider: String,
    currentProviderChallenges: String,

    employeeCount: { type: String, required: true },
    deviceTypes: [{ type: String }],
    remoteHybridWork: { type: Boolean, default: false },
    itSupportModel: { type: String, enum: ['in_house', 'outsourced', 'none', 'other'], default: 'none' },
    handlesSensitiveData: { type: Boolean, default: false },
    sensitiveDataTypes: [{ type: String }],

    painPoints: [{ type: String }],
    otherPainPointNotes: String,

    budgetRange: String,
    decisionTimeline: String,
    additionalNotes: String,

    recommendedPackageKey: String,
    recommendedAddOnKeys: [{ type: String }],
    needsOfflineConsult: { type: Boolean, default: false },
    consultReasons: [{ type: String }],

    status: { type: String, enum: ['draft', 'completed'], default: 'completed' },
  },
  { timestamps: true }
)

export const DiscoveryAssessment =
  mongoose.models.DiscoveryAssessment ||
  mongoose.model<IDiscoveryAssessment>('DiscoveryAssessment', DiscoveryAssessmentSchema)
