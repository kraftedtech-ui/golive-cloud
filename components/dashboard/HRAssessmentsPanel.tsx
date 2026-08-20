"use client"
import { useEffect, useState } from "react"
import { Download, RefreshCw, Video, TrendingUp, TrendingDown, Minus,
         ChevronDown, ChevronUp, AlertTriangle, CheckCircle, XCircle,
         MessageSquare, Hash, User, Mail, Briefcase, Clock } from "lucide-react"

type QResult = {
  number: number; section: string; type: string; question: string
  answer: string; correct: boolean | null; correctAnswer: string | null; explanation: string | null
}

type Application = {
  _id: string; ref: string; name: string; email: string; role: string
  status: string; assessmentScore?: string; assessmentPct?: number
  assessmentDate?: string; assessmentFilename?: string
  tabSwitches?: number; pasteTries?: number; violations?: string[]
  transcript?: QResult[]; notes?: string; createdAt: string
}

const STATUS_FLOW = ['applied','assessed','shortlisted','interviewed','offered','onboarded','rejected']
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
    setUpdatingStatus(ref)
    try {
      await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref, status })
      })
      setApps(prev => prev.map(a => a.ref === ref ? { ...a, status } : a))
    } finally { setUpdatingStatus(null) }
  }

  async function saveNotes(ref: string) {
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref, notes: notes[ref] || '' })
    })
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
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
            className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-foreground bg-white">
            <option value="">All statuses</option>
            {STATUS_FLOW.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
          <button onClick={load}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors">
            <RefreshCw className="size-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-7 divide-x divide-border border-b border-border">
        {STATUS_FLOW.map(s => {
          const count = apps.filter(a=>a.status===s).length
          return (
            <button key={s} onClick={()=>setFilterStatus(filterStatus===s?'':s)}
              className={`px-3 py-2 text-center transition-colors hover:bg-secondary/30 ${filterStatus===s?'bg-secondary/50':''}`}>
              <p className={`text-base font-semibold ${count>0?'text-foreground':'text-muted-foreground/40'}`}>{count}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{s}</p>
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
          {apps.map(app => (
            <div key={app._id}>
              {/* Application row */}
              <div className="px-5 py-4 hover:bg-secondary/10 transition-colors">
                <div className="flex items-start gap-4">

                  {/* Left — candidate info */}
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
                    {app.assessmentScore && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-semibold ${(app.assessmentPct||0)>=75?'text-green-700':(app.assessmentPct||0)>=50?'text-amber-700':'text-red-600'}`}>
                          Score: {app.assessmentScore} ({app.assessmentPct}%)
                        </span>
                        {app.assessmentDate && (
                          <span className="text-xs text-muted-foreground">· Assessed {new Date(app.assessmentDate).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right — actions */}
                  <div className="flex flex-col gap-2 items-end shrink-0">
                    {/* Status update */}
                    <select
                      value={app.status}
                      disabled={updatingStatus === app.ref}
                      onChange={e => updateStatus(app.ref, e.target.value)}
                      className="rounded-lg border border-border px-2 py-1 text-xs text-foreground bg-white"
                    >
                      {STATUS_FLOW.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
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
                        placeholder="Add notes about this candidate — interview observations, decisions, follow-ups..."
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
                    <p className="text-xs text-muted-foreground italic">No transcript — submitted before transcript recording was enabled.</p>
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
