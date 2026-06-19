"use client"

import { useState, useEffect, useRef } from "react"
import { CheckCircle2 } from "lucide-react"

const COUNTRIES = ["Nigeria","Ghana","Kenya","South Africa","Tanzania","Uganda","Rwanda","Egypt","Other"]
const INDUSTRIES = ["Legal","Education / Schools","Religious / Churches","Healthcare / Clinics","Financial Services","Retail & E-commerce","Manufacturing","Government / NGO","Other"]

const fieldClasses = "w-full rounded-md border border-[#c8e6f0] bg-white px-3 py-3 text-sm text-[#0d2233] outline-none transition-colors placeholder:text-[#5a7a8a] focus-visible:border-[#0096c7] focus-visible:ring-2 focus-visible:ring-[#0096c7]/30 sm:py-2.5"

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

export function AssessmentForm({ variant = "card" }: { variant?: "card" | "section" }) {
  const [submitted, setSubmitted] = useState(false)
  const [ref, setRef] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [email, setEmail] = useState("")
  const [emailVerified, setEmailVerified] = useState(false)
  const [verificationToken, setVerificationToken] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [otpCooldown, setOtpCooldown] = useState(0)

  // Turnstile widget #1 — gates the email OTP send
  const [emailTurnstileToken, setEmailTurnstileToken] = useState("")
  const [emailTurnstileReady, setEmailTurnstileReady] = useState(false)
  const emailWidgetRef = useRef<HTMLDivElement>(null)
  const emailWidgetIdRef = useRef<string | undefined>(undefined)

  // Turnstile widget #2 — gates the final form submission
  const [turnstileToken, setTurnstileToken] = useState("")
  const [turnstileReady, setTurnstileReady] = useState(false)
  const widgetRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | undefined>(undefined)

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
    if (!isValidEmail(email)) {
      setOtpError("Please enter a valid email address first.")
      return
    }
    if (!emailTurnstileToken) {
      setOtpError("Please complete the security check below first.")
      return
    }
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
    if (!otpCode || otpCode.length !== 6) {
      setOtpError("Enter the 6-digit code from your email.")
      return
    }
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (!emailVerified || !verificationToken) {
      setError("Please verify your email address before submitting.")
      return
    }
    if (!turnstileToken) {
      setError("Please complete the security check before submitting.")
      return
    }

    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)

    const services: string[] = []
    const currentEmail = data.get("currentEmail") as string
    if (currentEmail) services.push(currentEmail)

    const payload = {
      company: data.get("company"),
      contact: data.get("name"),
      email,
      phone: data.get("whatsapp"),
      country: data.get("country"),
      industry: data.get("industry"),
      users: data.get("users"),
      currentEmail: currentEmail,
      services,
      turnstileToken,
      verificationToken,
    }

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (result.success) {
        setRef(result.lead?.ref || result.ref || "GL-" + Date.now())
        setSubmitted(true)
      } else if (result.error === "captcha_failed") {
        setError("Security check failed. Please try again.")
        if (window.turnstile && widgetIdRef.current) window.turnstile.reset(widgetIdRef.current)
        setTurnstileToken("")
      } else if (result.error === "email_not_verified") {
        setError("Email verification expired. Please verify your email again.")
        resetEmailVerification()
      } else {
        setError("Something went wrong. Please try again.")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-[#c8e6f0] bg-white p-10 text-center">
        <CheckCircle2 className="size-12 text-[#00c8c8]" />
        <h3 className="text-xl font-bold text-[#0d2233]">Request received!</h3>
        <p className="text-sm text-[#5a7a8a]">Reference: <strong className="text-[#0096c7]">{ref}</strong></p>
        <p className="max-w-sm text-sm text-[#5a7a8a]">
          A GoLive cloud specialist will reach out within one business day with your free Microsoft cloud assessment.
        </p>
        <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WA_NUMBER || '2348083587801'}?text=Hi GoLive, I just submitted an assessment. My ref is ${ref}`}
          className="inline-flex items-center gap-2 rounded-lg bg-[#25d366] px-5 py-2.5 text-sm font-semibold text-white">
          💬 Chat on WhatsApp
        </a>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        variant === "card"
          ? "relative overflow-hidden rounded-2xl border border-[#c8e6f0] bg-white p-5 shadow-lg sm:p-8"
          : "relative overflow-hidden rounded-2xl border border-[#c8e6f0] bg-white p-5 shadow-md sm:p-10"
      }
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0096c7] via-[#00c8c8] to-[#0096c7]" />
      <div className="mb-5">
        <h3 className="text-lg font-bold tracking-tight text-[#0d2233] sm:text-xl">Get your free cloud assessment</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-[#5a7a8a]">No obligation. Receive a tailored Microsoft licensing &amp; security plan.</p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="company" className="mb-1.5 block text-xs font-medium text-[#0d2233]">Company name</label>
          <input id="company" name="company" required placeholder="Acme Ltd" className={fieldClasses} />
        </div>
        <div>
          <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-[#0d2233]">Full name</label>
          <input id="name" name="name" required placeholder="Jane Doe" className={fieldClasses} />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-[#0d2233]">Work email</label>
          <div className="flex gap-2">
            <input
              id="email" name="email" type="email" required placeholder="jane@acme.com"
              value={email}
              disabled={emailVerified}
              onChange={(e) => { setEmail(e.target.value); resetEmailVerification() }}
              className={fieldClasses + (emailVerified ? " bg-green-50 border-green-300" : "")}
            />
            {!emailVerified && (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp || otpCooldown > 0 || !isValidEmail(email) || !emailTurnstileToken}
                className="shrink-0 whitespace-nowrap rounded-md bg-[#0096c7] px-3 text-xs font-semibold text-white disabled:opacity-50"
              >
                {sendingOtp ? "Sending..." : otpCooldown > 0 ? `Resend (${otpCooldown}s)` : otpSent ? "Resend" : "Verify"}
              </button>
            )}
          </div>

          {!emailVerified && (
            <div className="mt-2 flex justify-start">
              <div ref={emailWidgetRef} />
            </div>
          )}

          {emailVerified && (
            <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-green-600">
              <CheckCircle2 className="size-3.5" /> Email verified
            </p>
          )}

          {otpSent && !emailVerified && (
            <div className="mt-2 flex gap-2">
              <input
                type="text" inputMode="numeric" maxLength={6} placeholder="6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="w-32 rounded-md border border-[#c8e6f0] bg-white px-3 py-2 text-sm tracking-widest outline-none focus-visible:border-[#0096c7] focus-visible:ring-2 focus-visible:ring-[#0096c7]/30"
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={verifyingOtp || otpCode.length !== 6}
                className="rounded-md bg-[#00c8c8] px-3 text-xs font-semibold text-white disabled:opacity-50"
              >
                {verifyingOtp ? "Checking..." : "Confirm"}
              </button>
            </div>
          )}
          {otpError && <p className="mt-1.5 text-xs text-red-600">{otpError}</p>}
        </div>

        <div>
          <label htmlFor="whatsapp" className="mb-1.5 block text-xs font-medium text-[#0d2233]">WhatsApp number</label>
          <input id="whatsapp" name="whatsapp" type="tel" placeholder="+234 800 000 0000" className={fieldClasses} />
        </div>
        <div>
          <label htmlFor="country" className="mb-1.5 block text-xs font-medium text-[#0d2233]">Country</label>
          <select id="country" name="country" required defaultValue="" className={fieldClasses}>
            <option value="" disabled>Select country</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="industry" className="mb-1.5 block text-xs font-medium text-[#0d2233]">Industry</label>
          <select id="industry" name="industry" required defaultValue="" className={fieldClasses}>
            <option value="" disabled>Select industry</option>
            {INDUSTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="users" className="mb-1.5 block text-xs font-medium text-[#0d2233]">Number of users</label>
          <input id="users" name="users" type="number" min={1} required placeholder="25" className={fieldClasses} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="currentEmail" className="mb-1.5 block text-xs font-medium text-[#0d2233]">Current email provider</label>
          <select id="currentEmail" name="currentEmail" defaultValue="" className={fieldClasses}>
            <option value="" disabled>Select current provider</option>
            <option>Google Workspace</option>
            <option>cPanel / Webmail</option>
            <option>Microsoft 365 (existing)</option>
            <option>Zoho Mail</option>
            <option>Other / None</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <div ref={widgetRef} />
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || !emailVerified}
        className="mt-6 w-full rounded-lg bg-[#0096c7] py-3 text-sm font-semibold tracking-tight text-white shadow-sm transition-all hover:bg-[#0096c7]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0096c7]/50 disabled:opacity-60"
      >
        {loading ? "Submitting..." : !emailVerified ? "Verify your email to continue" : "Get free assessment"}
      </button>
      <p className="mt-3 text-center text-xs text-[#5a7a8a]">NDPR compliant. We never share your data.</p>
    </form>
  )
}
