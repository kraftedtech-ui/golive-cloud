import mongoose, { Schema, Document } from 'mongoose'

export interface INotification extends Document {
  recipientEmail: string
  type: 'lead_assigned' | 'lead_status' | 'transfer_assigned' | 'transfer_status' | 'announcement'
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientEmail: { type: String, required: true, index: true },
    type: { type: String, enum: ['lead_assigned', 'lead_status', 'transfer_assigned', 'transfer_status', 'announcement'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: String,
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const Notification =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema)
