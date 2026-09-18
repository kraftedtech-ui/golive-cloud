import mongoose, { Schema, Document } from 'mongoose'

export interface INotification extends Document {
  recipientEmail: string
  type: 'lead_assigned' | 'lead_status' | 'transfer_assigned' | 'transfer_status' | 'announcement' | 'hr_reminder'
  title: string
  message: string
  link?: string
  /** Stable key for lifecycle reminders, so a scheduled sweep that runs
   *  repeatedly cannot create the same reminder twice. Unset for other types. */
  dedupeKey?: string
  read: boolean
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientEmail: { type: String, required: true, index: true },
    type: { type: String, enum: ['lead_assigned', 'lead_status', 'transfer_assigned', 'transfer_status', 'announcement', 'hr_reminder'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: String,
    dedupeKey: { type: String, index: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const Notification =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema)
