---
name: ad-family-architect
description: Use this skill when the user has a validated winning ad (or a high-conviction concept) and wants to build a "family" of variants around it for systematic A/B testing. Encodes the principle that you scale by exploiting one winner's pattern across controlled axes, not by generating 10 random ads.
---

# Ad Family Architect

**Purpose:** Build a controlled variant family from a single winner (or pre-validation hero concept). One axis at a time. Clean attribution.

---

## WHY FAMILIES BEAT ONE-OFFS

A "winner" with no variants tells you almost nothing about why it won. Was it the hook? The scene? The avatar in the shot? The CTA?

A family isolates ONE variable across 3-6 variants. You learn what specifically drives the performance — and that insight becomes a multiplier on every future creative.

```
One-off:  Ad A wins. Why? Unclear.

Family:   Ad A (hero), Ad A1 (different scene), Ad A2 (different demo),
          Ad A3 (different overlay copy).
          Compare. Now you know which axis drives the lift.
```

---

## FAMILY ARCHITECTURE PATTERNS

### Pattern 1 — Scene Family (hero has strong hook + composition)
- Hero: Hands cradling massager in morning kitchen, ceramic mug nearby
- Variant 1: Same shot, bedroom morning light
- Variant 2: Same shot, coffee shop window seat
- Variant 3: Same shot, home office desk
- Outcome learned: which setting/context the audience converts best in

### Pattern 2 — Demographic Family (hero has strong message + scene)
- Hero: 50+ woman, morning kitchen
- Variant 1: 50+ man, same scene
- Variant 2: 35-45 woman, same scene
- Variant 3: 35-45 man, same scene
- Outcome learned: which avatar segment actually converts (you may have been targeting wrong)

### Pattern 3 — Overlay Copy Family (hero has strong visual)
- Hero visual + Hook A
- Same visual + Hook B
- Same visual + Hook C
- Same visual + Hook D
- Outcome learned: which message frame wins for this audience-visual combo

### Pattern 4 — Format Family (hero is a strong static)
- Hero: 1:1 static
- Variant 1: 4:5 portrait of same scene
- Variant 2: 9:16 reels frame from same scene
- Variant 3: Carousel — 3 frames from the scene
- Outcome learned: which placement/format the creative wins in

### Pattern 5 — Awareness Level Family (advanced)
- Hero: problem-aware hook
- Variant 1: solution-aware hook (same visual)
- Variant 2: product-aware hook (same visual)
- Variant 3: most-aware hook (same visual)
- Outcome learned: which Eugene Schwartz stage the cold audience is actually at

---

## CONSTRUCTION SEQUENCE

```
Step 1: Confirm the hero
  - Either a winner from prior test (with data backing the "winner" claim)
  - OR a high-conviction pre-test concept (Jake + coach align it's worth a family bet)

Step 2: Choose the axis
  - Pick ONE pattern from the 5 above
  - Resist combining axes — that's a different test

Step 3: Define 3-5 variant members
  - Each is identical to the hero EXCEPT for the chosen axis variation
  - Number them clearly (Hero, V1-scene-bedroom, V2-scene-cafe, etc.)

Step 4: Brief the production
  - For visual axes → Higgsfield brief per variant (use higgsfield-image-gen skill)
  - For copy axes → just new overlay text on the existing visual
  - For format axes → reframe/resize the hero asset

Step 5: Document the family
  - family-map.md in outputs/ads/<concept>/
  - Each variant tagged with its axis attribute
  - Hypothesis: "If V1 outperforms hero, [X] drove the lift"

Step 6: Hand to meta-ads-operator
  - Family becomes a single ad set with 4-6 ads
  - Or split across multiple ad sets if the axis is targeting-level (demographic family)
```

---

## FAMILY MAP TEMPLATE

`outputs/ads/<concept>/family-map.md`:

```markdown
# Ad Family — <Concept Name> — <Date>

## Hero
- File: outputs/ads/<concept>/hero.png
- Visual: ...
- Hook: ...
- CTA: ...
- Why hero: [data from prior test OR pre-test conviction with reasoning]

## Variant axis
[Scene / Demographic / Copy / Format / Awareness Level]

## Variants
### V1 — <variant attribute>
- File: outputs/ads/<concept>/v1-<slug>.png
- Delta from hero: ...
- Hypothesis if V1 wins: ...

### V2 — <variant attribute>
- File: ...
- Delta from hero: ...
- Hypothesis if V2 wins: ...

### V3 — <variant attribute>
- File: ...
- Delta from hero: ...
- Hypothesis if V3 wins: ...

## Test plan
- Ad set: <name>
- Hero + variants share one ad set
- Budget per ad: $X
- Decision rule: if V_N outperforms hero by ≥20%, build next family on V_N's pattern
- Decision rule: if all variants lose to hero, hero pattern is stable — scale instead

## Anti-pattern check
- [ ] Only ONE axis varies across the family
- [ ] Hero data justifies the family investment
- [ ] Hypotheses are written BEFORE the test (no hindsight bias)
```

---

## INTEGRATION

- **ad-concept-generator** → produced the hero concept
- **reverse-engineer-winners** → may have produced the hero pattern from competitor analysis
- **higgsfield-image-gen** → produces the variant images
- **meta-ads-operator / campaign-launcher** → executes the family as a test ad set
- **post-launch-analysis** → reads results back and informs the NEXT family
- **dtc-second-brain** → family results feed `wiki/hooks-that-work.md` over time
