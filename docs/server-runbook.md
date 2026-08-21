# GoLive Cloud Portal — Server State Runbook

**Server:** Hetzner `65.108.124.35` · `/www/wwwroot/golive-cloud`
**Runs as:** `www` under PM2, process name `golive-cloud`
**Captured:** 20 August 2026

---

## Why this file exists

`deploy.sh` does **not** sync a tree. It writes named files one at a time:

```bash
git show origin/main:<path> > <path>
```

Three consequences, all of which cost time on 20 August:

1. **A file not in the pull list never reaches the server from git.** An entire recruitment subsystem — five API routes, a model, a dashboard panel and four HTML pages — existed only on this box for weeks.
2. **A file in the pull list is overwritten from `origin/main` on every deploy.** Edits made directly on the server are silently destroyed. The HR panel's wiring in `app/portal/page.tsx` was lost this way.
3. **A path removed from the pull list is not deleted from disk.** It lingers and keeps being served. `app/assess`, `app/api/public` and `app/api/assessments/check-attempt` all had to be removed by hand.

Server `HEAD` also never advances — it sits at an old commit while the working tree is rewritten from `origin/main`. **`git diff` on the server is meaningless.** To see real drift:

```bash
cd /www/wwwroot/golive-cloud
git fetch origin main
diff <(git show origin/main:app/portal/page.tsx) app/portal/page.tsx
```

---

## Environment values — `.env.local`, not in git

If this file is lost, the app starts but several features fail. Regenerate or recover each:

| Key | Purpose | If missing |
|---|---|---|
| `MONGODB_URI` | Database, with credentials | App cannot start meaningfully |
| `RESEND_API_KEY` | Transactional mail | Silent mail failure |
| `ASSESSMENT_CODE_OPS` / `_SALES` / `_SOCIAL` / `_HOSTING` | Per-role assessment access codes, given to candidates via LinkedIn | Candidates cannot pass the gate |
| `ASSESSMENT_SIGNING_SECRET` | HMAC key for assessment tokens (32+ bytes hex) | **Every assessment endpoint returns 401 by design** |
| `PUPPETEER_CACHE_DIR` | `/www/wwwroot/golive-cloud/.puppeteer-cache` | Chromium not found |
| `PUPPETEER_EXECUTABLE_PATH` | Full path to the Chrome binary | PDF generation fails |

Regenerating the signing secret:

```bash
openssl rand -hex 32
```

Note: `ASSESSMENT_UPLOAD_SECRET` is **obsolete**. It guarded the assessment endpoints with a constant that was also printed in the public HTML. Replaced by signed tokens on 20 August. Do not reintroduce it.

---

## Chromium for PDF generation

Puppeteer is a dependency, but the browser binary is not — it is downloaded separately and lives outside git.

**System libraries** (Ubuntu 22.04 jammy):

```bash
apt-get install -y libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
  libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
  libgbm1 libpango-1.0-0 libcairo2 libnss3 libnspr4 libatspi2.0-0 \
  libx11-xcb1 fonts-liberation libgtk-3-0 libasound2
```

**Browser:**

```bash
cd /www/wwwroot/golive-cloud
PUPPETEER_CACHE_DIR=/www/wwwroot/golive-cloud/.puppeteer-cache \
  npx puppeteer browsers install chrome
chown -R www:www /www/wwwroot/golive-cloud/.puppeteer-cache
```

**Verify it launches as the service account** — this is the test that matters, not a root-user test:

```bash
su -s /bin/bash www -c "cd /www/wwwroot/golive-cloud && node -e \"
const p=require('puppeteer');
(async()=>{const b=await p.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
await b.close();console.log('OK')})().catch(e=>{console.error(e.message);process.exit(1)})\""
```

### Known trap

Puppeteer looks for one exact Chrome build. If `npm install` moves the Puppeteer version, the cached browser becomes the wrong version and the route fails with *"Could not find Chrome (ver. X)"*. On 20 August the 148 build also extracted incompletely — the download succeeded but produced no binary.

The working configuration pins the executable explicitly rather than relying on version lookup:

```
PUPPETEER_EXECUTABLE_PATH=/www/wwwroot/golive-cloud/.puppeteer-cache/chrome/linux-152.0.7977.42/chrome-linux64/chrome
```

If that directory is ever cleared, reinstall and update the path.

---

## Cron

```
0 3 * * * cd /www/wwwroot/golive-cloud && /www/server/nvm/versions/node/v24.16.0/bin/node scripts/purge-assessments.js >> /var/log/golive-purge.log 2>&1
```

Deletes candidate recordings, transcripts and violation logs older than 60 days, per the retention period stated in the privacy policy.

**The node path is pinned to an nvm version.** Upgrading node breaks this silently. Verify with:

```bash
which node
```

Test under a bare environment, which is closer to how cron runs it:

```bash
cd /www/wwwroot/golive-cloud && env -i \
  /www/server/nvm/versions/node/v24.16.0/bin/node scripts/purge-assessments.js --dry-run
```

---

## Known broken state

**`grub-efi-amd64-signed` fails to configure** — it expects `/dev/sda15`, which does not exist on this instance. Consequence: **every `apt-get install` exits non-zero even when the requested packages install correctly.** Read the "Setting up ..." lines rather than trusting the exit code.

Do not remove bootloader packages remotely without console access.

**`next.config.mjs` removed 21 August 2026.** It shadowed the tracked `next.config.ts` (Next prefers `.mjs`), so the config the deploy pulled was never in effect. It held only an `api.bodyParser` key — Pages Router only, inert in the App Router — and a Server Actions body limit that does not govern route handlers. Both were presumably added while debugging large assessment uploads; neither did anything. The real upload cap lives in `app/api/save-recording/route.ts`. Backup at `/root/next.config.mjs.removed-2026-08-21`. Do not reinstate.

---

## Deploy failure modes seen on 20 August

| Symptom | Cause | Fix |
|---|---|---|
| Exit 143 / SIGTERM mid-build | GitHub Actions step timeout kills the SSH session | Build on the server: `npm run build && pm2 restart` |
| `fatal: path '...' does not exist in 'origin/main'` | Pull list references a deleted file; `set -e` aborts the rest | Remove the line from `deploy.yml` |
| Files updated but behaviour unchanged | Deploy aborted before the build step | `rm -rf .next && npm run build && pm2 restart` |
| Type error on a deleted route | Stale generated types in `.next` | `rm -rf .next` before building |
| New env var not picked up | PM2 restarted without `--update-env` | Now in `deploy.sh`; otherwise restart manually |

**Build clean, then push.** Four deploys failed on 20 August because a push preceded a verified build.

---

## Rebuilding this server from scratch

1. Clone the repo and run `npm install --legacy-peer-deps`.
2. Recreate `.env.local` from the table above.
3. Install the Chromium system libraries and browser; set both `PUPPETEER_*` values.
4. Restore `recordings/` from backup — candidate recordings are on disk only, not in the database.
5. Reinstate the purge cron with the correct node path.
6. `npm run build`, then start under PM2 as `www`.
7. Confirm: portal loads, a proposal PDF renders, an assessment page passes its code gate.

Note step 4. `recordings/` is not in git and not in MongoDB. It holds candidate video, transcripts and proctoring logs, is mirrored nightly at 04:00 by `/usr/local/bin/golive-backup-recordings.sh` to `/var/backups/golive/recordings/`, with a two-day attic for accidental deletion. That backup is **on the same disk**, so it does not protect against disk or server loss — moving the destination to a Hetzner Storage Box is a one-line change to `DST`.
