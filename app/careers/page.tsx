import { Plus_Jakarta_Sans } from 'next/font/google'
import { CAREERS, CAREERS_CONTACT } from '@/lib/careersConfig'
import CareersBoard from '@/components/careers/CareersBoard'

export const dynamic = 'force-static'

const jakarta = Plus_Jakarta_Sans({
  // latin-ext is required: the Naira sign (U+20A6) is not in the latin subset,
  // so without it every salary would fall back to a system font for the glyph.
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata = {
  title: 'Careers | GoLive Digital Solutions',
  description:
    'Open roles at The GoLive Digital Solutions Company Ltd in Lagos. Salary ranges published for every position.',
}

const STEPS: [string, string][] = [
  ['Application review', 'We read every CV against the published requirements.'],
  ['Online assessment', 'Shortlisted applicants complete a structured, proctored assessment.'],
  ['Interview', 'A structured conversation with the Managing Director.'],
  ['Offer', 'Issued digitally and signed electronically on this portal.'],
  ['Screening', 'Pre-employment checks by Background Check International.'],
]

export default function CareersPage() {
  const openCount = CAREERS.filter((r) => r.open).length

  return (
    <div className={`${jakarta.variable} gl-careers`}>
      <style>{CSS}</style>

      <header className="gl-header">
        <div className="gl-header-inner">
          <a href="/" className="gl-brand" aria-label="GoLive Digital Solutions Company, home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/golive-logo.png" alt="GoLive Digital Solutions Company" />
          </a>
          <span className="gl-sep" aria-hidden="true" />
          <span className="gl-section">Careers</span>
          <a className="gl-contact" href={`mailto:${CAREERS_CONTACT}`}>{CAREERS_CONTACT}</a>
        </div>
      </header>

      <main className="gl-page">
        <div className="gl-titlebar">
          <div>
            <h1>Open roles</h1>
            <p>
              We build cloud, hosting and software for African businesses, including Microsoft 365 as a
              licensed Cloud Solution Provider. Salary ranges are published for every role.
            </p>
          </div>
          <span className="gl-badge">{openCount} open in Lagos</span>
        </div>

        <CareersBoard roles={CAREERS} contact={CAREERS_CONTACT} />

        <section className="cb-pane gl-process" aria-labelledby="hire-h">
          <h2 id="hire-h">How we hire</h2>
          <ol className="gl-steps">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="gl-step">
                <span className="gl-step-n" aria-hidden="true">{i + 1}</span>
                <b>{t}</b>
                <span>{d}</span>
              </li>
            ))}
          </ol>
          <p className="gl-privacy">
            Personal data submitted during recruitment is processed under the Nigeria Data Protection Act
            2023 and our <a href="/privacy">Privacy Policy</a>. Assessment data for unsuccessful
            applications is deleted on a fixed retention schedule.
          </p>
        </section>
      </main>

      <footer className="gl-footer">
        <div className="gl-footer-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/golive-logo.png" alt="" />
          <span>The GoLive Digital Solutions Company Ltd, RC1644767</span>
          <span>Lagos, Nigeria</span>
          <a href={`mailto:${CAREERS_CONTACT}`}>{CAREERS_CONTACT}</a>
        </div>
      </footer>
    </div>
  )
}

/* Fluent 2 tokens: neutral ramp, 4px/8px corner radii, shadow4 on panes,
   shadow28 on the drawer. Brand ramp built from GoLive teal #12A2C6. */
