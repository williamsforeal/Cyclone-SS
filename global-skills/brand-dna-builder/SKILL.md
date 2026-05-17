---
name: brand-dna-builder
description: Builds a comprehensive Brand DNA file by scraping the brand's website first, then filling gaps with targeted interview questions. Trigger on any request to set up brand context, build a brand foundation, create a brand DNA file, or onboard a new brand/client into the SCALE AI skills system. Also trigger when the user mentions setting up a new project, adding a new client, or any phrase like "let's set up [brand name]". This skill creates the foundational brand/brand-dna.md file that every other SCALE AI skill reads before executing.
---

# Brand DNA Builder

The foundation skill for the SCALE AI skills library. Builds a comprehensive `brand/brand-dna.md` file by scraping the brand's website and filling gaps through targeted interview questions. Every other SCALE AI skill reads this file before executing, so accuracy matters — don't guess, don't fill in defaults.

## Critical Rules

- NEVER guess or invent brand details. Extract from the live website or ask the user directly.
- ALWAYS scrape the website first before asking interview questions. Only ask about things the website cannot tell you.
- ALWAYS save the final file to `./brand/brand-dna.md`. Create the `brand/` folder if it doesn't exist.
- ALWAYS confirm the extracted data with the user before saving.
- If the user is an agency managing multiple clients, save to `./clients/[client-name]/brand/brand-dna.md` instead.

## Process

### Step 1: Ask for the brand name and URL

Start with a single question:

> "Let's build your Brand DNA. What's the brand name and website URL?"

If the user is an agency and says they're setting up a client, ask for the client name too and use the agency folder structure (`./clients/[client-name]/brand/`).

### Step 2: Scrape the homepage (3-tier fallback)

Read `references/extraction-checklist.md` first so you know exactly what to pull.

Try the following methods in order. Stop at the first one that works:

**Tier 1 — WebFetch (try first):**
Use the built-in WebFetch tool on the homepage URL. This is the fastest and free path. Many DTC brand sites work fine with it.

**Tier 2 — Firecrawl MCP (if WebFetch is blocked):**
If WebFetch returns an error like "Access blocked," "Cloudflare," or returns empty/malformed content, try the `firecrawl_scrape` tool from the Firecrawl MCP server. This handles Cloudflare protection, JavaScript rendering, and aggressive bot blocking that defeats WebFetch.

Use these arguments:
```json
{
  "url": "[homepage URL]",
  "formats": ["markdown"],
  "onlyMainContent": true
}
```

If the user doesn't have Firecrawl MCP installed, offer manual paste as the fallback:

> "I couldn't fetch the site automatically — your default WebFetch is blocked on this domain (common with DTC sites using Cloudflare). The smoothest fix is installing the Firecrawl MCP connector. Or, paste the homepage content directly into this chat and I'll extract from that. Which would you like?"

**Tier 3 — Manual paste (zero-setup fallback):**
Ask them to paste the homepage content as text. Extract using the same checklist. Note in the saved file that extraction was done from manual paste.

Do NOT guess or assume. If a color, font, or value prop isn't visible in the source, leave it blank — you'll ask the user in Step 5.

### Step 3: Scrape additional pages if needed

If the homepage leaves significant gaps, also fetch:
- `/about` or `/about-us` — company story, mission, team, voice signals
- `/products` or shop page — product categorization, positioning
- A product detail page — product copy voice, benefit framing, social proof

Use the same 3-tier fallback chain from Step 2. Only fetch additional pages if they'll genuinely fill gaps.

### Step 4: Present the extraction to the user

Show everything extracted in a clean, scannable format:

