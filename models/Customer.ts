import mongoose, { Schema, Document } from 'mongoose'

export interface ICspOnboarding {
  // true = customer already has an O365/onmicrosoft.com tenant (4Sight Option 1:
  // they send an association link). false = brand-new tenant, needs the full
  // "NEW CSP CUSTOMER INFORMATION REQUEST" 4Sight asks for (their Option 2).
  hasExistingTenant: boolean
  companyRegistrationId?: string
  vatNumber?: string
  preferredDomain?: string
  secondChoiceDomain?: string
  thirdChoiceDomain?: string
  physicalAddress?: string
  city?: string
  postalCode?: string
}

export interface ICustomer extends Document {
  // Identity
  company: string
  contact: string
  email: string
  phone: string
  country: string
  industry: string

  // Microsoft tenant
  tenantId?: string
  tenantDomain: string
  adminEmail: string

  // Subscription
  package: 'starter' | 'secure' | 'ai' | 'custom'
  users: number
  services: string[]
  billingCycle: 'monthly' | 'annual'

  // Financials
  mrr: number
  arr: number
  setupFee: number
  currency: string

  // Dates
  startDate: Date
  renewalDate: Date
  nextInvoiceDate: Date

  // Status
  status: 'active' | 'suspended' | 'churned' | 'trial'
  healthScore: 'green' | 'amber' | 'red'
  notes?: string

  // Source
  leadRef?: string
  closedByEmail?: string
  closedByName?: string
  distributor?: string
  cspOnboarding?: ICspOnboarding

  createdAt: Date
  updatedAt: Date
}

const CspOnboardingSchema = new Schema<ICspOnboarding>(
  {
    hasExistingTenant: { type: Boolean, default: false },
    companyRegistrationId: String,
    vatNumber: String,
    preferredDomain: String,
    secondChoiceDomain: String,
    thirdChoiceDomain: String,
    physicalAddress: String,
    city: String,
    postalCode: String,
  },
  { _id: false }
)

const CustomerSchema = new Schema<ICustomer>(
  {
    company: { type: String, required: true },
    contact: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    country: { type: String, required: true },
    industry: { type: String, default: 'General SME' },

    tenantId: String,
    tenantDomain: { type: String, required: true },
    adminEmail: { type: String, required: true },

    package: { type: String, enum: ['starter', 'secure', 'ai', 'custom'], default: 'secure' },
    users: { type: Number, required: true, min: 1 },
    services: [{ type: String }],
    billingCycle: { type: String, enum: ['monthly', 'annual'], default: 'monthly' },

    mrr: { type: Number, required: true, default: 0 },
    arr: { type: Number, default: 0 },
    setupFee: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },

    startDate: { type: Date, required: true },
    renewalDate: { type: Date, required: true },
    nextInvoiceDate: { type: Date, required: true },

    status: { type: String, enum: ['active', 'suspended', 'churned', 'trial'], default: 'active' },
    healthScore: { type: String, enum: ['green', 'amber', 'red'], default: 'green' },
    notes: String,
    leadRef: String,
    closedByEmail: String,
    closedByName: String,
    distributor: String,
    cspOnboarding: CspOnboardingSchema,
  },
  { timestamps: true }
)

export const Customer =
  mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema)
