import mongoose, { Schema, Document } from 'mongoose'

/**
 * Employee.ts — the post-hire layer. An Application ends here: countersigning
 * an offer creates an Employee record carrying the GL-EMP number forward.
 * Legacy hires (Henry Arukwe, GL-EMP-001) predate the candidate pipeline and
 * are backfilled directly with legacyHire: true and applicationRef: null —
 * they are never retrofitted into the Application collection.
 */

export interface IEmployeeDocFile {
  filename: string
  label?: string
  uploadedAt?: Date
  /** True for signed paperwork executed outside the portal (legacy hires). */
  executedExternally?: boolean
}

export interface IEmployee extends Document {
  employeeNumber: string           // GL-EMP-001
  name: string
  email: string                    // personal / contact email
  workEmail?: string               // @golivecompany.com address once provisioned
  role: string                     // job title, e.g. "Sales and Support Associate"
  jobCode?: string                 // REF# series — identifies the position, not the person
  employmentType?: 'full-time' | 'part-time'
  status: 'probation' | 'active' | 'exited'
  legacyHire: boolean
  /** GL-APP-2026-XXXX for pipeline hires; null for legacy hires. */
  applicationRef?: string | null
  /** Portal User _id once an account exists (Team & Access). */
  portalUserId?: string
  startDate?: Date
  probationEndDate?: Date
  confirmedAt?: Date
  exitedAt?: Date
  certification?: {
    name?: string                  // e.g. AB-900
    source?: string                // e.g. 4Sight voucher
    voucherIssuedAt?: Date
    deadline?: Date                // externally enforced (voucher expiry)
    scheduledFor?: Date
    completedAt?: Date
  }
  /** Documents held directly on the employee file (employee-docs/<EMP-NO>/).
   *  Pipeline hires additionally surface their Application onboarding docs,
   *  which stay in onboarding-docs/<APP-REF>/ — single source of truth. */
  docs: IEmployeeDocFile[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    employeeNumber: { type: String, required: true, unique: true },
    name:           { type: String, required: true },
    email:          { type: String, required: true, lowercase: true },
    workEmail:      { type: String, lowercase: true },
    role:           { type: String, required: true },
    jobCode:        { type: String },
    employmentType: { type: String, enum: ['full-time', 'part-time'], default: 'full-time' },
    status:         { type: String, enum: ['probation', 'active', 'exited'], default: 'probation' },
    legacyHire:     { type: Boolean, default: false },
    applicationRef: { type: String, default: null },
    portalUserId:   { type: String },
    startDate:        Date,
    probationEndDate: Date,
    confirmedAt:      Date,
    exitedAt:         Date,
    certification: {
      name: String,
      source: String,
      voucherIssuedAt: Date,
      deadline: Date,
      scheduledFor: Date,
      completedAt: Date,
    },
    docs: [{
      filename: String,
      label: String,
      uploadedAt: Date,
      executedExternally: Boolean,
      _id: false,
    }],
    notes: { type: String, default: '' },
  },
  { timestamps: true }
)

export default mongoose.models.Employee ||
  mongoose.model<IEmployee>('Employee', EmployeeSchema)
