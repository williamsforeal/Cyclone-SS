---
name: brand-pack-reader
description: Defines exactly how Claude ingests a brand-pack.md and applies it across copy, colors, and structure decisions — ensuring zero hallucination of brand details. Use whenever starting a store build, generating PDP sections, writing ad copy, or any task where brand-specific data (hex codes, pricing, CTAs, testimonials) must come from a verified source file rather than inference. Works in tandem with shopify-store-builder and static-ad-generator.
---

# Brand Pack Reader

Zero-hallucination protocol for ingesting `context/brand-pack.md` and applying it correctly across all brand-specific outputs.

## Critical Rules

- **Never infer or invent** a hex code, price, CTA label, or copy element not explicitly in the brand pack.
- If a detail is missing, state: "This field is not in brand-pack.md — please provide it or confirm the default." Never fill in blanks silently.
- Flag every `[PLACEHOLDER]` and `[INSERT DATE]` field as a blocker. Do not declare a step complete while placeholders remain.
- Read the brand pack at the START of every session before generating any output.

## Extraction Map

When Claude reads `context/brand-pack.md`, it extracts and maps:

| Brand Pack Section | What Claude extracts | Where it's used |
|---|---|---|
| Brand name + tagline | Display name, CTA phrasing | All copy, button labels, meta |
| Color palette (hex codes) | Exact hex + token names | settings_data.json, section backgrounds |
| Typography | Font names + weights | settings_data.json, layout decisions |
| Pricing | Price + compare-at | Product settings, ATC button labels |
| Announcement bar | Copy + colors | Announcement bar section |
| Emoji benefit bullets | 5 pills with emoji + label | hero emoji_benefits block |
| Sticky ATC | Button label + sub-label | sticky_atc block |
| Buy buttons | Primary label + save callout | buy_buttons block |
| Shipping line | Shipping text | estimated_delivery block |
| Icon bar (5 items) | Icon + headline + sub-copy | icon-bar section |
| Ticker items | Cycling trust strip items | ticker section |
| Testimonials (3 slots) | Quote + name | testimonials section |
| How It Works (4 steps) | Title + body per step | steps section |
| Guarantee | Headline + body + CTA + bg color | rich-text/guarantee section |
| FAQ (8 questions) | Q + A pairs | collapsible-content section |
| Navigation | Labels + URLs | header section |
| Footer | Tagline + trust row + legal | footer section |

## Validation Checklist (run before any build task)

Before generating output for any section, confirm:

- [ ] All 6+ hex codes present (bg, text, primary, accent, card-bg, utility)
- [ ] Pricing set (price + compare-at both filled)
- [ ] 5 emoji benefit bullets exist
- [ ] FAQ has at least 6 questions
- [ ] No `[PLACEHOLDER]` or `[INSERT DATE]` fields in sections being built — log as blockers

## Conflict Protocol

If two sources give different values for the same field (e.g., brand-pack.md says one CTA text and an ad brief says another), brand-pack.md wins. Flag the conflict and ask which to use — never silently choose.

## References

- `references/brand-pack-template.md` in `shopify-store-builder` — full template to copy per project
- Source: `A:\AI_Training\Skills\Agents\claude-configs\mnt\user-data\outputs\SHOPIFY-STORE-BUILD-TEMPLATE\.claude\skills\brand-pack-reader\SKILL.md`