const CSS = `
.gl-careers {
  --brand: #12a2c6; --brand-hover: #0f8fb0; --brand-pressed: #0b7e9b;
  --brand-tint: #e8f7fb; --brand-stroke: #a3dbe9;
  --fg1: #242424; --fg2: #424242; --fg3: #616161;
  --bg1: #ffffff; --bg2: #fafafa; --bg3: #f5f5f5; --bg4: #f0f0f0; --canvas: #f5f5f5;
  --stroke1: #d1d1d1; --stroke2: #e0e0e0; --stroke3: #f0f0f0;
  --shadow4: 0 0 2px rgba(0,0,0,.12), 0 2px 4px rgba(0,0,0,.14);
  --shadow28: 0 0 8px rgba(0,0,0,.12), 0 14px 28px rgba(0,0,0,.14);
  --r-m: 4px; --r-l: 8px;
  --grid: 1192px;
  min-height: 100vh; background: var(--canvas); color: var(--fg1);
  font-family: var(--font-jakarta), 'Segoe UI', system-ui, sans-serif;
  font-size: 14px; line-height: 20px; -webkit-font-smoothing: antialiased;
}
.gl-careers *, .gl-careers *::before, .gl-careers *::after { box-sizing: border-box; }
.gl-careers a { color: var(--brand-pressed); }
.gl-careers :focus-visible { outline: 2px solid var(--fg1); outline-offset: 2px; border-radius: var(--r-m); }

.gl-header { background: var(--bg1); border-bottom: 1px solid var(--stroke2); }
.gl-header-inner { max-width: var(--grid); margin: 0 auto; padding: 0 24px; height: 76px; display: flex; align-items: center; gap: 16px; }
.gl-brand { display: block; margin-left: -6px; }
.gl-brand img { height: 56px; width: auto; display: block; }
.gl-sep { width: 1px; height: 28px; background: var(--stroke1); }
.gl-section { font-size: 16px; font-weight: 600; letter-spacing: -0.2px; }
.gl-contact { margin-left: auto; font-size: 14px; color: var(--fg2) !important; text-decoration: none; }
.gl-contact:hover { color: var(--brand-pressed) !important; }

.gl-page { max-width: var(--grid); margin: 0 auto; padding: 36px 24px 56px; }
.gl-titlebar { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
.gl-titlebar h1 { font-size: 40px; line-height: 42px; font-weight: 600; letter-spacing: -0.5px; margin: 0 0 10px; }
.gl-titlebar p { margin: 0; color: var(--fg2); font-size: 16px; line-height: 24px; max-width: 64ch; }
.gl-badge { flex: none; display: inline-flex; align-items: center; height: 28px; padding: 0 12px; border-radius: 14px;
  background: var(--brand-tint); color: var(--brand-pressed); border: 1px solid var(--brand-stroke); font-size: 13px; font-weight: 600; }

.cb-pane { background: var(--bg1); border-radius: var(--r-l); box-shadow: var(--shadow4); }
.cb-layout { display: grid; grid-template-columns: 272px 1fr; gap: 20px; align-items: start; }
.cb-filters { padding: 8px; position: sticky; top: 16px; }
.cb-filters-label { font-size: 12px; font-weight: 600; color: var(--fg3); margin: 8px 10px 6px; }
.cb-tab { position: relative; display: flex; justify-content: space-between; gap: 12px; width: 100%; border: 0; background: transparent;
  text-align: left; padding: 9px 12px 9px 16px; border-radius: var(--r-m); font: inherit; color: var(--fg2); cursor: pointer; }
.cb-tab:hover { background: var(--bg3); color: var(--fg1); }
.cb-tab[aria-selected="true"] { background: var(--bg3); color: var(--fg1); font-weight: 600; }
.cb-tab[aria-selected="true"]::before { content: ''; position: absolute; left: 5px; top: 9px; bottom: 9px; width: 3px; border-radius: 2px; background: var(--brand); }
.cb-tab small { color: var(--fg3); font-weight: 400; font-size: 12px; }

.cb-table { overflow: hidden; }
.cb-thead, .cb-row { display: grid; grid-template-columns: minmax(0,2.2fr) minmax(0,1.7fr) minmax(0,0.9fr) minmax(0,1.4fr); gap: 16px; align-items: center; padding: 0 22px; }
.cb-thead { height: 42px; font-size: 12px; font-weight: 600; color: var(--fg3); border-bottom: 1px solid var(--stroke2); }
.cb-row { min-height: 60px; width: 100%; border: 0; border-bottom: 1px solid var(--stroke3); background: transparent;
  font: inherit; text-align: left; color: inherit; cursor: pointer; }
button.cb-row:hover { background: var(--bg2); }
button.cb-row:hover .cb-title { color: var(--brand-pressed); }
.cb-title { font-weight: 600; font-size: 15px; letter-spacing: -0.2px; color: var(--fg1); }
.cb-meta { color: var(--fg2); }
.cb-num { text-align: right; font-variant-numeric: tabular-nums; }
.cb-group { height: 38px; display: flex; align-items: center; padding: 0 22px; font-size: 12px; font-weight: 600; color: var(--fg3);
  background: var(--bg2); border-bottom: 1px solid var(--stroke3); }
.cb-filled { cursor: default; }
.cb-filled .cb-title, .cb-filled .cb-meta { color: var(--fg3); }
.cb-badge { white-space: nowrap; display: inline-flex; height: 22px; align-items: center; padding: 0 8px; border-radius: 11px; background: var(--bg4);
  color: var(--fg2); font-size: 12px; font-weight: 600; }
.cb-empty { padding: 28px 22px; color: var(--fg2); font-size: 15px; }

.gl-process { margin-top: 20px; padding: 24px; }
.gl-process h2 { font-size: 24px; line-height: 32px; font-weight: 600; letter-spacing: -0.3px; margin: 0 0 16px; }
.gl-steps { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 0; padding: 0; list-style: none; }
.gl-step { border: 1px solid var(--stroke2); border-radius: var(--r-l); padding: 16px; display: flex; flex-direction: column; gap: 4px; }
.gl-step-n { width: 26px; height: 26px; border-radius: 13px; background: var(--brand); color: #fff; font-size: 12px; font-weight: 700;
  display: grid; place-items: center; margin-bottom: 8px; }
.gl-step b { font-weight: 600; font-size: 15px; }
.gl-step span:last-child { color: var(--fg2); font-size: 13px; line-height: 19px; }
.gl-privacy { margin: 18px 0 0; color: var(--fg3); font-size: 12.5px; line-height: 18px; }

.gl-footer { background: var(--bg1); border-top: 1px solid var(--stroke2); }
.gl-footer-inner { max-width: var(--grid); margin: 0 auto; padding: 18px 24px; display: flex; flex-wrap: wrap; align-items: center; gap: 10px 24px;
  color: var(--fg3); font-size: 12.5px; }
.gl-footer-inner img { height: 38px; width: auto; margin-left: -4px; }

.cb-overlay { position: fixed; inset: 0; pointer-events: none; z-index: 50; }
.cb-overlay.is-open { pointer-events: auto; }
.cb-scrim { position: absolute; inset: 0; background: rgba(0,0,0,.4); opacity: 0; transition: opacity .2s; }
.cb-overlay.is-open .cb-scrim { opacity: 1; }
.cb-drawer { position: absolute; top: 0; right: 0; bottom: 0; width: min(580px, 100%); background: var(--bg1); box-shadow: var(--shadow28);
  transform: translateX(100%); transition: transform .26s cubic-bezier(.1,.9,.2,1); display: flex; flex-direction: column; }
.cb-overlay.is-open .cb-drawer { transform: none; }
.cb-dh { padding: 24px 24px 12px; display: flex; justify-content: space-between; gap: 16px; }
.cb-dh h2 { font-size: 24px; line-height: 30px; font-weight: 600; letter-spacing: -0.4px; margin: 0 0 2px; }
.cb-dh p { margin: 0; color: var(--fg2); }
.cb-x { flex: none; width: 32px; height: 32px; border: 0; background: transparent; border-radius: var(--r-m); color: var(--fg2);
  display: grid; place-items: center; cursor: pointer; }
.cb-x:hover { background: var(--bg3); color: var(--fg1); }
.cb-db { padding: 4px 24px 12px; overflow: auto; flex: 1; }
.cb-summary { font-size: 15px; line-height: 23px; color: var(--fg1); margin: 0 0 18px; }
.cb-facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 8px; }
.cb-facts > div { background: var(--bg3); border-radius: var(--r-m); padding: 10px 12px; }
.cb-facts small { display: block; color: var(--fg3); font-size: 12px; line-height: 16px; }
.cb-facts b { font-weight: 600; }
.cb-facts .cb-plus { margin-top: 2px; }
.cb-db h3 { font-size: 14px; font-weight: 600; margin: 20px 0 8px; }
.cb-db ul { margin: 0; padding-left: 18px; color: var(--fg2); }
.cb-db li { margin-bottom: 7px; line-height: 20px; }
.cb-df { border-top: 1px solid var(--stroke2); padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.cb-df p { margin: 0; color: var(--fg3); font-size: 12.5px; max-width: 36ch; }
.cb-actions { display: flex; gap: 8px; }
.cb-btn { height: 32px; padding: 0 14px; border-radius: var(--r-m); border: 1px solid var(--stroke1); background: var(--bg1); color: var(--fg1) !important;
  font: 600 14px/30px var(--font-jakarta), sans-serif; text-decoration: none; cursor: pointer; display: inline-block; }
.cb-btn:hover { background: var(--bg3); }
.cb-primary { background: var(--brand-hover); border-color: transparent; color: #fff !important; }
.cb-primary:hover { background: var(--brand-pressed); }

@media (max-width: 900px) {
  .cb-layout { grid-template-columns: 1fr; }
  .cb-filters { position: static; }
  .cb-filters [role="tablist"] { display: flex; overflow-x: auto; gap: 4px; }
  .cb-tab { width: auto; white-space: nowrap; }
  .gl-steps { grid-template-columns: 1fr 1fr; }
  .cb-thead { display: none; }
  .cb-row { grid-template-columns: 1fr auto; padding: 14px 16px; gap: 4px 12px; }
  .cb-title { grid-column: 1; }
  .cb-meta { grid-column: 1; }
  .cb-type { display: none; }
  .cb-num { grid-column: 2; grid-row: 1 / span 2; }
  .gl-sep, .gl-section, .gl-contact { display: none; }
  .gl-titlebar { flex-direction: column; align-items: flex-start; }
  .gl-titlebar h1 { font-size: 32px; line-height: 36px; }
  .cb-facts { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .cb-scrim, .cb-drawer { transition: none; }
}
`
