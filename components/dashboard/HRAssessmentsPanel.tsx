"use client"
import { useEffect, useState } from "react"
import { Download, RefreshCw, Video, FileText, TrendingUp, TrendingDown, Minus,
         ChevronDown, ChevronUp, AlertTriangle, CheckCircle, XCircle,
         MessageSquare, Hash, User, Mail, Briefcase, Clock } from "lucide-react"

type QResult = {
  number: number; section: string; type: string; question: string
  answer: string; correct: boolean | null; correctAnswer: string | null; explanation: string | null
}

type Application = {
  _id: string; ref: string; name: string; email: string; role: string
  status: string; assessmentScore?: string; assessmentPct?: number
  eligible?: boolean; passMark?: number; declineDueAt?: string; declinedAt?: string
  accessCode?: string; codeSentAt?: string; codeExpiresAt?: string; reminderSentAt?: string; paper?: unknown; source?: string
  assessmentDate?: string; assessmentFilename?: string
  tabSwitches?: number; pasteTries?: number; violations?: string[]
  transcript?: QResult[]; notes?: string; shortlistEmailSentAt?: string; rejectionEmailSentAt?: string;
  offer?: { sentAt?: string; salary?: number; startDate?: string; candidateSignedAt?: string; candidateSignedName?: string; mdSignedAt?: string };
  employeeNumber?: string;
  onboarding?: { docs?: { filename: string; label?: string }[]; sentAt?: string; acknowledgedAt?: string; mdAckAt?: string };
  screening?: { status?: string; clearedAt?: string; link?: string; linkSentAt?: string };
  provisionedUserId?: string; actualStartDate?: string; createdAt: string
}

const STATUS_FLOW = ['applied','assessed','shortlisted','interviewed','offered','onboarded','rejected','not_progressed','lapsed']
const STATUS_LABEL: Record<string, string> = { not_progressed: 'Not progressed', lapsed: 'Lapsed' }
const labelOf = (s: string) => STATUS_LABEL[s] || s.charAt(0).toUpperCase() + s.slice(1)
const STATUS_COLORS: Record<string,string> = {
  applied:     'bg-blue-50 text-blue-700 border-blue-200',
  assessed:    'bg-purple-50 text-purple-700 border-purple-200',
  shortlisted: 'bg-amber-50 text-amber-700 border-amber-200',
  interviewed: 'bg-orange-50 text-orange-700 border-orange-200',
  offered:     'bg-teal-50 text-teal-700 border-teal-200',
  onboarded:   'bg-green-50 text-green-700 border-green-200',
  rejected:    'bg-red-50 text-red-700 border-red-200',
}

