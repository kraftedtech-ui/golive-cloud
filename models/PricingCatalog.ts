import mongoose, { Schema, Document } from 'mongoose'

export type CustomerType = 'corporate' | 'academic' | 'charity'
export type BillingPlan = 'Monthly' | 'Annual' | 'Triennial' | 'None'

export interface IPricingCatalog extends Document {
  distributor: string
  productId: string
  skuTitle: string
  termDuration: string // 'P1M' | 'P1Y' | 'P3Y'
  billingPlan: BillingPlan
  customerType: CustomerType
  retailUSD: number
  resellerUSD: number
  marginUSD: number
  marginPercent: number // marginUSD / retailUSD, as a fraction (0.12 = 12%)
  segment?: string
  solutionArea?: string
  granularWorkload?: string
  active: boolean
  importBatch: string // e.g. "2026-06"
  sourceFile?: string
  createdAt: Date
  updatedAt: Date
}

const PricingCatalogSchema = new Schema<IPricingCatalog>(
  {
    distributor: { type: String, required: true, default: '4Sight Dynamics Africa' },
    productId: { type: String, required: true, index: true },
    skuTitle: { type: String, required: true, index: true },
    termDuration: { type: String, required: true },
    billingPlan: { type: String, enum: ['Monthly', 'Annual', 'Triennial', 'None'], required: true },
    customerType: { type: String, enum: ['corporate', 'academic', 'charity'], required: true, index: true },
    retailUSD: { type: Number, required: true },
    resellerUSD: { type: Number, required: true },
    marginUSD: { type: Number, required: true },
    marginPercent: { type: Number, required: true },
    segment: String,
    solutionArea: { type: String, index: true },
    granularWorkload: String,
    active: { type: Boolean, default: true, index: true },
    importBatch: { type: String, required: true },
    sourceFile: String,
  },
  { timestamps: true }
)

// Composite key used by the importer to upsert instead of duplicate.
PricingCatalogSchema.index(
  { productId: 1, skuTitle: 1, termDuration: 1, billingPlan: 1, customerType: 1 },
  { unique: true }
)
// Supports the catalog search box (typing a product name).
PricingCatalogSchema.index({ skuTitle: 'text', solutionArea: 'text' })

export const PricingCatalog =
  mongoose.models.PricingCatalog ||
  mongoose.model<IPricingCatalog>('PricingCatalog', PricingCatalogSchema)
