"""
SCRAPE EXTRACTION ENGINE
Processes Apify scrape results (Reddit posts, Amazon reviews) through Gemini
to extract structured consumer intelligence → BigQuery bomb_ecom.scrape_* tables.

These are DIFFERENT from transcripts:
  - Transcripts = coaching call audio → products, niches, patterns, psychology
  - Scrapes = consumer data from Reddit/Amazon → pain points, phrases, objections, competitors

Prompts sourced from: prompts/reddit-pain-extractor.md, prompts/amazon-review-extractor.md
"""

import hashlib
import json
import os
from datetime import datetime
from google.cloud import bigquery, storage
import vertexai
from vertexai.generative_models import GenerativeModel

PROJECT_ID = os.environ.get("GCP_PROJECT_ID", "gen-lang-client-0234791928")
LOCATION = os.environ.get("GCP_LOCATION", "us-central1")
DATASET_ID = "bomb_ecom"
BUCKET_NAME = os.environ.get("GCS_BUCKET", "jake-ecom-knowledge")

vertexai.init(project=PROJECT_ID, location=LOCATION)
bq_client = bigquery.Client(project=PROJECT_ID)
storage_client = storage.Client(project=PROJECT_ID)


def _hash_id(*parts: str) -> str:
    combined = "|".join(str(p).lower().strip() for p in parts)
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()[:16]


# ════════════════════════════════════════════════════════════════
# REDDIT PROMPT (from prompts/reddit-pain-extractor.md)
# ════════════════════════════════════════════════════════════════

REDDIT_PROMPT = """
You are a consumer psychology analyst trained in Schwartz's 5 awareness levels and Cialdini's 6 principles of influence. Your job is to extract ACTIONABLE advertising intelligence from Reddit posts — not academic summaries.

Return ONLY valid JSON with these keys: painPoints, consumerPhrases, objections, emotionalClusters, competitorMentions, categoryGaps.

## painPoints[]
{ "painPointText": "string", "rawQuotes": ["exact quotes"], "frequency": int, "painCategory": "physical|emotional|financial|social|functional", "motivationType": "pain_avoidance|gain_seeking", "emotionalIntensity": 1-10, "urgencyLevel": "chronic|acute|seasonal|situational", "triggerTypes": ["frustration","fear",...], "adAngleRelevance": ["hook","before_state","problem_agitation"] }

## consumerPhrases[]
{ "phrase": "exact phrase", "context": "string", "frequency": int, "phraseType": "complaint|desire|objection|comparison|praise|question|frustration_expression", "emotionalValence": "negative|neutral|positive", "emotionalIntensity": 1-10, "useableAs": ["hook","headline","testimonial_voice","objection_crusher","before_state","after_state"], "clusterLabel": "string" }

## objections[]
{ "objection": "string", "frequency": int, "objectionType": "price|trust|efficacy|complexity|switching_cost", "rawQuotes": ["string"], "counterArguments": ["string"] }

## emotionalClusters[]
{ "clusterLabel": "string", "dominantEmotion": "frustration|hope|anger|shame|fear|desire", "phrases": ["string"], "intensity": 1-10, "adAngleOpportunity": "string" }

## competitorMentions[]
{ "brand": "string", "sentiment": "positive|negative|mixed", "rawQuotes": ["string"], "identifiedWeakness": "string" }

## categoryGaps[]
{ "gap": "string", "evidence": ["string"], "opportunity": "string" }

Rules:
1. Extract EXACT quotes — never paraphrase.
2. Rate emotional intensity honestly 1-10. Reserve 8-10 for genuine desperation.
3. Focus on ACTIONABLE pain — things a product could solve.
4. Tag which ad creative element each maps to.
5. Cluster related phrases together.
6. For competitor mentions, focus on WEAKNESSES.
7. Prioritize posts with high upvotes.

Now analyze these Reddit posts:
"""

# ════════════════════════════════════════════════════════════════
# AMAZON PROMPT (from prompts/amazon-review-extractor.md)
# ════════════════════════════════════════════════════════════════

