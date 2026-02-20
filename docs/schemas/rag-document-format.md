# RAG Document Format — Coaching Call Intelligence

> How transcript extractions get chunked, embedded, and stored for retrieval-augmented generation.
> Target: Vertex AI Embeddings → Vertex AI Vector Search (or BigQuery vector columns).

---

## Why a specific format matters

RAG doesn't work well on raw 4-hour transcripts. The retrieval step pulls chunks, and if your chunks are bad (too big, no metadata, mixed topics), the LLM gets garbage context and gives garbage answers.

The extraction schema already breaks calls into atomic units (products, patterns, psychology, etc.). Each unit becomes **one RAG document** with rich metadata for filtering.

---

## Document Structure

Every RAG document has three parts:

```json
{
  "id": "string (unique, deterministic — same as BigQuery dedupe key)",
  "text": "string (the content that gets embedded — what the vector search matches on)",
  "metadata": {
    "source_type": "string (product | niche | pattern | psychology | case_study | call_summary)",
    "transcript_id": "string",
    "doc_title": "string (coaching call name)",
    "call_date": "string or null",
    "call_type": "string",
    "category": "string (maps to the category field in each extraction type)",
    "speaker_role": "string (coach | student | unknown)",
    "sentiment": "string (where applicable)",
    "tags": ["string array for faceted filtering"]
  }
}
```

---

## Text Templates Per Source Type

The `text` field is what gets embedded. It needs to be a natural language paragraph that captures the meaning — not raw JSON.

### Product mention

```
Product: {productName} ({niche})
Verdict: {verdict}
Discussed by: {speakerRole}
Context: {whyMentioned}
Pain point: {painPoint}
Target buyer: {targetAvatar}
Ad angles: {anglesSuggested joined as sentence}
Risks/objections: {objections joined as sentence}
Source: "{mentionContext}"
```

### Niche insight

```
Niche: {nicheName}
Outlook: {outlook}
Why: {reasoning}
Who's buying: {audienceInsight}
Seasonality: {seasonality}
Related products: {productsLinked joined}
Source: "{mentionContext}"
```

### Pattern (strategy/tactic/mistake/warning/framework)

```
{patternType}: {patternName}
Category: {category}
Action: {sentiment}
{description}
Source: "{mentionContext}"
```

### Psychology insight

```
Psychology — {category}: {insightName}
Principle: {principle}
How to apply: {application}
Examples: {examples joined as sentence}
Source: "{mentionContext}"
```

### Case study

```
Case study: {title} ({outcome})
Product/niche: {productOrNiche}
Speaker: {speakerRole}
Numbers: revenue {revenue}, ad spend {adSpend}, margin {margin}, timeline {timeline}
What worked: {whatWorked joined}
What failed: {whatFailed joined}
Lessons: {lessonsLearned joined}
Source: "{mentionContext}"
```

### Call summary (one per transcript)

```
Coaching call: {docTitle}
Date: {callDate}, Type: {callType}
Topics covered: {mainTopics joined}
Speakers: {speakerNames joined}
Key student questions: {studentQuestions joined}
Summary: {summary}
Extracted {productCount} products, {nicheCount} niches, {patternCount} patterns, {psychologyCount} psychology insights, {caseStudyCount} case studies.
```

---

## Metadata Tags (for filtered retrieval)

Tags enable queries like "give me all psychology insights about ad creative" or "what did the coach say about pet niche?"

Build tags from:

| Source type | Tags derived from |
|-------------|-------------------|
| product | niche, verdict, platforms |
| niche | outlook, seasonality |
| pattern | patternType, category, sentiment |
| psychology | category |
| case_study | outcome, product_or_niche |
| call_summary | callType, mainTopics |

---

## Embedding Strategy

### Model
- **Vertex AI text-embedding-005** (768 dimensions, best for English retrieval)
- Endpoint: `us-central1-aiplatform.googleapis.com/v1/projects/gen-lang-client-0234791928/locations/us-central1/publishers/google/models/text-embedding-005:predict`

