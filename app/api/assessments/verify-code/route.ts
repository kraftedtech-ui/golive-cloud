import { NextRequest, NextResponse } from 'next/server'

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
    return NextResponse.json({
      valid,
      message: valid ? 'Access granted.' : 'Invalid access code. Please check the code sent to you and try again.',
    })
  } catch (err) {
    console.error('[verify-code]', err)
    return NextResponse.json({ valid: false, message: 'Verification failed.' }, { status: 500 })
  }
}
