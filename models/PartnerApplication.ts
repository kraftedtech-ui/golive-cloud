import mongoose, { Schema, Document } from 'mongoose'

/**
 * PartnerApplication: the first record in the GoLive Partner Network pipeline.
 *
 * Captured from the public form at /partners/apply and carried through every
 * accreditation stage. The ref (GL-PTR-APP-YYYY-NNNN) identifies the
 * application; the partner number (GL-PTR-NNN) is minted later, at the Managing
 * Director's countersignature of the partner agreement, and never before.
 *
 * Named accounts are captured here, checked for conflicts on arrival, and
 * decided (registered or refused) by the MD. They become deal registrations
 * in a later stage without re-keying anything.
 */

export const PARTNER_STAGES = [
  'applied', 'screening', 'interview', 'training', 'assessment', 'agreement', 'active', 'declined', 'withdrawn',
] as const
export type PartnerStage = (typeof PARTNER_STAGES)[number]

export interface INamedAccount {
  organisation: string
  sector?: string
  contactName?: string
  contactRole?: string
  requirement?: string
  timing?: string
  /** Set on submission by matching against customers and the sales pipeline. */
  conflict?: { kind: 'customer' | 'lead' | 'partner'; match: string; owner?: string } | null
  decision?: 'pending' | 'registered' | 'refused'
  decisionNote?: string
  decidedAt?: Date
  decidedBy?: string
}

export interface ITimelineEntry {
  at: Date
  by: string
  action: string
  note?: string
}

export interface IAssessmentAttempt {
  kind: 'integrity' | 'final'
  number: number
  /** The exact paper issued (lib/assessmentPaper Paper): question ids, option order, deadline. */
  paper: { version: string; items: { id: string; order?: number[] }[]; issuedAt: string; deadline: string }
  startedAt: Date
  submittedAt?: Date
  /** True when closed without a submission (deadline passed). */
  abandoned?: boolean
  got?: number
  max?: number
  pct?: number
  passed?: boolean
  late?: boolean
  integrity?: { tabSwitches: number; focusLoss: number; pasteTries: number; copyTries: number; seconds: number }
  transcript?: object[]
}

export interface IPartnerApplication extends Document {
  ref: string
  status: PartnerStage
  category: 'referral' | 'sales'
  applicant: {
    name: string
    preferredName?: string
    email: string
    phone: string
    linkedin?: string
    city?: string
    state?: string
    applyingAs: 'individual' | 'business'
    businessName?: string
    cacNumber?: string
    tin?: string
  }
  background: {
    occupation?: string
    yearsB2B?: string
    sectors?: string
    productsSold?: string
    largestDeal?: string
    referees: { name: string; position?: string; phone?: string }[]
  }
  namedAccounts: INamedAccount[]
  solutions: string[]
  engagement: {
    jointMeetings: 'none' | 'corporate' | 'technical' | 'both'
    hoursPerWeek?: string
    firstIntroduction?: string
    firstSale?: string
    supportNeeded?: string
  }
  declarations: {
    otherAppointments: boolean
    competingAppointments: boolean
    politicallyExposed: boolean
    dishonestyRecord: boolean
    restricted: boolean
    particulars?: string
  }
  acknowledgements: {
    accurate: boolean
    noContract: boolean
    noAuthority: boolean
    accreditation: boolean
    dataConsent: boolean
  }
  signature: { name: string; signedAt: Date; ip?: string; userAgent?: string }
  emailVerifiedAt?: Date
  training?: {
    invitedAt?: Date
    lastInviteAt?: Date
    modules: { no: number; completedAt: Date; ip?: string }[]
  }
  attempts: IAssessmentAttempt[]
  /** Final assessment attempts granted by the MD beyond the standard two. */
  extraFinalAttempts?: number
  /** Set when the MD grants an attempt, so it can be taken without the seven-day wait. */
  finalWaitWaivedAt?: Date
  assessmentPassedAt?: Date
  agreement?: {
    version: string
    /** Test agreements are not binding and mint test numbers; see lib/partnerAgreement. */
    test?: boolean
    sentAt: Date
    schedule: { line: string; basis: string; referral: string; sales: string }[]
    partnerSignedAt?: Date
    partnerSignedName?: string
    partnerIp?: string
    partnerUserAgent?: string
    mdSignedAt?: Date
    mdSignedName?: string
  }
  certificate?: {
    number: string
    title: string
    issuedAt: Date
    expiresAt: Date
    test?: boolean
    revokedAt?: Date
    revokedBy?: string
    revokeReason?: string
  }
  /** GL-PTR-NNN, minted at countersignature of the partner agreement. */
  partnerNumber?: string
  notes?: string
  timeline: ITimelineEntry[]
  createdAt: Date
  updatedAt: Date
}

