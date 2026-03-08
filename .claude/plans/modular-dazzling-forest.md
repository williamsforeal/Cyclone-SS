# Bomb Ecom OS v4 — Signal Engine + Gated Research Pipeline

## Context

The Bomb Ecom OS has a working React frontend (`bom-ecom/`) with 30+ pages, a PostgreSQL schema with product candidates, scrape infrastructure, consumer intel, and Ad Vault tables, plus n8n running via Docker Compose. What's missing is the **end-to-end pipeline** that turns raw intelligence (transcripts, trend feeds) into scored, validated product decisions — and the UI wiring to trigger and display it all.

Jake has 3 zipped Replit projects to merge in (will upload). The priority pipeline is:

```
AI Com Transcripts → Extract Products → Filter (3 of 6 worth investigating → 1 to act on now)
    ↓
Survivors → KaloData scrape → AliExpress scrape → Amazon scrape
    ↓
Gate checks (criteria from playbook docs) → Score 0-100 → Decision (APPROVE/TEST/WATCHLIST/REJECT)
```

---

## Phase 1: Merge Replit Workflows (blocked on uploads)

**Goal**: Extract useful logic from 3 zipped Replit projects, discard Replit-specific boilerplate.

### Steps
1. Receive and unzip the 3 Replit projects
2. For each project, audit:
   - Business logic worth keeping (API routes, data transforms, scraper configs)
   - Schema definitions (compare against existing `shared/schema.ts`)
   - UI components (merge into existing pages or create new ones)
   - Replit-specific code to discard (`.replit`, `replit_integrations/`, Replit DB, etc.)
3. Merge logic into existing codebase:
   - Backend logic → `bom-ecom/server/routes.ts` or new `server/lib/*.ts` modules
   - Schema additions → `bom-ecom/shared/schema.ts`
   - UI → existing or new pages in `bom-ecom/client/src/pages/`
4. Remove duplicate/conflicting code

**Files to modify:**
- `bom-ecom/shared/schema.ts` (schema additions)
- `bom-ecom/server/routes.ts` (new API endpoints)
- `bom-ecom/server/lib/*.ts` (new service modules)
- `bom-ecom/client/src/App.tsx` (new routes if needed)

> **Status**: Blocked until Jake uploads the 3 zipped Replit projects.

---

## Phase 2: Gated Research Pipeline — Schemas & Backend

**Goal**: Build the data pipeline from transcript → product extraction → scrape validation → scoring.

### 2A: Transcript Product Extraction (Google Drive → Auto-Pipeline)

**Existing workflow**: `workflows/wf-gdrive-product-importer.json` — already reads from "AI Com Product Research" folder, extracts text, sends to Gemini, ingests product. Needs upgrades:

**Trigger change**: Replace webhook trigger with **n8n Google Drive Trigger node** (polls for new files in the folder). When a new file drops → pipeline runs automatically.

**Duplicate detection**: Add a Code node after "List Docs In Folder" that:
1. Fetches already-processed `docId`s from `transcript_products` table via `GET /api/transcripts/processed-ids`
2. Filters out any doc whose ID is already in the DB
3. Only processes new docs

**Multi-product extraction**: Change the Gemini prompt from extracting 1 product to extracting ALL products mentioned in the transcript. New prompt returns:
```json
{
  "products": [
    { "productName": "...", "mentionContext": "...", "assessment": "investigate|skip|watch", "reasoning": "...", "confidence": 0.85 },
    ...
  ],
  "summary": "6 products found, 3 worth investigating, 1 priority"
}
```

**Auto-filtering**: After Gemini extracts products, a Code node applies the filter:
- Products marked "investigate" → create as `product_candidates` with status "evaluating"
- Products marked "watch" → create as `transcript_products` only (not promoted yet)
- Products marked "skip" → create as `transcript_products` with status "skipped"
- The single "act now" product gets `status: "testing"` and auto-triggers Gate 1

