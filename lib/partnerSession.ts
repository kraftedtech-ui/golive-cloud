/**
 * partnerSession.ts: sign-in for appointed partners. SERVER ONLY.
 *
 * Partners have no portal user account and no password. They sign in with a
 * one-time code sent to the email on their agreement (the same
 * /api/verify-email flow the application form uses), which opens a signed
 * session cookie. Only active partners with an unrevoked certificate get in;
 * termination or revocation ends access at the next request.
 */

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { signPartnerToken, verifyPartnerToken } from '@/lib/partnerToken'
import { connectDB } from '@/lib/mongodb'
import PartnerApplication, { type IPartnerApplication } from '@/models/PartnerApplication'

export const PARTNER_COOKIE = 'gl_partner'
export const SESSION_DAYS = 14

export function canSignIn(app: IPartnerApplication | null): app is IPartnerApplication {
  return !!app && app.status === 'active' && !!app.partnerNumber && !app.certificate?.revokedAt
}

export function setPartnerSession(res: NextResponse, ref: string): NextResponse {
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5)
  res.cookies.set(PARTNER_COOKIE, signPartnerToken('psess', ref, expires), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires,
  })
  return res
}

export function clearPartnerSession(res: NextResponse): NextResponse {
  res.cookies.set(PARTNER_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: new Date(0) })
  return res
}

/** The signed-in partner, or null. Re-checks status on every call. */
export async function currentPartner(): Promise<IPartnerApplication | null> {
  const jar = await cookies()
  const v = verifyPartnerToken('psess', jar.get(PARTNER_COOKIE)?.value || '')
  if (!v) return null
  await connectDB()
  const app = await PartnerApplication.findOne({ ref: v.ref })
  return canSignIn(app) ? app : null
}
