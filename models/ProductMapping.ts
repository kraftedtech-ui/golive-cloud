import mongoose, { Schema, Document } from 'mongoose'

export interface IProductMapping extends Document {
  type: 'package' | 'addon'
  key: string // stable slug, e.g. 'starter', 'defenderOffice' — used by the Proposal Generator to look this up
  label: string // customer-facing name, e.g. "Starter Cloud Office"
  skuTitles: string[] // real catalog SKU title(s) this maps to (matched against PricingCatalog.skuTitle)
  blurb?: string // one-line description, mainly used for add-ons
  features?: string[] // marketing feature bullets shown on the proposal (packages only)
  order: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const ProductMappingSchema = new Schema<IProductMapping>(
  {
    type: { type: String, enum: ['package', 'addon'], required: true },
    key: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    skuTitles: [{ type: String, required: true }],
    blurb: String,
    features: [{ type: String }],
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const ProductMapping =
  mongoose.models.ProductMapping || mongoose.model<IProductMapping>('ProductMapping', ProductMappingSchema)
