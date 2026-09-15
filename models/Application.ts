import mongoose, { Schema, Document } from 'mongoose'

export interface IApplication extends Document {
  ref: string
  name: string
  email: string
  role: string
  status: 'applied' | 'assessed' | 'shortlisted' | 'interviewed' | 'offered' | 'onboarded' | 'rejected'
  assessmentScore?: string
  assessmentPct?: number
  assessmentDate?: Date
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
    docs?: { filename: string; label?: string; uploadedAt?: Date }[]
    sentAt?: Date
    acknowledgedAt?: Date
    acknowledgedName?: string
    ip?: string
    bciConsentAt?: Date
  }
  screening?: {
    provider?: string
    status?: 'pending' | 'in_progress' | 'cleared' | 'failed'
    initiatedAt?: Date
    clearedAt?: Date
    notes?: string
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
  status:           { type: String, enum: ['applied','assessed','shortlisted','interviewed','offered','onboarded','rejected'], default: 'applied' },
  assessmentScore:  { type: String },
  assessmentPct:    { type: Number },
  assessmentDate:   { type: Date },
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
    docs: [{ filename: String, label: String, uploadedAt: Date, _id: false }],
    sentAt: Date,
    acknowledgedAt: Date,
    acknowledgedName: String,
    ip: String,
    bciConsentAt: Date,
  },
  screening: {
    provider: String,
    status: { type: String, enum: ['pending', 'in_progress', 'cleared', 'failed'] },
    initiatedAt: Date,
    clearedAt: Date,
    notes: String,
  },
  provisionedUserId: { type: String },
  actualStartDate: { type: String },
}, { timestamps: true })

export default mongoose.models.Application ||
  mongoose.model<IApplication>('Application', ApplicationSchema)
