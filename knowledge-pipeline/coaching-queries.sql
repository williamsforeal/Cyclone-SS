-- ════════════════════════════════════════════════════════════════
-- COACHING INSIGHTS — PATTERN QUERIES
-- Run these in BigQuery Console after loading transcript extractions.
-- Dataset: ecom_os | Table: coaching_insights
-- ════════════════════════════════════════════════════════════════


-- ── 1. WHAT ARE THE TOP PRODUCT CRITERIA MENTIONED? ───────────
-- "What rules come up most when coaches talk about picking products?"
SELECT
  insight_text,
  confidence,
  speaker,
  specific_numbers,
  COUNT(*) as total_in_category
FROM `ecom_os.coaching_insights`
WHERE category = 'product_criteria'
  AND confidence IN ('proven', 'community_consensus')
GROUP BY insight_text, confidence, speaker, specific_numbers
ORDER BY call_date DESC;


-- ── 2. WHAT KILL RULES EXIST? ─────────────────────────────────
-- "All scaling rules that tell me when to STOP spending"
SELECT insight_text, confidence, specific_numbers, speaker, call_date
FROM `ecom_os.coaching_insights`
WHERE category = 'scaling_rule'
  AND (
    LOWER(insight_text) LIKE '%kill%'
    OR LOWER(insight_text) LIKE '%stop%'
    OR LOWER(insight_text) LIKE '%cut%'
    OR LOWER(insight_text) LIKE '%pause%'
  )
ORDER BY confidence DESC, call_date DESC;


-- ── 3. MOST MENTIONED METRICS ACROSS ALL CALLS ───────────────
-- "Which metrics do coaches reference most? That's what I should track."
-- Fix: JSON_VALUE_ARRAY returns unquoted strings (JSON_EXTRACT_ARRAY returns quoted)
SELECT
  metric,
  COUNT(*) as times_mentioned,
  ARRAY_AGG(DISTINCT category) as in_categories
FROM `ecom_os.coaching_insights`,
  UNNEST(JSON_VALUE_ARRAY(metrics_mentioned)) as metric
GROUP BY metric
ORDER BY times_mentioned DESC
LIMIT 20;


-- ── 4. TOOLS RECOMMENDED BY COACHES ──────────────────────────
-- "What tools keep coming up? Those are worth investing in."
-- Fix: JSON_VALUE_ARRAY returns unquoted strings; UNNEST handles empty arrays natively
SELECT
  tool,
  COUNT(*) as times_recommended,
  ARRAY_AGG(DISTINCT speaker) as recommended_by,
  ARRAY_AGG(DISTINCT category) as in_context_of
FROM `ecom_os.coaching_insights`,
  UNNEST(JSON_VALUE_ARRAY(tools_mentioned)) as tool
GROUP BY tool
ORDER BY times_recommended DESC;


-- ── 5. PROVEN AD STRATEGIES ONLY ─────────────────────────────
-- "Give me only battle-tested ad advice, not opinions."
SELECT insight_text, speaker, specific_numbers, call_date
FROM `ecom_os.coaching_insights`
WHERE category = 'ad_strategy'
  AND confidence = 'proven'
  AND actionability = 'immediate'
ORDER BY call_date DESC;


-- ── 6. MISTAKES TO AVOID — SORTED BY FREQUENCY ──────────────
-- "What traps do coaches warn about most? Those are my guardrails."
SELECT
  insight_text,
  confidence,
  tags,
  call_date
FROM `ecom_os.coaching_insights`
WHERE category = 'mistake_to_avoid'
ORDER BY call_date DESC;


-- ── 7. ALL INSIGHTS ABOUT A SPECIFIC NICHE ───────────────────
-- Swap 'hand massager' for whatever product/niche you're researching.
SELECT insight_text, category, confidence, call_date, speaker
FROM `ecom_os.coaching_insights`
WHERE LOWER(products_mentioned) LIKE '%hand massager%'
   OR LOWER(niches_mentioned) LIKE '%pain relief%'
   OR LOWER(niches_mentioned) LIKE '%health%'
ORDER BY category, call_date DESC;


-- ── 8. CONTRARIAN INSIGHTS — WHAT GOES AGAINST THE GRAIN ─────
-- "What do specific coaches disagree with? That's where alpha lives."
SELECT insight_text, speaker, category, call_date
FROM `ecom_os.coaching_insights`
WHERE confidence = 'contrarian'
ORDER BY call_date DESC;


-- ── 9. WEEKLY DIGEST — WHAT WAS LEARNED THIS WEEK ────────────
-- Run every Friday. "What did I learn this week across all calls?"
SELECT
  category,
  COUNT(*) as insights_count,
  ARRAY_AGG(STRUCT(insight_text, confidence) ORDER BY confidence DESC LIMIT 3) as top_3
FROM `ecom_os.coaching_insights`
WHERE call_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
GROUP BY category
ORDER BY insights_count DESC;


-- ── 10. CROSS-REFERENCE: COACHING ADVICE vs AD PERFORMANCE ───
-- "Does what coaches say actually match what works in MY campaigns?"
-- NOTE: Requires ecom_os.ad_performance table — build this from Meta Ads API data.
-- creative_type values should match: 'ugc', 'static', 'offer-stack'
SELECT
  ci.insight_text,
  ci.category,
  ci.specific_numbers as coach_said,
  ap.creative_type,
  AVG(ap.roas) as my_avg_roas,
  AVG(ap.ctr) as my_avg_ctr,
  SUM(ap.spend) as my_total_spend
FROM `ecom_os.coaching_insights` ci
CROSS JOIN `ecom_os.ad_performance` ap
WHERE ci.category = 'ad_strategy'
  AND ci.confidence = 'proven'
  -- Match coaching advice about creative types to your actual results
  AND (
    (LOWER(ci.tags) LIKE '%ugc%' AND ap.creative_type = 'ugc')
    OR (LOWER(ci.tags) LIKE '%static%' AND ap.creative_type LIKE '%static%')
    OR (LOWER(ci.tags) LIKE '%offer%' AND ap.creative_type = 'offer-stack')
  )
GROUP BY ci.insight_text, ci.category, ci.specific_numbers, ap.creative_type
ORDER BY my_avg_roas DESC;


-- ── 11. INSIGHT DENSITY BY CALL TOPIC ────────────────────────
-- "Which call types give me the most value? Prioritize attendance."
SELECT
  call_topic,
  COUNT(*) as total_insights,
  COUNTIF(confidence = 'proven') as proven_insights,
  COUNTIF(actionability = 'immediate') as immediately_actionable,
  ROUND(COUNTIF(confidence = 'proven') / COUNT(*) * 100, 1) as proven_pct
FROM `ecom_os.coaching_insights`
GROUP BY call_topic
ORDER BY proven_insights DESC;


-- ── 12. BUILD A "DECISION CHECKLIST" FOR PRODUCT LAUNCH ──────
-- "Based on all coaching calls, what should I check before testing a product?"
SELECT
  insight_text as checklist_item,
  confidence,
  speaker
FROM `ecom_os.coaching_insights`
WHERE category = 'product_criteria'
  AND actionability IN ('immediate', 'foundational')
  AND confidence IN ('proven', 'community_consensus')
ORDER BY
  CASE confidence
    WHEN 'proven' THEN 1
    WHEN 'community_consensus' THEN 2
    ELSE 3
  END;
