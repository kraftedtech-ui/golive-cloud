/**
 * Adds a proper, toggleable VAT line to the Proposal Generator.
 *
 *   - Rate defaults by billing currency (NGN 7.5%, GHS 15%, KES 16%, ZAR 15%)
 *   - Applied AFTER discount, to subscription + setup fee
 *   - Its own row on the preview and the printed PDF
 *   - When switched off, the PDF states "Exclusive of VAT" rather than
 *     leaving the customer to assume the total is tax-inclusive
 *   - Customer TIN captured (required on a Nigerian B2B e-invoice)
 *   - Gross profit and commission are deliberately untouched: VAT is collected
 *     on behalf of the revenue service and was never part of margin
 *
 * Run from the repo root:  node patch-vat-line.js
 * Idempotent — safe to re-run.
 *
 * REQUIRES patch-proposal-invoice.js to have been applied first.
 */

const fs = require('fs');

const PAGE = 'app/portal/page.tsx';

if (!fs.existsSync(PAGE)) {
  console.error('\u2717 Not found: ' + PAGE + '  (run from the repo root)');
  process.exit(1);
}

let s = fs.readFileSync(PAGE, 'utf8');
let changed = false;

function step(name, guard, oldStr, newStr, optional) {
  if (s.includes(guard)) { console.log('\u2022 ' + name + ' — already present'); return; }
  if (!s.includes(oldStr)) {
    if (optional) { console.log('\u26a0 ' + name + ' — anchor not found, SKIPPED'); return; }
    console.error('\u2717 ' + name + ' failed: anchor not found');
    console.error('  Has patch-proposal-invoice.js been applied?');
    process.exit(1);
  }
  s = s.replace(oldStr, newStr);
  console.log('\u2713 ' + name);
  changed = true;
}

/* ================================================================== */
/* 1. Default rate table                                               */
/* ================================================================== */

step(
  '1 default VAT rates by currency',
  'DEFAULT_VAT_RATES',
  'function ProposalContent({ leads, isAdmin, userEmail, prefill, onPrefillConsumed }: {',
  [
    '// Standard consumption-tax rate for each billing currency we support. These',
    '// are defaults to save typing, not tax advice \u2014 the rate stays editable per',
    '// quote, and cross-border supplies may be zero-rated or trigger a',
    "// registration obligation in the customer's own country.",
    'const DEFAULT_VAT_RATES: Record<string, number> = {',
    '  NGN: 7.5,  // Nigeria VAT',
    '  GHS: 15,   // Ghana VAT (levies charged separately)',
    '  KES: 16,   // Kenya VAT',
    '  ZAR: 15,   // South Africa VAT',
    '  USD: 0,    // no default \u2014 depends where the customer is established',
    '}',
    '',
    'function ProposalContent({ leads, isAdmin, userEmail, prefill, onPrefillConsumed }: {',
  ].join('\n')
);

/* ================================================================== */
/* 2. State                                                            */
/* ================================================================== */

step(
  '2a VAT state',
  'const [vatEnabled, setVatEnabled]',
  "  const [discountPct, setDiscountPct] = useState('')",
  [
    "  const [discountPct, setDiscountPct] = useState('')",
    '  const [vatEnabled, setVatEnabled] = useState(true)',
    "  const [vatRatePct, setVatRatePct] = useState('7.5')",
    "  const [customerTIN, setCustomerTIN] = useState('')",
  ].join('\n')
);

step(
  '2b follow the currency when it changes',
  'DEFAULT_VAT_RATES[currency]',
  '  function handleSetupInputChange(value: string) {',
  [
    '  // Currency is derived from the lead\'s country, so it is the best available',
    '  // proxy for which jurisdiction\'s VAT applies. Reps can still override.',
    '  useEffect(() => {',
    '    const rate = DEFAULT_VAT_RATES[currency]',
    '    if (rate !== undefined) {',
    '      setVatRatePct(String(rate))',
    '      setVatEnabled(rate > 0)',
    '    }',
    '  }, [currency])',
    '',
    '  function handleSetupInputChange(value: string) {',
  ].join('\n')
);

/* ================================================================== */
/* 3. Maths                                                            */
/* ================================================================== */

step(
  '3 VAT calculation',
  'const vatAmount',
  '  const grandTotalFirstYear = subscriptionAfterDiscount + setupFee',
  [
    '  // VAT sits on top of the discounted subscription plus the setup fee. It is',
    '  // never part of gross profit \u2014 it is collected on behalf of the revenue',
    "  // service \u2014 so none of the commission maths above sees it.",
    '  const netTotal = subscriptionAfterDiscount + setupFee',
    '  const vatRate = vatEnabled ? Math.max(0, parseFloat(vatRatePct) || 0) : 0',
    '  const vatAmount = netTotal * (vatRate / 100)',
    '  const grandTotalFirstYear = netTotal + vatAmount',
  ].join('\n')
);

/* ================================================================== */
/* 4. Printed PDF                                                      */
/* ================================================================== */

