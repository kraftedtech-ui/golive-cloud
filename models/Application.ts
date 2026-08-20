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
}, { timestamps: true })

export default mongoose.models.Application ||
  mongoose.model<IApplication>('Application', ApplicationSchema)
