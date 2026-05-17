# Universal Slash Commands

These commands work in any workspace that inherits from `_base`.

---

## `/start-session`

**Action:** Initialize a Claude Code session. Read mode + brand + current state.

```
Read in order:
1. _base/CLAUDE.md
2. _base/.claude/skills/hallucination-protocol/SKILL.md
3. _base/.claude/skills/operator-mode/SKILL.md
4. The active mode's MODE.md (look in _modes/<active>/ or local MODE.md)
5. The active brand's brand-pack.md (look in brands/<active>/ or local context/)
6. Most recent file in plans/ (current execution state)
7. Most recent 3 files in outputs/ (recent work)

Then respond with:

Mode: [name]
Brand: [name]
Last action: [most recent output filename + date]
Current blocker: [if any flagged]
Ready. What are we building?
```

---

## `/handoff`

**Action:** Generate a session handoff doc summarizing current state.

```
Write a handoff doc to plans/handoff-<YYYY-MM-DD-HHMM>.md with:

## Session Summary
- Mode: [active]
- Brand: [active]
- Date/time: [now]

## What got done
- [Bulleted list of completed work this session]

## What's in flight
- [Anything started but not finished]

## Blockers
- [Anything that stopped progress]

## Files touched
- [Paths to created/edited files this session]

## Next session should
- [Single most important next action]

## [VERIFY] flags raised
- [Anything Jake needs to verify before continuing]

End with: "Handoff saved to plans/handoff-<filename>.md"
```

---

## `/verify`

**Action:** Run Hallucination Protocol audit on the last substantive output.

```
Re-read the last output Claude produced in this session.

For each claim in it, ask:
1. Did this come from a source Jake provided (context/, reference/, brand pack)?
2. Did this come from a verified tool call (Shopify MCP, TrendTrack, etc.) in this session?
3. Was this generated from general training/pattern-matching?

Output:
## Verified Claims
- [List claims sourced from Jake's data or tool calls]

## [VERIFY] Required
- [List claims that need verification before use]

## Recommended actions
- [Specific verification steps]
```

---

## `/next-action`

**Action:** Force a single concrete next step. Cuts through analysis paralysis.

```
Given the current state of plans/ and outputs/, what is the single highest-leverage next action Jake should take?

Output:
**Next Action:** [One sentence — concrete, scoped to under 30 minutes]

Why this one:
- [Justification in 2-3 lines]

What it unblocks:
- [What becomes possible after this is done]
```

---

## `/coach-review-ready`

**Action:** Package the current output for AI Com Academy coach review.

```
Find the most recent deliverable in outputs/.

Generate a coach review package:

## Asset for Review
- File: [path]
- Type: [PDP, ad concept, copy, etc.]
- Brand: [active]
- Stage: [phase from store-build-plan or campaign plan]

## Context for the Coach
- What I was trying to do: [single sentence]
- Frameworks applied: [StoryBrand, Eugene Schwartz level, etc.]
- Specific things I want feedback on: [3-5 bullets]

## Self-check (Hallucination Protocol)
- [Any [VERIFY] flags raised]
- [Any uncertainty that should be reviewed first]

## Open questions
- [What I don't know yet]

Save to outputs/coach-review-<YYYY-MM-DD>.md
```
