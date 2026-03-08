# Current Data

_Last updated: 2026-02-27_

---

## Infrastructure Status

| Component       | Status          | Notes                                                    |
| --------------- | --------------- | -------------------------------------------------------- |
| n8n (Docker)    | Running         | localhost:5678, SQLite, docker-compose.yml in Cyclone-SS |
| Vertex AI       | Working         | Gemini + Claude endpoints confirmed                      |
| OpenClaw agents | In progress     | Phase 1 (Cyclone + Atlas) deploying on Linux             |
| Airtable        | Connected       | base appvPrfjiuXIhdNuW, "Static Scaler 1000"             |
| GCP project     | Active          | gen-lang-client-0234791928, us-central1                  |
| ComfyUI         | Running         | Local Windows (AMD GPU), localhost:8188                  |
| React frontend  | In progress     | bom-ecom/, Replit-hosted                                 |

---

## Workflow Status

| Workflow             | Status      | Notes                                       |
| -------------------- | ----------- | ------------------------------------------- |
| Static Scaler v3     | 22/23 nodes | S3 fileName fix was last blocker (resolved) |
| AI UGC Video Creator | Complete    | On n8n cloud, needs export to local         |
| WF1: Research        | Planned     | POST /webhook/bomb-research-product         |
| WF2: Ad Copy Gen     | Planned     | POST /webhook/bomb-generate-ads             |
| WF3: Image Gen       | Planned     | POST /webhook/bomb-generate-images          |
| WF4: Ad Concept      | Planned     | POST /webhook/bomb-ad-concept               |
| WF5: Ad Clone        | Planned     | POST /webhook/bomb-ad-clone                 |

---

## OpenClaw Team Status

| Agent   | Role     | Status                                              |
| ------- | -------- | --------------------------------------------------- |
| Cyclone | CTO      | Deploying — path fix needed in AGENTS.md/TOOLS.md   |
| Atlas   | Ops      | Phase 1 (deploying alongside Cyclone)               |
| Forge   | Build    | Phase 2 (pending Phase 1 completion)                |
| Signal  | Data     | Phase 2                                             |
| Muse    | Creative | Phase 2                                             |

---

## Current Blockers

1. **OpenClaw path issue** — `~/projects/` paths need to be `/home/jake/projects/` absolute paths in AGENTS.md and TOOLS.md on Linux
2. **WF1–WF5 not built** — Core Bomb Ecom OS workflows. Start with WF1 (Research Pipeline)
3. **Knowledge base empty** — `~/projects/bomb-ecom/knowledge/` directories exist but content not populated

---

## Recent Completions

- Vertex AI integration confirmed working (Gemini + Claude endpoints)
- Docker Compose cleaned up (7 orphaned containers removed)
- Static Scaler v3 S3 fileName bug fixed
- OpenClaw 5-agent architecture designed and deployed to Linux
- 5 custom skills created (ad-family, n8n-import, gcp-deploy, image-to-json, bomb-ecom-notion)
- Bria product shot identified as correct image gen tool (not Flux Dev)

---

## Data Sources

| Data       | Source                                            |
| ---------- | ------------------------------------------------- |
| Ad metrics | Meta Ads Manager (manual export)                  |
| Products   | Airtable (appvPrfjiuXIhdNuW)                      |
| Competitor | Apify actors (Meta Ad Library scraper)            |
| Trends     | Apify actors (TikTok trending — planned)          |
| Images     | fal.ai (Bria), ComfyUI (local)                    |

---

_Update regularly — stale data limits Claude's usefulness as an analytical partner._
