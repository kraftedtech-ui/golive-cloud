"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react"
import { DISCOVERY_PAIN_POINTS } from "@/lib/discoveryRecommendation"

const COUNTRIES = ["Nigeria", "Ghana", "Kenya", "South Africa", "Tanzania", "Uganda", "Rwanda", "Egypt", "Other"]
const EMPLOYEE_BANDS = ["1–5", "6–20", "21–50", "51–200", "200+"]
const DEVICE_TYPES = ["Windows laptops/desktops", "Mac", "Mobile (iOS/Android)", "Shared/kiosk devices"]
const SENSITIVE_DATA_TYPES = ["Financial / payment data", "Health records", "Legal / contracts", "Personal customer data"]
const DATA_SCOPE_OPTIONS = ["Email", "Calendar & contacts", "Files / shared drives", "Teams or Slack history", "Apps connected to your current email"]
const CUTOVER_OPTIONS = [
  { value: "zero_downtime", label: "We cannot have any downtime — a careful parallel switch is required" },
  { value: "maintenance_window", label: "A short planned downtime window is fine" },
  { value: "flexible", label: "We're flexible on timing" },
]
const SWITCH_REASONS = ["Cost", "Poor support from current provider", "Billing not in local currency", "Want bundled security/services", "Other"]
const BUDGET_RANGES = ["Not sure yet", "Under $500/mo", "$500–2,000/mo", "$2,000–10,000/mo", "$10,000+/mo"]
const TIMELINES = ["Right away (this month)", "Next 1–3 months", "Next 3–6 months", "Just exploring options"]
const CURRENT_PLAN_OPTIONS = [
  { value: "", label: "Not sure / unsure" },
  { value: "Basic (email only)", label: "Basic — email & web apps only" },
  { value: "Standard", label: "Standard — includes desktop Office apps" },
  { value: "Premium (security included)", label: "Premium — includes extra security features" },
  { value: "Enterprise (E3/E5)", label: "Enterprise (E3/E5)" },
]

const fieldClasses = "w-full rounded-md border border-[#c8e6f0] bg-white px-3 py-3 text-sm text-[#0d2233] outline-none transition-colors placeholder:text-[#5a7a8a] focus-visible:border-[#0096c7] focus-visible:ring-2 focus-visible:ring-[#0096c7]/30 sm:py-2.5"
const helpText = "mt-1 text-xs leading-relaxed text-[#5a7a8a]"
const sectionTitle = "text-base font-bold text-[#0d2233]"

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function toggle(arr: string[], val: string) {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]
}

