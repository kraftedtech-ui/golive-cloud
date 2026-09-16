import { verifyOnboardingToken } from '@/lib/onboardingToken'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import OnboardAckForm from '@/components/onboarding/OnboardAckForm'

export const dynamic = 'force-dynamic'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f3f6f7', padding: '24px 12px', fontFamily: "Arial, 'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 760, margin: '0 auto', background: '#ffffff', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '32px 34px' }}>
        {children}
      </div>
      <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 16 }}>
        The GoLive Digital Solutions Company Ltd &middot; RC1644767 &middot; Secure onboarding portal
      </p>
    </div>
  )
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <Shell>
      <div style={{ textAlign: 'center', padding: '40px 10px' }}>
        <h2 style={{ color: '#0e7c86', marginBottom: 10 }}>{title}</h2>
        <p style={{ color: '#4b5563', lineHeight: 1.6 }}>{body}</p>
      </div>
    </Shell>
  )
}

export default async function OnboardingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const v = verifyOnboardingToken(token)
  if (!v) {
    return (
      <Notice
        title="This onboarding link is invalid or has expired"
        body="Please contact talent.acquisition@golivecompany.com and we will send you a fresh link."
      />
    )
  }

  await connectDB()
  const app = (await Application.findOne({ ref: v.ref }).lean()) as {
    ref: string; name: string; role: string; employeeNumber?: string
    onboarding?: {
      sentAt?: Date
      docs?: { filename: string; label?: string; acknowledgedAt?: Date }[]
      acknowledgedAt?: Date
      signatureName?: string
      acknowledgedName?: string
      mdAckName?: string
      mdAckAt?: Date
    }
  } | null

  if (!app || !app.onboarding?.sentAt) {
    return (
      <Notice
        title="Onboarding pack not found"
        body="We could not locate an onboarding pack for this link. Please contact talent.acquisition@golivecompany.com."
      />
    )
  }

  const firstName = (app.name || '').trim().split(/\s+/)[0]
  const rawDocs = app.onboarding.docs || []
  const docs = rawDocs.map((d) => ({
    filename: d.filename,
    label: d.label || d.filename,
    acknowledgedAt: d.acknowledgedAt ? String(d.acknowledgedAt) : null,
  }))

  return (
    <Shell>
      <div style={{ fontSize: '17pt', fontWeight: 700, marginBottom: 2 }}>
        <span style={{ color: '#0e7c86' }}>go</span>live{' '}
        <span style={{ color: '#6b7280', fontWeight: 400, fontSize: '10pt' }}>| The GoLive Digital Solutions Company Ltd.</span>
      </div>
      <div style={{ borderBottom: '3px solid #0e7c86', margin: '4px 0 20px' }} />

      <h1 style={{ color: '#0e7c86', fontSize: 22, margin: '0 0 4px' }}>Welcome, {firstName}!</h1>
      <p style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.65, margin: '0 0 6px' }}>
        Your onboarding pack for the <strong>{app.role}</strong> role is below.
        {app.employeeNumber && (
          <> Your employee number is <strong style={{ color: '#0e7c86' }}>{app.employeeNumber}</strong>.</>
        )}
      </p>
      <p style={{ color: '#4b5563', fontSize: 13, lineHeight: 1.6, margin: '0 0 18px' }}>
        Download and read each document, then confirm each one individually and sign at the bottom of this page.
      </p>

      <h2 style={{ color: '#2d3436', fontSize: 15, margin: '0 0 8px' }}>Your documents</h2>
      <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
        {docs.map((d) => (
          <a
            key={d.filename}
            href={`/api/onboarding/file?token=${encodeURIComponent(token)}&f=${encodeURIComponent(d.filename)}`}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              border: '1px solid #cbd5d8', borderRadius: 8, padding: '11px 14px',
              textDecoration: 'none', color: '#2d3436', fontSize: 14, background: '#fbfdfd',
            }}
          >
            <span>{d.label}</span>
            <span style={{ color: '#0e7c86', fontWeight: 700, fontSize: 13 }}>Download ↓</span>
          </a>
        ))}
      </div>

      <div style={{ background: '#fff8ec', border: '1px solid #f0d9a8', borderRadius: 8, padding: '12px 16px', fontSize: 13, lineHeight: 1.6, color: '#5c4400', marginBottom: 20 }}>
        <strong>Pre-employment screening.</strong> GoLive conducts background verification through our screening
        partner, <strong>Background Check International (BCI)</strong>. You will receive correspondence directly from
        BCI regarding identity, education, and employment-history checks. This is legitimate and expected; please
        respond to them promptly so your start date is not delayed. As stated in your offer letter, employment remains
        conditional on satisfactory completion of these checks. Your data is shared with BCI strictly for this purpose,
        in line with the Nigeria Data Protection Act 2023.
      </div>

      <OnboardAckForm
        token={token}
        candidateName={app.name}
        docs={docs}
        alreadyAcknowledged={!!app.onboarding.acknowledgedAt}
        signatureName={app.onboarding.signatureName || app.onboarding.acknowledgedName || null}
        signedAt={app.onboarding.acknowledgedAt ? String(app.onboarding.acknowledgedAt) : null}
        mdAckName={app.onboarding.mdAckName || null}
        mdAckAt={app.onboarding.mdAckAt ? String(app.onboarding.mdAckAt) : null}
      />
    </Shell>
  )
}
