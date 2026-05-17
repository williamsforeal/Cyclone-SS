---
name: dtc-brand-brain
description: Builds and maintains a personal knowledge base for DTC brands and creative agencies. Organizes ad exports, customer reviews, competitor ads, brand guidelines, and performance reports into a searchable wiki. Use when user asks to build a brand wiki, organize brand data, compile DTC knowledge base, build a brand brain, set up a knowledge base for their brand, or organize messy brand files into a searchable system. Based on Andrej Karpathy's LLM knowledge base methodology, adapted for DTC operators.
---

# DTC Brand Brain

Builds and maintains a personal knowledge base for DTC brands. Takes a messy folder of ad exports, customer reviews, competitor ads, brand guidelines, and performance reports, and compiles it into an organized wiki that Claude maintains automatically.

Based on Andrej Karpathy's LLM knowledge base methodology (April 2026), adapted specifically for DTC operators and creative agencies.

## Critical Rules

- NEVER modify files in `raw/` — those are source material and must stay untouched
- The LLM writes and maintains everything in `wiki/` — users should rarely edit it directly
- Every wiki article must start with a one-paragraph summary
- Every wiki article must link to related topics using `[[topic-name]]` format
- Maintain `INDEX.md` in `wiki/` as the source of truth for what exists in the knowledge base
- When new files are added to `raw/`, update the relevant wiki articles — don't just create new ones
- Every claim in the wiki must be traceable back to a source file in `raw/`
- The `outputs/` folder is for generated reports, Q&A answers, and analyses — not source data

## Folder Structure

The skill scaffolds and maintains this exact structure:

```
dtc-brand-brain/
├── CLAUDE.md              # Schema file — rules for how Claude maintains the wiki
├── raw/                   # Source material (never edit)
│   ├── ads/               # Ad exports, creative files, performance CSVs
│   ├── customers/         # Reviews, survey responses, customer interviews
│   ├── competitors/       # Competitor ad screenshots, landing pages, messaging
│   ├── brand/             # Brand guidelines, voice docs, positioning statements
│   ├── performance/       # Weekly/monthly reports, analytics exports
│   └── notes/             # Meeting notes, strategy docs, ideas
├── wiki/                  # Compiled knowledge base (Claude maintains this)
│   ├── INDEX.md           # Master index of all articles
│   ├── hooks-that-work.md
│   ├── customer-pains.md
│   ├── competitor-angles.md
│   ├── brand-voice.md
│   └── [other topic articles]
└── outputs/               # Generated reports, analyses, answers
```

## Setup Process

When the user asks to set up their DTC Brand Brain, follow these steps:

### Step 1: Create the folder structure

Create the full directory tree shown above in a location the user chooses. Default to the user's home directory if they don't specify.

### Step 2: Generate the schema file

Create `CLAUDE.md` at the root of the project. Consult `references/schema-template.md` for the exact content. Customize the "My Brand" and "My Interests" sections by asking the user:

1. What's the brand name?
2. What products do you sell?
3. Who is your target customer?
4. What are your 3-5 most important strategic questions right now? (e.g., "Why is CPA rising?", "What hooks are working?", "What customer objections come up most?")

### Step 3: Scaffold starter wiki articles

Create `wiki/INDEX.md` with placeholders for these core articles:
- `brand-voice.md` — brand voice, tone, and messaging rules
- `customer-pains.md` — common pain points and objections from reviews/interviews
- `hooks-that-work.md` — ad hooks and angles that have performed
- `competitor-angles.md` — what competitors are running and how they position
- `performance-patterns.md` — what's working and what's not across campaigns
- `creative-brief-library.md` — past creative briefs and their outcomes

These start empty — they'll populate as the user drops files into `raw/`.

### Step 4: Tell the user what to do next

Give the user clear next steps:

1. "Drop your files into the relevant `raw/` subfolders. Don't organize them — just dump everything in. Ad exports in `raw/ads/`, reviews in `raw/customers/`, competitor screenshots in `raw/competitors/`, etc."
2. "Once you've added at least 5-10 files, come back and say: 'Compile the wiki.' I'll read everything in raw/ and build the organized knowledge base."
3. "After that, you can ask questions against the wiki — 'What hooks have worked best?', 'What customer objections come up most?', 'Compare my competitors' angles.'"

## Compile Process

When the user says "compile the wiki" or "update the wiki":

### Step 1: Inventory the raw folder

List every file in `raw/` organized by subfolder. Note which files are new or modified since the last compile.

