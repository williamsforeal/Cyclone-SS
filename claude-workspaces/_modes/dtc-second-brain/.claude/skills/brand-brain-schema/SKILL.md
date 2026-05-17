---
name: brand-brain-schema
description: Use this skill whenever the user asks Claude to set up, compile, or query a DTC brand brain. Defines the canonical raw/ → wiki/ → outputs/ structure, the six core wiki articles, the cross-linking rules, and the source-citation requirements. Activates on /compile-wiki, /scaffold-brain, and any brand-brain question.
---

# Brand Brain Schema

**Purpose:** The structural contract for Jake's DTC brand brain. Every raw file maps to a wiki article. Every wiki claim cites a raw source. Every output compounds back into the wiki on next compile.

---

## CANONICAL STRUCTURE

```
<brand>-brain/
├── raw/                  ← Source material (Jake writes; Claude reads)
│   ├── ads/              → fuels wiki/hooks-that-work.md + performance-patterns.md
│   ├── customers/        → fuels wiki/customer-pains.md
│   ├── competitors/      → fuels wiki/competitor-angles.md
│   ├── brand/            → fuels wiki/brand-voice.md
│   ├── performance/      → fuels wiki/performance-patterns.md
│   └── notes/            → fuels wiki/creative-brief-library.md (+ all articles)
├── wiki/                 ← Synthesized intelligence (Claude maintains)
│   ├── INDEX.md
│   ├── hooks-that-work.md
│   ├── customer-pains.md
│   ├── competitor-angles.md
│   ├── brand-voice.md
│   ├── performance-patterns.md
│   └── creative-brief-library.md
└── outputs/              ← Answers and reports (Claude writes; feeds back into next compile)
    ├── briefs/
    ├── question-answers/
    └── health-checks/
```

---

## RAW FOLDER CONTENTS (what Jake drops in)

### `raw/ads/`
- Meta Ads performance CSV (last 30-90 days)
- TikTok Ads performance CSV
- Top 20 performing creative screenshots
- Ad copy text files (top 10 ads' copy)
- GetHookd exports of competitor winners

### `raw/customers/`
- Reviews export (Judge.me, Yotpo, Trustpilot)
- Customer survey responses
- Customer interview transcripts
- Support ticket themes
- Reddit threads / Amazon Q&A relevant to the niche

### `raw/competitors/`
- Competitor ad screenshots (Meta Ad Library)
- Competitor landing page screenshots or copy dumps
- Brand positioning notes
- TrendTrack competitor briefs

### `raw/brand/`
- Brand voice document
- Positioning statement
- Value proposition canvas
- StoryBrand BrandScript
- Avatar docs
- Necessary Beliefs doc

### `raw/performance/`
- Weekly performance reports
- Monthly business reviews
- GA4 / Shopify analytics exports
- Email/SMS campaign performance
- LTV/CAC reports

### `raw/notes/`
- Meeting notes (coach reviews, strategy sessions)
- Loose ideas and observations
- Hypotheses to test
- Things Jake noticed in the market

---

## THE SIX WIKI ARTICLES (templates)

Each article follows the same structure:

```markdown
# <Article Title>
**Last compiled:** <YYYY-MM-DD>
**Brand:** <name>
**Sources read:** <count of raw files this compile>

---

## Summary
[3-5 sentence executive summary]

## Key findings
[The most important insights, ranked]

## Detailed analysis
[Section-by-section breakdown with source citations]

## Cross-links
- See also: wiki/<other-article>.md for [topic]

## [VERIFY] flags
[Any claims that need human verification]
```

### Article: `hooks-that-work.md`
Synthesizes from `raw/ads/` and `raw/performance/`.

Contains:
- Top 10 hooks by performance (CTR, hook rate, conversion)
- Hook patterns (pattern interrupts, curiosity, pain-first, social proof)
- Hook + angle pairings that compound
- Failed hooks and why
- Hook types underrepresented in current testing

### Article: `customer-pains.md`
Synthesizes from `raw/customers/`.

Contains:
- Top 10 pain points by frequency in reviews/support
- Internal vs external vs philosophical pain (StoryBrand schema)
- Pain points that map to existing ads
- Pain points NOT being addressed (creative whitespace)
- Customer voice samples (paraphrased, never quoted directly per Meta compliance)

### Article: `competitor-angles.md`
Synthesizes from `raw/competitors/`.

Contains:
- Top competitors and their dominant angles
- Saturated angles to avoid
- Competitor weaknesses / underserved angles
- Where Jake's brand has positioning whitespace
- Competitor's evolution over time (what they've moved away from)

### Article: `brand-voice.md`
Synthesizes from `raw/brand/`.

Contains:
- Brand voice attributes (tone, vocabulary, sentence structure)
- StoryBrand role definitions for this brand
- Jungian archetype mapping (if applicable)
- Drift detection — where ads/copy diverge from voice
- Voice examples (best-fit copy from `raw/ads/`)

### Article: `performance-patterns.md`
Synthesizes from `raw/performance/` and `raw/ads/`.

Contains:
- What's correlated with winners (hook type, angle, format, length)
- What's correlated with losers
- Seasonal patterns
- Audience patterns (which demos convert best)
- Day-of-week / time-of-day patterns (if data supports)

### Article: `creative-brief-library.md`
Synthesizes from `raw/notes/` and `outputs/`.

Contains:
- Past creative briefs (what was planned, what shipped)
- Templates for new briefs
- Lessons from each campaign
- Open hypotheses to test

---

## INDEX.md (auto-maintained)

```markdown
# Brand Brain Index — <Brand>
**Last compiled:** <date>
**Total raw files:** <count>
**Total questions answered:** <count from outputs/>

## Articles
1. hooks-that-work.md — [last summary]
2. customer-pains.md — [last summary]
...

## Recent questions asked
- [Date] [Question slug] → outputs/<file>
- ...

## Health
- Last health check: <date>
- Contradictions outstanding: <count>
- Articles with no source citation: <count>
```

---

## COMPILATION RULES

When `/compile-wiki` runs:

1. **Read every file in `raw/`**, top to bottom
2. **For each wiki article**, synthesize the relevant raw files into the article structure
3. **Cite sources inline** — `(source: raw/ads/meta-q1-export.csv, row 47)`
4. **Cross-link aggressively** — every article should link to ≥2 other articles where topics intersect
5. **Update INDEX.md** with the new compile date and any summary changes
6. **Pull from `outputs/`** — saved answers from prior questions feed back in
7. **Flag contradictions** — if `raw/brand/voice.md` says "premium" but `raw/ads/` performance favors casual, surface that conflict in `brand-voice.md`
8. **Do NOT invent claims.** If a topic isn't covered in `raw/`, the wiki should say so explicitly, not guess.

---

## QUERY RULES

When Jake asks a question against the brain:

1. **Read the relevant wiki articles** first (always — they're the synthesis layer)
2. **Dip into `raw/`** if the wiki doesn't have enough detail
3. **Cite sources** in the answer — point Jake to specific files
4. **Save the answer** to `outputs/question-answers/<slug>-<date>.md`
5. **Flag any [VERIFY]** if the answer hinges on unverified data
