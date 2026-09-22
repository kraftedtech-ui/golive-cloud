import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import { signAssessmentToken } from '@/lib/assessmentToken'
import { normaliseCode } from '@/lib/recruitment'
import { getBank } from '@/lib/assessmentBank'

/**
 * The question count and time limit the candidate will actually get, taken
 * from the bank so the pre-assessment screens can never disagree with the
 * paper the server issues. (They used to be typed into each page by hand.)
 */
function formatFor(role: string): { count?: number; minutes?: number } {
  const bank = getBank(role)
  if (!bank) return {}
  const written = bank.questions.filter((q) => q.type === 'text').length
  const marked = bank.questions.length - written
  const drawn = bank.draw && bank.draw < marked ? bank.draw : marked
  return { count: drawn + written, minutes: bank.minutes }
}

export const dynamic = 'force-dynamic'

/**
 * The shared per-role codes stay valid for candidates who were sent one by
 * hand before personal codes existed. Remove these variables from .env.local
 * once nobody holds one and the shared path disappears.
 */
const SHARED_CODES: Record<string, string | undefined> = {
  'Operations Coordinator':           process.env.ASSESSMENT_CODE_OPS,
  'Social Media & Community Manager': process.env.ASSESSMENT_CODE_SOCIAL,
  'Hosting Support Technician':       process.env.ASSESSMENT_CODE_HOSTING,
  'Sales & Support Associate':        process.env.ASSESSMENT_CODE_SALES,
}

const unavailable = () => NextResponse.json(
  { valid: false, message: 'The assessment is temporarily unavailable. Please contact talent.acquisition@golivecompany.com.' },
  { status: 503 }
)

export async function POST(req: NextRequest) {
  try {
    const { code, role } = await req.json()
    if (!code || !role) {
      return NextResponse.json({ valid: false, message: 'Code and role required.' }, { status: 400 })
    }

    // 1. A personal code, issued on application. It identifies the applicant,
    //    so the token is bound to them straight away and the intake form is
    //    skipped: they have already told us who they are.
    const personal = normaliseCode(code)
    if (/^[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(personal)) {
      await connectDB()
      const app = await Application.findOne({ accessCode: personal })
        .select('ref name email role status codeExpiresAt assessmentDate paper').lean() as {
          ref: string; name: string; email: string; role: string; status: string
          codeExpiresAt?: Date; assessmentDate?: Date
        } | null
      if (app) {
        if (app.role !== role) {
          return NextResponse.json({ valid: false, message: `This code is for the ${app.role} assessment. Please use the link from your application email.` })
        }
        if (app.assessmentDate) {
          return NextResponse.json({ valid: false, message: 'This assessment has already been submitted. Only one attempt is permitted.' })
        }
        if (app.status === 'lapsed' || (app.codeExpiresAt && app.codeExpiresAt.getTime() < Date.now())) {
          return NextResponse.json({ valid: false, message: 'The window for this assessment has closed. Please contact talent.acquisition@golivecompany.com if you believe this is an error.' })
        }
        const token = signAssessmentToken({ role: app.role, ref: app.ref, email: app.email, name: app.name })
        if (!token) return unavailable()
        return NextResponse.json({
          valid: true, token, registered: true,
          ref: app.ref, name: app.name, email: app.email,
          ...formatFor(app.role),
          message: 'Access granted.',
        })
      }
    }

    // 2. The shared role code, for candidates invited before personal codes.
    const expected = SHARED_CODES[role]
    if (expected && String(code).trim().toUpperCase() === expected.toUpperCase()) {
      const token = signAssessmentToken({ role })
      if (!token) return unavailable()
      return NextResponse.json({ valid: true, token, registered: false, ...formatFor(role), message: 'Access granted.' })
    }

    return NextResponse.json({
      valid: false,
      message: 'That access code was not recognised. Please check the code in your application email and try again.',
    })
  } catch (err) {
    console.error('[verify-code]', err)
    return NextResponse.json({ valid: false, message: 'Verification failed.' }, { status: 500 })
  }
}
