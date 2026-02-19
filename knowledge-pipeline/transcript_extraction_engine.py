"""
TRANSCRIPT EXTRACTION ENGINE
Processes raw coaching call transcripts → structured BigQuery rows.

Flow: GCS file lands → Pub/Sub triggers → this function runs →
      Gemini extracts insights → rows land in BigQuery.

Deploy as: Cloud Run service (triggered by Pub/Sub)
Model: Gemini 2.0 Flash (fast, cheap, handles 30k+ word transcripts)
"""

import json
import os
from datetime import datetime
from google.cloud import bigquery, storage, aiplatform
import vertexai
from vertexai.generative_models import GenerativeModel, Part

# ── Config ──────────────────────────────────────────────────────
PROJECT_ID = os.environ.get("GCP_PROJECT_ID", "gen-lang-client-0234791928")
LOCATION = os.environ.get("GCP_LOCATION", "us-central1")
DATASET_ID = "ecom_os"
TABLE_ID = "coaching_insights"
BUCKET_NAME = os.environ.get("GCS_BUCKET", "jake-ecom-knowledge")

# ── Initialize clients ──────────────────────────────────────────
vertexai.init(project=PROJECT_ID, location=LOCATION)
bq_client = bigquery.Client(project=PROJECT_ID)
storage_client = storage.Client(project=PROJECT_ID)


# ════════════════════════════════════════════════════════════════
# THE EXTRACTION PROMPT
# ════════════════════════════════════════════════════════════════
# This is the core IP. Everything else is plumbing.
# Edit THIS when you want to extract different patterns.

EXTRACTION_PROMPT = """
You are a marketing intelligence analyst processing ecommerce coaching call transcripts.

Your job: extract every actionable insight from this transcript and return them as structured JSON.

## EXTRACTION CATEGORIES

Extract insights into these categories ONLY:

1. **product_criteria** — Any rule, heuristic, or signal for evaluating whether a product is worth testing.
   Examples: margin thresholds, price range advice, competition signals, niche selection criteria,
   supplier red flags, trend indicators, seasonal timing.

2. **ad_strategy** — Any tactic, framework, or principle for creating or optimizing ad creatives.
   Examples: hook formulas, copy structures, image styles that convert, video vs static guidance,
   creative testing frameworks, audience targeting advice, ad format recommendations.

3. **scaling_rule** — Any rule for when/how to scale spend, kill ads, or manage campaigns.
   Examples: ROAS thresholds, budget scaling percentages, kill criteria, CBO vs ABO advice,
   audience expansion timing, retargeting setup, lookalike strategies.

4. **platform_tactic** — Specific Meta/TikTok/Google platform mechanics or algorithm insights.
   Examples: pixel optimization events, campaign structure advice, bidding strategies,
   attribution window settings, creative fatigue signals, placement recommendations.

5. **mindset_principle** — Mental models, decision frameworks, or founder psychology advice.
   Examples: when to pivot vs persist, handling losing streaks, time management for testing,
   avoiding shiny object syndrome, building systems over manual work.

6. **mistake_to_avoid** — Specific warnings about what NOT to do.
   Examples: common beginner errors, money-wasting patterns, scaling too early signals,
   product research traps, creative approaches that don't convert.

7. **tool_recommendation** — Any specific tool, software, or service recommended.
   Examples: spy tools, analytics platforms, creative tools, fulfillment services,
   AI tools, automation platforms.

8. **case_study** — Real examples of products/brands/campaigns discussed with outcomes.
   Examples: "Brand X did Y and got Z result", specific numbers shared about real campaigns,
   before/after scenarios from real businesses.

## EXTRACTION RULES

- Extract EVERY distinct insight. A single transcript might contain 20-50 insights.
- Each insight is ONE atomic idea. Don't combine multiple concepts into one row.
- Preserve specific numbers, thresholds, and metrics exactly as stated.
- If a speaker shares a personal opinion vs a proven rule, flag the confidence level.
- If products or niches are mentioned by name, capture them.
- If metrics are referenced (CTR, ROAS, CPC, AOV, etc.), capture which ones.
- Ignore small talk, introductions, housekeeping. Only extract substantive content.
- If someone asks a question that gets a detailed answer, extract the ANSWER as the insight.

## CONFIDENCE LEVELS

- **proven**: Speaker states this from direct experience with data/results to back it up.
- **strong_opinion**: Speaker is confident but doesn't cite specific data.
- **hypothesis**: Speaker is speculating or brainstorming.
- **community_consensus**: Multiple people agree or it's presented as common knowledge.
- **contrarian**: Speaker explicitly disagrees with common advice.

## OUTPUT FORMAT

Return ONLY a JSON array. No markdown, no explanation, no preamble.

```json
[
  {
    "insight_text": "The exact insight, paraphrased clearly in 1-3 sentences max",
    "category": "one of the 8 categories above",
    "confidence": "proven | strong_opinion | hypothesis | community_consensus | contrarian",
    "speaker": "Name of person who said it, or 'unknown' if unclear",
    "products_mentioned": ["product1", "product2"] or [],
    "niches_mentioned": ["niche1", "niche2"] or [],
    "metrics_mentioned": ["ROAS", "CTR", "AOV"] or [],
    "specific_numbers": ["2.0 ROAS threshold", "$30-50 AOV sweet spot"] or [],
    "tools_mentioned": ["tool1", "tool2"] or [],
    "actionability": "immediate | when_scaling | foundational | situational",
    "tags": ["tag1", "tag2", "tag3"]
  }
]
```

## EXAMPLE EXTRACTION

If the transcript says:
"Yeah so what I've found is if you're not getting a sale within the first $20-30 of spend,
just kill it. Don't wait. I've tested over 200 products and that rule holds like 90% of the time.
The only exception is if your CTR is above 3% — then give it another day because the traffic
quality is there, you might just need a landing page tweak."

You'd extract TWO insights:

```json
[
  {
    "insight_text": "Kill an ad if no sale within first $20-30 of spend. Tested across 200+ products with ~90% reliability.",
    "category": "scaling_rule",
    "confidence": "proven",
    "speaker": "unknown",
    "products_mentioned": [],
    "niches_mentioned": [],
    "metrics_mentioned": ["spend", "sales"],
    "specific_numbers": ["$20-30 kill threshold", "200+ products tested", "90% hit rate"],
    "tools_mentioned": [],
    "actionability": "immediate",
    "tags": ["kill-criteria", "ad-testing", "spend-threshold"]
  },
  {
    "insight_text": "Exception to kill rule: if CTR is above 3%, give the ad another day. High CTR signals good traffic quality — the issue is likely the landing page, not the creative.",
    "category": "scaling_rule",
    "confidence": "proven",
    "speaker": "unknown",
    "products_mentioned": [],
    "niches_mentioned": [],
    "metrics_mentioned": ["CTR"],
    "specific_numbers": ["3% CTR threshold"],
    "tools_mentioned": [],
    "actionability": "immediate",
    "tags": ["kill-criteria", "ctr", "landing-page", "exception-rule"]
  }
]
```

Now process this transcript:
"""


