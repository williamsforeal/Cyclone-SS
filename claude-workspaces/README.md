# Claude Workspaces — v2.0

**Owner:** Jake Williams | williamsforeal LLC
**Architecture:** Layered, composable Claude Code workspace templates
**Replaces:** v1 (single Shopify Store Build template) — see "What changed from v1" at bottom

---

## What this is

A modular library of Claude Code workspace templates for running williamsforeal LLC's brand portfolio (Abundria/Palm Aura, Pit Smith Co., Cold Plunge TBD, future brands).

**Three layers:**

```
claude-workspaces/
├── _base/               ← UNIVERSAL — every workspace inherits this
├── _modes/              ← 6 OPERATING MODES — snap on top of _base
│   ├── shopify-store-build/
│   ├── dtc-second-brain/
│   ├── meta-ads-operator/
│   ├── static-ad-generator/
│   ├── tiktok-slideshow/
│   └── creative-strategy/
└── brands/              ← 3 BRAND MODULES — loose-coupled, any mode reads any brand
    ├── pitsmith/
    ├── abundria-palm-aura/
    └── cold-plunge-tbd/
```

You compose a working Claude Code workspace by combining: `_base` + one `_modes/<mode>` + one `brands/<brand>`.

---

## Quickstart — Compose a workspace

### Example 1 — Build Pitsmith's Shopify store

```bash
# In Cursor or terminal, create a fresh project folder:
mkdir pitsmith-store-build && cd pitsmith-store-build

# Symlink _base (so updates propagate):
ln -s ../claude-workspaces/_base/CLAUDE.md ./CLAUDE.md
ln -s ../claude-workspaces/_base/.claude ./.claude-base
mkdir -p .claude/{commands,skills}
cp -r .claude-base/commands/* .claude/commands/
cp -r .claude-base/skills/* .claude/skills/

# Copy the mode:
cp ../claude-workspaces/_modes/shopify-store-build/MODE.md ./
cp -r ../claude-workspaces/_modes/shopify-store-build/.claude/skills/* .claude/skills/
cp -r ../claude-workspaces/_modes/shopify-store-build/reference ./
cp -r ../claude-workspaces/_modes/shopify-store-build/scripts ./

# Copy the brand:
mkdir context
cp ../claude-workspaces/brands/pitsmith/brand-pack.md context/

# Working directories:
mkdir plans outputs

# Open in Cursor and start:
cursor .
```

In Claude Code, type `/start-session` to load context.

### Example 2 — Build Abundria's DTC Brand Brain

Same pattern, swap the mode and brand:

```bash
mkdir abundria-brand-brain && cd abundria-brand-brain
# (same symlink/copy pattern as above, but:)
cp ../claude-workspaces/_modes/dtc-second-brain/MODE.md ./
cp -r ../claude-workspaces/_modes/dtc-second-brain/.claude/skills/* .claude/skills/
cp -r ../claude-workspaces/_modes/dtc-second-brain/reference ./
# Brand:
mkdir context
cp ../claude-workspaces/brands/abundria-palm-aura/* context/
# Brain-specific dirs:
mkdir -p raw/{ads,customers,competitors,brand,performance,notes} wiki outputs/{briefs,question-answers,health-checks}
```

---

## Critical fix in v2 — YAML frontmatter on all SKILL.md files

**v1 bug:** Every `SKILL.md` file started with `# SKILL: <name>` — but Claude Code's skill loader rejects any file without YAML frontmatter. This is why Skills weren't loading in Cursor (per the warning screenshots).

**v2 fix:** Every `SKILL.md` file now starts with proper YAML frontmatter:

```yaml
---
name: skill-name
description: When the user asks Claude to [trigger], use this skill to [outcome]...
---
```

The `description` field is trigger-focused so Claude's loader knows when to activate the skill automatically.

If you ever see the "SKILL.md must start with YAML frontmatter (---)" warning again, check that the first line of the file is exactly `---`, not a header.

---

## What's in each layer

### `_base/` — Universal

- `CLAUDE.md` — Operator identity (Ecom Ops Growth Architect role, Hallucination Protocol, voice rules, file ownership rules)
- `README.md` — Composition pattern guide
- `.claude/commands/COMMANDS.md` — Slash commands (`/start-session`, `/handoff`, `/verify`, `/next-action`, `/coach-review-ready`)
- `.claude/skills/`
  - `hallucination-protocol/` — The 5-rule fact-grounding system
  - `operator-mode/` — Voice, structure, formatting rules
  - `mcp-integration/`
    - `shopify/` — Shopify connector (25 tools) + Shopify AI Toolkit plugin reference
    - `gethookd/` — Competitor ad library
    - `trendtrack/` — Brand tracking + niche analysis
    - `notion/` — Workspace progress tracking
    - `google-drive/` — Course transcripts + coach feedback
    - `higgsfield/` — AI image generation (per-brand aesthetic rules)

