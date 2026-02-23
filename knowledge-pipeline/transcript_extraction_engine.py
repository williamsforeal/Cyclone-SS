"""
TRANSCRIPT EXTRACTION ENGINE (v2 — Normalized Schema)
Processes raw coaching call transcripts → structured BigQuery rows across 7 tables.

Flow: GCS file lands → Pub/Sub triggers → this function runs →
      Gemini extracts insights → rows land in BigQuery bomb_ecom dataset.

Deploy as: Cloud Run service (triggered by Pub/Sub)
Model: Gemini 2.0 Flash (fast, cheap, handles 30k+ word transcripts)

Target dataset: bomb_ecom
Tables: raw_transcripts, stg_transcript_products, stg_transcript_niches,
        stg_transcript_patterns, stg_transcript_psychology,
        stg_transcript_case_studies, stg_transcript_calls
"""

import hashlib
import json
import os
from datetime import datetime
from google.cloud import bigquery, storage
import vertexai
from vertexai.generative_models import GenerativeModel

# ── Config ──────────────────────────────────────────────────────
PROJECT_ID = os.environ.get("GCP_PROJECT_ID", "gen-lang-client-0234791928")
LOCATION = os.environ.get("GCP_LOCATION", "us-central1")
DATASET_ID = "bomb_ecom"
BUCKET_NAME = os.environ.get("GCS_BUCKET", "jake-ecom-knowledge")

# ── Initialize clients ──────────────────────────────────────────
vertexai.init(project=PROJECT_ID, location=LOCATION)
bq_client = bigquery.Client(project=PROJECT_ID)
storage_client = storage.Client(project=PROJECT_ID)


def _hash_id(*parts: str) -> str:
    """Generate deterministic ID from concatenated parts."""
    combined = "|".join(str(p).lower().strip() for p in parts)
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()[:16]


# ════════════════════════════════════════════════════════════════
# THE EXTRACTION PROMPT (v2 — matches transcript-extraction-schema.md)
# ════════════════════════════════════════════════════════════════