# ════════════════════════════════════════════════════════════════
# PROCESSING FUNCTIONS
# ════════════════════════════════════════════════════════════════

def extract_insights_from_transcript(transcript_text: str, filename: str) -> list[dict]:
    """
    Send transcript to Gemini → get structured insights back.
    Handles chunking for very long transcripts (>25k words).
    """
    model = GenerativeModel("gemini-2.0-flash-001")

    # Gemini 2.0 Flash handles ~1M tokens, so most transcripts fit in one call.
    # Only chunk if truly massive (100k+ words).
    word_count = len(transcript_text.split())

    if word_count > 100000:
        # Split into chunks of ~50k words with overlap
        chunks = chunk_transcript(transcript_text, chunk_size=50000, overlap=2000)
        all_insights = []
        for i, chunk in enumerate(chunks):
            print(f"Processing chunk {i+1}/{len(chunks)} ({len(chunk.split())} words)")
            insights = _call_gemini(model, chunk)
            all_insights.extend(insights)
        return deduplicate_insights(all_insights)
    else:
        return _call_gemini(model, transcript_text)


def _call_gemini(model: GenerativeModel, text: str) -> list[dict]:
    """Single Gemini API call. Returns parsed JSON array."""

    full_prompt = EXTRACTION_PROMPT + "\n\n" + text

    response = model.generate_content(
        full_prompt,
        generation_config={
            "temperature": 0.2,          # Low temp = precise extraction
            "max_output_tokens": 8192,   # Max supported by gemini-2.0-flash-001
            "response_mime_type": "application/json"  # Force JSON output
        }
    )

    try:
        insights = json.loads(response.text)
        if not isinstance(insights, list):
            print(f"Warning: Expected array, got {type(insights)}. Wrapping.")
            insights = [insights]
        return insights
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        print(f"Raw response: {response.text[:500]}")
        # Attempt to extract JSON from markdown fences if Gemini wrapped it
        import re
        match = re.search(r'\[.*\]', response.text, re.DOTALL)
        if match:
            return json.loads(match.group())
        return []


