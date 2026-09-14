import { CAREERS, CAREERS_CONTACT, fmtNairaRange } from '@/lib/careersConfig'

export const dynamic = 'force-static'

export const metadata = {
  title: 'Careers \u2014 GoLive Digital Solutions',
  description:
    'Open roles at The GoLive Digital Solutions Company Ltd: engineering, operations, marketing, hosting support, and sales. Lagos, hybrid, salary ranges published.',
}

const S = {
  page: { minHeight: '100vh', background: '#f3f6f7', fontFamily: "Arial, 'Segoe UI', sans-serif", padding: '28px 14px' } as React.CSSProperties,
  wrap: { maxWidth: 900, margin: '0 auto' } as React.CSSProperties,
  card: { background: '#ffffff', borderRadius: 12, boxShadow: '0 2px 14px rgba(0,0,0,0.06)', padding: '26px 30px', marginBottom: 18 } as React.CSSProperties,
  badge: { display: 'inline-block', background: '#f0f7f8', border: '1px solid #cfe3e5', color: '#0e7c86', borderRadius: 99, padding: '3px 12px', fontSize: 12, fontWeight: 700, marginRight: 8 } as React.CSSProperties,
  h2: { color: '#2d3436', fontSize: 20, margin: '0 0 2px' } as React.CSSProperties,
  band: { color: '#0e7c86', fontWeight: 700, fontSize: 14 } as React.CSSProperties,
  p: { color: '#4b5563', fontSize: 14, lineHeight: 1.65, margin: '10px 0' } as React.CSSProperties,
  hLbl: { color: '#2d3436', fontSize: 13, fontWeight: 700, margin: '14px 0 6px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
  li: { color: '#4b5563', fontSize: 13.5, lineHeight: 1.6, marginBottom: 4 } as React.CSSProperties,
  apply: { display: 'inline-block', background: '#0e7c86', color: '#ffffff', textDecoration: 'none', padding: '10px 22px', borderRadius: 8, fontWeight: 700, fontSize: 14, marginTop: 12 } as React.CSSProperties,
}

export default function CareersPage() {
  const openRoles = CAREERS.filter((r) => r.open)

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={{ ...S.card, textAlign: 'center' }}>
          <div style={{ fontSize: '20pt', fontWeight: 700 }}>
            <span style={{ color: '#0e7c86' }}>go</span>live
          </div>
          <h1 style={{ color: '#2d3436', fontSize: 26, margin: '8px 0 6px' }}>Careers at GoLive</h1>
          <p style={{ ...S.p, maxWidth: 640, margin: '0 auto' }}>
            The GoLive Digital Solutions Company Ltd builds hosting, cloud, and software products for African
            businesses across three arms: GoLive Naija, GoLive Forge, and B2B Services. We are a small, fast company
            where every role carries real ownership. Salary ranges are published for every position, and shortlisted
            candidates complete a structured online assessment before interview.
          </p>
          <p style={{ ...S.p, fontSize: 13, color: '#6b7280' }}>
            {openRoles.length} open position{openRoles.length === 1 ? '' : 's'} · Lagos, Nigeria · Hybrid working
          </p>
        </div>

        {openRoles.map((r) => (
          <div key={r.slug} style={S.card} id={r.slug}>
            <div style={{ marginBottom: 8 }}>
              <span style={S.badge}>{r.department}</span>
              <span style={S.badge}>{r.type}</span>
              <span style={S.badge}>{r.location}</span>
            </div>
            <h2 style={S.h2}>{r.title}</h2>
            <div style={S.band}>
              {fmtNairaRange(r.salaryLower, r.salaryUpper)} monthly gross
              {r.commission ? ' + commission and performance bonuses' : ''}
            </div>
            <p style={S.p}>{r.summary}</p>

            <div style={S.hLbl}>What you will do</div>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {r.responsibilities.map((x, i) => (
                <li key={i} style={S.li}>{x}</li>
              ))}
            </ul>

            <div style={S.hLbl}>What we are looking for</div>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {r.requirements.map((x, i) => (
                <li key={i} style={S.li}>{x}</li>
              ))}
            </ul>

            <a
              style={S.apply}
              href={`mailto:${CAREERS_CONTACT}?subject=${encodeURIComponent('Application: ' + r.title)}`}
            >
              Apply for this role
            </a>
            <p style={{ ...S.p, fontSize: 12, color: '#9ca3af', marginBottom: 0 }}>
              Send your CV and a short note on why this role fits you. Shortlisted applicants receive a link and access
              code for the online assessment.
            </p>
          </div>
        ))}

        <div style={{ ...S.card, fontSize: 12.5, color: '#6b7280', lineHeight: 1.6 }}>
          <strong style={{ color: '#2d3436' }}>How we hire.</strong> Application review, a proctored online assessment,
          a structured interview with the Managing Director, and a digital offer signed electronically on this portal.
          Pre-employment screening is conducted by our verification partner, Background Check International. Personal
          data submitted during recruitment is processed under the Nigeria Data Protection Act 2023 and our{' '}
          <a href="/privacy" style={{ color: '#0e7c86' }}>Privacy Policy</a>; assessment data is deleted on a fixed
          retention schedule for unsuccessful applications.
          <br />
          <br />
          The GoLive Digital Solutions Company Ltd · RC1644767 · Lagos, Nigeria ·{' '}
          <a href={`mailto:${CAREERS_CONTACT}`} style={{ color: '#0e7c86' }}>{CAREERS_CONTACT}</a>
        </div>
      </div>
    </div>
  )
}
