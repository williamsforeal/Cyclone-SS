---
name: ai-marketing-team
description: Sequential 5-sub-agent pipeline for ad creative production — Competitor Researcher → Creative Brief Writer → Hook Generator → Ad Copy Writer → Performance Reporter. Use when the user says "run the marketing team", "build a brief", "generate hooks", "write ad variations", or wants a full creative production cycle from competitive scan through copy variants.
---

# AI Marketing Team

Sequential pipeline of 5 specialized sub-agents that take a brand from competitive analysis through finished ad copy variants.

## Pipeline Order (do not reorder)

1. **Competitor Researcher** — pulls competitor ads, surveys positioning, identifies gaps
2. **Creative Brief Writer** — translates research + brand DNA into a creative brief
3. **Hook Generator** — produces 10-20 hook variations against the brief
4. **Ad Copy Writer** — turns winning hooks into full ad copy (headline, primary, description) across formats
5. **Performance Reporter** — analyzes which hooks/angles match past winners (requires `winning-ads-library` / `dtc-brand-brain`)

## Critical Rules

- Each sub-agent reads ONLY the outputs of prior sub-agents + the brand inputs. No skipping.
- Never run the pipeline without an active brand context (brand pack, avatars, offer).
- Hooks must map to Eugene Schwartz awareness levels (problem-aware → solution-aware → product-aware → most-aware). Tag each hook.
- Ad copy must apply StoryBrand framing — customer = hero, brand = guide.
- Coaches gate the output — the final copy variants are a draft for review, not a deploy-ready creative set.

## Folder Structure (per brand)

```
my-brand-team/
├── CLAUDE.md                 # pipeline rules + brand context
├── brand/
│   ├── brand-dna.md
│   ├── brand-voice.md
│   └── icp-cards.md          # avatar definitions
├── inputs/
│   ├── competitor-ads/       # screenshots, URLs, ad library exports
│   ├── ad-performance.csv    # past performance
│   └── reviews/              # customer reviews / surveys
└── outputs/
    ├── competitive-brief.md  # ← Competitor Researcher
    ├── creative-brief.md     # ← Creative Brief Writer
    ├── hooks.md              # ← Hook Generator (10-20 variants, tagged)
    ├── ad-copy-variations.md # ← Ad Copy Writer (per format)
    └── performance-report.md # ← Performance Reporter
```

## Sub-Agent Prompts

Detailed prompts for each sub-agent live in `references/sub-agents/`:

- `references/sub-agents/competitor-researcher.md`
- `references/sub-agents/creative-brief-writer.md`
- `references/sub-agents/hook-generator.md`
- `references/sub-agents/ad-copy-writer.md`
- `references/sub-agents/performance-reporter.md`

> These reference files are placeholders. Source content: `A:\Scale AI Skool\Claude\marketing\The AI Marketing Team Playbook.md`. Populate from playbook before first full pipeline run.

## What This Skill Does NOT Do

- Does not generate images or video — pair with `static-ad-generator` / `seedance-ugc-ads` after copy is approved.
- Does not write to Airtable — pair with `airtable-ops` to log Ad Copy records once approved.
- Does not pull competitor ads automatically — requires `competitor-ad-monitor` (deferred) OR manual screenshots into `inputs/competitor-ads/`.

## References

- Source playbook: `A:\Scale AI Skool\Claude\marketing\The AI Marketing Team Playbook.md`
- Frameworks: StoryBrand · Jungian archetypes · Eugene Schwartz awareness levels · Mark Builds Brands
