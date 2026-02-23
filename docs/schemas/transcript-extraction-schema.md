# Transcript Extraction Schema

> Canonical schema for extracting structured intelligence from AI Com coaching call transcripts (4+ hour classes).
> These are educational recordings where coaches and students discuss products, strategies, psychology, and real-world results.
> Used by: `wf-gdrive-product-importer-v2.json` → Vertex AI Gemini prompt → Express ingest endpoint.

---

## Top-Level Response Object

```json
{
  "products": [ ... ],
  "niches": [ ... ],
  "patterns": [ ... ],
  "psychology": [ ... ],
  "caseStudies": [ ... ],
  "entities": { ... },
  "callMeta": { ... },
  "summary": "string (human-readable extraction summary)"
}
```

---

## 1. Products

Products mentioned or discussed during the call — by the coach, students, or in Q&A.
Not revenue data — just what was talked about and why it matters.

```json
{
  "productName": "string (2-5 words, normalized)",
  "niche": "string (category this product sits in)",
  "whyMentioned": "string (context — was it a win, a failure, an example, a student question?)",
  "mentionContext": "string (1-2 sentence quote from transcript)",
  "speakerRole": "coach | student | unknown",
  "verdict": "promising | cautionary | neutral | failed",
  "painPoint": "string or null (the human problem this product solves)",
  "targetAvatar": "string or null (who buys this — 'new moms', 'men 25-40 with back pain')",
  "anglesSuggested": ["string array of ad angles or hooks discussed for this product"],
  "objections": ["string array of objections or risks mentioned"],
  "platformsMentioned": ["TikTok", "Amazon", "Facebook"]
}
```

**verdict definitions:**
- `promising` = coach or experienced student says this is worth testing / is currently working
- `cautionary` = discussed as risky, saturated, or "be careful with this"
- `neutral` = mentioned in passing, used as an example, no strong opinion
- `failed` = someone tried it and it didn't work — lesson learned

---

## 2. Niches

Market categories and verticals discussed — trends, opportunities, warnings.

```json
{
  "nicheName": "string (e.g., 'pets', 'home fitness', 'pain relief', 'beauty tools')",
  "outlook": "hot | warming | cooling | dead | evergreen",
  "reasoning": "string (why this niche was discussed this way)",
  "mentionContext": "string (quote from transcript)",
  "audienceInsight": "string or null (who's buying in this niche and why)",
  "seasonality": "string or null (e.g., 'Q4 gift season', 'summer product', 'year-round')",
  "productsLinked": ["product names from products[] that belong to this niche"]
}
```

**outlook definitions:**
- `hot` = actively working right now, multiple people scaling in it
- `warming` = early signs of opportunity, not crowded yet
- `cooling` = was good, getting saturated or declining
- `dead` = oversaturated, margins collapsed, everyone's in it
- `evergreen` = always works, not trend-dependent (e.g., pain relief, pet)

---

## 3. Patterns

Strategies, tactics, mistakes, and operational wisdom from the call.
This is the "operator playbook" — the knowledge that separates winners from losers.

```json
{
  "patternName": "string (short label, e.g., 'Pain-first hook structure', 'Test 3 creatives before scaling')",
  "patternType": "strategy | tactic | mistake | warning | framework",
  "description": "string (2-3 sentence explanation)",
  "mentionContext": "string (quote from transcript)",
  "category": "product_selection | ad_creative | offer_design | scaling | mindset | fulfillment | testing | funnel | general",
  "sentiment": "do_this | avoid_this | depends",
  "speakerRole": "coach | student | unknown"
}
```

**patternType definitions:**
- `strategy` = high-level approach (e.g., "always validate demand before sourcing")
- `tactic` = specific executable technique (e.g., "use Spanish ads from KaloData that others skip")
- `mistake` = something that cost money or time (e.g., "launched 10 products without testing any creatives first")
- `warning` = risk to watch for (e.g., "suppliers ghost you after Chinese New Year")
- `framework` = mental model or decision process (e.g., "the 3-day creative testing framework")

---

## 4. Psychology

Buyer psychology, persuasion principles, and human behavior insights discussed in the call.
These drive ad creative, offer structure, and product selection decisions.

```json
{
  "insightName": "string (short label, e.g., 'Loss aversion in pain products', 'Social proof stacking')",
  "principle": "string (the underlying psychological principle)",
  "application": "string (how to use this in ecommerce — ads, offers, landing pages, product choice)",
  "mentionContext": "string (quote from transcript)",
  "category": "buyer_behavior | persuasion | objection_handling | emotional_trigger | cognitive_bias | social_dynamics",
  "examples": ["string array of concrete examples given in the call"]
}
```

