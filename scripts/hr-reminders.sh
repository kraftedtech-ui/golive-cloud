#!/bin/bash
# hr-reminders.sh — nightly lifecycle sweep for the People (HR) layer.
#
# Install on the server (as root):
#   cp scripts/hr-reminders.sh /usr/local/bin/hr-reminders.sh
#   chmod +x /usr/local/bin/hr-reminders.sh
#   crontab -e   ->   30 6 * * *  /usr/local/bin/hr-reminders.sh >> /var/log/hr-reminders.log 2>&1
#
# 06:30 UTC is 07:30 in Lagos: before the working day, after any overnight
# signature. The sweep is idempotent — each reminder fires once per stage, so
# a missed night costs nothing and a double run creates no duplicates.

set -euo pipefail

APP_DIR="/www/wwwroot/golive-cloud"
ENDPOINT="http://127.0.0.1:3000/api/hr/reminders"

# CRON_SECRET is read from the app's own environment file, so it is never
# duplicated into the crontab or into this script.
if [ ! -f "$APP_DIR/.env.local" ]; then
  echo "$(date -Is)  ERROR: $APP_DIR/.env.local not found"
  exit 1
fi

SECRET="$(grep -E '^CRON_SECRET=' "$APP_DIR/.env.local" | head -1 | cut -d= -f2- | tr -d '"'"'"'')"
if [ -z "$SECRET" ]; then
  echo "$(date -Is)  ERROR: CRON_SECRET missing from .env.local"
  exit 1
fi

RESPONSE="$(curl -s -m 60 -w '\n%{http_code}' -X POST \
  -H "Authorization: Bearer $SECRET" \
  -H 'Content-Type: application/json' \
  "$ENDPOINT" || true)"

CODE="$(echo "$RESPONSE" | tail -1)"
BODY="$(echo "$RESPONSE" | sed '$d')"

echo "$(date -Is)  HTTP $CODE  $BODY"
[ "$CODE" = "200" ] || exit 1
