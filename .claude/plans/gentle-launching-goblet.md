# Plan: Product Scoring Engine + Apify MCP Server

## Context

Jake has a fully defined product scoring system from his ChatGPT-based research SOP — 100-point matrix, hard gates, KaLoData signal filters (7d/30d/90d), and a TypeScript scoring engine. This needs to become the decision brain inside the bom-ecom app, replacing the current "manual assessment" approach. Combined with the Apify MCP server, Claude can run scrapes, ingest data, and score candidates in real time.

Key inputs from ChatGPT conversation:
- **Hard gates** (8): market allowed, pain strong, unique mechanism, selling on FB, SimilarWeb ≥150k, unit profit ≥$20, easy to ship, improve+adapt
- **100-point components** (20): pain 20pts, KaLoData signals 20pts, Meta proof 15pts, Amazon 5pts, SimilarWeb 5pts, economics 15pts, creative/offer 10pts, mechanism/improvement 10pts
- **Decision bands**: APPROVE ≥80, TEST ≥65, WATCHLIST ≥50, REJECT <50
- **KaLoData candidate filters**: revenue7d ≥$10k, orders7d ≥80, growth7d ≥+20%, AOV $25–$120, launchAge ≤45 days
- **3 blind spots** identified: emotional intensity score, creative angle density, offer expandability — all included in the 100-pt matrix

Original problem: actors ran (Meta ran twice) but no UI to see results. Data IS landing in `rawScrapeData` table — just needs a window and the scoring engine to make decisions from it.

---

## What gets built

### 1. Scoring engine — `bom-ecom/shared/scoring-engine.ts` (NEW)

TypeScript engine (from ChatGPT conversation):
- `passesCandidateFilters(product, config)` → PASS | REJECT | NEEDS_ENRICHMENT
- `evaluateHardGates(product, config)` → PASS | REJECT | NEEDS_ENRICHMENT
- `scoreProduct(product, config)` → `{ score, decision, breakdown }`
- `evaluateProduct(product, config)` → single entry point used by API route

Decision bands: APPROVE ≥80, TEST ≥65, WATCHLIST ≥50, REJECT <50

### 2. Scoring config — `bom-ecom/shared/scoring-config.json` (NEW)

Full JSON config as specified in ChatGPT output:
- `marketsAllowed`: health, wellness, fitness
- `exclusions.categories`: apparel, toys, electronics
- `stages.candidate.kalodataFilters`: revenue7dMin:10000, orders7dMin:80, growthMin:20%, AOV $25–$120, launchAge ≤45d
- `stages.approved.hardGates`: 8 gates (Amazon gate: `amazonData.qualifyingListings >= 1`)
- `scoring.components`: 20 components summing to 100 pts

**Amazon hard gate (updated):** `amazonData.qualifyingListings >= 1` — at least 1 competitor listing with 1000+ estimated monthly units AND same pain point keyword match.

### 3. Schema changes — `bom-ecom/shared/schema.ts`

Add to `productCandidates` table (existing: `kalodataData`, `economicsData` already present):
```typescript
metaAdsData:    jsonb  // { activeAdsTotal, advertisersCount, hasNewCreatives14d }
amazonData:     jsonb  // {
                //   listings: [{ asin, title, price, rating, reviewCount, monthlyUnitEst, bsr, url }],
                //   qualifyingListings: number,   // count with monthlyUnitEst >= 1000
                //   topListingMonthlyUnits: number // max across listings (used for score)
                // }
similarwebData: jsonb  // { monthlyVisits }
shippingData:   jsonb  // { easyToShip, weightLbs }
manualScores:   jsonb  // { painTotal20, mechanismUniqueness5, improvePotential3, adaptPotential2, angleDensity5, offerExpandability5 }
scoreTotal:     integer
scoreDecision:  text   // APPROVE | TEST | WATCHLIST | REJECT | null
scoreBreakdown: jsonb  // array of { id, label, points, maxPoints, missing }
```
After schema change → run `npx drizzle-kit push`

### 4. Express routes — `bom-ecom/server/routes.ts`

