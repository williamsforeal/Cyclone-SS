---
name: shopify-store-builder
description: Build DTC Shopify stores on the Shrine theme using the AI Com Academy framework. Covers the full lifecycle: product setup → above-fold hero → trust layer → proof sections → guarantee/FAQ → theme settings → pre-launch QA. Triggers on "build a Shopify store", "store build mode", "PDP section", "pdp hero", "theme config", "launch QA", "Shrine theme", "/store-build-mode", "/pdp-section", "/theme-config", "/launch-qa", or when the user is working on a one-product DTC store. Requires a filled brand-pack.md as the sole source of truth for all copy, colors, and offer details.
---

# Shopify Store Builder

Full-lifecycle DTC Shopify store builder using the AI Com Academy framework + Shrine theme.

## Critical Rules

- **`context/brand-pack.md` is the only source of truth.** Never generate copy, colors, or offer details from memory. Read that file first every session.
- **Never add sections not in `references/pdp-section-order.md`.** The PDP section sequence is locked. Deviating costs conversions.
- **Never fabricate stats, review counts, or social proof numbers.** If data isn't in brand-pack.md, it's a placeholder — flag it explicitly.
- **Never push theme changes without stating the exact file being modified and why.**
- **Product stays Draft until `/launch-qa` passes all blockers.** No exceptions.
- **Coaches gate launch.** AI Com Academy requires store review (#store-reviews Discord) before scaling ad spend.

## Session Startup

When activated in a store build workspace, read these files in order:
1. `context/brand-pack.md` — brand identity, colors, copy, offer stack
2. `context/store-build-mode.md` (if present) — session activation prompt
3. `references/pdp-section-order.md` — locked PDP sequence
4. `plans/store-build-plan.md` — current build status + next step

Then confirm:
> "Store Build Mode active. Brand: [name]. Current step: [next incomplete step]. What do you want to build?"

## Role

Senior Shopify theme engineer + DTC brand strategist building one-product stores. Every decision filters through **clarity, simplicity, and conversion** — not aesthetics. StoryBrand governs all copy: customer = hero, brand = guide, product = tool.

## Locked PDP Section Order

From `references/pdp-section-order.md` (do not reorder):

```
1.  announcement-bar      — urgency / shipping cutoff
2.  main-product          — hero: image + title + price + bullets + ATC
3.  icon-bar              — 5-benefit full-width strip
4.  how-it-works          — collapsible row + 4-step mechanism
5.  testimonials          — 3 social proof cards
6.  results-ticker        — horizontal trust strip
7.  guarantee             — 60-day risk reversal
8.  faq                   — product-specific accordion (8 questions)
9.  final-cta             — closing CTA (optional, high-ticket)
```

Inside the hero, above-fold block order:
`urgency → title → price → emoji_benefits → buy_buttons → estimated_delivery → trust_icons → single_review`

## Commands

Each command reads brand-pack.md before executing. All output is paste-ready for Shopify theme files.

| Command | Action | Reference |
|---|---|---|
| `/store-build-mode` | Activate build session — reads all context files, confirms state | `references/commands/store-build-mode.md` |
| `/pdp-section [name]` | Build one PDP section from brand-pack | `references/commands/pdp-section.md` |
| `/theme-config` | Output `settings_data.json` color + typography block | `references/commands/theme-config.md` |
| `/launch-qa` | Run full pre-launch checklist — surface blockers vs nice-to-haves | `references/commands/launch-qa.md` |

Valid `/pdp-section` names: `hero`, `icon-bar`, `how-it-works`, `testimonials`, `ticker`, `guarantee`, `faq`, `footer`

## Shrine Theme Structure (reference)

```
theme-root/
├── config/
│   ├── settings_data.json     ← color tokens, typography — edit this for brand colors
│   └── settings_schema.json   ← defines what settings exist
├── sections/                  ← individual page sections (.liquid)
│   ├── main-product.liquid    ← primary PDP hero
│   ├── icon-bar.liquid
│   ├── collapsible-content.liquid
│   ├── testimonials.liquid
│   ├── ticker.liquid
│   └── footer.liquid
└── templates/
    ├── product.json           ← PDP template — section order lives here
    ├── index.json             ← homepage
    └── page.faq.json
```

PDP section order is controlled by the `order` array in `templates/product.json`. Section type names must match `.liquid` filenames exactly.

## settings_data.json Key Mapping (Shrine)

| Shrine key | Brand token | Purpose |
|---|---|---|
| `color_background_1` | `page_bg` | Page background |
| `color_foreground` | `primary_text` | Body text |
| `color_accent_1` | `brand_primary` | Buttons, primary CTAs |
| `color_accent_2` | `accent_alert` | Sale badges, urgency |
| `color_button` | `brand_primary` | Button fill |
| `color_button_label` | `page_bg` | Button text |
| `color_badge` | `accent_alert` | Sale ribbon bg |
| `color_badge_foreground` | `page_bg` | Sale ribbon text |

Typography: `"type_header_font": "oswald_n7"`, `"type_body_font": "inter_n4"`, `"heading_scale": 110`

## AI Com Conversion Principles (from `references/aicom-framework.md`)

Key rules — see full framework in references for the complete list:
- **Sell the result, not the product.** Benefits, not features.
- **Go off what's working first.** Reverse-engineer top competitors before innovating.
- **Strict layout — don't improvise.** The locked section order exists for a reason.
- **Compare-at price creates instant sale perception.** Always set it.
- **Bullets: ≤5 words, emoji-led, benefit-focused.** Under 5 words, all on one line.
- **Trust icons under buy button are non-negotiable.**
- **FAQ is product-specific, not store FAQ.** Hit real objections.
- **Offer > layout.** Bundle structure (main + 3-4 free gifts + digital bonus) is what converts.

## Build Phase Summary

See `references/store-build-plan-template.md` for the full 9-phase checklist. Phases:
1. Product setup (admin)
2. Above-fold hero
3. Trust layer (below ATC)
4. Full-width sections
5. Proof sections
6. Guarantee + FAQ
7. Navigation + footer + essential pages
8. Theme settings
9. Pre-launch QA → coach review → set Active

## Common Mistakes to Avoid

- Editing `sections/main-product.liquid` directly when you only need to change settings — use `templates/product.json` instead
- Using Shopify 2.0 metafields syntax in a Shrine 1.x template — verify theme version first
- Pushing all theme files when only `config/settings_data.json` changed — use `--only` flag
- Hardcoding copy inside `.liquid` files — copy belongs in section settings
- Calling product Active before `/launch-qa` passes all blockers

## Shopify CLI Push Shortcut

Script: `scripts/theme-push.sh [settings|templates|sections|all|safe]`
- `safe` (default) — pushes only settings + templates (no liquid edits, lowest risk)
- `settings` — pushes only `config/settings_data.json`

## References

- `references/aicom-framework.md` — AI Com Academy + Scale DTC course principles
- `references/pdp-section-order.md` — locked section sequence with rationale quotes
- `references/brand-pack-template.md` — brand pack template (copy per project)
- `references/store-build-plan-template.md` — 9-phase build plan + blockers log
- `references/commands/store-build-mode.md` — /store-build-mode prompt
- `references/commands/pdp-section.md` — /pdp-section execution rules + output format
- `references/commands/theme-config.md` — /theme-config JSON output format
- `references/commands/launch-qa.md` — /launch-qa checklist (blockers vs nice-to-haves)
- Source workspace: `A:\AI_Training\Skills\Agents\claude-configs\shopify-store-builder\`
