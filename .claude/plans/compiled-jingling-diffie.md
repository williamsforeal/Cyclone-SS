# Masterplan: Research Intelligence Agent (Codex Agent)

## Context

The Bomb Ecom OS has a fully-built product research UI (`product-research.tsx`) but the data pipeline feeding it is disconnected. Jake has 3 Apify actors for scraping TikTok, Instagram, and IG Reels transcripts, plus existing n8n Cloud workflows for Meta ads competitor scraping and Reddit objection mining. The "codex agent" is a parallel autonomous Claude Code agent that will build out the full research data pipeline while Jake works on other parts of the app.

**The gap**: UI calls scraping webhooks → n8n fires but results never come back into the database → page shows empty data.

---

## Apify Actors in Scope

| Actor ID | Name | Use Case |
|---|---|---|
| `emQXBCL3xePZYgJyn` | TikTok Transcripts Scraper | Extract transcripts from viral TikTok videos for pain point/trend analysis |
| `shu8hvrXbJbY3Eb9W` | Instagram Scraper | Scrape competitor profiles, posts, hashtags, engagement |
| `3C7L8IMQOkq3isV2Y` | Instagram AI Transcript Extractor | Pull full AI transcripts from Reels with 30+ engagement metrics |

Plus existing n8n Cloud workflows for:
- Meta/Facebook Ads competitor scraping → Airtable
- Reddit scraping for objections/pain points

---

## Architecture

```
product-research.tsx
  ↓ POST /api/webhook/scrape/tiktok-trends (existing)
  ↓ POST /api/webhook/scrape/competitor-ads (existing)
Express (routes.ts)
  ↓ triggerN8nWebhook(path, payload)
n8n Workflows (NEW: 3 scraping workflows)
  ↓ Call Apify Actor via HTTP Request
  ↓ AI analysis (extract pain points, objections)
  ↓ POST /api/webhook/scrape-results  ← MISSING PIECE
Express (routes.ts) ← NEW endpoint
  ↓ Write to PostgreSQL (trendItems, competitorIntel)
React UI (react-query refetch)
  ↓ Displays populated data
```

---

## What the Codex Agent Builds

### Phase 1 — Backend: Scrape Results Webhook Handler
**File**: `bom-ecom/server/routes.ts`

Add `POST /api/webhook/scrape-results` endpoint:
```typescript
// Receives structured results from n8n after Apify scraping completes
// Routes by `type` field: "trend" | "competitor" | "transcript"
// Writes to PostgreSQL via Drizzle ORM
```

Expected payload from n8n:
```json
{
  "type": "trend",
  "platform": "tiktok" | "instagram" | "reddit",
  "items": [{ "title": "...", "url": "...", "notes": "..." }]
}
// or
{
  "type": "competitor",
  "candidateId": 123,
  "items": [{ "name": "...", "url": "...", "adCount": 5, "weaknesses": "..." }]
}
```

### Phase 2 — n8n: 3 New Scraping Workflows
**Location**: `workflows/` directory as JSON stubs, then imported to local n8n

**WF-Scrape-TikTok** (`/webhook/bomb-scrape-tiktok`):
1. Webhook Trigger (receives `{ videoUrls: [] }`)
2. HTTP Request → Apify actor `emQXBCL3xePZYgJyn` (sync run)
3. AI Extract node → summarize transcripts for pain points/objections
4. HTTP Request → POST `/api/webhook/scrape-results` (type: "trend", platform: "tiktok")

**WF-Scrape-Instagram** (`/webhook/bomb-scrape-instagram`):
1. Webhook Trigger (receives `{ handles: [], hashtags: [] }`)
2. HTTP Request → Apify actor `shu8hvrXbJbY3Eb9W`
3. Filter node → extract competitor posts with high engagement
4. HTTP Request → POST `/api/webhook/scrape-results` (type: "competitor")

**WF-Scrape-IGTranscripts** (`/webhook/bomb-scrape-ig-transcripts`):
1. Webhook Trigger (receives `{ reelUrls: [] }`)
2. HTTP Request → Apify actor `3C7L8IMQOkq3isV2Y`
3. AI Extract node → parse transcripts for pain points, objections, buying signals
4. HTTP Request → POST `/api/webhook/scrape-results` (type: "trend", platform: "instagram")

### Phase 3 — Frontend: Wire Up Data Display
**File**: `bom-ecom/client/src/pages/product-research.tsx`

The UI already has sections for trends and competitor intel. Needed:
- Ensure `GET /api/trend-items?platform=tiktok` is called and renders transcript summaries
- Ensure competitor panel shows auto-scraped data (not just manual entries)
- Add "Trigger Scrape" button states (loading/success/error feedback)

### Phase 4 — Export + Import Cloud Workflows (Meta Ads + Reddit)
Use `/export-cloud-workflow` skill to pull from `williamsforeal.app.n8n.cloud`:
- Meta/Facebook Ads competitor scraping workflow
- Reddit objections workflow
Then import to local n8n and update webhook URLs to point to local `/api/webhook/scrape-results`

---

## Critical Files to Modify

| File | Change |
|---|---|
| `bom-ecom/server/routes.ts` | Add `POST /api/webhook/scrape-results` handler |
| `bom-ecom/shared/schema.ts` | Verify trendItems/competitorIntel schema matches payload |
| `workflows/wf-scrape-tiktok.json` | New n8n workflow stub |
| `workflows/wf-scrape-instagram.json` | New n8n workflow stub |
| `workflows/wf-scrape-ig-transcripts.json` | New n8n workflow stub |
| `bom-ecom/client/src/pages/product-research.tsx` | UI wiring for trigger buttons + data display |

---

## Environment Variables Needed

```env
APIFY_API_TOKEN=your_token_here   # New — for n8n HTTP Requests to Apify
```

---

## Verification Plan

1. **Backend**: POST to `/api/webhook/scrape-results` with mock payload → confirm record appears in PostgreSQL
2. **n8n**: Run WF-Scrape-TikTok with 1 test URL → confirm Apify runs → confirm result POSTs back → confirm DB row created
3. **UI**: Open product-research.tsx → trigger scrape → confirm trend item appears in the table without page refresh
4. **End-to-end**: Add a product candidate → run competitor scrape → confirm competitor intel panel populates

---

## Codex Agent Execution Order

The parallel agent should work in this sequence:
1. Add `/api/webhook/scrape-results` endpoint (quick, unblocks everything)
2. Create the 3 n8n workflow JSON stubs
3. Wire UI trigger buttons to show loading/success states
4. Import workflows to local n8n and test end-to-end
5. Export + integrate cloud Meta/Reddit workflows
