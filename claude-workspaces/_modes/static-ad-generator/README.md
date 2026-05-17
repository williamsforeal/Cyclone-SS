# Mode — Static Ad Generator

For generating Meta static ads end-to-end — concept → reverse-engineer → Higgsfield brief → variant family.

## When to use this mode

- Generating new ad concepts for an upcoming test round
- Analyzing a winning competitor ad and translating its pattern to Jake's brand
- Building a variant family around a validated winner
- Pre-production planning for Higgsfield image generation

## What loads with this mode

Skills:
- `ad-concept-generator` — Concept-first generation (NOT image-first)
- `reverse-engineer-winners` — Extract patterns from competitor winners
- `higgsfield-image-gen` — Brand-grounded Higgsfield briefing
- `ad-family-architect` — Build variant families around heroes

## Required inputs

- Brand pack (active brand)
- Avatar(s)
- Offer
- Wiki articles from brand brain (if exists) — `hooks-that-work.md`, `competitor-angles.md`

## Coach gate

Per AI Com Academy phase-gating — every batch of generated concepts goes to coach for review BEFORE going into production. Save concept batches to `outputs/` and tag with status.

## Outputs go to

- `plans/concept-batch-<brand>-<date>.md`
- `plans/reverse-engineer-<source>-<date>.md`
- `plans/higgsfield-brief-<concept>-<date>.md`
- `outputs/ads/<concept>/hero.png` + `outputs/ads/<concept>/v1-<slug>.png` etc.
- `outputs/ads/<concept>/family-map.md`
