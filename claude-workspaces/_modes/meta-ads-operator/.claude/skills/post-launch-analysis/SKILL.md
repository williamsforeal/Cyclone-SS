---
name: post-launch-analysis
description: Use this skill when the user asks Claude to review live Meta campaign performance — Day 3, Day 7, or Day 14 reviews, kill/scale/iterate decisions, or any "how is my campaign doing" question. Encodes the Scale DTC Statistical Analysis Hierarchy and the AI Com Academy decision tree.
---

# Post-Launch Analysis

**Purpose:** Read Meta campaign data → output kill/scale/iterate decisions per ad set, grounded in real numbers (not pattern-matched averages).

---

## INPUT REQUIRED

Before analysis can run, Jake must provide (paste or via Meta Ads MCP):

- Per ad set: spend, impressions, reach, CPM, link clicks, CTR, ATC, IC (Initiate Checkout), purchases, ROAS
- Per ad: hook rate (if tracked), hold rate, video view %, thumbstop rate
- Time window (last 3/7/14 days OR specific date range)
- Unit economics: AOV, gross margin, break-even CPA, target ROAS

**If unit economics aren't given:** stop and ask. Without them, every recommendation is pattern-matched (per Hallucination Protocol). Don't proceed.

---

## THE STATISTICAL ANALYSIS HIERARCHY (Scale DTC method)

Read metrics in this order. Earlier metrics gate later ones.

```
1. Hook Rate (thumbstop / 3-sec video view rate)
   ├── <25% → creative top is failing → kill or rework hook before reading any other metric
   └── ≥25% → proceed to step 2

2. Hold Rate (75% video view rate or scroll depth)
   ├── Low relative to hook rate → body of creative is losing them → rework body
   └── Healthy → proceed to step 3

3. CTR (Link Click-through Rate)
   ├── <1% → creative-to-LP message mismatch OR weak CTA → fix copy/CTA
   └── ≥1% → proceed to step 4

4. ATC Rate (Add-to-Cart per landing page visit)
   ├── <5-10% [VERIFY benchmark for category] → PDP problem, not ad → switch to shopify-store-build mode
   └── healthy → proceed to step 5

5. CVR (Purchase per ATC)
   ├── <15% [VERIFY benchmark] → checkout friction OR offer weakness → audit checkout + offer stack
   └── healthy → proceed to step 6

6. CPA vs Break-even
   ├── CPA > break-even → not profitable yet; kill or refine before scaling
   ├── CPA ≈ break-even → hold, gather more data
   └── CPA < break-even → scaling candidate (coach approval required)
```

**The hierarchy logic:** if step N is failing, don't waste time analyzing step N+1. Fix step N first.

---

## DECISION TREE PER AD SET

| Pattern | Decision |
|---|---|
| Hook rate <25% AND CTR <1% | **KILL** — creative isn't connecting; rework or replace |
| Hook rate ≥25% AND CTR ≥1% AND ATC <5% | **ITERATE PDP** — ad is doing its job, store is leaking |
| Hook rate ≥25% AND CTR ≥1% AND ATC ≥5% AND CVR <15% | **ITERATE OFFER** — checkout or offer mechanics breaking |
| All metrics in spec AND CPA > break-even | **HOLD or REFINE** — close to viable, watch one more day |
| All metrics in spec AND CPA ≈ break-even | **HOLD** — gather more data, don't scale prematurely |
| All metrics in spec AND CPA < break-even | **CANDIDATE TO SCALE** — pending coach approval |
| CPM unusually high vs benchmark | **CHECK** — audience overlap or competing auction; not a creative problem |
| Hook rate good but engagement plummets over 7 days | **CREATIVE FATIGUE** — rotate in new creatives, don't kill ad set |

---

## DAY 3 / 7 / 14 PROTOCOLS

### Day 3 review (post-launch)
- Sample size warning: at $20/day, 3 days = ~$60. Often too small for statistical confidence at the ad level.
- **Only kill obvious failures** at Day 3 (hook rate <15%, zero ATC at significant spend, Meta delivery blockers).
- Don't make scaling decisions at Day 3.

### Day 7 review
- Apply the hierarchy and decision tree per ad set
- Identify top 1-2 winners + bottom 1-2 losers
- Plan iteration for the middle (new hooks, refined targeting)
- **Scale only with coach approval.**

### Day 14 review (or campaign end)
- Full synthesis
- Pattern recognition across ad sets (what attribute correlates with winners?)
- Insights to log to DTC Second Brain `raw/performance/`
- Hypothesis for next campaign

---

## OUTPUT FORMAT

Write to `outputs/day-N-review-<campaign>-<date>.md`:

```markdown
# Day <N> Review — <Campaign Name> — <Date>

## Campaign-level summary
- Spend: $X
- Revenue: $Y
- ROAS: Z
- Break-even ROAS: <ratio>
- Status: <ON TRACK / UNDER-PERFORMING / SCALING CANDIDATE>

## Per ad set
### Ad Set A: <name>
- Hook rate: X% (gate: pass/fail)
- CTR: X% (gate: pass/fail)
- ATC rate: X% (gate: pass/fail)
- CVR: X% (gate: pass/fail)
- CPA: $X vs break-even $Y
- **Decision: KILL / ITERATE / HOLD / SCALE-CANDIDATE**
- **Reasoning:** [1-2 lines]

### Ad Set B: ...
...

## Insights to log to DTC Second Brain
- raw/performance/ : [what to drop in]
- raw/ads/ : [hook patterns observed]

## Coach approval needed for
- [Any scale recommendation]
- [Any significant structural change]

## Next action
- [Single concrete next step]
```

---

## HALLUCINATION PROTOCOL — APPLIED

Every benchmark cited in this skill ("Hook rate <25% = kill") is a **starting heuristic**. Real thresholds depend on:
- Niche (wellness vs BBQ vs apparel)
- Format (video vs static)
- Audience (cold vs warm)
- Price point (low-ticket vs high-ticket)

When recommending a threshold, flag with `[VERIFY against your account benchmarks]`. Don't manufacture certainty.

---

## ESCALATION

If Jake's CPA is 2x+ break-even after Day 7:
- Recommend full creative reset, not iteration
- Suggest stepping back to creative-strategy mode to rebuild the hook bank

If account-level CPM has doubled overnight:
- Suggest checking for: bid changes, audience overlap, competing seasonal pressure, or pixel/CAPI issues
- Don't recommend creative changes until account-level health is verified
