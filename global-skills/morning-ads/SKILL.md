---
name: morning-ads
description: Daily Meta Ads performance brief. Pulls 7-day data from Meta Ads Manager, analyzes creative performance, and saves a formatted report. Use when the user says "morning ads brief", "daily ads report", "Meta performance check", "pull yesterday's ads data", or schedules a recurring ads report. Full execution requires Claude Cowork app (macOS computer use); from Claude Code this skill provides the briefing structure + recommended Cowork prompt.
---

# Morning Ads Brief

Daily Meta Ads performance brief. Pulls 7-day data, analyzes creative performance, saves a report.

## Surface

This skill spans two surfaces:

- **Cowork (macOS)** — the operational version. Computer use opens Chrome → Ads Manager → pulls live data. Runs on schedule (e.g. 6am daily).
- **Claude Code** — this SKILL.md. Provides the briefing structure, the Cowork prompt to copy, and the report format for analyzing exports.

Full daily-auto execution requires Cowork. From Code, you can analyze CSV exports.

## Critical Rules

- Never fabricate ad performance numbers. Every metric comes from the export or the live pull.
- Date stamps in the report must be exact — the report header is `meta-ads-report-YYYY-MM-DD.md`.
- Highlight the top 3 wins AND the top 3 leaks. Don't bury the leaks.
- Flag creative fatigue (frequency > 3.5 + CTR declining > 20% week-over-week) explicitly.
- Coaches gate scale decisions — never recommend "kill" or "scale" as a final answer. Recommend, but mark `[needs coach review]`.

## Cowork Prompt (copy into a Cowork task)

```
Open Chrome and go to my Meta Ads Manager.

Pull performance data for the last 7 days across all active campaigns.
I need: campaign name, spend, impressions, clicks, CTR, CPC,
conversions, CPA, and ROAS for each campaign.

Then drill down to ad-level for the top 3 spenders and bottom 3 performers.

Output a report to ~/Desktop/meta-ads-report-{today}.md with:
1. Executive summary (3 bullets — what changed vs last week)
2. Campaign table (spend, ROAS, CPA, week-over-week delta)
3. Top winners (3 ads — what's working, replication note)
4. Top leaks (3 ads — fatigue / poor ROAS / cost drift, suggested action [needs coach review])
5. Creative fatigue flags (any ad with freq > 3.5 AND CTR drop > 20% WoW)
```

## Report Format (also usable from a CSV export)

```markdown
# Meta Ads Daily Brief — YYYY-MM-DD

## Executive Summary
- [Top change 1]
- [Top change 2]
- [Top change 3]

## Campaign Table
| Campaign | Spend | ROAS | CPA | Δ WoW |
|---|---|---|---|---|

## Winners (Top 3)
1. [Ad name] — [why it works] — [replication note]
...

## Leaks (Top 3)
1. [Ad name] — [diagnosis] — [suggested action] [needs coach review]
...

## Fatigue Flags
- [Ad name]: freq X.X, CTR week-over-week ↓ XX%
```

## Failure Modes

| Symptom | Likely cause | Fix |
|---|---|---|
| Cowork can't find Ads Manager | Not logged in / 2FA expired | User must re-auth manually first |
| Numbers don't match dashboard | Date range mismatch | Confirm "last 7 days" = trailing 7 calendar days, ending today |
| CSV export missing ROAS | Column not selected in Meta export UI | Re-export including Purchase ROAS column |

## What This Skill Does NOT Do

- Does not change budgets, pause ads, or duplicate campaigns — read-only brief.
- Does not run scheduling — schedule via Cowork's `/schedule` or `schedule` skill.
- Does not deep-dive a single ad (visual analysis, hook teardown) — that's `ad-forensic-analyst` (deferred).
- Does not write new ads — that's `static-ad-generator` / `seedance-ugc-ads`.

## References

- Source: `A:\Scale AI Skool\Claude\cowork\The Claude Cowork Computer Use Playbook for DTC Brands & Creative Agencies.md`
