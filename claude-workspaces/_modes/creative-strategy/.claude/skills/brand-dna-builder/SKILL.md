---
name: brand-dna-builder
description: Use this skill when the user asks Claude to define or refine a brand's core DNA — mission, USP, core promise, voice, visual identity, archetype mapping. Outputs the foundational brand-pack.md that all downstream creative work depends on.
---

# Brand DNA Builder

**Purpose:** Define the brand's core identity in a way that's actionable for downstream creative work (PDPs, ads, content, slideshows).

A brand DNA isn't a vibe board — it's a set of decisions that bind every creative output.

---

## THE 10 DNA FIELDS

| Field | Question it answers |
|---|---|
| 1. Brand name + parent | What's the brand called, who owns it? |
| 2. Mission | What does this brand stand for? |
| 3. Core product / category | What's the brand actually selling? |
| 4. USP (Unique Selling Proposition) | What makes this brand different from saturated competitors? |
| 5. Core promise | What does the brand promise the customer? (Single sentence.) |
| 6. Voice attributes | 3-5 adjectives that describe how the brand sounds |
| 7. Visual identity | Palette (hex), typography, aesthetic reference |
| 8. Archetype mapping | Jungian primary + secondary archetype |
| 9. What it's NOT | The opposite — what this brand explicitly rejects |
| 10. Founder/origin story | Why this brand exists (humans buy from humans) |

---

## ARCHETYPE MAPPING (Jungian — Jake operates from this)

Each brand maps to a PRIMARY archetype and a SECONDARY for tension/depth.

| Archetype | What it represents | DTC examples |
|---|---|---|
| Sage | Wisdom, knowledge, truth | Headspace, NYT, Aesop |
| Creator | Innovation, expression | Notion, Apple, Lego |
| Caregiver | Protection, nurture | Burt's Bees, Dove |
| Hero | Mastery, achievement | Nike, Patagonia |
| Warrior | Discipline, strength | Crossfit, Tactical brands |
| Lover | Beauty, intimacy | Glossier, La Mer |
| Magician | Transformation | Apple (also), Tesla |
| Ruler | Authority, prestige | Rolex, Mercedes |
| Innocent | Purity, simplicity | Coca-Cola, Dove (also) |
| Explorer | Freedom, adventure | Patagonia (also), Subaru |
| Jester | Joy, play | Old Spice, Wendy's |
| Everyman | Belonging, ordinary | Target, IKEA |

**Abundria mapping** (per Jake's note): Sage + Creator/Warrior/Lover
- Sage primary — wisdom, refined knowledge, calm authority
- Creator/Warrior/Lover varies by product line — Palm Aura leans Caregiver

**Pit Smith mapping** (proposed, [VERIFY with Jake]): Warrior + Everyman
- Warrior primary — discipline, mastery of the grill, pitmaster identity
- Everyman secondary — accessible to any backyard host, not elitist

---

## WHAT IT'S NOT (the negative definition)

This is the most under-used DNA field. Define what the brand explicitly REJECTS.

Examples:
- **Abundria is NOT:** clinical, pharmacy-aesthetic, generic-wellness, biohacker-bro, anti-aging-as-vanity
- **Pit Smith is NOT:** novelty-gadget, cheap-Amazon, women-coded backyard, commercial-kitchen

When you can name what a brand isn't, downstream creative gets sharper. A copywriter or designer can immediately reject off-brand directions.

---

## VOICE ATTRIBUTES

Pick 3-5 adjectives. They must:
- Be specific (not "professional" or "friendly" — these mean nothing)
- Be testable (a copy review can pass/fail against them)
- Avoid contradictions ("formal AND playful" usually fails in execution)

Examples:
- **Abundria:** refined, grounded, observant, intentional, calm
- **Pit Smith:** rugged, practical, confident, summer-ready (no formality, no clinical, no novelty)

---

## OUTPUT FORMAT

Update `brands/<brand>/brand-pack.md` (top section). Format:

```markdown
# Brand DNA — <Brand>

## 1. Identity
- Brand: <name>
- Parent: <parent co>
- Status: <pre-launch / live / scaling>

## 2. Mission
[One sentence — what does this brand stand for in the world]

## 3. Core product / category
[What it sells]

## 4. USP
[Single sentence — what makes it different from saturated competitors]

## 5. Core promise
[What the customer can expect — one sentence]

## 6. Voice attributes
- [Adjective 1]
- [Adjective 2]
- [Adjective 3]
- (optional 4-5)

## 7. Visual identity
- Palette: [hex codes with token names]
- Typography: [heading font, body font, fallbacks]
- Aesthetic reference: [Kinfolk / Filson / Aesop / etc.]

## 8. Archetype
- Primary: [archetype]
- Secondary: [archetype]
- How they show up: [1-2 sentences each]

## 9. What this brand is NOT
- [Explicit rejection 1]
- [Explicit rejection 2]
- [Explicit rejection 3]

## 10. Founder / origin
[2-3 sentences — why this brand exists]
```

---

## VALIDATION CHECKLIST

Before locking the DNA:

- [ ] A copywriter could write 3 on-brand headlines from this alone
- [ ] A designer could mock 3 on-brand visuals from this alone
- [ ] Jake's coach could read it and immediately know the brand position
- [ ] Every claim in the DNA can be defended (no aspirational fiction)
- [ ] The "what it's NOT" section is as developed as the "what it IS"
