import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import { renderPdfFromHtml, archiveHeaderTemplate } from '@/lib/renderPdf'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type QResult = {
  number: number
  section: string
  type: string
  question: string
  answer: string
  correct: boolean | null
  correctAnswer: string | null
  explanation: string | null
}

type AppDoc = {
  ref: string
  name: string
  email: string
  role: string
  status: string
  assessmentScore?: string
  assessmentPct?: number
  assessmentDate?: Date
  tabSwitches?: number
  pasteTries?: number
  violations?: string[]
  transcript?: QResult[]
  notes?: string
}

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const nl2br = (s: unknown) => esc(s).replace(/\r?\n/g, '<br>')

function fmtDate(d?: Date | string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function buildHtml(app: AppDoc): string {
  const pct = app.assessmentPct ?? 0
  const verdict = pct >= 75 ? 'Strong result' : pct >= 50 ? 'Borderline — review carefully' : 'Needs improvement'
  const verdictColor = pct >= 75 ? '#1a7f37' : pct >= 50 ? '#b45309' : '#b42318'
  const violations = app.violations || []
  const integrityConcern = (app.tabSwitches || 0) > 2 || (app.pasteTries || 0) > 2
  const transcript = [...(app.transcript || [])].sort((a, b) => a.number - b.number)

  // Section-level scoring (auto-scored questions only)
  const secs: Record<string, { g: number; m: number }> = {}
  for (const q of transcript) {
    if (q.type === 'text') continue
    secs[q.section] = secs[q.section] || { g: 0, m: 0 }
    secs[q.section].m++
    if (q.correct) secs[q.section].g++
  }

  const sectionRows = Object.entries(secs).map(([s, d]) => {
    const p = d.m ? Math.round((d.g / d.m) * 100) : 0
    const c = p >= 75 ? '#1a7f37' : p >= 50 ? '#b45309' : '#b42318'
    return `<tr><td>${esc(s)}</td><td class="r" style="color:${c};font-weight:600">${d.g}/${d.m} &nbsp;·&nbsp; ${p}%</td></tr>`
  }).join('')

  const written = transcript.filter(q => q.type === 'text')
  const scored = transcript.filter(q => q.type !== 'text')

  const writtenHtml = written.length
    ? written.map(q => `
      <div class="q">
        <div class="qh"><span class="num">Q${q.number}</span><span class="sec">${esc(q.section)}</span></div>
        <p class="qt">${esc(q.question)}</p>
        <div class="ans written">${q.answer ? nl2br(q.answer) : '<em class="muted">No response entered</em>'}</div>
      </div>`).join('')
    : '<p class="muted">No written questions in this assessment.</p>'

  const scoredHtml = scored.map(q => {
    const ok = q.correct === true
    return `
      <div class="q ${ok ? 'ok' : 'bad'}">
        <div class="qh"><span class="num">Q${q.number}</span><span class="sec">${esc(q.section)}</span><span class="mark">${ok ? '✓ Correct' : '✗ Incorrect'}</span></div>
        <p class="qt">${esc(q.question)}</p>
        <p class="ans"><strong>Candidate:</strong> ${esc(q.answer)}</p>
        ${ok ? '' : `<p class="ans corr"><strong>Correct answer:</strong> ${esc(q.correctAnswer)}</p>${q.explanation ? `<p class="expl">${esc(q.explanation)}</p>` : ''}`}
      </div>`
  }).join('')

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; color: #2d3436; line-height: 1.5; margin: 0; }
  h1 { font-size: 18pt; color: #0e7c86; margin: 0 0 2mm; }
  h2 { font-size: 12.5pt; color: #2d3436; margin: 7mm 0 2.5mm; padding-bottom: 1.5mm; border-bottom: 2px solid #0e7c86; }
  .sub { color: #6b7280; font-size: 9.5pt; margin: 0 0 4mm; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm 8mm; margin-bottom: 4mm; }
  .kv { font-size: 9.5pt; } .kv b { color: #6b7280; font-weight: 600; margin-right: 2mm; }
  .scorebox { display: flex; align-items: center; gap: 6mm; background: #f0f7f8; border: 1px solid #cfe3e5; border-radius: 3mm; padding: 4mm 5mm; margin: 3mm 0 5mm; }
  .big { font-size: 26pt; font-weight: 700; color: #0e7c86; line-height: 1; }
  .verdict { font-weight: 600; font-size: 11pt; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  td { padding: 1.6mm 2.5mm; border-bottom: 1px solid #e5e7eb; } td.r { text-align: right; white-space: nowrap; }
  .integ { border-radius: 2.5mm; padding: 3mm 4mm; font-size: 9.5pt; margin-bottom: 3mm; }
  .integ.warn { background: #fff4e5; border: 1px solid #f5c98a; color: #7a3e00; }
  .integ.ok { background: #eef8f0; border: 1px solid #b7e0c1; color: #1a5c2a; }
  .vlog { font-family: Consolas, 'Courier New', monospace; font-size: 8.5pt; color: #4b5563; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 2mm; padding: 2.5mm 3mm; white-space: pre-wrap; }
  .q { border: 1px solid #e5e7eb; border-left: 3px solid #cbd5d8; border-radius: 2mm; padding: 2.5mm 3.5mm; margin-bottom: 2.5mm; page-break-inside: avoid; }
  .q.ok { border-left-color: #1a7f37; } .q.bad { border-left-color: #b42318; background: #fff7f6; }
  .qh { display: flex; gap: 3mm; align-items: baseline; font-size: 8.5pt; color: #6b7280; margin-bottom: 1mm; }
  .num { font-weight: 700; color: #0e7c86; } .sec { flex: 1; }
  .mark { font-weight: 700; } .q.ok .mark { color: #1a7f37; } .q.bad .mark { color: #b42318; }
  .qt { margin: 0 0 1.5mm; font-weight: 600; }
  .ans { margin: 0.8mm 0; } .ans.corr { color: #1a5c2a; }
  .ans.written { background: #fff; border: 1px dashed #cbd5d8; border-radius: 2mm; padding: 2.5mm 3mm; margin-top: 1.5mm; font-style: italic; }
  .expl { margin: 1mm 0 0; font-size: 9pt; color: #6b7280; }
  .muted { color: #9ca3af; }
  .notes { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 2mm; padding: 3mm 4mm; white-space: pre-wrap; font-size: 9.5pt; }
  .foot { margin-top: 8mm; font-size: 8pt; color: #9ca3af; text-align: center; }
</style></head>
<body>
  <h1>Assessment Transcript</h1>
  <p class="sub">${esc(app.role)} &nbsp;·&nbsp; Application ${esc(app.ref)} &nbsp;·&nbsp; Status: ${esc(app.status)}</p>

  <div class="grid">
    <div class="kv"><b>Candidate</b> ${esc(app.name)}</div>
    <div class="kv"><b>Email</b> ${esc(app.email)}</div>
    <div class="kv"><b>Assessed</b> ${fmtDate(app.assessmentDate)}</div>
    <div class="kv"><b>Generated</b> ${fmtDate(new Date())}</div>
  </div>

  <div class="scorebox">
    <div class="big">${esc(app.assessmentScore || '—')}</div>
    <div>
      <div class="verdict" style="color:${verdictColor}">${verdict}</div>
      <div class="sub" style="margin:0">${pct}% on auto-scored questions · ${scored.length} scored · ${written.length} written (interviewer review)</div>
    </div>
  </div>

  <h2>Score by section</h2>
  <table>${sectionRows || '<tr><td class="muted">No section data</td></tr>'}</table>

  <h2>Integrity</h2>
  <div class="integ ${integrityConcern ? 'warn' : 'ok'}">
    ${integrityConcern ? '<strong>Integrity concern —</strong> multiple violations detected. Review the session recording before making any hiring decision.' : 'No integrity concerns above threshold.'}
    &nbsp; Tab/window switches: <strong>${app.tabSwitches || 0}</strong> &nbsp;·&nbsp; Paste attempts: <strong>${app.pasteTries || 0}</strong> &nbsp;·&nbsp; Logged events: <strong>${violations.length}</strong>
  </div>
  ${violations.length ? `<div class="vlog">${violations.map(esc).join('\n')}</div>` : ''}

  <h2>Written responses — interviewer review</h2>
  ${writtenHtml}

  <h2>Question-by-question</h2>
  ${scoredHtml || '<p class="muted">No scored questions recorded.</p>'}

  ${app.notes ? `<h2>Interviewer notes (as at generation)</h2><div class="notes">${esc(app.notes)}</div>` : ''}

  <p class="foot">Confidential — candidate personal data processed under the Nigeria Data Protection Act 2023. Retain only as long as necessary for the recruitment decision.</p>
</body></html>`
}

// Admin: download a candidate's assessment transcript as PDF
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string })?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const ref = new URL(req.url).searchParams.get('ref')
  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })

  await connectDB()
  const app = (await Application.findOne({ ref }).lean()) as AppDoc | null
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!app.transcript || app.transcript.length === 0) {
    return NextResponse.json({ error: 'No transcript on record for this application' }, { status: 404 })
  }

  try {
    const pdf = await renderPdfFromHtml(
      buildHtml(app),
      archiveHeaderTemplate('GoLive Digital Solutions — Candidate Assessment', app.ref)
    )
    const safeName = app.name.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '')
    const filename = `${app.ref}_${safeName}_transcript.pdf`
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('[transcript] render failed:', e)
    return NextResponse.json({ error: 'PDF render failed' }, { status: 500 })
  }
}