export function PublicDiscoveryForm() {
  const searchParams = useSearchParams()
  const prefillCompany = searchParams.get('company') || ''
  const prefillContact = searchParams.get('contact') || ''
  const prefillEmail = searchParams.get('email') || ''

  const [submitted, setSubmitted] = useState(false)
  const [ref, setRef] = useState("")
  const [result, setResult] = useState<{ packageLabel: string; addOnLabels: string[]; needsOfflineConsult: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [company, setCompany] = useState(prefillCompany)
  const [contact, setContact] = useState(prefillContact)
  const [phone, setPhone] = useState("")
  const [country, setCountry] = useState("Nigeria")
  const [email, setEmail] = useState(prefillEmail)
  const [emailVerified, setEmailVerified] = useState(false)
  const [verificationToken, setVerificationToken] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [otpCooldown, setOtpCooldown] = useState(0)

  const [emailTurnstileToken, setEmailTurnstileToken] = useState("")
  const [emailTurnstileReady, setEmailTurnstileReady] = useState(false)
  const emailWidgetRef = useRef<HTMLDivElement>(null)
  const emailWidgetIdRef = useRef<string | undefined>(undefined)

  const [turnstileToken, setTurnstileToken] = useState("")
  const [turnstileReady, setTurnstileReady] = useState(false)
  const widgetRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | undefined>(undefined)

  const [isExistingM365Customer, setIsExistingM365Customer] = useState<boolean | null>(null)
  const [currentPlan, setCurrentPlan] = useState("")
  const [currentLicenseCount, setCurrentLicenseCount] = useState("")
  const [currentCSPManager, setCurrentCSPManager] = useState("")
  const [contractRenewalDate, setContractRenewalDate] = useState("")
  const [switchReasons, setSwitchReasons] = useState<string[]>([])
  const [currentEmailProvider, setCurrentEmailProvider] = useState("")
  const [currentProviderChallenges, setCurrentProviderChallenges] = useState("")
  const [employeeCount, setEmployeeCount] = useState("1–5")
  const [deviceTypes, setDeviceTypes] = useState<string[]>([])
  const [remoteHybridWork, setRemoteHybridWork] = useState(false)
  const [itSupportModel, setItSupportModel] = useState("none")
  const [handlesSensitiveData, setHandlesSensitiveData] = useState(false)
  const [sensitiveDataTypes, setSensitiveDataTypes] = useState<string[]>([])
  const [painPoints, setPainPoints] = useState<string[]>([])
  const [otherPainPointNotes, setOtherPainPointNotes] = useState("")
  const [budgetRange, setBudgetRange] = useState("")
  const [decisionTimeline, setDecisionTimeline] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [dataScope, setDataScope] = useState<string[]>([])
  const [cutoverTolerance, setCutoverTolerance] = useState("")

  useEffect(() => {
    if (document.getElementById("turnstile-script")) {
      if (window.turnstile) { setTurnstileReady(true); setEmailTurnstileReady(true) }
      return
    }
    const script = document.createElement("script")
    script.id = "turnstile-script"
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"
    script.async = true
    script.defer = true
    script.onload = () => { setTurnstileReady(true); setEmailTurnstileReady(true) }
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!emailTurnstileReady || !emailWidgetRef.current || !window.turnstile) return
    if (emailWidgetIdRef.current) return
    emailWidgetIdRef.current = window.turnstile.render(emailWidgetRef.current, {
      sitekey: "0x4AAAAAADnfiHKMINlWRfJ7",
      size: "flexible",
      callback: (token: string) => setEmailTurnstileToken(token),
      "expired-callback": () => setEmailTurnstileToken(""),
      "error-callback": () => setEmailTurnstileToken(""),
    })
  }, [emailTurnstileReady])

  useEffect(() => {
    if (!turnstileReady || !widgetRef.current || !window.turnstile) return
    if (widgetIdRef.current) return
    widgetIdRef.current = window.turnstile.render(widgetRef.current, {
      sitekey: "0x4AAAAAADnfiHKMINlWRfJ7",
      size: "flexible",
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    })
  }, [turnstileReady])

  useEffect(() => {
    if (otpCooldown <= 0) return
    const t = setTimeout(() => setOtpCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [otpCooldown])

  async function handleSendOtp() {
    if (!isValidEmail(email)) { setOtpError("Please enter a valid email address first."); return }
    if (!emailTurnstileToken) { setOtpError("Please complete the security check below first."); return }
    setOtpError("")
    setSendingOtp(true)
    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken: emailTurnstileToken }),
      })
      const result = await res.json()
      if (result.success) {
        setOtpSent(true)
        setOtpCooldown(60)
      } else if (result.error === "captcha_failed" || result.error === "captcha_required") {
        setOtpError("Security check failed. Please try again.")
        if (window.turnstile && emailWidgetIdRef.current) window.turnstile.reset(emailWidgetIdRef.current)
        setEmailTurnstileToken("")
      } else {
        setOtpError(result.error || "Failed to send code. Please try again.")
      }
    } catch {
      setOtpError("Network error. Please try again.")
    } finally {
      setSendingOtp(false)
    }
  }

  async function handleVerifyOtp() {
    if (!otpCode || otpCode.length !== 6) { setOtpError("Enter the 6-digit code from your email."); return }
    setOtpError("")
    setVerifyingOtp(true)
    try {
      const res = await fetch("/api/verify-email/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode }),
      })
      const result = await res.json()
      if (result.success) {
        setEmailVerified(true)
        setVerificationToken(result.verificationToken)
      } else {
        setOtpError(result.error || "Incorrect code.")
      }
    } catch {
      setOtpError("Network error. Please try again.")
    } finally {
      setVerifyingOtp(false)
    }
  }

  function resetEmailVerification() {
    setEmailVerified(false)
    setVerificationToken("")
    setOtpSent(false)
    setOtpCode("")
    setOtpError("")
  }

  const canSubmit = isExistingM365Customer !== null && emailVerified && !!turnstileToken && !!company && !!contact && !!phone

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (isExistingM365Customer === null) { setError("Please answer whether you are already using Microsoft 365."); return }
    if (!emailVerified || !verificationToken) { setError("Please verify your email address before submitting."); return }
    if (!turnstileToken) { setError("Please complete the security check before submitting."); return }

    setLoading(true)
    try {
      const res = await fetch("/api/discovery-assessments/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company, contact, email, phone, country,
          isExistingM365Customer,
          currentPlan: currentPlan || undefined,
          currentLicenseCount: currentLicenseCount ? parseInt(currentLicenseCount) : undefined,
          currentCSPManager: currentCSPManager || undefined,
          contractRenewalDate: contractRenewalDate || undefined,
          switchReasons,
          currentEmailProvider: currentEmailProvider || undefined,
          currentProviderChallenges: currentProviderChallenges || undefined,
          employeeCount, deviceTypes, remoteHybridWork, itSupportModel,
          handlesSensitiveData, sensitiveDataTypes,
          painPoints, otherPainPointNotes: otherPainPointNotes || undefined,
          budgetRange: budgetRange || undefined, decisionTimeline: decisionTimeline || undefined,
          additionalNotes: additionalNotes || undefined,
          dataScope, cutoverTolerance: cutoverTolerance || undefined,
          turnstileToken, verificationToken,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSubmitted(true)
        setRef(data.ref)
        setResult(data.recommendation)
      } else if (Array.isArray(data.errors)) {
        setError(data.errors.map((e: { message: string }) => e.message).join(" · "))
      } else {
        setError(data.error || "Something went wrong. Please try again.")
      }
    } catch {
      setError("Network error. Please try again or WhatsApp us directly.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#c8e6f0] bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto size-12 text-[#00c8c8]" />
        <h3 className="mt-4 text-xl font-bold text-[#0d2233]">Thank you, {contact.split(" ")[0] || "there"} — your submission has been received.</h3>
        <p className="mt-2 text-sm text-[#5a7a8a]">Reference: <span className="font-mono font-semibold text-[#0d2233]">{ref}</span></p>

        {result && (
          <div className="mt-6 rounded-xl border border-[#c8e6f0] bg-[#f4fafd] p-5 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0096c7]">Based on what you told us</p>
            <p className="mt-1 text-lg font-bold text-[#0d2233]">{result.packageLabel}</p>
            {result.addOnLabels.length > 0 && (
              <ul className="mt-2 space-y-1">
                {result.addOnLabels.map(a => (
                  <li key={a} className="text-sm text-[#0d2233]">+ {a}</li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-[#5a7a8a]">
              This is our recommendation based on your answers — not a final quote. A GoLive specialist will confirm pricing for your exact user count and currency.
            </p>
          </div>
        )}

        {result?.needsOfflineConsult && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
            <p className="text-sm font-semibold text-amber-800">A few things need a real conversation</p>
            <p className="mt-1 text-xs text-amber-700">Some of what you described is not a simple checkbox answer — we will be in touch personally (usually within one business day) to discuss this properly.</p>
          </div>
        )}

        <p className="mt-6 text-xs text-[#5a7a8a]">Prefer to speak with us sooner? <a href="https://wa.me/2348083587801" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0096c7]">Message us on WhatsApp →</a></p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {(prefillCompany || prefillContact) && (
        <div className="rounded-lg bg-[#e8f4fb] border border-[#c8e6f0] px-4 py-2.5 text-xs text-[#0d2233]">
          We have pre-filled a few details from your conversation with GoLive — please check these are correct before continuing.
        </div>
      )}
      <div>
        <h2 className={sectionTitle}>About your business</h2>
        <p className={helpText}>This takes approximately 5 minutes. The more detail you provide, the more accurate our recommendation — and anything that warrants a proper conversation will be flagged and followed up personally.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#0d2233]">Company name</label>
          <input required value={company} onChange={e => setCompany(e.target.value)} className={fieldClasses} placeholder="Acme Ltd" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#0d2233]">Your name</label>
          <input required value={contact} onChange={e => setContact(e.target.value)} className={fieldClasses} placeholder="Jane Doe" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#0d2233]">WhatsApp / Phone</label>
          <input required value={phone} onChange={e => setPhone(e.target.value)} className={fieldClasses} placeholder="+234 800 000 0000" />
          <p className={helpText}>So we can reach you quickly if something here needs a follow-up call.</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#0d2233]">Country</label>
          <select value={country} onChange={e => setCountry(e.target.value)} className={fieldClasses}>
            {COUNTRIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#0d2233]">Work email</label>
        <div className="flex gap-2">
          <input required type="email" value={email} disabled={emailVerified}
            onChange={e => { setEmail(e.target.value); resetEmailVerification() }}
            className={fieldClasses + (emailVerified ? " opacity-60" : "")} placeholder="you@company.com" />
          {!emailVerified && !otpSent && (
            <button type="button" onClick={handleSendOtp} disabled={sendingOtp}
              className="flex-shrink-0 rounded-md bg-[#0096c7] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {sendingOtp ? "Sending…" : "Verify"}
            </button>
          )}
          {emailVerified && <span className="flex flex-shrink-0 items-center gap-1 text-sm font-medium text-[#0f9d6e]"><ShieldCheck className="size-4" /> Verified</span>}
        </div>
        {!emailVerified && (
          <div ref={emailWidgetRef} className="mt-2" />
        )}
        {otpSent && !emailVerified && (
          <div className="mt-2 flex gap-2">
            <input value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code" className={fieldClasses} />
            <button type="button" onClick={handleVerifyOtp} disabled={verifyingOtp}
              className="flex-shrink-0 rounded-md border-2 border-[#0096c7] px-4 py-2.5 text-sm font-semibold text-[#0096c7] disabled:opacity-50">
              {verifyingOtp ? "Checking…" : "Confirm"}
            </button>
          </div>
        )}
        {otpError && <p className="mt-1 text-xs text-red-600">{otpError}</p>}
        {otpSent && !emailVerified && <p className={helpText}>Code sent — check your inbox (and spam folder). {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : <button type="button" onClick={handleSendOtp} className="underline">Resend code</button>}</p>}
      </div>

      <div className="rounded-xl border-2 border-[#c8e6f0] bg-[#f4fafd] p-5">
        <h2 className={sectionTitle}>Are you already using Microsoft 365?</h2>
        <p className={helpText}>Microsoft 365 is the suite that includes Outlook email, Word, Excel, PowerPoint, Teams calls and chat, and OneDrive cloud storage. If you are unsure, select "No" — we will work it out with you.</p>
        <div className="mt-3 flex gap-3">
          <button type="button" onClick={() => setIsExistingM365Customer(true)}
            className={`flex-1 rounded-lg border-2 py-3 text-sm font-semibold ${isExistingM365Customer === true ? "border-[#0096c7] bg-[#0096c7] text-white" : "border-[#c8e6f0] bg-white text-[#0d2233]"}`}>
            Yes, we already use it
          </button>
          <button type="button" onClick={() => setIsExistingM365Customer(false)}
            className={`flex-1 rounded-lg border-2 py-3 text-sm font-semibold ${isExistingM365Customer === false ? "border-[#0096c7] bg-[#0096c7] text-white" : "border-[#c8e6f0] bg-white text-[#0d2233]"}`}>
            No, not yet
          </button>
        </div>

        {isExistingM365Customer === true && (
          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0d2233]">Which plan do you currently have?</label>
              <select value={currentPlan} onChange={e => setCurrentPlan(e.target.value)} className={fieldClasses}>
                {CURRENT_PLAN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <p className={helpText}>Not sure? Pick "Not sure" — we can check this with you directly.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0d2233]">Roughly how many people have a login today?</label>
              <input type="number" min={1} value={currentLicenseCount} onChange={e => setCurrentLicenseCount(e.target.value)} className={fieldClasses} placeholder="e.g. 12" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0d2233]">Who manages it for you today?</label>
              <select value={currentCSPManager} onChange={e => setCurrentCSPManager(e.target.value)} className={fieldClasses}>
                <option value="">Select...</option>
                <option value="self_managed">We manage it ourselves</option>
                <option value="another_csp">Another reseller/provider manages it</option>
                <option value="microsoft_direct">We pay Microsoft directly</option>
                <option value="not_sure">Not sure</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0d2233]">When does your current plan renew? <span className="font-normal text-[#5a7a8a]">(optional)</span></label>
              <input type="date" value={contractRenewalDate} onChange={e => setContractRenewalDate(e.target.value)} className={fieldClasses} />
              <p className={helpText}>Helps us avoid double-billing or timing a switch awkwardly.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0d2233]">What would make switching to GoLive worth it? (pick any)</label>
              <div className="flex flex-wrap gap-2">
                {SWITCH_REASONS.map(r => (
                  <button key={r} type="button" onClick={() => setSwitchReasons(s => toggle(s, r))}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ${switchReasons.includes(r) ? "bg-[#0096c7] text-white ring-[#0096c7]" : "bg-white text-[#0d2233] ring-[#c8e6f0]"}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {isExistingM365Customer === false && (
          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0d2233]">What do you use for email/documents today?</label>
              <input value={currentEmailProvider} onChange={e => setCurrentEmailProvider(e.target.value)} className={fieldClasses} placeholder="e.g. Gmail, Google Workspace, cPanel webmail, Zoho, nothing formal yet" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#0d2233]">What's frustrating about your current setup?</label>
              <textarea value={currentProviderChallenges} onChange={e => setCurrentProviderChallenges(e.target.value)} rows={3} className={fieldClasses}
                placeholder="e.g. emails look unprofessional, no shared calendar, files scattered everywhere, no proper backup..." />
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className={sectionTitle}>A bit about how your team works</h2>
        <p className={helpText}>This helps us tailor the recommendation — there is no right or wrong answer, just what is accurate for your organisation today.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0d2233]">How many employees?</label>
            <select value={employeeCount} onChange={e => setEmployeeCount(e.target.value)} className={fieldClasses}>
              {EMPLOYEE_BANDS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0d2233]">Who handles your IT today?</label>
            <select value={itSupportModel} onChange={e => setItSupportModel(e.target.value)} className={fieldClasses}>
              <option value="none">No one dedicated — we figure it out as we go</option>
              <option value="in_house">We have someone in-house</option>
              <option value="outsourced">An outside IT company helps us</option>
              <option value="other">Other</option>
            </select>
            <p className={helpText}>Just helps us know who else to loop in technically, if anyone.</p>
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-[#0d2233]">What devices does your team use for work?</label>
          <div className="flex flex-wrap gap-2">
            {DEVICE_TYPES.map(d => (
              <button key={d} type="button" onClick={() => setDeviceTypes(s => toggle(s, d))}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ${deviceTypes.includes(d) ? "bg-[#0096c7] text-white ring-[#0096c7]" : "bg-white text-[#0d2233] ring-[#c8e6f0]"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <label className="mt-4 flex items-start gap-2.5 text-sm text-[#0d2233]">
          <input type="checkbox" className="mt-0.5" checked={remoteHybridWork} onChange={e => setRemoteHybridWork(e.target.checked)} />
          <span>Our team works remote or hybrid — not everyone's in one office every day</span>
        </label>
        <label className="mt-3 flex items-start gap-2.5 text-sm text-[#0d2233]">
          <input type="checkbox" className="mt-0.5" checked={handlesSensitiveData} onChange={e => setHandlesSensitiveData(e.target.checked)} />
          <span>We handle sensitive data — financial records, health info, legal documents, or customer personal data</span>
        </label>
        {handlesSensitiveData && (
          <div className="mt-2 pl-7">
            <p className="mb-1.5 text-xs font-medium text-[#5a7a8a]">Which kind(s)?</p>
            <div className="flex flex-wrap gap-2">
              {SENSITIVE_DATA_TYPES.map(d => (
                <button key={d} type="button" onClick={() => setSensitiveDataTypes(s => toggle(s, d))}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ${sensitiveDataTypes.includes(d) ? "bg-amber-500 text-white ring-amber-500" : "bg-white text-[#0d2233] ring-[#c8e6f0]"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-[#0d2233]">What needs to move over? <span className="font-normal text-[#5a7a8a]">(only relevant if you are currently using an existing email or file system)</span></label>
          <div className="flex flex-wrap gap-2">
            {DATA_SCOPE_OPTIONS.map(d => (
              <button key={d} type="button" onClick={() => setDataScope(s => toggle(s, d))}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ${dataScope.includes(d) ? "bg-[#0096c7] text-white ring-[#0096c7]" : "bg-white text-[#0d2233] ring-[#c8e6f0]"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-[#0d2233]">How much downtime can you tolerate during the switch?</label>
          <select value={cutoverTolerance} onChange={e => setCutoverTolerance(e.target.value)} className={fieldClasses}>
            <option value="">Select...</option>
            {CUTOVER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-[#0096c7]" />
          <h2 className={sectionTitle}>What's actually frustrating you right now?</h2>
        </div>
        <p className={helpText}>Select everything that applies. This is what we use to determine the right recommendation — there is no need to know the technical terminology; simply describe what is causing you difficulty.</p>
        <div className="mt-4 space-y-2.5">
          {DISCOVERY_PAIN_POINTS.map(p => (
            <label key={p.key} className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition-colors ${painPoints.includes(p.key) ? "border-[#0096c7] bg-[#f4fafd]" : "border-[#e3e9f0] bg-white"}`}>
              <input type="checkbox" className="mt-1" checked={painPoints.includes(p.key)} onChange={() => setPainPoints(s => toggle(s, p.key))} />
              <span>
                <span className="block text-sm font-semibold text-[#0d2233]">{p.customerLabel || p.label}</span>
                {p.customerDescription && <span className="mt-0.5 block text-xs leading-relaxed text-[#5a7a8a]">{p.customerDescription}</span>}
              </span>
            </label>
          ))}
        </div>
        {painPoints.includes("other") && (
          <textarea value={otherPainPointNotes} onChange={e => setOtherPainPointNotes(e.target.value)} rows={3} className={fieldClasses + " mt-2"}
            placeholder="Please describe the issue in your own words..." />
        )}
      </div>

      <div>
        <h2 className={sectionTitle}>Budget & timeline</h2>
        <p className={helpText}>This ensures our recommendation is realistic for your current situation — there is no wrong answer.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0d2233]">Rough monthly budget</label>
            <select value={budgetRange} onChange={e => setBudgetRange(e.target.value)} className={fieldClasses}>
              <option value="">Select...</option>
              {BUDGET_RANGES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0d2233]">When are you hoping to move on this?</label>
            <select value={decisionTimeline} onChange={e => setDecisionTimeline(e.target.value)} className={fieldClasses}>
              <option value="">Select...</option>
              {TIMELINES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-[#0d2233]">Anything else we should know? <span className="font-normal text-[#5a7a8a]">(optional)</span></label>
          <textarea value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} rows={3} className={fieldClasses} />
        </div>
      </div>

      {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{!turnstileToken ? "Please complete the security check below." : error}</div>}

      <div ref={widgetRef} />

      <button type="submit" disabled={loading || !canSubmit}
        className="w-full rounded-md bg-[#0096c7] py-3.5 text-sm font-bold text-white transition-opacity disabled:opacity-50">
        {loading ? "Submitting…" : !emailVerified ? "Verify your email above to continue" : "Get my recommendation →"}
      </button>
      <p className="text-center text-xs text-[#5a7a8a]">We'll never share your details. A specialist reviews every submission personally.</p>
    </form>
  )
}
