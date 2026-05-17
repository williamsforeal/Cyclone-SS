---
name: necessary-beliefs
description: Use this skill when the user asks Claude to identify or refine the Necessary Beliefs that gate purchase for a brand — the 5-7 things a cold prospect must believe before they'll buy. Encodes the Mark Builds Brands methodology. Each belief becomes a creative angle, a PDP section, or a sales-funnel touchpoint.
---

# Necessary Beliefs

**Purpose:** Identify the specific beliefs a prospect must hold to buy. Each unbelieved belief is a leak in the funnel.

This is Mark Builds Brands methodology, adapted: prospects don't buy because they object — they buy because they're missing a belief. Find the missing belief, install it, and the objection dissolves.

---

## STRUCTURE

A Necessary Beliefs doc lists 5-7 beliefs, prioritized by leverage. Each belief has:

| Field | Detail |
|---|---|
| Belief # | Priority rank |
| Belief statement | "[Customer] believes [X]" — specific, testable |
| Why it matters | Without this belief, [what won't happen] |
| Current state | What does the cold prospect currently believe? |
| Gap | The delta between current and necessary belief |
| Proof needed | What evidence installs the belief? |
| Where it lives | PDP section / ad type / email touchpoint |

---

## EXAMPLE — PALM AURA (illustrative, [VERIFY with Jake's actual doc])

| # | Belief | Why it matters | Current state | Proof needed |
|---|---|---|---|---|
| 1 | "Heat + massage genuinely relieves my hand pain" | Without this, the product is just gadgetry | "I've tried other things that didn't work" | Mechanism explanation + customer reviews + visible warming demo |
| 2 | "This specific device will work for MY specific pain" | Without this, prospect dismisses as not-for-me | "Products like this are gimmicks" | Avatar-specific testimonials + multi-condition examples |
| 3 | "I can use this without complicated setup" | Without this, friction blocks purchase | "Wellness devices are usually complicated" | 3-step usage demo + UGC of older user operating it |
| 4 | "This will arrive in time / I'm not betting on a slow ship" | Without this, time-sensitive buyers leave | "Dropship products take forever" | Visible shipping timeline + US 3PL claim if true |
| 5 | "If it doesn't work, I'm not stuck with it" | Without this, risk dominates | "I always get burned by online wellness products" | 60-day money-back guarantee + clear return process |
| 6 | "Buying for gift means it will arrive on time" (Q4/holiday only) | Without this, gift buyers don't convert | "I'd buy as gift but it'll arrive late" | Order-by-date callouts + holiday shipping promise |
| 7 | "This is a brand I'd trust, not some Amazon flip" | Without this, premium price feels excessive | "Why $89 when Amazon has it for $30?" | Brand story + premium materials + lifestyle photography |

---

## CONSTRUCTION PROCESS

```
Step 1 — Read the avatar(s) and existing customer voice
Where's the friction? What objections show up in reviews/support?

Step 2 — Brainstorm 12-15 candidate beliefs
Don't prioritize yet. Capture every belief a prospect would need.

Step 3 — Prioritize by leverage
For each belief, ask: "If this belief stayed unbelieved, would the prospect still buy?"
  - Yes → low priority
  - No → high priority

Step 4 — Cut to 5-7
Keep the highest-leverage. Reject the rest with a reason ("redundant with #2," "addressed by warranty," etc.).

Step 5 — Map proof to each
For each kept belief, name what specific proof element installs it.
Proof types:
  - Mechanism explanation
  - Customer testimonial (real, never fabricated)
  - Demo / video
  - Authority cite (research, expert)
  - Social proof (count, rating, brand mentions)
  - Guarantee / risk reversal
  - Visual evidence (before/after if compliant, otherwise process shot)

Step 6 — Map placement
For each belief, name where in the funnel it gets installed:
  - PDP hero / trust bar / how-it-works / testimonials / FAQ / guarantee
  - Ad copy (and which avatar's ads)
  - Email sequence (which step)
```

---

## OUTPUT FORMAT

Save to `brands/<brand>/necessary-beliefs.md`:

```markdown
# Necessary Beliefs — <Brand>
**Last refined:** <YYYY-MM-DD>
**Avatar(s) addressed:** [list]

## Belief #1 (highest leverage)
- Belief: "[Customer] believes [X]"
- Why it matters: ...
- Current state: ...
- Gap: ...
- Proof needed: ...
- Where it lives:
  - PDP: ...
  - Ads: ...
  - Email: ...

## Belief #2
...

(continue for all 5-7)

## Rejected candidates (with reason)
- [Belief] — rejected because [...]

## Coverage check
- [ ] Every kept belief has at least 2 proof placements
- [ ] PDP sections collectively address every belief
- [ ] Ad creative briefs reference at least one belief per concept
- [ ] Email sequence touches each belief at least once

## [VERIFY] flags
- [Any beliefs that need primary research to confirm — surveys, customer interviews]
```

---

## INTEGRATION

This doc is the bridge between strategy (creative-strategy mode) and execution (every other mode):

- **shopify-store-build** → each PDP section installs one or more beliefs
- **static-ad-generator** → each ad concept addresses 1-2 beliefs
- **tiktok-slideshow** → each slideshow body section can install one belief
- **meta-ads-operator** → testing rounds can isolate which beliefs move CVR
- **dtc-second-brain** → as performance data comes in, refine which beliefs actually moved the needle
