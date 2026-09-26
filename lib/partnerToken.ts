/**
 * partnerToken.ts: signed, expiring links for partner training and assessment.
 * Same HMAC scheme as offerToken and onboardingToken, with its own "ptrain"
 * kind so a token from one flow can never be used in another.
 */

import crypto from 'crypto'

const SECRET = process.env.ASSESSMENT_SIGNING_SECRET || ''

const b64u = (b: Buffer) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromB64u = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
const hmac = (payload: string) => crypto.createHmac('sha256', SECRET).update(payload).digest()

export const TRAINING_LINK_DAYS = 30

/**
 * Kinds: ptrain (training and assessment), pagree (sign the agreement),
 * pdoc (download the executed agreement and certificate), psess (partner dashboard sign-in).
 */
export type PartnerTokenKind = 'ptrain' | 'pagree' | 'pdoc' | 'psess'

export function signPartnerToken(kind: PartnerTokenKind, ref: string, expires: Date): string {
  const payload = `${kind}|${ref}|${expires.getTime()}`
  return `${b64u(Buffer.from(payload))}.${b64u(hmac(payload))}`
}

export function verifyPartnerToken(kind: PartnerTokenKind, token: string): { ref: string } | null {
  try {
    if (!SECRET) return null
    const [p, sig] = String(token || '').split('.')
    if (!p || !sig) return null
    const payload = fromB64u(p).toString('utf8')
    const expected = hmac(payload)
    const given = fromB64u(sig)
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null
    const [k, ref, expMs] = payload.split('|')
    if (k !== kind || !ref) return null
    if (!expMs || Date.now() > Number(expMs)) return null
    return { ref }
  } catch {
    return null
  }
}

export function signTrainingToken(ref: string, expires: Date): string {
  const payload = `ptrain|${ref}|${expires.getTime()}`
  return `${b64u(Buffer.from(payload))}.${b64u(hmac(payload))}`
}

export function verifyTrainingToken(token: string): { ref: string } | null {
  try {
    if (!SECRET) return null
    const [p, sig] = String(token || '').split('.')
    if (!p || !sig) return null
    const payload = fromB64u(p).toString('utf8')
    const expected = hmac(payload)
    const given = fromB64u(sig)
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null
    const [kind, ref, expMs] = payload.split('|')
    if (kind !== 'ptrain' || !ref) return null
    if (!expMs || Date.now() > Number(expMs)) return null
    return { ref }
  } catch {
    return null
  }
}
