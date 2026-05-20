#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
# TRANSCRIPT EXTRACTION ENGINE — DEPLOY SCRIPT (v2)
# Wires: Cloud Run ← Pub/Sub ← GCS bucket
# Target: bomb_ecom dataset (normalized multi-table schema)
#
# Run from repo root:
#   bash knowledge-pipeline/deploy.sh
#
# Re-running is safe — all gcloud commands are idempotent.
# ════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Config ───────────────────────────────────────────────────────
PROJECT_ID="gen-lang-client-0234791928"
REGION="us-central1"
SERVICE_NAME="transcript-extractor"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
BUCKET="jake-ecom-knowledge"
TOPIC="coaching-transcripts-topic"
SUBSCRIPTION="coaching-transcripts-sub"
SA_NAME="transcript-extractor-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# ── Helpers ──────────────────────────────────────────────────────
section() { echo ""; echo "──────────────────────────────────────"; echo "  $1"; echo "──────────────────────────────────────"; }
ok()      { echo "  ✓ $1"; }
skip()    { echo "  → $1 (already exists, skipping)"; }

# ════════════════════════════════════════════════════════════════
# PHASE 1: GCP PROJECT + IAM
# ════════════════════════════════════════════════════════════════

section "Phase 1: IAM Setup"

gcloud config set project "${PROJECT_ID}"
ok "Project set: ${PROJECT_ID}"

# Get project number (needed for Pub/Sub service agent email)
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')

# Create service account for Cloud Run
if gcloud iam service-accounts describe "${SA_EMAIL}" --project="${PROJECT_ID}" &>/dev/null; then
  skip "Service account ${SA_EMAIL}"
else
  gcloud iam service-accounts create "${SA_NAME}" \
    --display-name="Transcript Extractor" \
    --project="${PROJECT_ID}"
  ok "Created service account: ${SA_EMAIL}"
fi

# Grant roles to service account
ROLES=(
  "roles/bigquery.dataEditor"   # Write rows to bomb_ecom tables
  "roles/bigquery.jobUser"      # Run BQ jobs (needed for insert_rows_json)
  "roles/storage.objectViewer"  # Read transcripts from GCS
  "roles/storage.objectAdmin"   # Move processed files in GCS
  "roles/aiplatform.user"       # Call Gemini via Vertex AI
)
for ROLE in "${ROLES[@]}"; do
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="${ROLE}" \
    --condition=None \
    --quiet
  ok "Granted ${ROLE}"
done

# Allow Pub/Sub service agent to generate OIDC tokens for our SA
PUBSUB_SERVICE_AGENT="service-${PROJECT_NUMBER}@gcp-sa-pubsub.iam.gserviceaccount.com"
gcloud iam service-accounts add-iam-policy-binding "${SA_EMAIL}" \
  --member="serviceAccount:${PUBSUB_SERVICE_AGENT}" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --quiet
ok "Pub/Sub service agent can mint tokens for ${SA_NAME}"


# ════════════════════════════════════════════════════════════════
# PHASE 2: INFRASTRUCTURE (GCS + BigQuery)
# ════════════════════════════════════════════════════════════════

section "Phase 2: Infrastructure"

# GCS bucket
if gsutil ls "gs://${BUCKET}" &>/dev/null; then
  skip "GCS bucket gs://${BUCKET}"
else
  gsutil mb -p "${PROJECT_ID}" -l "${REGION}" "gs://${BUCKET}"
  ok "Created bucket: gs://${BUCKET}"
fi

# Create coaching-transcripts/ prefix
if ! gsutil ls "gs://${BUCKET}/coaching-transcripts/" &>/dev/null; then
  echo "" | gsutil cp - "gs://${BUCKET}/coaching-transcripts/.keep"
  ok "Created gs://${BUCKET}/coaching-transcripts/"
fi

# BigQuery tables (v2 normalized schema — bomb_ecom dataset)
echo "  Creating BigQuery bomb_ecom tables..."
python3 -c "
import os
os.environ['GCP_PROJECT_ID'] = '${PROJECT_ID}'
os.environ['GCP_LOCATION'] = '${REGION}'
import sys; sys.path.insert(0, 'knowledge-pipeline')
from transcript_extraction_engine import create_bigquery_tables
create_bigquery_tables()
"
ok "BigQuery tables ready in ${PROJECT_ID}.bomb_ecom"

# Run scrape DDL if it exists
if [ -f "docs/schemas/bigquery-scrape-ddl.sql" ]; then
  echo "  Creating scrape tables from DDL..."
  bq query --use_legacy_sql=false --project_id="${PROJECT_ID}" < docs/schemas/bigquery-scrape-ddl.sql
  ok "Scrape tables created in bomb_ecom"