### `_modes/` — 6 Operating Modes

1. **`shopify-store-build/`** — PDP construction on Shrine, AI Com locked section order, launch QA. Extends v1.
2. **`dtc-second-brain/`** — Karpathy `raw/` → `wiki/` → `outputs/` method, adapted for DTC. 6 core wiki articles.
3. **`meta-ads-operator/`** — Campaign launch, post-launch analysis (Day 3/7/14), creative testing framework
4. **`static-ad-generator/`** — Concept-first ad generation, competitor reverse-engineering, Higgsfield briefing, ad family architecture
5. **`tiktok-slideshow/`** — Hook bank generator (7 categories), slideshow factory
6. **`creative-strategy/`** — Brand DNA, StoryBrand, Necessary Beliefs, avatars, Eugene Schwartz awareness matrix

### `brands/` — 3 Brand Modules

1. **`pitsmith/`** — Pit Smith Co. (BBQ — pre-launch, Father's Day 2026). Brand pack, brand identity doc, batch-1 ad concepts.
2. **`abundria-palm-aura/`** — Abundria → Palm Aura hand massager (live, active testing). All foundational docs from project (brandscript, target audiences, necessary beliefs, deep research, PDP layout, master prompt).
3. **`cold-plunge-tbd/`** — Cold plunge research phase. Market analysis (32/40 PASS for disciplined execution as Abundria sister collection) + placeholder brand-pack pending commit decision.

---

## Brand × Mode compatibility matrix

| Brand → / Mode ↓ | Pitsmith | Abundria/Palm Aura | Cold Plunge TBD |
|---|---|---|---|
| creative-strategy | Need to build artifacts | Refine (priority avatars) | Build full DNA after commit |
| shopify-store-build | **ACTIVE** | Live; iterations only | After commit + after foundation |
| static-ad-generator | After PDP coach-approved | **ACTIVE** | After full foundation |
| meta-ads-operator | After ad creative + coach-approved | **ACTIVE** | After launch |
| tiktok-slideshow | Test late — Father's Day gift hooks | High-leverage — feminine wellness | Likely high-leverage |
| dtc-second-brain | After first campaign data | **Highest priority** — most data | After launch |

---

## The Hallucination Protocol — non-negotiable

Every reasoning task across every mode is governed by the 5-rule Hallucination Protocol. See `_base/.claude/skills/hallucination-protocol/SKILL.md`.

Summary: confidence ≠ accuracy. Tag anything unverified with `[VERIFY]`. Don't fabricate numbers to look helpful.

---

## AI Com Academy coach gating

Jake is in the AI Com Academy program. Every phase (product validation → website → ads → fulfillment) requires coach approval before scaling.

Every mode in this workspace respects this. Skills explicitly note where coach approval gates execution. `/coach-review-ready` packages the current output for coach review.

---

## What changed from v1

| v1 | v2 |
|---|---|
| 1 template (Shopify Store Build only) | 6 operating modes + 3 brand modules |
| SKILL.md files missing YAML frontmatter (broken) | YAML frontmatter on every SKILL.md (fixed) |
| Brand context embedded inline | Brand modules separated, loose-coupled (any mode reads any brand) |
| Hallucination Protocol not explicitly encoded | First-class `_base` skill, governs every reasoning task |
| Operator Mode voice implicit | First-class `_base` skill, codified rules |
| Single Shopify MCP reference | Full MCP suite (Shopify + GetHookd + TrendTrack + Notion + Google Drive + Higgsfield) |
| No commands | 5 slash commands (`/start-session`, `/handoff`, `/verify`, `/next-action`, `/coach-review-ready`) |
| Reference files only for Shopify | Mode-specific references; brand-specific contexts; Karpathy article templates for DTC Brain |
| No brand modules | Pitsmith, Abundria/Palm Aura, Cold Plunge TBD — all grounded in real project files |
| Implicit AI Com gating | Explicit coach-gate notes in every mode + dedicated `/coach-review-ready` command |

---

## Maintenance

- **Update `_base/`** when operator rules change, MCP tools shift, or a new universal command is needed. All workspaces inherit.
- **Update `_modes/<mode>/`** when a mode's workflow improves. Other modes unaffected.
- **Update `brands/<brand>/`** when brand context changes (new pack, new offer, new positioning). Other brands unaffected.
- **Add new modes** in `_modes/` following the same structure (MODE.md + README.md + .claude/skills/ + reference/).
- **Add new brands** in `brands/` following the same structure (README.md + brand-pack.md + supporting docs).

Never edit anything in `_base/` or `_modes/<mode>/reference/` mid-session. Those are read-only at runtime.
