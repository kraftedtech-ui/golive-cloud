import mongoose, { Schema, Document } from 'mongoose'

export interface IKnowledgeArticle extends Document {
  title: string
  slug: string
  category: string
  body: string
  tags: string[]
  createdBy: string
  pinned: boolean
  createdAt: Date
  updatedAt: Date
}

const KnowledgeArticleSchema = new Schema<IKnowledgeArticle>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    body: { type: String, required: true },
    tags: [{ type: String }],
    createdBy: { type: String, default: 'GoLive Admin' },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const KnowledgeArticle =
  mongoose.models.KnowledgeArticle ||
  mongoose.model<IKnowledgeArticle>('KnowledgeArticle', KnowledgeArticleSchema)
