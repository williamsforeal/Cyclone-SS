# Autonomous Signal Engine - Agent Team Master Plan

> **Status:** FINAL — All inputs received. Ready for execution.
> **Date:** 2026-02-13 (last revision applied)
> **Branch:** 2 (commit & push before overhaul)

---

## Table of Contents

1. [Context](#context)
2. [Agent Architecture](#agent-architecture-7-agents-3-phases)
3. [Agent 1: Schema Architect](#agent-1-schema-architect)
4. [Agent 2: Backend Engineer](#agent-2-backend-engineer)
5. [Compliance + Engineering Guardrails](#compliance--engineering-guardrails-non-negotiable)
6. [Scoring Engine: Hybrid Architecture](#scoring-engine-hybrid-architecture)
7. [Agent 3: Meta Ad Monitor Migration](#agent-3-meta-ad-monitor-migration)
8. [Agent 4: n8n Workflow Engineer](#agent-4-n8n-workflow-engineer)
9. [Agent 5: Frontend Engineer](#agent-5-frontend-engineer)
10. [Agent 6: DevOps & Custom Actor Engineer](#agent-6-devops--custom-actor-engineer)
11. [Agent 7: Skills & Domain Knowledge](#agent-7-skills--domain-knowledge)
12. [Apify Actor Registry (17 actors)](#complete-apify-actor-registry-17-actors)
13. [Scraper Hub UI Concept](#scraper-hub-ui-category-dropdown-concept)
14. [Filter Configuration Reference](#filter-configuration-reference)
15. [DiCloak Integration](#dicloak-integration)
16. [Risk Register & Mitigations](#risk-register--mitigations)
17. [Verification Plan](#verification-plan)
18. [Decisions Made](#decisions-made)
19. [Still Needed from Jake](#still-needed-from-jake)

---

## Context

Jake is building the **BOMB Ecom OS** - a DTC ad automation platform. Three strategy documents define the vision:

1. **"Building an Autonomous Signal Engine"** (Fogarty) - The WHAT: Apify scrapers feeding data into a scoring matrix to algorithmically evaluate product viability while you sleep.
2. **"data plan 1"** - The HOW: Database schema, API endpoints, n8n workflows, meta-ad-monitor merge, frontend charts, deployment.
3. **"data analytics.md"** - The SCORING ENGINE: A complete TypeScript + JSON config scoring system (100-point, config-driven, deterministic) that supersedes the original Fogarty 0-98 Vertex AI scoring approach.

### Current State
- **bom-ecom** (React 18 + Express 5 + PostgreSQL + Drizzle ORM) is the main app with 30+ pages, 16 DB tables
- **meta-ad-monitor** (Express + SQLite, 2,139 lines in server.js) is a standalone app with battle-tested Apify scraping + Gemini AI analysis
- **n8n** runs in Docker with 20+ workflows at localhost:5678
- **competitor-ads.tsx** is a 226-line skeleton with TODOs
- **Docker Compose** has 3 services: PostgreSQL 16, n8n, bom-ecom

### Goal
Merge everything into one platform, add the deterministic scoring engine + Vertex AI narrative layer, wire up 17 Apify data sources, build custom Kalodata + SimilarWeb actors, and build the dashboard that turns noise into signal.

### Key Technical References
- **Vertex AI Gemini endpoint:** `https://us-central1-aiplatform.googleapis.com/v1/projects/gen-lang-client-0234791928/locations/us-central1/publishers/google/models/{MODEL}:generateContent`
- **Vertex AI Claude endpoint:** `https://us-central1-aiplatform.googleapis.com/v1/projects/gen-lang-client-0234791928/locations/us-central1/publishers/anthropic/models/{MODEL}:rawPredict` (requires `"anthropic_version": "vertex-2023-10-16"`)
- **Response parsing:** Gemini = `$json.candidates[0].content.parts[0].text` | Claude = `$json.content[0].text`
- **n8n expression gotcha (CRITICAL):** In HTTP Request node jsonBody, the ENTIRE string must start with `=` to enable expression mode. Without it, `{{ }}` is sent as literal text.

---

## Agent Architecture: 7 Agents, 3 Phases

```
PRE-OVERHAUL -- Commit & push branch 2 (preserve baseline)

PHASE 0 -- Foundation (sequential)
  Agent 1: Schema Architect

PHASE 1 -- Core Build (parallel tracks)
  Agent 2: Backend Engineer ----------------+
  Agent 3: Meta Ad Monitor Merge -----------+  (all start after Agent 1)
  Agent 6: DevOps & Custom Actor Eng. ------+
  Agent 7: Skills & Domain Knowledge ----------- (no deps, parallel with all)

PHASE 2 -- Experience Layer (parallel, after Phase 1)
  Agent 4: n8n Workflow Engineer ---- (needs Agent 2 endpoints)
  Agent 5: Frontend Engineer -------- (needs Agents 2 + 3 APIs)
              +-- Scraper Hub (category dropdown UI)
              +-- Signal Engine dashboard
              +-- Competitor Ads page
```

**Critical path:** Agent 1 -> Agent 2 -> Agent 4 (Vertex scoring workflow) -> Agent 5 (Signal Engine + Scraper Hub)

### Task Summary

| Agent | Role | Task Count | Phase |
|-------|------|-----------|-------|
| 1 | Schema Architect | 13 | 0 (foundation) |
| 2 | Backend Engineer | 17 | 1 (parallel) |
| 3 | Meta Ad Monitor Merge | 21 | 1 (parallel) |
| 4 | n8n Workflow Engineer | 10 | 2 (after Agent 2) |
| 5 | Frontend Engineer | 6 groups (~30 subtasks) | 2 (after Agents 2+3) |
| 6 | DevOps & Custom Actors | 13 | 1 (parallel) |
| 7 | Skills & Domain Knowledge | 9 skills | 1 (parallel, no deps) |
| **Total** | | **~113 tasks** | |

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
   - `scoreTotal` (integer 0-100), `scoreStatus` (enum: candidate|enriching|validated|approved|test|watchlist|rejected)
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
3. Create `server/lib/vertex-narrative.ts` - Vertex AI client: (a) auto-estimate 6 manual scoring fields from enrichment data, (b) generate qualitative narrative (primary_angle, reasoning). Manual overrides always win.
4. `GET /api/scrape-sources` - List registered Apify actors
5. `POST /api/scrape-sources` - Register new actor with default config
6. `POST /api/scrape-sources/:id/run` - Trigger scrape (calls n8n webhook or Apify direct)
7. `GET /api/scrape-runs` - List recent runs with status/counts
8. `GET /api/scrape-runs/:id` - Single run detail + items
9. `POST /api/ingest/webhook` - Universal n8n callback for any scrape result (normalizes + stores in raw_scrape_data -> filtered_insights)
10. `POST /api/ingest/bulk` - Bulk import from Apify dataset
11. `GET /api/insights` - Query filtered insights (?source=&type=&dateFrom=&dateTo=&category=)
12. `GET /api/insights/time-series` - Time-series data for charts
13. `GET /api/rollups` - Weekly rollup summaries
14. `POST /api/rollups/generate` - Trigger rollup computation
15. `POST /api/product-candidates/:id/score` - Trigger deterministic scoring engine + Vertex AI narrative
16. `POST /api/product-candidates/score-batch` - Batch score all "evaluating" candidates
17. `GET /api/product-candidates/:id/score-breakdown` - Detailed score vectors

### Files
- `bom-ecom/server/routes.ts` (add route groups)
- `bom-ecom/server/lib/scrape-manager.ts` (new)
- `bom-ecom/server/lib/data-ingestion.ts` (new)
- `bom-ecom/server/lib/scoring-engine.ts` (new - TypeScript engine from data analytics.md, with 10 bug fixes + Validated/Durable filters added)
- `bom-ecom/server/lib/scoring-config.json` (new - JSON config from data analytics.md, 5-stage pipeline)
- `bom-ecom/server/lib/vertex-narrative.ts` (new - Vertex AI for auto-scoring manual fields + qualitative narrative)

---

## Compliance + Engineering Guardrails (Non-Negotiable)

> From data analytics.md final revision - these apply to ALL scraping and data operations.

### Access / Automation Guardrails
- Only automate access to KaLoData **in ways permitted by their ToS and account permissions**
- If a platform provides exports/API, use those first
- Auth artifacts (cookies/session tokens) stored in **secrets only** (`.env` / n8n credentials), never in DB
- **Never log** request headers/cookies
- Implement **rate limits + backoff** on all scrapers
- Detect auth failure (redirect/login page, 401/403) and **hard-stop** jobs (no hammering)

### Data Quality Guardrails
Every metric stored must have:
- `source` (kalodata / meta_ads / amazon / similarweb / manual / vertex_ai)
- `collected_at` timestamp
- `confidence` (0-1) — 1.0 for direct API data, 0.7-0.9 for scraped, 0.4-0.6 for LLM-estimated

Separate **raw** from **derived** metrics:
- Raw: revenue, orders, ad count, visits
- Derived: growth %, AOV, momentum score, saturation index

---

## Scoring Engine: Hybrid Architecture

### Primary Scoring: Deterministic TypeScript Engine (100-point)

The `data analytics.md` TypeScript engine REPLACES the original Fogarty 0-98 Vertex AI prompt for numeric scoring.

**Source file:** `data analytics.md` -> drop-in TypeScript + JSON config
**Location in app:** `bom-ecom/server/lib/scoring-engine.ts` + `bom-ecom/server/lib/scoring-config.json`

### 5-Stage Pipeline (UPDATED - was 3-stage, now 5)

**Stage A - Candidate Filter** (KaLoData 7d metrics → 200 products → keep 10-30):
- launchAgeDays <= 45
- revenue7d >= $10,000
- orders7d >= 80
- growth7dPct >= 20%
- AOV between $25 and $120
- **Optional quality gates** (if KaLoData provides):
  - `seller_count >= 3` (not one brand anomaly)
  - `top_seller_share <= 0.65` (avoids "one brand owns it" traps)
  - `price_volatility_low = true` (no weird discount spikes)

**Stage B - Enrichment** (Meta Ads + SimilarWeb + Amazon + COGS data added to each candidate)

**Stage C - Validated Filter** (KaLoData 30d metrics → 10-30 → keep 3-8):
- revenue_30d >= $50,000
- orders_30d >= 400
- growth_rev_30d_pct >= 10% OR weekly_revenue_stddev <= threshold (steady is fine)

**Stage D - Durable Filter** (KaLoData 90d metrics — use when available):
- Pass if ANY true:
  - revenue_90d >= $200,000
  - OR revenue_30d >= $100,000 AND launch_age_days >= 60

**Stage E - Hard Gates + Score + Decision** (3-8 → pick 1-2 to test):
- 8 hard gates (pass/fail): market size, pain signal, mechanism uniqueness, FB ad presence, website traffic, unit profit, shippable weight, improvement potential
- 100-point scoring across 20 weighted components (maxPoints verified = 100)
- Decision bands: 80-100=APPROVE, 65-79=TEST, 50-64=WATCHLIST, <50=REJECT
- Big-3 override: Even if score>=80, REJECT if Pain<14/20 OR Proof<30/45 OR Economics<10/15

### "Never Recommend" Auto-Reject List
Direct from Jake's playbook — auto-reject any product matching:
- Apparel, toys, electronics
- Low margin (unit profit < $20)
- Hard to ship (fragile, heavy, oversized)
- No-pain products (cosmetic/vanity only)
- Unvalidated items (no proof of sales)
- First-to-market inventions (no existing demand)
- Copyrighted brands (trademark/IP risk)

### 10 Bugs to Fix During Implementation

**Original 5:**
1. **Boolean coercion:** `=== true` fails for `"true"` or `1` from APIs → Fix: `(raw === true || raw === "true" || raw === 1)`
2. **Exclusion enforcement:** Config defines category/flag exclusions but no code checks them → Fix: Add exclusion checks to candidate filter
3. **Big-3 pass never evaluated:** Config defines Pain>=14/20, Proof>=30/45, Economics>=10/15 but code never checks → Fix: Implement bucket evaluation with component groupings
4. **Floating-point scores not rounded:** 79.9999 gets TEST instead of APPROVE → Fix: `Math.round()` final score
5. **`label` missing from JSON config:** Labels now present in revision config ✅ (FIXED)

**New 5 (found in code review):**
6. **NaN comparisons silently pass:** If a KaLoData field exists but is non-numeric (e.g., `"N/A"`), `Number("N/A")` = `NaN`, and `NaN < 10000` = `false` in JS — rejection never fires, product slips through → Fix: Add `isNaN()` guard after every `Number()` conversion in candidate filter
7. **`in` operator case-sensitive:** `market_allowed` gate checks `["health", "wellness", "fitness"]` but if source data says `"Health"`, `includes()` fails → Fix: `.toLowerCase()` both sides
8. **`eq` operator strict equality in gates:** `easy_to_ship` gate expects `true` (boolean) but APIs may return `"true"` or `1` → Fix: Same boolean coercion as bug #1, apply in `evalGate`
9. **Validated (30d) + Durable (90d) filters missing from code:** Document defines 5 stages but TypeScript only implements 2 (candidate + approved) → Fix: Add `passesValidatedFilter()` and `passesDurableFilter()` functions + config sections
10. **Candidate filter bypasses `getPath()`:** `passesCandidateFilters` accesses `product?.kalodata` directly instead of using `getPath(product, "kalodata.revenue7d")` → Fix: Use `getPath()` consistently for all field access

### Data Ingestion Priority Order
Build the ingestion layer in this order:
1. **KaLoData** (candidate pull — session cookie stored in `.env`)
2. **Meta Ads Library** (active ads + advertisers + creative refresh flag)
3. **SimilarWeb** (monthly visits — custom Apify actor)
4. **Amazon Reviews** (monthly units + review pain extraction)
5. **Economics** (AliExpress COGS + price + shipping)
6. **Manual/Vertex AI fields** (see below)

### Vertex AI Role: EXPANDED — Auto-Scorer + Narrative

The revision document explicitly states manual fields can be **"LLM-generated estimates"**. This is where Vertex AI transforms the engine from semi-manual to nearly autonomous.

**6 "manual" fields worth 40/100 points that Vertex AI can auto-estimate:**

| Field | Points | Vertex AI Input → Estimate |
|-------|--------|---------------------------|
| `painTotal20` | 20 | Amazon 1-star/3-star reviews → "How intense is the pain this product solves?" |
| `mechanismUniqueness5` | 5 | Product listing + competitor analysis → "How novel is the mechanism vs existing solutions?" |
| `improvePotential3` | 3 | Product reviews + market gaps → "Can this be meaningfully improved?" |
| `adaptPotential2` | 2 | Market breadth analysis → "Can this serve adjacent markets?" |
| `angleDensity5` | 5 | Competitor ad creative analysis → "How many distinct advertising angles exist?" |
| `offerExpandability5` | 5 | Product catalog + bundle potential → "Can the offer stack grow (bundles, upsells, subscriptions)?" |

**Vertex AI Workflow (per product):**
1. Collect all enrichment data (reviews, ads, traffic, COGS)
2. Send to Gemini 2.5 Pro via Vertex AI with structured scoring prompt
3. Gemini returns JSON: `{ painTotal20: 17, mechanismUniqueness5: 4, ... }` with `confidence: 0.6-0.8`
4. Store as `source: "vertex_ai"` with confidence scores
5. Jake can override any LLM estimate with manual scores (manual always wins)
6. **Additionally** generate qualitative outputs:
   - `primary_angle` — 1-sentence emotional hook based on review pain points
   - `reasoning` — 2-sentence qualitative assessment

**Vertex AI Endpoints (already working):**
- Gemini: `https://us-central1-aiplatform.googleapis.com/v1/projects/gen-lang-client-0234791928/locations/us-central1/publishers/google/models/gemini-2.5-pro:generateContent`
- Claude (backup): `https://us-central1-aiplatform.googleapis.com/v1/projects/gen-lang-client-0234791928/locations/us-central1/publishers/anthropic/models/claude-sonnet-4-5-20250929:rawPredict`

**Scoring hierarchy:** Manual override > Vertex AI estimate > Missing (score 0)

### Checklist Output Format (UI Schema)

Each product should display:

**Hard Gates** — 8 checkmarks (pass/fail):
- Market allowed ✓/✗
- Pain strong ✓/✗
- Unique mechanism ✓/✗
- Selling on FB ✓/✗
- SimilarWeb ≥150k ✓/✗
- Unit profit ≥$20 ✓/✗
- Easy to ship ✓/✗
- Improvement + adaptation ✓/✗

**Signal Metrics:**
- KaLoData: rev/orders/growth (7d/30d/90d)
- Meta: advertisers, active ads, creative refresh
- Amazon: est. monthly sales, rating, review count
- SimilarWeb: visits, top countries, channels
- Economics: price, COGS, profit, margin %, shipping cost estimate

**Outputs:**
- `score_total` (0-100)
- `big3_pass` (true/false)
- `status` (CANDIDATE | ENRICHING | VALIDATED | APPROVED | REJECT)
- `reasons[]` (human-readable reasons)
- `next_actions[]` (what to fetch next OR what to test)

---

## Agent 3: Meta Ad Monitor Migration

**Role:** Port 2,139 lines from standalone `meta-ad-monitor/server.js` into bom-ecom
**Depends on:** Agent 1 (ad vault tables must exist)
**Largest agent - split into sub-phases**

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
14. Port `transformApifyResults()` - **CRITICAL: 3-pass dedup** (adArchiveID -> media fingerprint -> headline). Must be ported exactly.
15. Port `processScrapedAds()` - Save to DB, track weekly_snapshots, increment weeks_in_top10, cleanup old non-bookmarked ads
16. Port `analyzeAdCreative()` - Gemini 2.5-pro 5-tag taxonomy (with image/video inline base64 support)
17. Port `runBatchAnalysis()` - Batch analyze up to 50 unanalyzed ads
18. Port `downloadCreativeImage()` - Local image caching (detect content-type, store in public/creatives/)
19. Port scheduled scraping with node-cron: `setupScheduledScrape()` + settings endpoints
20. Convert ALL SQLite raw queries to Drizzle ORM (better-sqlite3 -> drizzle-orm/pg)
21. Deprecate/remove `server/lib/competitor-airtable.ts` (Airtable competitor base no longer needed)

### Files
- `bom-ecom/server/lib/ad-vault.ts` (new - core logic)
- `bom-ecom/server/lib/ad-vault-routes.ts` (new - routes)
- `bom-ecom/server/routes.ts` (mount ad-vault routes)
- `meta-ad-monitor/server.js` (READ ONLY - source of truth for porting)
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
   - Polls for completion -> fetches dataset
   - Routes to platform-specific filter Code node
   - POSTs results to /api/ingest/webhook
   - **CRITICAL:** Use `=` prefix for entire jsonBody strings (per n8n expression gotcha)

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
   - Fetches dataset -> extracts estimated revenue, trend data
   - POST to /api/ingest/webhook with type: "kalodata_revenue"

5. **Create Vertex AI Scoring workflow** (`wf-vertex-ai-scoring.json`)
   - Webhook: POST /webhook/bomb-score-product
   - Bundles ALL collected data from PostgreSQL (reviews, ads, COGS, traffic)
   - **Pass 1:** Sends to Gemini 2.5 Pro → auto-estimates 6 manual fields (painTotal20, mechanismUniqueness5, etc.) as JSON with confidence scores
   - **Pass 2:** Generates qualitative narrative (primary_angle, reasoning)
   - POSTs both to /api/product-candidates/:id/score → deterministic engine runs final 100-point score

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
- `workflows/wf-kalodata-revenue.json` (new)
- `workflows/wf-meta-ad-library.json` (update callbacks)
- `workflows/wf-scrape-instagram.json` (update)
- `workflows/wf-scrape-tiktok.json` (update)
- `workflows/wf-scrape-ig-transcripts.json` (update)

---

## Agent 5: Frontend Engineer

**Role:** Complete competitor-ads page, build Signal Engine dashboard, build Scraper Hub, add charts
**Depends on:** Agents 2 + 3 (needs API endpoints)

### Tasks

#### 1. Complete competitor-ads.tsx (currently 226-line skeleton)
- Brand selector sidebar with stats (ad_count, evergreen_count, last_scraped)
- Full filter bar: media type, date range picker, all 5 AI tag dropdowns
- Ad grid with thumbnail images (stored_creative_url fallback to creative_url)
- Ad detail modal/sheet (full image, all copy, AI tags, weeks_in_top10, start_date, ad_library_link)
- Bookmark toggle on each card
- "Analyze" / "Batch Analyze" / "Scrape Brand" / "Scrape All" actions
- Evergreen view tab (weeks_in_top10 >= 4)
- Brand management dialog (add/delete)
- Schedule settings panel
- Switch from Airtable-backed `/api/meta-brands` -> PostgreSQL-backed `/api/ad-vault/brands`

#### 2. Create Signal Engine dashboard (signal-engine.tsx)
- Route: `/research/signal-engine`
- KPI cards: total scrape sources, active runs, total insights, avg product score
- Score display: 100-point score broken into component groups with color coding
- Decision band visualization (APPROVE/TEST/WATCHLIST/REJECT)
- "Score Product" button -> triggers deterministic scoring + Vertex AI narrative
- Score history timeline

#### 3. Build dashboard charts (using existing Recharts patterns)
- AreaChart: Scrape volume over time by platform
- PieChart: Insights by platform (Meta, TikTok, Instagram, Amazon)
- BarChart: Top scoring products (horizontal, color by score tier)
- LineChart: Product score trends over time
- DataTable: Raw insights with sorting/filtering/pagination

#### 4. Create shared filter-bar component (components/filter-bar.tsx)
- Date range picker (7d, 14d, 30d, 90d, custom)
- Platform multi-select
- Category filter
- Keyword search
- Export button

#### 5. Build Scraper Hub page (scraper-hub.tsx)
- Route: `/automations/scraper-hub`
- **Category dropdown**: Social, E-commerce, Research, Automation, Custom
- **Actor selector**: Filtered by category, shows actor name + description
- **Dynamic input form**: Renders fields from `scrapeSources.default_input` JSON schema (text inputs, dropdowns, number fields, toggles, URL lists)
- **Pre-configured defaults**: Each actor has smart filter defaults
- **"Run Scrape" button**: POST `/api/scrape-sources/:id/run` with form data
- **Recent runs panel**: Shows last 10 runs with status badge, item count, duration, cost
- **Run detail view**: Click a run to see raw data + filtered insights

#### 6. Navigation updates
- Add "Competitor Ads" to sidebar Research Pipeline group (with `Swords` icon)
- Add "Signal Engine" to sidebar Research Pipeline group (with `Radar` or `Target` icon)
- Add "Scraper Hub" to sidebar Automations group (with `Globe` or `Database` icon)
- Add routes in App.tsx + lazy imports

### Files
- `bom-ecom/client/src/pages/competitor-ads.tsx` (complete - currently 226 lines)
- `bom-ecom/client/src/pages/signal-engine.tsx` (new)
- `bom-ecom/client/src/pages/scraper-hub.tsx` (new - category dropdown UI)
- `bom-ecom/client/src/components/filter-bar.tsx` (new)
- `bom-ecom/client/src/components/score-display.tsx` (new - score visualization)
- `bom-ecom/client/src/components/scraper-input-form.tsx` (new - dynamic form from JSON schema)
- `bom-ecom/client/src/App.tsx` (add routes)
- `bom-ecom/client/src/components/app-sidebar.tsx` (add nav items)

### Patterns to Follow
- `product-research.tsx` (1,073 lines) - scoring UI, dialogs, queries
- `analytics-financial.tsx` - Recharts usage (LineChart, AreaChart, KPI cards)
- `competitor-ads.tsx` existing skeleton - React Query mutations pattern

---

## Agent 6: DevOps & Custom Actor Engineer

**Role:** Docker config, env vars, migration scripts, Apify actor registration, AND build the Kalodata + SimilarWeb custom actors
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

10. `KALODATA_SESSION_ID` already in `.env` ✅ — add `APIFY_PROXY_PASSWORD` to `.env` and ensure both are passed to n8n env vars in docker-compose.yml

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

## Agent 7: Skills & Domain Knowledge

**Role:** Create Claude Code skills encoding domain expertise for data, marketing, analytics, and ecommerce
**Depends on:** Nothing - runs in parallel with all agents
**Writes to:** `.claude/skills/` only (no app code)

### Data & Scraping Skills
1. `/scrape-config` - Generate optimal Apify actor input configs based on use case. Encodes filter best practices per actor (e.g., Kalodata needs specific revenue thresholds, Amazon Reviews should target 1-star + 3-star, AliExpress needs marketplace=US).
2. `/apify-run` - Trigger an Apify actor run with smart defaults, monitor status, fetch results.

### Marketing Skills
3. `/ad-family` - Already exists. The `ad-fam-architect.md` prompt is the system prompt (Motion Methodology: Learned Concept -> 3-asset Ad Family).
4. `/pain-extract` - Given Amazon review data, extract the top pain points and position product as the solution (Fogarty's "bleeding neck" signal).
5. `/creative-taxonomy` - Classify any ad creative using the 5-tag taxonomy (asset_type, visual_format, messaging_angle, hook_tactic, offer_type).

### Analytics Skills
6. `/score-product` - Run the deterministic 100-point scoring matrix on a product candidate with all available data.
7. `/trend-radar` - Analyze cross-platform trend signals (TikTok velocity, IG engagement, Amazon review sentiment) for a product/niche.

### E-commerce Skills
8. `/margin-calc` - Given AliExpress COGS + selling price, calculate margin, break-even ROAS, and target CPA.
9. `/competitor-teardown` - Given a brand name, pull all available data (ads, traffic, reviews) and generate a strategic assessment.

---

## Complete Apify Actor Registry (17 actors)

All actor IDs confirmed by Jake:

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

**Resolved unknowns:** `2APbAvDfNDOWXbkWf` = E-commerce Scraping Tool, `ZebkvH3nVOrafqr5T` = Amazon Reviews.
**Remaining unknowns (skip for now):** `BG3WDrGdteHgZgbPK`, `ZhSGsaq9MHRnWtStl`

---

## Scraper Hub UI (Category Dropdown Concept)

Jake's vision: A "Scraper Hub" page where users pick a **category** from a dropdown, then pick a **specific actor** within that category, configure its filters, and trigger it with a button.

**Why this matters:** Each actor has vastly different input parameters. Getting the filters right = signal. Wrong filters = wasted money.

**UI Flow:**
1. Category dropdown -> filters the actor list
2. Actor selector -> loads that actor's specific input form
3. Dynamic form fields rendered from `scrapeSources.default_input` JSON schema
4. "Run Scrape" button -> triggers `/api/scrape-sources/:id/run`
5. Recent runs panel -> shows status, item count, cost

Assigned to **Agent 5** (Frontend Engineer).

---

## Filter Configuration Reference

Each Apify actor has critical filter parameters. Wrong filters = noise. Right filters = signal.

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

## DiCloak Integration

Jake runs **DiCloak** anti-detect browser with Chrome kernels 120-143, local proxy config, and fingerprint management.

### Hybrid Approach for Kalodata
- **Session management**: Log into Kalodata in a DiCloak profile (persistent cookies, unique fingerprint)
- **Cookie export**: Extract session cookies from DiCloak -> store in n8n credentials
- **Cloud automation**: Apify actor receives cookies via input, runs scheduled scrapes in the cloud
- **Fallback**: If Apify cloud gets blocked, use Apify's local Playwright actor (`mdfTG3x6gXFlZD1oh`) to automate within DiCloak's browser context on Jake's machine

DiCloak provides better fingerprinting than Crawlee's built-in `useFingerprints` since it manages full browser profiles (canvas, WebGL, user-agent, timezone, screen resolution, WebRTC).

---

## Risk Register & Mitigations

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| 1 | **3-pass dedup logic** (Agent 3) | Lost/duplicate ads, corrupted data | Port `transformApifyResults()` exactly: adArchiveID dedup -> media URL dedup -> headline dedup -> keep top 10. Write integration tests. |
| 2 | **n8n expression mode** | API calls fail silently (literal `{{ }}` sent) | ALL jsonBody values must start with `=`. Code review checklist for every workflow. |
| 3 | **Vertex AI auto-scoring reliability** | LLM estimates for manual fields (40pts) could be inconsistent | Confidence scores stored with every estimate (0.4-0.6 for LLM). Jake can override any field manually. Deterministic engine handles all numeric scoring — Vertex AI is upstream input, not the scorer. |
| 4 | **Dual data transition** | Data lives in both Airtable and PostgreSQL | Run parallel for 1 week, validate parity, then flip `competitor-ads.tsx` from `/api/meta-brands` to `/api/ad-vault/brands`. Clean cutover. |
| 5 | **Frontend page size** | competitor-ads.tsx could grow to 1,000+ lines | Extract components early: FilterBar, AdCard, AdDetailSheet, BrandSidebar, EvergreenTab. Each < 200 lines. |

---

## Verification Plan

### End-to-End Test Flow
1. **Add brand** in competitor-ads UI -> verify saved in PostgreSQL `adVaultBrands`
2. **Trigger scrape** -> n8n Universal Orchestrator -> Apify actor -> callback to /api/ingest/webhook -> data in `rawScrapeData` + `adVault`
3. **AI analysis** -> Gemini 2.5-pro tags ad with 5-category taxonomy -> tags visible in UI
4. **Score product** -> Enter product candidate -> click "Score" -> deterministic engine computes 100-point score -> Vertex AI adds narrative -> score displayed with component breakdown
5. **Dashboard charts** -> Signal Engine page shows scrape volume, insight breakdown, score trends
6. **Scheduled scrape** -> Configure cron -> verify auto-scrape fires -> weekly_snapshots populated -> evergreen detection works

### Quick Smoke Tests
```bash
# Register an actor
curl -X POST http://localhost:5000/api/scrape-sources -H "Content-Type: application/json" -d '{"actor_id":"JJghSZmShuco4j9gJ","name":"Meta Ad Library","category":"social"}'

# Ingest test data
curl -X POST http://localhost:5000/api/ingest/webhook -H "Content-Type: application/json" -d '{"source":"meta","type":"ad_creative","data":[...]}'

# Query insights
curl http://localhost:5000/api/insights?source=meta

# Trigger scoring
curl -X POST http://localhost:5000/api/product-candidates/1/score

# Visit pages
# /research/signal-engine -> Charts render
# /research/competitor-ads -> Ad grid loads from PostgreSQL
# /automations/scraper-hub -> Category dropdown + actor forms render
```

---

## Pre-Overhaul Checklist

Before any agent work begins:
- [ ] Commit all current changes on branch `2`
- [ ] Push branch `2` to remote (preserve baseline)
- [ ] Verify Docker Compose starts cleanly
- [ ] Verify bom-ecom app loads at localhost:5000
- [ ] Verify n8n accessible at localhost:5678

---

## Decisions Made (from Jake)

1. **TikTok Apify actor confirmed:** GdWCkxBtKWOsKjdch
2. **Kalodata = MOST IMPORTANT custom actor** - Core requirement, session cookie injection approach
3. **Custom actors (Kalodata + SimilarWeb)** = Core requirement for Phase 1
4. **All 7 agents** run following the phased dependency order
5. **17 Apify actors identified** - Full registry above (resolved 2 of 4 unknowns)
6. **Category dropdown UI** for scraper management - users pick category -> actor -> configure filters -> trigger
7. **Skills needed** for data, marketing, analytics, ecommerce - encoding domain expertise into reusable Claude Code skills
8. **Filter configs are critical** - each actor needs optimized default parameters or it wastes money
9. **Commit & push branch 2** before starting the overhaul
10. **ad-fam-architect.md** is the system prompt for the existing `/ad-family` skill (Motion Methodology)
11. **Deterministic scoring engine** (from data analytics.md) replaces Fogarty 0-98 Vertex AI scoring for numeric scores
12. **Vertex AI EXPANDED role** — auto-estimates 6 "manual" fields (40/100 points) from enrichment data, PLUS generates qualitative narrative (primary_angle, reasoning). Manual overrides always win.
13. **10 bugs** in the data analytics.md scoring engine identified and will be fixed during implementation (5 original + 5 new from code review)
14. **5-stage pipeline** (was 3-stage) — Candidate (7d) → Enrichment → Validated (30d) → Durable (90d) → Hard Gates + Score
15. **Compliance guardrails** — auth secrets only, rate limits, data quality tracking (source + timestamp + confidence), raw/derived separation
16. **KaLoData session ID delivered** — stored in `.env`, ready for custom Apify actor
17. **Data analytics.md is the FINAL revision** — no more iterations on the scoring formula

---

## Still Needed from Jake

- ~~**Kalodata session_id cookie**~~ ✅ DELIVERED — stored in `.env` as `KALODATA_SESSION_ID`
- ~~**Kalodata-specific filter criteria**~~ ✅ DELIVERED — revenue thresholds, time windows (7d/30d/90d), AOV bands, quality gates all defined in data analytics.md final revision
- ~~**Any final iteration**~~ ✅ DELIVERED — data analytics.md is the "last revision" per Jake (2026-02-13)
- **All items resolved. Ready for execution.**
