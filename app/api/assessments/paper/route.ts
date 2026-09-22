import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import { claimsFromRequest } from '@/lib/assessmentToken'
import { getBank } from '@/lib/assessmentBank'
import { issuePaper, publicPaper, secondsLeft, type Paper } from '@/lib/assessmentPaper'

export const dynamic = 'force-dynamic'

/**
 * Issue (or resume) the candidate's paper. Called when they click Begin.
 *
 * - The paper is created once and stored on the application, so a reload
 *   returns the same questions with the remaining time, not a new draw.
 * - The deadline is set here, on the server.
 * - Once submitted, or once the time has run out, no paper is returned: one
 *   attempt, as the candidate is told.
 * - The response never contains answers or explanations.
 */
export async function POST(req: NextRequest) {
  const claims = claimsFromRequest(req)
  if (!claims || !claims.ref) {
    return NextResponse.json({ error: 'Your session has expired. Please re-enter your access code.' }, { status: 401 })
  }
  const bank = getBank(claims.role)
  if (!bank) return NextResponse.json({ error: 'Unknown role.' }, { status: 400 })

  await connectDB()
  const app = await Application.findOne({ ref: claims.ref }).select('ref role assessmentDate paper').lean() as {
    ref: string; role: string; assessmentDate?: Date; paper?: Paper
  } | null
  if (!app || app.role !== claims.role) {
    return NextResponse.json({ error: 'No application found for this session.' }, { status: 404 })
  }
  if (app.assessmentDate) {
    return NextResponse.json(
      { error: 'You have already submitted this assessment. Only one attempt is permitted.' },
      { status: 409 }
    )
  }

  let paper = app.paper
  if (!paper) {
    const fresh = issuePaper(bank)
    // Conditional write: if two tabs press Begin together, only one paper is
    // stored, and both tabs receive that same paper.
    const updated = await Application.findOneAndUpdate(
      { ref: app.ref, paper: { $exists: false } },
      { $set: { paper: fresh, assessmentVersion: bank.version } },
      { new: true }
    ).select('paper').lean() as { paper?: Paper } | null
    paper = updated?.paper
    if (!paper) {
      const again = await Application.findOne({ ref: app.ref }).select('paper').lean() as { paper?: Paper } | null
      paper = again?.paper
    }
  }
  if (!paper) return NextResponse.json({ error: 'Could not prepare your assessment. Please try again.' }, { status: 500 })

  const left = secondsLeft(paper)
  if (left <= 0) {
    return NextResponse.json(
      { error: 'The time for this assessment has ended. Please contact talent.acquisition@golivecompany.com.' },
      { status: 409 }
    )
  }

  return NextResponse.json({
    questions: publicPaper(bank, paper),
    secondsLeft: left,
    deadline: paper.deadline,
  })
}
