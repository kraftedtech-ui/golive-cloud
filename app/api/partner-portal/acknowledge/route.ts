import { NextResponse } from 'next/server'
import { currentPartner } from '@/lib/partnerSession'
import { currentSchedule } from '@/lib/commissionSchedule'

export const dynamic = 'force-dynamic'

/** Partner (session): acknowledge the commission schedule version now in force. Recorded on their timeline. */
export async function POST() {
  const app = await currentPartner()
  if (!app) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  const cur = await currentSchedule()
  if (!cur?.version) return NextResponse.json({ ok: true })
  const now = new Date()
  app.scheduleAck = { version: cur.version, at: now }
  app.markModified('scheduleAck')
  app.timeline.push({ at: now, by: app.applicant.email, action: `Acknowledged commission schedule version ${cur.version}` })
  await app.save()
  return NextResponse.json({ ok: true })
}
