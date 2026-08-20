#!/usr/bin/env node
/**
 * purge-assessments.js — NDPA 2023 retention enforcement
 *
 * Candidate assessment material is personal data: name, email, video and
 * audio recording, full spoken transcript, and behavioural monitoring logs
 * (tab switches, paste attempts). The Nigeria Data Protection Act 2023
 * requires that personal data is kept no longer than necessary for the
 * purpose it was collected for.
 *
 * GoLive's stated retention period for recruitment assessment material is
 * 60 DAYS from the date of submission. After that this script removes:
 *
 *   · the .webm recording
 *   · the .json metadata sidecar (transcript, violations, email)
 *   · the transcript, violations and recording filename on the Application
 *
 * The hiring outcome itself (score, percentage, date, status) is retained,
 * because that is the record of a business decision rather than raw
 * personal content, and may be needed to answer a discrimination claim.
 *
 * Usage:
 *   node scripts/purge-assessments.js --dry-run     # report only
 *   node scripts/purge-assessments.js               # delete
 *
 * Run from the app root (needs .env.local and node_modules).
 */

const fs = require('fs')
const path = require('path')

const RETENTION_DAYS = 60
const DRY_RUN = process.argv.includes('--dry-run')
const ROOT = process.cwd()
const RECORDINGS_DIR = path.join(ROOT, 'recordings')

const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)

function log(...a) { console.log(`[purge]${DRY_RUN ? ' (dry-run)' : ''}`, ...a) }

/** Read MONGODB_URI out of .env.local without pulling in dotenv. */
function readEnv(key) {
  const envPath = path.join(ROOT, '.env.local')
  if (!fs.existsSync(envPath)) return null
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(new RegExp('^\\s*' + key + '\\s*=\\s*(.*)$'))
    if (m) return m[1].trim().replace(/^["']|["']$/g, '')
  }
  return null
}

/**
 * Recording filenames start with an ISO-ish timestamp:
 *   2026-08-20T14-20-50_Candidate_Name_Role_score13-13.webm
 * Fall back to file mtime if that prefix is ever absent, so a renamed file
 * is still subject to retention rather than kept forever by accident.
 */
function submittedAt(filename, fullPath) {
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})/)
  if (m) {
    const d = new Date(`${m[1]}T${m[2]}:${m[3]}:${m[4]}Z`)
    if (!isNaN(d.getTime())) return d
  }
  try { return fs.statSync(fullPath).mtime } catch { return new Date(0) }
}

async function purgeFiles() {
  if (!fs.existsSync(RECORDINGS_DIR)) {
    log('No recordings directory — nothing to do.')
    return { deleted: 0, bytes: 0 }
  }

  let deleted = 0
  let bytes = 0

  for (const name of fs.readdirSync(RECORDINGS_DIR)) {
    const full = path.join(RECORDINGS_DIR, name)
    let stat
    try { stat = fs.statSync(full) } catch { continue }
    if (!stat.isFile()) continue

    const when = submittedAt(name, full)
    if (when >= cutoff) continue

    const ageDays = Math.floor((Date.now() - when.getTime()) / 86400000)
    log(`delete ${name} (${ageDays} days old, ${(stat.size / 1048576).toFixed(1)} MB)`)
    bytes += stat.size
    deleted++
    if (!DRY_RUN) {
      try { fs.unlinkSync(full) } catch (e) { console.error('  failed:', e.message) }
    }
  }

  return { deleted, bytes }
}

async function purseDatabase() {
  const uri = readEnv('MONGODB_URI')
  if (!uri) {
    log('MONGODB_URI not found in .env.local — skipping database scrub.')
    return 0
  }

  let mongoose
  try {
    mongoose = require('mongoose')
  } catch {
    log('mongoose not resolvable — run this from the app root. Skipping database scrub.')
    return 0
  }

  await mongoose.connect(uri)
  const col = mongoose.connection.db.collection('applications')

  // Only records whose assessment is older than the retention window, and
  // which still carry raw personal content.
  const filter = {
    assessmentDate: { $lt: cutoff },
    $or: [
      { transcript: { $exists: true, $ne: [] } },
      { violations: { $exists: true, $ne: [] } },
      { assessmentFilename: { $exists: true, $ne: null } },
    ],
  }

  const count = await col.countDocuments(filter)
  log(`${count} application record(s) past retention with content to scrub.`)

  if (count > 0 && !DRY_RUN) {
    const res = await col.updateMany(filter, {
      $unset: { transcript: '', violations: '', assessmentFilename: '' },
      $set: { assessmentPurgedAt: new Date() },
    })
    log(`scrubbed ${res.modifiedCount} record(s).`)
  }

  await mongoose.disconnect()
  return count
}

;(async () => {
  log(`retention ${RETENTION_DAYS} days · cutoff ${cutoff.toISOString()}`)
  const { deleted, bytes } = await purgeFiles()
  const scrubbed = await purseDatabase()
  log(`done — ${deleted} file(s), ${(bytes / 1048576).toFixed(1)} MB, ${scrubbed} record(s).`)
  process.exit(0)
})().catch((e) => {
  console.error('[purge] failed:', e)
  process.exit(1)
})