EXTRACTION_PROMPT = """
You are a marketing intelligence analyst processing ecommerce coaching call transcripts.
These are 1-4+ hour recordings where coaches and students discuss products, strategies,
psychology, and real-world results.

Your job: extract EVERY actionable piece of intelligence and return it as structured JSON.

## OUTPUT FORMAT

Return ONLY a JSON object (no markdown, no explanation, no preamble) with these keys:

```json
{
  "products": [...],
  "niches": [...],
  "patterns": [...],
  "psychology": [...],
  "caseStudies": [...],
  "entities": {...},
  "callMeta": {...},
  "summary": "string"
}
```

## 1. Products

Products mentioned or discussed — by the coach, students, or in Q&A.

```json
{
  "productName": "string (2-5 words, normalized)",
  "niche": "string (category this product sits in)",
  "whyMentioned": "string (context — was it a win, a failure, an example, a student question?)",
  "mentionContext": "string (1-2 sentence quote from transcript)",
  "speakerRole": "coach | student | unknown",
  "verdict": "promising | cautionary | neutral | failed",
  "painPoint": "string or null (the human problem this product solves)",
  "targetAvatar": "string or null (who buys this)",
  "anglesSuggested": ["string array of ad angles/hooks discussed"],
  "objections": ["string array of objections or risks mentioned"],
  "platformsMentioned": ["TikTok", "Amazon", "Facebook"]
}
```

## 2. Niches

Market categories and verticals discussed — trends, opportunities, warnings.

```json
{
  "nicheName": "string (e.g., 'pets', 'home fitness', 'pain relief')",
  "outlook": "hot | warming | cooling | dead | evergreen",
  "reasoning": "string (why discussed this way)",
  "mentionContext": "string (quote from transcript)",
  "audienceInsight": "string or null (who's buying and why)",
  "seasonality": "string or null (e.g., 'Q4 gift season', 'year-round')",
  "productsLinked": ["product names from products[] that belong to this niche"]
}
```

## 3. Patterns

Strategies, tactics, mistakes, and operational wisdom.

```json
{
  "patternName": "string (short label, e.g., 'Pain-first hook structure')",
  "patternType": "strategy | tactic | mistake | warning | framework",
  "description": "string (2-3 sentence explanation)",
  "mentionContext": "string (quote from transcript)",
  "category": "product_selection | ad_creative | offer_design | scaling | mindset | fulfillment | testing | funnel | general",
  "sentiment": "do_this | avoid_this | depends",
  "speakerRole": "coach | student | unknown"
}
```

## 4. Psychology

Buyer psychology, persuasion principles, and human behavior insights.

```json
{
  "insightName": "string (short label)",
  "principle": "string (the underlying psychological principle)",
  "application": "string (how to use this in ecommerce)",
  "mentionContext": "string (quote from transcript)",
  "category": "buyer_behavior | persuasion | objection_handling | emotional_trigger | cognitive_bias | social_dynamics",
  "examples": ["concrete examples given in the call"]
}
```

## 5. Case Studies

Real results shared by coaches or students.

```json
{
  "title": "string (e.g., 'Student hit $50k/month with posture corrector')",
  "outcome": "win | loss | mixed | in_progress",
  "speakerRole": "coach | student",
  "productOrNiche": "string",
  "keyNumbers": {
    "revenue": "string or null",
    "adSpend": "string or null",
    "margin": "string or null",
    "timeline": "string or null",
    "other": "string or null"
  },
  "whatWorked": ["string array"],
  "whatFailed": ["string array"],
  "lessonsLearned": ["string array"],
  "mentionContext": "string (quote from transcript)"
}
```

## 6. Entities (for search/indexing)

```json
{
  "products": ["all product names mentioned"],
  "niches": ["all niches/categories mentioned"],
  "platforms": ["TikTok", "Amazon", "Facebook", "Shopify"],
  "tools": ["KaloData", "Minea", "PiPiAds"],
  "people": ["speaker names, student names"],
  "brands": ["competitor brand names"]
}
```

## 7. Call Metadata

```json
{
  "callDate": "string or null (date if mentioned)",
  "callType": "weekly_call | community_call | onboarding | masterclass | q_and_a | unknown",
  "mainTopics": ["3-5 main topics covered"],
  "speakerNames": ["names of coaches/speakers"],
  "studentQuestions": ["notable questions students asked"]
}
```

## EXTRACTION RULES

- Extract EVERY distinct insight. A 4-hour call may have 50+ products, 100+ patterns.
- Each item is ONE atomic idea. Don't combine multiple concepts.
- Preserve specific numbers, thresholds, and metrics exactly as stated.
- mentionContext on EVERY entity = audit trail back to source transcript.
- speakerRole distinguishes coach authority from student experience.
- Ignore small talk, introductions, housekeeping. Only extract substantive content.
- If someone asks a question that gets a detailed answer, extract the ANSWER.

Now process this transcript:
"""


# ════════════════════════════════════════════════════════════════
# PROCESSING FUNCTIONS
# ════════════════════════════════════════════════════════════════

def extract_from_transcript(transcript_text: str, filename: str = "") -> dict:
    """
    Send transcript to Gemini → get structured extraction back.
    Returns the full extraction dict (products, niches, patterns, etc.)
    """
    model = GenerativeModel("gemini-2.0-flash-001")

    word_count = len(transcript_text.split())

    if word_count > 100000:
        chunks = chunk_transcript(transcript_text, chunk_size=50000, overlap=2000)
        all_extractions = []
        for i, chunk in enumerate(chunks):
            print(f"Processing chunk {i+1}/{len(chunks)} ({len(chunk.split())} words)")
            extraction = _call_gemini(model, chunk)
            if extraction:
                all_extractions.append(extraction)
        return merge_extractions(all_extractions)
    else:
        return _call_gemini(model, transcript_text) or _empty_extraction()


def _call_gemini(model: GenerativeModel, text: str) -> dict | None:
    """Single Gemini API call. Returns parsed JSON dict."""

    full_prompt = EXTRACTION_PROMPT + "\n\n" + text

    response = model.generate_content(
        full_prompt,
        generation_config={
            "temperature": 0.2,
            "max_output_tokens": 8192,
            "response_mime_type": "application/json"
        }
    )

    try:
        result = json.loads(response.text)
        if isinstance(result, dict):
            return result
        print(f"Warning: Expected dict, got {type(result)}")
        return None
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        print(f"Raw response: {response.text[:500]}")
        import re
        match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        return None


def _empty_extraction() -> dict:
    """Return empty extraction structure."""
    return {
        "products": [], "niches": [], "patterns": [],
        "psychology": [], "caseStudies": [],
        "entities": {"products": [], "niches": [], "platforms": [], "tools": [], "people": [], "brands": []},
        "callMeta": {"callDate": None, "callType": "unknown", "mainTopics": [], "speakerNames": [], "studentQuestions": []},
        "summary": ""
    }


