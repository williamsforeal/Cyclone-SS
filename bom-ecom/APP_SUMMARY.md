# THE BOMB ECOM OS — App Summary

## Purpose

A Marketing Operations Dashboard for DTC (Direct-to-Consumer) brands. Centralizes the full advertising lifecycle: product research → ad creation → creative management → campaign analytics → fulfillment ops. Built with a dark fintech aesthetic.

---

## Modules / Pages

| Page | Description |
|------|-------------|
| **Overview** | Home dashboard with KPIs, weather widget, and quick-nav |
| **Product Research** | Score and evaluate product candidates against 9 weighted criteria (viral traction, uniqueness, demand, etc.) with competitor tracking |
| **Ad Generator** | 3-step flow: select product + avatar → auto-recommendations → trigger n8n generation workflow |
| **Creative Lab** | Browse, filter, bulk-approve, and manage ad concepts and generated images |
| **Ad Concept Detail** | View/edit a single ad concept; inspect linked images and generation jobs |
| **Ad Clone** | Duplicate and remix winning ad concepts |
| **Winning Ads** | Gallery of ads marked as winners with performance notes and reuse guidance |
| **Campaigns** | Create and track ad campaigns with ROAS, CAC, CTR, CVR metrics |
| **Experiments** | A/B/C test management with variant results and winner tracking |
| **Avatars** | Define and manage customer avatar profiles used for targeting |
| **Angles** | Library of persuasion angles used in ad copy generation |
| **Hooks & Tags** | Hook pattern library and tagging system for creative assets |
| **Analytics — Financial** | Revenue, spend, and margin dashboards |
| **Analytics — Creative** | Creative performance metrics by concept, angle, and avatar |
| **Analytics — Product** | Product-level performance tracking |
| **Workflows** | n8n workflow management and monitoring |
| **Logs** | Execution log viewer for all automation jobs |
| **Orders** | Order queue and fulfillment tracking |
| **Inventory** | Inventory management interface |
| **Supplier Performance** | Track supplier speed and reliability |
| **Client Projects** | AI agency — manage client engagements |
| **Service Catalog** | Listing of agency services offered |
| **Templates** | S3-backed creative template library |
| **Case Studies** | Agency case studies library |
| **Support** | Support ticket management |
| **Settings** | App configuration |

---

## Backend Functions

### `server/routes.ts` — API Route Handlers

