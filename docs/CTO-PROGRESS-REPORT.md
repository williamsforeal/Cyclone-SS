# AI Ecom OS — Knowledge Pipeline: CTO Progress Report
**Project:** Bomb Ecom OS / Cyclone-SS
**Date:** February 22, 2026
**Prepared by:** Jake Williams, williamsforeal LLC
**Status:** Pipeline Built ✅ | Deployment Ready ✅ | Testing In Progress 🔄

---

## Executive Summary

The AI Ecom OS Knowledge Pipeline is a fully automated GCP cloud infrastructure that ingests raw data from multiple sources (coaching calls, Reddit scrapes, Amazon reviews, competitor metrics), processes it with Gemini 2.0 Flash, and stores structured intelligence in BigQuery for downstream ad generation workflows.

**What was built:** A serverless, event-driven data pipeline that converts unstructured market intelligence into structured BigQuery rows — automatically, at scale, with no manual intervention after initial file upload.

---

## What Was Built

### 1. Cloud Infrastructure (GCP)

| Component | Service | Status |
|---|---|---|
| Event-driven trigger | GCS bucket + Pub/Sub | ✅ Built |
| Processing runtime | Cloud Run (containerized Python) | ✅ Built |
| AI model | Gemini 2.0 Flash via Vertex AI | ✅ Integrated |
| Data warehouse | BigQuery `bomb_ecom` dataset | ✅ Schemas deployed |
| File archiving | GCS processed/ subfolder | ✅ Built |
| Deployment automation | Single `deploy.sh` script | ✅ Built |

**How it works end-to-end:**
1. File lands in GCS bucket (`jake-ecom-knowledge`)
2. GCS fires a Pub/Sub notification
3. Pub/Sub pushes to Cloud Run endpoint
4. Cloud Run routes to the correct extraction engine
5. Gemini 2.0 Flash extracts structured intelligence
6. Rows land in BigQuery `bomb_ecom` dataset
7. Original file moves to `processed/` subfolder

---

### 2. Multi-Source Pipeline Router (`main.py`)

A single Cloud Run service handles **5 distinct data sources** via folder-based routing:

| GCS Folder Prefix | Data Source | Engine | AI Used |
|---|---|---|---|
| `coaching-transcripts/` | Coaching call transcripts (.txt) | Transcript Extraction Engine | Gemini 2.0 Flash |
| `reddit-scrapes/` | Apify Reddit scrape results | Scrape Extraction Engine | Gemini 2.0 Flash |
| `amazon-scrapes/` | Apify Amazon review results | Scrape Extraction Engine | Gemini 2.0 Flash |
| `kalodata-exports/` | KaloData product revenue data | Metrics Ingestion | None (JSON parse) |
| `similarweb-exports/` | SimilarWeb traffic data | Metrics Ingestion | None (JSON parse) |

---

### 3. Transcript Extraction Engine (`transcript_extraction_engine.py`)

Processes 1–4+ hour coaching call transcripts and extracts **7 normalized BigQuery tables**:

| BigQuery Table | What It Stores |
|---|---|
| `raw_transcripts` | Full transcript text, metadata, word count |
| `stg_transcript_products` | Products discussed — viability scores, verdicts, niches |
| `stg_transcript_niches` | Market niches — saturation, trend, competition |
| `stg_transcript_patterns` | Strategies and tactics — do_this / avoid_this sentiment |
| `stg_transcript_psychology` | Customer psychology — motivators, fears, decision triggers |
| `stg_transcript_case_studies` | Real results and revenue examples from calls |
| `stg_transcript_calls` | Call-level metadata — speaker roles, topics covered |

**7 test transcripts** are committed to the repo for validation.

---

### 4. Scrape Extraction Engine (`scrape_extraction_engine.py`)

Processes consumer data from Reddit and Amazon via Apify scrapes:

| BigQuery Table | What It Stores |
|---|---|
| `scrape_runs` | Audit trail for every Apify run |
| `scrape_pain_points` | Consumer pain points with frequency and emotional intensity |
| `scrape_phrases` | Exact consumer language for ad copy |
| `scrape_objections` | Purchase hesitations and competitor comparisons |
| `scrape_desired_outcomes` | What customers want — features, transformations |
| `scrape_product_metrics` | KaloData revenue + SimilarWeb traffic data |

---

### 5. Deployment Script (`deploy.sh`)

A single idempotent bash script that wires the entire GCP stack in 4 phases:

```
Phase 1: IAM       → service account + 5 roles
Phase 2: Infra     → GCS bucket + BigQuery tables + Pub/Sub topic
Phase 3: Build     → Docker image via Cloud Build → Cloud Run deploy
Phase 4: Pub/Sub   → GCS notification → push subscription → Cloud Run URL
```

**Re-running is safe** — all `gcloud` commands check for existing resources before creating.

---

### 6. BigQuery Analytics Layer (`coaching-queries.sql`)

Pre-built analytical queries for downstream consumption:

- Top patterns by frequency across all coaching calls
- Kill rules — when to stop ad spend
- Products coaches are bullish on
- Consumer pain points ranked by intensity
- Cross-source intelligence joins (transcripts + scrapes)

---

## Security Audit Results

### SECURE ✅
| Item | Status |
|---|---|
| `.env` file (all API keys) | Gitignored — not in repo |
| `credentials/vertex-ai-service-account.json` | Gitignored — not in repo |
| Python files | All secrets via `os.environ.get()` — no hardcoded keys |
| Cloud Run | Deployed with `--no-allow-unauthenticated` |
| Service account | Least-privilege roles only |

