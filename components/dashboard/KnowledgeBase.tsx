'use client'
import { useState, useEffect, useCallback } from 'react'

interface Article { _id: string; title: string; category: string; body: string; tags: string[]; createdBy: string; pinned: boolean; createdAt: string }

const CATEGORIES = ['M365 Basics', 'Migration How-Tos', 'Admin How-Tos', 'End User Guides', 'GoLive Internal', 'Security & Compliance', 'Other']

function renderMarkdown(text: string) {
  return text
    .replace(/^## (.+)$/gm, '<h2 style="font-size:15px;font-weight:600;margin:16px 0 6px;color:var(--color-text-primary)">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:13px;font-weight:600;margin:12px 0 4px;color:var(--color-text-primary)">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;font-size:12px;font-family:monospace">$1</code>')
    .replace(/^\| (.+) \|$/gm, (_: string, row: string) => {
      const cells = row.split(' | ').map((c: string) => `<td style="padding:5px 10px;border:1px solid #e5e7eb;font-size:12px">${c}</td>`).join('')
      return `<tr>${cells}</tr>`
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, (m: string) => `<table style="width:100%;border-collapse:collapse;margin:8px 0">${m}</table>`)
    .replace(/^- (.+)$/gm, '<li style="font-size:13px;line-height:1.7;margin-left:16px;list-style-type:disc">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m: string) => `<ul style="margin:6px 0">${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<li style="font-size:13px;line-height:1.7;margin-left:16px;list-style-type:decimal">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
}

export default function KnowledgeBase({ userRole, userName }: { userRole: string; userName: string }) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('All')
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'M365 Basics', body: '', tags: '', pinned: false })

  const isAdmin = userRole === 'admin'

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge')
      const data = await res.json()
      setArticles(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchArticles() }, [fetchArticles])

  async function createArticle() {
    if (!form.title.trim() || !form.body.trim()) return
    await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean), createdBy: userName }),
    })
    setForm({ title: '', category: 'M365 Basics', body: '', tags: '', pinned: false })
    setShowForm(false)
    fetchArticles()
  }

  async function deleteArticle(id: string) {
    if (!confirm('Delete this article?')) return
    await fetch(`/api/knowledge/${id}`, { method: 'DELETE' })
    if (selectedArticle?._id === id) setSelectedArticle(null)
    fetchArticles()
  }

  const categories = ['All', ...Array.from(new Set(articles.map(a => a.category)))]
  const filtered = articles.filter(a => {
    const matchCat = selectedCat === 'All' || a.category === selectedCat
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    return matchCat && matchSearch
  })

  if (selectedArticle) {
    return (
      <div className="rounded-2xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-5 py-4 flex items-center gap-3">
          <button onClick={() => setSelectedArticle(null)} className="text-sm text-primary hover:underline">← Back</button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-foreground truncate">{selectedArticle.title}</span>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">{selectedArticle.category}</span>
              <h2 className="text-xl font-semibold text-foreground mt-0.5">{selectedArticle.title}</h2>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedArticle.tags.map(t => (
                  <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">{t}</span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">By {selectedArticle.createdBy} · {new Date(selectedArticle.createdAt).toLocaleDateString()}</p>
            </div>
            {isAdmin && (
              <button onClick={() => deleteArticle(selectedArticle._id)} className="text-xs text-red-500 hover:text-red-700 flex-shrink-0">Delete</button>
            )}
          </div>
          <div className="prose max-w-none text-sm leading-relaxed border-t border-border pt-4"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedArticle.body) }} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">Team</p>
            <h2 className="mt-0.5 text-base font-semibold text-foreground">Knowledge Base</h2>
            <p className="text-xs text-muted-foreground">{articles.length} articles</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowForm(!showForm)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              + New Article
            </button>
          )}
        </div>

        {showForm && isAdmin && (
          <div className="border-b border-border p-4 space-y-3 bg-secondary/20">
            <div className="grid grid-cols-2 gap-3">
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Article title..." className="rounded-lg border border-border px-3 py-2 text-sm" />
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="rounded-lg border border-border px-3 py-2 text-sm bg-white">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
              placeholder="Tags (comma separated: m365, migration, admin)" className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
            <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
              placeholder="Article body (Markdown supported: ## Heading, **bold**, - list item, | table |)" rows={8}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm font-mono resize-none" />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.pinned} onChange={e => setForm(p => ({ ...p, pinned: e.target.checked }))} />
              Pin this article
            </label>
            <div className="flex gap-2">
              <button onClick={createArticle} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">Publish</button>
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Search + filter */}
        <div className="flex gap-3 px-5 py-3 border-b border-border bg-secondary/10">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search articles..." className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm" />
          <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm bg-white">
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">Loading articles...</p>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">No articles found.</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(article => (
              <div key={article._id}
                className="px-5 py-4 hover:bg-secondary/20 cursor-pointer transition-colors flex items-start gap-3"
                onClick={() => setSelectedArticle(article)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {article.pinned && <span className="text-primary text-[11px]">📌</span>}
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">{article.category}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{article.title}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {article.tags.slice(0, 4).map(t => (
                      <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0 mt-1">→</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