```
Here's what I pulled from [website]:

BRAND
  Name: [name]
  Tagline: "[extracted tagline]"
  Category: [detected category]
  Business model: [DTC / marketplace / subscription / hybrid]

VISUAL IDENTITY
  Primary color:    [name] #[hex] — used on [CTAs, headers]
  Secondary color:  [name] #[hex] — used on [subheads, accents]
  Accent color:     [name] #[hex] — used on [highlights, badges]
  Background:       #[hex]
  Text:             #[hex]

  Heading font: [exact font name]
  Body font:    [exact font name]

  Visual style: [1-2 sentence description]
  Photography:  [product photography style]
  Button style: [pill/rounded/square, color, hover behavior if visible]

COPY & MESSAGING
  Hero headline: "[exact H1 or hero text]"
  Value prop:    "[extracted value proposition]"
  Key benefits:  [3-5 benefits from the homepage]
  CTAs found:    "[CTA 1]", "[CTA 2]", "[CTA 3]"

SOCIAL PROOF
  Testimonials: [yes/no, how many, who]
  Reviews/ratings: [shown? where? how many?]
  Press/awards: [any logos or mentions]
  Customer count: [if displayed]

BRAND VOICE SIGNALS
  Tone: [formal/casual], [serious/playful], [technical/plain]
  Person: [first person "we" / second person "you" / third person]
  Notable language: [any repeated brand-specific words or phrases]

Does this look right? Anything to correct or add?
```

Wait for the user to confirm or correct. Do NOT proceed until they've reviewed.

### Step 5: Fill gaps with interview questions

After the user confirms the extraction, ask only about things the website cannot tell you. Read `references/interview-questions.md` for the full question set.

Only ask about:
- **Target customer specifics** — the website rarely reveals ICP details beyond the obvious
- **Brand voice intent** — what the brand *wants* to sound like, which may differ from current copy
- **Positioning and differentiators** — why customers choose this brand over alternatives
- **What's forbidden** — words, claims, or tones the brand avoids
- **Priority products or SKUs** — which products matter most for ads and content
- **Competitive context** — who they compete with and how they position against them

Ask in batches of 3-4 at a time. Don't dump 20 questions at once.

### Step 6: Write the brand-dna.md file

Use the canonical format in `references/brand-dna-template.md`. Fill in every section using only:
1. Data extracted from the website (Steps 2-3)
2. User answers from the interview (Step 5)

If a field has no data, leave it blank or omit the section. **Never fill in placeholders or defaults.**

Save to `./brand/brand-dna.md` (or `./clients/[client-name]/brand/brand-dna.md` for agencies).

### Step 7: Confirm and suggest next steps

```
✅ Brand DNA saved to ./brand/brand-dna.md

Summary:
  Brand: [name]
  Category: [category]
  Colors: [primary] [secondary] [accent]
  Voice: [tone summary]
  Audience: [ICP summary]

Next steps in the SCALE AI system:
1. Run Brand Voice Profiler to define tone and voice rules in detail
2. Run ICP Deep Dive to build customer persona cards
3. Then you can run any production skill (Hook Writer, Creative Brief Generator, etc.) and it will read this file automatically.

Want to continue with Brand Voice Profiler now?
```

## Output

A single file: `./brand/brand-dna.md` containing:
- Brand identity (name, tagline, category, business model)
- Visual identity (colors, fonts, photography style, button style)
- Copy and messaging (hero, value prop, benefits, CTAs)
- Social proof available
- Brand voice signals (tone, person, notable language)
- Target customer summary (from interview)
- Positioning and differentiators (from interview)
- Forbidden words or tones (from interview)
- Priority products (from interview)
- Competitive context (from interview)

## Troubleshooting

**WebFetch returns "blocked," "Cloudflare," or empty content:**
Fall back to `firecrawl_scrape` from the Firecrawl MCP server. If Firecrawl isn't installed, offer manual paste.

**User corrects most of the extracted data:**
Don't argue. Update everything per user corrections before saving. This happens when a brand is mid-rebrand or has outdated web copy.

**Multiple conflicting color schemes on the site:**
Ask the user which is the current/primary brand palette. Don't guess from frequency alone.

**User skips interview questions:**
Save what you have. A partial brand DNA is still useful. Mention which sections are incomplete.

## References

- `references/extraction-checklist.md` — what to pull from the website
- `references/interview-questions.md` — full question set for Step 5
- `references/brand-dna-template.md` — canonical output template
- Source: https://github.com/mikefutia/scale-ai-foundation-skills/tree/main/brand-dna-builder
