/**
 * Derives commission period (probation vs confirmed) from a rep's start date
 * instead of a manual toggle.
 *
 *   models/User.ts                          — startDate, probationDays, confirmedAt
 *   app/api/users/route.ts                  — accept startDate on invite
 *   components/dashboard/CommissionDashboard.tsx — calculator derives, admin can override
 *   app/portal/page.tsx                     — Deal Economics panel derives
 *
 * Run from the repo root:  node patch-commission-period.js
 * Idempotent — safe to re-run.
 *
 * Copy these in first:
 *   lib/commissionPeriod.ts
 *   app/api/commission-period/route.ts
 */

const fs = require('fs');

const files = {
  USER: 'models/User.ts',
  USERS_API: 'app/api/users/route.ts',
  DASH: 'components/dashboard/CommissionDashboard.tsx',
  PAGE: 'app/portal/page.tsx',
};

for (const f of Object.values(files)) {
  if (!fs.existsSync(f)) {
    console.error('\u2717 Not found: ' + f + '  (run from the repo root)');
    process.exit(1);
  }
}

let changed = false;

function patch(file, name, guard, oldStr, newStr, optional) {
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes(guard)) { console.log('\u2022 ' + name + ' — already present'); return; }
  if (!s.includes(oldStr)) {
    if (optional) { console.log('\u26a0 ' + name + ' — anchor not found, SKIPPED'); return; }
    console.error('\u2717 ' + name + ' failed: anchor not found in ' + file);
    process.exit(1);
  }
  fs.writeFileSync(file, s.replace(oldStr, newStr), 'utf8');
  console.log('\u2713 ' + name);
  changed = true;
}

/* ================================================================== */
/* 1. User model                                                       */
/* ================================================================== */

patch(
  files.USER,
  '1a User interface fields',
  'probationDays?: number',
  '  lastLogin?: Date\n  invitedBy?: string',
  [
    '  lastLogin?: Date',
    '  invitedBy?: string',
    '  /** First day of employment — drives the commission rate. */',
    '  startDate?: Date',
    '  probationDays?: number',
    '  /** Set to confirm early, or to record a confirmation that ran late. */',
    '  confirmedAt?: Date',
  ].join('\n')
);

patch(
  files.USER,
  '1b User schema fields',
  'probationDays: { type: Number',
  '    lastLogin: Date,\n    invitedBy: String,',
  [
    '    lastLogin: Date,',
    '    invitedBy: String,',
    '    startDate: Date,',
    '    probationDays: { type: Number, default: 90 },',
    '    confirmedAt: Date,',
  ].join('\n')
);

/* ================================================================== */
/* 2. Users API — accept the dates on invite                           */
/* ================================================================== */

patch(
  files.USERS_API,
  '2a accept startDate on invite',
  'startDate, probationDays',
  '    const { name, email, password, role, invitedBy } = await req.json()',
  '    const { name, email, password, role, invitedBy, startDate, probationDays } = await req.json()'
);

patch(
  files.USERS_API,
  '2b store startDate on create',
  'startDate: startDate ||',
  "    const user = await User.create({ name, email, password, role: role || 'sales', invitedBy })",
  [
    '    const user = await User.create({',
    '      name, email, password,',
    "      role: role || 'sales',",
    '      invitedBy,',
    '      startDate: startDate || undefined,',
    '      probationDays: probationDays || 90,',
    '    })',
  ].join('\n')
);

/* ================================================================== */
/* 3. Commission Dashboard — derive instead of default                 */
/* ================================================================== */

patch(
  files.DASH,
  '3a import period helper',
  "from '@/lib/commissionPeriod'",
  "import SkuMarginPicker from './SkuMarginPicker'",
  [
    "import SkuMarginPicker from './SkuMarginPicker'",
    "import { deriveCommissionPeriod, isConfirmingSoon, type CommissionPeriodInfo } from '@/lib/commissionPeriod'",
  ].join('\n')
);

