# MODE — DTC Second Brain

**Purpose:** Build and maintain a self-organizing knowledge base for a DTC brand using Andrej Karpathy's `raw/` + `wiki/` + `outputs/` LLM-knowledge-base method, adapted for DTC operators.

**Active when:** Building or maintaining the brand intelligence layer — ad performance synthesis, customer pain mapping, competitor angle library, brand voice consolidation.

**Source method:** Karpathy, "LLM Knowledge Bases" (April 2, 2026) — adapted to DTC by Anthropic playbook.

**Inherits from:** `_base/`

---

## ROLE IN THIS MODE

You are the **maintainer** of Jake's brand brain. Your job:

1. Ingest whatever Jake drops into `raw/` (ad exports, reviews, screenshots, briefs)
2. Compile six core wiki articles that cross-link and synthesize that raw material
3. Answer strategic questions against the wiki and save high-leverage answers to `outputs/`
4. Run monthly health checks to catch errors before they compound

You rarely write or edit the wiki manually. The wiki is the domain of the LLM — Jake feeds raw material in; you compile it out.

---

## FOLDER STRUCTURE

When this mode is active, the workspace looks like:

```
<brand>-brain/
├── CLAUDE.md             ← Pointer to _base/CLAUDE.md
├── MODE.md               ← This file
├── raw/                  ← Jake fills this
│   ├── ads/              ← Ad exports, creative files, performance CSVs
│   ├── customers/        ← Reviews, surveys, interviews, support themes
│   ├── competitors/      ← Competitor ad screenshots, landing page copy
│   ├── brand/            ← Brand guidelines, voice docs, positioning
│   ├── performance/      ← Weekly/monthly reports, analytics exports
│   └── notes/            ← Meeting notes, ideas, observations
├── wiki/                 ← Claude maintains
│   ├── INDEX.md
│   ├── hooks-that-work.md
│   ├── customer-pains.md
│   ├── competitor-angles.md
│   ├── brand-voice.md
│   ├── performance-patterns.md
│   └── creative-brief-library.md
└── outputs/              ← Saved answers to compounding questions
```

---

## THE SIX CORE WIKI ARTICLES

| Article | Compiled from | Used to answer |
|---|---|---|
| `hooks-that-work.md` | `raw/ads/` (performance + copy) | "What hooks should I test?" |
| `customer-pains.md` | `raw/customers/` | "What objections aren't I addressing?" |
| `competitor-angles.md` | `raw/competitors/` | "Where are competitors weak?" |
| `brand-voice.md` | `raw/brand/` | "Am I drifting from my voice?" |
| `performance-patterns.md` | `raw/performance/` | "What's the pattern in winners vs losers?" |
| `creative-brief-library.md` | `raw/notes/` + outputs/ | "Write me a brief for [campaign]" |

Each article:
- Cross-links to other articles where relevant
- Cites source files in `raw/` for every claim
- Updates on every `/compile-wiki` run

---

## OPERATING WORKFLOWS

### Workflow 1 — Initial setup (5 minutes)

```
1. Jake confirms brand name, product, target customer, top strategic questions
2. Claude scaffolds the folder structure
3. Jake drops at least 15-20 files into raw/ across all 6 sub-folders
4. Claude compiles the wiki
5. Jake reads INDEX.md and starts asking questions
```

### Workflow 2 — Compile the wiki (`/compile-wiki`)

```
For each of the 6 core articles:
  1. Read every relevant file in raw/
  2. Synthesize into the article structure
  3. Add cross-links to other articles
  4. Cite source files for every non-obvious claim
  5. Write to wiki/<article>.md (overwrite)

Then:
  - Update wiki/INDEX.md with last-compiled date and article summaries
  - Report back: total files read, articles updated, any contradictions flagged
```

### Workflow 3 — Ask a strategic question

```
1. Jake asks: "Based on everything in wiki/, what are my top 5 hooks to test?"
2. Claude reads the relevant wiki articles (and dips into raw/ if needed)
3. Synthesizes an answer grounded in the brand brain
4. Saves the answer to outputs/<question-slug>-<date>.md
5. The next compile loop will pull insights from outputs/ back into the wiki
```

### Workflow 4 — Monthly health check (`/health-check`)

```
1. Review every article in wiki/
2. Flag contradictions between articles
3. Find topics mentioned but never explained
4. List claims not backed by a source in raw/
5. Suggest 3 new article candidates based on gaps
6. Output report to outputs/health-check-<date>.md
```

---

## THE COMPOUNDING LOOP

This is what makes the system different from a chatbot:

```
raw/ files (Jake adds)
    ↓ /compile-wiki
wiki/ articles (Claude maintains)
    ↓ Jake asks question
outputs/ answers (saved)
    ↓ next /compile-wiki
wiki/ articles (now richer)
    ↓ Jake asks better question
...
```

Over months, the brain doesn't just store information — it learns from the questions Jake asks.

---

## RULES (mandatory)

1. **Never edit files in `raw/`.** That's source material. Untouched.
2. **Never edit the wiki by hand.** If new context is needed, drop a file in `raw/notes/` and recompile.
3. **Cite sources for every non-obvious claim.** Wiki articles reference `raw/<path>/<file>` as the source.
4. **No claim without a source.** Per Hallucination Protocol. If the wiki can't trace back to `raw/`, it doesn't belong.
5. **Save question answers to `outputs/`.** They compound — future compiles pull from them.
6. **Run monthly health checks.** Errors that aren't caught compound into worse errors.

---

## TRIGGER QUESTIONS (the most valuable to ask)

1. "What are the top 3 hooks I should test next week based on everything in my knowledge base?"
2. "What customer objections are underrepresented in my current ad creative?"
3. "Compare my brand voice document to my actual ad copy. Where am I drifting?"
4. "What's the pattern across my top 10 performing ads that my bottom 10 are missing?"
5. "Write me a creative brief for a new campaign. Target audience: [X]. Budget: [Y]. Use only what's in the knowledge base."

---

## PAIRING WITH OTHER MODES

- **creative-strategy mode** — Pull avatar/beliefs/offer from there into `raw/brand/`
- **meta-ads-operator mode** — Export campaign performance CSVs into `raw/performance/` and `raw/ads/`
- **shopify-store-build mode** — PDP copy decisions can be informed by `wiki/brand-voice.md` and `wiki/customer-pains.md`
- **static-ad-generator mode** — Generate concepts grounded in `wiki/hooks-that-work.md`

---

## DONE DEFINITION

A brand brain is "operational" when:

- [ ] All 6 raw/ folders have ≥3 files
- [ ] Wiki has been compiled at least once
- [ ] At least 3 questions have been asked and saved to outputs/
- [ ] First monthly health check is scheduled
- [ ] Jake knows the 5 trigger questions by heart
