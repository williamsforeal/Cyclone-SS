# Data Intelligence System: Apify Skills + Data Matrix

## Context
Jake wants to build a comprehensive scraping/intelligence system using 7 Apify actors. Instead of coding everything at once, we're creating **Claude Code skills** that agents can invoke to execute scrapes, ingest data, and run analysis. This is the foundation for turning raw web data into ecommerce, marketing, ad generation, and app-building insights.

---

## The 7 Apify Actors (Confirmed)

| # | Actor ID | Skill Name | Platform | Data Type |
|---|----------|-----------|----------|-----------|
| 1 | `DyNQEYDj9awfGQf9A` | `/scrape-google-trends` | Google Trends | Search interest, regional data, related queries |
| 2 | `if12dqi9gDL3GUpcq` | `/scrape-tiktok-search` | TikTok | Video search results, hashtags, engagement |
| 3 | `GdWCkxBtKWOsKjdch` | `/scrape-tiktok-profiles` | TikTok | Profile crawl, video metadata, media assets |
| 4 | `shu8hvrXbJbY3Eb9W` | `/scrape-instagram` | Instagram | Posts, profiles, hashtags, comments |
| 5 | `XtaWFhbtfxyzqrFmd` | `/scrape-meta-ads` | Meta Ad Library | Ad creatives, spend, transparency data |
| 6 | `20EMjYMYS9wVi5kCV` | `/scrape-shopify-apps` | Shopify | App metadata, ratings, reviews, pricing |
| 7 | `2APbAvDfNDOWXbkWf` | `/scrape-ecommerce` | Amazon/retail | Product data, pricing, reviews |

Plus existing actors already in n8n workflows:
- `JJghSZmShuco4j9gJ` — Meta Ad Library (in `wf-meta-ad-library.json`)
- `emQXBCL3xePZYgJyn` — TikTok Transcripts (in `wf-scrape-tiktok.json`)
- `3C7L8IMQOkq3isV2Y` — IG Transcripts (in `wf-scrape-ig-transcripts.json`)

---

## Phase 1: Create 10 Claude Code Skills

### Scraper Skills (7 skills — one per actor)

Each skill follows the same pattern:
1. Accept parameters (search terms, URLs, limits)
2. Call Apify API to start the actor run
3. Poll for completion
4. Fetch dataset results
5. Output structured data ready for downstream processing

**Skills to create in `.claude/skills/`:**

1. **`/scrape-google-trends`** — Run Google Trends scraper
   - Input: search terms, geo, timeRange, category
   - Output: interest over time, regional breakdown, related queries/topics

2. **`/scrape-tiktok-search`** — Search TikTok for keywords/hashtags
   - Input: searchQueries, maxResults, sortBy
   - Output: videos with engagement metrics, author data, audio info

3. **`/scrape-tiktok-profiles`** — Deep scrape TikTok profiles/hashtags
   - Input: profiles[], hashtags[], maxVideos
   - Output: full profile data, video metadata, media URLs

4. **`/scrape-instagram`** — Scrape Instagram content
   - Input: urls[], searchTerms, type (posts|profiles|hashtags|comments)
   - Output: posts with engagement, profile metadata, comment text

5. **`/scrape-meta-ads`** — Scrape Facebook/Meta Ad Library
   - Input: searchTerms, pageIds[], country, activeStatus
   - Output: ad creatives, spend ranges, run dates, advertiser info

6. **`/scrape-shopify-apps`** — Scrape Shopify App Store
   - Input: keywords[], maxResults
   - Output: app name, rating, reviews, pricing, features

7. **`/scrape-ecommerce`** — Scrape product data from retail sites
   - Input: urls[], keywords, site (amazon|walmart|etc)
   - Output: product details, pricing, reviews, seller info

### Utility Skills (3 skills)

8. **`/apify-run-status`** — Check status of any Apify run
   - Input: runId
   - Output: status, items count, cost, timing

9. **`/analyze-scrape-data`** — Run AI analysis on scraped data through the intelligence matrix
   - Input: dataType (trends|social|ads|products), rawData
   - Output: filtered insights, scores, actionable recommendations

10. **`/data-intelligence-report`** — Generate cross-platform intelligence report
    - Input: brandName, timeRange, dataSources[]
    - Output: comprehensive report with market position, competitor landscape, content gaps, ad opportunities

---

## Phase 2: The Data Intelligence Matrix

This is the "effective matrix" that turns raw scrape data into gold. Each data source feeds through a pipeline:

