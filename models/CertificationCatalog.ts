import mongoose, { Schema, Document } from 'mongoose'

export type CertLevel = 'foundational' | 'intermediate' | 'advanced'

export interface ICertificationCatalog extends Document {
  name: string
  vendor: string
  level: CertLevel
  bonusAmount: number
  active: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const CertificationCatalogSchema = new Schema<ICertificationCatalog>(
  {
    name: { type: String, required: true },
    vendor: { type: String, default: 'Microsoft' },
    level: { type: String, enum: ['foundational', 'intermediate', 'advanced'], required: true },
    bonusAmount: { type: Number, required: true },
    active: { type: Boolean, default: true },
    notes: String,
  },
  { timestamps: true }
)

export const CertificationCatalog =
  mongoose.models.CertificationCatalog ||
  mongoose.model<ICertificationCatalog>('CertificationCatalog', CertificationCatalogSchema)
