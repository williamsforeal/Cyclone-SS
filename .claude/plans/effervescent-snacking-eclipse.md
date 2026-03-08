# Autonomous Signal Engine - Agent Team Master Plan

## Context

Jake is building the **BOMB Ecom OS** - a DTC ad automation platform. Two strategy documents define the vision:

1. **"Building an Autonomous Signal Engine"** (Fogarty) - The WHAT: Apify scrapers feeding data into Vertex AI's "True North" scoring matrix (0-98 score) to algorithmically evaluate product viability while you sleep.
2. **"data plan 1"** - The HOW: Database schema, API endpoints, n8n workflows, meta-ad-monitor merge, frontend charts, deployment.

**Current state:** bom-ecom (React+Express+PostgreSQL) is the main app. meta-ad-monitor (Express+SQLite, 2,139 lines) is a standalone app with battle-tested Apify scraping + Gemini AI analysis. n8n runs in Docker with 20+ workflows. The competitor-ads.tsx page is a 226-line skeleton with TODOs.

**Goal:** Merge everything into one platform, add the Fogarty scoring engine, wire up new Apify data sources, and build the dashboard that turns noise into signal.

---

## Agent Architecture: 7 Agents, 3 Phases

```
PRE-OVERHAUL ─ Commit & push branch 2 (preserve baseline)

PHASE 0 ─ Foundation (sequential)
  Agent 1: Schema Architect

PHASE 1 ─ Core Build (parallel tracks)
  Agent 2: Backend Engineer ─────────────┐
  Agent 3: Meta Ad Monitor Merge ────────┤  (all start after Agent 1)
  Agent 6: DevOps & Custom Actor Eng. ───┘
  Agent 7: Skills & Domain Knowledge ──────── (no deps, parallel with all)

PHASE 2 ─ Experience Layer (parallel, after Phase 1)
  Agent 4: n8n Workflow Engineer ──── (needs Agent 2 endpoints)
  Agent 5: Frontend Engineer ──────── (needs Agents 2 + 3 APIs)
              └── Scraper Hub (category dropdown UI)
              └── Signal Engine dashboard
              └── Competitor Ads page
```

**Critical path:** Agent 1 → Agent 2 → Agent 4 (Vertex scoring workflow) → Agent 5 (Signal Engine + Scraper Hub)

---

## Agent 1: Schema Architect

**Role:** Extend PostgreSQL schema (Drizzle ORM) with all new tables
**Blocks:** Everything else - this is the foundation

### Tasks
1. Add `scrapeSources` table - Registry of Apify actors (actor_id, name, platform, category, default_input, is_active)
2. Add `scrapeRuns` table - Execution log (source_id, status, started_at, completed_at, items_count, apify_run_id, error)
3. Add `rawScrapeData` table - Raw JSON storage for audit trail (run_id, source_id, platform, raw_json)
4. Add `filteredInsights` table - Post-filter analyzed data (source_id, insight_type, category, sentiment, score, tags, summary)
5. Add `weeklyRollups` table - Aggregated weekly metrics (source_id, week_start, metric_name, metric_value, comparison_pct)
6. Add `adVaultBrands` table - Port SQLite `brands` schema (brand_name, fb_page_url, page_id, vertical, status, last_scraped)
7. Add `adVault` table - Port SQLite `ad_vault` with ALL fields including 5 AI tag columns, video_url, bookmarked, weeks_in_top10, first_seen, last_seen, stored_creative_url
8. Add `adVaultSnapshots` table - Port SQLite `weekly_snapshots` (brand_id, ad_id, week_start, rank)
9. Extend `productCandidates` with data analytics scoring columns:
   - `scoreTotal` (integer 0-100), `scoreStatus` (enum: candidate|enriching|approved|test|watchlist|rejected)
   - `big3Pass` (boolean), `big3Pain` (integer 0-20), `big3Proof` (integer 0-45), `big3Economics` (integer 0-15)
   - `scoreBreakdown` (jsonb - full component breakdown from scoring engine)
   - `hardGateResults` (jsonb - pass/fail for each of 8 gates)
   - `primaryAngle` (text - from Vertex AI), `aiReasoning` (text - from Vertex AI)
   - `kalodataData` (jsonb - raw KaLoData metrics: revenue7d/30d/90d, orders, growth, AOV, launchAgeDays)
   - `metaAdsData` (jsonb - activeAdsTotal, advertisersCount, hasNewCreatives14d)
   - `amazonData` (jsonb - monthlyUnits, rating, reviewCount)
   - `similarwebData` (jsonb - monthlyVisits, topCountries, channels)
   - `economicsData` (jsonb - unitProfit, grossMarginPct, price, cogs, shippingCost)
   - `manualScores` (jsonb - painTotal20, mechanismUniqueness5, improvePotential3, adaptPotential2, angleDensity5, offerExpandability5)
