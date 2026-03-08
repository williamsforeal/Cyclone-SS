# Plan: Apify Scrape Data Model Analysis

## Objective
Analyze and document the complete data model for Apify scrape results in the Cyclone-SS project, identifying:
- Fields from Reddit scraping
- Fields from Amazon review scraping
- Fields from KaloData
- Fields from SimilarWeb
- Product candidate data schema
- Scoring engine input requirements

## Status: PLAN MODE - Ready for Execution

## Phase 1: Read Core Schema Files (Sequential)
1. **Read bom-ecom/shared/schema.ts** - Full file
   - Goal: Extract product candidate data structures
   - Action: Read to understand base data model

2. **Read workflows/wf6-consumer-intel-scraper.json** - Full file
   - Goal: Identify what data is scraped from Apify
   - Action: Parse to find field mappings for each source

3. **Read workflows/wf7-consumer-intel-analyzer.json** - Full file
   - Goal: Understand data transformation logic
   - Action: Map fields through extraction pipeline

## Phase 2: Read Configuration and Implementation Files (Parallel)
1. **Read bom-ecom/server/lib/scoring-config.json** - Full file
   - Goal: Identify scoring engine input requirements

2. **Read bom-ecom/server/lib/scoring-engine.ts** - Full file
   - Goal: Understand how fields are used in scoring

3. **Read bom-ecom/server/lib/tiktok-scraper.ts** - Full file
   - Goal: Understand TikTok-specific data structures

4. **Read bom-ecom/server/lib/airtable.ts** - Full file (if needed)
   - Goal: Understand data storage/retrieval

## Phase 3: Search for BigQuery Schema
- Search for BigQuery scrape data DDL
- Check if scrape schemas exist or need to be created
- Note: transcript-ddl.sql exists but is for transcript data only

## Phase 4: Read Optional Gate Pipeline
- **Read workflows/wf-gate-pipeline.json** - Full file
  - Goal: Understand validation gate logic (if exists)

## Phase 5: Compile Final Report
- Document field names for each data source
- Create structured output showing:
  - Reddit scrape fields
  - Amazon review scrape fields
  - KaloData fields
  - SimilarWeb fields
  - Product candidate schema structure
  - Scoring engine input fields

## Files Located (via glob)
✓ bom-ecom/shared/schema.ts
✓ workflows/wf6-consumer-intel-scraper.json
✓ workflows/wf7-consumer-intel-analyzer.json
✓ workflows/wf-gate-pipeline.json
✓ bom-ecom/server/lib/scoring-config.json
✓ bom-ecom/server/lib/scoring-engine.ts
✓ bom-ecom/server/lib/tiktok-scraper.ts
✓ bom-ecom/server/lib/airtable.ts
✓ bom-ecom/server/lib/bedrock.ts
✓ bom-ecom/server/lib/competitor-airtable.ts
✓ bom-ecom/server/lib/notion.ts
✓ bom-ecom/server/lib/s3.ts
✓ bom-ecom/server/lib/vertex-narrative.ts
✓ docs/schemas/bigquery-transcript-ddl.sql (transcript data, not scrape data)

## Notes
- Using Read tool for file access (read-only)
- Using Grep if needed for searching within files
- No file modifications or edits required
- Pure analysis and documentation task
