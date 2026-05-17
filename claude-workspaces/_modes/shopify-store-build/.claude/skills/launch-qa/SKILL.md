---
name: launch-qa
description: Use this skill when a Shopify store or PDP is approaching launch. Runs a structured pre-launch QA across desktop, mobile, checkout, analytics, legal, and brand consistency. Activates when Jake asks "is this ready to launch?" or "run launch QA."
---

# Launch QA

**Purpose:** Pre-launch quality check covering desktop + mobile rendering, conversion mechanics, checkout flow, legal pages, and brand consistency.

Run this AFTER the PDP is content-complete but BEFORE Jake submits for coach review or removes password protection.

---

## PHASE 1 — PDP DESKTOP

- [ ] Hero section: title, headline, subheadline, price, CTA all render
- [ ] Compare-at price displays with strikethrough
- [ ] Variant selector works (or is intentionally disabled)
- [ ] Trust icons render with correct icons + labels
- [ ] Trust ticker scrolls smoothly
- [ ] How It Works: 4 steps, icons render, no missing labels
- [ ] Transformation section: image loads, claim text correct
- [ ] Testimonials: 3 cards, all photos load, no `[PLACEHOLDER]` text visible
- [ ] Bundle Value Stack: math adds up (perceived value > price)
- [ ] FAQ: all questions expand, no orphaned answers
- [ ] Final CTA: button clicks through, urgency text correct
- [ ] No console errors when scrolling

---

## PHASE 2 — PDP MOBILE (375px primary, 414px secondary)

- [ ] No horizontal scroll anywhere
- [ ] Hero title fits without second-line overflow (or wraps cleanly)
- [ ] Benefit bullets: each on its own line or wraps cleanly
- [ ] CTA button: ≥44px tall, full-width or centered
- [ ] Sticky ATC appears on scroll (after hero is out of view)
- [ ] Sticky ATC button stays tappable (not hidden behind keyboard or bottom nav)
- [ ] Trust icons stack or scroll horizontally cleanly
- [ ] Images: no awkward crops, all responsive
- [ ] Text: no truncation, no fonts loading visibly slow
- [ ] FAQ collapses cleanly without overlap

---

## PHASE 3 — CHECKOUT + PURCHASE FLOW

- [ ] ATC adds correctly to cart
- [ ] Cart shows correct product, price, variant
- [ ] Shipping calculator works
- [ ] Discount code field accepts known test code (if applicable)
- [ ] Shop Pay button visible (if price ≥$79 — AI Com rule)
- [ ] Express checkout (PayPal, Google Pay, etc.) configured correctly
- [ ] Order confirmation email sends to test address with correct branding

---

## PHASE 4 — STORE PAGES

- [ ] Homepage redirects or routes to PDP correctly (one-product store)
- [ ] About page tells the brand story
- [ ] Contact page has working email/form
- [ ] Shipping Policy reflects actual shipping times (no `[VERIFY]` text remaining)
- [ ] Return Policy matches the guarantee (e.g., 60-day if PDP says 60-day)
- [ ] Privacy Policy includes correct business address
- [ ] Terms of Service present
- [ ] Refund Policy linked from footer

---

## PHASE 5 — ANALYTICS + TRACKING

- [ ] Meta Pixel installed and firing (verify in Pixel Helper or Meta Events Manager)
- [ ] Conversion API set up if Pixel is restricted
- [ ] Google Analytics / GA4 firing (if used)
- [ ] TikTok Pixel installed (if running TikTok ads)
- [ ] Cookie consent banner displays (if required by jurisdiction)
- [ ] Add-to-Cart, InitiateCheckout, Purchase events fire correctly

---

## PHASE 6 — BRAND CONSISTENCY

- [ ] All colors match `brand-pack.md` palette (no off-tones)
- [ ] Fonts match brand-pack (headings + body + CTA)
- [ ] No emoji used where the brand pack says no emoji (and vice versa)
- [ ] Voice consistent across PDP, About, FAQ, emails
- [ ] No competing CTAs or off-brand language (e.g., "shop now" if brand uses "claim yours")
- [ ] No leftover Lorem Ipsum or placeholder text

---

## PHASE 7 — LEGAL + COMPLIANCE

- [ ] No unverified health/medical claims (especially for Abundria/Palm Aura, Cold Plunge)
- [ ] No "FDA approved" or similar claims unless actually FDA-approved
- [ ] No before/after imagery that implies medical results without disclosure
- [ ] All testimonials match real reviews (no invented quotes)
- [ ] Founder bio is true (no fabricated credentials)
- [ ] Pricing matches what will actually be charged (no decimal mistakes)
- [ ] Income/results claims (if any) have proper disclaimers

---

## PHASE 8 — HALLUCINATION PROTOCOL FINAL CHECK

- [ ] No statistics in copy without a verified source
- [ ] No "industry standard" claims without backing
- [ ] No customer counts or revenue claims unless real
- [ ] All `[VERIFY]` flags resolved or removed
- [ ] Founder story matches what's on file in `context/`

---

## OUTPUT FORMAT

Write the QA result to `outputs/launch-qa-<brand>-<YYYY-MM-DD>.md`:

```markdown
# Launch QA — <Brand> — <Date>

## Status: [READY / NOT READY]

## Phase Results
- Phase 1 (Desktop): PASS / FAIL (with specific items)
- Phase 2 (Mobile): PASS / FAIL
- Phase 3 (Checkout): PASS / FAIL
- ...

## Critical blockers
- [Items that must be fixed before launch]

## Non-critical fixes
- [Items that should be fixed but won't block]

## Recommended next action
- [Single concrete next step]
```

---

## ESCALATION

If 3+ critical blockers exist:
- Output report
- Recommend NOT to submit for coach review yet
- Suggest fixing blockers first

If the store is launch-ready but a coach review hasn't happened:
- Output report marked READY
- Recommend Jake submit to coach for final approval before going live
