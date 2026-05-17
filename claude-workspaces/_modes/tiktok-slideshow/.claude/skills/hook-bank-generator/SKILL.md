---
name: hook-bank-generator
description: Use this skill when the user asks Claude to generate or refresh a TikTok slideshow hook bank for a brand. Produces 20-25 hooks across pattern interrupt / listicle / curiosity / pain-first / identity / POV / before-after categories, scored on hook strength and brand fit.
---

# Hook Bank Generator (TikTok Slideshow)

**Purpose:** Generate a reusable hook bank that fuels weeks of slideshow content. A bank is 20-25 hooks; each hook becomes one slideshow.

---

## THE 7 HOOK CATEGORIES (slideshow-specific)

| Category | Pattern | Example structure |
|---|---|---|
| **Pattern Interrupt** | Says something the viewer doesn't expect | "Stop using [common thing] for [common pain]." |
| **Listicle** | Numbered list teases multi-slide content | "3 things [avatar] never tell you about [topic]" |
| **Curiosity** | Gap between question and reveal | "Why I stopped [common behavior]" |
| **Pain-First** | Calls the pain explicitly in slide 1 | "If your [body part] [pain symptom] every morning..." |
| **Identity** | Speaks to a tribe with insider language | "Things only [specific avatar] understand about [topic]" |
| **POV** | First-person experiential | "POV: you finally found [thing they were looking for]" |
| **Before/After** (compliant) | Frames a transformation without medical claims | "Day 1 vs Day 30 of [habit]" — avoid medical claims |

A balanced bank has 3-4 hooks from each category.

---

## GENERATION PROCESS

```
Step 1 — Read brand + avatar
Confirm: who is this hook bank FOR? what tone? what avatars?

Step 2 — Generate 4 raw hooks per category (28 total)
Don't filter yet — generate to volume.

Step 3 — Score each hook on two axes
- Hook strength (1-5): does it make you want to swipe? Does slide 1 stop a scroll?
- Brand fit (1-5): does the voice match? Is the avatar resonance authentic?

Step 4 — Cut to 20-25
Drop anything scoring <3 on either axis.

Step 5 — Categorize the kept hooks
Tag each with: category, target avatar, body-slide direction (what 4-6 body slides would say).
```

---

## SCORING CRITERIA

### Hook strength (1-5)
- 1 = generic, easily ignored
- 2 = could work but feels familiar
- 3 = solid, has a clear hook mechanism
- 4 = stops a scroll for the target audience
- 5 = stops everyone — pattern interrupt that even non-target viewers pause on

### Brand fit (1-5)
- 1 = wrong tone or violates brand voice
- 2 = neutral, doesn't damage but doesn't reinforce brand
- 3 = on-brand but generic
- 4 = sounds like only this brand could say it
- 5 = signature voice — defines the brand if it goes viral

---

## ANTI-PATTERNS

| Anti-pattern | Why it's wrong |
|---|---|
| Hook names the product directly in slide 1 | Product-aware framing for cold audience — fails on TikTok |
| Hook uses overused TikTok formats ("POV: you're the only person who...") without specificity | Generic = invisible |
| Hook makes medical/cure claim | TikTok + Meta both flag; brand integrity hit |
| 8 listicle hooks, 0 pattern interrupts | No category diversity → bank produces samey slideshows |
| Hooks copied verbatim from a winning competitor | Algorithm catches duplicates + brand integrity hit |

---

## OUTPUT FORMAT

`outputs/hook-bank-<brand>.md`:

```markdown
# TikTok Slideshow Hook Bank — <Brand>
**Generated:** <YYYY-MM-DD>
**Total hooks:** <count>
**Avatar coverage:** [list avatars represented]

## Hook 1
- Category: Pattern Interrupt
- Target avatar: <avatar>
- Hook strength: 4/5
- Brand fit: 4/5
- Hook text: "[The actual hook]"
- Body slide direction: "[What slides 2-6 would convey, 1-line each]"
- Soft CTA hint: "[What the final slide nudges toward]"

## Hook 2
...

(continue for all 20-25)

## Refresh Schedule
- Run /refresh-hook-bank when bank drops below 10 unused hooks
- Aim to add 10 new hooks every 4-6 weeks
- Track which hooks performed best in outputs/slideshow-performance-<brand>.md
```

---

## REFRESH CYCLE

When a hook bank is partially depleted:
1. Read the existing bank
2. Identify under-represented categories (count hooks per category)
3. Generate 10 new hooks weighted toward the under-represented categories
4. Append (don't overwrite) — track which hooks have been used

---

## INTEGRATION

- Hooks → `slideshow-builder` skill (converts hook to full slideshow)
- Performance data → `dtc-second-brain/raw/ads/` (which hooks drove the most views)
- Winning hooks → may translate to `static-ad-generator/ad-concept-generator` for paid amplification
