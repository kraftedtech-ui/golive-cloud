import crypto from 'crypto'

export async function verifyTurnstile(token: string, remoteIp?: string): Promise<boolean> {
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY || '',
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }),
    })
    const data = await res.json()
    return data.success === true
  } catch (err) {
    console.error('Turnstile verification error:', err)
    return false
  }
}

export function verifyEmailToken(token: string, email: string): boolean {
  try {
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me'
    const decoded = Buffer.from(token, 'base64').toString('utf8')
    const [tokenEmail, expiresAtStr, signature] = decoded.split(':')
    const expiresAt = parseInt(expiresAtStr, 10)

    if (tokenEmail !== email.toLowerCase()) return false
    if (Date.now() > expiresAt) return false

    const expectedPayload = `${tokenEmail}:${expiresAtStr}`
    const expectedSignature = crypto.createHmac('sha256', secret).update(expectedPayload).digest('hex')
    return signature === expectedSignature
  } catch {
    return false
  }
}
