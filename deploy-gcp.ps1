# =============================================================================
# Bomb Ecom OS — Google Cloud Run Deployment Script
# Run this in PowerShell from the Cyclone-SS project root
# Project: gen-lang-client-0234791928 | Region: us-central1
# =============================================================================

$PROJECT_ID = "gen-lang-client-0234791928"
$REGION     = "us-central1"
$REGISTRY   = "$REGION-docker.pkg.dev"
$REPO       = "bom-ecom"
$IMAGE      = "$REGISTRY/$PROJECT_ID/$REPO/app"
$SERVICE    = "bom-ecom"

Write-Host "=== Step 1: Authenticate ===" -ForegroundColor Cyan
gcloud auth login
gcloud config set project $PROJECT_ID
gcloud auth configure-docker $REGISTRY

Write-Host "`n=== Step 2: Enable APIs ===" -ForegroundColor Cyan
gcloud services enable `
  run.googleapis.com `
  artifactregistry.googleapis.com `
  sqladmin.googleapis.com `
  secretmanager.googleapis.com

Write-Host "`n=== Step 3: Create Artifact Registry repo ===" -ForegroundColor Cyan
gcloud artifacts repositories create $REPO `
  --repository-format=docker `
  --location=$REGION `
  --description="Bomb Ecom OS container images"

Write-Host "`n=== Step 4: Build & push Docker image ===" -ForegroundColor Cyan
docker build -t "${IMAGE}:latest" ./bom-ecom
docker push "${IMAGE}:latest"

Write-Host "`n=== Step 5: Create Cloud SQL instance (Postgres 16) ===" -ForegroundColor Cyan
Write-Host "NOTE: This takes 3-5 minutes. Cost ~$7/month (db-f1-micro)." -ForegroundColor Yellow
gcloud sql instances create bomb-ecom-db `
  --database-version=POSTGRES_16 `
  --tier=db-f1-micro `
  --region=$REGION `
  --storage-type=SSD `
  --storage-size=10GB `
  --no-backup

gcloud sql databases create bomb_ecom --instance=bomb-ecom-db
if (-not $env:POSTGRES_DEPLOY_PASSWORD) {
  Write-Host "POSTGRES_DEPLOY_PASSWORD env var is required. Set it in .env and re-run." -ForegroundColor Red
  exit 1
}
gcloud sql users set-password postgres --instance=bomb-ecom-db --password=$env:POSTGRES_DEPLOY_PASSWORD

# Get the Cloud SQL connection name (needed for Cloud Run)
$SQL_CONN = gcloud sql instances describe bomb-ecom-db --format="value(connectionName)"
Write-Host "SQL Connection Name: $SQL_CONN" -ForegroundColor Green

Write-Host "`n=== Step 6: Deploy to Cloud Run ===" -ForegroundColor Cyan

# Load env vars from .env file (skip comments and blanks)
$ENV_FLAGS = ""
Get-Content .env | Where-Object { $_ -match "^[A-Z]" } | ForEach-Object {
  $key, $val = $_ -split "=", 2
  # Skip local-only vars
  if ($key -notin @("N8N_HOST","N8N_PORT","N8N_PROTOCOL","WEBHOOK_URL","N8N_CLOUD_URL","N8N_CLOUD_WORKFLOW_ID","POSTGRES_USER","POSTGRES_PASSWORD","POSTGRES_DB")) {
    $ENV_FLAGS += "--set-env-vars `"${key}=${val}`" "
  }
}

gcloud run deploy $SERVICE `
  --image="${IMAGE}:latest" `
  --platform=managed `
  --region=$REGION `
  --allow-unauthenticated `
  --port=5000 `
  --memory=1Gi `
  --cpu=1 `
  --min-instances=0 `
  --max-instances=3 `
  --add-cloudsql-instances=$SQL_CONN `
  --set-env-vars="NODE_ENV=production" `
  --set-env-vars="PORT=5000" `
  --set-env-vars="DATABASE_URL=postgresql://postgres:$env:POSTGRES_DEPLOY_PASSWORD@localhost/bomb_ecom?host=/cloudsql/$SQL_CONN" `
  --set-env-vars="N8N_WEBHOOK_URL=http://localhost:5678/webhook" `
  --set-env-vars="AIRTABLE_BASE_ID=$env:AIRTABLE_BASE_ID" `
  --set-env-vars="AIRTABLE_API_KEY=$env:AIRTABLE_API_KEY" `
  --set-env-vars="AWS_REGION=$env:AWS_REGION" `
  --set-env-vars="AWS_ACCESS_KEY_ID=$env:AWS_ACCESS_KEY_ID" `
  --set-env-vars="AWS_SECRET_ACCESS_KEY=$env:AWS_SECRET_ACCESS_KEY" `
  --set-env-vars="OPENAI_API_KEY=$env:OPENAI_API_KEY" `
  --set-env-vars="GEMINI_API_KEY=$env:GEMINI_API_KEY" `
  --set-env-vars="APIFY_TOKEN=$env:APIFY_TOKEN" `
  --set-env-vars="META_APP_API_KEY=$env:META_APP_API_KEY" `
  --set-env-vars="SERP_API_KEY=$env:SERP_API_KEY" `
  --set-env-vars="BANNERBEAR_API_KEY=$env:BANNERBEAR_API_KEY" `
  --set-env-vars="FAL_AI_API_KEY=$env:FAL_AI_API_KEY" `
  --set-env-vars="SESSION_SECRET=$env:SESSION_SECRET" `
  --set-env-vars="HIGGSFIELD_CLIENT_ID=$env:HIGGSFIELD_CLIENT_ID" `
  --set-env-vars="HIGGSFIELD_CLIENT_SECRET=$env:HIGGSFIELD_CLIENT_SECRET"

Write-Host "`n=== Step 7: Get service URL ===" -ForegroundColor Cyan
$SERVICE_URL = gcloud run services describe $SERVICE --region=$REGION --format="value(status.url)"
Write-Host "Service URL: $SERVICE_URL" -ForegroundColor Green

Write-Host "`n=== Step 8: Run DB migrations ===" -ForegroundColor Cyan
Write-Host "Run this command to push the DB schema to Cloud SQL:" -ForegroundColor Yellow
Write-Host "  DATABASE_URL=`"postgresql://postgres:`$env:POSTGRES_DEPLOY_PASSWORD@localhost/bomb_ecom?host=/cloudsql/$SQL_CONN`" npx drizzle-kit push" -ForegroundColor White
Write-Host ""
Write-Host "Or use Cloud SQL Auth Proxy locally:" -ForegroundColor Yellow
Write-Host "  1. Download: https://cloud.google.com/sql/docs/postgres/sql-proxy" -ForegroundColor White
Write-Host "  2. ./cloud-sql-proxy $SQL_CONN --port=5433" -ForegroundColor White
Write-Host "  3. DATABASE_URL=postgresql://postgres:`$env:POSTGRES_DEPLOY_PASSWORD@127.0.0.1:5433/bomb_ecom npx drizzle-kit push" -ForegroundColor White
Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host "App: $SERVICE_URL" -ForegroundColor Green
Write-Host "Update N8N_CALLBACK_URL in .env to: $SERVICE_URL" -ForegroundColor Yellow