AMAZON_PROMPT = """
You are an Amazon review analyst who thinks like David Ogilvy — every data point must translate to a selling proposition. Extract intelligence a DTC advertiser can immediately use in ads.

Return ONLY valid JSON with these keys: painPoints, desiredOutcomes, purchaseMotivations, objections, highPerformancePhrases.

## painPoints[]
{ "painPointText": "string", "rawQuotes": ["string"], "frequency": int, "rating": "1-2 star source", "painCategory": "physical|emotional|financial|social|functional", "emotionalIntensity": 1-10, "adOpportunity": "string" }

## desiredOutcomes[]
{ "outcome": "string", "rawQuotes": ["string"], "frequency": int, "rating": "4-5 star source", "emotionalPayoff": "string", "adClaim": "string" }

## purchaseMotivations[]
{ "motivation": "string", "rawQuotes": ["string"], "triggerEvent": "string", "frequency": int, "adAngle": "string" }

## objections[]
{ "objection": "string", "rawQuotes": ["string"], "frequency": int, "frictionPoint": "string", "resolution": "string" }

## highPerformancePhrases[]
{ "phrase": "string", "helpfulVotes": int, "context": "string", "useableAs": ["testimonial_voice","before_state","after_state","social_proof"], "rating": int }

Rules:
1. 1-2 star = competitor failures = YOUR opportunity.
2. 4-5 star = proof of what works. Extract transformation stories.
3. 3 star = friction points. What held them back?
4. Extract EXACT quotes. Never summarize.
5. High helpful_votes = resonance. Prioritize these.
6. Look for before/after language.
7. Group related complaints by frequency.

Now analyze these Amazon reviews:
"""


# ════════════════════════════════════════════════════════════════
# GEMINI CALL
# ════════════════════════════════════════════════════════════════

def _call_gemini_scrape(prompt: str, data_json: str) -> dict:
    """Send scrape data to Gemini for analysis. Returns parsed dict."""
    model = GenerativeModel("gemini-2.0-flash-001")

    response = model.generate_content(
        prompt + "\n\n" + data_json,
        generation_config={
            "temperature": 0.3,
            "max_output_tokens": 8192,
            "response_mime_type": "application/json"
        }
    )

    try:
        result = json.loads(response.text)
        return result if isinstance(result, dict) else {}
    except json.JSONDecodeError:
        import re
        match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        print(f"Failed to parse Gemini response: {response.text[:300]}")
        return {}


# ════════════════════════════════════════════════════════════════
# REDDIT PIPELINE
# ════════════════════════════════════════════════════════════════