def merge_extractions(extractions: list[dict]) -> dict:
    """Merge multiple chunk extractions into one, deduplicating."""
    merged = _empty_extraction()

    for ext in extractions:
        merged["products"].extend(ext.get("products", []))
        merged["niches"].extend(ext.get("niches", []))
        merged["patterns"].extend(ext.get("patterns", []))
        merged["psychology"].extend(ext.get("psychology", []))
        merged["caseStudies"].extend(ext.get("caseStudies", []))
        merged["summary"] += " " + ext.get("summary", "")

        # Merge entities (union of arrays)
        for key in ("products", "niches", "platforms", "tools", "people", "brands"):
            src = ext.get("entities", {}).get(key, [])
            merged["entities"][key] = list(set(merged["entities"][key] + src))

        # Use call metadata from first chunk that has it
        ext_meta = ext.get("callMeta", {})
        if ext_meta.get("callType") and ext_meta["callType"] != "unknown" and merged["callMeta"]["callType"] == "unknown":
            merged["callMeta"] = ext_meta

    # Deduplicate by name fields
    merged["products"] = _dedup_by_key(merged["products"], "productName")
    merged["niches"] = _dedup_by_key(merged["niches"], "nicheName")
    merged["patterns"] = _dedup_by_key(merged["patterns"], "patternName")
    merged["psychology"] = _dedup_by_key(merged["psychology"], "insightName")
    merged["caseStudies"] = _dedup_by_key(merged["caseStudies"], "title")
    merged["summary"] = merged["summary"].strip()

    return merged


def _dedup_by_key(items: list[dict], key: str) -> list[dict]:
    """Remove duplicates based on a key field (case-insensitive)."""
    seen = set()
    unique = []
    for item in items:
        val = item.get(key, "").lower().strip()
        if val and val not in seen:
            seen.add(val)
            unique.append(item)
    return unique


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


# ════════════════════════════════════════════════════════════════
# BIGQUERY LOADING (v2 — normalized multi-table)
# ════════════════════════════════════════════════════════════════

