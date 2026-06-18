import mongoose, { Schema, Document } from 'mongoose'

export interface IAnnouncement extends Document {
  title: string
  body: string
  priority: 'normal' | 'high' | 'urgent'
  createdBy: string
  pinned: boolean
  createdAt: Date
  updatedAt: Date
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    priority: { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
    createdBy: { type: String, required: true },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const Announcement =
  mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema)
