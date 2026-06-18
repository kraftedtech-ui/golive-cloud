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
  assignedToEmail?: string
  distributor?: string
  tenantId?: string
  mrr?: number
  setupFee?: number
  productCategory?: 'm365_license' | 'monthly_subscription' | 'annual_subscription' | 'setup_migration' | 'support_retainer' | 'upsell_crosssell' | 'renewal'
  grossProfitMargin?: number
  commissionStatus?: 'tracked' | 'accrued' | 'earned' | 'payable' | 'paid'
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
    assignedToEmail: String,
    distributor: String,
    tenantId: String,
    mrr: Number,
    setupFee: Number,
    productCategory: {
      type: String,
      enum: ['m365_license', 'monthly_subscription', 'annual_subscription', 'setup_migration', 'support_retainer', 'upsell_crosssell', 'renewal'],
    },
    grossProfitMargin: Number,
    commissionStatus: {
      type: String,
      enum: ['tracked', 'accrued', 'earned', 'payable', 'paid'],
      default: 'tracked',
    },
  },
  { timestamps: true }
)

export const Lead =
  mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema)
