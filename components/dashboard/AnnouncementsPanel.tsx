'use client'
import { useState, useEffect, useCallback } from 'react'

interface Announcement { _id: string; title: string; body: string; priority: 'normal' | 'high' | 'urgent'; createdBy: string; pinned: boolean; createdAt: string }

const PRIORITY_STYLES = {
  normal: 'bg-blue-50 border-blue-200 text-blue-900',
  high: 'bg-amber-50 border-amber-200 text-amber-900',
  urgent: 'bg-red-50 border-red-200 text-red-900',
}

const PRIORITY_BADGE = {
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-red-100 text-red-700',
}

const PRIORITY_TICKER = {
  normal: 'bg-primary text-white',
  high: 'bg-amber-500 text-white',
  urgent: 'bg-red-600 text-white',
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function AnnouncementsPanel({ userRole, userName }: { userRole: string; userName: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', body: '', priority: 'normal', pinned: false })

  const isAdmin = userRole === 'admin'

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/announcements')
      const data = await res.json()
      setAnnouncements(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAnnouncements() }, [fetchAnnouncements])

  async function postAnnouncement() {
    if (!form.title.trim() || !form.body.trim()) return
    await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, createdBy: userName }),
    })
    setForm({ title: '', body: '', priority: 'normal', pinned: false })
    setShowForm(false)
    fetchAnnouncements()
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm('Delete this announcement?')) return
    await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
    fetchAnnouncements()
  }

  const latest = announcements[0]
  const rest = announcements.slice(1)

  return (
    <div className="space-y-4">
      {/* Latest announcement ticker/banner */}
      {latest && (
        <div className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${PRIORITY_STYLES[latest.priority]}`}>
          <div className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase flex-shrink-0 mt-0.5 ${PRIORITY_TICKER[latest.priority]}`}>
            {latest.priority === 'urgent' ? '🚨 Urgent' : latest.priority === 'high' ? '⚠️ High' : '📢 New'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{latest.title}</p>
            <p className="text-xs mt-0.5 opacity-80 leading-relaxed line-clamp-2">{latest.body}</p>
            {latest.body.length > 120 && (
              <button onClick={() => setExpanded(expanded === latest._id ? null : latest._id)}
                className="text-[11px] font-medium mt-1 opacity-70 hover:opacity-100">
                {expanded === latest._id ? 'Show less' : 'Read more'}
              </button>
            )}
            {expanded === latest._id && (
              <p className="text-xs mt-1 opacity-80 leading-relaxed">{latest.body}</p>
            )}
          </div>
          <span className="text-[11px] opacity-60 flex-shrink-0">{timeAgo(latest.createdAt)}</span>
          {isAdmin && (
            <button onClick={() => deleteAnnouncement(latest._id)} className="text-xs opacity-40 hover:opacity-80 flex-shrink-0">✕</button>
          )}
        </div>
      )}

      {/* Main panel */}
      <div className="rounded-2xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">Team</p>
            <h2 className="mt-0.5 text-base font-semibold text-foreground">Announcements</h2>
            <p className="text-xs text-muted-foreground">{announcements.length} total</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowForm(!showForm)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              + Post Announcement
            </button>
          )}
        </div>

        {showForm && isAdmin && (
          <div className="border-b border-border p-4 space-y-3 bg-secondary/20">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Priority</label>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-white">
                  <option value="normal">📢 Normal</option>
                  <option value="high">⚠️ High</option>
                  <option value="urgent">🚨 Urgent</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.pinned} onChange={e => setForm(p => ({ ...p, pinned: e.target.checked }))}
                    className="rounded" />
                  Pin to top
                </label>
              </div>
            </div>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Announcement title..." className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
            <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
              placeholder="Announcement body..." rows={3}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm resize-none" />
            <div className="flex gap-2">
              <button onClick={postAnnouncement} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">Post</button>
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="divide-y divide-border">
          {loading ? (
            <p className="px-5 py-6 text-sm text-muted-foreground text-center">Loading...</p>
          ) : announcements.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground text-center">No announcements yet.</p>
          ) : (
            announcements.map((a, idx) => (
              <div key={a._id} className={`px-5 py-4 hover:bg-secondary/20 transition-colors ${idx === 0 ? 'bg-secondary/10' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {a.pinned && <span className="text-[10px] font-bold text-primary">📌 PINNED</span>}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${PRIORITY_BADGE[a.priority]}`}>{a.priority}</span>
                      {idx === 0 && <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold">LATEST</span>}
                    </div>
                    <p className="text-sm font-semibold text-foreground">{a.title}</p>
                    <p className={`text-xs text-muted-foreground mt-0.5 leading-relaxed ${expanded === a._id ? '' : 'line-clamp-2'}`}>{a.body}</p>
                    {a.body.length > 100 && (
                      <button onClick={() => setExpanded(expanded === a._id ? null : a._id)}
                        className="text-[11px] font-medium text-primary mt-1">
                        {expanded === a._id ? 'Show less' : 'Read more'}
                      </button>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1.5">Posted by {a.createdBy} · {timeAgo(a.createdAt)}</p>
                  </div>
                  {isAdmin && (
                    <button onClick={() => deleteAnnouncement(a._id)} className="text-xs text-muted-foreground hover:text-red-500 flex-shrink-0 mt-1">✕</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
