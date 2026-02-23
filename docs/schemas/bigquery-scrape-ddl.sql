-- =============================================================================
-- BigQuery DDL: Apify Scrape Data Tables
-- Dataset: bomb_ecom (shared with transcript tables)
-- =============================================================================
-- These tables store structured data extracted from Apify scrapes (Reddit,
-- Amazon, KaloData, SimilarWeb, Meta Ad Library). They are SEPARATE from
-- the transcript extraction tables (stg_transcript_*) because the source
-- data and field schemas are completely different.
--
-- Source workflows: WF6 (consumer-intel-scraper), WF7 (consumer-intel-analyzer)
-- Source prompts: prompts/reddit-pain-extractor.md, prompts/amazon-review-extractor.md
-- Source actors: apify-actors/kalodata/, apify-actors/similarweb/
-- =============================================================================
-- Run: bq query --use_legacy_sql=false < bigquery-scrape-ddl.sql
-- =============================================================================


-- -----------------------------------------------------------------------------
-- SCRAPE RUNS (audit trail — every Apify run gets a row)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `gen-lang-client-0234791928.bomb_ecom.scrape_runs` (
  run_id            STRING NOT NULL,              -- Apify run ID
  candidate_id      INT64,                        -- FK to product candidate (nullable)
  source_platform   STRING NOT NULL,              -- reddit | amazon | kalodata | similarweb | meta_ads
  actor_id          STRING,                       -- Apify actor ID
  status            STRING DEFAULT 'complete',    -- pending | running | complete | failed
  items_count       INT64 DEFAULT 0,
  input_config      STRING,                       -- JSON of actor input params
  error_message     STRING,
  started_at        TIMESTAMP,
  completed_at      TIMESTAMP,
  ingested_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);


-- -----------------------------------------------------------------------------
-- PAIN POINTS (from Reddit + Amazon — WF7 output)
-- Source: prompts/reddit-pain-extractor.md → painPoints[]
-- Source: prompts/amazon-review-extractor.md → painPoints[]
-- Maps to bom-ecom schema: nichePainPoints table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `gen-lang-client-0234791928.bomb_ecom.scrape_pain_points` (
  id                    STRING NOT NULL,           -- hash(candidate_id + painPointText)
  candidate_id          INT64,                     -- FK to product candidate
  run_id                STRING,                    -- FK to scrape_runs
  source_platform       STRING NOT NULL,           -- reddit | amazon

  -- Core pain point
  pain_point_text       STRING NOT NULL,           -- Clear 1-sentence description
  raw_quotes            ARRAY<STRING>,             -- EXACT consumer quotes (verbatim)
  frequency             INT64 DEFAULT 1,           -- How many posts/reviews express this

  -- Psychology classification (from reddit-pain-extractor.md)
  pain_category         STRING,                    -- physical | emotional | financial | social | functional
  motivation_type       STRING,                    -- pain_avoidance | gain_seeking
  emotional_intensity   INT64,                     -- 1-10
  urgency_level         STRING,                    -- chronic | acute | seasonal | situational

  -- Ad creative mapping
  trigger_types         ARRAY<STRING>,             -- fear | frustration | hope | desire | shame | anger
  ad_angle_relevance    ARRAY<STRING>,             -- hook | before_state | problem_agitation | testimonial_voice

  -- Amazon-specific fields (from amazon-review-extractor.md)
  ad_opportunity        STRING,                    -- How to position against this failure
  source_rating         STRING,                    -- "1-2 star source" | "3 star source"

  extracted_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);


-- -----------------------------------------------------------------------------
-- CONSUMER PHRASES (exact language for ad copy — from Reddit + Amazon)
-- Source: prompts/reddit-pain-extractor.md → consumerPhrases[]
-- Source: prompts/amazon-review-extractor.md → highPerformancePhrases[]
-- Maps to bom-ecom schema: consumerPhrases table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `gen-lang-client-0234791928.bomb_ecom.scrape_consumer_phrases` (
  id                    STRING NOT NULL,           -- hash(candidate_id + phrase)
  candidate_id          INT64,
  run_id                STRING,
  source_platform       STRING NOT NULL,           -- reddit | amazon

  -- The phrase itself
  phrase                STRING NOT NULL,           -- Exact consumer language
  context               STRING,                    -- What they were talking about
  frequency             INT64 DEFAULT 1,

  -- Classification (from reddit-pain-extractor.md)
  phrase_type           STRING,                    -- complaint | desire | objection | comparison | praise | question | frustration_expression
  emotional_valence     STRING,                    -- negative | neutral | positive
  emotional_intensity   INT64,                     -- 1-10

  -- Creative utility
  useable_as            ARRAY<STRING>,             -- hook | headline | testimonial_voice | objection_crusher | before_state | after_state
  cluster_label         STRING,                    -- Group label (e.g., "Sleep disruption frustration")

  -- Amazon-specific (from highPerformancePhrases)
  helpful_votes         INT64,                     -- Amazon review helpful votes (resonance signal)
  source_rating         INT64,                     -- 1-5 star review source

  extracted_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);


