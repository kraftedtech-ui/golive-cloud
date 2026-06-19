import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'

export type UserRole = 'admin' | 'sales' | 'viewer'

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: UserRole
  active: boolean
  lastLogin?: Date
  invitedBy?: string
  phone?: string
  emailNotifications: boolean
  profilePicture?: string
  twoFactorSecret?: string
  twoFactorEnabled: boolean
  pendingTwoFactorSecret?: string
  failedTotpAttempts: number
  totpLockedUntil?: Date
  createdAt: Date
  updatedAt: Date
  comparePassword(password: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'sales', 'viewer'], default: 'sales' },
    active: { type: Boolean, default: true },
    lastLogin: Date,
    invitedBy: String,
    phone: String,
    emailNotifications: { type: Boolean, default: true },
    profilePicture: String,
    twoFactorSecret: String,
    twoFactorEnabled: { type: Boolean, default: false },
    pendingTwoFactorSecret: String,
    failedTotpAttempts: { type: Number, default: 0 },
    totpLockedUntil: Date,
  },
  { timestamps: true }
)

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password)
}

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
