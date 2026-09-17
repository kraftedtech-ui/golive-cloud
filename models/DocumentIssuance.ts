import mongoose, { Schema, Document } from 'mongoose'

/**
 * DocumentIssuance.ts — one record per set of documents issued to an employee
 * for electronic signature (confirmation letters, targets documents, promotion
 * letters, policy updates).
 *
 * Mirrors the onboarding-pack flow, but keyed to an Employee rather than an
 * Application: the employee acknowledges EACH document separately, then signs
 * once with their typed legal name; the MD countersigns; the executed copy is
 * a merged PDF filed back to the employee's document file.
 *
 * Per-document timestamps are the point. A single blanket acceptance cannot
 * show that the targets document was read as well as the letter.
 */

export interface IIssuanceDoc {
  filename: string
  label: string
  acknowledgedAt?: Date | null
}

export interface IDocumentIssuance extends Document {
  ref: string                      // GL-ISS-2026-0001
  employeeId: string               // Employee._id
  employeeNumber: string
  employeeName: string
  employeeEmail: string            // where the link is sent
  role?: string
  jobCode?: string
  kind: 'confirmation' | 'targets' | 'promotion' | 'policy' | 'other'
  title: string                    // shown on the signing page
  message?: string                 // optional covering note
  docs: IIssuanceDoc[]
  status: 'draft' | 'sent' | 'signed' | 'executed'
  sentAt?: Date
  deadline?: Date
  // employee signature
  signedAt?: Date
  signatureName?: string
  ip?: string
  // company countersignature
  mdSignedAt?: Date
  mdSignedName?: string
  createdAt: Date
  updatedAt: Date
}

const DocumentIssuanceSchema = new Schema<IDocumentIssuance>(
  {
    ref:            { type: String, required: true, unique: true },
    employeeId:     { type: String, required: true, index: true },
    employeeNumber: { type: String, required: true },
    employeeName:   { type: String, required: true },
    employeeEmail:  { type: String, required: true, lowercase: true },
    role:           { type: String },
    jobCode:        { type: String },
    kind:   { type: String, enum: ['confirmation', 'targets', 'promotion', 'policy', 'other'], default: 'other' },
    title:  { type: String, required: true },
    message:{ type: String },
    docs: [{
      filename: String,
      label: String,
      acknowledgedAt: Date,
      _id: false,
    }],
    status: { type: String, enum: ['draft', 'sent', 'signed', 'executed'], default: 'draft' },
    sentAt:   Date,
    deadline: Date,
    signedAt: Date,
    signatureName: String,
    ip: String,
    mdSignedAt: Date,
    mdSignedName: String,
  },
  { timestamps: true }
)

export default mongoose.models.DocumentIssuance ||
  mongoose.model<IDocumentIssuance>('DocumentIssuance', DocumentIssuanceSchema)
