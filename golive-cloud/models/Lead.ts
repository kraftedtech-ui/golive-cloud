import mongoose, { Schema, Document } from 'mongoose'

export interface ILead extends Document {
  ref: string
  company: string
  contact: string
  email: string
  phone: string
  country: string
  industry: string
  users: string
  currentEmail: string
  domain?: string
  services: string[]
  billing: string
  notes?: string
  status: 'new' | 'assessment' | 'quoted' | 'negotiating' | 'won' | 'lost'
  assignedTo?: string
  distributor?: string
  tenantId?: string
  mrr?: number
  setupFee?: number
  createdAt: Date
  updatedAt: Date
}

const LeadSchema = new Schema<ILead>(
  {
    ref: { type: String, required: true, unique: true },
    company: { type: String, required: true },
    contact: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    country: { type: String, required: true },
    industry: { type: String, default: 'General SME' },
    users: { type: String, default: '1–5' },
    currentEmail: { type: String, default: 'cPanel / Webmail' },
    domain: String,
    services: [{ type: String }],
    billing: { type: String, default: 'Monthly' },
    notes: String,
    status: {
      type: String,
      enum: ['new', 'assessment', 'quoted', 'negotiating', 'won', 'lost'],
      default: 'new',
    },
    assignedTo: String,
    distributor: String,
    tenantId: String,
    mrr: Number,
    setupFee: Number,
  },
  { timestamps: true }
)

export const Lead =
  mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema)