**New table**: `transcript_products` (tracks every product mention from every transcript)

```
transcript_products:
  id, doc_id (Google Doc ID, unique constraint for dedup),
  doc_title, doc_url, product_name,
  mention_context (quote from transcript),
  extraction_confidence (0-1),
  assessment ("investigate" | "skip" | "watch"),
  reasoning (AI explanation),
  candidate_id (FK → product_candidates, nullable until promoted),
  created_at
```

**API endpoints**:
- `GET /api/transcripts/products` → list extracted products with filters
- `GET /api/transcripts/processed-ids` → return array of already-processed doc IDs (for dedup)
- `PATCH /api/transcripts/products/:id/promote` → manually promote a product to candidate
- `POST /api/transcripts/reprocess` → manually trigger re-scan of Drive folder (button in UI)

### 2B: Gated Validation Pipeline

Once a product is promoted to `product_candidates`, it enters the **gate pipeline**. Each gate is an n8n workflow triggered sequentially (only runs if previous gate passed).

**Gate 1 — KaloData (Trend Discovery)**
- Actor: KaloData custom scraper
- Checks: 30d revenue $10k-$90k, launched ≤30 days
- Stores: `kalodataData` jsonb on `product_candidates`
- Pass → Gate 2; Fail → status = "WATCHLIST" or "REJECT"

**Gate 2 — Amazon (Demand Proof)**
- Actor: Amazon product/reviews scraper
- Checks: 1,000+ monthly sales, multiple listings
- Stores: `amazonData` jsonb on `product_candidates`
- Also populates: `nichePainPoints`, `consumerPhrases` from reviews
- Pass → Gate 3

**Gate 3 — AliExpress/Supplier (Economics)**
- Actor: AliExpress scraper
- Checks: Margin ≥$20-$25, small/light/not fragile
- Stores: `economicsData` jsonb on `product_candidates`
- Pass → Gate 4

**Gate 4 — Meta Ads (Competitive Proof)**
- Uses existing Ad Vault scrape infrastructure
- Checks: Competitors running ads, 100+ active ads = strong signal
- Stores: `metaAdsData` jsonb on `product_candidates`
- Pass → Final Scoring

**New table**: `gate_results` (audit trail for each gate check)

```
gate_results:
  id, candidate_id (FK), gate_name ("kalodata"|"amazon"|"aliexpress"|"meta_ads"),
  gate_order (1-4), passed (boolean),
  raw_data (jsonb - what the scraper returned),
  criteria_checked (jsonb - { criterion: value, threshold: value, passed: bool }),
  error_message, run_id (FK → scrape_runs),
  created_at
```

**n8n workflow (WF-gate-pipeline)**:
- Trigger: Webhook POST `/webhook/bomb-validate-candidate`
- Input: `{ candidateId, startAtGate?: number }`
- Process: Runs gates sequentially, stops at first failure
- Output: Updates `product_candidates` with gate results + calls scoring engine

**API endpoints**:
- `POST /api/candidates/:id/validate` → triggers full gate pipeline
- `GET /api/candidates/:id/gates` → get gate results for a candidate
- `POST /api/candidates/:id/gate/:gateName` → trigger single gate manually

### 2C: Scoring Engine Updates

The scoring engine already exists at `bom-ecom/server/lib/scoring-engine.ts`. Updates needed:

- Wire gate results into the v2 scoring fields already on `product_candidates`
- Auto-compute category totals from gate data (painIntensityTotal, marketProofTotal, etc.)
- Set `decision` field based on score thresholds from docs:
  - ≥75 → APPROVE
  - 55-74 → TEST
  - 35-54 → WATCHLIST
  - <35 → REJECT
- Auto-kill (score = 0) for: branded/proprietary, commodity, high-return-risk, regulated

