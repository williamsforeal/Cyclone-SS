# Plan: Add TikTok Trending Product Scraping

## Context
The Cyclone-SS platform currently scrapes Meta Ad Library for DTC ad intelligence. The user wants to add TikTok Shop trending product discovery as the **first step** in their research pipeline:

**TikTok trends (NEW)** → **Meta ad validation (EXISTING)** → **Enter funnels (manual)**

This adds TikTok product scraping to the existing Express app (`server.js`) using Apify actors, following the same patterns already used for Meta ad scraping. Kalodata.com integration is deferred to a future phase (no public API available).

---

## Phase 1: Database Schema

Add to `initDatabase()` in `server.js`:

### New Tables

**`tiktok_products`** — Trending products discovered from TikTok Shop
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| product_id | TEXT UNIQUE | TikTok product ID |
| title | TEXT | Product name |
| description | TEXT | Product description |
| price | REAL | Current price |
| original_price | REAL | Before discount |
| currency | TEXT | USD, GBP, etc. |
| sold_count | TEXT | e.g. "15.2k sold" |
| sold_count_num | INTEGER | Parsed numeric sold count |
| rating | REAL | Star rating |
| review_count | INTEGER | Number of reviews |
| seller_name | TEXT | Shop/seller name |
| seller_url | TEXT | Seller page URL |
| product_url | TEXT | TikTok Shop product URL |
| image_url | TEXT | Original image URL |
| stored_image_url | TEXT | Local copy path |
| category | TEXT | Product category |
| search_keyword | TEXT | Keyword that found this product |
| region | TEXT | Country code (US, GB, etc.) |
| meta_brand_id | INTEGER | FK to brands table (cross-ref) |
| meta_validation_status | TEXT | pending/validated/no_match |
| notes | TEXT | User notes |
| bookmarked | INTEGER DEFAULT 0 | |
| first_seen | DATE | |
| last_seen | DATE | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

**`tiktok_scrape_jobs`** — Track TikTok scrape operations
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| job_type | TEXT | keyword_search, category_browse, trending |
| search_keyword | TEXT | What was searched |
| category | TEXT | Category filter |
| region | TEXT | Country code |
| status | TEXT | pending/running/complete/error |
| apify_run_id | TEXT | Apify job ID |
| input_params | TEXT | JSON of input sent |
| result_count | INTEGER DEFAULT 0 | |
| error_message | TEXT | |
| created_at | DATETIME | |
| completed_at | DATETIME | |

**`tiktok_searches`** — Saved search queries for re-running
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| name | TEXT | User-friendly name |
| keyword | TEXT | Search keyword |
| category | TEXT | Category filter |
| region | TEXT DEFAULT 'US' | |
| is_scheduled | INTEGER DEFAULT 0 | Auto-run weekly |
| last_run | DATETIME | |
| created_at | DATETIME | |

---

## Phase 2: Backend — New Functions in `server.js`

### Environment Variables
Add to `.env.example`:
```
TIKTOK_SCRAPER_ID=pratikdani/tiktok-shop-search-scraper
```
(Configurable actor ID — can swap to `novi/tiktok-shop-scraper`, `excavator/tiktok-shop-scraper`, etc.)

### New Functions (mirror existing Meta patterns)

1. **`startTikTokScrape(keyword, options)`** — Calls Apify actor
   - Builds input payload: `{ keyword, region, limit, sort }`
   - POSTs to `https://api.apify.com/v2/acts/${TIKTOK_SCRAPER_ID}/runs`
   - Creates `tiktok_scrape_jobs` record
   - Falls back to mock data if no `APIFY_TOKEN`
   - Pattern: mirrors `startAdLibraryScrape()`

2. **`transformTikTokResults(apifyResults, keyword)`** — Normalizes actor output
   - Maps varying field names (product_id/productId/id) for actor-swapping resilience
   - Parses sold_count strings ("15.2k" → 15200)
   - Deduplicates by product_id
   - Pattern: mirrors `transformApifyResults()`

3. **`processTikTokProducts(keyword, products)`** — Stores in DB
   - Upserts into `tiktok_products` table
   - Downloads product images locally (reuse `downloadCreativeImage()`)
   - Updates first_seen/last_seen tracking
   - Pattern: mirrors `processScrapedAds()`

4. **`getMockTikTokProducts(keyword)`** — Mock data fallback
   - Returns realistic sample products for demo mode
   - Pattern: mirrors `getMockAds()`

