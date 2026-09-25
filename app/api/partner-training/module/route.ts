import { NextRequest, NextResponse } from 'next/server'
import { loadByToken, clientIp } from '../_load'
import { trainingState } from '@/lib/partnerTrainingFlow'
import { MODULES } from '@/lib/partnerTraining'

export const dynamic = 'force-dynamic'

/** Partner (token): record a module as completed. Modules must be completed in order. */
export async function POST(req: NextRequest) {
  let body: { token?: string; no?: number; confirmed?: boolean }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }) }
  const app = await loadByToken(body.token)
  if (!app) return NextResponse.json({ error: 'This training link is not valid or has expired.' }, { status: 401 })
  const no = Number(body.no)
  const mod = MODULES.find((m) => m.no === no)
  if (!mod) return NextResponse.json({ error: 'Unknown module' }, { status: 400 })
  if (body.confirmed !== true) return NextResponse.json({ error: 'Please confirm you have read and understood the module.' }, { status: 400 })

  const state = trainingState(app)
  if (!state.open) return NextResponse.json({ error: state.closedReason }, { status: 409 })
  if (state.completed[no]) return NextResponse.json({ ok: true, state })
  if (state.nextModule !== no) {
    return NextResponse.json({ error: no !== 1 && !state.integrity.passed ? 'Pass the integrity check before continuing to this module.' : 'Complete the modules in order.' }, { status: 409 })
  }
  const now = new Date()
  app.training = app.training || { modules: [] }
  app.training.modules.push({ no, completedAt: now, ip: clientIp(req.headers) })
  app.markModified('training')
  app.timeline.push({ at: now, by: app.applicant.email, action: `Training: Module ${no} completed`, note: `${mod.title}. Confirmed: \u201c${mod.confirm}\u201d` })
  await app.save()
  return NextResponse.json({ ok: true, state: trainingState(app) })
}