-- -----------------------------------------------------------------------------
-- OBJECTIONS (purchase resistance — from Reddit + Amazon)
-- Source: prompts/reddit-pain-extractor.md → objections[]
-- Source: prompts/amazon-review-extractor.md → objections[]
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `gen-lang-client-0234791928.bomb_ecom.scrape_objections` (
  id                    STRING NOT NULL,           -- hash(candidate_id + objection)
  candidate_id          INT64,
  run_id                STRING,
  source_platform       STRING NOT NULL,

  -- The objection
  objection             STRING NOT NULL,           -- In consumer language
  raw_quotes            ARRAY<STRING>,             -- Exact quotes
  frequency             INT64 DEFAULT 1,

  -- Classification
  objection_type        STRING,                    -- price | trust | efficacy | complexity | switching_cost
  counter_arguments     ARRAY<STRING>,             -- Potential counter-arguments for ad copy

  -- Amazon-specific
  friction_point        STRING,                    -- What specifically held them back
  resolution            STRING,                    -- How your product could address this

  extracted_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);


-- -----------------------------------------------------------------------------
-- COMPETITOR SIGNALS (weaknesses + messaging gaps)
-- Source: prompts/reddit-pain-extractor.md → competitorMentions[] + categoryGaps[]
-- Source: WF7 → competitorMessages output
-- Maps to bom-ecom schema: competitorMessaging table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `gen-lang-client-0234791928.bomb_ecom.scrape_competitor_signals` (
  id                    STRING NOT NULL,           -- hash(candidate_id + brand + source)
  candidate_id          INT64,
  run_id                STRING,
  source_platform       STRING NOT NULL,           -- reddit | amazon | meta_ads

  -- Competitor identity
  brand                 STRING,                    -- Brand name mentioned
  sentiment             STRING,                    -- positive | negative | mixed

  -- What consumers say
  raw_quotes            ARRAY<STRING>,             -- What they said about this brand
  weakness_identified   STRING,                    -- What this brand fails at (your opportunity)

  -- Category gaps (from reddit-pain-extractor.md → categoryGaps[])
  gap_description       STRING,                    -- Something consumers want that nobody offers
  gap_evidence          ARRAY<STRING>,             -- Supporting quotes
  gap_opportunity       STRING,                    -- How a product could fill this gap

  -- Meta Ad Library fields (from WF7 competitor output)
  messaging_angle       STRING,                    -- pain_based | solution_based | identity_based | social_proof
  awareness_level       STRING,                    -- unaware | problem_aware | solution_aware | product_aware | most_aware
  headline              STRING,                    -- Competitor ad headline
  primary_claim         STRING,                    -- Their main selling proposition

  extracted_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);


-- -----------------------------------------------------------------------------
-- PRODUCT METRICS (KaloData + SimilarWeb + Amazon numeric data)
-- Source: apify-actors/kalodata/ output
-- Source: apify-actors/similarweb/ output
-- Maps to bom-ecom schema: productCandidates.kalodataData, similarwebData, amazonData
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `gen-lang-client-0234791928.bomb_ecom.scrape_product_metrics` (
  id                    STRING NOT NULL,           -- hash(candidate_id + source + scraped_at)
  candidate_id          INT64,
  run_id                STRING,
  source_platform       STRING NOT NULL,           -- kalodata | similarweb | amazon
  product_name          STRING,
  product_url           STRING,

  -- KaloData fields (TikTok product intelligence)
  revenue_7d            FLOAT64,                   -- Revenue last 7 days
  revenue_30d           FLOAT64,
  revenue_90d           FLOAT64,
  orders_7d             INT64,
  orders_30d            INT64,
  growth_rev_7d_pct     FLOAT64,                   -- Revenue growth % (7d)
  aov                   FLOAT64,                   -- Average order value
  launch_age_days       INT64,                     -- Days since product launched
  seller_count          INT64,
  video_count           INT64,

  -- SimilarWeb fields (traffic validation)
  monthly_visits        INT64,
  top_countries         ARRAY<STRING>,             -- Top traffic countries
  traffic_channels      STRING,                    -- JSON: {direct, search, social, referral, paid}
  bounce_rate           FLOAT64,
  avg_visit_duration    FLOAT64,                   -- seconds

  -- Amazon fields (marketplace validation)
  amazon_bsr            INT64,                     -- Best Seller Rank
  amazon_rating         FLOAT64,                   -- Star rating
  amazon_review_count   INT64,
  amazon_monthly_units  INT64,                     -- Estimated monthly units sold

  -- Raw data (full scraper response for reference)
  raw_json              STRING,                    -- Full JSON response

  scraped_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);


