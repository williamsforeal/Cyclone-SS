# Mode — Meta Ads Operator

For launching, monitoring, and analyzing Meta (Facebook + Instagram) campaigns.

## When to use this mode

- Pre-launch campaign planning and structure
- Day 3 / 7 / 14 performance reviews
- Kill/scale/iterate decisions on live ad sets
- Post-launch synthesis (feeds into DTC Second Brain)
- Designing the next test round

## What loads with this mode

Skills:
- `campaign-launcher` — Pre-launch brief + Meta Ads MCP launch sequence
- `post-launch-analysis` — Statistical Analysis Hierarchy + decision tree
- `creative-testing-framework` — Variable-isolation test design

## Required inputs

Before any analysis runs:
- Brand pack (active brand)
- Offer brief (current campaign)
- At least one avatar
- Unit economics: AOV, gross margin, break-even CPA, target ROAS

Without unit economics, every recommendation is pattern-matched. Don't proceed without them.

## Coach gate

Per AI Com Academy phase-gating — **no scaling decisions without coach approval.** This skill flags scale candidates; coach signs off; then `ads_update_entity` happens.

## Outputs go to

- `plans/campaign-launch-<campaign>-<date>.md`
- `plans/test-round-<N>-<date>.md`
- `outputs/day-N-review-<campaign>-<date>.md`
- `outputs/post-launch-<campaign>.md`
- `outputs/decisions-<date>.md`
- Performance insights → `dtc-second-brain/raw/performance/` and `raw/ads/`
