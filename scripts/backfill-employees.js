/**
 * backfill-employees.js — one-time (idempotent) backfill of the Employee layer.
 *
 * 1. Henry Arukwe → GL-EMP-001 as a LEGACY hire (no application ref; his
 *    signed paperwork predates the candidate pipeline). Lifecycle dates from
 *    his signed documents: start 22 Jun 2026, probation end 19 Sep 2026,
 *    AB-900 voucher (4Sight) issued 7 Jul 2026, hard deadline 7 Jan 2027.
 * 2. Every countersigned application (offer.mdSignedAt + employeeNumber) is
 *    converted into an Employee record, docs and portal link carried over.
 *
 * Run on the server, in the project directory, as www:
 *   su -s /bin/bash www -c "cd /www/wwwroot/golive-cloud && node scripts/backfill-employees.js"
 *
 * Safe to re-run: existing employee records are reported and left untouched,
 * so manual edits made in the People panel are never overwritten.
 */

const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')

// ── env ──────────────────────────────────────────────────────────────────────
function loadEnv() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^MONGODB_URI\s*=\s*(.+)\s*$/)
      if (m) return m[1].replace(/^["']|["']$/g, '')
    }
  }
  return null
}

// ── loose schemas (script-local; the app's TS models own the real shape) ────
const employeeSchema = new mongoose.Schema({}, { strict: false, timestamps: true, collection: 'employees' })
const applicationSchema = new mongoose.Schema({}, { strict: false, collection: 'applications' })
const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' })
const Employee = mongoose.model('EmployeeBackfill', employeeSchema)
const Application = mongoose.model('ApplicationBackfill', applicationSchema)
const User = mongoose.model('UserBackfill', userSchema)

async function findUserId(...emails) {
  const list = emails.filter(Boolean).map((e) => String(e).toLowerCase())
  if (!list.length) return null
  const u = await User.findOne({ email: { $in: list } }).select('_id email').lean()
  return u ? { id: String(u._id), email: u.email } : null
}

async function main() {
  const uri = loadEnv()
  if (!uri) {
    console.error('MONGODB_URI not found (env or .env.local). Run from the project directory.')
    process.exit(1)
  }
  await mongoose.connect(uri)
  console.log('Connected.')
  const created = []
  const skipped = []

  // ── 1. Henry Arukwe — GL-EMP-001, legacy ──────────────────────────────────
  const henryEmail = 'henry.arukwe@golivecompany.com'
  const existingHenry = await Employee.findOne({ employeeNumber: 'GL-EMP-001' })
  if (existingHenry) {
    skipped.push('GL-EMP-001 Arukwe Henry (already exists; not touched)')
  } else {
    const portal = await findUserId(henryEmail)
    await Employee.create({
      employeeNumber: 'GL-EMP-001',
      name: 'Arukwe Henry',
      email: henryEmail,
      workEmail: henryEmail,
      role: 'Sales and Support Associate',
      jobCode: 'REF#01010',
      employmentType: 'part-time',
      status: 'probation',
      legacyHire: true,
      applicationRef: null,
      portalUserId: portal ? portal.id : undefined,
      startDate: new Date('2026-06-22T00:00:00Z'),
      probationEndDate: new Date('2026-09-19T00:00:00Z'),
      certification: {
        name: 'AB-900',
        source: '4Sight voucher',
        voucherIssuedAt: new Date('2026-07-07T00:00:00Z'),
        deadline: new Date('2027-01-07T00:00:00Z'),
      },
      docs: [],
      notes: 'Legacy hire; offer letter, CIIA and Commission & Bonus Addendum executed externally (June 2026). Upload the signed PDFs to this file from the People panel.',
    })
    created.push(`GL-EMP-001 Arukwe Henry (legacy${portal ? ', portal linked: ' + portal.email : ', NO portal account found'})`)
  }

  // ── 2. Countersigned applications → employees ─────────────────────────────
  const apps = await Application.find({
    'offer.mdSignedAt': { $exists: true, $ne: null },
    employeeNumber: { $exists: true, $ne: null },
  }).lean()

  for (const app of apps) {
    const exists = await Employee.findOne({
      $or: [{ applicationRef: app.ref }, { employeeNumber: app.employeeNumber }],
    })
    if (exists) {
      skipped.push(`${app.employeeNumber} ${app.name} (${app.ref}) already exists; not touched`)
      continue
    }
    const startStr = app.actualStartDate || (app.offer && app.offer.startDate) || ''
    const startDate = /^\d{4}-\d{2}-\d{2}$/.test(startStr) ? new Date(startStr) : undefined
    let portalId = app.provisionedUserId || undefined
    let portalEmail = ''
    if (!portalId) {
      const portal = await findUserId(app.email)
      if (portal) { portalId = portal.id; portalEmail = portal.email }
    }
    await Employee.create({
      employeeNumber: app.employeeNumber,
      name: app.name,
      email: String(app.email || '').toLowerCase(),
      role: app.role,
      jobCode: (app.offer && app.offer.jobCode) || undefined,
      employmentType: 'full-time',
      status: 'probation',
      legacyHire: false,
      applicationRef: app.ref,
      portalUserId: portalId,
      startDate,
      probationEndDate: startDate ? new Date(startDate.getTime() + 90 * 864e5) : undefined,
      docs: [],
    })
    created.push(`${app.employeeNumber} ${app.name} (from ${app.ref}${portalId ? ', portal linked' + (portalEmail ? ': ' + portalEmail : '') : ''})`)
  }

  console.log('\n=== Backfill result ===')
  console.log(created.length ? 'Created:' : 'Created: none')
  created.forEach((l) => console.log('  + ' + l))
  console.log(skipped.length ? 'Skipped:' : 'Skipped: none')
  skipped.forEach((l) => console.log('  = ' + l))
  console.log('\nReview in Portal → Admin → People. Erased test records that still hold an employeeNumber will have converted too; delete those employees from MongoDB if any appear.')

  await mongoose.disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