step(
  '4a VAT + net rows on PDF',
  'Subtotal (excl. VAT)',
  '          <tr class="total-row"><td>Total first year investment</td><td>${sym}${(grandTotalFirstYear).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td></tr>',
  [
    '          ${vatRate > 0 ? `<tr><td style="color:#5c7184">Subtotal (excl. VAT)</td><td>${sym}${netTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td></tr>',
    '          <tr><td style="color:#5c7184">VAT @ ${vatRate}%</td><td>${sym}${vatAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td></tr>` : \'\'}',
    '          <tr class="total-row"><td>Total first year investment${vatRate > 0 ? \' (incl. VAT)\' : \'\'}</td><td>${sym}${(grandTotalFirstYear).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td></tr>',
    '          ${vatRate === 0 ? \'<tr><td colspan="2" style="color:#5c7184;font-size:11px">Exclusive of VAT. Any tax applicable in the customer\\\'s jurisdiction is payable in addition to the amounts above.</td></tr>\' : \'\'}',
  ].join('\n')
);

step(
  '4b customer TIN on PDF',
  'Tax ID:</span> ${customerTIN}',
  '            <div style="font-size:12px;color:#5c7184;">${lead?.country || \'\'}${lead?.industry ? \' \u00b7 \' + lead.industry : \'\'}</div>',
  [
    '            <div style="font-size:12px;color:#5c7184;">${lead?.country || \'\'}${lead?.industry ? \' \u00b7 \' + lead.industry : \'\'}</div>',
    '            ${customerTIN.trim() ? `<div style="font-size:12px;color:#5c7184;margin-top:4px"><span style="font-weight:600">Tax ID:</span> ${customerTIN}</div>` : \'\'}',
  ].join('\n')
);

/* ================================================================== */
/* 5. Preview                                                          */
/* ================================================================== */

step(
  '5 VAT rows in preview',
  'VAT ({vatRate}%)',
  '          <div className="flex justify-between py-2 mt-1"><span className="font-bold text-foreground">Total first year</span>',
  [
    '          {vatRate > 0 && (',
    '            <>',
    '              <div className="flex justify-between py-1 border-b border-border/50">',
    '                <span className="text-muted-foreground">Subtotal (excl. VAT)</span>',
    '                <span className="font-medium">{sym}{netTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>',
    '              </div>',
    '              <div className="flex justify-between py-1 border-b border-border/50">',
    '                <span className="text-muted-foreground">VAT ({vatRate}%)</span>',
    '                <span className="font-medium">{sym}{vatAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>',
    '              </div>',
    '            </>',
    '          )}',
    '          <div className="flex justify-between py-2 mt-1"><span className="font-bold text-foreground">Total first year</span>',
  ].join('\n')
);

/* ================================================================== */
/* 6. UI control                                                       */
/* ================================================================== */

const UI_ANCHOR = '\n        <div>\n          <label className="mb-1.5 block text-xs font-medium text-foreground">Discount (% off subscription)</label>';

step(
  '6 VAT control + TIN field',
  'Charge VAT on this quote',
  UI_ANCHOR,
  [
    '',
    '        <div className="rounded-xl border border-border p-3 space-y-2.5">',
    '          <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">',
    '            <input type="checkbox" checked={vatEnabled} onChange={e => setVatEnabled(e.target.checked)} />',
    '            Charge VAT on this quote',
    '          </label>',
    '          {vatEnabled ? (',
    '            <div className="grid grid-cols-2 gap-2.5">',
    '              <div>',
    '                <label className="mb-1 block text-[11px] text-muted-foreground">VAT rate (%)</label>',
    '                <input type="number" min={0} step="0.5" value={vatRatePct} onChange={e => setVatRatePct(e.target.value)}',
    '                  className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />',
    '              </div>',
    '              <div>',
    '                <label className="mb-1 block text-[11px] text-muted-foreground">Customer Tax ID (TIN)</label>',
    '                <input value={customerTIN} onChange={e => setCustomerTIN(e.target.value)} placeholder="Required for e-invoicing"',
    '                  className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />',
    '              </div>',
    '            </div>',
    '          ) : (',
    '            <p className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-[10px] text-amber-800">',
    '              \u26a0 The proposal will state it is exclusive of VAT. If GoLive is required to charge it and does not, the tax authority assesses GoLive \u2014 it comes out of margin, not the customer.',
    '            </p>',
    '          )}',
    '          {vatEnabled && !customerTIN.trim() && currency === \'NGN\' && (',
    '            <p className="text-[10px] text-amber-700">A customer TIN is needed before this can be cleared as a B2B e-invoice.</p>',
    '          )}',
    '          {vatEnabled && vatAmount > 0 && (',
    '            <p className="text-[10px] text-muted-foreground">',
    '              VAT of {sym}{vatAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} is collected on behalf of the tax authority \u2014 it is not revenue and does not affect the gross profit shown below.',
    '              {currency === \'NGN\' && \' A VAT-registered customer normally reclaims this, so waiving it costs GoLive far more than it saves them.\'}',
    '            </p>',
    '          )}',
    '        </div>',
    UI_ANCHOR,
  ].join('\n')
);

fs.writeFileSync(PAGE, s, 'utf8');

console.log(changed ? '\n\u2713 Done. Next: npm run build' : '\nNothing to do \u2014 already patched.');
console.log('\nDefaults applied by currency: NGN 7.5% \u00b7 GHS 15% \u00b7 KES 16% \u00b7 ZAR 15% \u00b7 USD off.');
console.log('Rates are editable per quote and are defaults for convenience, not tax advice.');
