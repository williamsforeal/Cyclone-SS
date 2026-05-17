---
name: google-ads-audit
description: Audits a Google Ads account — finds wasted spend, broken conversion tracking, low quality scores, search term leaks, and budget pacing issues. Delivers a prioritized fix list. Use when the user says "audit my Google Ads", "check Google Ads health", "find wasted spend on Google", or "Google Ads scorecard". Full live-pull requires Claude Cowork (macOS); from Claude Code, runs against a Google Ads CSV export.
---

# Google Ads Audit

Audit a Google Ads account. Score the account, find waste, surface tracking issues, deliver a prioritized fix list.

## Surface

- **Cowork (macOS)** — opens Chrome, navigates Google Ads UI, pulls live data
- **Claude Code** — analyzes a manually exported CSV

## Critical Rules

- Never fabricate metrics. Every number in the audit must trace to a row in the export OR a screen Cowork captured.
- Search-term audit is mandatory — broad-match wastage is the #1 leak in 80%+ of accounts the audit ever runs on. Flag any search term with > $X spend AND zero conversions.
- Quality Score audit per ad group — surface anything below 5/10 with the dimension breakdown (expected CTR, ad relevance, landing page).
- Conversion tracking audit FIRST. If conv tracking is broken, every other number is wrong. Check for: conversions > 0, attribution model set, conv actions linked to campaigns.
- Coaches gate scaling decisions. Recommendations marked `[needs coach review]`.

## Required CSV Columns (Code-side audit)

Minimum:
- Campaign, Ad group, Keyword
- Match type (Broad / Phrase / Exact / Broad Modifier)
- Cost
- Impressions, Clicks, CTR
- Conversions, Conv. value, Cost / conv.
- Quality Score (if available — Google now hides this in some accounts)
- Search terms report (separate export)

## Audit Dimensions

1. **Conversion tracking health** — pass/fail
2. **Budget pacing** — actual vs target spend per campaign
3. **Search-term hygiene** — wasted spend on irrelevant queries (broad-match leakage)
4. **Quality Score distribution** — % of keywords with QS ≥ 7
5. **Ad copy diversity** — # of RSAs per ad group; check pinning bottlenecks
6. **Negative keyword coverage** — top wasted-spend terms missing from negatives
7. **Bid strategy fit** — Max Conv vs Max Conv Value vs Manual — does it match the goal?

## Output Format

```markdown
# Google Ads Audit — YYYY-MM-DD — [Account]

## Score: X / 100
- Conversion tracking: [✅/❌]
- Search-term hygiene: X/100
- Quality Score: X/100
- Ad copy: X/100
- Pacing: X/100

## Wasted Spend Found: $X,XXX (last 30 days)
- $X — broad-match leakage on [examples]
- $X — non-converting keywords [list]
- $X — geo/time daypart leaks

## Top 5 Fixes (ranked by estimated monthly savings)
1. [Fix] — est savings $X — [needs coach review]
2. ...

## Quality Score Issues
| Keyword | QS | Weakest Dimension | Fix |
|---|---|---|---|
```

## What This Skill Does NOT Do

- Does not modify the Google Ads account — read-only audit.
- Does not generate new ad copy — handoff to `ai-marketing-team`.
- Does not work on Meta Ads — that's `meta-ads-audit`.

## References

- Source playbook: `A:\Scale AI Skool\Claude\marketing\The Google Ads Dashboard Skill for Claude Cowork.md`