patch(
  files.DASH,
  '3b period state',
  'periodInfo',
  "  const [calcPeriod, setCalcPeriod] = useState<'probation' | 'confirmed'>('probation')",
  [
    "  const [calcPeriod, setCalcPeriod] = useState<'probation' | 'confirmed'>('probation')",
    '  // Derived from the rep\'s start date rather than left to a toggle — with',
    '  // more than one rep, a forgotten switch is a payroll error.',
    '  const [periodInfo, setPeriodInfo] = useState<CommissionPeriodInfo | null>(null)',
    '  const [teamPeriods, setTeamPeriods] = useState<any[]>([])',
    '  const [periodOverridden, setPeriodOverridden] = useState(false)',
  ].join('\n')
);

patch(
  files.DASH,
  '3c fetch derived period',
  "fetch('/api/commission-period')",
  '  useEffect(() => { fetchData() }, [fetchData])',
  [
    '  useEffect(() => { fetchData() }, [fetchData])',
    '',
    '  useEffect(() => {',
    "    fetch('/api/commission-period')",
    '      .then(r => r.json())',
    '      .then(d => {',
    '        if (!d?.success) return',
    '        setPeriodInfo(d.mine)',
    '        if (Array.isArray(d.team)) setTeamPeriods(d.team)',
    '        setCalcPeriod(prev => (periodOverridden ? prev : d.mine.period))',
    '      })',
    '      .catch(() => {})',
    '    // eslint-disable-next-line react-hooks/exhaustive-deps',
    '  }, [])',
  ].join('\n')
);

patch(
  files.DASH,
  '3d mark manual override',
  'setPeriodOverridden(true)',
  '                          className={`flex-1 rounded-lg border py-2 text-xs font-medium capitalize transition-colors ${calcPeriod === p ? \'border-primary bg-primary text-white\' : \'border-border text-foreground hover:bg-secondary\'}`}>',
  '                          className={`flex-1 rounded-lg border py-2 text-xs font-medium capitalize transition-colors ${calcPeriod === p ? \'border-primary bg-primary text-white\' : \'border-border text-foreground hover:bg-secondary\'} ${!isAdmin && periodInfo?.derived && p !== periodInfo.period ? \'opacity-40\' : \'\'}`}\n                          onClickCapture={() => setPeriodOverridden(true)}>',
  true
);

/* ================================================================== */
/* 4. Proposal Generator — derive too                                  */
/* ================================================================== */

patch(
  files.PAGE,
  '4a fetch derived period in proposal',
  "fetch('/api/commission-period')",
  "  const [commissionPeriod, setCommissionPeriod] = useState<'probation' | 'confirmed'>('probation')",
  [
    "  const [commissionPeriod, setCommissionPeriod] = useState<'probation' | 'confirmed'>('probation')",
    '  const [periodDerived, setPeriodDerived] = useState(false)',
    '  const [periodLabel, setPeriodLabel] = useState<string>(\'\')',
    '  useEffect(() => {',
    "    fetch('/api/commission-period')",
    '      .then(r => r.json())',
    '      .then(d => {',
    '        if (!d?.success || !d.mine) return',
    '        setCommissionPeriod(d.mine.period)',
    '        setPeriodDerived(!!d.mine.derived)',
    '        setPeriodLabel(d.mine.label || \'\')',
    '      })',
    '      .catch(() => {})',
    '  }, [])',
  ].join('\n')
);

patch(
  files.PAGE,
  '4b show derived status in panel',
  'periodLabel &&',
  "            <p className=\"text-[10px] text-muted-foreground -mt-1\">Internal only \\u2014 never appears on the customer proposal.</p>",
  [
    "            <p className=\"text-[10px] text-muted-foreground -mt-1\">Internal only \\u2014 never appears on the customer proposal.</p>",
    '            {periodLabel && (',
    '              <p className="text-[10px] text-muted-foreground -mt-1">',
    "                {periodDerived ? periodLabel : periodLabel + ' \\u2014 ask an admin to set your start date'}",
    '              </p>',
    '            )}',
  ].join('\n'),
  true
);

console.log(changed ? '\n\u2713 Done. Next: npm run build' : '\nNothing to do \u2014 already patched.');
console.log('\nStill to do:');
console.log('  \u2022 Set start dates on existing users (see set-start-dates.js)');
console.log('  \u2022 Add a start-date field to the Team & Access invite form');
console.log('\nDeals already snapshot commissionRate at acceptance, so nothing recalculates.');