```
RAW DATA → CLEAN → CLASSIFY → SCORE → CROSS-REFERENCE → ACTIONABLE OUTPUT
```

### Matrix Dimensions

| Dimension | What It Measures | Fed By |
|-----------|-----------------|--------|
| **Market Demand** | Search interest, trending topics, growth velocity | Google Trends, TikTok Search |
| **Competitor Creative** | Ad formats, hooks, angles, visual styles | Meta Ad Library, Instagram |
| **Content Performance** | Engagement rates, virality signals, UGC patterns | TikTok, Instagram |
| **Product Landscape** | Pricing, features, reviews, market gaps | E-commerce Scraper, Shopify |
| **Voice of Customer** | Pain points, desires, language patterns, objections | Reviews, Comments, Transcripts |
| **Ad Intelligence** | Spend patterns, evergreen winners, seasonal trends | Meta Ad Library |

### Cross-Reference Rules

These are the high-value intersections:

1. **Trending Topic + Low Ad Competition** → Content opportunity (create ads around trending topic before competitors)
2. **High Engagement Post + Competitor Ad** → Clone opportunity (adapt winning organic content into paid format)
3. **Negative Reviews + Our Solution** → Ad angle generator (turn competitor complaints into PalmAura selling points)
4. **Rising Search Term + No Competitor Ads** → First-mover ad opportunity
5. **Evergreen Competitor Ad + Our Avatar Match** → Must-beat benchmark (study what makes it work)
6. **Viral TikTok Format + Product Fit** → UGC script template (adapt viral format for PalmAura)
7. **Shopify App Trend + Missing Feature** → App/feature opportunity for the platform

### Scoring System

Every scraped item gets scored on:
- **Relevance** (0-100): How closely does this relate to PalmAura's market?
- **Opportunity** (0-100): How actionable is this for ad creation or strategy?
- **Urgency** (0-100): Is this time-sensitive (trending) or evergreen?
- **Competitive Gap** (0-100): Are competitors missing this angle?

Items scoring 70+ across multiple dimensions get flagged as "gold nuggets."

---

## Phase 3: n8n Workflow Integration

Each skill maps to an n8n workflow that can be triggered from the UI:

| Skill | n8n Webhook | Output Destination |
|-------|------------|-------------------|
| `/scrape-google-trends` | POST /webhook/bomb-scrape-trends | trend_items table |
| `/scrape-tiktok-search` | POST /webhook/bomb-scrape-tiktok-search | trend_items table |
| `/scrape-tiktok-profiles` | POST /webhook/bomb-scrape-tiktok-profiles | competitor_intel table |
| `/scrape-instagram` | POST /webhook/bomb-scrape-instagram | competitor_intel table |
| `/scrape-meta-ads` | POST /webhook/bomb-scrape-meta-ads | ad_vault table |
| `/scrape-shopify-apps` | POST /webhook/bomb-scrape-shopify | product_research table |
| `/scrape-ecommerce` | POST /webhook/bomb-scrape-ecommerce | product_research table |

---

## Files to Create/Modify

### New Skills (`.claude/skills/`)
- `.claude/skills/scrape-google-trends.md`
- `.claude/skills/scrape-tiktok-search.md`
- `.claude/skills/scrape-tiktok-profiles.md`
- `.claude/skills/scrape-instagram.md`
- `.claude/skills/scrape-meta-ads.md`
- `.claude/skills/scrape-shopify-apps.md`
- `.claude/skills/scrape-ecommerce.md`
- `.claude/skills/apify-run-status.md`
- `.claude/skills/analyze-scrape-data.md`
- `.claude/skills/data-intelligence-report.md`

### Reference Docs
- `vertex-knowledge-base/data-intelligence-matrix.md` — The scoring/cross-reference system
- Update `MEMORY.md` with actor ID mapping

### n8n Workflows (later phase)
- 7 new workflow JSONs in `workflows/`

---

## Execution Order

1. **Create all 7 scraper skills** — these are the foundation, each agent can invoke them
2. **Create 3 utility skills** — analysis and reporting layer
3. **Write the data intelligence matrix doc** — the rules engine for scoring/cross-referencing
4. **Update memory** with actor IDs and skill mapping
5. **Build n8n workflows** that wire skills to the UI (Phase 3, later)

---

## Verification

- Each skill should be invocable via `/skill-name` in Claude Code
- Test one scraper skill end-to-end: `/scrape-google-trends` with "hand massager" query
- Verify Apify API calls work with the APIFY_TOKEN from `.env`
- Confirm dataset results parse into the expected output format