5. **`crossReferenceMeta(productTitle)`** — Links TikTok products to Meta brands
   - Searches `brands` table for matching brand names
   - Updates `meta_brand_id` and `meta_validation_status`
   - Enables the TikTok→Meta validation pipeline

---

## Phase 3: API Routes

### TikTok Products API
| Route | Method | Description |
|-------|--------|-------------|
| `/api/tiktok/products` | GET | List products (with filters: keyword, category, region, sort, bookmarked) |
| `/api/tiktok/products/:id` | GET | Single product detail |
| `/api/tiktok/products/:id/bookmark` | POST | Toggle bookmark |
| `/api/tiktok/products/:id/validate` | POST | Cross-reference with Meta brands |
| `/api/tiktok/products/:id/notes` | PUT | Add/edit notes |

### TikTok Scraping API
| Route | Method | Description |
|-------|--------|-------------|
| `/api/tiktok/scrape` | POST | Start a scrape (body: { keyword, category, region }) |
| `/api/tiktok/scrape/status/:jobId` | GET | Poll job status (mirrors existing pattern) |
| `/api/tiktok/scrape/results/:jobId` | GET | Get job results |

### TikTok Saved Searches API
| Route | Method | Description |
|-------|--------|-------------|
| `/api/tiktok/searches` | GET | List saved searches |
| `/api/tiktok/searches` | POST | Create saved search |
| `/api/tiktok/searches/:id` | DELETE | Delete saved search |
| `/api/tiktok/searches/:id/run` | POST | Re-run a saved search |

---

## Phase 4: UI Changes in `views/index.html`

### New Tab: "TikTok Products"
Add a tab alongside the existing Meta ads view:
- **Search bar** — keyword input + region dropdown (US, UK, DE) + category dropdown + "Search" button
- **Filter bar** — sort by: best sellers, newest, price; filter: bookmarked only, validated only
- **Product grid** — cards showing:
  - Product image (locally stored)
  - Title, price (with discount if applicable)
  - Sold count, rating
  - Seller name
  - Bookmark icon
  - "Validate on Meta" button (triggers cross-reference)
  - Meta validation badge (if linked to a brand)
- **Product detail modal** — full details, notes field, link to TikTok Shop, link to Meta brand if validated

### Saved Searches Sidebar
- List of saved keyword searches
- One-click re-run
- Toggle scheduled (weekly auto-run)

---

## Phase 5: Scheduled TikTok Scraping

Extend the existing `setupScheduledScrape()` pattern:
- Add `tiktok_schedule_enabled`, `tiktok_schedule_day`, `tiktok_schedule_hour` settings
- When triggered, iterate through all `tiktok_searches` where `is_scheduled = 1`
- Run each saved search via `startTikTokScrape()`
- Reuse existing cron pattern from `node-cron`

---

## Implementation Order

1. **Database tables + migrations** — Add 3 new tables to `initDatabase()`
2. **Environment variables** — Add `TIKTOK_SCRAPER_ID` to `.env.example` and `.env`
3. **Backend functions** — `startTikTokScrape`, `transformTikTokResults`, `processTikTokProducts`, mock data
4. **Core API routes** — scrape, status, products CRUD
5. **UI: TikTok tab** — search bar, product grid, product cards
6. **UI: Product detail modal** — full details view
7. **Saved searches** — API + UI for saving/re-running searches
8. **Cross-reference** — Meta validation logic + UI badges
9. **Scheduled scraping** — Settings + cron for TikTok searches

---

## Files Modified

| File | Changes |
|------|---------|
| `server.js` | DB schema, new functions, new API routes, scheduled scraping |
| `views/index.html` | New TikTok tab, product cards, search UI, detail modal |
| `.env.example` | Add `TIKTOK_SCRAPER_ID` |

---

## Future: Kalodata Integration (Phase 2)
Kalodata has no public API. Options for later:
- **Browser automation** via Apify custom actor (Puppeteer) that logs into kalodata.com
- **Manual CSV export** from Kalodata → import endpoint in the app
- **If Kalodata releases an API** → direct integration like current Apify flow

The TikTok Shop scrapers provide the same core data (trending products, sales volume, pricing) so this covers the immediate need.

---

## Verification
1. Start the app: `node server.js`
2. Navigate to TikTok Products tab
3. Search for a keyword (e.g., "posture corrector") — should return products (mock data without APIFY_TOKEN)
4. Bookmark a product, verify persistence on refresh
5. Click "Validate on Meta" — should search Meta brands for matches
6. Save a search, verify it appears in saved searches list
7. Test with real APIFY_TOKEN: verify Apify job polling and product storage
