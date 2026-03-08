# Progress Report — 2026-03-08

## Session Accomplishments

### 1. Unified Startup/Stop Scripts (DONE)
- `start-dev.bat` now launches all 3 Docker services (n8n, postgres, bom-ecom) + ComfyUI native
- `stop-dev.bat` updated to stop all 3 Docker services
- bom-ecom added to both scripts (was previously missing)

### 2. ComfyUI Reinstalled (DONE)
- **Problem**: `python.exe` was missing from `python_embeded/` in old install
- **Fix**: Downloaded fresh ComfyUI v0.16.4 AMD portable, extracted with 7zr.exe
- **Path**: `C:\Users\Jake\Downloads\ComfyUI_windows_portable\`
- **Custom nodes**: All 25 preserved from backup
- **Documented**: Full fix history saved to `comfyui-setup.md` so we never repeat this

### 3. Session Memory Updated (DONE)
- `MEMORY.md` updated with startup check instructions
- `comfyui-setup.md` created with comprehensive troubleshooting reference
- Future sessions will check services first thing

---

## Services Status (as of session end)

| Service | Port | Status |
|---------|------|--------|
| n8n | 5678 | Running (Docker) |
| PostgreSQL | 5432 | Running (Docker) |
| Bomb Ecom OS | 5000 | Running (Docker) |
| ComfyUI | 8188 | Reinstalled, launch via start-dev.bat |

---

## Plan Audit — `.claude/plans/`

### OUTDATED — Safe to Archive/Delete (7 plans)

| Plan | Why It's Done |
|------|---------------|
| `ethereal-baking-brook.md` | Security review & push — one-time task, completed |
| `shimmying-dreaming-valley.md` | Fix n8n browser access — old setup issue, resolved |
| `snappy-toasting-pancake.md` | Fix S3 upload node — one-time bug fix, done |
| `iridescent-bubbling-nygaard.md` | n8n integration for "adscaler-console" — old repo name, pre-Cyclone-SS |
| `twinkling-wishing-flame.md` | Repository restructure to "Cyclone-S5" — done differently |
| `vast-puzzling-stearns.md` | Set up Vertex AI credentials — completed, Vertex AI is working |
| `linear-twirling-rainbow.md` | ComfyUI in Docker review — decided to keep native, not Dockerize |

### ACTIVE / STILL RELEVANT (11 plans)

| Plan | What It Is | Priority |
|------|-----------|----------|
| `clever-gathering-reddy.md` | **Creative Intelligence Engine** — core product vision for ad analysis + generation | HIGH |
| `effervescent-snacking-eclipse.md` | **Autonomous Signal Engine** — 7-agent master plan, comprehensive architecture | HIGH |
| `modular-dazzling-forest.md` | **Bomb Ecom OS v4** — Signal Engine + Gated Research Pipeline | HIGH |
| `gentle-launching-goblet.md` | **Product Scoring Engine** + Apify MCP Server | MEDIUM |
| `compiled-jingling-diffie.md` | **Research Intelligence Agent** (Codex Agent) | MEDIUM |
| `happy-wobbling-unicorn.md` | **Wire Gate Pipeline** to real Apify actors | MEDIUM |
| `velvety-scribbling-pretzel.md` | **Deploy n8n + ComfyUI to GCE VMs** — cloud deployment | MEDIUM |
| `linked-roaming-frog.md` | **Static Scaler v3.3** — Bria product shot integration | MEDIUM |
| `zippy-petting-steele.md` | **Data Intelligence System** — Apify skills + data matrix | MEDIUM |
| `zesty-greeting-lovelace.md` | **TikTok Trending Product Scraping** | LOW |
| `purring-splashing-bentley.md` | **Skills Ecosystem Expansion** — self-improving agents | LOW |

### ALSO RELEVANT (2 more plans, now categorized)

| Plan | What It Is | Priority |
|------|-----------|----------|
| `wise-swinging-starlight.md` | **Vertex AI Agent for Image Prompts** — replace GPT-4o-mini in WF3 with Vertex AI Agent Builder. 2-3hr swap, same cost, better quality. | MEDIUM |
| `happy-wobbling-unicorn-agent-aaf0e74.md` | **Apify Scrape Data Model Analysis** — map all field schemas across Reddit, Amazon, KaloData, SimilarWeb scrapers + scoring engine inputs. | LOW |

---

## Forgotten Ideas Worth Revisiting

These were buried in plans but never executed:

1. **DiCloak anti-detect browser** for KaloData scraping (from `effervescent-snacking-eclipse.md`)
   - Rotate browser fingerprints to avoid KaloData's anti-scraping
   - Could unlock reliable TikTok product data at scale

2. **LoRA training for brand visual consistency** (from `linear-twirling-rainbow.md`)
   - Train LoRAs on brand assets so generated images match brand identity
   - ComfyUI is now stable — this is actually feasible

3. **Self-improving agent skill** (from `purring-splashing-bentley.md`)
   - Agent logs its own errors/corrections and improves over time
   - Could apply to any workflow that currently requires manual fixes

4. **Cross-reference rules matrix** (from `zippy-petting-steele.md`)
   - Turn raw scrape data into actionable intelligence automatically
   - "If product has X reviews + Y growth rate + Z ad spend → flag as opportunity"

5. **Scraper Hub category dropdown UI** (from `effervescent-snacking-eclipse.md`)
   - One-click scraping by product category in the Bomb Ecom OS UI
   - Would make the research pipeline accessible without technical knowledge

---

## What's Moving the Needle

The high-priority items that drive revenue:

1. **Signal Engine** (plans: effervescent, modular, clever) — finding winning products automatically
2. **Cloud Deployment** (plan: velvety) — n8n needs a public URL for webhooks to work 24/7
3. **Image Generation Pipeline** (plan: linked) — Bria product shots at scale
4. **Research Pipeline** (plan: compiled, happy-wobbling) — automated product research

Everything else is either supporting infrastructure or future expansion.