def process_reddit_scrape(event: dict) -> dict:
    """
    GCS event for reddit-scrapes/*.json
    Downloads Apify Reddit scraper output → Gemini analysis → BigQuery
    """
    bucket_name = event.get("bucket", BUCKET_NAME)
    file_name = event.get("name", "")

    if not file_name.endswith(".json"):
        print(f"Skipping non-JSON: {file_name}")
        return {"status": "skipped"}

    print(f"[reddit] Processing: {file_name}")

    # Download from GCS
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(file_name)
    raw_json = blob.download_as_text()
    posts = json.loads(raw_json)

    if not isinstance(posts, list):
        posts = [posts]

    print(f"[reddit] {len(posts)} posts to analyze")

    # Prepare posts for Gemini (strip HTML, keep useful fields)
    clean_posts = []
    for p in posts:
        clean_posts.append({
            "title": p.get("title", ""),
            "body": p.get("selftext", ""),
            "subreddit": p.get("subreddit", ""),
            "url": f"https://reddit.com{p.get('permalink', '')}",
            "score": p.get("score", 0),
        })

    # Send to Gemini
    analysis = _call_gemini_scrape(REDDIT_PROMPT, json.dumps(clean_posts))

    # Extract candidate_id from filename if present (e.g., reddit-scrapes/candidate-42-hand-massager.json)
    candidate_id = _extract_candidate_id(file_name)
    run_id = file_name.split("/")[-1].replace(".json", "")
    now = datetime.now().isoformat()
    counts = {}

    # Load pain points
    pain_rows = []
    for p in analysis.get("painPoints", []):
        pain_rows.append({
            "id": _hash_id(str(candidate_id), p.get("painPointText", "")),
            "candidate_id": candidate_id,
            "run_id": run_id,
            "source_platform": "reddit",
            "pain_point_text": p.get("painPointText", ""),
            "raw_quotes": p.get("rawQuotes", []),
            "frequency": p.get("frequency", 1),
            "pain_category": p.get("painCategory"),
            "motivation_type": p.get("motivationType"),
            "emotional_intensity": p.get("emotionalIntensity"),
            "urgency_level": p.get("urgencyLevel"),
            "trigger_types": p.get("triggerTypes", []),
            "ad_angle_relevance": p.get("adAngleRelevance", []),
            "extracted_at": now,
        })
    counts["scrape_pain_points"] = _insert("scrape_pain_points", pain_rows)

    # Load consumer phrases
    phrase_rows = []
    for p in analysis.get("consumerPhrases", []):
        phrase_rows.append({
            "id": _hash_id(str(candidate_id), p.get("phrase", "")),
            "candidate_id": candidate_id,
            "run_id": run_id,
            "source_platform": "reddit",
            "phrase": p.get("phrase", ""),
            "context": p.get("context"),
            "frequency": p.get("frequency", 1),
            "phrase_type": p.get("phraseType"),
            "emotional_valence": p.get("emotionalValence"),
            "emotional_intensity": p.get("emotionalIntensity"),
            "useable_as": p.get("useableAs", []),
            "cluster_label": p.get("clusterLabel"),
            "extracted_at": now,
        })
    counts["scrape_consumer_phrases"] = _insert("scrape_consumer_phrases", phrase_rows)

    # Load objections
    obj_rows = []
    for o in analysis.get("objections", []):
        obj_rows.append({
            "id": _hash_id(str(candidate_id), o.get("objection", "")),
            "candidate_id": candidate_id,
            "run_id": run_id,
            "source_platform": "reddit",
            "objection": o.get("objection", ""),
            "raw_quotes": o.get("rawQuotes", []),
            "frequency": o.get("frequency", 1),
            "objection_type": o.get("objectionType"),
            "counter_arguments": o.get("counterArguments", []),
            "extracted_at": now,
        })
    counts["scrape_objections"] = _insert("scrape_objections", obj_rows)

    # Load competitor signals
    comp_rows = []
    for c in analysis.get("competitorMentions", []):
        comp_rows.append({
            "id": _hash_id(str(candidate_id), c.get("brand", ""), "reddit"),
            "candidate_id": candidate_id,
            "run_id": run_id,
            "source_platform": "reddit",
            "brand": c.get("brand"),
            "sentiment": c.get("sentiment"),
            "raw_quotes": c.get("rawQuotes", []),
            "weakness_identified": c.get("identifiedWeakness"),
            "extracted_at": now,
        })
    for g in analysis.get("categoryGaps", []):
        comp_rows.append({
            "id": _hash_id(str(candidate_id), g.get("gap", ""), "gap"),
            "candidate_id": candidate_id,
            "run_id": run_id,
            "source_platform": "reddit",
            "gap_description": g.get("gap"),
            "gap_evidence": g.get("evidence", []),
            "gap_opportunity": g.get("opportunity"),
            "extracted_at": now,
        })
    counts["scrape_competitor_signals"] = _insert("scrape_competitor_signals", comp_rows)

    # Load emotional clusters
    cluster_rows = []
    for ec in analysis.get("emotionalClusters", []):
        cluster_rows.append({
            "id": _hash_id(str(candidate_id), ec.get("clusterLabel", "")),
            "candidate_id": candidate_id,
            "run_id": run_id,
            "cluster_label": ec.get("clusterLabel", ""),
            "dominant_emotion": ec.get("dominantEmotion"),
            "phrases": ec.get("phrases", []),
            "intensity": ec.get("intensity"),
            "ad_angle_opportunity": ec.get("adAngleOpportunity"),
            "extracted_at": now,
        })
    counts["scrape_emotional_clusters"] = _insert("scrape_emotional_clusters", cluster_rows)

    # Move to processed
    processed_path = file_name.replace("reddit-scrapes/", "reddit-scrapes/processed/")
    bucket.rename_blob(blob, processed_path)

    total = sum(counts.values())
    print(f"[reddit] Loaded {total} rows across {len(counts)} tables")
    return {"pipeline": "reddit", "file": file_name, "posts": len(posts), "tables": counts}


# ════════════════════════════════════════════════════════════════
# AMAZON PIPELINE
# ════════════════════════════════════════════════════════════════

