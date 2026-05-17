---
name: ad-concept-generator
description: Use this skill when the user asks Claude to generate ad concept directions, brainstorm new creative angles, or plan a batch of ads before any image generation happens. Concept-first work — produces strategic directions grounded in avatar + offer + awareness level, not generic prompts.
---

# Ad Concept Generator

**Purpose:** Generate strategic concept directions for static ads. Concepts are diversity layers — different angles, different awareness levels, different proof types. They are NOT images.

A concept is "render-ready" when it has: avatar, awareness level, hook type, message frame, visual direction, and CTA style — all decided.

---

## A CONCEPT'S 7 FIELDS

| Field | Example (Palm Aura) |
|---|---|
| Concept name | "Morning Pain Relief Ritual" |
| Avatar | 50+ morning stiffness sufferer |
| Awareness level | Problem-aware |
| Hook type | Pain-first |
| Message frame | "Before/after the warm-up" |
| Visual direction | Hands cradling mug, soft morning light, ceramic + linen |
| CTA style | Soft — "See how it works" |
| Why distinct | This concept owns "morning routine" — no other ad set hits that time-of-day specificity |

---

## GENERATION PROCESS

```
Step 1 — Diverge
Generate 8-12 raw concept seeds. Don't filter yet.

Step 2 — Cluster
Group seeds by avatar OR by angle. Look for redundancy.

Step 3 — Score against gates
For each concept candidate, gate-check:
  - Brand fit (palette + voice + aesthetic) — pass/fail
  - Avatar specificity (which avatar SPECIFICALLY, not "wellness shoppers") — pass/fail
  - Awareness level honesty (does the hook match where this person actually is?) — pass/fail
  - Compliance (Meta policy + brand claim discipline) — pass/fail
  - Distinct from other concepts in this batch — pass/fail

Step 4 — Converge to 5
Keep the 5 highest-fit concepts. Reject the rest with a one-line reason.

Step 5 — Render the concept brief for each
Use the 7-field template above.
```

---

## DIVERSITY HEURISTICS

Across a batch of 5 concepts, aim for variety across these dimensions:

| Dimension | Spread to aim for |
|---|---|
| Avatar | Hit 2-3 distinct avatars across the batch |
| Awareness level | Mix problem-aware + solution-aware + product-aware |
| Hook type | Mix pattern interrupt + curiosity + pain-first + proof-led |
| Visual mood | Mix calm + energetic + intimate + bold |
| Format hint | Suggest mix of static + video-frame-first + UGC-style |

If all 5 concepts hit the same avatar, awareness, and hook type — you're not testing breadth, you're testing micro-variants. Restart.

---

## ANTI-PATTERNS

- **"Make me 5 hand massager ads"** → no avatar, no angle, no awareness level. Refuse and ask for one.
- **5 concepts that are all "morning routine"** → no diversity. Test variants WITHIN a concept after a hero is validated, not BEFORE.
- **Concepts that name the product in the hook** → product-aware framing for a cold audience usually fails. Hook the pain or curiosity, not the SKU.
- **Generating concepts without reading brand pack** → guarantees off-brand outputs. Always read first.

---

## OUTPUT FORMAT

Write to `plans/concept-batch-<brand>-<date>.md`:

```markdown
# Concept Batch — <Brand> — <Date>
**Offer:** <current offer>
**Test round:** <N>
**Generated:** <count> seeds → <count> finalists

## Concept 1: <Name>
- Avatar: ...
- Awareness level: ...
- Hook type: ...
- Message frame: ...
- Visual direction: ...
- CTA style: ...
- Why distinct: ...
- Higgsfield brief reference: <link to higgsfield-brief file>

## Concept 2: ...
...

## Rejected (with reason)
- [Concept] — rejected because [redundant / off-brand / not distinct / etc.]

## Next action
- Jake reviews and approves which concepts go to Higgsfield
```

---

## INTEGRATION WITH WIKI

If a brand brain exists, consult `wiki/hooks-that-work.md` and `wiki/competitor-angles.md` before generating concepts. The brain already knows what's been tested and what's saturated — don't regenerate concepts the brain has already failed on.

If a brand brain doesn't exist yet, that's a flag to consider running the `dtc-second-brain` mode first.
