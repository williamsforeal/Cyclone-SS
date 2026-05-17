---
name: pdp-builder
description: Use this skill when the user asks Claude to build, edit, or audit a product detail page (PDP) on Shopify. Encodes the AI Com locked section order, content rules per section, and StoryBrand-governed copy patterns. Activates whenever a PDP build session starts or a specific section needs work.
---

# PDP Builder

**Purpose:** Translate brand pack content into a conversion-optimized PDP using the AI Com locked section order.

---

## THE LOCKED SECTION ORDER

This order is validated across tested DTC builds. **Do not reorder without explicit approval.**

```
1.  Header + Announcement Bar
2.  Hero (main-product)
    ├── Custom image block (optional, top)
    ├── Kicker (small caps text above title)
    ├── Product Title
    ├── Headline (long, benefit-led)
    ├── Subheadline (descriptive)
    ├── Price + Compare-at
    ├── Benefit bullets (✓ checkmarks, no emojis — Pitsmith style)
    │   OR Emoji benefit pills (5 max, ≤5 words each — Abundria style)
    ├── Variant selector (if applicable)
    ├── Quantity selector (often disabled)
    ├── Primary CTA button
    ├── Payment badges (Shop Pay, etc.)
    ├── Estimated shipping
    └── Single review with photo
3.  Trust Icon Bar (3-5 icons, "Why [Brand]?")
4.  Urgency / Trust Ticker (6 trust items)
5.  How It Works (4 steps with icons)
6.  Transformation (NEW — image-supported claim block)
7.  Testimonials (3 cards with photo)
8.  Bundle Value Stack (NEW — show $X value, $Y price)
9.  Guarantee / Risk Reversal (60-day, 30-day, etc.)
10. FAQ (8 collapsible Q&As)
11. Final CTA (urgency-tinted, brand-colored)
```

---

## SECTION-BY-SECTION CONTENT RULES

### Section 1 — Announcement Bar
- Text from `brand-pack.md` → announcement bar block
- Colors from brand palette (primary navy or accent)
- Keep under 80 characters total
- Include shipping promise + urgency anchor (date or quantity)

### Section 2 — Hero
- Kicker: under 8 words, ALL CAPS, accent color (`ember_red` for Pitsmith, brand accent for others)
- Title: brand pack exact text
- Headline: benefit-led, 6-10 words, font weight 700+
- Subheadline: descriptive long-form (1-2 sentences)
- Price: brand pack price; compare-at strikethrough non-negotiable
- Benefit bullets:
  - **Pitsmith style:** ✓ checkmarks, no emojis (per coach review)
  - **Abundria style:** emoji pills, ≤5 words each
  - Either way: focus on customer outcome, not feature
- CTA: brand pack primary CTA, single dominant button

### Section 3 — Trust Icon Bar
- 3-5 icons (5 columns standard)
- Examples: ⚡ Fast Cleaning | 🔥 Built Tough | 🧰 Full Kit | 🎁 Gift-Ready | 🛡️ Guarantee
- Icons from a consistent set — not random emoji
- Each icon ≤4 word label

### Section 4 — Trust Ticker / Urgency Ticker
- 6 trust items in a horizontal ticker
- Items like: "60-Day Promise" / "Free US Shipping" / "10K+ Backyards" / etc.
- Verify any quantity claims via `[VERIFY]` if not in brand pack

### Section 5 — How It Works
- 4 steps maximum
- Each step: icon + headline + 1-sentence description
- Icons: consistent style (lightning_bolt, fire, check_mark, box for Pitsmith example)

### Section 6 — Transformation (NEW per Pitsmith v4)
- 1-line claim that anchors the brand promise
- Image-supported (Higgsfield generation OK if branded)
- Example: "A clean grate is the first move of a real pitmaster."
- Background: brand secondary color (cast_iron_navy for Pitsmith)

### Section 7 — Testimonials
- 3 cards minimum, photo + quote + name
- Quotes: from real reviews — never fabricated
- If reviews aren't gathered yet → use `[VERIFY — quotes unsourced]` placeholders, never invent

### Section 8 — Bundle Value Stack (NEW per Pitsmith v4)
- "Bundle worth $X, yours for $Y" framing
- Itemize: "Pro Brush ($89.99) + Replacement Heads ($24) + Mitt ($29) + Playbook ($14.99 free)"
- Sum to a number greater than the price (perceived value)
- Verify each line-item price with brand pack or `[VERIFY]`

### Section 9 — Guarantee / Risk Reversal
- Single sentence headline: "60-Day Pitmaster Promise"
- Body: explains the guarantee + how to claim
- Trust badge or icon

### Section 10 — FAQ
- 8 questions ideal, 5 minimum
- Format: question (bold) + answer (1-2 sentences)
- Cover: how it works, what's included, shipping time, returns, warranty, who it's for
- Collapsible (reduce cognitive load — AI Com rule)

### Section 11 — Final CTA
- Urgency-tinted (different background than hero — ember_red for Pitsmith)
- Headline: "Don't let another cookout start with a fight."
- Subheadline: order by [DATE] for [holiday] delivery
- Button: same CTA as hero
- This is the "you've seen everything, now decide" moment

---

## CONTENT GENERATION ORDER

When building from scratch, build in this order (not the display order):

```
1. Trust Icons + Trust Ticker — sets the credibility floor early
2. Benefit Bullets — these become the spine for everything else
3. Headline + Subheadline — derived from bullets
4. How It Works — translates bullets into a 4-step process
5. FAQ — handles the objections bullets create
6. Bundle Value Stack — anchors price perception
7. Guarantee — locks risk reversal
8. Transformation block — the emotional capper
9. Final CTA — synthesizes everything
10. Hero copy refinements (kicker, urgency, title sizing)
```

Why this order: it forces value-clarity early, then layers conversion mechanics on top.

---

## VALIDATION GATES

Before declaring a section "done":

- [ ] Content matches the brand pack
- [ ] No `[PLACEHOLDER]` or `[VERIFY]` flags remain (unless intentional pre-coach-review)
- [ ] Mobile (375px) walked top-to-bottom — no overflow
- [ ] CTAs are tappable on mobile (44px touch targets minimum)
- [ ] Color contrast meets WCAG AA (4.5:1 for body text)
- [ ] No competing CTAs in the same view

---

## HANDOFF TO LAUNCH QA

Once all 11 sections are built, run the `launch-qa` skill before declaring the PDP launch-ready.
