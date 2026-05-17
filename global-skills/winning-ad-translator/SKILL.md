---
name: winning-ad-translator
description: Translates a winning competitor ad into a brand-aligned Meta-ready script set using the 6-beat architecture (Hook → Problem → Solution → Proof → Offer → Close). Outputs three paired cuts (15s Meta Feed / 22s Reels / 39s TikTok-native) + Higgsfield prompt strings + verification flag checklist. Use when the user says "rip this ad", "translate this competitor", "model this winner", "make this for my brand", "version this for Meta", or provides a Kaloclip storyboard, GetHookd reference, or any AI-generated script needing brand alignment. Requires a brand pack (voice, archetype, offer stack) before executing — will ask for it if missing.
---

# Winning Ad Translator

Translates a proven competitor ad structure into a brand-aligned, placement-ready creative set. Steals the architecture; rewrites the voice.

## Critical Rules

- **Never copy competitor copy verbatim.** Extract the psychological structure (Cialdini lever + beat function), then rewrite entirely in the brand's voice.
- **Never invent offer details, pricing, or product claims.** If the brand pack doesn't have it, flag `[VERIFY]`.
- **Verification flags are non-negotiable.** Every physical claim (motor doesn't stall, waterproof, "cleans in 5 minutes") gets a `[VERIFY]` tag before the script is handed off. Scripts with unverified claims must not go to Meta directly.
- **Always output all three cuts.** A single cut kills A/B test value. The triple-output is the default. If the user only wants one, they must explicitly say so.
- **Visual assets should be shared across all three cuts.** Isolates length-as-variable, drops Higgsfield iteration cost ~66%.
- Coaches gate scale. Scripts are drafts for review before media spend.

## Input Contract

Before executing, confirm you have:

1. **Reference ad** — URL, Kaloclip storyboard, GetHookd pull, or user-pasted script
2. **Brand pack** — voice archetype, offer stack, CTA, guarantee, price, compare-at
3. **Placement target** — which platforms/placements (defaults to Meta Feed + Reels + TikTok)
4. **Hallucination Protocol** — flag categories from `references/verification-triggers.md`

If brand pack is missing: ask for it before generating. Never invent brand details.

## 6-Beat Architecture

Every translation follows this beat sequence. Read `references/beat-translation-guide.md` for full Cialdini lever mapping and archetype voice rules per beat.

| Beat | Function | Psych Lever | Compression priority |
|---|---|---|---|
| 1. Hook (0–2s) | Pattern interrupt + identity lock | Social proof flipped negative | Highest — must survive 0s mute scroll |
| 2. Problem (2–5s) | Inferior methods, empathy | Safety memory + time-loss | High |
| 3. Solution + Proof (5–9s) | Demo — show before claim | Authority + consistency | High |
| 4. Offer Reveal (9–12s) | Bundle stack flash | Reciprocity | Medium |
| 5. Close (12–15s) | Risk reversal + calendar deadline | Commitment + loss aversion | Medium |
| 6. (39s only) Depth beat | Usage scenario, objection pre-empt | Social proof, authority | Low (TikTok only) |

## Output Format

### Cut 1 — Meta Feed (15s)
```
[0–Xs] BEAT NAME
VISUAL: [scene description]
AUDIO:  "[exact voiceover copy]"
LEVER:  [Cialdini lever + rationale — 1 sentence]
```
Repeat for each beat.

### Cut 2 — Reels Extended (22s)
Same structure. Adds one expanded beat (usually Solution/Proof or Offer Reveal).

### Cut 3 — TikTok Native (39s)
Full 6-beat structure. Add Depth Beat between Solution and Offer Reveal.

### Higgsfield Prompts
One prompt string per scene, using brand palette + mood from brand pack.

### Verification Checklist
One flag per physical/statistical/temporal claim. Format:
```
[ ] [VERIFY] [claim text] — required before Meta submit
```

### Placement Test Plan
```
| Cut | Length | Placement | Primary lever |
|---|---|---|---|
| Meta Feed | 15s | FB/IG Feed, Reels | Compression + hook density |
| Reels Extended | 22s | Reels | Demo expansion |
| TikTok Native | 39s | TikTok | Storytelling pacing |
```

## Integration Chain

This skill chains with:
- **Kaloclip / GetHookd** — for reference ad input
- **brand-dna-builder** — for brand voice rules
- **static-ad-generator** — for image assets per scene
- **seedance-ugc-ads** — for video asset generation
- **ad-family** — for scaling the winning cut into variant families
- **Hallucination Protocol** — governs every physical and statistical claim

## Validation Cases

**Pass criteria for any translation:**
- All six beats present (15s may compress 4–5 into one)
- Voice locked to brand archetype (not generic DTC slop)
- Offer integrates actual brand stack — not competitor's
- Verification flags pre-applied to all claims before handoff
- Visual assets reusable across all three cuts

**Known failure patterns:**
- Supplier-listing language sneaking back in ("Dishwasher Safe", "Shed-Proof") — check `references/beat-translation-guide.md` banned phrase list
- Generic urgency close ("once it's gone it's gone") — replace with calendar deadline + risk reversal
- Missing offer reveal — if brand pack doesn't have an offer stack, stop and ask

## References

- `references/beat-translation-guide.md` — Cialdini lever mapping per beat + archetype voice rules (Craftsman/Sage/Warrior) + banned phrase list
- `references/cut-templates.md` — Compression rules per placement + beat allocation per cut length
- `references/verification-triggers.md` — Claim categories requiring `[VERIFY]` flags (physical, statistical, temporal, medical)
- Source: `kalo data.md` session (Pit Smith Drayvorx translation + skill specification)
- Related: `A:\Scale AI Skool\Claude\marketing\The AI Marketing Team Playbook.md`
