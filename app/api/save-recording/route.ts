import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { Resend } from 'resend'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import { claimsFromRequest } from '@/lib/assessmentToken'

const resend = new Resend(process.env.RESEND_API_KEY)

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const claims = claimsFromRequest(req)
    if (!claims || !claims.ref) {
      return NextResponse.json(
        { error: 'Your session has expired. Please re-enter your access code.' },
        { status: 401 }
      )
    }

    const recordingsDir = path.join(process.cwd(), 'recordings')
    await mkdir(recordingsDir, { recursive: true })

    const formData = await req.formData()
    const file = formData.get('recording') as File | null
    // From the signed token, never the form body. Otherwise anyone holding
    // the endpoint URL could post a recording under another candidate's name
    // and score, and trigger an email from talent.acquisition@ saying so.
    const candidate = claims.name || 'unknown'
    const email = claims.email || ''
    const role = claims.role
    const score = (formData.get('score') as string) || '0'
    const transcriptRaw = (formData.get('transcript') as string) || '[]'
    const violationsRaw = (formData.get('violations') as string) || '[]'
    const tabSwitches = parseInt(formData.get('tabSwitches') as string || '0')
    const pasteTries = parseInt(formData.get('pasteTries') as string || '0')
    const appRef = claims.ref

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // The upload token is embedded in public HTML, so this endpoint must be
    // treated as reachable by anyone. Validate before buffering: file.size and
    // file.type are readable without consuming the body, so an oversized or
    // wrong-typed upload is rejected before it occupies memory or disk.
    // Largest genuine submission to date is ~126 MB.
    const MAX_UPLOAD_BYTES = 200 * 1024 * 1024 // 200 MB
    if (file.size > MAX_UPLOAD_BYTES) {
      console.warn('[save-recording] Rejected oversized upload:', file.size)
      return NextResponse.json({ error: 'Recording too large' }, { status: 413 })
    }
    if (file.type && !/^(video|audio)\//.test(file.type)) {
      console.warn('[save-recording] Rejected file type:', file.type)
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 })
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const safeName = candidate.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)
    const safeRole = role.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)
    const filename = `${timestamp}_${safeName}_${safeRole}_score${score}.webm`
    const filepath = path.join(recordingsDir, filename)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer)

    const sizeMB = (buffer.length / 1024 / 1024).toFixed(1)
    const [got, max] = score.split('-')
    const pct = max ? Math.round((parseInt(got) / parseInt(max)) * 100) : 0
    const verdict = pct >= 75 ? 'Strong result' : pct >= 50 ? 'Borderline' : 'Needs improvement'
    const portalUrl = 'https://cloud.golivecompany.com/portal'

    resend.emails.send({
      from: 'GoLive Digital Solutions <talent.acquisition@golivecompany.com>',
      to: 'talent.acquisition@golivecompany.com',
      subject: `Assessment submitted — ${candidate} · ${role} · ${got}/${max} (${pct}%)`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background:#f4f7fb;padding:24px;border-radius:12px">
          <div style="background:#0d2233;border-radius:8px;padding:20px 24px;margin-bottom:20px">
            <h2 style="color:#00c8c8;margin:0;font-size:18px">Assessment Submission Received</h2>
            <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:12px">Operations Coordinator — GoLive Digital Solutions</p>
          </div>
          <div style="background:#fff;border-radius:8px;padding:20px 24px;border:1px solid #e3e9f0">
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:8px 0;color:#5c7184;width:140px">Candidate</td><td style="padding:8px 0;font-weight:600;color:#0d2233">${candidate}</td></tr>
              <tr><td style="padding:8px 0;color:#5c7184">Score</td><td style="padding:8px 0;font-weight:600;color:${pct>=75?'#3B6D11':pct>=50?'#854F0B':'#A32D2D'}">${got}/${max} &nbsp;·&nbsp; ${pct}% &nbsp;·&nbsp; ${verdict}</td></tr>
              <tr><td style="padding:8px 0;color:#5c7184">Role</td><td style="padding:8px 0;color:#0d2233">${role}</td></tr>
              <tr><td style="padding:8px 0;color:#5c7184">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#0096c7">${email || 'Not provided'}</a></td></tr>
              <tr><td style="padding:8px 0;color:#5c7184">Submitted</td><td style="padding:8px 0;color:#0d2233">${new Date().toLocaleString('en-GB',{dateStyle:'full',timeStyle:'short'})}</td></tr>
              <tr><td style="padding:8px 0;color:#5c7184">Recording</td><td style="padding:8px 0;color:#0d2233">${filename} &nbsp;(${sizeMB} MB)</td></tr>
            </table>
            <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e3e9f0">
              <a href="${portalUrl}" style="display:inline-block;background:#0F6E56;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px">View in Portal →</a>
            </div>
          </div>
          <p style="color:#94A3B8;font-size:11px;text-align:center;margin-top:16px">GoLive Digital Solutions Company Ltd · RC1644767</p>
        </div>
      `
    }).catch((e: Error) => console.error('[save-recording] Email error:', e))

    // Write JSON sidecar for clean metadata retrieval
    let transcript = []
    let violations = []
    try { transcript = JSON.parse(transcriptRaw) } catch {}
    try { violations = JSON.parse(violationsRaw) } catch {}
    const meta = {
      candidate, email, role, score,
      sizeMB: (buffer.length/1024/1024).toFixed(1),
      submitted: new Date().toISOString(),
      tabSwitches, pasteTries,
      transcript, violations,
    }
    await writeFile(filepath.replace('.webm', '.json'), JSON.stringify(meta, null, 2))
    console.log('[save-recording] Saved:', filename, '— size:', buffer.length)

    // Update Application record with assessment results
    if (appRef) {
      try {
        await connectDB()
        const [got, max] = score.split('-')
        const pct = max ? Math.round((parseInt(got) / parseInt(max)) * 100) : 0
        await Application.findOneAndUpdate(
          { ref: appRef },
          {
            status: 'assessed',
            assessmentScore: `${got}/${max}`,
            assessmentPct: pct,
            assessmentDate: new Date(),
            assessmentFilename: filename,
            tabSwitches, pasteTries,
            violations, transcript,
          }
        )
      } catch (e) { console.error('[save-recording] app update error:', e) }
    }
    return NextResponse.json({ success: true, filename })
  } catch (err) {
    console.error('[save-recording] Error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