**category definitions:**
- `buyer_behavior` = how people shop, browse, decide (e.g., "impulse buyers scroll past price if the pain is strong enough")
- `persuasion` = influence techniques (e.g., "urgency + scarcity + social proof triple stack")
- `objection_handling` = overcoming resistance (e.g., "address 'does it actually work?' in the first 3 seconds")
- `emotional_trigger` = emotions that drive purchases (e.g., "embarrassment is stronger than convenience for selling")
- `cognitive_bias` = mental shortcuts (e.g., "anchoring with a high compare-at price")
- `social_dynamics` = identity, status, belonging (e.g., "pet owners see themselves as parents — market to that identity")

---

## 5. Case Studies

Real results shared by coaches or students — wins, failures, and lessons.
These are the most valuable parts of coaching calls.

```json
{
  "title": "string (e.g., 'Student hit $50k/month with posture corrector')",
  "outcome": "win | loss | mixed | in_progress",
  "speakerRole": "coach | student",
  "productOrNiche": "string (what product/niche this is about)",
  "keyNumbers": {
    "revenue": "string or null (e.g., '$50k/month', '$200/day')",
    "adSpend": "string or null",
    "margin": "string or null",
    "timeline": "string or null (e.g., '3 weeks to profitable')",
    "other": "string or null"
  },
  "whatWorked": ["string array of things that drove the result"],
  "whatFailed": ["string array of things that didn't work"],
  "lessonsLearned": ["string array of takeaways"],
  "mentionContext": "string (quote from transcript)"
}
```

---

## 6. Entities (Lightweight — for search and RAG)

All named things mentioned in the call, for indexing and cross-referencing.

```json
{
  "products": ["string array of all product names mentioned"],
  "niches": ["string array of all niches/categories mentioned"],
  "platforms": ["TikTok", "Amazon", "Facebook", "Shopify", "AliExpress"],
  "tools": ["KaloData", "Minea", "PiPiAds", "AdSpy", "Canva"],
  "people": ["speaker names, student names mentioned"],
  "brands": ["competitor brand names mentioned"]
}
```

---

## 7. Call Metadata

Context about the call itself.

```json
{
  "callDate": "string or null (date of the coaching call if mentioned)",
  "callType": "weekly_call | community_call | onboarding | masterclass | q_and_a | unknown",
  "mainTopics": ["string array of 3-5 main topics covered"],
  "speakerNames": ["names of coaches/speakers identified"],
  "studentQuestions": ["string array of notable questions students asked"]
}
```

---

## Storage Strategy

### In Express/Postgres (operational — app reads this)

| Table | Primary Key | Contents |
|-------|-------------|----------|
| `transcripts` | `id` (auto) | docId, docTitle, docUrl, extractedAt, summary, callMeta (JSONB) |
| `transcript_products` | `id` (auto) | FK transcript_id, all product fields, signals as JSONB |
| `transcript_niches` | `id` (auto) | FK transcript_id, nicheName, outlook, reasoning, audienceInsight, seasonality |
| `transcript_patterns` | `id` (auto) | FK transcript_id, patternName, patternType, description, category, sentiment |
| `transcript_psychology` | `id` (auto) | FK transcript_id, insightName, principle, application, category, examples (text[]) |
| `transcript_case_studies` | `id` (auto) | FK transcript_id, title, outcome, keyNumbers (JSONB), whatWorked (text[]), whatFailed (text[]), lessonsLearned (text[]) |
| `transcript_entities` | `id` (auto) | FK transcript_id, entities (JSONB) |

### Dedupe Keys

- Product: `hash(lowercase(productName) + lowercase(niche))`
- Niche: `hash(lowercase(nicheName))`
- Pattern: `hash(lowercase(patternName) + patternType)`
- Psychology: `hash(lowercase(insightName) + category)`
- Case Study: `hash(lowercase(title) + outcome)`

---

## Notes

- **No revenue/scraper metrics** — those belong to the Apify pipeline (KaloData, Amazon scrapers), not transcript extraction
- **`mentionContext`** on every entity = audit trail back to source transcript
- **`speakerRole`** distinguishes coach authority from student experience
- **Psychology layer** is unique to this pipeline — coaching calls are where persuasion and buyer behavior principles get taught
- **Case studies** are the highest-signal items — real results with real numbers from real operators
- **Patterns feed the RAG copilot** — queryable as "what strategies work for scaling?" or "what mistakes to avoid in pet niche?"
