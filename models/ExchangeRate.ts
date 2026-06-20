import mongoose, { Schema, Document } from 'mongoose'

export interface IExchangeRate extends Document {
  base: string // always 'NGN' — rates are "NGN per 1 unit of currency X"
  rates: Record<string, number>
  source: 'live' | 'manual'
  locked: boolean
  fetchedAt: Date
}

const ExchangeRateSchema = new Schema<IExchangeRate>(
  {
    base: { type: String, default: 'NGN' },
    rates: { type: Schema.Types.Mixed, default: {} },
    source: { type: String, enum: ['live', 'manual'], default: 'live' },
    locked: { type: Boolean, default: false },
    fetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export const ExchangeRate =
  mongoose.models.ExchangeRate || mongoose.model<IExchangeRate>('ExchangeRate', ExchangeRateSchema)
