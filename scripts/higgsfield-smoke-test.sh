#!/usr/bin/env bash
# Minimal Higgsfield API check: POST create job, print response (and poll URL if present).
# Requires HIGGSFIELD_CLIENT_ID and HIGGSFIELD_CLIENT_SECRET (e.g. from .env / docker-compose).

set -euo pipefail

URL="${HIGGSFIELD_API_URL:-https://platform.higgsfield.ai/higgsfield-ai/soul/standard}"

if [[ -z "${HIGGSFIELD_CLIENT_ID:-}" || -z "${HIGGSFIELD_CLIENT_SECRET:-}" ]]; then
  echo "error: set HIGGSFIELD_CLIENT_ID and HIGGSFIELD_CLIENT_SECRET (e.g. source .env)" >&2
  exit 1
fi

AUTH_HEADER="Key ${HIGGSFIELD_CLIENT_ID}:${HIGGSFIELD_CLIENT_SECRET}"

BODY='{"model":"higgsfield-ai/soul/standard","prompt":"smoke test minimal product photo neutral background","aspect_ratio":"1:1","negative_prompt":"blurry, low quality"}'

echo "POST ${URL}" >&2
RESP=$(curl -sS -X POST "$URL" \
  -H "Authorization: ${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  -d "$BODY")

echo "$RESP" | python3 -m json.tool 2>/dev/null || echo "$RESP"

STATUS_URL=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('status_url') or d.get('statusUrl') or '')" 2>/dev/null || true)

if [[ -n "${STATUS_URL}" ]]; then
  echo "" >&2
  echo "Polling status_url once (GET)..." >&2
  curl -sS -X GET "$STATUS_URL" \
    -H "Authorization: ${AUTH_HEADER}" \
    -H "Accept: application/json" | python3 -m json.tool 2>/dev/null || curl -sS "$STATUS_URL" -H "Authorization: ${AUTH_HEADER}"
fi