10. Extend `competitorIntel` - Add `sourceActorId`, `rawRunId` columns
11. Extend `trendItems` - Add `sourceActorId`, `rawRunId` columns
12. Generate all Zod insert/select schemas and TypeScript types
13. Run `drizzle-kit generate` for migration files

### Files
- `bom-ecom/shared/schema.ts` (primary - all definitions)
- `bom-ecom/drizzle.config.ts` (verify config)

---

## Agent 2: Backend Engineer

**Role:** Build scrape management, data ingestion, insights, and scoring API endpoints
**Depends on:** Agent 1 (schema must exist)

### Tasks
1. Create `server/lib/scrape-manager.ts` - Scrape source CRUD + Apify trigger logic
2. Create `server/lib/data-ingestion.ts` - Universal data normalization from any Apify actor format
3. Create `server/lib/vertex-scoring.ts` - Vertex AI client for True North scoring matrix (use Gemini endpoint pattern from MEMORY.md: `us-central1-aiplatform.googleapis.com/v1/projects/gen-lang-client-0234791928/...`)
4. `GET /api/scrape-sources` - List registered Apify actors
5. `POST /api/scrape-sources` - Register new actor with default config
6. `POST /api/scrape-sources/:id/run` - Trigger scrape (calls n8n webhook or Apify direct)
7. `GET /api/scrape-runs` - List recent runs with status/counts
8. `GET /api/scrape-runs/:id` - Single run detail + items
9. `POST /api/ingest/webhook` - Universal n8n callback for any scrape result (normalizes + stores in raw_scrape_data → filtered_insights)
10. `POST /api/ingest/bulk` - Bulk import from Apify dataset
11. `GET /api/insights` - Query filtered insights (?source=&type=&dateFrom=&dateTo=&category=)
12. `GET /api/insights/time-series` - Time-series data for charts
13. `GET /api/rollups` - Weekly rollup summaries
14. `POST /api/rollups/generate` - Trigger rollup computation
15. `POST /api/product-candidates/:id/score` - Trigger Vertex AI "True North" scoring for a candidate (bundles all available data → sends Fogarty matrix prompt → saves score breakdown)
16. `POST /api/product-candidates/score-batch` - Batch score all "evaluating" candidates
17. `GET /api/product-candidates/:id/score-breakdown` - Detailed Fogarty score vectors

### Files
- `bom-ecom/server/routes.ts` (add route groups)
- `bom-ecom/server/lib/scrape-manager.ts` (new)
- `bom-ecom/server/lib/data-ingestion.ts` (new)
- `bom-ecom/server/lib/scoring-engine.ts` (new - TypeScript engine from data analytics.md, with 5 bug fixes applied)
- `bom-ecom/server/lib/scoring-config.json` (new - JSON config from data analytics.md, with labels added)
- `bom-ecom/server/lib/vertex-narrative.ts` (new - Vertex AI for qualitative analysis only, not numeric scoring)

### Scoring System: Hybrid Approach (Deterministic Engine + Vertex AI Narrative)

**Primary scoring:** The `data analytics.md` TypeScript engine (100-point, config-driven, deterministic).
This REPLACES the Fogarty 0-98 Vertex AI prompt for numeric scoring.

**Source file to integrate:** `data analytics.md` → drop-in TypeScript + JSON config
**Location in app:** `bom-ecom/server/lib/scoring-engine.ts` (new) + `bom-ecom/server/lib/scoring-config.json` (new)

**3-stage pipeline:**
- Stage A: Candidate Filter (KaLoData 7d metrics → 200 products → keep 10-30)
- Stage B: Enrichment (Meta Ads + SimilarWeb + Amazon + COGS data added)
- Stage C: Hard Gates (8 pass/fail checks) → 100-point Score → Decision (APPROVE/TEST/WATCHLIST/REJECT)

**5 bugs to fix during implementation:**
1. Boolean coercion: `=== true` → also accept `"true"` and `1`
2. Exclusion enforcement: Add category/flag checks to candidate filter
3. Big-3 pass: Implement bucket evaluation (Pain≥14/20, Proof≥30/45, Economics≥10/15)
4. Round final score: `Math.round()` to prevent 79.9999 ≠ 80 boundary bugs
5. Add `label` to all JSON config components

