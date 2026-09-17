import { verifyIssuanceToken } from '@/lib/issuanceToken'
import { connectDB } from '@/lib/mongodb'
import DocumentIssuance from '@/models/DocumentIssuance'
import IssueAckForm from '@/components/issuance/IssueAckForm'

export const dynamic = 'force-dynamic'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f3f6f7', padding: '24px 12px', fontFamily: "Arial, 'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 760, margin: '0 auto', background: '#ffffff', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '32px 34px' }}>
        {children}
      </div>
      <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 16 }}>
        The GoLive Digital Solutions Company Ltd &middot; RC1644767 &middot; Secure document portal
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

export default async function IssuancePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const v = verifyIssuanceToken(token)
  if (!v) {
    return (
      <Notice
        title="This link is invalid or has expired"
        body="Please contact contact@golivecompany.com and a fresh link will be sent to you."
      />
    )
  }

  await connectDB()
  const iss = await DocumentIssuance.findOne({ ref: v.ref }).lean() as {
    ref: string; employeeName: string; employeeNumber: string
    role?: string; title: string; message?: string
    docs?: { filename: string; label?: string; acknowledgedAt?: Date }[]
    sentAt?: Date; signedAt?: Date; signatureName?: string
    mdSignedName?: string; mdSignedAt?: Date
  } | null

  if (!iss || !iss.sentAt) {
    return <Notice title="Nothing to sign" body="No documents are attached to this link." />
  }

  return (
    <Shell>
      <div>
        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0e7c86', fontWeight: 700, margin: 0 }}>
          The GoLive Digital Solutions Company Ltd
        </p>
        <h1 style={{ fontSize: 22, color: '#14304a', margin: '6px 0 4px' }}>{iss.title}</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
          {iss.employeeName} &middot; {iss.employeeNumber}{iss.role ? ` \u00B7 ${iss.role}` : ''} &middot; Reference {iss.ref}
        </p>
        {iss.message && (
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginTop: 16 }}>{iss.message}</p>
        )}
      </div>

      <IssueAckForm
        token={token}
        employeeName={iss.employeeName}
        docs={(iss.docs || []).map((d) => ({
          filename: d.filename,
          label: d.label || d.filename,
          acknowledgedAt: d.acknowledgedAt ? new Date(d.acknowledgedAt).toISOString() : null,
        }))}
        alreadySigned={!!iss.signedAt}
        signatureName={iss.signatureName || null}
        signedAt={iss.signedAt ? new Date(iss.signedAt).toISOString() : null}
        mdSignedName={iss.mdSignedName || null}
        mdSignedAt={iss.mdSignedAt ? new Date(iss.mdSignedAt).toISOString() : null}
      />
    </Shell>
  )
}
