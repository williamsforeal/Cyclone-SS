---
name: cloud-agents-starter
description: Minimal starter runbook for Cloud agents working in Cyclone-SS. Use at task start to log in, boot services, choose mock vs live integrations, and run focused smoke tests by codebase area.
---

# Cloud Agents Starter Skill (Cyclone-SS)

Use this skill at the start of any task in this repo.

## 1) First 10 minutes (do this first)

### A. Bootstrap env and core services

```bash
cd /workspace
cp .env.example .env   # only if .env does not exist yet
docker compose up -d postgres n8n bom-ecom
docker compose ps
```

### B. Login points you need immediately

- **n8n UI**: `http://localhost:5678`
  - Username: `N8N_BASIC_AUTH_USER` (default `admin`)
  - Password: `N8N_BASIC_AUTH_PASSWORD` (default `changeme`)
- **Bom-Ecom UI/API**: `http://localhost:5000`
- **Postgres**: `localhost:5432` (`POSTGRES_*` from `.env`)

### C. Fast smoke checks

```bash
curl -s http://localhost:5000/api/health
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5678/healthz
docker compose logs --tail=80 bom-ecom
```

`/api/health` returning `connected: false` is acceptable for mock/offline mode if Airtable keys are placeholders.

---

## 2) Mock vs live integration switches (feature-flag style)

There are no centralized feature flag files; environment variables are the practical switches:

- **Airtable live mode**: set real `AIRTABLE_BASE_ID` + `AIRTABLE_API_KEY`.
- **Airtable mock-safe mode**: keep placeholders or unset these vars; app stays up, and health indicates missing credentials.
- **n8n automation on**: set `N8N_WEBHOOK_URL` to a live webhook base.
- **n8n automation mocked/off**: unset `N8N_WEBHOOK_URL` (or set blank in local app env) to force "webhook not configured" fallback behavior.
- **AI enrichments optional**: `GEMINI_API_KEY`, `SERP_API_KEY`, `OPENAI_API_KEY`, etc. can stay unset while doing UI-only or schema-only work.

If you need strict offline behavior for app development, run `bom-ecom` outside Docker with a local `.env` and intentionally blank optional external keys.

---

## 3) Area: Docker stack (`/`, `docker-compose.yml`)

### When to use

Use for full-stack work that touches app + workflows + DB.

### Run workflow

```bash
cd /workspace
docker compose up -d
docker compose ps
docker exec -i bom-ecom npm run db:push
```

### Testing workflow

```bash
curl -s http://localhost:5000/api/health
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5678/healthz
docker exec -i postgres pg_isready -U postgres
docker compose logs --tail=100 n8n
```

If any service is unhealthy, inspect only that service's logs before touching code.

---

## 4) Area: Bom-Ecom app (`/bom-ecom`)

### When to use

Use for frontend/backend code changes in the app itself.

### Run workflow (standalone dev mode)

```bash
cd /workspace/bom-ecom
cp .env.example .env   # first time only
npm install
npm run dev
```

### Testing workflow

```bash
cd /workspace/bom-ecom
npm run check
curl -s http://localhost:5000/api/health
```

For UI-only tasks, mock mode is acceptable: keep optional API keys as placeholders and verify the changed route/component renders.

---

## 5) Area: n8n workflows + import tooling (`/workflows`, `/scripts/import-workflow.js`)

### When to use

Use when editing/importing workflow JSONs or validating webhook plumbing.

### Run workflow

```bash
cd /workspace
docker compose up -d n8n
node scripts/import-workflow.js workflows/static-scaler-v3.json
```

### Testing workflow

```bash
cd /workspace
node scripts/import-workflow.js   # lists existing workflows
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5678/healthz
```

If import fails, verify `N8N_API_KEY` or fallback basic auth values in `.env`.

---

## 6) Area: Apify actors (`/apify-actors/*`)

### When to use

Use when modifying `kalodata` or `similarweb` scrapers.

### Run workflow

```bash
cd /workspace/apify-actors/kalodata
npm install
npm start
```

```bash
cd /workspace/apify-actors/similarweb
npm install
npm start
```

### Required inputs to remember

- `kalodata`: must provide `sessionCookie` and either `keyword` or `targetUrl`.
- `similarweb`: must provide non-empty `domains` array.

### Testing workflow

- Run actor locally with minimal valid input.
- Confirm dataset/log output contains extracted rows and no schema-breaking exceptions.
- For Similarweb, use residential proxy config when live scraping.

---

## 7) Area: Knowledge pipeline (`/knowledge-pipeline`)

### When to use

Use for transcript/scrape ingestion into BigQuery via Vertex/GCP.

### Login + setup workflow

```bash
gcloud auth application-default login
gcloud config set project gen-lang-client-0234791928
cd /workspace/knowledge-pipeline
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Run workflow

```bash
cd /workspace/knowledge-pipeline
python main.py
```

For local transcript seeding:

```bash
python load-local-transcripts.py --setup
python load-local-transcripts.py --file test-data/<file>.txt --dry-run
```

### Testing workflow

```bash
cd /workspace/knowledge-pipeline
python main.py &
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/health
```

If health is up but ingestion fails, check ADC auth + GCP project + bucket/table permissions before code changes.

---

## 8) Fast troubleshooting sequence (always in this order)

1. Verify container/process health.
2. Verify env vars used by that area.
3. Re-run the smallest area-specific smoke test.
4. Only then inspect or change code.

This avoids unnecessary edits when failures are auth/config related.

---

## 9) How to keep this skill updated

When you discover a new testing trick, auth gotcha, or recovery command:

1. Add it to the matching area section in this file (not as a random note elsewhere).
2. Prefer short "symptom -> command -> expected result" bullets.
3. Keep commands copy-paste ready and Cloud-agent safe.
4. If a new subsystem is added, create a new area with:
   - run workflow
   - login/setup needs
   - concrete smoke tests
   - most common failure mode

Treat this file as the first-run runbook for future agents.
