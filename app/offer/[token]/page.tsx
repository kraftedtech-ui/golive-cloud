import { verifyOfferToken } from '@/lib/offerToken'
import { connectDB } from '@/lib/mongodb'
import Application from '@/models/Application'
import { buildOfferHtml } from '@/lib/offerLetter'
import OfferSignForm from '@/components/offer/OfferSignForm'

export const dynamic = 'force-dynamic'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f3f6f7', padding: '24px 12px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', background: '#ffffff', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '32px 34px' }}>
        {children}
      </div>
      <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 16, fontFamily: 'Arial, sans-serif' }}>
        The GoLive Digital Solutions Company Ltd &middot; RC1644767 &middot; Secure offer portal
      </p>
    </div>
  )
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <Shell>
      <div style={{ textAlign: 'center', padding: '40px 10px', fontFamily: 'Arial, sans-serif' }}>
        <h2 style={{ color: '#0e7c86', marginBottom: 10 }}>{title}</h2>
        <p style={{ color: '#4b5563', lineHeight: 1.6 }}>{body}</p>
      </div>
    </Shell>
  )
}

export default async function OfferPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const v = verifyOfferToken(token)
  if (!v) {
    return (
      <Notice
        title="This offer link is invalid or has expired"
        body="If your acceptance window has passed or the link was mistyped, please contact talent.acquisition@golivecompany.com and we will assist you."
      />
    )
  }

  await connectDB()
  const app = (await Application.findOne({ ref: v.ref }).lean()) as any
  if (!app || !app.offer || !app.offer.sentAt) {
    return (
      <Notice
        title="Offer not found"
        body="We could not locate an active offer for this link. Please contact talent.acquisition@golivecompany.com."
      />
    )
  }

  const html = buildOfferHtml({
    ref: app.ref,
    name: app.name,
    email: app.email,
    role: app.role,
    jobCode: app.offer.jobCode,
    salary: app.offer.salary,
    startDate: app.offer.startDate,
    deadline: app.offer.deadline,
    sentAt: app.offer.sentAt,
    candidateSignedAt: app.offer.candidateSignedAt,
    candidateSignedName: app.offer.candidateSignedName,
    candidateIp: app.offer.candidateIp,
    mdSignedAt: app.offer.mdSignedAt,
    mdSignedName: app.offer.mdSignedName,
    employeeNumber: app.employeeNumber,
  })

  return (
    <Shell>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <OfferSignForm
        token={token}
        candidateName={app.name}
        alreadySignedAt={app.offer.candidateSignedAt ? String(app.offer.candidateSignedAt) : null}
        fullyExecuted={!!app.offer.mdSignedAt}
      />
    </Shell>
  )
}