### Step 2: Read and synthesize

Read the contents of each file in `raw/`. Group related information by topic. Identify patterns across multiple sources.

### Step 3: Update wiki articles

For each core topic in `wiki/`, either create or update the article:

- **brand-voice.md** — synthesize from `raw/brand/` files: voice guidelines, tone rules, words to use/avoid, brand personality
- **customer-pains.md** — synthesize from `raw/customers/` files: common complaints, objections, desired outcomes, language customers use
- **hooks-that-work.md** — synthesize from `raw/ads/` performance data: winning hook patterns, losing patterns, hook frameworks that work for this brand
- **competitor-angles.md** — synthesize from `raw/competitors/` files: competitor positioning, their winning angles, their weaknesses
- **performance-patterns.md** — synthesize from `raw/performance/` files: what metrics are trending, what's working, what's broken
- **creative-brief-library.md** — catalog of past briefs with outcomes

### Step 4: Create new articles as needed

If the raw files contain information that doesn't fit in the core articles, create new topic articles. Add them to `INDEX.md`.

### Step 5: Add cross-links

Every article should link to related articles using `[[article-name]]` format. Look for connections:
- Customer pains connect to hooks that address those pains
- Competitor angles connect to opportunities for differentiation
- Brand voice connects to all creative content

### Step 6: Update INDEX.md

Make sure every article in the wiki is listed in `INDEX.md` with a one-line description.

### Step 7: Report to the user

Tell the user:
- Which articles were created
- Which articles were updated
- What patterns you noticed across sources
- Suggested next questions to ask the knowledge base

## Q&A Mode

Once the wiki is compiled, users can ask questions against it. Examples:

- "Based on everything in wiki/, what are the top 3 hooks we should test next week?"
- "Compare what source A says about our customer vs what source B says. Where do they disagree?"
- "What customer objections come up most often, and which of our ads address them?"
- "Write me a creative brief for a new ad using only what's in the knowledge base."
- "What are my competitors' biggest weaknesses based on their recent ads?"
- "Summarize everything I know about [topic]."

When answering:
1. Read the relevant wiki articles first
2. If needed, cross-reference with raw source files
3. Cite which files/articles you pulled from
4. Save the answer to `outputs/` so it compounds over time

## Health Check Mode

When the user says "run a health check" or monthly:

1. Review every article in `wiki/`
2. Flag any contradictions between articles
3. Find topics mentioned but never explained
4. List any claims not backed by a source in `raw/`
5. Suggest 3 new article candidates based on gaps
6. Report findings to the user

This prevents errors from compounding over time.

## Examples

**Example 1: First-time setup**
User says: "Set up a DTC brand brain for my supplement company"
Actions: Create folder structure, ask the 4 setup questions, generate CLAUDE.md, scaffold empty wiki articles, tell user to drop files into raw/.

**Example 2: Initial compile**
User says: "I've added 20 files to raw/. Compile the wiki."
Actions: Read every file, synthesize into the 6 core articles, create INDEX.md, add cross-links, report what was created.

**Example 3: Strategic question**
User says: "Based on everything in my brand brain, what 5 hooks should I test next week?"
Actions: Read hooks-that-work.md, customer-pains.md, competitor-angles.md. Synthesize 5 hook recommendations. Save answer to outputs/next-week-hooks.md.

**Example 4: Ongoing maintenance**
User says: "I just added this week's Meta Ads CSV to raw/ads/. Update the wiki."
Actions: Read the new CSV, update hooks-that-work.md and performance-patterns.md with new data. Report what changed.

## Troubleshooting

**Wiki articles feel thin:**
- Not enough source material in `raw/`. Ask the user to add more files.
- The files in `raw/` might be too generic. Ask for specific ad exports, actual customer reviews, real performance data.

**Contradictions between articles:**
- Run a health check. Flag the contradictions and ask the user which source is more recent or authoritative.

**User wants to edit the wiki manually:**
- Warn them: "The wiki is meant to be Claude-maintained. If you edit it directly, the next compile may overwrite your changes. Instead, add your notes to `raw/notes/` and I'll incorporate them on the next compile."

## Performance Notes

- Take your time reading every file in `raw/` during a compile. A thorough compile is more valuable than a fast one.
- Always cite sources when writing wiki articles — link back to which file in `raw/` the information came from.
- Don't invent connections that aren't supported by the source material. Every claim should be traceable.
- Save Q&A outputs to `outputs/` so the knowledge base compounds over time.