def chunk_transcript(text: str, chunk_size: int = 50000, overlap: int = 2000) -> list[str]:
    """Split long transcripts into overlapping word-based chunks."""
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunks.append(" ".join(words[start:end]))
        start = end - overlap
    return chunks


def deduplicate_insights(insights: list[dict]) -> list[dict]:
    """Remove near-duplicate insights from chunked processing."""
    seen = set()
    unique = []
    for insight in insights:
        # Use first 100 chars of insight_text as dedup key
        key = insight.get("insight_text", "")[:100].lower().strip()
        if key not in seen:
            seen.add(key)
            unique.append(insight)
    return unique


# ════════════════════════════════════════════════════════════════
# BIGQUERY LOADING
# ════════════════════════════════════════════════════════════════

def load_to_bigquery(insights: list[dict], source_filename: str, call_date: str = None, source_type: str = None):
    """
    Load extracted insights into BigQuery coaching_insights table.
    Adds metadata columns (source file, processing timestamp, call date).

    source_type: explicit data source bucket. One of:
        discord_ai_com | product_market_research | brand_intelligence |
        creative_ad_intelligence | visual_os | apify_scrape
    If not provided, inferred from filename.
    """
    table_ref = f"{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}"

    # Enrich each row with metadata
    rows = []
    for i, insight in enumerate(insights):
        row = {
            "insight_id": f"{source_filename}_{i:03d}",
            "source_file": source_filename,
            "call_date": call_date or datetime.now().strftime("%Y-%m-%d"),
            "processed_at": datetime.now().isoformat(),
            "call_topic": source_type or _infer_topic(source_filename),

            # Core extraction fields
            "insight_text": insight.get("insight_text", ""),
            "category": insight.get("category", "uncategorized"),
            "confidence": insight.get("confidence", "unknown"),
            "speaker": insight.get("speaker", "unknown"),
            "actionability": insight.get("actionability", "situational"),

            # Array fields → stored as JSON strings in BigQuery
            "products_mentioned": json.dumps(insight.get("products_mentioned", [])),
            "niches_mentioned": json.dumps(insight.get("niches_mentioned", [])),
            "metrics_mentioned": json.dumps(insight.get("metrics_mentioned", [])),
            "specific_numbers": json.dumps(insight.get("specific_numbers", [])),
            "tools_mentioned": json.dumps(insight.get("tools_mentioned", [])),
            "tags": json.dumps(insight.get("tags", []))
        }
        rows.append(row)

    # Insert into BigQuery
    errors = bq_client.insert_rows_json(table_ref, rows)
    if errors:
        print(f"BigQuery insert errors: {errors}")
        raise Exception(f"Failed to insert {len(errors)} rows")

    print(f"✓ Loaded {len(rows)} insights from {source_filename} into {table_ref}")
    return len(rows)


def _infer_topic(filename: str) -> str:
    """Guess the call topic from filename. Override with metadata if available."""
    filename_lower = filename.lower()
    topic_map = {
        "product": "product_research",
        "scaling": "scaling_strategy",
        "creative": "ad_creative",
        "ads": "ad_strategy",
        "meta": "platform_tactics",
        "tiktok": "platform_tactics",
        "mindset": "mindset",
        "general": "general_q_and_a"
    }
    for keyword, topic in topic_map.items():
        if keyword in filename_lower:
            return topic
    return "general_q_and_a"


# ════════════════════════════════════════════════════════════════
# BIGQUERY TABLE CREATION (run once)
# ════════════════════════════════════════════════════════════════