fi

# Run transcript DDL views if exists
if [ -f "docs/schemas/bigquery-transcript-ddl.sql" ]; then
  echo "  Creating transcript views from DDL..."
  bq query --use_legacy_sql=false --project_id="${PROJECT_ID}" < docs/schemas/bigquery-transcript-ddl.sql
  ok "Transcript views created in bomb_ecom"
fi


# ════════════════════════════════════════════════════════════════
# PHASE 3: BUILD + DEPLOY CLOUD RUN
# ════════════════════════════════════════════════════════════════

section "Phase 3: Build & Deploy"

# Build Docker image via Cloud Build
echo "  Building image (this takes ~2 min)..."
gcloud builds submit knowledge-pipeline/ \
  --tag "${IMAGE}" \
  --project "${PROJECT_ID}" \
  --quiet
ok "Image pushed: ${IMAGE}"

# Deploy to Cloud Run
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --no-allow-unauthenticated \
  --service-account "${SA_EMAIL}" \
  --set-env-vars "GCP_PROJECT_ID=${PROJECT_ID},GCP_LOCATION=${REGION},GCS_BUCKET=${BUCKET}" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 600 \
  --max-instances 10 \
  --project "${PROJECT_ID}" \
  --quiet
ok "Cloud Run service deployed: ${SERVICE_NAME}"

# Get the service URL
CLOUD_RUN_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" \
  --format 'value(status.url)' \
  --project "${PROJECT_ID}")
ok "URL: ${CLOUD_RUN_URL}"

# Grant service account permission to invoke Cloud Run
gcloud run services add-iam-policy-binding "${SERVICE_NAME}" \
  --region "${REGION}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.invoker" \
  --project "${PROJECT_ID}" \
  --quiet
ok "run.invoker granted to ${SA_NAME}"


# ════════════════════════════════════════════════════════════════
# PHASE 4: PUB/SUB WIRING
# ════════════════════════════════════════════════════════════════

section "Phase 4: Pub/Sub Wiring"

# Create Pub/Sub topic
if gcloud pubsub topics describe "${TOPIC}" --project="${PROJECT_ID}" &>/dev/null; then
  skip "Pub/Sub topic ${TOPIC}"
else
  gcloud pubsub topics create "${TOPIC}" --project="${PROJECT_ID}"
  ok "Created Pub/Sub topic: ${TOPIC}"
fi

# Create GCS → Pub/Sub notification
EXISTING_NOTIF=$(gsutil notification list "gs://${BUCKET}" 2>/dev/null | grep "${TOPIC}" || true)
if [ -n "${EXISTING_NOTIF}" ]; then
  skip "GCS notification for ${TOPIC}"
else
  gsutil notification create \
    -t "projects/${PROJECT_ID}/topics/${TOPIC}" \
    -f json \
    -e OBJECT_FINALIZE \
    "gs://${BUCKET}"
  ok "GCS notification → ${TOPIC}"
fi

# Create Pub/Sub push subscription → Cloud Run
if gcloud pubsub subscriptions describe "${SUBSCRIPTION}" --project="${PROJECT_ID}" &>/dev/null; then
  skip "Pub/Sub subscription ${SUBSCRIPTION}"
else
  gcloud pubsub subscriptions create "${SUBSCRIPTION}" \
    --topic "${TOPIC}" \
    --push-endpoint="${CLOUD_RUN_URL}/" \
    --push-auth-service-account="${SA_EMAIL}" \
    --ack-deadline=600 \
    --min-retry-delay=10s \
    --max-retry-delay=300s \
    --project "${PROJECT_ID}"
  ok "Push subscription → ${CLOUD_RUN_URL}/"
fi


# ════════════════════════════════════════════════════════════════
# DONE
# ════════════════════════════════════════════════════════════════

section "Deploy Complete"
echo ""
echo "  Cloud Run:    ${CLOUD_RUN_URL}"
echo "  GCS bucket:   gs://${BUCKET}/coaching-transcripts/"
echo "  Pub/Sub:      ${TOPIC} → ${SUBSCRIPTION}"
echo "  BigQuery:     ${PROJECT_ID}.bomb_ecom (7 transcript tables + scrape tables)"
echo ""
echo "  To process a transcript, upload a .txt file:"
echo "  gsutil cp my-call.txt gs://${BUCKET}/coaching-transcripts/"
echo ""
echo "  To tail Cloud Run logs:"
echo "  gcloud run services logs tail ${SERVICE_NAME} --region ${REGION}"
echo ""