```
POST  /api/candidates/:id/score         — run scoring engine, persist result
GET   /api/candidates/:id/score         — return current score + breakdown
PATCH /api/candidates/:id/manual-scores — save manual score fields
GET   /api/scrape-runs                  — list all runs (for MCP + Data Viewer)
GET   /api/scrape-runs/:id/data         — paginated rawScrapeData items
```

### 5. Product Research UI — `bom-ecom/client/src/pages/product-research.tsx`

Score panel on each candidate card:
- 100-pt score badge (color: green ≥80, yellow ≥65, orange ≥50, red <50)
- Decision chip: APPROVE / TEST / WATCHLIST / REJECT
- Expandable: 8 hard gates checklist (✅/❌/⚠️ missing) + 20-component score bars
- Manual scores input panel (6 sliders/inputs for pain, mechanism, angles, etc.)
- "Re-score" button → POST /api/candidates/:id/score

### 6. Python MCP Server — `scripts/mcp-servers/apify_server.py` (NEW)

FastMCP, stdio transport. 9 tools:

| Tool | What it does |
|------|-------------|
| `list_registered_actors()` | GET `/api/scrape-sources` |
| `get_recent_runs(limit)` | GET `/api/scrape-runs` |
| `get_run_data(run_id, limit)` | GET `/api/scrape-runs/{id}/data` |
| `run_actor(source_id, input_overrides)` | POST `/api/scrape-sources/{id}/run` |
| `run_actor_direct(actor_id, input_data)` | Direct Apify API call |
| `poll_run(apify_run_id)` | GET Apify run status |
| `fetch_dataset(dataset_id, limit)` | GET Apify dataset items |
| `score_candidate(candidate_id)` | POST `/api/candidates/{id}/score` |
| `get_candidate_score(candidate_id)` | GET score breakdown |

**`scripts/mcp-servers/requirements-apify.txt`**: `mcp[cli]>=1.0.0`, `httpx>=0.27.0`

### 7. `C:\Users\Jake\.claude\mcp.json`

Add:
```json
"apify": {
  "command": "python",
  "args": ["C:\\1. Business\\williamsforeal LLC\\repositories\\Cyclone-SS\\scripts\\mcp-servers\\apify_server.py"],
  "env": {
    "APIFY_TOKEN": "${APIFY_TOKEN}",
    "BOM_ECOM_URL": "http://localhost:5000"
  }
}
```

---

## Files modified

| File | Change |
|------|--------|
| `bom-ecom/shared/scoring-engine.ts` | NEW — 100-pt scoring engine |
| `bom-ecom/shared/scoring-config.json` | NEW — gates + thresholds + components |
| `bom-ecom/shared/schema.ts` | Add 8 columns to productCandidates (incl. expanded amazonData) |
| `bom-ecom/server/routes.ts` | Add 5 routes |
| `bom-ecom/client/src/pages/product-research.tsx` | Add score panel to product cards |
| `scripts/mcp-servers/apify_server.py` | NEW — FastMCP server |
| `scripts/mcp-servers/requirements-apify.txt` | NEW |
| `scripts/apify-actors/kalodata-scraper/` | NEW — Playwright actor source (session auth) |
| `C:\Users\Jake\.claude\mcp.json` | Add apify entry |

---

## KaLoData actor — Playwright-based (session auth)

**Reference:** https://docs.apify.com/academy/puppeteer-playwright

KaLoData uses session-based auth (no public API). The actor must use Playwright to authenticate as Jake's logged-in session.

**Actor location:** `scripts/apify-actors/kalodata-scraper/` (Apify actor source, deployed to Apify platform)

**Auth approach:**
- `KALODATA_SESSION_ID` env var (already in `.env`: `YzQ1N2M1MjQtNWJiYi00ZjRiLWE1OTYtYjExY2ViNTdlM2E4`)
- Actor sets cookie `session_id=<value>` on `kalodata.com` domain before navigating
- Session invalid detector: if page redirects to `/login` or returns 401/403 → hard-stop job, surface error

**Playwright pattern (from Apify docs):**
```javascript
import { Actor } from 'apify';
import { chromium } from 'playwright';

await Actor.init();
const { keyword, sessionId, maxItems } = await Actor.getInput();

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
await context.addCookies([{ name: 'session_id', value: sessionId, domain: 'kalodata.com', path: '/' }]);

const page = await context.newPage();
await page.goto(`https://www.kalodata.com/product?keyword=${encodeURIComponent(keyword)}`);

