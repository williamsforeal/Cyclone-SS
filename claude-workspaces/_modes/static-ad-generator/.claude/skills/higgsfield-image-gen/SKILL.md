---
name: higgsfield-image-gen
description: Use this skill when the user asks Claude to generate ad images via Higgsfield. Defines the briefing format that produces brand-consistent outputs (not generic AI slop), the iteration loop for refining toward a winner, and the per-brand aesthetic rules.
---

# Higgsfield Image Generation

**Purpose:** Brief Higgsfield correctly. A good brief produces brand-consistent winners; a bad brief produces AI-stock-image noise.

---

## THE 8-FIELD HIGGSFIELD BRIEF

Every generation call needs all 8 fields. Missing fields produce drift.

| Field | What goes here |
|---|---|
| 1. Subject | The literal thing being shown (product, person + product, scene without product) |
| 2. Action / pose | What the subject is doing — be specific (not "person using product" but "woman cradling hand massager between palms, eyes closed, slight smile") |
| 3. Setting | Where it takes place (kitchen counter / bedroom morning light / backyard grill / coffee shop) |
| 4. Lighting | Time of day + light quality (golden hour, overcast soft, hard noon, warm interior lamp) |
| 5. Color palette | Hex codes from brand pack — primary, secondary, accent |
| 6. Aesthetic reference | The mood word(s) — "Kinfolk editorial" / "rugged American backyard" / "minimalist Japanese ritual" |
| 7. Composition | Rule of thirds / centered / off-center / full bleed / negative space heavy |
| 8. Aspect ratio | 1:1 (feed) / 4:5 (portrait feed) / 9:16 (stories/reels) / 16:9 (landscape) |

Optional 9th: **Negative directives** — what to AVOID. Especially useful for ruling out AI tells (six fingers, plastic skin, generic stock-photo posing).

---

## PER-BRAND AESTHETIC RULES

### Abundria / Palm Aura
- **Lean into:** soft natural light, hands in intimate frames, ceramic + linen + wood textures, plants, morning rituals, refined simplicity, muted earth tones (sage, terracotta, cream, oat)
- **Avoid:** pharmacy/clinical lighting, white-coat doctor energy, stock-medical visuals, fluorescent overhead light, bright/saturated colors, hospital aesthetics
- **Reference moods:** Kinfolk editorial, Cereal magazine, Aēsop product photography
- **Color palette:** [VERIFY — pull from `brands/abundria-palm-aura/brand-pack.md`]

### Pit Smith Co.
- **Lean into:** dirty grill grate → clean grate (proof shots), cordless freedom (no cord in shot), beer + grill lifestyle, Father's Day gifting scenes, masculine + practical, ember/warm tones
- **Avoid:** cheap-gadget energy, novelty product styling, overly clinical product shots, women-coded aesthetics that miss the avatar
- **Reference moods:** Traeger / Yeti / Filson — rugged but premium
- **Color palette:** charcoal_black #171717, cast_iron_navy #10233F, ember_red #B7372F, pit_white #F8F6F1, brass_heat #C79B52

### Cold Plunge (TBD)
- **Lean into:** [Per market analysis] — feminine ritual, nervous-system regulation, perimenopause/midlife, sober recovery, couples ritual, slow + intentional
- **Avoid:** athletic recovery angles, "do hard things" energy, biohacker bro aesthetic, Wim Hof imagery, gym-adjacent visuals
- **Reference moods:** TBD — likely Kinfolk-adjacent with cold/blue tones rather than warm

---

## ITERATION LOOP

```
Round 1: Generate 4 variants from the brief
  → Jake picks the strongest 1-2

Round 2: Refine the picked variant(s)
  - Same brief + specific deltas ("tighter on the hands, less background")
  → Generate 4 more, pick 1

Round 3: Final polish
  - Same brief + final tweaks
  → 1-2 production-ready images

Don't try to nail it in Round 1. Always plan 3 rounds.
```

---

## OVERLAY TEXT RULES

If the ad uses overlay text (headline burned onto the image):

1. Generate the image WITHOUT text first
2. Add text in Canva or Photoshop afterward (not via Higgsfield) — better typography control
3. Reserve the visual area for text in the composition (top-third or bottom-third negative space)
4. Use brand fonts from the brand pack (Oswald Bold for Pitsmith, [check] for Abundria)
5. Text contrast must hit WCAG AA against the image background

---

## SAFETY + COMPLIANCE

- **No real identifiable people without permission.** Generated faces should be unmistakably generic — no celebrity look-alikes, no specific public figures.
- **No medical claim imagery for wellness brands.** Especially Palm Aura — Meta will read clinical setups as health claims.
- **No fake testimonials.** If a person appears in a "review" frame, they must be either (a) a real customer (UGC, with permission) or (b) framed as a generic lifestyle shot, not a quoted testimonial.
- **No before/after for wellness products.** Especially Palm Aura, Cold Plunge. Meta + brand integrity both reject.

---

## OUTPUT FORMAT

Save brief to `plans/higgsfield-brief-<concept>-<date>.md`:

```markdown
# Higgsfield Brief — <Concept Name> — <Date>

## 8-Field Brief
1. Subject: ...
2. Action: ...
3. Setting: ...
4. Lighting: ...
5. Color palette: <hex codes from brand-pack>
6. Aesthetic reference: ...
7. Composition: ...
8. Aspect ratio: ...

## Negative directives
- Avoid: ...

## Variant axes (what to vary across 4 outputs)
- Variant 1: <attribute>
- Variant 2: <attribute>
- Variant 3: <attribute>
- Variant 4: <attribute>

## Overlay text plan
- Headline: ...
- Subhead: ...
- CTA text (if on-image): ...
- Font: <from brand-pack>
- Color: <hex>
- Position: <top-third / bottom-third>

## Iteration plan
- Round 1: 4 variants → pick strongest
- Round 2: refine winner with deltas
- Round 3: production polish
```

Save outputs to `outputs/ads/<concept>/<variant>.png` with a `family-map.md` documenting which variant is which.
