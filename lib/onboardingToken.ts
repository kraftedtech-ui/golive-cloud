/**
 * onboardingToken.ts — signed, expiring tokens for onboarding-pack links.
 * Same HMAC scheme as offerToken, distinct "onboard" kind so tokens are
 * never interchangeable between flows.
 */

import crypto from 'crypto'

const SECRET = process.env.ASSESSMENT_SIGNING_SECRET || ''

const b64u = (b: Buffer) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromB64u = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
const hmac = (payload: string) => crypto.createHmac('sha256', SECRET).update(payload).digest()

export function signOnboardingToken(ref: string, expires: Date): string {
  const payload = `onboard|${ref}|${expires.getTime()}`
  return `${b64u(Buffer.from(payload))}.${b64u(hmac(payload))}`
}

export function verifyOnboardingToken(token: string): { ref: string } | null {
  try {
    const [p, sig] = String(token || '').split('.')
    if (!p || !sig) return null
    const payload = fromB64u(p).toString('utf8')
    const expected = hmac(payload)
    const given = fromB64u(sig)
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null
    const [kind, ref, expMs] = payload.split('|')
    if (kind !== 'onboard' || !ref) return null
    if (!expMs || Date.now() > Number(expMs)) return null
    return { ref }
  } catch {
    return null
  }
}