// Detect session invalid
if (page.url().includes('/login')) {
  throw new Error('KaLoData session expired. Re-export session_id cookie.');
}

// Human-like: wait for network idle, random delays between items
await page.waitForLoadState('networkidle');
// ... extract product rows: revenue7d, orders7d, growth, launchAgeDays, AOV
```

**Extracted fields per product:**
- `revenue7d`, `revenue30d`, `orders7d`, `orders30d`, `growthRev7dPct`, `launchAgeDays`, `aov`

**Rate limiting:** 1.5–3s random delay between pages, max 3 retries on timeout.

---

## Amazon enrichment actor

**Apify actor:** `apify/amazon-bestsellers-scraper` or `junglee/amazon-crawler`

**Input:** pain point keyword (e.g., "posture corrector back brace")

**Goal:** Find 2–3 competitor listings solving the same pain with 1000+ estimated monthly units.

**Monthly unit estimation:** BSR → monthly units lookup table (standard DTC method):
- BSR 1–100: ~15,000+/mo
- BSR 100–500: ~5,000–15,000/mo
- BSR 500–2,000: ~1,000–5,000/mo
- BSR 2,000–5,000: ~500–1,000/mo

**Output stored in `amazonData`:**
```json
{
  "listings": [
    { "asin": "B0...", "title": "...", "price": 29.99, "rating": 4.5, "reviewCount": 2847, "monthlyUnitEst": 1200, "bsr": 1234, "url": "..." }
  ],
  "qualifyingListings": 3,
  "topListingMonthlyUnits": 3400
}
```

**Scoring:** `amazon_sales` component uses `topListingMonthlyUnits` (linear, min:300 → max:2000, 5pts). Hard gate: `qualifyingListings >= 1`.

---

## Enrichment pipeline order (SOP)

**Correct sequence (cheapest/fastest gates first):**

1. **Google Drive import** → creates productCandidates (CANDIDATE status)
2. **KaLoData** (Playwright) → fills `kalodataData` → candidate filter runs → REJECT fast if below thresholds
3. **AliExpress** → fills `economicsData` (COGS/price/profit margin) → economics gate
4. **Facebook Ads** → fills `metaAdsData` (activeAdsTotal, advertisersCount) → proof gate
5. **Amazon** → fills `amazonData` (2–3 listings, 1000+ monthly units) → market proof gate
6. **SimilarWeb** (via Apify or SerpAPI) → fills `similarwebData` (monthlyVisits) → demand gate
7. **Manual scores** (product card in UI) → `manualScores` (pain 0–20, mechanism, angles, offer)
8. **Re-score** → POST /api/candidates/:id/score → persists APPROVE/TEST/WATCHLIST/REJECT
9. **MCP** → Claude can run any step above, poll runs, score candidates directly

---

## Verification

1. `pip install mcp httpx`, restart Claude Code
2. Ask Claude: "List my registered Apify actors" → returns scrapeSources
3. Create a test candidate with known values → `POST /api/candidates/1/score` → verify expected score
4. UI: product card shows 100-pt breakdown + decision badge
5. Manual scores input → re-score → score changes correctly

# Previous Plan: Google Drive → AliExpress Product Research Pipeline

## Context

Jake has a Google Drive folder called "AI Com Product Research" containing Google Docs — each is a product discussion summary with a rough rank. The goal is to pull those docs, extract structured product data via AI, create product candidates in the DB, then scrape AliExpress for COGS/pricing on each one. SerpAPI gets wired in for search demand scoring.

The Google OAuth credentials in `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) use n8n's redirect URI (`localhost:5678/rest/oauth2-credential/callback`), so Google Drive/Docs reading is done via n8n nodes — NOT a new OAuth flow in Express.

---

## What gets built

1. **Seed script** — registers AliExpress actor in `scrape_sources` table
2. **`POST /api/ingest/product-from-doc`** — Express route that receives AI-extracted product data, creates a `productCandidate` record, and triggers AliExpress scrape
3. **n8n workflow: `wf-gdrive-product-importer.json`** — reads Drive folder, extracts product info via Gemini, calls Express
4. **`POST /api/scrape-sources/:id/run`** already exists — AliExpress scrape goes through this
5. **SerpAPI wired into `SERP_API_KEY` env** — passed to bom-ecom container, called from scoring route