### Chunk size
- Each extraction unit (product, pattern, etc.) is already a natural chunk — **do not split further**
- Call summaries are one chunk per call
- If a `text` field exceeds 2048 tokens (rare), truncate `mentionContext` first

### Embedding call format
```json
{
  "instances": [
    { "content": "<text field from above>", "task_type": "RETRIEVAL_DOCUMENT" }
  ]
}
```

For queries at retrieval time:
```json
{
  "instances": [
    { "content": "what psychology principles work for pain products?", "task_type": "RETRIEVAL_QUERY" }
  ]
}
```

---

## Storage Options

### Option A: Vertex AI Vector Search (managed index)
- Store embeddings in a Vector Search index
- Store metadata in BigQuery (join on document ID after retrieval)
- Best for: high-volume, low-latency production queries

### Option B: BigQuery with vector columns (simpler)
- Add an `embedding ARRAY<FLOAT64>` column to each `stg_*` table
- Use `VECTOR_SEARCH()` function for approximate nearest neighbor
- Best for: keeping everything in one place, SQL-native queries, prototyping

**Recommended for your stage: Option B.** One less service to manage. You can switch to managed Vector Search later if query volume demands it.

### BigQuery vector column addition (run after base DDL)

```sql
ALTER TABLE `gen-lang-client-0234791928.bomb_ecom.stg_transcript_products`
  ADD COLUMN IF NOT EXISTS rag_text STRING,
  ADD COLUMN IF NOT EXISTS embedding ARRAY<FLOAT64>;

ALTER TABLE `gen-lang-client-0234791928.bomb_ecom.stg_transcript_niches`
  ADD COLUMN IF NOT EXISTS rag_text STRING,
  ADD COLUMN IF NOT EXISTS embedding ARRAY<FLOAT64>;

ALTER TABLE `gen-lang-client-0234791928.bomb_ecom.stg_transcript_patterns`
  ADD COLUMN IF NOT EXISTS rag_text STRING,
  ADD COLUMN IF NOT EXISTS embedding ARRAY<FLOAT64>;

ALTER TABLE `gen-lang-client-0234791928.bomb_ecom.stg_transcript_psychology`
  ADD COLUMN IF NOT EXISTS rag_text STRING,
  ADD COLUMN IF NOT EXISTS embedding ARRAY<FLOAT64>;

ALTER TABLE `gen-lang-client-0234791928.bomb_ecom.stg_transcript_case_studies`
  ADD COLUMN IF NOT EXISTS rag_text STRING,
  ADD COLUMN IF NOT EXISTS embedding ARRAY<FLOAT64>;

ALTER TABLE `gen-lang-client-0234791928.bomb_ecom.stg_transcript_calls`
  ADD COLUMN IF NOT EXISTS rag_text STRING,
  ADD COLUMN IF NOT EXISTS embedding ARRAY<FLOAT64>;
```

---

## Query Flow (how the RAG copilot works)

1. User asks: "What psychology principles work for selling pain products?"
2. Embed the query with `task_type: RETRIEVAL_QUERY`
3. `VECTOR_SEARCH()` across all `stg_*` tables (or a unified view) filtered by `metadata.source_type IN ('psychology', 'pattern')`
4. Return top 5-10 chunks
5. Feed chunks as context to Gemini/Claude with the original question
6. LLM synthesizes an answer with citations back to specific calls

---

## Example Queries the RAG Engine Should Answer

- "What products are coaches bullish on right now?"
- "What mistakes do students make when scaling?"
- "What ad angles work for pet products?"
- "How should I handle the 'does it work?' objection?"
- "What's the current outlook on the home fitness niche?"
- "Show me case studies of students who hit $50k/month — what did they do?"
- "What cognitive biases should I use in my landing page?"
- "What frameworks exist for testing creatives?"