def create_bigquery_table():
    """Create the coaching_insights table if it doesn't exist."""

    schema = [
        bigquery.SchemaField("insight_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("source_file", "STRING"),
        bigquery.SchemaField("call_date", "DATE"),
        bigquery.SchemaField("processed_at", "TIMESTAMP"),
        bigquery.SchemaField("call_topic", "STRING"),
        bigquery.SchemaField("insight_text", "STRING"),
        bigquery.SchemaField("category", "STRING"),
        bigquery.SchemaField("confidence", "STRING"),
        bigquery.SchemaField("speaker", "STRING"),
        bigquery.SchemaField("actionability", "STRING"),
        bigquery.SchemaField("products_mentioned", "STRING"),  # JSON array as string
        bigquery.SchemaField("niches_mentioned", "STRING"),
        bigquery.SchemaField("metrics_mentioned", "STRING"),
        bigquery.SchemaField("specific_numbers", "STRING"),
        bigquery.SchemaField("tools_mentioned", "STRING"),
        bigquery.SchemaField("tags", "STRING"),
    ]

    table_ref = f"{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}"
    table = bigquery.Table(table_ref, schema=schema)

    # Create dataset if needed
    dataset_ref = f"{PROJECT_ID}.{DATASET_ID}"
    try:
        bq_client.get_dataset(dataset_ref)
    except Exception:
        dataset = bigquery.Dataset(dataset_ref)
        dataset.location = LOCATION
        bq_client.create_dataset(dataset)
        print(f"✓ Created dataset: {dataset_ref}")

    # Create table
    table = bq_client.create_table(table, exists_ok=True)
    print(f"✓ Table ready: {table_ref}")


# ════════════════════════════════════════════════════════════════
# CLOUD RUN ENTRY POINT
# ════════════════════════════════════════════════════════════════
# This is what Pub/Sub triggers when a file lands in GCS.

def process_gcs_event(event: dict):
    """
    Triggered by Pub/Sub when a new file lands in the coaching-transcripts/ folder.
    Downloads the file, extracts insights via Gemini, loads to BigQuery.
    """
    bucket_name = event.get("bucket", BUCKET_NAME)
    file_name = event.get("name", "")

    # Only process files in coaching-transcripts/
    if not file_name.startswith("coaching-transcripts/"):
        print(f"Skipping {file_name} — not a coaching transcript")
        return

    # Only process .txt files
    if not file_name.endswith(".txt"):
        print(f"Skipping {file_name} — not a .txt file")
        return

    print(f"Processing: {file_name}")

    # 1. Download transcript from GCS
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(file_name)
    transcript_text = blob.download_as_text()

    word_count = len(transcript_text.split())
    print(f"Transcript: {word_count} words")

    # 2. Extract insights via Gemini
    insights = extract_insights_from_transcript(transcript_text, file_name)
    print(f"Extracted: {len(insights)} insights")

    # 3. Load to BigQuery
    rows_loaded = load_to_bigquery(insights, source_filename=file_name)

    # 4. Move processed file to /processed/ subfolder (optional cleanup)
    processed_path = file_name.replace("coaching-transcripts/", "coaching-transcripts/processed/")
    bucket.rename_blob(blob, processed_path)
    print(f"Moved to: {processed_path}")

    return {
        "file": file_name,
        "words": word_count,
        "insights_extracted": len(insights),
        "rows_loaded": rows_loaded
    }


# ════════════════════════════════════════════════════════════════
# LOCAL TESTING (run this file directly to test)
# ════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # Test with a sample transcript
    sample = """
    Coach: Alright so the number one mistake I see people make with product research
    is they look at what's trending on TikTok and try to sell it on Facebook. Those are
    completely different audiences. TikTok trends are impulse buys under $20. Facebook
    buyers are problem-aware and willing to spend $40-80 on something that solves a real issue.

    Student: So what price range should we target for Facebook?

    Coach: For Facebook, your sweet spot is $39-79 retail with at least 3x markup from
    your landed cost. So if you're selling at $59, your product plus shipping from supplier
    should be under $20. That gives you enough margin to spend $15-20 on acquisition and
    still be profitable. The moment your margins drop below 3x, scaling becomes really hard
    because you can't absorb the bad days.

    Student: What about higher ticket? Like $100+?

    Coach: Higher ticket works but you need more trust elements. Video ads, landing pages
    with testimonials, maybe a comparison table. Static ads alone won't carry a $100+ product
    unless you've got insane social proof — like 5000+ reviews. For your first product,
    stay in the $39-79 range. It's the proving ground.
    """

    print("Testing extraction...")
    insights = extract_insights_from_transcript(sample, "test-transcript.txt")
    print(json.dumps(insights, indent=2))
    print(f"\nExtracted {len(insights)} insights from sample.")