---

## Step 1: Register AliExpress actor in scrape_sources

**Via `POST /api/scrape-sources`** (call this after deploy — one-time seed):
```json
{
  "actorId": "hDVdezxZja9dcf9dY",
  "name": "AliExpress Product Search",
  "platform": "aliexpress",
  "category": "ecommerce",
  "defaultInput": {
    "keyword": "",
    "maxItems": 20,
    "sortBy": "orders"
  }
}
```

---

## Step 2: Add SERP_API_KEY to docker-compose bom-ecom env

**File:** `docker-compose.yml` (bom-ecom environment block, after GEMINI_API_KEY line)
```yaml
# SerpAPI (Google Search / Shopping / Trends)
- SERP_API_KEY=${SERP_API_KEY}
```

---

## Step 3: New Express route — `POST /api/ingest/product-from-doc`

**File:** `bom-ecom/server/routes.ts` — add after the existing `/api/ingest/scrape-results` endpoint

Receives:
```json
{
  "productName": "Posture Corrector Brace",
  "description": "Wearable back support for desk workers...",
  "keywords": ["posture corrector", "back brace", "ergonomic support"],
  "rankInFolder": 2,
  "sourceDocTitle": "Posture Corrector Discussion",
  "sourceDocUrl": "https://docs.google.com/...",
  "aliexpressKeyword": "posture corrector back brace"
}
```

Actions:
1. Upsert into `productCandidates` (match on `productName`, update if exists)
2. Trigger AliExpress scrape: look up the AliExpress source from `scrapeSources`, call `POST /api/scrape-sources/:id/run` internally with `inputOverrides: { keyword: aliexpressKeyword }`
3. Optionally call SerpAPI for search volume: `GET https://serpapi.com/search?engine=google&q={keyword}&api_key={SERP_API_KEY}`
4. Store SerpAPI result in candidate's `kalodata_data` jsonb (reuse existing column for now)
5. Return `{ candidateId, scrapeRunId, searchVolume }`

---

## Step 4: n8n workflow — `wf-gdrive-product-importer.json`

**File:** `workflows/wf-gdrive-product-importer.json` — new workflow

Webhook trigger: `POST /webhook/bomb-import-from-drive`

Nodes:
1. **Webhook** — trigger point
2. **Google Drive: List Files** — list all files in folder name = "AI Com Product Research", mimeType = `application/vnd.google-apps.document`
3. **Split In Batches** — process one doc at a time
4. **Google Docs: Get Document** — read the doc content (body text)
5. **HTTP Request → Vertex AI Gemini** — extract structured product data:
   - Prompt: *"Extract from this product research document: productName (string), description (2-3 sentences), keywords (array of 3-5 search terms), aliexpressKeyword (best AliExpress search term), rankSignal (1-10 based on how positively the doc discusses the product). Return JSON only."*
   - Model: `gemini-2.0-flash-001`
   - Endpoint: Vertex AI Gemini endpoint (from MEMORY.md)
   - **CRITICAL**: jsonBody must start with `=` for n8n expression mode
6. **Code node** — parse Gemini JSON response, add `sourceDocTitle` and `sourceDocUrl` from Drive metadata
7. **HTTP Request → Express** — `POST http://host.docker.internal:5000/api/ingest/product-from-doc`
8. **Wait 2s** — rate limit between docs

---

## Step 5: SerpAPI search demand call

Inside the `POST /api/ingest/product-from-doc` route, after creating the candidate:

```typescript
const SERP_API_KEY = process.env.SERP_API_KEY || "";
if (SERP_API_KEY && keywords.length > 0) {
  const serpRes = await fetch(
    `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(keywords[0])}&api_key=${SERP_API_KEY}&num=5`
  );
  const serpData = await serpRes.json();
  // Store organic_results count + top results as search demand signal
  const searchDemand = {
    query: keywords[0],
    organic_count: serpData.organic_results?.length ?? 0,
    top_results: serpData.organic_results?.slice(0, 3).map((r: any) => ({
      title: r.title, link: r.link
    })) ?? []
  };
  // Update candidate with search demand data
  await db.update(productCandidates)
    .set({ kaloadataData: searchDemand })  // reuse jsonb column
    .where(eq(productCandidates.id, candidate.id));
}
```

