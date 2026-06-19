'use client'
import { useState, useEffect } from 'react'

interface TeamMember { _id: string; name: string; email: string; role: string; active: boolean }

interface LeadAssignProps {
  leadId: string
  currentAssignee?: string
  currentAssigneeEmail?: string
  userRole: string
  userName: string
  userEmail: string
  onAssigned?: () => void
}

export default function LeadAssign({ leadId, currentAssignee, currentAssigneeEmail, userRole, userName, userEmail, onAssigned }: LeadAssignProps) {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const isAdmin = userRole === 'admin'

  useEffect(() => {
    if (isAdmin && showPicker) {
      fetch('/api/users').then(r => r.json()).then(d => setTeam(d.success && Array.isArray(d.users) ? d.users.filter((m: TeamMember) => m.active) : []))
    }
  }, [isAdmin, showPicker])

  async function assign(name: string, email: string) {
    setLoading(true)
    try {
      await fetch(`/api/leads/${leadId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: name, assignedToEmail: email, updatedBy: userName }),
      })
      setShowPicker(false)
      onAssigned?.()
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function unassign() {
    setLoading(true)
    try {
      await fetch(`/api/leads/${leadId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: '', assignedToEmail: '', updatedBy: userName }),
      })
      onAssigned?.()
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const isMine = currentAssigneeEmail === userEmail

  return (
    <div className="relative">
      {currentAssignee ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${isMine ? 'bg-primary' : 'bg-gray-400'}`}>
              {currentAssignee.charAt(0).toUpperCase()}
            </span>
            <span className={`text-xs font-medium ${isMine ? 'text-primary' : 'text-muted-foreground'}`}>
              {isMine ? 'You' : currentAssignee}
            </span>
          </div>
          {(isAdmin || isMine) && (
            <button onClick={() => setShowPicker(!showPicker)} className="text-[10px] text-muted-foreground hover:text-foreground">
              {isAdmin ? 'Reassign' : ''}
            </button>
          )}
          {isAdmin && (
            <button onClick={unassign} disabled={loading} className="text-[10px] text-red-400 hover:text-red-600">
              {loading ? '...' : 'Remove'}
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground italic">Unassigned</span>
          <button
            onClick={() => isAdmin ? setShowPicker(!showPicker) : assign(userName, userEmail)}
            disabled={loading}
            className="text-[11px] text-primary hover:underline font-medium">
            {loading ? '...' : isAdmin ? 'Assign' : 'Take this lead'}
          </button>
        </div>
      )}

      {/* Admin picker dropdown */}
      {showPicker && isAdmin && (
        <div className="absolute top-7 left-0 z-50 bg-white border border-border rounded-xl shadow-lg w-52 py-1">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Assign to</p>
          {team.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">Loading team...</p>
          ) : (
            team.map(m => (
              <button key={m._id}
                onClick={() => assign(m.name, m.email)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                  {m.name.charAt(0)}
                </span>
                <div>
                  <p className="text-xs font-medium text-foreground">{m.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{m.role}</p>
                </div>
              </button>
            ))
          )}
          <div className="border-t border-border mt-1">
            <button onClick={() => setShowPicker(false)} className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-secondary/50">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