**Files to modify:**
- `bom-ecom/shared/schema.ts` — add `transcript_products`, `gate_results` tables
- `bom-ecom/server/routes.ts` — add transcript + gate API endpoints
- `bom-ecom/server/lib/scoring-engine.ts` — wire gate data into scoring
- `workflows/` — new WF JSON files for transcript extraction + gate pipeline

---

## Phase 3: UI Wiring — Buttons, Triggers, Metrics

**Goal**: Connect existing UI pages to the backend pipeline and display results.

### 3A: Product Research Page (`product-research.tsx`)

Current state: Has candidate list with manual scoring. Needs:
- "Scan Drive Folder" button → calls `POST /api/transcripts/reprocess` → triggers n8n to re-scan the Google Drive folder for new docs
- Status indicator showing last scan time + how many docs processed
- "Transcript Products" section showing extracted products from transcripts with assessment badges (investigate/watch/skip)
- "Promote to Candidate" button on each transcript product
- "Run Validation" button per candidate → calls `/api/candidates/:id/validate`
- Gate progress indicator (4 dots: green/red/gray for each gate)
- Auto-populated scores after validation completes

**Note**: The Google Drive trigger in n8n runs automatically on new file drops. The "Scan Drive Folder" button is a manual override for when you want to force a re-scan.

### 3B: Pipeline Page (`pipeline.tsx`)

Current state: Exists but needs to show the gated funnel. Add:
- Funnel visualization: Transcripts → Extracted → Gate 1 → Gate 2 → Gate 3 → Gate 4 → Scored
- Counts at each stage
- Click-through to see candidates at each stage

### 3C: Signal Engine Page (`signal-engine.tsx`)

Current state: Shows candidate scores + charts. Enhance:
- Real-time scoring dashboard with the 5 category radar chart
- Decision distribution pie chart (already partially built)
- "Top 3 reasons" + "Top 2 risks" per candidate (from `aiReasoning` field)
- Trend charts from gate data (KaloData revenue trend, Meta ad histogram)

### 3D: Scraper Hub Page (`scraper-hub.tsx`)

Current state: Shows scrape sources and runs. Already functional — just needs:
- Quick-action buttons to trigger gate scrapes for a specific candidate
- Status badges showing which gates have been run

### 3E: Overview Page (`overview.tsx`)

Add summary KPIs:
- Products in pipeline (by stage)
- Latest extraction results
- Top scored candidates

**Files to modify:**
- `bom-ecom/client/src/pages/product-research.tsx`
- `bom-ecom/client/src/pages/pipeline.tsx`
- `bom-ecom/client/src/pages/signal-engine.tsx`
- `bom-ecom/client/src/pages/scraper-hub.tsx`
- `bom-ecom/client/src/pages/overview.tsx`

---

## Build Order

1. **Schema first** — Add `transcript_products` + `gate_results` tables to `schema.ts`, run `db:push`
2. **API endpoints** — Add transcript extraction + gate pipeline routes to `routes.ts`
3. **n8n workflows** — Create WF-transcript-extract + WF-gate-pipeline JSON stubs
4. **Scoring engine** — Wire gate results into existing scoring logic
5. **UI wiring** — Add buttons/triggers to product-research, pipeline, signal-engine pages
6. **Replit merge** — Integrate 3 zipped projects as they arrive (can parallelize with steps 1-5)

---

## Verification

1. **Schema**: `docker compose exec bom-ecom npx drizzle-kit push` succeeds
2. **API**: `curl POST localhost:5000/api/transcripts/extract` with sample transcript returns extracted products
3. **Gate pipeline**: `curl POST localhost:5000/api/candidates/1/validate` runs through gates and updates scores
4. **UI**: Product Research page shows "Extract" and "Validate" buttons, pipeline page shows funnel
5. **n8n**: Workflows visible at localhost:5678, webhooks respond correctly
6. **End-to-end**: Paste transcript → see extracted products → click validate → watch gates run → see final score