| Route | Description |
|-------|-------------|
| `GET /api/health` | Checks Airtable connection and verifies required tables/fields exist |
| `GET /api/airtable/products` | Fetches all products from Airtable |
| `GET /api/airtable/ad-concepts` | Fetches ad concepts with optional filters (avatar, angle, status, adType, awarenessLevel) |
| `GET /api/airtable/ad-concepts/:id` | Fetches a single ad concept by Airtable record ID |
| `PATCH /api/airtable/ad-concepts/:id` | Updates a single ad concept in Airtable |
| `PATCH /api/airtable/ad-concepts/bulk/update` | Bulk updates multiple ad concepts in Airtable |
| `GET /api/airtable/images` | Fetches all generated images from Airtable |
| `GET /api/airtable/images/:adCopyRecordId` | Fetches images linked to a specific ad concept |
| `GET /api/airtable/jobs` | Fetches automation jobs with optional status/type filters |
| `GET /api/airtable/jobs/:id` | Fetches a single job record |
| `GET /api/product-candidates` | Lists all product candidates ordered by total score |
| `GET /api/product-candidates/:id` | Fetches a single product candidate |
| `POST /api/product-candidates` | Creates a new product candidate; auto-calculates total score and margin |
| `PATCH /api/product-candidates/:id` | Updates a product candidate; recalculates score and margin |
| `DELETE /api/product-candidates/:id` | Deletes a candidate and all linked competitor intel and criteria checks |
| `GET /api/product-candidates/:id/competitors` | Lists competitor intel for a candidate |
| `POST /api/product-candidates/:id/competitors` | Adds a competitor entry to a candidate |
| `DELETE /api/competitors/:id` | Deletes a competitor intel entry |
| `GET /api/product-candidates/:id/criteria` | Gets winning-criteria checklist for a candidate |
| `POST /api/product-candidates/:id/criteria` | Upserts a criterion check (checked/unchecked + comment) |
| `GET /api/trend-items` | Lists trend items, optionally filtered by platform |
| `POST /api/trend-items` | Creates a trend item (platform: kalodata, instagram, reddit, x) |
| `PATCH /api/trend-items/:id` | Updates a trend item |
| `DELETE /api/trend-items/:id` | Deletes a trend item |
| `POST /api/scrape` | Dispatches a scrape job to n8n (Apify or Firecrawl source → competitor_ads / product_intel / trend_items / customer_reviews) |
| `POST /api/scrape/callback` | Webhook callback from n8n to mark a scrape job complete/failed |
| `GET /api/scrape/:jobId` | Polls the status of a scrape job |
| `POST /api/webhook/scrape/tiktok-trends` | Triggers n8n TikTok trends scrape workflow |
| `POST /api/webhook/scrape/competitor-ads` | Triggers n8n competitor ads scrape workflow |
| `POST /api/webhook/scrape/product-data` | Triggers n8n product data scrape workflow |
| `POST /api/webhook/concept/generate` | Triggers n8n ad concept generation for given concept IDs |
| `POST /api/webhook/assets/generate` | Triggers n8n image asset generation for given concept IDs |
| `POST /api/webhook/research/ingest` | Triggers n8n research ingestion for a product + competitors |
| `POST /api/webhook/metrics/ingest` | Triggers n8n metrics pull for a date range |
| `POST /api/webhook/campaign/launch` | Triggers n8n campaign launch workflow |
| `POST /api/webhook/generate` | Generic n8n generation trigger |
| `POST /api/upload` | Uploads a media file (image/video) to local disk; records metadata in DB |
| `GET /api/uploads` | Lists all uploaded media files |
| `DELETE /api/uploads/:id` | Deletes an uploaded media file from disk and DB |
| `GET /api/notion/status` | Checks Notion integration connectivity |
| `GET /api/notion/pages` | Searches Notion pages by query string |
| `GET /api/weather` | Returns current weather via Open-Meteo (no API key); 30-min server-side cache |
| `GET /api/s3/templates` | Lists template objects in S3 |
| `GET /api/s3/renders` | Lists render objects in S3 |
| `GET /api/s3/signed-url` | Generates a pre-signed S3 URL for a templates/ or renders/ key |
| `POST /api/s3/upload` | Uploads a file to S3 under templates/ or renders/ |
| `DELETE /api/s3/objects` | Deletes an object from S3 |

### `server/lib/airtable.ts` — Airtable Client

| Function | Description |
|----------|-------------|
| `fetchTable(tableId, params?)` | Single-page fetch from an Airtable table with optional filter/sort params |
| `fetchAllRecords(tableId, params?)` | Paginates through all records in a table (follows offset tokens) |
| `fetchRecord(tableId, recordId)` | Fetches a single Airtable record by ID |
| `createRecords(tableId, records[])` | Creates new records in an Airtable table |
| `updateRecord(tableId, recordId, fields)` | Patches a single Airtable record |
| `updateRecords(tableId, records[])` | Batch-patches multiple records in groups of 10 |
| `flattenRecords(records[])` | Maps Airtable `{id, fields}` records to flat objects with `recordId` |
| `flattenRecord(record)` | Same as above for a single record |
| `checkHealth()` | Verifies Airtable credentials and checks all required tables/fields exist |
| `rateLimitRetry(fn, maxRetries)` | Wraps any Airtable call with exponential-backoff retry on HTTP 429 |

### `server/services/n8n.ts` — Automation Engine

| Function | Description |
|----------|-------------|
| `triggerN8nWebhook(path, payload, headers?)` | POSTs a payload to an n8n webhook URL; returns `{ triggered, status }` |
| `dispatchScrape(args)` | Creates a job record in Postgres, fires the n8n scrape webhook (Apify or Firecrawl), returns `{ job_id, status }` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Wouter, shadcn/ui, TailwindCSS, React Query, Recharts |
| Backend | Node.js, Express 5, TypeScript (tsx) |
| Primary DB | Airtable (ad concepts, images, products, jobs) |
| Secondary DB | PostgreSQL via Drizzle ORM (product candidates, competitor intel, trend items, uploaded media) |
| Automation | n8n (self-hosted) via webhooks |
| Storage | AWS S3 / CloudFront (creative templates and renders) |
| AI / Scraping | Apify actors, Firecrawl, AWS Bedrock (image gen) |
| External APIs | Open-Meteo (weather), Notion |
