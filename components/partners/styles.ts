/* Partner Network pages: the same Fluent 2 tokens as /careers, so the two
   public surfaces read as one system. Brand ramp from GoLive teal #12A2C6. */
export const PARTNER_CSS = `
.gp {
  --brand: #12a2c6; --brand-hover: #0f8fb0; --brand-pressed: #0b7e9b;
  --brand-tint: #e8f7fb; --brand-stroke: #a3dbe9;
  --fg1: #242424; --fg2: #424242; --fg3: #616161;
  --bg1: #ffffff; --bg2: #fafafa; --bg3: #f5f5f5; --bg4: #f0f0f0; --canvas: #f5f5f5;
  --stroke1: #d1d1d1; --stroke2: #e0e0e0; --stroke3: #f0f0f0;
  --danger: #c50f1f; --danger-tint: #fdf3f4; --warn: #8a5100; --warn-tint: #fff9f5; --ok: #0e700e; --ok-tint: #f1faf1;
  --shadow4: 0 0 2px rgba(0,0,0,.12), 0 2px 4px rgba(0,0,0,.14);
  --r-m: 4px; --r-l: 8px; --grid: 1192px;
  min-height: 100vh; background: var(--canvas); color: var(--fg1);
  font-family: var(--font-jakarta), 'Segoe UI', system-ui, sans-serif;
  font-size: 14px; line-height: 20px; -webkit-font-smoothing: antialiased;
}
.gp *, .gp *::before, .gp *::after { box-sizing: border-box; }
.gp a { color: var(--brand-pressed); }
.gp :focus-visible { outline: 2px solid var(--fg1); outline-offset: 2px; border-radius: var(--r-m); }

.gp-header { background: var(--bg1); border-bottom: 1px solid var(--stroke2); }
.gp-header-inner { max-width: var(--grid); margin: 0 auto; padding: 0 24px; height: 76px; display: flex; align-items: center; gap: 16px; }
.gp-brand { display: block; margin-left: -6px; }
.gp-brand img { height: 56px; width: auto; display: block; }
.gp-sep { width: 1px; height: 28px; background: var(--stroke1); }
.gp-section { font-size: 16px; font-weight: 600; letter-spacing: -0.2px; }
.gp-contact { margin-left: auto; font-size: 14px; color: var(--fg2) !important; text-decoration: none; }
.gp-contact:hover { color: var(--brand-pressed) !important; }

.gp-page { max-width: var(--grid); margin: 0 auto; padding: 36px 24px 56px; }
.gp-narrow { max-width: 880px; }
.gp-pane { background: var(--bg1); border-radius: var(--r-l); box-shadow: var(--shadow4); padding: 24px; }
.gp-pane + .gp-pane { margin-top: 20px; }
.gp-hero .gp-pane + .gp-pane { margin-top: 0; }
.gp-hero + .gp-pane { margin-top: 20px; }
.gp h1 { font-size: 40px; line-height: 44px; font-weight: 600; letter-spacing: -0.6px; margin: 0 0 12px; }
.gp h2 { font-size: 24px; line-height: 32px; font-weight: 600; letter-spacing: -0.3px; margin: 0 0 14px; }
.gp h3 { font-size: 16px; line-height: 22px; font-weight: 600; margin: 0 0 6px; }
.gp-lede { margin: 0; color: var(--fg2); font-size: 16px; line-height: 24px; max-width: 64ch; }
.gp-muted { color: var(--fg3); font-size: 13px; line-height: 19px; }

.gp-hero { display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; align-items: stretch; }
.gp-hero-main { padding: 32px; }
.gp-hero-side { padding: 24px; display: flex; flex-direction: column; gap: 14px; }
.gp-fact { border-left: 3px solid var(--brand); padding: 2px 0 2px 12px; }
.gp-fact b { display: block; font-size: 15px; }
.gp-fact span { color: var(--fg2); font-size: 13px; line-height: 19px; }
.gp-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 22px; }

.gp-btn { height: 32px; padding: 0 14px; border-radius: var(--r-m); border: 1px solid var(--stroke1); background: var(--bg1); color: var(--fg1) !important;
  font: 600 14px/30px var(--font-jakarta), 'Segoe UI', sans-serif; text-decoration: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
.gp-btn:hover { background: var(--bg3); }
.gp-btn:disabled { opacity: .55; cursor: default; }
.gp-primary { background: var(--brand-hover); border-color: transparent; color: #fff !important; }
.gp-primary:hover { background: var(--brand-pressed); }
.gp-lg { height: 40px; padding: 0 20px; font-size: 15px; line-height: 38px; }
.gp-link { border: 0; background: none; padding: 0; font: inherit; color: var(--brand-pressed); cursor: pointer; text-decoration: underline; }

.gp-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.gp-card { border: 1px solid var(--stroke2); border-radius: var(--r-l); padding: 18px; }
.gp-card p { margin: 6px 0 0; color: var(--fg2); line-height: 20px; }
.gp-tag { display: inline-flex; height: 22px; align-items: center; padding: 0 8px; border-radius: 11px; background: var(--brand-tint);
  color: var(--brand-pressed); font-size: 12px; font-weight: 600; }
.gp-list { margin: 0; padding-left: 18px; color: var(--fg2); }
.gp-list li { margin-bottom: 6px; }
.gp-steps { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin: 0; padding: 0; list-style: none; }
.gp-step { border: 1px solid var(--stroke2); border-radius: var(--r-l); padding: 14px; display: flex; flex-direction: column; gap: 4px; }
.gp-step-n { width: 24px; height: 24px; border-radius: 12px; background: var(--brand); color: #fff; font-size: 12px; font-weight: 700;
  display: grid; place-items: center; margin-bottom: 6px; }
.gp-step b { font-size: 14px; }
.gp-step span:last-child { color: var(--fg2); font-size: 12.5px; line-height: 18px; }
.gp-rules { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.gp-rule { background: var(--bg3); border-radius: var(--r-m); padding: 12px 14px; color: var(--fg2); font-size: 13px; line-height: 19px; }
.gp-rule b { color: var(--fg1); display: block; margin-bottom: 2px; }

/* form */
.gp-progress { display: flex; gap: 6px; margin: 0 0 20px; padding: 0; list-style: none; }
.gp-progress li { flex: 1; }
.gp-progress button { width: 100%; border: 0; background: none; padding: 0; text-align: left; font: inherit; cursor: pointer; color: var(--fg3); }
.gp-progress button:disabled { cursor: default; }
.gp-progress .bar { display: block; height: 4px; border-radius: 2px; background: var(--stroke2); margin-bottom: 6px; }
.gp-progress .on .bar { background: var(--brand); }
.gp-progress .cur { color: var(--fg1); font-weight: 600; }
.gp-progress small { font-size: 12px; }
.gp-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }
.gp-field { display: flex; flex-direction: column; gap: 4px; font-size: 13px; font-weight: 600; color: var(--fg2); }
.gp-field.wide { grid-column: 1 / -1; }
.gp-field em { font-style: normal; color: var(--danger); }
.gp-field small { font-weight: 400; color: var(--fg3); font-size: 12px; line-height: 17px; }
.gp input[type=text], .gp input[type=email], .gp input[type=tel], .gp input[type=url], .gp textarea, .gp select {
  font: inherit; font-weight: 400; color: var(--fg1); border: 1px solid var(--stroke1); border-bottom-color: var(--fg3); border-radius: var(--r-m);
  padding: 7px 10px; background: var(--bg1); width: 100%; }
.gp textarea { min-height: 76px; resize: vertical; }
.gp input:focus, .gp textarea:focus, .gp select:focus { outline: 2px solid var(--brand-pressed); outline-offset: -1px; border-color: var(--brand-pressed); }
.gp-choice { display: flex; gap: 10px; align-items: flex-start; border: 1px solid var(--stroke2); border-radius: var(--r-l); padding: 14px; cursor: pointer; font-weight: 400; color: var(--fg1); }
.gp-choice:hover { background: var(--bg2); }
.gp-choice input { margin-top: 3px; accent-color: var(--brand-pressed); }
.gp-choice.sel { border-color: var(--brand); background: var(--brand-tint); }
.gp-choice b { display: block; }
.gp-choice span { color: var(--fg2); font-size: 13px; line-height: 19px; }
.gp-checks { display: grid; gap: 8px; }
.gp-check { display: flex; gap: 10px; align-items: flex-start; font-weight: 400; color: var(--fg1); line-height: 20px; cursor: pointer; }
.gp-check input { margin-top: 3px; accent-color: var(--brand-pressed); flex: none; }
.gp-yn { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--stroke3); }
.gp-yn:last-child { border-bottom: 0; }
.gp-seg { display: inline-flex; border: 1px solid var(--stroke1); border-radius: var(--r-m); overflow: hidden; }
.gp-seg button { border: 0; background: var(--bg1); padding: 0 14px; height: 30px; font: 600 13px var(--font-jakarta), sans-serif; color: var(--fg2); cursor: pointer; }
.gp-seg button + button { border-left: 1px solid var(--stroke1); }
.gp-seg button[aria-pressed="true"] { background: var(--brand-hover); color: #fff; }
.gp-acc { border: 1px solid var(--stroke2); border-radius: var(--r-l); padding: 14px; margin-bottom: 12px; }
.gp-acc-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-weight: 600; }
.gp-nav { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--stroke2); }
.gp-alert { border-radius: var(--r-m); padding: 10px 12px; font-size: 13px; line-height: 19px; margin: 14px 0 0; }
.gp-err { background: var(--danger-tint); color: var(--danger); font-weight: 600; }
.gp-note { background: var(--brand-tint); color: var(--fg1); }
.gp-okbox { background: var(--ok-tint); color: var(--ok); font-weight: 600; }
.gp-review { display: grid; grid-template-columns: 200px 1fr; gap: 6px 16px; margin: 0; }
.gp-review dt { color: var(--fg3); font-size: 13px; }
.gp-review dd { margin: 0; }
.gp-subhead { font-size: 13px; font-weight: 700; color: var(--fg3); text-transform: none; margin: 18px 0 8px; }
.gp-verify { display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap; }
.gp-verify .gp-field { flex: 0 0 180px; }
.gp-hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.gp-done { text-align: center; padding: 40px 24px; }
.gp-done .ref { display: inline-block; margin: 10px 0 14px; font-size: 22px; font-weight: 700; letter-spacing: .04em; color: var(--brand-pressed); }

.gp-footer { background: var(--bg1); border-top: 1px solid var(--stroke2); }
.gp-footer-inner { max-width: var(--grid); margin: 0 auto; padding: 18px 24px; display: flex; flex-wrap: wrap; align-items: center; gap: 10px 24px; color: var(--fg3); font-size: 12.5px; }
.gp-footer-inner img { height: 38px; width: auto; margin-left: -4px; }

@media (max-width: 960px) {
  .gp-hero, .gp-grid2, .gp-rules { grid-template-columns: 1fr; }
  .gp-steps { grid-template-columns: 1fr 1fr; }
  .gp-fields { grid-template-columns: 1fr; }
  .gp-review { grid-template-columns: 1fr; }
  .gp-review dt { margin-top: 8px; }
  .gp h1 { font-size: 32px; line-height: 36px; }
  .gp-sep, .gp-section, .gp-contact { display: none; }
  .gp-progress small { display: none; }
  .gp-yn { grid-template-columns: 1fr; gap: 8px; }
}
`
