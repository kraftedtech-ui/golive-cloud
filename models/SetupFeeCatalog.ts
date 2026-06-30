import mongoose, { Schema, Document } from 'mongoose'

export interface ISetupFeeCatalogItem extends Document {
  key: string
  label: string
  category: string
  unit: 'flat' | 'per_user'
  amountUSD: number
  autoSuggestTags: string[]
  brdTrigger: boolean
  order: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const SetupFeeCatalogSchema = new Schema<ISetupFeeCatalogItem>(
  {
    key: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    category: { type: String, default: 'general' },
    unit: { type: String, enum: ['flat', 'per_user'], default: 'flat' },
    amountUSD: { type: Number, required: true },
    autoSuggestTags: [{ type: String }],
    brdTrigger: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const SetupFeeCatalogItem =
  mongoose.models.SetupFeeCatalogItem ||
  mongoose.model<ISetupFeeCatalogItem>('SetupFeeCatalogItem', SetupFeeCatalogSchema)
