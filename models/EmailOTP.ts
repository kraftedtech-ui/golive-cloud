import mongoose, { Schema, Document } from 'mongoose'

export interface IEmailOTP extends Document {
  email: string
  code: string
  verified: boolean
  attempts: number
  expiresAt: Date
  createdAt: Date
}

const EmailOTPSchema = new Schema<IEmailOTP>(
  {
    email: { type: String, required: true, index: true, lowercase: true },
    code: { type: String, required: true },
    verified: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index — auto-deletes expired docs
  },
  { timestamps: true }
)

export const EmailOTP =
  mongoose.models.EmailOTP || mongoose.model<IEmailOTP>('EmailOTP', EmailOTPSchema)