def process_amazon_scrape(event: dict) -> dict:
    """
    GCS event for amazon-scrapes/*.json
    Downloads Apify Amazon review output → Gemini analysis → BigQuery
    """
    bucket_name = event.get("bucket", BUCKET_NAME)
    file_name = event.get("name", "")

    if not file_name.endswith(".json"):
        return {"status": "skipped"}

    print(f"[amazon] Processing: {file_name}")

    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(file_name)
    raw_json = blob.download_as_text()
    reviews = json.loads(raw_json)

    if not isinstance(reviews, list):
        reviews = [reviews]

    print(f"[amazon] {len(reviews)} reviews to analyze")

    # Prepare for Gemini
    clean_reviews = []
    for r in reviews:
        clean_reviews.append({
            "rating": r.get("rating") or r.get("stars"),
            "title": r.get("title", ""),
            "body": r.get("body") or r.get("text") or r.get("reviewBody", ""),
            "verifiedPurchase": r.get("verifiedPurchase", False),
            "helpfulVotes": r.get("helpfulVotes") or r.get("helpful", 0),
            "date": r.get("date", ""),
        })

    analysis = _call_gemini_scrape(AMAZON_PROMPT, json.dumps(clean_reviews))

    candidate_id = _extract_candidate_id(file_name)
    run_id = file_name.split("/")[-1].replace(".json", "")
    now = datetime.now().isoformat()
    counts = {}

    # Pain points (from 1-2 star reviews)
    pain_rows = []
    for p in analysis.get("painPoints", []):
        pain_rows.append({
            "id": _hash_id(str(candidate_id), p.get("painPointText", ""), "amazon"),
            "candidate_id": candidate_id,
            "run_id": run_id,
            "source_platform": "amazon",
            "pain_point_text": p.get("painPointText", ""),
            "raw_quotes": p.get("rawQuotes", []),
            "frequency": p.get("frequency", 1),
            "pain_category": p.get("painCategory"),
            "emotional_intensity": p.get("emotionalIntensity"),
            "ad_opportunity": p.get("adOpportunity"),
            "source_rating": p.get("rating"),
            "extracted_at": now,
        })
    counts["scrape_pain_points"] = _insert("scrape_pain_points", pain_rows)

    # Desired outcomes (from 4-5 star reviews)
    outcome_rows = []
    for d in analysis.get("desiredOutcomes", []):
        outcome_rows.append({
            "id": _hash_id(str(candidate_id), d.get("outcome", "")),
            "candidate_id": candidate_id,
            "run_id": run_id,
            "outcome": d.get("outcome", ""),
            "raw_quotes": d.get("rawQuotes", []),
            "frequency": d.get("frequency", 1),
            "source_rating": d.get("rating"),
            "emotional_payoff": d.get("emotionalPayoff"),
            "ad_claim": d.get("adClaim"),
            "extracted_at": now,
        })
    counts["scrape_desired_outcomes"] = _insert("scrape_desired_outcomes", outcome_rows)

    # Purchase motivations
    motiv_rows = []
    for m in analysis.get("purchaseMotivations", []):
        motiv_rows.append({
            "id": _hash_id(str(candidate_id), m.get("motivation", "")),
            "candidate_id": candidate_id,
            "run_id": run_id,
            "motivation": m.get("motivation", ""),
            "raw_quotes": m.get("rawQuotes", []),
            "trigger_event": m.get("triggerEvent"),
            "frequency": m.get("frequency", 1),
            "ad_angle": m.get("adAngle"),
            "extracted_at": now,
        })
    counts["scrape_purchase_motivations"] = _insert("scrape_purchase_motivations", motiv_rows)

    # Objections (from 3 star reviews)
    obj_rows = []
    for o in analysis.get("objections", []):
        obj_rows.append({
            "id": _hash_id(str(candidate_id), o.get("objection", ""), "amazon"),
            "candidate_id": candidate_id,
            "run_id": run_id,
            "source_platform": "amazon",
            "objection": o.get("objection", ""),
            "raw_quotes": o.get("rawQuotes", []),
            "frequency": o.get("frequency", 1),
            "friction_point": o.get("frictionPoint"),
            "resolution": o.get("resolution"),
            "extracted_at": now,
        })
    counts["scrape_objections"] = _insert("scrape_objections", obj_rows)

    # High performance phrases
    phrase_rows = []
    for hp in analysis.get("highPerformancePhrases", []):
        phrase_rows.append({
            "id": _hash_id(str(candidate_id), hp.get("phrase", ""), "amazon"),
            "candidate_id": candidate_id,
            "run_id": run_id,
            "source_platform": "amazon",
            "phrase": hp.get("phrase", ""),
            "context": hp.get("context"),
            "helpful_votes": hp.get("helpfulVotes"),
            "useable_as": hp.get("useableAs", []),
            "source_rating": hp.get("rating"),
            "extracted_at": now,
        })
    counts["scrape_consumer_phrases"] = _insert("scrape_consumer_phrases", phrase_rows)

    # Move to processed
    processed_path = file_name.replace("amazon-scrapes/", "amazon-scrapes/processed/")
    bucket.rename_blob(blob, processed_path)

    total = sum(counts.values())
    print(f"[amazon] Loaded {total} rows across {len(counts)} tables")
    return {"pipeline": "amazon", "file": file_name, "reviews": len(reviews), "tables": counts}


# ════════════════════════════════════════════════════════════════
# HELPERS
# ════════════════════════════════════════════════════════════════

def _extract_candidate_id(file_name: str) -> int | None:
    """Extract candidate ID from filename like 'reddit-scrapes/candidate-42-hand-massager.json'"""
    import re
    match = re.search(r'candidate[_-](\d+)', file_name)
    return int(match.group(1)) if match else None


def _insert(table_name: str, rows: list[dict]) -> int:
    if not rows:
        return 0
    table_ref = f"{PROJECT_ID}.{DATASET_ID}.{table_name}"
    errors = bq_client.insert_rows_json(table_ref, rows)
    if errors:
        print(f"BQ errors for {table_name}: {errors}")
        raise Exception(f"Failed to insert into {table_name}: {errors}")
    return len(rows)