**Vertex AI role (secondary):** After deterministic scoring, call Vertex AI ONLY for:
- `primary_angle` - 1-sentence emotional hook based on review pain points
- `reasoning` - 2-sentence qualitative assessment
- NOT the numeric score (that's computed by the engine)

**Decision bands:** 80-100=APPROVE, 65-79=TEST, 50-64=WATCHLIST, <50=REJECT
**Big-3 override:** Even if score≥80, reject if Pain<14/20 OR Proof<30/45 OR Economics<10/15

---

## Agent 3: Meta Ad Monitor Migration

**Role:** Port 2,139 lines from standalone meta-ad-monitor/server.js into bom-ecom
**Depends on:** Agent 1 (ad vault tables must exist)
**Largest agent - consider splitting into sub-phases**

### Phase A: Routes + CRUD
1. Create `server/lib/ad-vault.ts` - Core business logic (ported from server.js)
2. Create `server/lib/ad-vault-routes.ts` - Express route definitions
3. Mount routes in `server/routes.ts` under `/api/ad-vault/*` namespace
4. Port brand CRUD: GET/POST/PUT/DELETE `/api/ad-vault/brands`
5. Port page ID resolution: `resolvePageId()` and `resolvePageIdByName()` (ScrapeCreators API)
6. Port ad queries with ALL filters: brand_ids, min_weeks, date_range, media_type, 5 AI tag filters, sort, pagination
7. Port bookmark toggle: POST `/api/ad-vault/ads/:id/bookmark`
8. Port evergreen analytics: GET `/api/ad-vault/analytics/evergreen` (weeks_in_top10 >= 4)
9. Port vertical breakdown: GET `/api/ad-vault/analytics/by-vertical`
10. Port weekly snapshots: GET `/api/ad-vault/analytics/weekly-snapshot`
11. Port import endpoints: JSON + CSV with page ID auto-resolution

### Phase B: Scraping + AI + Scheduling
12. Port `startAdLibraryScrape()` - Apify actor trigger (JJghSZmShuco4j9gJ)
13. Port `pollApifyJob()` / `getApifyResults()` - Apify status polling
14. Port `transformApifyResults()` - **CRITICAL: 3-pass dedup** (adArchiveID → media fingerprint → headline). Must be exact.
15. Port `processScrapedAds()` - Save to DB, track weekly_snapshots, increment weeks_in_top10, cleanup old non-bookmarked ads
16. Port `analyzeAdCreative()` - Gemini 2.5-pro 5-tag taxonomy (with image/video inline base64 support)
17. Port `runBatchAnalysis()` - Batch analyze up to 50 unanalyzed ads
18. Port `downloadCreativeImage()` - Local image caching (detect content-type, store in public/creatives/)
19. Port scheduled scraping with node-cron: `setupScheduledScrape()` + settings endpoints
20. Convert ALL SQLite raw queries to Drizzle ORM (better-sqlite3 → drizzle-orm/pg)
21. Deprecate/remove `server/lib/competitor-airtable.ts` (Airtable competitor base no longer needed)

### Files
- `bom-ecom/server/lib/ad-vault.ts` (new - core logic)
- `bom-ecom/server/lib/ad-vault-routes.ts` (new - routes)
- `bom-ecom/server/routes.ts` (mount ad-vault routes)
- `meta-ad-monitor/server.js` (READ ONLY - source of truth)
- `bom-ecom/server/lib/competitor-airtable.ts` (deprecate)

---

## Agent 4: n8n Workflow Engineer

**Role:** Create new workflows and update existing ones for the signal engine
**Depends on:** Agent 2 (needs `/api/ingest/webhook` and scoring endpoints)

### Tasks
1. **Create Universal Scrape Orchestrator** (`wf-universal-scrape-orchestrator.json`)
   - Webhook: POST /webhook/bomb-scrape-universal
   - Accepts: `{ source_id, actor_id, input_params }`
   - Triggers any Apify actor dynamically
   - Polls for completion → fetches dataset
   - Routes to platform-specific filter Code node
   - POSTs results to /api/ingest/webhook
   - **CRITICAL:** Use `=` prefix for entire jsonBody strings (per MEMORY.md gotcha)

2. **Create Amazon Reviews Scraper workflow** (`wf-amazon-reviews-scraper.json`)
   - Fogarty Phase 1: Scrape 1-star/3-star reviews for pain extraction
   - Feed to Vertex AI: "What specific problem does this product fail to solve?"
   - POST to /api/ingest/webhook with type: "amazon_reviews"

3. **Create AliExpress COGS workflow** (`wf-aliexpress-cogs.json`)
   - Fogarty Phase 1: Pull base COGS for margin calculation
   - POST to /api/ingest/webhook with type: "aliexpress_cogs"

4. **Create Kalodata Revenue Scraper workflow** (`wf-kalodata-revenue.json`)
   - Webhook: POST /webhook/bomb-kalodata-scrape
   - Accepts: `{ targetUrl, sessionCookie }` (cookie from n8n credentials store)
   - Triggers custom Kalodata Apify actor (built by Agent 6)
   - Fetches dataset → extracts estimated revenue, trend data
   - POST to /api/ingest/webhook with type: "kalodata_revenue"

5. **Create Vertex AI Scoring workflow** (`wf-vertex-ai-scoring.json`)
   - Webhook: POST /webhook/bomb-score-product
   - Bundles ALL collected data from PostgreSQL (ads, reviews, COGS)
   - Sends to Vertex AI (Gemini) with True North scoring matrix prompt
   - Parses JSON response → POSTs to /api/product-candidates/:id/score

6. **Update wf-meta-ad-library.json** - Change callback to /api/ad-vault/scrape/ingest (or universal /api/ingest/webhook)
7. **Update wf-scrape-instagram.json** - Add dual-write to /api/ingest/webhook
8. **Update wf-scrape-tiktok.json** - Add dual-write to /api/ingest/webhook (actor: GdWCkxBtKWOsKjdch)
9. **Update wf-scrape-ig-transcripts.json** - Add dual-write to /api/ingest/webhook
10. **Build platform-specific Code node filters** for TikTok, Instagram, Meta dedup, Kalodata

### Files
- `workflows/wf-universal-scrape-orchestrator.json` (new)
- `workflows/wf-amazon-reviews-scraper.json` (new)
- `workflows/wf-aliexpress-cogs.json` (new)
- `workflows/wf-vertex-ai-scoring.json` (new)
- `workflows/wf-kalodata-revenue.json` (new - triggers custom Kalodata actor)
- `workflows/wf-meta-ad-library.json` (update callbacks)
- `workflows/wf-scrape-instagram.json` (update)
- `workflows/wf-scrape-tiktok.json` (update)
- `workflows/wf-scrape-ig-transcripts.json` (update)

---

## Agent 5: Frontend Engineer

**Role:** Complete competitor-ads page, build Signal Engine dashboard, add charts
**Depends on:** Agents 2 + 3 (needs API endpoints)

### Tasks
1. **Complete competitor-ads.tsx** (currently 226-line skeleton):
   - Brand selector sidebar with stats (ad_count, evergreen_count, last_scraped)
   - Full filter bar: media type, date range picker, all 5 AI tag dropdowns
   - Ad grid with thumbnail images (stored_creative_url fallback to creative_url)
   - Ad detail modal/sheet (full image, all copy, AI tags, weeks_in_top10, start_date, ad_library_link)
   - Bookmark toggle on each card
   - "Analyze" / "Batch Analyze" / "Scrape Brand" / "Scrape All" actions
   - Evergreen view tab (weeks_in_top10 >= 4)
   - Brand management dialog (add/delete)
   - Schedule settings panel
   - Switch from Airtable-backed `/api/meta-brands` → PostgreSQL-backed `/api/ad-vault/brands`

2. **Create Signal Engine dashboard** (`signal-engine.tsx`):
   - Route: `/research/signal-engine`
   - KPI cards: total scrape sources, active runs, total insights, avg product score
   - Fogarty 0-98 score display broken into 4 vectors with color coding
   - "Score Product" button → triggers Vertex AI scoring
   - Score history timeline

3. **Build dashboard charts** (using existing Recharts patterns from analytics pages):
   - AreaChart: Scrape volume over time by platform
   - PieChart: Insights by platform (Meta, TikTok, Instagram, Amazon)
   - BarChart: Top scoring products (horizontal, color by score tier)
   - LineChart: Product score trends over time
   - DataTable: Raw insights with sorting/filtering/pagination

4. **Create shared filter-bar component** (`components/filter-bar.tsx`):
   - Date range picker (7d, 14d, 30d, 90d, custom)
   - Platform multi-select
   - Category filter
   - Keyword search
   - Export button

5. **Build Scraper Hub page** (`scraper-hub.tsx`):
   - Route: `/automations/scraper-hub`
   - **Category dropdown**: Social, E-commerce, Research, Automation, Custom
   - **Actor selector**: Filtered by category, shows actor name + description
   - **Dynamic input form**: Renders fields from `scrapeSources.default_input` JSON schema (text inputs, dropdowns, number fields, toggles, URL lists)
   - **Pre-configured defaults**: Each actor has smart filter defaults (e.g., Amazon Reviews → sort="Most recent", marketplace=US)
   - **"Run Scrape" button**: POST `/api/scrape-sources/:id/run` with form data
   - **Recent runs panel**: Shows last 10 runs with status badge, item count, duration, cost
   - **Run detail view**: Click a run to see raw data + filtered insights

6. **Navigation updates**:
   - Add "Competitor Ads" to sidebar Research Pipeline group (with `Swords` icon)
   - Add "Signal Engine" to sidebar Research Pipeline group (with `Radar` or `Target` icon)
   - Add "Scraper Hub" to sidebar Automations group (with `Globe` or `Database` icon)
   - Add routes in App.tsx + lazy imports

### Files
- `bom-ecom/client/src/pages/competitor-ads.tsx` (complete - currently 226 lines)
- `bom-ecom/client/src/pages/signal-engine.tsx` (new)
- `bom-ecom/client/src/pages/scraper-hub.tsx` (new - category dropdown UI)
- `bom-ecom/client/src/components/filter-bar.tsx` (new)
- `bom-ecom/client/src/components/score-display.tsx` (new - Fogarty score visualization)
- `bom-ecom/client/src/components/scraper-input-form.tsx` (new - dynamic form from JSON schema)
- `bom-ecom/client/src/App.tsx` (add routes)
- `bom-ecom/client/src/components/app-sidebar.tsx` (add nav items)

### Patterns to Follow
- `product-research.tsx` (1,073 lines) - scoring UI, dialogs, queries
- `analytics-financial.tsx` - Recharts usage (LineChart, AreaChart, KPI cards)
- `competitor-ads.tsx` existing skeleton - React Query mutations pattern

---

## Agent 6: DevOps & Custom Actor Engineer

**Role:** Docker config, env vars, migration scripts, Apify actor registration, AND build the Kalodata custom actor (HIGHEST PRIORITY custom build)
**Depends on:** Agent 1 (for table definitions). Can run in parallel with Agents 2/3.

### Tasks - Infrastructure
1. Update `docker-compose.yml` - Add GEMINI_API_KEY, VERTEX_AI_PROJECT_ID, SCRAPECREATORS_API_KEY to bom-ecom env
2. Verify bom-ecom Dockerfile includes node-cron dependency
3. Add uploads volume mount for ad creative image storage
4. Create `.env.example` update - Document all required vars grouped by service
5. Create `scripts/seed-scrape-sources.js` - Seed ALL 17 Apify actors with category, default_input configs, and optimized filter defaults:
   - **Social:** JJghSZmShuco4j9gJ (Meta Ad Library), shu8hvrXbJbY3Eb9W (Instagram), 3C7L8IMQOkq3isV2Y (IG Transcripts), VLKR1emKm1YGLmiuZ (Specialized IG), GdWCkxBtKWOsKjdch (TikTok), OtzYfK1ndEGdwWFKQ (TikTok Data Extractor), h7sDV53CddomktSi5 (YouTube)
   - **E-commerce:** 2APbAvDfNDOWXbkWf (E-commerce Tool), hDVdezxZja9dcf9dY (AliExpress), Us2dCgQWZ0A8L9prQ (Shopify Products), LAehRitE0JmYG7NSn (Shopify Email Leads), H5V0awDbsJxCULXEj (Shopify App Store)
   - **Research:** ZebkvH3nVOrafqr5T (Amazon Reviews), aYG0l9s7dbB7j3gbS (Website Crawler/RAG)
   - **Automation:** mdfTG3x6gXFlZD1oh (Playwright Browser)
   - Each seed record includes: actor_id, name, platform, category, default_input (JSON with optimized filters), is_active
6. Create `scripts/migrate-sqlite-to-postgres.js` - One-time migration of existing meta-ad-monitor SQLite data
7. Add env var validation on server startup (fail-fast for missing critical keys)

### Tasks - Kalodata Custom Actor (CORE - Most Valuable)
Per Fogarty strategy, Kalodata is the highest-value custom scraper. Uses session cookie bypass:

8. **Build `apify-actors/kalodata/`** - Full Crawlee + Playwright implementation:
   - `main.js` - PlaywrightCrawler with:
     - `ProxyConfiguration({ groups: ['RESIDENTIAL'] })` for anti-bot bypass
     - `useSessionPool: true` + `browserPoolOptions: { useFingerprints: true }` for fingerprint randomization
     - `preNavigationHooks` to inject Kalodata session_id cookie (from n8n input) before navigation
     - `requestHandler` that waits for React/Vue to render (`waitForTimeout(3000)`) then extracts revenue metrics
     - `Actor.pushData()` to push {url, estimatedRevenue, timestamp} to Apify dataset
   - `INPUT_SCHEMA.json` - Accepts `targetUrl` (string) and `sessionCookie` (string) from n8n
   - `package.json` with crawlee, playwright, apify dependencies
   - `Dockerfile` for Apify deployment
   - README with: how to extract session_id cookie from DiCloak/Chrome, how to store in n8n credentials, how to trigger via API

9. **Build `apify-actors/similarweb/`** - Same Crawlee + Playwright framework:
   - Residential proxy config (datacenter will get blocked)
   - Extract: monthly visits, traffic sources, top keywords, bounce rate
   - `INPUT_SCHEMA.json` accepts `targetUrl` (domain)

10. Add KALODATA_SESSION_COOKIE and APIFY_PROXY_PASSWORD to `.env` and n8n env vars

### DiCloak Integration (Jake has anti-detect browser)
Jake runs **DiCloak** with Chrome kernels 120-143, local proxy config, and fingerprint management.

**Hybrid approach for Kalodata:**
- **Session management**: Log into Kalodata in a DiCloak profile (persistent cookies, unique fingerprint)
- **Cookie export**: Extract session cookies from DiCloak → store in n8n credentials
- **Cloud automation**: Apify actor receives cookies via input, runs scheduled scrapes in the cloud
- **Fallback**: If Apify cloud gets blocked, use Apify's local Playwright actor (`mdfTG3x6gXFlZD1oh`) to automate within DiCloak's browser context on Jake's machine

DiCloak provides better fingerprinting than Crawlee's built-in `useFingerprints` since it manages full browser profiles (canvas, WebGL, user-agent, timezone, screen resolution, WebRTC).

### Files
- `docker-compose.yml` (update)
- `.env.example` (update)
- `scripts/seed-scrape-sources.js` (new)
- `scripts/migrate-sqlite-to-postgres.js` (new)
- `bom-ecom/server/index.ts` (add env validation)
- `apify-actors/kalodata/main.js` (new - CORE)
- `apify-actors/kalodata/INPUT_SCHEMA.json` (new)
- `apify-actors/kalodata/package.json` (new)
- `apify-actors/kalodata/Dockerfile` (new)
- `apify-actors/similarweb/main.js` (new)
- `apify-actors/similarweb/INPUT_SCHEMA.json` (new)
- `apify-actors/similarweb/package.json` (new)
- `apify-actors/similarweb/Dockerfile` (new)

---

## Task Summary

| Agent | Role | Task Count | Phase |
|-------|------|-----------|-------|
| 1 | Schema Architect | 13 | 0 (foundation) |
| 2 | Backend Engineer | 17 | 1 (parallel) |
| 3 | Meta Ad Monitor Merge | 21 | 1 (parallel) |
| 4 | n8n Workflow Engineer | 10 | 2 (after Agent 2) |
| 5 | Frontend Engineer | 6 groups (~30 subtasks) | 2 (after Agents 2+3) |
| 6 | DevOps & Custom Actors | 13 | 1 (parallel) |
| 7* | Skills & Domain Knowledge | 9 skills | 1 (parallel, no deps) |
| **Total** | | **~113 tasks** | |

*Agent 7 (Skills) can run in parallel with everything since it writes to `.claude/skills/` and doesn't touch app code. Could also be folded into the lead agent.*

---

## Risk Register

1. **3-pass dedup logic** (Agent 3) - The `transformApifyResults()` function in meta-ad-monitor is the crown jewel. Must be ported exactly: adArchiveID dedup → media URL dedup → headline dedup → keep top 10.
2. **n8n expression mode** - ALL jsonBody values must start with `=` for expressions to work. Without it, `{{ }}` is sent as literal text.
3. **Vertex AI scoring reliability** - The True North prompt must return structured JSON consistently. May need iteration on prompt engineering.
4. **Dual data transition** - During migration, data lives in both Airtable and PostgreSQL. Clean cutover needed.
5. **Frontend page size** - competitor-ads.tsx could grow to 1,000+ lines. Extract components early.

---

## Verification Plan

### End-to-End Test Flow
1. **Add brand** in competitor-ads UI → verify saved in PostgreSQL `adVaultBrands`
2. **Trigger scrape** → n8n Universal Orchestrator → Apify actor → callback to /api/ingest/webhook → data in `rawScrapeData` + `adVault`
3. **AI analysis** → Gemini 2.5-pro tags ad with 5-category taxonomy → tags visible in UI
4. **Score product** → Enter product candidate → click "Score" → n8n Vertex AI workflow → Fogarty 0-98 score displayed with vector breakdown
5. **Dashboard charts** → Signal Engine page shows scrape volume, insight breakdown, score trends
6. **Scheduled scrape** → Configure cron → verify auto-scrape fires → weekly_snapshots populated → evergreen detection works

### Quick Smoke Tests
- `curl POST /api/scrape-sources` - Register actor
- `curl POST /api/ingest/webhook` - Ingest test data
- `curl GET /api/insights?source=meta` - Query insights
- `curl POST /api/product-candidates/1/score` - Trigger scoring
- Visit `/research/signal-engine` - Charts render
- Visit competitor-ads page - Ad grid loads from PostgreSQL

---

## Pre-Overhaul: Commit & Push Branch 2

Before any agent work begins, commit and push the current state of branch `2` to preserve the baseline.

---

## Complete Apify Actor Registry (17 actors)

All actor IDs now confirmed by Jake:

| Category | Actor Name | Actor ID | Signal/Purpose |
|----------|-----------|----------|----------------|
| **Meta/Social** | Meta Ad Library | `JJghSZmShuco4j9gJ` | Ad longevity, creative analysis |
| | Instagram | `shu8hvrXbJbY3Eb9W` | Competitor content |
| | IG Transcripts | `3C7L8IMQOkq3isV2Y` | Video transcript extraction |
| | Specialized IG | `VLKR1emKm1YGLmiuZ` | Deep IG data |
| | TikTok | `GdWCkxBtKWOsKjdch` | TikTok content |
| | TikTok Data Extractor | `OtzYfK1ndEGdwWFKQ` | TikTok metrics/analytics |
| | YouTube | `h7sDV53CddomktSi5` | YouTube content/ads |
| **E-commerce** | E-commerce Scraping Tool | `2APbAvDfNDOWXbkWf` | Multi-marketplace product data |
| | AliExpress Product Search | `hDVdezxZja9dcf9dY` | COGS / margin floor |
| | Shopify Products | `Us2dCgQWZ0A8L9prQ` | Competitor product catalogs |
| | Shopify Email Leads | `LAehRitE0JmYG7NSn` | Lead generation |
| | Shopify App Store | `H5V0awDbsJxCULXEj` | App/tool research |
| **Research** | Amazon Reviews | `ZebkvH3nVOrafqr5T` | Pain extraction (1-star/3-star) |
| | Website Crawler (LLM/RAG) | `aYG0l9s7dbB7j3gbS` | Feed context to AI/vector DBs |
| **Automation** | Playwright Browser | `mdfTG3x6gXFlZD1oh` | General-purpose browser automation |
| **Custom (to build)** | Kalodata | TBD (deploy to Apify) | Revenue estimates, trend data |
| | SimilarWeb | TBD (deploy to Apify) | Traffic, keywords, bounce rate |

**Resolved unknowns:** `2APbAvDfNDOWXbkWf` = E-commerce Scraping Tool, `ZebkvH3nVOrafqr5T` = Amazon Reviews. Remaining unknowns (`BG3WDrGdteHgZgbPK`, `ZhSGsaq9MHRnWtStl`) - skip for now.

---

## NEW: Scraper Hub UI (Category Dropdown Concept)

Jake's vision: A "Scraper Hub" page where users pick a **category** from a dropdown (Social, E-commerce, Research), then pick a **specific actor** within that category, configure its filters, and trigger it with a button.

**Why this matters:** Each actor has vastly different input parameters (the screenshots show TikTok has search queries + date filters + sorting; Amazon Reviews has review URLs + keyword search + marketplace + sort type; E-commerce tool has scrape mode + product URLs + category URLs + AI summary prompts). Getting the filters right = signal. Wrong filters = wasted money.

**UI Design:**
1. Category dropdown → filters the actor list
2. Actor selector → loads that actor's specific input form
3. Dynamic form fields rendered from `scrapeSources.default_input` JSON schema
4. "Run Scrape" button → triggers `/api/scrape-sources/:id/run`
5. Recent runs panel → shows status, item count, cost

This is assigned to **Agent 5** as a new task (Scraper Hub page).

---

## NEW: Agent Skills to Create

Jake wants Claude Code skills for data, marketing, analytics, and ecommerce that encode domain expertise + correct filter configurations. These go in `.claude/skills/`.

### Skills for Agent 7 (or folded into existing agents):

**Data & Scraping Skills:**
1. `/scrape-config` - Generate optimal Apify actor input configs based on use case. Encodes filter best practices per actor (e.g., Kalodata needs specific revenue thresholds, Amazon Reviews should target 1-star + 3-star, AliExpress needs marketplace=US).
2. `/apify-run` - Trigger an Apify actor run with smart defaults, monitor status, fetch results.

**Marketing Skills:**
3. `/ad-family` - Already exists. The ad-fam-architect.md prompt is the system prompt for this skill (Motion Methodology: Learned Concept → 3-asset Ad Family).
4. `/pain-extract` - Given Amazon review data, extract the top pain points and position product as the solution (Fogarty's "bleeding neck" signal).
5. `/creative-taxonomy` - Classify any ad creative using the 5-tag taxonomy (asset_type, visual_format, messaging_angle, hook_tactic, offer_type).

**Analytics Skills:**
6. `/score-product` - Run the Fogarty "True North" scoring matrix on a product candidate with all available data.
7. `/trend-radar` - Analyze cross-platform trend signals (TikTok velocity, IG engagement, Amazon review sentiment) for a product/niche.

**E-commerce Skills:**
8. `/margin-calc` - Given AliExpress COGS + selling price, calculate margin, break-even ROAS, and target CPA.
9. `/competitor-teardown` - Given a brand name, pull all available data (ads, traffic, reviews) and generate a strategic assessment.

---

## NEW: Filter Configuration Importance

Each Apify actor has critical filter parameters. Wrong filters = noise. Right filters = signal.

**Examples from Jake's screenshots:**

| Actor | Critical Filters | Why They Matter |
|-------|-----------------|-----------------|
| Kalodata | Revenue threshold, time range, category | Without revenue floor, you get noise products |
| Amazon Reviews | Sort by "Most recent", 1-star + 3-star only | 5-star reviews don't reveal pain points |
| AliExpress | Marketplace=US, include seller data | Need US pricing + reliable suppliers |
| TikTok | Search sorting="Top", date filters, profile sections="Videos" | Need trending content, not old/random |
| E-commerce Tool | Scrape mode, AI summary data points, keyword search | Built-in AI summary can pre-filter |

These filter configs must be:
1. Stored in `scrapeSources.default_input` (jsonb) in the database
2. Surfaced in the Scraper Hub UI as pre-configured forms
3. Documented in the `/scrape-config` skill
4. Used by n8n workflows when triggering actors

---

## Decisions Made (from Jake)

1. **TikTok Apify actor confirmed:** GdWCkxBtKWOsKjdch
2. **Kalodata = MOST IMPORTANT custom actor** - Core requirement, Fogarty's session cookie injection approach
3. **Custom actors (Kalodata + SimilarWeb)** = Core requirement for Phase 1
4. **All 6 agents** run following the phased dependency order
5. **17 Apify actors identified** - Full registry above (resolved 2 of 4 unknowns)
6. **Category dropdown UI** for scraper management - users pick category → actor → configure filters → trigger
7. **Skills needed** for data, marketing, analytics, ecommerce - encoding domain expertise into reusable Claude Code skills
8. **Filter configs are critical** - each actor needs optimized default parameters or it wastes money
9. **Commit & push branch 2** before starting the overhaul
10. **ad-fam-architect.md** is the system prompt for the existing `/ad-family` skill (Motion Methodology)

## Still Needed from Jake
- **Kalodata session_id cookie** - Jake must export from Chrome browser for the custom actor to use
- **Kalodata-specific filter criteria** - What revenue thresholds, time ranges, categories define a "signal" product?