export default function HRAssessmentsPanel() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string,string>>({})
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [reviewOnly, setReviewOnly] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterRole) params.set('role', filterRole)
      if (filterStatus) params.set('status', filterStatus)
      const res = await fetch(`/api/applications?${params}`)
      const data = await res.json()
      setApps(data.applications || [])
      const n: Record<string,string> = {}
      data.applications?.forEach((a: Application) => { n[a.ref] = a.notes || '' })
      setNotes(n)
    } catch { setApps([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filterRole, filterStatus])

  async function updateStatus(ref: string, status: string) {
    const app = apps.find(a => a.ref === ref)
    let resendInvite = false
    let offerTerms: { salary: number; startDate: string; deadlineDays: number } | null = null
    if (status === 'shortlisted' && app) {
      if (!app.shortlistEmailSentAt) {
        if (!window.confirm(
          `Move ${app.name} to Shortlisted?\n\nThis will automatically email the interview invitation for "${app.role}", including the salary range and booking link, to ${app.email}.`
        )) { load(); return }
      } else {
        if (!window.confirm(
          `${app.name} already received the invitation on ${new Date(app.shortlistEmailSentAt).toLocaleString()}.\n\nSend it again?`
        )) { load(); return }
        resendInvite = true
      }
    }
    if (status === 'rejected' && app && app.status === 'interviewed' && !app.rejectionEmailSentAt) {
      if (!window.confirm(
        `Reject ${app.name}?\n\nBecause they were interviewed, this will email them a polite rejection letter for "${app.role}".`
      )) { load(); return }
    }
    if (status === 'offered' && app && !app.offer?.sentAt) {
      if (!window.confirm(
        `Offer the ${app.role} role to ${app.name}?\n\nThis will email them a digital offer letter for electronic signature.`
      )) { load(); return }
      const salaryStr = window.prompt('Monthly gross salary in Naira (numbers only, e.g. 250000):', '')
      if (salaryStr === null) { load(); return }
      const salary = parseInt(salaryStr.replace(/[^0-9]/g, ''), 10)
      const startDate = window.prompt('Start date (YYYY-MM-DD):', '')
      if (startDate === null) { load(); return }
      const daysStr = window.prompt('Acceptance deadline in days (1-21):', '5')
      if (daysStr === null) { load(); return }
      if (!salary || salary < 10000 || !/^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) {
        alert('Invalid salary or start date. Nothing was sent, please try again.')
        load(); return
      }
      offerTerms = { salary, startDate: startDate.trim(), deadlineDays: parseInt(daysStr, 10) || 5 }
    }
    setUpdatingStatus(ref)
    try {
      const res = await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref, status, ...(resendInvite ? { resendInvite: true } : {}), ...(offerTerms ? { offer: offerTerms } : {}) })
      })
      const data = await res.json().catch(() => ({} as Record<string, unknown>))
      if (data.emailSent === true) {
        alert(`Email sent to ${app?.email || ref}.`)
      } else if (data.emailSent === false) {
        alert(`Status updated, but the email FAILED:\n${data.emailError || 'unknown error'}`)
      }
      setApps(prev => prev.map(a => a.ref === ref
        ? { ...a, status, shortlistEmailSentAt: (data.application as Application | undefined)?.shortlistEmailSentAt || a.shortlistEmailSentAt, rejectionEmailSentAt: (data.application as Application | undefined)?.rejectionEmailSentAt || a.rejectionEmailSentAt }
        : a))
    } finally { setUpdatingStatus(null) }
  }

  async function saveNotes(ref: string) {
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref, notes: notes[ref] || '' })
    })
  }

  async function downloadTranscript(ref: string, name: string) {
    setDownloading('t:' + ref)
    try {
      const res = await fetch(`/api/assessments/transcript?ref=${encodeURIComponent(ref)}`)
      if (!res.ok) { alert('Transcript download failed (' + res.status + ')'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${ref}_${name.replace(/[^a-z0-9]+/gi, '_')}_transcript.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally { setDownloading(null) }
  }

  async function mdSignOffer(ref: string, name: string) {
    if (!window.confirm(
      `Countersign ${name}'s offer as MD?\n\nThis fully executes the offer and emails the candidate their signed copy.`
    )) return
    setUpdatingStatus(ref)
    try {
      const res = await fetch('/api/offer/md-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref })
      })
      const data = await res.json().catch(() => ({} as Record<string, unknown>))
      if (!res.ok) { alert('Countersign failed: ' + (data.error || res.status)); return }
      const pos = data.position as { title: string; left: number; filled: boolean } | null | undefined
      const posLine = pos
        ? (pos.filled
            ? `\n\nHire recorded against ${pos.title}. All openings are now filled, so it shows as filled on the careers page.`
            : `\n\nHire recorded against ${pos.title}. ${pos.left} ${pos.left === 1 ? 'opening remains' : 'openings remain'} on the careers page.`)
        : `\n\nNo open position matched this role, so no hire was recorded. Record it in People (HR) > Positions if needed.`
      alert('Offer fully executed. ' + (data.emailSent ? 'The candidate has been emailed their signed copy.' : 'NOTE: the notification email failed: ' + (data.emailError || 'unknown error')) + posLine)
      load()
    } finally { setUpdatingStatus(null) }
  }

  async function downloadOfferPdf(ref: string, name: string) {
    setDownloading('o:' + ref)
    try {
      const res = await fetch(`/api/offer/pdf?ref=${encodeURIComponent(ref)}`)
      if (!res.ok) { alert('Offer PDF failed (' + res.status + ')'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${ref}_${name.replace(/[^a-z0-9]+/gi, '_')}_offer.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally { setDownloading(null) }
  }

  async function uploadOnboardDoc(ref: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 15 * 1024 * 1024) { alert('Max file size is 15 MB.'); return }
    setUpdatingStatus(ref)
    try {
      const fd = new FormData()
      fd.append('ref', ref)
      fd.append('file', file)
      const res = await fetch('/api/onboarding/upload', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({} as Record<string, unknown>))
      if (!res.ok) { alert('Upload failed: ' + (data.error || res.status)); return }
      alert('Uploaded: ' + file.name)
      load()
    } finally { setUpdatingStatus(null) }
  }

  async function sendOnboardingPack(ref: string, name: string, docCount: number, resend: boolean) {
    if (!docCount) { alert('Upload at least one onboarding document first (Add doc).'); return }
    if (!window.confirm(
      (resend ? 'RE-send' : 'Send') + ` the onboarding pack (${docCount} document${docCount > 1 ? 's' : ''}) to ${name}?\n\nThe email includes the Background Check International screening notice.`
    )) return
    setUpdatingStatus(ref)
    try {
      const res = await fetch('/api/onboarding/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref })
      })
      const data = await res.json().catch(() => ({} as Record<string, unknown>))
      if (!res.ok) { alert('Send failed: ' + (data.error || res.status)); return }
      alert('Onboarding pack sent to ' + name + '.')
      load()
    } finally { setUpdatingStatus(null) }
  }

  async function setScreening(ref: string, name: string, status: string, existingLink?: string) {
    if (status === 'cleared' && !window.confirm(
      `Mark ${name}'s Background Check International screening as CLEARED?\n\nThis unlocks portal account creation for them.`
    )) { load(); return }

    // Moving to "in progress" is the moment the candidate needs their BCI
    // link, so ask for it here rather than leaving it as a separate step
    // someone has to remember.
    let link = ''
    let note = ''
    let sendLink = false
    if (status === 'in_progress') {
      const entered = window.prompt(
        `Background Check International link for ${name}\n\nPaste the candidate-facing BCI URL. Leave blank to set the status without emailing them.`,
        existingLink || 'https://'
      )
      if (entered === null) { load(); return }
      link = entered.trim()
      if (link && link !== 'https://') {
        if (!/^https:\/\//i.test(link)) { alert('The link must start with https://'); load(); return }
        const extra = window.prompt(
          `Optional line to add to the email (leave blank for none):`, ''
        )
        if (extra === null) { load(); return }
        note = extra.trim()
        sendLink = window.confirm(
          `Email this link to ${name} now?\n\n${link}\n\nThe message explains that BCI may also contact them directly and that engagement remains conditional on satisfactory checks.`
        )
      } else {
        link = ''
      }
    }

    setUpdatingStatus(ref)
    try {
      const res = await fetch('/api/onboarding/screening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref, status, link: link || undefined, note: note || undefined, sendLink })
      })
      const data = await res.json().catch(() => ({} as Record<string, unknown>))
      if (!res.ok) { alert('Screening update failed: ' + (data.error || res.status)); return }
      if (sendLink) {
        alert(data.emailSent
          ? `Screening link emailed to ${name}.`
          : `Status saved, but the email did NOT send: ${data.emailError || 'unknown error'}`)
      }
      load()
    } finally { setUpdatingStatus(null) }
  }

  // Re-sending is always deliberate: it never happens as a side effect of a
  // status change.
  async function resendScreeningLink(ref: string, name: string, link?: string) {
    // Also the capture path: a candidate can already be at in_progress with no
    // link stored (status set before the link existed, or set by hand), so ask
    // for one rather than doing nothing.
    let useLink = link || ''
    if (!useLink) {
      const entered = window.prompt(
        `Background Check International link for ${name}\n\nPaste the candidate-facing BCI URL.`,
        'https://'
      )
      if (entered === null) return
      useLink = entered.trim()
      if (!useLink || useLink === 'https://') return
      if (!/^https:\/\//i.test(useLink)) { alert('The link must start with https://'); return }
    }
    if (!window.confirm(`Email the BCI screening link to ${name}?\n\n${useLink}`)) return
    link = useLink
    setUpdatingStatus(ref)
    try {
      const res = await fetch('/api/onboarding/screening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref, status: 'in_progress', link, sendLink: true })
      })
      const data = await res.json().catch(() => ({} as Record<string, unknown>))
      if (!res.ok) { alert('Re-send failed: ' + (data.error || res.status)); return }
      alert(data.emailSent ? `Link re-sent to ${name}.` : `Did NOT send: ${data.emailError || 'unknown error'}`)
      load()
    } finally { setUpdatingStatus(null) }
  }

  async function provisionAccount(ref: string, name: string) {
    const workEmail = window.prompt(`Work email for ${name} (e.g. firstname.lastname@golivecompany.com):`, '')
    if (workEmail === null) return
    const startDate = window.prompt('Confirmed start date (YYYY-MM-DD):', '')
    if (startDate === null) return
    if (!window.confirm(
      `Create the portal account for ${name}?\n\nEmail: ${workEmail}\nStart date: ${startDate}\n\nAccess level is set by their role. They will be emailed sign-in details.`
    )) return
    setUpdatingStatus(ref)
    try {
      const res = await fetch('/api/onboarding/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref, workEmail: workEmail.trim(), startDate: startDate.trim() })
      })
      const data = await res.json().catch(() => ({} as Record<string, unknown>))
      if (!res.ok) { alert('Provisioning failed: ' + (data.error || res.status)); return }
      const u = data.user as { role?: string; commissionEligible?: boolean } | undefined
      alert(
        'Portal account created.\n\nAccess: ' + (u?.role || '?') +
        '\nCommission: ' + (u?.commissionEligible ? 'eligible' : 'not applicable') +
        (data.emailSent ? '\n\nSign-in details emailed to them.' : '\n\nEMAIL FAILED. Temporary password: ' + (data.tempPassword || 'unknown'))
      )
      load()
    } finally { setUpdatingStatus(null) }
  }

  async function mdAckPack(ref: string, name: string) {
    if (!window.confirm(
      `Countersign ${name}'s onboarding pack?\n\nThis records your signature against the documents they have already signed.`
    )) return
    setUpdatingStatus(ref)
    try {
      const res = await fetch('/api/onboarding/md-ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref })
      })
      const data = await res.json().catch(() => ({} as Record<string, unknown>))
      if (!res.ok) { alert('Countersign failed: ' + (data.error || res.status)); return }
      alert('Onboarding pack countersigned.')
      load()
    } finally { setUpdatingStatus(null) }
  }

  async function downloadExecutedPack(ref: string, name: string) {
    setDownloading('x:' + ref)
    try {
      const res = await fetch(`/api/onboarding/executed?ref=${encodeURIComponent(ref)}`)
      if (!res.ok) {
        const d = await res.json().catch(() => ({} as Record<string, unknown>))
        alert('Executed pack failed: ' + (d.error || res.status)); return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${ref}_${name.replace(/[^a-z0-9]+/gi, '_')}_ExecutedPack.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally { setDownloading(null) }
  }

  async function download(filename: string) {
    setDownloading(filename)
    try {
      const res = await fetch(`/api/assessments/download?file=${encodeURIComponent(filename)}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
    } finally { setDownloading(null) }
  }

  const roles = [...new Set(apps.map(a => a.role))]

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">Human Resources</p>
          <h2 className="mt-0.5 text-base font-semibold text-foreground">Application Tracker</h2>
          <p className="text-xs text-muted-foreground">{apps.length} application{apps.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2 items-center">
          <select value={filterRole} onChange={e=>setFilterRole(e.target.value)}
            className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-foreground bg-white">
            <option value="">All roles</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={() => setReviewOnly(v => !v)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${reviewOnly ? 'border-green-300 bg-green-50 text-green-800' : 'border-border bg-white text-foreground hover:bg-secondary/40'}`}>
            Review queue{reviewOnly ? ': on' : ''}
          </button>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
            className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-foreground bg-white">
            <option value="">All statuses</option>
            {STATUS_FLOW.map(s => <option key={s} value={s}>{labelOf(s)}</option>)}
          </select>
          <button onClick={load}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors">
            <RefreshCw className="size-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-9 divide-x divide-border border-b border-border">
        {STATUS_FLOW.map(s => {
          const count = apps.filter(a=>a.status===s).length
          return (
            <button key={s} onClick={()=>setFilterStatus(filterStatus===s?'':s)}
              className={`px-3 py-2 text-center transition-colors hover:bg-secondary/30 ${filterStatus===s?'bg-secondary/50':''}`}>
              <p className={`text-base font-semibold ${count>0?'text-foreground':'text-muted-foreground/40'}`}>{count}</p>
              <p className="text-[10px] text-muted-foreground">{labelOf(s)}</p>
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Loading applications...</div>
      ) : apps.length === 0 ? (
        <div className="py-16 text-center">
          <Briefcase className="mx-auto size-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground">No applications yet</p>
          <p className="text-xs text-muted-foreground mt-1">Applications will appear here when candidates complete intake</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {apps.filter(a => !reviewOnly || (a.status === 'assessed' && a.eligible === true)).map(app => (
            <div key={app._id}>
              {/* Application row */}
              <div className="px-5 py-4 hover:bg-secondary/10 transition-colors">
                <div className="flex items-start gap-4">

                  {/* Left: candidate info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {app.ref}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[app.status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {app.status.charAt(0).toUpperCase()+app.status.slice(1)}
                      </span>
                      {((app.tabSwitches || 0) + (app.pasteTries || 0)) > 2 && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                          <AlertTriangle className="size-3" /> Integrity flags
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground">{app.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="size-3" />{app.email}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Briefcase className="size-3" />{app.role}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" />{new Date(app.createdAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>
                    </div>
                    {!app.assessmentScore && app.accessCode && app.status === 'applied' && (
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200">
                          Code sent{app.codeSentAt ? ' ' + new Date(app.codeSentAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : ''}{app.reminderSentAt ? ', reminded' : ''}
                        </span>
                        {app.codeExpiresAt && <span className="text-xs text-muted-foreground">Window closes {new Date(app.codeExpiresAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span>}
                      </div>
                    )}
                    {app.assessmentScore && (
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={`text-xs font-semibold ${app.eligible === true ? 'text-green-700' : app.eligible === false ? 'text-red-600' : (app.assessmentPct||0)>=75?'text-green-700':(app.assessmentPct||0)>=50?'text-amber-700':'text-red-600'}`}>
                          Score: {app.assessmentScore} ({app.assessmentPct}%)
                        </span>
                        {app.eligible === true && app.status === 'assessed' && (
                          <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-800 ring-1 ring-green-200">Eligible for review</span>
                        )}
                        {app.eligible === false && app.status === 'assessed' && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
                            Below pass mark ({app.passMark ?? 70}%){app.declineDueAt ? ', declines ' + new Date(app.declineDueAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : ''}
                          </span>
                        )}
                        {app.eligible === undefined && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 ring-1 ring-gray-200">Earlier assessment</span>
                        )}
                        {app.assessmentDate && (
                          <span className="text-xs text-muted-foreground">· Assessed {new Date(app.assessmentDate).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div className="flex flex-col gap-2 items-end shrink-0">
                    {/* Status update */}
                    <select
                      value={app.status}
                      disabled={updatingStatus === app.ref}
                      onChange={e => updateStatus(app.ref, e.target.value)}
                      className="rounded-lg border border-border px-2 py-1 text-xs text-foreground bg-white"
                    >
                      {STATUS_FLOW.map(s => (
                        <option key={s} value={s}>{labelOf(s)}</option>
                      ))}
                    </select>

                    <div className="flex gap-1.5">
                      {app.assessmentFilename && (
                        <button onClick={() => download(app.assessmentFilename!)}
                          disabled={downloading === app.assessmentFilename}
                          className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50">
                          <Video className="size-3.5" />
                          {downloading === app.assessmentFilename ? '...' : 'Recording'}
                        </button>
                      )}
                      {app.transcript && app.transcript.length > 0 && (
                        <button onClick={() => downloadTranscript(app.ref, app.name)}
                          disabled={downloading === 't:' + app.ref}
                          className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50">
                          <FileText className="size-3.5" />
                          {downloading === 't:' + app.ref ? '...' : 'Transcript'}
                        </button>
                      )}
                      <span className="text-[10px] text-muted-foreground self-center">HR v2</span>
                      {app.offer?.sentAt && (
                        <button onClick={() => downloadOfferPdf(app.ref, app.name)}
                          disabled={downloading === 'o:' + app.ref}
                          className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50">
                          <Download className="size-3.5" />
                          {downloading === 'o:' + app.ref ? '...' : (app.offer?.mdSignedAt ? 'Offer PDF ✓' : 'Offer PDF')}
                        </button>
                      )}
                      {app.offer?.candidateSignedAt && !app.offer?.mdSignedAt && (
                        <button onClick={() => mdSignOffer(app.ref, app.name)}
                          disabled={updatingStatus === app.ref}
                          className="flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-50">
                          <CheckCircle className="size-3.5" />
                          Countersign offer
                        </button>
                      )}
                      {app.offer?.mdSignedAt && (
                        <>
                          <label className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-secondary transition-colors cursor-pointer">
                            <FileText className="size-3.5" />
                            Add doc
                            <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => uploadOnboardDoc(app.ref, e)} />
                          </label>
                          <button onClick={() => sendOnboardingPack(app.ref, app.name, app.onboarding?.docs?.length || 0, !!app.onboarding?.sentAt)}
                            disabled={updatingStatus === app.ref}
                            className={app.onboarding?.acknowledgedAt
                              ? 'flex items-center gap-1 rounded-lg border border-green-300 bg-green-50 px-2 py-1 text-xs font-semibold text-green-800 transition-colors'
                              : 'flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50'}>
                            <CheckCircle className="size-3.5" />
                            {app.onboarding?.acknowledgedAt
                              ? 'Onboarding \u2713'
                              : app.onboarding?.sentAt
                                ? `Resend pack (${app.onboarding?.docs?.length || 0})`
                                : `Send pack (${app.onboarding?.docs?.length || 0})`}
                          </button>
                        </>
                      )}
                      {app.onboarding?.acknowledgedAt && !app.provisionedUserId && (
                        <select
                          value={app.screening?.status || 'pending'}
                          disabled={updatingStatus === app.ref}
                          onChange={e => setScreening(app.ref, app.name, e.target.value, app.screening?.link)}
                          className={app.screening?.status === 'cleared'
                            ? 'rounded-lg border border-green-300 bg-green-50 px-2 py-1 text-xs font-semibold text-green-800'
                            : app.screening?.status === 'failed'
                              ? 'rounded-lg border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700'
                              : 'rounded-lg border border-border bg-white px-2 py-1 text-xs text-foreground'}>
                          <option value="pending">BCI: not started</option>
                          <option value="in_progress">BCI: in progress</option>
                          <option value="cleared">BCI: cleared</option>
                          <option value="failed">BCI: failed</option>
                        </select>
                      )}
                      {app.screening?.status === 'in_progress' && (
                        <button onClick={() => resendScreeningLink(app.ref, app.name, app.screening?.link)}
                          disabled={updatingStatus === app.ref}
                          title={app.screening?.linkSentAt
                            ? 'Link sent ' + new Date(app.screening.linkSentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                            : app.screening?.link
                              ? 'Link saved but not yet emailed'
                              : 'No link captured yet'}
                          className="flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
                          {app.screening?.linkSentAt ? 'Re-send BCI link' : app.screening?.link ? 'Send BCI link' : 'Add BCI link'}
                        </button>
                      )}
                      {app.screening?.status === 'cleared' && !app.provisionedUserId && (
                        <button onClick={() => provisionAccount(app.ref, app.name)}
                          disabled={updatingStatus === app.ref}
                          className="flex items-center gap-1 rounded-lg border border-teal-300 bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition-colors disabled:opacity-50">
                          <User className="size-3.5" />
                          Create portal account
                        </button>
                      )}
                      {app.provisionedUserId && (
                        <span className="flex items-center gap-1 rounded-lg border border-green-300 bg-green-50 px-2 py-1 text-xs font-semibold text-green-800">
                          <CheckCircle className="size-3.5" />
                          Account created{app.actualStartDate ? ' · starts ' + app.actualStartDate : ''}
                        </span>
                      )}
                      {app.onboarding?.acknowledgedAt && !app.onboarding?.mdAckAt && (
                        <button onClick={() => mdAckPack(app.ref, app.name)}
                          disabled={updatingStatus === app.ref}
                          className="flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-50">
                          <CheckCircle className="size-3.5" />
                          Countersign pack
                        </button>
                      )}
                      {app.onboarding?.mdAckAt && (
                        <button onClick={() => downloadExecutedPack(app.ref, app.name)}
                          disabled={downloading === 'x:' + app.ref}
                          className="flex items-center gap-1 rounded-lg border border-green-300 bg-green-50 px-2 py-1 text-xs font-semibold text-green-800 hover:bg-green-100 transition-colors disabled:opacity-50">
                          <Download className="size-3.5" />
                          {downloading === 'x:' + app.ref ? '...' : 'Executed pack'}
                        </button>
                      )}
                      <button onClick={() => setExpanded(expanded === app.ref ? null : app.ref)}
                        className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-secondary transition-colors">
                        {expanded === app.ref ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === app.ref && (
                <div className="border-t border-border bg-secondary/10 px-5 py-4 space-y-4">

                  {/* Notes */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Interviewer notes</p>
                    <div className="flex gap-2">
                      <textarea
                        value={notes[app.ref] || ''}
                        onChange={e => setNotes(prev => ({...prev, [app.ref]: e.target.value}))}
                        onBlur={() => saveNotes(app.ref)}
                        placeholder="Add notes about this candidate: interview observations, decisions, follow-ups..."
                        className="flex-1 rounded-lg border border-border px-3 py-2 text-xs text-foreground bg-white resize-none min-h-[60px]"
                      />
                    </div>
                  </div>

                  {/* Integrity */}
                  {((app.tabSwitches || 0) > 0 || (app.pasteTries || 0) > 0) && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Integrity log</p>
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-xs text-amber-700 mb-1">
                          {app.tabSwitches || 0} tab switch{(app.tabSwitches||0)!==1?'es':''} · {app.pasteTries || 0} paste attempt{(app.pasteTries||0)!==1?'s':''}
                        </p>
                        {app.violations && app.violations.length > 0 && (
                          <div className="max-h-20 overflow-y-auto rounded bg-amber-100 px-2 py-1 font-mono text-[10px] text-amber-800">
                            {app.violations.map((v,i) => <div key={i}>{v}</div>)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Transcript */}
                  {app.transcript && app.transcript.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Assessment transcript</p>
                      <div className="space-y-2">
                        {app.transcript.map((q) => (
                          <div key={q.number} className={`rounded-lg border p-3 ${
                            q.correct === null ? 'border-border bg-white' :
                            q.correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                            <div className="flex items-start gap-2">
                              <span className="shrink-0 mt-0.5">
                                {q.correct === null ? <MessageSquare className="size-3.5 text-blue-500" /> :
                                 q.correct ? <CheckCircle className="size-3.5 text-green-600" /> :
                                 <XCircle className="size-3.5 text-red-500" />}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">{q.section} · Q{q.number}</p>
                                <p className="text-xs font-medium text-foreground mb-1 leading-relaxed">{q.question}</p>
                                <p className="text-xs text-foreground"><span className="font-medium">Answer: </span>{q.answer || <em className="text-muted-foreground">No response</em>}</p>
                                {q.correct === false && q.correctAnswer && (
                                  <p className="text-xs text-green-700 mt-0.5"><span className="font-medium">Correct: </span>{q.correctAnswer}</p>
                                )}
                                {q.correct === false && q.explanation && (
                                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{q.explanation}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : app.status !== 'applied' ? (
                    <p className="text-xs text-muted-foreground italic">No transcript. Submitted before transcript recording was enabled.</p>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
