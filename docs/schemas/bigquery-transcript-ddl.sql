-- =============================================================================
-- BigQuery DDL: Transcript Extraction Tables
-- Dataset: bomb_ecom (create if not exists)
-- =============================================================================
-- Run: bq query --use_legacy_sql=false < bigquery-transcript-ddl.sql
-- Or paste into BigQuery Console SQL editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- RAW LAYER (immutable, append-only — never modify after insert)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `gen-lang-client-0234791928.bomb_ecom.raw_transcripts` (
  transcript_id     STRING NOT NULL,              -- hash(docId)
  doc_id            STRING NOT NULL,              -- Google Drive file ID
  doc_title         STRING,
  doc_url           STRING,
  raw_text          STRING,                       -- full extracted text (up to 12k chars)
  extraction_json   STRING,                       -- full Gemini response as JSON string
  extracted_at      TIMESTAMP NOT NULL,
  ingested_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- -----------------------------------------------------------------------------
-- NORMALIZED LAYER: Products
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `gen-lang-client-0234791928.bomb_ecom.stg_transcript_products` (
  id                STRING NOT NULL,              -- hash(transcript_id + productName + niche)
  transcript_id     STRING NOT NULL,
  doc_title         STRING,
  product_name      STRING NOT NULL,
  niche             STRING,
  why_mentioned     STRING,
  mention_context   STRING,
  speaker_role      STRING,                       -- coach | student | unknown
  verdict           STRING,                       -- promising | cautionary | neutral | failed
  pain_point        STRING,
  target_avatar     STRING,
  angles_suggested  ARRAY<STRING>,
  objections        ARRAY<STRING>,
  platforms         ARRAY<STRING>,
  extracted_at      TIMESTAMP NOT NULL
);

-- -----------------------------------------------------------------------------
-- NORMALIZED LAYER: Niches
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `gen-lang-client-0234791928.bomb_ecom.stg_transcript_niches` (
  id                STRING NOT NULL,              -- hash(transcript_id + nicheName)
  transcript_id     STRING NOT NULL,
  doc_title         STRING,
  niche_name        STRING NOT NULL,
  outlook           STRING,                       -- hot | warming | cooling | dead | evergreen
  reasoning         STRING,
  mention_context   STRING,
  audience_insight  STRING,
  seasonality       STRING,
  products_linked   ARRAY<STRING>,
  extracted_at      TIMESTAMP NOT NULL
);

-- -----------------------------------------------------------------------------
-- NORMALIZED LAYER: Patterns (operator playbook)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `gen-lang-client-0234791928.bomb_ecom.stg_transcript_patterns` (
  id                STRING NOT NULL,              -- hash(transcript_id + patternName + patternType)
  transcript_id     STRING NOT NULL,
  doc_title         STRING,
  pattern_name      STRING NOT NULL,
  pattern_type      STRING,                       -- strategy | tactic | mistake | warning | framework
  description       STRING,
  mention_context   STRING,
  category          STRING,                       -- product_selection | ad_creative | offer_design | scaling | mindset | fulfillment | testing | funnel | general
  sentiment         STRING,                       -- do_this | avoid_this | depends
  speaker_role      STRING,
  extracted_at      TIMESTAMP NOT NULL
);

-- -----------------------------------------------------------------------------
-- NORMALIZED LAYER: Psychology
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `gen-lang-client-0234791928.bomb_ecom.stg_transcript_psychology` (
  id                STRING NOT NULL,              -- hash(transcript_id + insightName + category)
  transcript_id     STRING NOT NULL,
  doc_title         STRING,
  insight_name      STRING NOT NULL,
  principle         STRING,
  application       STRING,
  mention_context   STRING,
  category          STRING,                       -- buyer_behavior | persuasion | objection_handling | emotional_trigger | cognitive_bias | social_dynamics
  examples          ARRAY<STRING>,
  extracted_at      TIMESTAMP NOT NULL
);

-- -----------------------------------------------------------------------------
-- NORMALIZED LAYER: Case Studies
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `gen-lang-client-0234791928.bomb_ecom.stg_transcript_case_studies` (
  id                STRING NOT NULL,              -- hash(transcript_id + title)
  transcript_id     STRING NOT NULL,
  doc_title         STRING,
  title             STRING NOT NULL,
  outcome           STRING,                       -- win | loss | mixed | in_progress
  speaker_role      STRING,
  product_or_niche  STRING,
  revenue           STRING,
  ad_spend          STRING,
  margin            STRING,
  timeline          STRING,
  other_numbers     STRING,
  what_worked       ARRAY<STRING>,
  what_failed       ARRAY<STRING>,
  lessons_learned   ARRAY<STRING>,
  mention_context   STRING,
  extracted_at      TIMESTAMP NOT NULL
);

-- -----------------------------------------------------------------------------
-- NORMALIZED LAYER: Call Metadata
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `gen-lang-client-0234791928.bomb_ecom.stg_transcript_calls` (
  transcript_id     STRING NOT NULL,
  doc_id            STRING NOT NULL,
  doc_title         STRING,
  doc_url           STRING,
  call_date         DATE,
  call_type         STRING,                       -- weekly_call | community_call | onboarding | masterclass | q_and_a | unknown
  main_topics       ARRAY<STRING>,
  speaker_names     ARRAY<STRING>,
  student_questions ARRAY<STRING>,
  product_count     INT64,
  niche_count       INT64,
  pattern_count     INT64,
  psychology_count  INT64,
  case_study_count  INT64,
  summary           STRING,
  extracted_at      TIMESTAMP NOT NULL
);

-- -----------------------------------------------------------------------------
-- DERIVED LAYER: Knowledge base (deduplicated across ALL transcripts)
-- These are VIEWs that aggregate the normalized tables
-- -----------------------------------------------------------------------------

-- All unique patterns across all calls, with frequency count
CREATE OR REPLACE VIEW `gen-lang-client-0234791928.bomb_ecom.knowledge_patterns` AS
SELECT
  pattern_name,
  pattern_type,
  category,
  sentiment,
  COUNT(*) AS times_mentioned,
  ARRAY_AGG(DISTINCT doc_title) AS source_calls,
  ANY_VALUE(description) AS description,
  ANY_VALUE(mention_context) AS example_context,
  MAX(extracted_at) AS last_seen
FROM `gen-lang-client-0234791928.bomb_ecom.stg_transcript_patterns`
GROUP BY pattern_name, pattern_type, category, sentiment;

-- All unique psychology insights across all calls
CREATE OR REPLACE VIEW `gen-lang-client-0234791928.bomb_ecom.knowledge_psychology` AS
SELECT
  insight_name,
  principle,
  category,
  COUNT(*) AS times_mentioned,
  ARRAY_AGG(DISTINCT doc_title) AS source_calls,
  ANY_VALUE(application) AS application,
  ANY_VALUE(mention_context) AS example_context,
  MAX(extracted_at) AS last_seen
FROM `gen-lang-client-0234791928.bomb_ecom.stg_transcript_psychology`
GROUP BY insight_name, principle, category;

-- Product mentions with cross-call aggregation
CREATE OR REPLACE VIEW `gen-lang-client-0234791928.bomb_ecom.knowledge_products` AS
SELECT
  product_name,
  niche,
  COUNT(*) AS times_mentioned,
  ARRAY_AGG(DISTINCT verdict) AS verdicts,
  ARRAY_AGG(DISTINCT doc_title) AS source_calls,
  ANY_VALUE(pain_point) AS pain_point,
  ANY_VALUE(target_avatar) AS target_avatar,
  MAX(extracted_at) AS last_seen
FROM `gen-lang-client-0234791928.bomb_ecom.stg_transcript_products`
GROUP BY product_name, niche;

-- Niche sentiment tracker across calls
CREATE OR REPLACE VIEW `gen-lang-client-0234791928.bomb_ecom.knowledge_niches` AS
SELECT
  niche_name,
  COUNT(*) AS times_discussed,
  ARRAY_AGG(DISTINCT outlook) AS outlooks_over_time,
  ARRAY_AGG(DISTINCT doc_title) AS source_calls,
  ANY_VALUE(audience_insight) AS audience_insight,
  ANY_VALUE(reasoning) AS latest_reasoning,
  MAX(extracted_at) AS last_seen
FROM `gen-lang-client-0234791928.bomb_ecom.stg_transcript_niches`
GROUP BY niche_name;
