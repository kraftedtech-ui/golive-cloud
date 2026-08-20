import crypto from 'crypto'

/**
 * Signed tokens for the candidate assessment flow.
 *
 * The assessment pages are static HTML served publicly, so anything embedded
 * in them is readable by anyone. The previous design used a single shared
 * constant as an API token, which meant the assessment endpoints were
 * effectively open: anyone could register applications, or post a recording
 * with an arbitrary candidate name and score and cause an email to be sent
 * from talent.acquisition@golivecompany.com.
 *
 * Instead the server issues a short-lived HMAC token when a candidate passes
 * the access-code gate, and re-issues it with their identity bound in once
 * they register. Downstream routes read identity FROM THE TOKEN rather than
 * from the request body, so a caller cannot claim to be someone else.
 *
 * Format:  base64url(JSON payload) + "." + base64url(HMAC-SHA256)
 *
 * This is deliberately not a JWT — no library, no algorithm negotiation, and
 * therefore no "alg: none" class of mistake.
 */

export interface AssessmentClaims {
  role: string
  /** Present once the candidate has registered. */
  ref?: string
  email?: string
  name?: string
  /** Unix seconds. */
  exp: number
}

const TTL_SECONDS = 4 * 60 * 60 // 4 hours — covers "save for later" and a retry

function secret(): string | null {
  const s = process.env.ASSESSMENT_SIGNING_SECRET
  // Fail closed. A default here would recreate exactly the problem this
  // replaces: a known value that anyone reading the repo can forge with.
  return s && s.length >= 32 ? s : null
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}

/** Issue a token. Returns null if no signing secret is configured. */
export function signAssessmentToken(
  claims: Omit<AssessmentClaims, 'exp'>,
  ttlSeconds: number = TTL_SECONDS
): string | null {
  const key = secret()
  if (!key) {
    console.error('[assessmentToken] ASSESSMENT_SIGNING_SECRET is not set — refusing to issue a token.')
    return null
  }

  const payload: AssessmentClaims = {
    ...claims,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  }

  const body = b64url(Buffer.from(JSON.stringify(payload), 'utf8'))
  const mac = b64url(crypto.createHmac('sha256', key).update(body).digest())
  return `${body}.${mac}`
}

/**
 * Verify a token and return its claims, or null if it is missing, malformed,
 * unsigned, tampered with, or expired. Never throws.
 */
export function verifyAssessmentToken(token: string | null | undefined): AssessmentClaims | null {
  const key = secret()
  if (!key || !token) return null

  const dot = token.indexOf('.')
  if (dot < 1) return null

  const body = token.slice(0, dot)
  const mac = token.slice(dot + 1)

  let expected: string
  try {
    expected = b64url(crypto.createHmac('sha256', key).update(body).digest())
  } catch {
    return null
  }

  // Constant-time compare — lengths must match first, since timingSafeEqual
  // throws on mismatched buffers.
  const a = Buffer.from(mac)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  let claims: AssessmentClaims
  try {
    claims = JSON.parse(fromB64url(body).toString('utf8'))
  } catch {
    return null
  }

  if (!claims || typeof claims.exp !== 'number') return null
  if (claims.exp < Math.floor(Date.now() / 1000)) return null
  if (!claims.role) return null

  return claims
}

/** Convenience for route handlers. */
export function claimsFromRequest(req: Request): AssessmentClaims | null {
  return verifyAssessmentToken(req.headers.get('x-assessment-token'))
}
