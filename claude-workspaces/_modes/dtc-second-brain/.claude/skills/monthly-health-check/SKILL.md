---
name: monthly-health-check
description: Use this skill when the user runs /health-check or asks for a brain audit. Reviews every wiki article, flags contradictions, finds topics mentioned but never explained, lists claims without sources, and suggests new article candidates. Runs monthly to catch errors before they compound.
---

# Monthly Health Check

**Purpose:** Audit the brand brain to catch compounding errors before they spread.

**Frequency:** First of every month, or whenever Jake suspects the wiki is drifting.

---

## AUDIT CHECKLIST

### Check 1 — Contradiction scan

Walk every wiki article. For each major claim, check whether another article makes a contradicting claim.

Common contradictions:
- `brand-voice.md` says one thing; `hooks-that-work.md` shows the winning hooks use a different voice
- `customer-pains.md` lists a pain as primary; `creative-brief-library.md` doesn't address it
- `competitor-angles.md` calls an angle "saturated"; `hooks-that-work.md` recommends testing it anyway

Output: List of contradictions with the conflicting article paths and the recommendation (which version to keep, what to update).

### Check 2 — Orphan topics

A topic is "orphaned" when it's mentioned in one article but never explained or backed up elsewhere.

Example: `customer-pains.md` mentions "decision paralysis from too many wellness options," but `creative-brief-library.md` and `hooks-that-work.md` never reference it. Either it's not as important as the wiki suggests, or the wiki is under-developing it.

Output: List of orphaned topics + recommendation (develop or remove).

### Check 3 — Unsourced claims

Walk every article and flag any claim that doesn't cite a source file in `raw/`.

Output: List of claims that need either:
- A source citation added (Claude or Jake can hunt it down)
- The claim removed if no source exists

### Check 4 — Stale articles

If an article hasn't been updated in 60+ days AND `raw/` has new files in its source folders, it's stale.

Output: List of stale articles + recommendation to recompile.

### Check 5 — Gap candidates

Suggest 3 new article candidates based on gaps:

Examples:
- "Offer fatigue patterns" — if Jake has 6+ months of ad data, this might be a new article
- "Email/SMS performance synthesis" — if `raw/performance/email-*.csv` exists but isn't being synthesized
- "Returning customer behavior" — if customer LTV data is in raw but not in wiki

---

## OUTPUT FORMAT

Write to `outputs/health-checks/health-check-<YYYY-MM-DD>.md`:

```markdown
# Health Check — <Brand Brain> — <Date>

## Overall Health: [HEALTHY / NEEDS ATTENTION / DRIFTING]

## Contradictions
| Article A | Article B | Conflict | Recommendation |
|---|---|---|---|
| ... | ... | ... | ... |

## Orphan Topics
- [topic] in [article] — not developed elsewhere
- ...

## Unsourced Claims
- [claim] in [article] — needs source citation

## Stale Articles
- [article] — last updated [date], [N] new raw files since

## New Article Candidates
1. [Title] — because [raw/ has this material now]
2. ...
3. ...

## Recommended Actions
1. [Highest priority — recompile X / resolve Y / etc.]
2. ...
3. ...
```

---

## ESCALATION

If 5+ contradictions exist across articles:
- Output report
- Recommend Jake spend a focused session resolving them before any new wiki use
- The brain is unreliable until contradictions resolve

If 10+ unsourced claims exist:
- Output report
- Recommend a `/compile-wiki` rerun with stricter source-citation rules

If health is consistently "healthy" for 3+ months:
- Suggest expanding raw/ folder coverage (new data types, new competitor sets, etc.)
- The brain has stabilized; time to deepen, not just maintain
