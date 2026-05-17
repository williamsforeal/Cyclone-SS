---
name: meta-ads-audit
description: Audits a Meta Ads account from a CSV export. Scores the account 0-100, finds wasted spend, detects creative fatigue, and delivers a prioritized fix list. Use when the user wants to audit Meta Ads, analyze Meta ad performance, find wasted Meta ad spend, or check for creative fatigue. Triggers on phrases like "audit my Meta Ads", "analyze my Facebook ads", "find wasted spend on Meta", "check my Meta ad performance", or "Meta Ads health check".
---

# Meta Ads Audit Skill

Audit a Meta Ads account from a CSV export. Score the account, find waste, detect fatigue, and deliver a prioritized fix list.

## Critical Rules

- Never fabricate data. Every number in the report must come from the CSV.
- If required columns are missing, stop and tell the user what to re-export. Do not guess.
- Always calculate wasted spend as an exact dollar figure — never say "significant" or "notable" without a number.
- Score dimensions independently. A high score in one area does not offset a low score in another.
- The top-5 fix list must be ranked by estimated monthly savings, highest first.
- If the CSV has fewer than 10 ads, note that the audit is limited and scores may not be statistically meaningful.

## Required CSV Columns

The minimum columns needed to run the audit:
- Campaign name, Ad set name, Ad name
- Amount spent
- Impressions, Reach, Frequency
- Link clicks, CTR
- Results (purchases/conversions), Cost per result (CPA)
- ROAS (if available)

Bonus columns that improve the audit:
- CPM, CPC, Conversion rate
- Video plays, ThruPlay rate, Hook rate, Hold rate

If ROAS is missing, calculate it from revenue and spend if both are available. If neither is available, skip ROAS analysis and note the gap.

## Audit Workflow

When the user triggers the audit:

1. **Validate data** — check for required columns, flag gaps, confirm date range and ad count
2. **Account overview** — total spend, total conversions, average CPA, average ROAS, number of active ads
3. **Creative health** — rank all ads by CPA, identify top 5 and bottom 5, calculate % of spend on zero-conversion ads
4. **Wasted spend** — sum all spend on ads with zero conversions. Break down by campaign. Calculate as % of total spend.
5. **Fatigue detection** — flag ads where frequency > 3.0 AND CTR is in the bottom quartile AND CPA is above account average
6. **Audience efficiency** — at ad set level, identify overlapping audiences competing for the same users
7. **Budget allocation** — compare budget distribution to performance distribution. Flag campaigns where spend share exceeds conversion share.
8. **Score and report** — score 0-100 across 6 dimensions (see references/report-template.md), generate the top-5 fix list ranked by savings.

## Output Format

Deliver the report as:

### Account Health Score: [X]/100 — [Grade]

**Overview:** [one-sentence summary]

**Dimension Scores:** table with scores and red/yellow/green status

**Wasted Spend:** $[exact amount] ([X]% of total spend)

**Fatigue Alerts:** list of flagged ads with frequency, CTR trend, recommendation

**Top 5 Fixes:** ranked by estimated monthly savings

## Troubleshooting

- **CSV is empty:** ask the user to re-export with the correct date range
- **Missing conversion data:** run without CPA/ROAS, note the limitation
- **Only campaign-level data:** run limited audit, note creative insights require ad-level export
- **Very large CSV (1000+ rows):** run normally, note longer processing time