-- -----------------------------------------------------------------------------
-- DESIRED OUTCOMES (from Amazon 4-5 star reviews — transformation stories)
-- Source: prompts/amazon-review-extractor.md → desiredOutcomes[]
-- These are SEPARATE from pain points — they represent what HAPPY customers achieved
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `gen-lang-client-0234791928.bomb_ecom.scrape_desired_outcomes` (
  id                    STRING NOT NULL,           -- hash(candidate_id + outcome)
  candidate_id          INT64,
  run_id                STRING,

  -- The outcome
  outcome               STRING NOT NULL,           -- What happy customers achieved
  raw_quotes            ARRAY<STRING>,             -- Exact 4-5 star review quotes
  frequency             INT64 DEFAULT 1,
  source_rating         STRING,                    -- "4-5 star source"

  -- Ad utility
  emotional_payoff      STRING,                    -- The feeling they describe
  ad_claim              STRING,                    -- How to phrase as ad claim (backed by reviews)

  extracted_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);


-- -----------------------------------------------------------------------------
-- PURCHASE MOTIVATIONS (from Amazon reviews — what triggered the buy)
-- Source: prompts/amazon-review-extractor.md → purchaseMotivations[]
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `gen-lang-client-0234791928.bomb_ecom.scrape_purchase_motivations` (
  id                    STRING NOT NULL,           -- hash(candidate_id + motivation)
  candidate_id          INT64,
  run_id                STRING,

  -- The motivation
  motivation            STRING NOT NULL,           -- Why they bought
  raw_quotes            ARRAY<STRING>,             -- What triggered the purchase
  trigger_event         STRING,                    -- The specific moment that made them buy
  frequency             INT64 DEFAULT 1,

  -- Ad utility
  ad_angle              STRING,                    -- How to recreate this trigger in an ad

  extracted_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);


-- -----------------------------------------------------------------------------
-- EMOTIONAL CLUSTERS (grouped emotional patterns from Reddit)
-- Source: prompts/reddit-pain-extractor.md → emotionalClusters[]
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `gen-lang-client-0234791928.bomb_ecom.scrape_emotional_clusters` (
  id                    STRING NOT NULL,           -- hash(candidate_id + cluster_label)
  candidate_id          INT64,
  run_id                STRING,

  cluster_label         STRING NOT NULL,           -- Descriptive label
  dominant_emotion      STRING,                    -- frustration | hope | anger | shame | fear | desire
  phrases               ARRAY<STRING>,             -- Consumer phrases in this cluster
  intensity             INT64,                     -- 1-10
  ad_angle_opportunity  STRING,                    -- How to use this in an ad

  extracted_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);


-- =============================================================================
-- VIEWS (aggregate across scrapes for quick querying)
-- =============================================================================

-- Top pain points by frequency across all scrapes
CREATE OR REPLACE VIEW `gen-lang-client-0234791928.bomb_ecom.top_pain_points` AS
SELECT
  pain_point_text,
  pain_category,
  SUM(frequency) AS total_frequency,
  MAX(emotional_intensity) AS max_intensity,
  ARRAY_AGG(DISTINCT source_platform) AS sources,
  COUNT(DISTINCT candidate_id) AS candidates_affected,
  ANY_VALUE(raw_quotes[SAFE_OFFSET(0)]) AS sample_quote,
  MAX(extracted_at) AS last_seen
FROM `gen-lang-client-0234791928.bomb_ecom.scrape_pain_points`
GROUP BY pain_point_text, pain_category
ORDER BY total_frequency DESC;

-- Best consumer phrases for ad copy (high frequency + high intensity)
CREATE OR REPLACE VIEW `gen-lang-client-0234791928.bomb_ecom.top_consumer_phrases` AS
SELECT
  phrase,
  phrase_type,
  cluster_label,
  SUM(frequency) AS total_frequency,
  MAX(emotional_intensity) AS max_intensity,
  ANY_VALUE(useable_as) AS useable_as,
  ARRAY_AGG(DISTINCT source_platform) AS sources,
  MAX(extracted_at) AS last_seen
FROM `gen-lang-client-0234791928.bomb_ecom.scrape_consumer_phrases`
GROUP BY phrase, phrase_type, cluster_label
ORDER BY total_frequency DESC;

-- Competitor weakness map
CREATE OR REPLACE VIEW `gen-lang-client-0234791928.bomb_ecom.competitor_weaknesses` AS
SELECT
  brand,
  COUNT(*) AS mention_count,
  ARRAY_AGG(DISTINCT sentiment) AS sentiments,
  ARRAY_AGG(DISTINCT weakness_identified IGNORE NULLS) AS weaknesses,
  ARRAY_AGG(DISTINCT gap_opportunity IGNORE NULLS) AS opportunities,
  MAX(extracted_at) AS last_seen
FROM `gen-lang-client-0234791928.bomb_ecom.scrape_competitor_signals`
WHERE brand IS NOT NULL
GROUP BY brand
ORDER BY mention_count DESC;
