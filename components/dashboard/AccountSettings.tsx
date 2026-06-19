'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface UserProfile {
  _id: string
  name: string
  email: string
  role: string
  active: boolean
  lastLogin?: string
  createdAt: string
  phone?: string
  emailNotifications: boolean
  profilePicture?: string
  twoFactorEnabled: boolean
}

const ROLE_LABELS: Record<string, string> = { admin: 'Admin', sales: 'Sales', viewer: 'Viewer' }

export default function AccountSettings() {
  const { data: session } = useSession()
  const userEmail = session?.user?.email
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [phone, setPhone] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [profilePicture, setProfilePicture] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 2FA reset flow state
  const [show2faReset, setShow2faReset] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [resetQrCode, setResetQrCode] = useState('')
  const [resetSecret, setResetSecret] = useState('')
  const [resetStep, setResetStep] = useState<'confirm-password' | 'scan-qr'>('confirm-password')
  const [resetCode, setResetCode] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!userEmail) return
    fetch(`/api/account?email=${encodeURIComponent(userEmail)}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setProfile(d.user)
          setPhone(d.user.phone || '')
          setEmailNotifications(d.user.emailNotifications !== false)
          setProfilePicture(d.user.profilePicture || '')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [userEmail])

  function handlePictureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be under 1MB.' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => setProfilePicture(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function saveProfile() {
    if (!userEmail) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, phone, emailNotifications, profilePicture }),
      })
      const data = await res.json()
      if (data.success) {
        setProfile(data.user)
        setMessage({ type: 'success', text: 'Profile updated successfully.' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  async function changePassword() {
    if (!userEmail) return
    setPasswordMessage(null)
    if (!currentPassword || !newPassword) {
      setPasswordMessage({ type: 'error', text: 'Both current and new password are required.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match.' })
      return
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters.' })
      return
    }
    setSavingPassword(true)
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, currentPassword, newPassword }),
      })
      const data = await res.json()
      if (data.success) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully.' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password.' })
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSavingPassword(false)
    }
  }

  async function startReset() {
    if (!userEmail || !resetPassword) return
    setResetLoading(true)
    setResetMessage(null)
    try {
      const res = await fetch('/api/2fa/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, password: resetPassword }),
      })
      const data = await res.json()
      if (data.success) {
        setResetQrCode(data.qrCode)
        setResetSecret(data.secret)
        setResetStep('scan-qr')
      } else {
        setResetMessage({ type: 'error', text: data.error || 'Failed to start reset.' })
      }
    } catch {
      setResetMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setResetLoading(false)
    }
  }

  async function confirmReset() {
    if (!userEmail || resetCode.length !== 6) return
    setResetLoading(true)
    setResetMessage(null)
    try {
      const res = await fetch('/api/2fa/reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, code: resetCode }),
      })
      const data = await res.json()
      if (data.success) {
        setResetMessage({ type: 'success', text: '2FA reset successfully. Use your new authenticator app entry from now on.' })
        setShow2faReset(false)
        setResetStep('confirm-password')
        setResetPassword('')
        setResetQrCode('')
        setResetSecret('')
        setResetCode('')
      } else {
        setResetMessage({ type: 'error', text: data.error || 'Incorrect code.' })
      }
    } catch {
      setResetMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setResetLoading(false)
    }
  }

  function cancelReset() {
    setShow2faReset(false)
    setResetStep('confirm-password')
    setResetPassword('')
    setResetQrCode('')
    setResetSecret('')
    setResetCode('')
    setResetMessage(null)
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-white shadow-sm p-12 text-center text-sm text-muted-foreground">
        Loading account settings...
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-border bg-white shadow-sm p-12 text-center text-sm text-muted-foreground">
        Unable to load profile.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">Account</p>
          <h2 className="mt-0.5 text-base font-semibold text-foreground">My Profile</h2>
          <p className="text-xs text-muted-foreground">Manage your personal details and preferences</p>
        </div>

        <div className="p-5 space-y-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              {profilePicture ? (
                <img src={profilePicture} alt={profile.name} className="size-20 rounded-full object-cover ring-2 ring-border" />
              ) : (
                <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary ring-2 ring-border">
                  {profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-primary text-white text-xs cursor-pointer shadow-md hover:opacity-90">
                📷
                <input type="file" accept="image/*" onChange={handlePictureUpload} className="hidden" />
              </label>
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">{profile.name}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <span className="mt-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                {ROLE_LABELS[profile.role] || profile.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Full Name</label>
              <input value={profile.name} disabled className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Email Address</label>
              <input value={profile.email} disabled className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Role</label>
              <input value={ROLE_LABELS[profile.role] || profile.role} disabled className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Date Joined</label>
              <input value={new Date(profile.createdAt).toLocaleDateString()} disabled className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed" />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground -mt-2">Name, email, and role can only be changed by an admin in Team &amp; Access.</p>

          <div className="border-t border-border pt-5 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Phone Number</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 800 000 0000"
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 block text-xs font-medium text-foreground">Email Notifications</label>
              <button onClick={() => setEmailNotifications(!emailNotifications)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${emailNotifications ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border bg-secondary/30 text-muted-foreground'}`}>
                <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${emailNotifications ? 'bg-primary' : 'bg-gray-300'}`}>
                  <span className={`inline-block size-4 transform rounded-full bg-white transition-transform ${emailNotifications ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </span>
                {emailNotifications ? 'Enabled — you will receive email alerts' : 'Disabled — in-app only'}
              </button>
            </div>
          </div>

          {message && (
            <p className={`text-xs rounded-lg px-3 py-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message.text}</p>
          )}

          <div className="flex justify-end">
            <button onClick={saveProfile} disabled={saving}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Two-Factor Authentication</h2>
            <p className="text-xs text-muted-foreground">Required for all GoLive staff accounts</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            <span className="size-1.5 rounded-full bg-green-500" /> Enabled
          </span>
        </div>
        <div className="p-5 space-y-4">
          {!show2faReset ? (
            <>
              <p className="text-xs text-muted-foreground max-w-md">
                Two-factor authentication is active on your account. If you've lost access to your authenticator app, reset it here — you'll need your current password and to scan a new QR code.
              </p>
              <button onClick={() => setShow2faReset(true)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary">
                Lost your device? Reset 2FA
              </button>
            </>
          ) : resetStep === 'confirm-password' ? (
            <div className="max-w-md space-y-3">
              <p className="text-xs text-muted-foreground">Confirm your password to generate a new authenticator code.</p>
              <input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} placeholder="Current password"
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
              {resetMessage && (
                <p className={`text-xs rounded-lg px-3 py-2 ${resetMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{resetMessage.text}</p>
              )}
              <div className="flex gap-2">
                <button onClick={startReset} disabled={resetLoading || !resetPassword}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
                  {resetLoading ? 'Verifying...' : 'Continue'}
                </button>
                <button onClick={cancelReset} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-md space-y-3">
              <p className="text-xs text-muted-foreground">
                Scan this new QR code with your authenticator app. <strong>Your old code will keep working until you confirm this new one</strong> — so you won't be locked out mid-reset.
              </p>
              {resetQrCode && (
                <div className="flex justify-center">
                  <img src={resetQrCode} alt="New 2FA QR Code" className="size-44" />
                </div>
              )}
              <p className="text-[11px] text-muted-foreground text-center break-all">
                Can't scan? Enter manually: <code className="bg-secondary px-1.5 py-0.5 rounded">{resetSecret}</code>
              </p>
              <input type="text" inputMode="numeric" maxLength={6} value={resetCode}
                onChange={e => setResetCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-center tracking-[6px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
              {resetMessage && (
                <p className={`text-xs rounded-lg px-3 py-2 ${resetMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{resetMessage.text}</p>
              )}
              <div className="flex gap-2">
                <button onClick={confirmReset} disabled={resetLoading || resetCode.length !== 6}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
                  {resetLoading ? 'Confirming...' : 'Confirm New Code'}
                </button>
                <button onClick={cancelReset} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Change Password</h2>
          <p className="text-xs text-muted-foreground">Use a strong password you don't use elsewhere</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 max-w-md">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Current Password</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 8 characters"
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
            </div>
          </div>

          {passwordMessage && (
            <p className={`text-xs rounded-lg px-3 py-2 max-w-md ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{passwordMessage.text}</p>
          )}

          <div className="flex justify-end max-w-md">
            <button onClick={changePassword} disabled={savingPassword}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
