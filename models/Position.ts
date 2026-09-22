import mongoose, { Schema, Document } from 'mongoose'

/**
 * Position.ts: a role GoLive is recruiting for, with a headcount.
 *
 * Replaces the hard-coded list in lib/careersConfig.ts as the source for the
 * public /careers page. A position can have several openings (the sales team
 * is hiring more than one associate); it reads as filled only when every
 * opening has a hire recorded against it.
 *
 * Hires are recorded automatically when an offer for this position's title is
 * countersigned, and can be added or undone from People (HR) > Positions.
 */

export interface IPositionHire {
  employeeNumber?: string
  applicationRef?: string
  name: string
  hiredAt: Date
}

export interface IPosition extends Document {
  slug: string
  title: string
  department: string
  type: string
  location: string
  salaryLower: number
  salaryUpper: number
  commission: boolean
  summary: string
  responsibilities: string[]
  requirements: string[]
  /** draft: not public. open: recruiting. closed: withdrawn without filling. */
  status: 'draft' | 'open' | 'closed'
  /** How many people this position is hiring. */
  openings: number
  hires: IPositionHire[]
  /** Set when the last opening is filled; cleared if a hire is undone. */
  filledOn?: Date | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

const PositionSchema = new Schema<IPosition>(
  {
    slug:        { type: String, required: true, unique: true },
    title:       { type: String, required: true },
    department:  { type: String, required: true },
    type:        { type: String, default: 'Full-time' },
    location:    { type: String, default: 'Lagos, hybrid' },
    salaryLower: { type: Number, required: true },
    salaryUpper: { type: Number, required: true },
    commission:  { type: Boolean, default: false },
    summary:     { type: String, default: '' },
    responsibilities: { type: [String], default: [] },
    requirements:     { type: [String], default: [] },
    status:   { type: String, enum: ['draft', 'open', 'closed'], default: 'draft' },
    openings: { type: Number, default: 1, min: 0 },
    hires: [{
      employeeNumber: String,
      applicationRef: String,
      name: { type: String, required: true },
      hiredAt: { type: Date, default: Date.now },
      _id: false,
    }],
    filledOn:  { type: Date, default: null },
    sortOrder: { type: Number, default: 100 },
  },
  { timestamps: true }
)

export default mongoose.models.Position ||
  mongoose.model<IPosition>('Position', PositionSchema)
