-- ════════════════════════════════════════════════════════════════
-- COACHING INTELLIGENCE QUERIES (v2 — Normalized Schema)
-- Dataset: bomb_ecom | Tables: stg_transcript_* + knowledge_* views
-- ════════════════════════════════════════════════════════════════


-- ── 1. TOP PATTERNS BY FREQUENCY (using knowledge view) ────────
-- "What strategies and tactics come up most across all calls?"
SELECT
  pattern_name,
  pattern_type,
  category,
  sentiment,
  times_mentioned,
  description,
  source_calls
FROM `bomb_ecom.knowledge_patterns`
WHERE sentiment = 'do_this'
ORDER BY times_mentioned DESC
LIMIT 20;


-- ── 2. KILL RULES — WHEN TO STOP SPENDING ─────────────────────
-- "All patterns that tell me when to STOP"
SELECT
  pattern_name,
  description,
  mention_context,
  speaker_role,
  doc_title
FROM `bomb_ecom.stg_transcript_patterns`
WHERE sentiment = 'avoid_this'
  AND category IN ('scaling', 'testing', 'ad_creative')
ORDER BY extracted_at DESC;


-- ── 3. PRODUCTS COACHES ARE BULLISH ON ────────────────────────
-- "What products are getting a 'promising' verdict across calls?"
SELECT
  product_name,
  niche,
  times_mentioned,
  verdicts,
  pain_point,
  target_avatar,
  source_calls
FROM `bomb_ecom.knowledge_products`
WHERE 'promising' IN UNNEST(verdicts)
ORDER BY times_mentioned DESC;


-- ── 4. NICHE OUTLOOK TRACKER ──────────────────────────────────
-- "Which niches are hot vs cooling across coaching calls?"
SELECT
  niche_name,
  times_discussed,
  outlooks_over_time,
  audience_insight,
  latest_reasoning,
  source_calls
FROM `bomb_ecom.knowledge_niches`
ORDER BY times_discussed DESC;


-- ── 5. PSYCHOLOGY INSIGHTS FOR AD CREATIVE ────────────────────
-- "What buyer psychology principles should I use in ads?"
SELECT
  insight_name,
  principle,
  category,
  times_mentioned,
  application,
  example_context,
  source_calls
FROM `bomb_ecom.knowledge_psychology`
WHERE category IN ('buyer_behavior', 'persuasion', 'emotional_trigger', 'cognitive_bias')
ORDER BY times_mentioned DESC;


-- ── 6. CASE STUDIES — WINS WITH REAL NUMBERS ──────────────────
-- "Show me real results from students and coaches"
SELECT
  title,
  outcome,
  speaker_role,
  product_or_niche,
  revenue,
  ad_spend,
  margin,
  timeline,
  what_worked,
  what_failed,
  lessons_learned,
  doc_title
FROM `bomb_ecom.stg_transcript_case_studies`
WHERE outcome = 'win'
ORDER BY extracted_at DESC;


-- ── 7. MISTAKES TO AVOID ──────────────────────────────────────
-- "What traps do coaches warn about most?"
SELECT
  pattern_name,
  pattern_type,
  description,
  mention_context,
  category,
  speaker_role,
  doc_title
FROM `bomb_ecom.stg_transcript_patterns`
WHERE pattern_type IN ('mistake', 'warning')
ORDER BY extracted_at DESC;


-- ── 8. ALL INSIGHTS ABOUT A SPECIFIC NICHE ────────────────────
-- Swap 'pain relief' for whatever niche you're researching.
SELECT 'product' AS source_type, product_name AS name, verdict AS detail, mention_context, doc_title
FROM `bomb_ecom.stg_transcript_products`
WHERE LOWER(niche) LIKE '%pain relief%'
UNION ALL
SELECT 'niche', niche_name, outlook, mention_context, doc_title
FROM `bomb_ecom.stg_transcript_niches`
WHERE LOWER(niche_name) LIKE '%pain%' OR LOWER(niche_name) LIKE '%health%'
UNION ALL
SELECT 'pattern', pattern_name, sentiment, mention_context, doc_title
FROM `bomb_ecom.stg_transcript_patterns`
WHERE LOWER(description) LIKE '%pain%' OR LOWER(mention_context) LIKE '%pain%'
ORDER BY source_type, doc_title;


-- ── 9. CALL DIGEST — WHAT WAS COVERED RECENTLY ───────────────
-- "What were the last 5 calls about?"
SELECT
  doc_title,
  call_type,
  call_date,
  main_topics,
  speaker_names,
  product_count,
  niche_count,
  pattern_count,
  psychology_count,
  case_study_count,
  summary
FROM `bomb_ecom.stg_transcript_calls`
ORDER BY extracted_at DESC
LIMIT 5;


-- ── 10. PRODUCT LAUNCH CHECKLIST ──────────────────────────────
-- "Based on all calls, what should I check before testing a product?"
SELECT
  pattern_name AS checklist_item,
  description,
  speaker_role,
  doc_title
FROM `bomb_ecom.stg_transcript_patterns`
WHERE category = 'product_selection'
  AND sentiment = 'do_this'
  AND pattern_type IN ('strategy', 'framework', 'tactic')
ORDER BY extracted_at DESC;


-- ── 11. CROSS-PIPELINE: COACHING vs SCRAPE DATA ──────────────
-- "Do coaching call product mentions match scrape pain point data?"
-- Requires both transcript and scrape tables to be populated.
SELECT
  tp.product_name,
  tp.niche,
  tp.verdict AS coaching_verdict,
  COUNT(DISTINCT sp.id) AS scrape_pain_points,
  MAX(sp.emotional_intensity) AS max_pain_intensity,
  ARRAY_AGG(DISTINCT sp.pain_category IGNORE NULLS LIMIT 3) AS pain_categories
FROM `bomb_ecom.stg_transcript_products` tp
LEFT JOIN `bomb_ecom.scrape_pain_points` sp
  ON LOWER(tp.niche) = LOWER(sp.pain_point_text)  -- loose join on niche/pain overlap
GROUP BY tp.product_name, tp.niche, tp.verdict
ORDER BY scrape_pain_points DESC;
