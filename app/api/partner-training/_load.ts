import { connectDB } from '@/lib/mongodb'
import PartnerApplication, { type IPartnerApplication } from '@/models/PartnerApplication'
import { verifyTrainingToken } from '@/lib/partnerToken'

/** Resolve a training token to its application, or null. Shared by the partner-training routes. */
export async function loadByToken(token: unknown): Promise<IPartnerApplication | null> {
  const v = verifyTrainingToken(String(token || ''))
  if (!v) return null
  await connectDB()
  return PartnerApplication.findOne({ ref: v.ref })
}

export const clientIp = (h: Headers) => h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || undefined