def load_to_bigquery(extraction: dict, doc_id: str, doc_title: str,
                     doc_url: str = None, raw_text: str = None) -> dict:
    """
    Load extracted data into BigQuery bomb_ecom tables.
    Returns dict of {table_name: rows_inserted}.
    """
    now = datetime.now().isoformat()
    transcript_id = _hash_id(doc_id)
    counts = {}

    # 1. Raw transcript
    raw_row = {
        "transcript_id": transcript_id,
        "doc_id": doc_id,
        "doc_title": doc_title,
        "doc_url": doc_url,
        "raw_text": (raw_text or "")[:12000],
        "extraction_json": json.dumps(extraction),
        "extracted_at": now,
    }
    counts["raw_transcripts"] = _insert_rows("raw_transcripts", [raw_row])

    # 2. Products
    product_rows = []
    for p in extraction.get("products", []):
        product_rows.append({
            "id": _hash_id(transcript_id, p.get("productName", ""), p.get("niche", "")),
            "transcript_id": transcript_id,
            "doc_title": doc_title,
            "product_name": p.get("productName", "unknown"),
            "niche": p.get("niche"),
            "why_mentioned": p.get("whyMentioned"),
            "mention_context": p.get("mentionContext"),
            "speaker_role": p.get("speakerRole"),
            "verdict": p.get("verdict"),
            "pain_point": p.get("painPoint"),
            "target_avatar": p.get("targetAvatar"),
            "angles_suggested": p.get("anglesSuggested", []),
            "objections": p.get("objections", []),
            "platforms": p.get("platformsMentioned", []),
            "extracted_at": now,
        })
    counts["stg_transcript_products"] = _insert_rows("stg_transcript_products", product_rows)

    # 3. Niches
    niche_rows = []
    for n in extraction.get("niches", []):
        niche_rows.append({
            "id": _hash_id(transcript_id, n.get("nicheName", "")),
            "transcript_id": transcript_id,
            "doc_title": doc_title,
            "niche_name": n.get("nicheName", "unknown"),
            "outlook": n.get("outlook"),
            "reasoning": n.get("reasoning"),
            "mention_context": n.get("mentionContext"),
            "audience_insight": n.get("audienceInsight"),
            "seasonality": n.get("seasonality"),
            "products_linked": n.get("productsLinked", []),
            "extracted_at": now,
        })
    counts["stg_transcript_niches"] = _insert_rows("stg_transcript_niches", niche_rows)

    # 4. Patterns
    pattern_rows = []
    for p in extraction.get("patterns", []):
        pattern_rows.append({
            "id": _hash_id(transcript_id, p.get("patternName", ""), p.get("patternType", "")),
            "transcript_id": transcript_id,
            "doc_title": doc_title,
            "pattern_name": p.get("patternName", "unknown"),
            "pattern_type": p.get("patternType"),
            "description": p.get("description"),
            "mention_context": p.get("mentionContext"),
            "category": p.get("category"),
            "sentiment": p.get("sentiment"),
            "speaker_role": p.get("speakerRole"),
            "extracted_at": now,
        })
    counts["stg_transcript_patterns"] = _insert_rows("stg_transcript_patterns", pattern_rows)

    # 5. Psychology
    psych_rows = []
    for p in extraction.get("psychology", []):
        psych_rows.append({
            "id": _hash_id(transcript_id, p.get("insightName", ""), p.get("category", "")),
            "transcript_id": transcript_id,
            "doc_title": doc_title,
            "insight_name": p.get("insightName", "unknown"),
            "principle": p.get("principle"),
            "application": p.get("application"),
            "mention_context": p.get("mentionContext"),
            "category": p.get("category"),
            "examples": p.get("examples", []),
            "extracted_at": now,
        })
    counts["stg_transcript_psychology"] = _insert_rows("stg_transcript_psychology", psych_rows)

    # 6. Case Studies
    case_rows = []
    for c in extraction.get("caseStudies", []):
        numbers = c.get("keyNumbers", {})
        case_rows.append({
            "id": _hash_id(transcript_id, c.get("title", "")),
            "transcript_id": transcript_id,
            "doc_title": doc_title,
            "title": c.get("title", "unknown"),
            "outcome": c.get("outcome"),
            "speaker_role": c.get("speakerRole"),
            "product_or_niche": c.get("productOrNiche"),
            "revenue": numbers.get("revenue"),
            "ad_spend": numbers.get("adSpend"),
            "margin": numbers.get("margin"),
            "timeline": numbers.get("timeline"),
            "other_numbers": numbers.get("other"),
            "what_worked": c.get("whatWorked", []),
            "what_failed": c.get("whatFailed", []),
            "lessons_learned": c.get("lessonsLearned", []),
            "mention_context": c.get("mentionContext"),
            "extracted_at": now,
        })
    counts["stg_transcript_case_studies"] = _insert_rows("stg_transcript_case_studies", case_rows)

    # 7. Call metadata
    meta = extraction.get("callMeta", {})
    call_row = {
        "transcript_id": transcript_id,
        "doc_id": doc_id,
        "doc_title": doc_title,
        "doc_url": doc_url,
        "call_date": _parse_date(meta.get("callDate")),
        "call_type": meta.get("callType", "unknown"),
        "main_topics": meta.get("mainTopics", []),
        "speaker_names": meta.get("speakerNames", []),
        "student_questions": meta.get("studentQuestions", []),
        "product_count": len(extraction.get("products", [])),
        "niche_count": len(extraction.get("niches", [])),
        "pattern_count": len(extraction.get("patterns", [])),
        "psychology_count": len(extraction.get("psychology", [])),
        "case_study_count": len(extraction.get("caseStudies", [])),
        "summary": extraction.get("summary", ""),
        "extracted_at": now,
    }
    counts["stg_transcript_calls"] = _insert_rows("stg_transcript_calls", [call_row])

    total = sum(counts.values())
    print(f"✓ Loaded {total} total rows across {len(counts)} tables for {doc_title}")
    return counts


def _parse_date(raw_date: str | None) -> str | None:
    """Parse messy date strings from Gemini into YYYY-MM-DD format. Returns None if unparseable."""
    if not raw_date:
        return None
    from dateutil import parser as dateparser
    try:
        parsed = dateparser.parse(raw_date, fuzzy=True)
        return parsed.strftime("%Y-%m-%d") if parsed else None
    except (ValueError, OverflowError):
        return None


def _insert_rows(table_name: str, rows: list[dict]) -> int:
    """Insert rows into a BigQuery table. Returns count inserted."""
    if not rows:
        return 0

    table_ref = f"{PROJECT_ID}.{DATASET_ID}.{table_name}"
    errors = bq_client.insert_rows_json(table_ref, rows)
    if errors:
        print(f"BigQuery insert errors for {table_name}: {errors}")
        raise Exception(f"Failed to insert into {table_name}: {errors}")

    return len(rows)


