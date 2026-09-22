import mongoose, { Schema, Document } from 'mongoose'

export interface IApplication extends Document {
  ref: string
  name: string
  email: string
  role: string
  status: 'applied' | 'assessed' | 'shortlisted' | 'interviewed' | 'offered' | 'onboarded' | 'rejected' | 'not_progressed' | 'lapsed'
  /** Careers-page applications (September 2026 onwards). */
  phone?: string
  note?: string
  cvFilename?: string
  positionSlug?: string
  source?: 'careers' | 'assessment'
  /** Personal, single-use assessment access code and its window. */
  accessCode?: string
  codeSentAt?: Date
  codeExpiresAt?: Date
  reminderSentAt?: Date
  /** Set by server-side marking: at or above the position's pass mark. */
  eligible?: boolean
  passMark?: number
  /** Below the pass mark: the automatic decline is sent after this time. */
  declineDueAt?: Date
  declinedAt?: Date
  assessmentScore?: string
  assessmentPct?: number
  assessmentDate?: Date
  /** The exact paper this candidate was issued (server-side marking). Absent
   *  on applications assessed before September 2026, whose scores came from
   *  the old browser-marked assessment and are kept as they were. */
  paper?: {
    version: string
    items: { id: string; order?: number[] }[]
    issuedAt: string
    deadline: string
  }
  /** Bank version the score was marked against, e.g. 'ops-v1'. */
  assessmentVersion?: string
  /** Submitted after the deadline plus upload grace. */
  assessmentLate?: boolean
  assessmentFilename?: string
  tabSwitches?: number
  pasteTries?: number
  violations?: string[]
  transcript?: object[]
  notes?: string
  shortlistEmailSentAt?: Date
  rejectionEmailSentAt?: Date
  offer?: {
    jobCode?: string
    salary?: number
    startDate?: string
    deadline?: Date
    sentAt?: Date
    candidateSignedAt?: Date
    candidateSignedName?: string
    candidateIp?: string
    mdSignedAt?: Date
    mdSignedName?: string
  }
  employeeNumber?: string
  onboarding?: {
    docs?: { filename: string; label?: string; uploadedAt?: Date; acknowledgedAt?: Date }[]
    sentAt?: Date
    acknowledgedAt?: Date
    acknowledgedName?: string
    ip?: string
    bciConsentAt?: Date
    signatureName?: string
    mdAckName?: string
    mdAckAt?: Date
  }
  screening?: {
    provider?: string
    status?: 'pending' | 'in_progress' | 'cleared' | 'failed'
    initiatedAt?: Date
    clearedAt?: Date
    notes?: string
    /** The candidate-facing BCI portal link, and when it was emailed to them. */
    link?: string
    linkSentAt?: Date
  }
  provisionedUserId?: string
  actualStartDate?: string
  createdAt: Date
  updatedAt: Date
}

const ApplicationSchema = new Schema<IApplication>({
  ref:              { type: String, required: true, unique: true },
  name:             { type: String, required: true },
  email:            { type: String, required: true },
  role:             { type: String, required: true },
  status:           { type: String, enum: ['applied','assessed','shortlisted','interviewed','offered','onboarded','rejected','not_progressed','lapsed'], default: 'applied' },
  phone:            { type: String },
  note:             { type: String },
  cvFilename:       { type: String },
  positionSlug:     { type: String },
  source:           { type: String, enum: ['careers', 'assessment'] },
  accessCode:       { type: String, index: true, sparse: true },
  codeSentAt:       { type: Date },
  codeExpiresAt:    { type: Date },
  reminderSentAt:   { type: Date },
  eligible:         { type: Boolean },
  passMark:         { type: Number },
  declineDueAt:     { type: Date },
  declinedAt:       { type: Date },
  assessmentScore:  { type: String },
  assessmentPct:    { type: Number },
  assessmentDate:   { type: Date },
  paper:            { type: Schema.Types.Mixed },
  assessmentVersion:{ type: String },
  assessmentLate:   { type: Boolean },
  assessmentFilename: { type: String },
  tabSwitches:      { type: Number, default: 0 },
  pasteTries:       { type: Number, default: 0 },
  violations:       [{ type: String }],
  transcript:       [{ type: Schema.Types.Mixed }],
  notes:            { type: String, default: '' },
  shortlistEmailSentAt: { type: Date },
  rejectionEmailSentAt: { type: Date },
  offer: {
    jobCode: String,
    salary: Number,
    startDate: String,
    deadline: Date,
    sentAt: Date,
    candidateSignedAt: Date,
    candidateSignedName: String,
    candidateIp: String,
    mdSignedAt: Date,
    mdSignedName: String,
  },
  employeeNumber: { type: String },
  onboarding: {
    docs: [{ filename: String, label: String, uploadedAt: Date, acknowledgedAt: Date, _id: false }],
    sentAt: Date,
    acknowledgedAt: Date,
    acknowledgedName: String,
    ip: String,
    bciConsentAt: Date,
    signatureName: String,
    mdAckName: String,
    mdAckAt: Date,
  },
  screening: {
    provider: String,
    status: { type: String, enum: ['pending', 'in_progress', 'cleared', 'failed'] },
    initiatedAt: Date,
    clearedAt: Date,
    notes: String,
    link: String,
    linkSentAt: Date,
  },
  provisionedUserId: { type: String },
  actualStartDate: { type: String },
}, { timestamps: true })

export default mongoose.models.Application ||
  mongoose.model<IApplication>('Application', ApplicationSchema)
