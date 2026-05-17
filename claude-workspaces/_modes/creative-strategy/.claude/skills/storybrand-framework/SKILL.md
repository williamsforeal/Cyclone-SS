---
name: storybrand-framework
description: Use this skill when the user asks Claude to build, refine, or audit a StoryBrand BrandScript for a brand. Enforces the customer-as-hero, brand-as-guide structure across all 7 BrandScript elements. Activates whenever StoryBrand is named or when copy is drifting into brand-as-hero patterns.
---

# StoryBrand Framework

**Purpose:** Build BrandScripts that position the customer as hero and the brand as guide. This is the lens Jake uses across all brand work — non-negotiable.

---

## THE 7 BRANDSCRIPT ELEMENTS

### 1. A Character (the customer)
- Who is the customer?
- What do they want?
- One sentence answer to "the customer wants ___"

### 2. With a Problem
Three layers:
- **External problem** — the surface-level pain (e.g., "my hands hurt every morning")
- **Internal problem** — the feeling about the pain (e.g., "I feel old and limited")
- **Philosophical problem** — why it shouldn't be this way (e.g., "no one should lose mobility because no one took their pain seriously")

### 3. Meets a Guide (the brand)
- **Empathy** — the brand shows it understands the pain
- **Authority** — the brand has credibility to solve it

The brand is NEVER the hero. The brand is Yoda, not Luke.

### 4. Who Gives Them a Plan
- Process plan (3 steps the customer follows)
- OR Agreement plan (commitments that reduce risk — guarantee, free shipping, etc.)

### 5. And Calls Them to Action
- Direct CTA ("buy now" / "get the bundle")
- Transitional CTA ("learn more" / "see how it works")

### 6. That Helps Them Avoid Failure
- What's the cost of NOT acting?
- "Without [solution], the customer faces [continued pain]"

### 7. And Ends in Success
- What does life look like after the customer wins?
- Specific, sensory — not vague ("happier")

---

## CUSTOMER-AS-HERO TEST

Every BrandScript element passes a single test: **is the customer the hero?**

Common violations to catch:

| Brand-as-hero phrase | Customer-as-hero rewrite |
|---|---|
| "We've helped 10,000 customers..." | "10,000 customers have transformed..." |
| "Our patented mechanism..." | "The mechanism that means you finally..." |
| "Our founder spent 10 years researching..." | "After 10 years of research, you finally have..." |
| "Trust our expertise" | "Have confidence in your decision" |
| "We believe in clean wellness" | "You deserve wellness that's actually clean" |

When in doubt, ask: does this sentence make the customer feel more capable, or does it make the brand look more impressive? The first is StoryBrand. The second isn't.

---

## OUTPUT FORMAT

Save to `brands/<brand>/brandscript.md`:

```markdown
# StoryBrand BrandScript — <Brand>
**Last refined:** <YYYY-MM-DD>

## Controlling Idea
[Single sentence — the core promise in narrative form]

## 1. A Character
[Who the customer is. What they want. One sentence each.]

## 2. With a Problem
### External
[The surface pain]

### Internal
[The feeling about the pain]

### Philosophical
[Why this shouldn't be the case]

## 3. Meets a Guide
### Empathy
[Statement showing the brand understands the pain — written in second person to the customer]

### Authority
[Statement showing the brand has credibility — without bragging]

## 4. Who Gives Them a Plan
### Process plan
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Agreement plan
- [Risk-reducing commitment 1]
- [Risk-reducing commitment 2]

## 5. And Calls Them to Action
- Direct CTA: "[Phrase]"
- Transitional CTA: "[Phrase]"

## 6. That Helps Them Avoid Failure
- Without acting, the customer faces: [continued pain]

## 7. And Ends in Success
- After acting, life looks like: [specific, sensory outcome]

## Application across formats
- PDP hero copy frame: [from sections 1-3]
- Ad hook frame: [from sections 2 external + 3 empathy]
- Long-form sales page frame: [full sequence]
- Email sequence frame: [varies by sequence]
```

---

## ANTI-PATTERNS

| Anti-pattern | Why it's wrong |
|---|---|
| Skipping the internal or philosophical problem | These are what make the hook emotionally resonant; external alone is shallow |
| Plan with 7 steps | StoryBrand caps at 3 — more = decision paralysis |
| Calling the brand "the answer" | Guides don't claim to be answers; they hand the customer the tools |
| Success that's vague ("be happier") | Specific, sensory success closes the loop |
| Two competing direct CTAs | One direct CTA per page/asset, period |

---

## VALIDATION

Before locking the BrandScript:

- [ ] Every sentence positions the customer as hero (run the test above)
- [ ] All three problem layers are distinct (no overlap between internal and philosophical)
- [ ] The empathy statement doesn't brag
- [ ] The plan has ≤3 steps
- [ ] The success ending is sensory, not abstract
- [ ] Coach has reviewed and approved