---

---

## Step 6: Pipeline Dashboard UI — Research Pipeline page

Add a dedicated panel to the **Product Research page** (or a new `/research/pipeline` route) with trigger buttons for each workflow. UI sections:

### "Run Pipeline" panel
Four trigger buttons, each fires a POST to the n8n webhook and shows live status:

| Button | Webhook | Description |
|--------|---------|-------------|
| **Import from Google Drive** | `POST /webhook/bomb-import-from-drive` | Reads all docs in "AI Com Product Research", creates candidates |
| **Scrape AliExpress** | `POST /api/scrape-sources/{aliexpressId}/run` | Scrapes COGS for all candidates missing aliexpress data |
| **Run Consumer Intel** | `POST /webhook/bomb-consumer-intel-scrape` | Reddit + Amazon pain point extraction |
| **Generate Creative** | `POST /webhook/bomb-creative-generate` | Taglines, hooks, PAS frameworks |

Each button:
- Shows spinner while running
- Turns green with item count on success
- Shows error toast on failure

### "Recent Jobs" panel (below buttons)
Auto-refreshing list (5s poll) showing:
- Job type + status badge (pending/running/complete/failed)
- Started time + duration
- Items processed count

**Implementation:** Add a `PipelineDashboard` component to `product-research.tsx` OR create a new `bom-ecom/client/src/pages/pipeline.tsx` page with route `/research/pipeline`.

**New Express route needed:** `POST /api/pipeline/trigger` — proxies to n8n webhook URL:
```typescript
app.post("/api/pipeline/trigger", async (req, res) => {
  const { workflow } = req.body; // "import-drive" | "aliexpress" | "consumer-intel" | "creative"
  const webhookMap: Record<string, string> = {
    "import-drive": `${N8N_WEBHOOK_URL}/bomb-import-from-drive`,
    "consumer-intel": `${N8N_WEBHOOK_URL}/bomb-consumer-intel-scrape`,
    "creative": `${N8N_WEBHOOK_URL}/bomb-creative-generate`,
  };
  // AliExpress goes directly to scrape API
  if (workflow === "aliexpress") {
    // find aliexpress source, trigger run
  }
  // ... proxy request, return job ID
});
```

---

## Files Modified

| File | Change |
|------|--------|
| `docker-compose.yml` | Add `SERP_API_KEY` to bom-ecom env |
| `bom-ecom/server/routes.ts` | Add `POST /api/ingest/product-from-doc` + `POST /api/pipeline/trigger` routes |
| `workflows/wf-gdrive-product-importer.json` | New n8n workflow |
| `bom-ecom/client/src/pages/pipeline.tsx` | NEW — Pipeline Dashboard with trigger buttons + recent jobs |
| `bom-ecom/client/src/App.tsx` | Add `/research/pipeline` route |

## One-time setup after deploy

1. Rebuild: `docker compose up -d --build bom-ecom`
2. Register AliExpress actor:
   ```bash
   curl -X POST http://localhost:5000/api/scrape-sources \
     -H "Content-Type: application/json" \
     -d '{"actorId":"hDVdezxZja9dcf9dY","name":"AliExpress Product Search","platform":"aliexpress","category":"ecommerce","defaultInput":{"keyword":"","maxItems":20,"sortBy":"orders"}}'
   ```
3. In n8n: add Google OAuth2 credential using the existing CLIENT_ID/SECRET
4. Import `wf-gdrive-product-importer.json` into n8n
5. Trigger: `POST http://localhost:5678/webhook/bomb-import-from-drive`

## Verification

1. Trigger webhook → n8n lists Drive folder → finds docs
2. Gemini extracts product name + keywords from each doc
3. `POST /api/ingest/product-from-doc` creates candidate records in DB
4. AliExpress scrape job fires for each candidate
5. SerpAPI search demand stored on candidate
6. Product Research page shows new candidates with COGS from AliExpress