const NamedAccountSchema = new Schema<INamedAccount>(
  {
    organisation: { type: String, required: true },
    sector: String,
    contactName: String,
    contactRole: String,
    requirement: String,
    timing: String,
    conflict: { type: Schema.Types.Mixed, default: null },
    decision: { type: String, enum: ['pending', 'registered', 'refused'], default: 'pending' },
    decisionNote: String,
    decidedAt: Date,
    decidedBy: String,
  },
  { _id: true }
)

const PartnerApplicationSchema = new Schema<IPartnerApplication>(
  {
    ref: { type: String, required: true, unique: true },
    status: { type: String, enum: PARTNER_STAGES, default: 'applied', index: true },
    category: { type: String, enum: ['referral', 'sales'], required: true },
    applicant: {
      name: { type: String, required: true },
      preferredName: String,
      email: { type: String, required: true, lowercase: true, index: true },
      phone: { type: String, required: true },
      linkedin: String,
      city: String,
      state: String,
      applyingAs: { type: String, enum: ['individual', 'business'], default: 'individual' },
      businessName: String,
      cacNumber: String,
      tin: String,
    },
    background: {
      occupation: String,
      yearsB2B: String,
      sectors: String,
      productsSold: String,
      largestDeal: String,
      referees: [{ name: String, position: String, phone: String, _id: false }],
    },
    namedAccounts: [NamedAccountSchema],
    solutions: [String],
    engagement: {
      jointMeetings: { type: String, enum: ['none', 'corporate', 'technical', 'both'], default: 'none' },
      hoursPerWeek: String,
      firstIntroduction: String,
      firstSale: String,
      supportNeeded: String,
    },
    declarations: {
      otherAppointments: Boolean,
      competingAppointments: Boolean,
      politicallyExposed: Boolean,
      dishonestyRecord: Boolean,
      restricted: Boolean,
      particulars: String,
    },
    acknowledgements: {
      accurate: Boolean,
      noContract: Boolean,
      noAuthority: Boolean,
      accreditation: Boolean,
      dataConsent: Boolean,
    },
    signature: { name: String, signedAt: Date, ip: String, userAgent: String },
    emailVerifiedAt: Date,
    training: {
      invitedAt: Date,
      lastInviteAt: Date,
      modules: [{ no: Number, completedAt: Date, ip: String, _id: false }],
    },
    attempts: [{
      kind: { type: String, enum: ['integrity', 'final'] },
      number: Number,
      paper: Schema.Types.Mixed,
      startedAt: Date,
      submittedAt: Date,
      abandoned: Boolean,
      got: Number,
      max: Number,
      pct: Number,
      passed: Boolean,
      late: Boolean,
      integrity: { tabSwitches: Number, focusLoss: Number, pasteTries: Number, copyTries: Number, seconds: Number },
      transcript: [Schema.Types.Mixed],
      _id: false,
    }],
    extraFinalAttempts: { type: Number, default: 0 },
    finalWaitWaivedAt: Date,
    assessmentPassedAt: Date,
    agreement: {
      version: String,
      test: Boolean,
      sentAt: Date,
      schedule: [{ line: String, basis: String, referral: String, sales: String, _id: false }],
      partnerSignedAt: Date,
      partnerSignedName: String,
      partnerIp: String,
      partnerUserAgent: String,
      mdSignedAt: Date,
      mdSignedName: String,
    },
    certificate: {
      number: { type: String, index: true },
      title: String,
      issuedAt: Date,
      expiresAt: Date,
      test: Boolean,
      revokedAt: Date,
      revokedBy: String,
      revokeReason: String,
    },
    partnerNumber: { type: String, sparse: true, unique: true },
    notes: String,
    timeline: [{ at: Date, by: String, action: String, note: String, _id: false }],
  },
  { timestamps: true }
)

export default (mongoose.models.PartnerApplication as mongoose.Model<IPartnerApplication>) ||
  mongoose.model<IPartnerApplication>('PartnerApplication', PartnerApplicationSchema)
