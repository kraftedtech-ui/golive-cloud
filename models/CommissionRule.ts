import mongoose, { Schema, Document } from 'mongoose'

export interface ICommissionRule extends Document {
  type: 'do' | 'dont'
  text: string
  section: string
  order: number
  createdAt: Date
  updatedAt: Date
}

const CommissionRuleSchema = new Schema<ICommissionRule>(
  {
    type: { type: String, enum: ['do', 'dont'], required: true },
    text: { type: String, required: true },
    section: { type: String, default: 'General' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const CommissionRule =
  mongoose.models.CommissionRule ||
  mongoose.model<ICommissionRule>('CommissionRule', CommissionRuleSchema)
