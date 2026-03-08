# Business Info

---

## Organization Overview

**williamsforeal LLC** — a one-person DTC (direct-to-consumer) automation company building AI-powered ad creative infrastructure for e-commerce brands. The core product is the **Bomb Ecom OS** (also called AI Com OS): an end-to-end platform that takes a product, researches it, generates ad concepts, produces creative assets, and publishes them — with minimal human intervention.

The business sits at the intersection of performance marketing and AI engineering. Primary revenue model: productized service + SaaS (in development).

---

## Products / Services / Focus Areas

- **Bomb Ecom OS** — the main platform. React frontend, n8n automation backend, AI pipeline for product research → ad copy → image generation → publishing.
- **Static Scaler** — n8n workflow series (v1/v2/v3) for generating static ad creatives at scale using AI copy + image composition.
- **AI UGC Video Creator** — n8n workflow for generating UGC-style video ads using Higgsfield (visual) + ElevenLabs (voice).
- **PalmAura** — the flagship DTC product (hand wellness device / warm compression + massage). The primary test case and training data for all creative frameworks.

---

## Tech Stack

| Layer        | Tool                                                                  |
| ------------ | --------------------------------------------------------------------- |
| Frontend     | React (Replit-hosted, `bom-ecom/`)                                    |
| Automation   | n8n (Docker, localhost:5678)                                          |
| Database     | Airtable (base: appvPrfjiuXIhdNuW, "Static Scaler 1000")              |
| AI Models    | Gemini 2.5 Pro/Flash via Vertex AI, Claude via Vertex AI              |
| Image Gen    | fal-ai/bria/product-shot (product placement), ComfyUI (local AMD GPU) |
| Video        | Higgsfield (AI video), ElevenLabs (TTS)                               |
| Cloud        | GCP (project: gen-lang-client-0234791928, region: us-central1)        |
| Agents       | OpenClaw 5-agent team on WSL Linux (Cyclone/Atlas/Forge/Signal/Muse)  |
| Scraping     | Apify actors (7 configured)                                           |
| Ad Rendering | BannerBear (templated static ads)                                     |

---

## Key Context

- **Stage:** Early-stage, single founder, building toward productized offering
- **Repository:** `Cyclone-SS` (main repo, git: main = stable, dev = active)
- **Linux environment:** WSL with OpenClaw agent team at `~/projects/bomb-ecom/`
- **Windows environment:** Claude Code (this workspace), ComfyUI (AMD GPU)
- **Critical constraint:** n8n expression mode — entire jsonBody must start with `=` for expressions to work
- **Image gen rule:** NEVER use Flux Dev for product shots — it destroys product identity. Always use Bria.

---

_Keep this high-level — enough to orient Claude, not a comprehensive company wiki._