# ════════════════════════════════════════════════════════════════
# BIGQUERY TABLE CREATION (run once)
# ════════════════════════════════════════════════════════════════

def create_bigquery_tables():
    """Create the bomb_ecom dataset and all transcript extraction tables."""

    # Create dataset if needed
    dataset_ref = f"{PROJECT_ID}.{DATASET_ID}"
    try:
        bq_client.get_dataset(dataset_ref)
    except Exception:
        dataset = bigquery.Dataset(dataset_ref)
        dataset.location = LOCATION
        bq_client.create_dataset(dataset)
        print(f"✓ Created dataset: {dataset_ref}")

    tables = {
        "raw_transcripts": [
            bigquery.SchemaField("transcript_id", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("doc_id", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("doc_title", "STRING"),
            bigquery.SchemaField("doc_url", "STRING"),
            bigquery.SchemaField("raw_text", "STRING"),
            bigquery.SchemaField("extraction_json", "STRING"),
            bigquery.SchemaField("extracted_at", "TIMESTAMP", mode="REQUIRED"),
            bigquery.SchemaField("ingested_at", "TIMESTAMP"),
        ],
        "stg_transcript_products": [
            bigquery.SchemaField("id", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("transcript_id", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("doc_title", "STRING"),
            bigquery.SchemaField("product_name", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("niche", "STRING"),
            bigquery.SchemaField("why_mentioned", "STRING"),
            bigquery.SchemaField("mention_context", "STRING"),
            bigquery.SchemaField("speaker_role", "STRING"),
            bigquery.SchemaField("verdict", "STRING"),
            bigquery.SchemaField("pain_point", "STRING"),
            bigquery.SchemaField("target_avatar", "STRING"),
            bigquery.SchemaField("angles_suggested", "STRING", mode="REPEATED"),
            bigquery.SchemaField("objections", "STRING", mode="REPEATED"),
            bigquery.SchemaField("platforms", "STRING", mode="REPEATED"),
            bigquery.SchemaField("extracted_at", "TIMESTAMP", mode="REQUIRED"),
        ],
        "stg_transcript_niches": [
            bigquery.SchemaField("id", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("transcript_id", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("doc_title", "STRING"),
            bigquery.SchemaField("niche_name", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("outlook", "STRING"),
            bigquery.SchemaField("reasoning", "STRING"),
            bigquery.SchemaField("mention_context", "STRING"),
            bigquery.SchemaField("audience_insight", "STRING"),
            bigquery.SchemaField("seasonality", "STRING"),
            bigquery.SchemaField("products_linked", "STRING", mode="REPEATED"),
            bigquery.SchemaField("extracted_at", "TIMESTAMP", mode="REQUIRED"),
        ],
        "stg_transcript_patterns": [
            bigquery.SchemaField("id", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("transcript_id", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("doc_title", "STRING"),
            bigquery.SchemaField("pattern_name", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("pattern_type", "STRING"),
            bigquery.SchemaField("description", "STRING"),
            bigquery.SchemaField("mention_context", "STRING"),
            bigquery.SchemaField("category", "STRING"),
            bigquery.SchemaField("sentiment", "STRING"),
            bigquery.SchemaField("speaker_role", "STRING"),
            bigquery.SchemaField("extracted_at", "TIMESTAMP", mode="REQUIRED"),
        ],
        "stg_transcript_psychology": [
            bigquery.SchemaField("id", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("transcript_id", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("doc_title", "STRING"),
            bigquery.SchemaField("insight_name", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("principle", "STRING"),
            bigquery.SchemaField("application", "STRING"),
            bigquery.SchemaField("mention_context", "STRING"),
            bigquery.SchemaField("category", "STRING"),
            bigquery.SchemaField("examples", "STRING", mode="REPEATED"),
            bigquery.SchemaField("extracted_at", "TIMESTAMP", mode="REQUIRED"),
        ],
        "stg_transcript_case_studies": [
            bigquery.SchemaField("id", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("transcript_id", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("doc_title", "STRING"),
            bigquery.SchemaField("title", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("outcome", "STRING"),
            bigquery.SchemaField("speaker_role", "STRING"),
            bigquery.SchemaField("product_or_niche", "STRING"),
            bigquery.SchemaField("revenue", "STRING"),
            bigquery.SchemaField("ad_spend", "STRING"),
            bigquery.SchemaField("margin", "STRING"),
            bigquery.SchemaField("timeline", "STRING"),
            bigquery.SchemaField("other_numbers", "STRING"),
            bigquery.SchemaField("what_worked", "STRING", mode="REPEATED"),
            bigquery.SchemaField("what_failed", "STRING", mode="REPEATED"),
            bigquery.SchemaField("lessons_learned", "STRING", mode="REPEATED"),
            bigquery.SchemaField("mention_context", "STRING"),
            bigquery.SchemaField("extracted_at", "TIMESTAMP", mode="REQUIRED"),
        ],
        "stg_transcript_calls": [
            bigquery.SchemaField("transcript_id", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("doc_id", "STRING", mode="REQUIRED"),
            bigquery.SchemaField("doc_title", "STRING"),
            bigquery.SchemaField("doc_url", "STRING"),
            bigquery.SchemaField("call_date", "DATE"),
            bigquery.SchemaField("call_type", "STRING"),
            bigquery.SchemaField("main_topics", "STRING", mode="REPEATED"),
            bigquery.SchemaField("speaker_names", "STRING", mode="REPEATED"),
            bigquery.SchemaField("student_questions", "STRING", mode="REPEATED"),
            bigquery.SchemaField("product_count", "INT64"),
            bigquery.SchemaField("niche_count", "INT64"),
            bigquery.SchemaField("pattern_count", "INT64"),
            bigquery.SchemaField("psychology_count", "INT64"),
            bigquery.SchemaField("case_study_count", "INT64"),
            bigquery.SchemaField("summary", "STRING"),
            bigquery.SchemaField("extracted_at", "TIMESTAMP", mode="REQUIRED"),
        ],
    }

    for table_name, schema in tables.items():
        table_ref = f"{PROJECT_ID}.{DATASET_ID}.{table_name}"
        table = bigquery.Table(table_ref, schema=schema)
        table = bq_client.create_table(table, exists_ok=True)
        print(f"✓ Table ready: {table_ref}")


# ════════════════════════════════════════════════════════════════
# CLOUD RUN ENTRY POINT
# ════════════════════════════════════════════════════════════════

def process_gcs_event(event: dict):
    """
    Triggered by Pub/Sub when a new file lands in the coaching-transcripts/ folder.
    Downloads the file, extracts via Gemini, loads to BigQuery.
    """
    bucket_name = event.get("bucket", BUCKET_NAME)
    file_name = event.get("name", "")

    if not file_name.startswith("coaching-transcripts/"):
        print(f"Skipping {file_name} — not a coaching transcript")
        return

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

    # 2. Extract via Gemini
    extraction = extract_from_transcript(transcript_text, file_name)

    product_count = len(extraction.get("products", []))
    pattern_count = len(extraction.get("patterns", []))
    print(f"Extracted: {product_count} products, {pattern_count} patterns")

    # 3. Load to BigQuery
    counts = load_to_bigquery(
        extraction,
        doc_id=file_name,
        doc_title=file_name.split("/")[-1].replace(".txt", ""),
        raw_text=transcript_text,
    )

    # 4. Move processed file to /processed/ subfolder
    processed_path = file_name.replace("coaching-transcripts/", "coaching-transcripts/processed/")
    bucket.rename_blob(blob, processed_path)
    print(f"Moved to: {processed_path}")

    return {
        "file": file_name,
        "words": word_count,
        "tables": counts,
        "total_rows": sum(counts.values()),
    }


# ════════════════════════════════════════════════════════════════
# LOCAL TESTING
# ════════════════════════════════════════════════════════════════

if __name__ == "__main__":
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

    Student: I've been looking at posture correctors. There's a brand doing $200k/month
    on TikTok according to KaloData, but their reviews on Amazon are terrible — 3.2 stars.

    Coach: That's actually a great signal. High demand, poor execution by incumbents.
    The pain is real — back pain affects like 80% of office workers. Check if they're
    running Facebook ads too. If they're only on TikTok, that's your arbitrage opportunity.
    """

    print("Testing extraction (v2 — normalized schema)...")
    extraction = extract_from_transcript(sample, "test-transcript.txt")
    print(json.dumps(extraction, indent=2))

    print(f"\nExtracted:")
    for key in ("products", "niches", "patterns", "psychology", "caseStudies"):
        print(f"  {key}: {len(extraction.get(key, []))}")
