---
name: wiki-compiler
description: Use this skill when running /compile-wiki or when the user asks Claude to update, rebuild, or refresh the brand brain wiki articles. Executes the canonical compile pass — reads every file in raw/, synthesizes the six core wiki articles, updates INDEX.md, and reports back. Pairs with the brand-brain-schema skill.
---

# Wiki Compiler

**Purpose:** Execute the raw/ → wiki/ compilation pass.

---

## EXECUTION SEQUENCE

```
1. Pre-flight check
   - Verify raw/ has files (≥3 per subfolder ideal, ≥1 minimum)
   - If a subfolder is empty, note it but don't block

2. Read raw files
   - Walk every subfolder in raw/
   - Read text-based files in full
   - For CSVs: parse and summarize key columns/rows
   - For images/screenshots: note presence; if OCR available, extract text

3. Compile each wiki article (in this order)
   a. brand-voice.md      ← needed first; informs all others
   b. customer-pains.md   ← informs angles
   c. competitor-angles.md ← informs hook strategy
   d. hooks-that-work.md  ← informs performance patterns
   e. performance-patterns.md ← synthesizes everything
   f. creative-brief-library.md ← uses all above

4. Cross-link
   - In each article, link to ≥2 other articles where topics intersect

5. Update INDEX.md
   - New compile date
   - Updated summaries
   - File counts
   - Any [VERIFY] flags raised across the wiki

6. Report back to Jake
   - Files read: <count>
   - Articles updated: <count>
   - Contradictions flagged: <count>
   - Next recommended question to ask the brain
```

---

## COMPILATION RULES (strict)

### For every claim in a wiki article:

- [ ] Cite the source file in `raw/`
- [ ] Use direct quotes from raw only when copying customer voice or competitor language (and paraphrase for Meta compliance)
- [ ] Mark with `[VERIFY]` if the claim depends on a stat that isn't independently corroborated
- [ ] Cross-reference contradictions explicitly — don't smooth them over

### For each article:

- [ ] Open with a 3-5 sentence executive summary
- [ ] Follow with "Key findings" (top 5-10 ranked)
- [ ] Then "Detailed analysis" with source citations
- [ ] End with "Cross-links" and "[VERIFY] flags"

### For INDEX.md:

- [ ] Show last-compiled date
- [ ] List all 6 articles with 1-line summaries
- [ ] List recent question outputs (last 5)
- [ ] Show health status

---

## CONTRADICTION HANDLING

If `raw/brand/voice.md` says "premium" but `raw/ads/` performance data shows casual/playful ads outperform premium ones:

```markdown
## [CONTRADICTION DETECTED]

Source A: raw/brand/voice.md states brand voice is "premium, refined, calm authority"
Source B: raw/performance/q1-meta-export.csv shows top 3 ads are casual/playful in tone (CTR 2.8% vs premium ads' 1.1%)

Possible interpretations:
1. Premium voice is correct for brand identity but doesn't convert in paid social
2. Brand voice has drifted in actual ad execution
3. The "casual" winners are reaching a different audience than the premium positioning targets

Recommend: Jake reviews and clarifies which interpretation is correct.
```

Do NOT silently pick one. Always surface.

---

## OUTPUTS LOOP

After every compile, check `outputs/question-answers/` for any saved Q&A from prior sessions. If those answers contain insights not yet in the wiki, fold them into the relevant article.

This is the compounding loop — the wiki gets smarter from Jake's questions over time.

---

## REPORTING TEMPLATE (end of compile)

```markdown
## Wiki Compile Complete — <Date>

**Files read:** <count> across 6 raw/ subfolders
**Articles updated:** all 6 core articles + INDEX.md
**Contradictions flagged:** <count> (see articles for detail)
**[VERIFY] flags raised:** <count>

**New insights pulled from outputs/:**
- [If any]

**Next recommended question:**
- "[A specific question that would be high-leverage given current wiki state]"

**Health:**
- raw/ files needing fresh material: [list any subfolder with <3 files]
- Last health check: <date> (run /health-check if >30 days)
```
