import mongoose, { Schema, Document } from 'mongoose'

export type CertRecordStatus =
  | 'requested'          // employee asked for pre-approval before enrolling
  | 'approved_to_enroll' // MD approved in writing before registration
  | 'denied'             // rejected at any stage
  | 'submitted'          // employee passed and submitted proof/credential ID
  | 'verified'           // MD verified the credential with the certifying org
  | 'earned'             // all Section 4 eligibility conditions satisfied
  | 'payable'            // queued for next payroll cycle
  | 'paid'               // bonus paid out

export interface ICertificationRecord extends Document {
  employeeName: string
  employeeEmail?: string
  catalogItemId?: string
  certName: string
  vendor: string
  level: 'foundational' | 'intermediate' | 'advanced'
  bonusAmount: number
  examFee?: number
  credentialId?: string
  proofUrl?: string
  status: CertRecordStatus
  adminNotes?: string
  requestedAt: Date
  approvedAt?: Date
  submittedAt?: Date
  verifiedAt?: Date
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
}

const CertificationRecordSchema = new Schema<ICertificationRecord>(
  {
    employeeName: { type: String, required: true },
    employeeEmail: String,
    catalogItemId: String,
    certName: { type: String, required: true },
    vendor: { type: String, default: 'Microsoft' },
    level: { type: String, enum: ['foundational', 'intermediate', 'advanced'], required: true },
    bonusAmount: { type: Number, required: true },
    examFee: Number,
    credentialId: String,
    proofUrl: String,
    status: {
      type: String,
      enum: ['requested', 'approved_to_enroll', 'denied', 'submitted', 'verified', 'earned', 'payable', 'paid'],
      default: 'requested',
    },
    adminNotes: String,
    requestedAt: { type: Date, default: Date.now },
    approvedAt: Date,
    submittedAt: Date,
    verifiedAt: Date,
    paidAt: Date,
  },
  { timestamps: true }
)

export const CertificationRecord =
  mongoose.models.CertificationRecord ||
  mongoose.model<ICertificationRecord>('CertificationRecord', CertificationRecordSchema)
