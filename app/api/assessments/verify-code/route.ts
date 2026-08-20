import { NextRequest, NextResponse } from 'next/server'
import { signAssessmentToken } from '@/lib/assessmentToken'

export const dynamic = 'force-dynamic'

const CODES: Record<string, string | undefined> = {
  'Operations Coordinator':          process.env.ASSESSMENT_CODE_OPS,
  'Social Media & Community Manager': process.env.ASSESSMENT_CODE_SOCIAL,
  'Hosting Support Technician':       process.env.ASSESSMENT_CODE_HOSTING,
  'Sales & Support Associate':        process.env.ASSESSMENT_CODE_SALES,
}

export async function POST(req: NextRequest) {
  try {
    const { code, role } = await req.json()
    if (!code || !role) {
      return NextResponse.json({ valid: false, message: 'Code and role required.' }, { status: 400 })
    }
    const expected = CODES[role]
    if (!expected) {
      return NextResponse.json({ valid: false, message: 'Unknown role.' }, { status: 400 })
    }
    const valid = code.trim().toUpperCase() === expected.toUpperCase()
    if (!valid) {
      return NextResponse.json({
        valid: false,
        message: 'Invalid access code. Please check the code sent to you and try again.',
      })
    }

    // Passing the gate is what grants access to the assessment endpoints.
    // Previously this returned only a boolean and the client decided whether
    // to proceed, so the gate could be skipped entirely by calling the other
    // routes directly with the constant published in the page source.
    const token = signAssessmentToken({ role })
    if (!token) {
      return NextResponse.json(
        { valid: false, message: 'Assessment is temporarily unavailable. Please contact talent.acquisition@golivecompany.com.' },
        { status: 503 }
      )
    }

    return NextResponse.json({ valid: true, token, message: 'Access granted.' })
  } catch (err) {
    console.error('[verify-code]', err)
    return NextResponse.json({ valid: false, message: 'Verification failed.' }, { status: 500 })
  }
}
