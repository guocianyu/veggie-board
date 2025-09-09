#!/usr/bin/env bash

# One-click deploy to Vercel (non-interactive)
# Requirements: vercel CLI, curl, jq

set -euo pipefail

# --- Dependency checks ---
if ! command -v vercel >/dev/null 2>&1; then
  echo "Error: vercel CLI not found. Install with: npm i -g vercel" >&2
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq not found. Install with: brew install jq" >&2
  exit 1
fi
if ! command -v curl >/dev/null 2>&1; then
  echo "Error: curl not found." >&2
  exit 1
fi

# --- Required environment variables ---
# VERCEL_TOKEN         : Your Vercel Personal Token
# PROJECT_NAME         : Project name in Vercel (default: veggieboard)
# SUPABASE_URL         : Your Supabase project URL
# SUPABASE_SERVICE_ROLE: Your Supabase service role key (server-only secret)
# CRON_SECRET          : Strong secret to protect cron endpoints
# DATA_SOURCE          : Data source identifier (default: db)

: "${VERCEL_TOKEN:?Set VERCEL_TOKEN}"           # required
: "${SUPABASE_URL:?Set SUPABASE_URL}"           # required
: "${SUPABASE_SERVICE_ROLE:?Set SUPABASE_SERVICE_ROLE}" # required
: "${CRON_SECRET:?Set CRON_SECRET}"             # required
PROJECT_NAME=${PROJECT_NAME:-veggieboard}
DATA_SOURCE=${DATA_SOURCE:-db}

echo "Linking/creating Vercel project: ${PROJECT_NAME}"
vercel link --yes --project "${PROJECT_NAME}" --token "${VERCEL_TOKEN}" || true

echo "Syncing environment variables to Vercel (production & preview)"
add_env() {
  local key="$1"
  local val="$2"
  # shellcheck disable=SC2005
  printf "%s" "$val" | vercel env add "$key" production --token "${VERCEL_TOKEN}" >/dev/null || true
  # shellcheck disable=SC2005
  printf "%s" "$val" | vercel env add "$key" preview    --token "${VERCEL_TOKEN}" >/dev/null || true
}

add_env SUPABASE_URL "${SUPABASE_URL}"
add_env SUPABASE_SERVICE_ROLE "${SUPABASE_SERVICE_ROLE}"
add_env CRON_SECRET "${CRON_SECRET}"
add_env DATA_SOURCE "${DATA_SOURCE}"

echo "Deploying to production..."
DEPLOY_LOG=$(vercel deploy --prod --yes --token "${VERCEL_TOKEN}")
echo "${DEPLOY_LOG}"
APP_URL=$(printf "%s\n" "${DEPLOY_LOG}" | grep -Eo 'https://[a-z0-9-]+\.vercel\.app' | tail -1 || true)

if [ -z "${APP_URL}" ]; then
  echo "Error: Could not parse deployed app URL from Vercel output." >&2
  exit 1
fi

echo "Trigger first sync..."
curl -s -X POST -H "Authorization: Bearer ${CRON_SECRET}" "${APP_URL}/api/jobs/daily-ingest" >/dev/null || true

echo "Check latest data:"
curl -s "${APP_URL}/api/data/latest" | jq '{tradeDate, updatedAt, count:(.items|length)}'

echo "Done → ${APP_URL}"


