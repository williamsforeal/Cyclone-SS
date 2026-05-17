---
name: creative-testing-framework
description: Use this skill when the user asks Claude to design a creative testing plan, structure a hook/angle/format test, or decide what to test next. Encodes the principle of isolating one variable per test, batch sizes for statistical confidence, and the iteration cycle that compounds learnings.
---

# Creative Testing Framework

**Purpose:** Design tests that produce clean signal, not noise. One variable per test. Batch sizes that justify decisions.

---

## THE THREE LEVERS (from Ecom Ops Architect)

Per Jake's Ecom Ops role definition, creative testing consolidates into:

1. **Hook performance** — pattern interrupts, curiosity, pain-first
2. **Message clarity** — tight problem/solution, proof, objection handling
3. **CTA calibration** — soft vs direct, calibrated to funnel temperature

A single test isolates ONE of these three. Never test hook + message + CTA in one ad set — the data won't tell you which moved the needle.

---

## TEST DESIGN PATTERNS

### Pattern 1 — Hook Test (most common)
- Hold message, format, CTA constant
- Vary the hook (3-5 variants)
- Run as ads within a single ad set
- Outcome: which hook attribute (pattern interrupt vs pain-first vs proof) wins

### Pattern 2 — Angle Test
- Hold hook style constant
- Vary the underlying angle (different avatar/pain/promise)
- Run as separate ad sets
- Outcome: which avatar or angle is biggest market

### Pattern 3 — Format Test
- Hold message constant
- Vary format (static vs video vs UGC vs slideshow)
- Run as separate ad sets OR ads within
- Outcome: which format the audience responds to (informs creative production pipeline)

### Pattern 4 — Offer Test
- Hold creative constant
- Vary the offer (bonus stack, guarantee terms, urgency mechanism)
- Requires distinct landing pages or PDP variants
- Outcome: which offer mechanic moves CVR

### Pattern 5 — Awareness Level Test (Eugene Schwartz)
- Hold avatar constant
- Vary the awareness-level lead (problem-aware → solution-aware → product-aware → most-aware)
- Run as separate ad sets
- Outcome: which awareness stage the cold audience is actually at

---

## BATCH SIZE LOGIC

For statistical confidence on conversion events:

| Spend per ad set | Conversions to expect | Confidence level |
|---|---|---|
| <$100 | Single digits | Anecdotal — kill obvious failures only |
| $100-300 | 5-15 | Directional — kill clear losers, hold middle |
| $300-500 | 15-30 | Confident on extremes — kill bottom, scale top with caveats |
| $500+ | 30+ | Statistical confidence on most decisions |

[VERIFY — these thresholds assume DTC product ~$50-150 AOV. Adjust for high-ticket or low-ticket.]

**Rule:** Don't make scaling decisions on <15 conversions. The variance is too high.

---

## ITERATION CYCLE (compound learnings)

```
Test Round 1 → identify winner → Test Round 2 builds on Round 1's winner

Round 1: Test 3 hooks (A, B, C)
  Winner: Hook B
  Insight: Pain-first hooks outperform curiosity for this avatar

Round 2: Build on Hook B's pattern
  Test 3 new pain-first hooks (B-variant-1, B-variant-2, B-variant-3)
  Winner: B-variant-2
  Insight: Specific pain ("morning hand stiffness") beats general pain ("hand pain")

Round 3: Build on B-variant-2's insight
  Test 3 specific-pain hooks across new pain segments
  Winner: ...

After 5-6 rounds, you have a hook bank of 10-15 validated patterns instead of 5-6 random tests.
```

This is how the brand brain compounds — each test answer goes into `dtc-second-brain/raw/ads/` and `outputs/`, then gets pulled into `wiki/hooks-that-work.md` on next compile.

---

## ANTI-PATTERNS TO AVOID

| Anti-pattern | Why it's wrong |
|---|---|
| Testing 8 hooks in one ad set | No budget per hook reaches statistical confidence |
| Testing hook + format + CTA simultaneously | Can't attribute which variable moved the needle |
| Killing an ad set at $40 spend with 1 purchase | Sample size too small; variance dominates |
| Running the same creative for 30+ days without rotation | Creative fatigue kills CTR; rotate before the curve drops |
| Scaling on Day 3 because hook rate looks good | Hook rate predicts attention, not purchase |
| Testing "different audiences" with the same creative | You're testing audiences, not creative — separate ad set per audience needed |
| Ignoring Meta's auto-optimization | Letting Meta run for 3-5 days before manual intervention gives the algo room to find pockets |

---

## INTEGRATION WITH OTHER MODES

| Mode | Handoff to / from this skill |
|---|---|
| `creative-strategy` | Provides avatar + angles + necessary beliefs → feed test design |
| `static-ad-generator` | Generates the creative variants for hook tests |
| `dtc-second-brain` | Receives test results in `raw/ads/`, `raw/performance/` |
| `campaign-launcher` | Executes the test plan you design here |
| `post-launch-analysis` | Reads results back; you redesign the next round |

---

## OUTPUT FORMAT

Write test plan to `plans/test-round-<N>-<date>.md`:

```markdown
# Test Round <N> — <Date>

## Hypothesis
[What you're testing and why]

## Variable being isolated
[Hook / Angle / Format / Offer / Awareness Level]

## Held constant
- [Things NOT varied in this test]

## Variants
1. [Variant A — description]
2. [Variant B — description]
3. [Variant C — description]

## Success criteria
- Primary metric: [hook rate / CTR / CPA]
- Threshold: [specific number]
- Decision rule: [what wins, what kills]

## Sample size plan
- Budget per ad set: $X
- Expected conversions: Y
- Duration: Z days

## What this test rules out
[If variant X wins, we'll know it's NOT [hypothesis Y]]

## Next round depends on
[How this test's outcome shapes the next test]
```
