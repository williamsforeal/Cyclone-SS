# Mode — Shopify Store Build

For building one-product Shopify stores from brand pack to live PDP.

## When to use this mode

- New brand getting a fresh Shopify store
- Existing store getting a PDP rebuild
- Theme migration or significant section restructure
- Pre-launch QA pass

## What loads with this mode

Skills:
- `brand-pack-reader` — How to read brand-pack.md
- `shopify-shrine` — Shrine theme file structure + schema
- `pdp-builder` — The locked AI Com section order + content rules
- `launch-qa` — Pre-launch QA checklist

Reference:
- `aicom-framework.md` — Core AI Com Academy principles
- `brand-pack-template.md` — Template for new brand packs
- `shrine-theme/pdp-section-order.md` — LOCKED section order
- `shrine-theme/pdp-section-template.md` — Section schema reference
- `shrine-theme/theme-config.md` — Shrine config reference
- `launch-qa-checklist.md` — Static QA checklist (also encoded in skill)
- `store-build-plan-template.md` — Build phase tracking template

Scripts:
- `scripts/theme-push.sh` — Theme deployment helper

## How to start a build

1. Pick a brand from `brands/<brand>/`
2. Symlink or copy that brand's `brand-pack.md` into `context/`
3. Copy `reference/store-build-plan-template.md` into `plans/store-build-plan.md` and fill in brand specifics
4. Type `/start-session` to load context
5. Build phase by phase per the plan

## Outputs go to

- `outputs/sections/` — Individual section content
- `outputs/pdp-final-<brand>.md` — Complete PDP doc
- `outputs/launch-qa-<brand>-<date>.md` — QA report