### ACTION REQUIRED ⚠️
| Issue | Location | Risk | Fix |
|---|---|---|---|
| **Gumloop API key hardcoded in URL** | `workflows/static-scaler-v3-*.json` (4 files, lines ~1320) | Medium — key `769876a7f6164317a7e024b3e22525e1` is in git history | Rotate key in Gumloop dashboard → move to n8n credential |

**Affected files:**
- `workflows/static-scaler-v3-comfyui.json`
- `workflows/static-scaler-v3-fixed.json`
- `workflows/static-scaler-v3-vertex.json`
- `workflows/static-scaler-v3-upgraded.json`

---

## Architecture Diagram

```
                        ┌─────────────────────────────────────┐
                        │         GCS: jake-ecom-knowledge     │
                        │  coaching-transcripts/  *.txt        │
                        │  reddit-scrapes/        *.json       │
                        │  amazon-scrapes/        *.json       │
                        │  kalodata-exports/      *.json       │
                        │  similarweb-exports/    *.json       │
                        └──────────────┬──────────────────────┘
                                       │ OBJECT_FINALIZE
                                       ▼
                        ┌─────────────────────────────┐
                        │  Pub/Sub: coaching-transcripts-topic │
                        │  Subscription: push → Cloud Run      │
                        └──────────────┬──────────────────────┘
                                       │ POST /
                                       ▼
                        ┌─────────────────────────────────────┐
                        │   Cloud Run: transcript-extractor    │
                        │   main.py → route by folder prefix   │
                        │                                      │
                        │  ┌─────────────────────────────┐    │
                        │  │ Transcript Engine            │    │
                        │  │ Gemini 2.0 Flash → 7 tables  │    │
                        │  └─────────────────────────────┘    │
                        │  ┌─────────────────────────────┐    │
                        │  │ Scrape Engine                │    │
                        │  │ Gemini 2.0 Flash → 5 tables  │    │
                        │  └─────────────────────────────┘    │
                        │  ┌─────────────────────────────┐    │
                        │  │ Metrics Ingestion            │    │
                        │  │ JSON parse → 1 table         │    │
                        │  └─────────────────────────────┘    │
                        └──────────────┬──────────────────────┘
                                       │
                                       ▼
                        ┌─────────────────────────────────────┐
                        │   BigQuery: bomb_ecom dataset         │
                        │                                      │
                        │  Transcript tables (7):              │
                        │  raw_transcripts                     │
                        │  stg_transcript_products             │
                        │  stg_transcript_niches               │
                        │  stg_transcript_patterns             │
                        │  stg_transcript_psychology           │
                        │  stg_transcript_case_studies         │
                        │  stg_transcript_calls                │
                        │                                      │
                        │  Scrape tables (6):                  │
                        │  scrape_runs                         │
                        │  scrape_pain_points                  │
                        │  scrape_phrases                      │
                        │  scrape_objections                   │
                        │  scrape_desired_outcomes             │
                        │  scrape_product_metrics              │
                        └─────────────────────────────────────┘
                                       │
                                       ▼
                        ┌─────────────────────────────────────┐
                        │   n8n Workflows (Ad Generation)      │
                        │   WF1: Research Pipeline             │
                        │   WF2: Ad Copy Generator             │
                        │   WF3: Image Generation              │
                        │   WF4: Ad Concept                    │
                        │   WF5: Ad Clone                      │
                        └─────────────────────────────────────┘
```

---

## Current Status by Component

| Component | Built | Deployed | Tested |
|---|---|---|---|
| Cloud Run service | ✅ | 🔄 Pending deploy.sh run | 🔄 |
| Transcript extraction (7 tables) | ✅ | 🔄 | 🔄 |
| Scrape extraction (Reddit/Amazon) | ✅ | 🔄 | 🔄 |
| Metrics ingestion (KaloData/SimilarWeb) | ✅ | 🔄 | 🔄 |
| BigQuery transcript schemas | ✅ | ✅ DDL ready | 🔄 |
| BigQuery scrape schemas | ✅ | ✅ DDL ready | 🔄 |
| Analytics queries | ✅ | N/A | 🔄 |
| Local transcript loader (dev) | ✅ | N/A | 🔄 |
| n8n ad gen workflows (WF1-WF5) | 🔄 In progress | — | — |

---

## Next Steps

1. **Run `deploy.sh`** — provisions all GCP infrastructure end-to-end (~5 min)
2. **Upload test transcript** — `gsutil cp test-data/*.txt gs://jake-ecom-knowledge/coaching-transcripts/`
3. **Verify BigQuery rows** — check `bomb_ecom.raw_transcripts` after upload
4. **Rotate Gumloop API key** — replace hardcoded key in static-scaler workflows
5. **Build WF1–WF5 n8n workflows** — connect BigQuery intelligence to ad generation

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Runtime | Python 3.12, Flask, Cloud Run |
| AI Model | Gemini 2.0 Flash (Vertex AI) |
| Storage | Google Cloud Storage |
| Database | BigQuery (`bomb_ecom` dataset) |
| Eventing | Pub/Sub (push subscription) |
| Containerization | Docker via Cloud Build |
| Workflow Automation | n8n (local Docker + cloud) |
| GCP Project | gen-lang-client-0234791928 |
| Region | us-central1 |

---

*Report generated from git commit `60153bf` on branch `dev`*
