---
name: avatar-builder
description: Use this skill when the user asks Claude to define, build, or refine customer avatars for a brand. Goes beyond demographics into psychographics, beliefs, current behavior, and target behavior. Outputs 2-3 distinct avatars per brand that downstream modes can target with avatar-specific ads, copy, and content.
---

# Avatar Builder

**Purpose:** Build specific, actionable avatars. An avatar isn't a demographic — it's a person with a name, a life, beliefs, and current behavior the brand can change.

---

## WHAT A USABLE AVATAR LOOKS LIKE

### Bad avatar (demographic)
> "Women 35-65, household income $50K+, interested in wellness"

This is useless. You can't write a hook for this person. You can't pick a scene for an image. You can't decide what objection to handle.

### Good avatar (specific persona)
> **The Crafters & Makers Avatar**
> Sarah, 52, runs a small Etsy ceramics business from her garage studio. Hands cramp after 2 hours of throwing or sanding. She's tried KT tape, ice baths, OTC anti-inflammatories. She doesn't trust "wellness gadgets" but will pay for tools that work. She follows hand-care creators on Instagram. She buys quality once instead of cheap repeatedly. Currently believes hand pain is just part of getting older + part of doing what she loves.

This you can write hooks for. Visuals for. Objections for.

---

## THE 8 AVATAR FIELDS

| Field | What goes here |
|---|---|
| 1. Name (fictional) | A name that makes the avatar feel real |
| 2. Demographic snapshot | Age, location type, household structure (briefly) |
| 3. Identity / role | What they call themselves first ("I'm a ceramicist" not "I'm 52") |
| 4. The pain (specific) | Not "hand pain" — specific physical and contextual pain |
| 5. Current behavior | What they've tried, what they're using, what they've given up on |
| 6. Beliefs (current) | What they believe about their pain and about solutions |
| 7. Beliefs (target) | What they need to believe to buy |
| 8. Where they hang out | Platforms, communities, content they consume |

---

## CONSTRUCTION PROCESS

```
Step 1 — Read source material
Brand pack, customer reviews (raw/customers/ if brain exists), competitor angle analysis, survey data, interview transcripts.

Step 2 — Cluster customers by pain context
Don't cluster by demographic. Cluster by:
  - WHY they have the pain (occupation, habit, life stage)
  - WHEN it shows up (morning, after activity, chronic)
  - HOW they currently relate to it (resigned / fighting / desperate / curious)

Step 3 — Name 4-6 candidate avatar clusters
Each cluster gets a working name (e.g., "Crafters & Makers", "Keyboard Athletes", "Morning Stiffness 50+", "Caregivers", "Sports Recovery").

Step 4 — Score each candidate
- Size of segment (rough estimate)
- Brand fit (does this avatar align with the brand's voice and positioning?)
- Reachability (can this avatar be targeted on Meta/TikTok?)
- Conversion potential (specific enough that creative for this avatar would convert?)

Step 5 — Pick 2-3 to develop fully
Generally:
  - Primary avatar (the bullseye — biggest segment + best brand fit)
  - Secondary avatar (a near-adjacent segment worth testing)
  - Optional third (a stretch test — different pain context, same product)

Step 6 — Build the 8-field doc for each
```

---

## PRIORITY ORDER (for ad sequencing)

When Jake's running a test campaign, ad sets should map to avatars in priority order:

1. **Primary avatar** — highest budget, most creative variants
2. **Secondary avatar** — meaningful budget, 3-4 creative variants
3. **Stretch avatar** — small budget, 2-3 variants — testing the angle, not optimizing yet

---

## OUTPUT FORMAT

Save to `brands/<brand>/avatar-sheet.md`:

```markdown
# Avatars — <Brand>
**Last refined:** <YYYY-MM-DD>
**Total avatars:** [count]

## Avatar 1 (PRIMARY): <Name + Identifier>

### Snapshot
[3-4 sentence vignette — like the Sarah example above]

### Demographic
- Age range: ...
- Location: ...
- Household: ...

### Identity / role
- "I am a [thing they call themselves]"

### The pain (specific)
- Physical: ...
- Contextual: ...
- When it shows up: ...

### Current behavior
- Has tried: [list]
- Currently using: [list]
- Has given up on: [list]

### Beliefs (current)
- About the pain: ...
- About solutions: ...
- About brands in this category: ...

### Beliefs (target — what they need to believe to buy)
- [Belief 1] — see necessary-beliefs.md #N
- [Belief 2] — see necessary-beliefs.md #N
- ...

### Where they hang out
- Platforms: ...
- Communities: ...
- Content they consume: ...

### Ad set notes
- Hook tone: ...
- Visual tone: ...
- Awareness level: ...

---

## Avatar 2 (SECONDARY): <Name + Identifier>
[Same structure]

---

## Avatar 3 (STRETCH): <Name + Identifier>
[Same structure]

---

## Rejected candidates (with reason)
- [Avatar] — rejected because [too small / off-brand / not reachable / etc.]

## [VERIFY] flags
- [Anything based on assumption, not primary data — needs survey or interview]
```

---

## INTEGRATION

- `necessary-beliefs.md` → cross-reference which beliefs apply to which avatars
- `awareness-matrix.md` → map each avatar to their awareness stage
- `static-ad-generator/ad-concept-generator` → reads avatars to generate concepts per avatar
- `meta-ads-operator/campaign-launcher` → builds ad sets per avatar
- `tiktok-slideshow/hook-bank-generator` → tags hooks by target avatar
- `dtc-second-brain` → after performance data, validate which avatars actually convert
