---
name: eugene-schwartz-awareness
description: Use this skill when the user asks Claude to map an avatar to Eugene Schwartz's 5 awareness levels, sequence creative across awareness stages, or diagnose why an ad isn't converting (often because it's pitched at the wrong awareness level). Encodes the canonical model from Schwartz's Breakthrough Advertising.
---

# Eugene Schwartz Awareness Levels

**Purpose:** Map every avatar to their current awareness stage so creative meets them where they are. The wrong message at the wrong stage feels off-tone or insulting — and underperforms.

---

## THE 5 LEVELS

### Level 1 — Unaware
- The prospect doesn't know they have the problem
- They aren't searching for solutions
- They might be experiencing symptoms but haven't named them

**Creative approach:** Story-led, identity-led, or shock-led. Open with something that makes them realize they have a pain they hadn't named. Hard to convert directly to purchase; usually first touch.

### Level 2 — Problem-Aware
- The prospect knows they have the problem
- They don't know solutions exist
- They might think "this is just how it is"

**Creative approach:** Lead with the pain. Agitate it. Then reveal solutions exist. PAS framework lives here.

### Level 3 — Solution-Aware
- The prospect knows solutions exist (categorically)
- They don't know your specific solution
- They're comparing categories (massage vs. brace vs. medication, e.g.)

**Creative approach:** Differentiate the category. Why is YOUR category the right one? Educational content + comparison frames.

### Level 4 — Product-Aware
- The prospect knows about your product (or competitors in your specific product category)
- They're comparing brands/products
- They're looking for reasons to pick one

**Creative approach:** Differentiate the product. USP. Proof. Reviews. Specific brand strengths. This is bottom-funnel.

### Level 5 — Most Aware
- The prospect already knows your brand
- They just need the right offer to convert
- They've consumed your content, maybe abandoned cart

**Creative approach:** Offer-led. Discounts, urgency, bundle deals, returning-customer messaging. Email, retargeting, loyalty.

---

## MATRIX FORMAT

For each avatar, build a matrix:

| Awareness Level | Current % of avatar at this level | Creative pitched here | Notes |
|---|---|---|---|
| Unaware | ~10% | Brand-story content, identity hooks | Top of funnel — small budget |
| Problem-aware | ~50% | PAS ads, pain-first hooks | Primary cold ad sets |
| Solution-aware | ~25% | Comparison content, category education | Mid-funnel content + ads |
| Product-aware | ~10% | USP-led ads, reviews, mechanism explanation | Retargeting + warm audiences |
| Most aware | ~5% | Offer-led emails, urgency, discounts | Email + retargeting + loyalty |

[VERIFY — these percentages are illustrative; map to Jake's actual funnel data]

---

## DIAGNOSING AWARENESS MISMATCH

If ads aren't converting, one of the most common causes is awareness mismatch:

| Symptom | Likely cause | Fix |
|---|---|---|
| Hook rate good, CTR low | Audience is problem-aware but copy is product-aware | Rewrite for problem-awareness |
| CTR good, ATC low | Audience is solution-aware but PDP assumes product-awareness | Add category-differentiation section to PDP |
| ATC good, purchase low | Audience is product-aware but offer feels under-baked | Strengthen offer mechanic (bundle, urgency, guarantee) |
| Ads with mechanism explanation outperforming ads with pain | Audience is more solution-aware than assumed | Shift mix toward solution + product-aware ads |

---

## SEQUENCING ACROSS THE FUNNEL

A healthy ad account has creative across multiple awareness stages, NOT all at the same stage.

```
Cold audiences (unaware + problem-aware):
  - 70% of cold budget
  - Pattern interrupt + pain-first hooks
  - Story-led content

Warm audiences (solution-aware + product-aware):
  - 20% of cold budget (or split into retargeting)
  - Category-differentiation + USP-led ads
  - Review-driven content

Hottest audiences (most aware):
  - 10% of budget (retargeting + email)
  - Offer-led, urgency-led
  - Cart abandonment, returning customer
```

---

## OUTPUT FORMAT

Save to `brands/<brand>/awareness-matrix.md`:

```markdown
# Awareness Level Matrix — <Brand>
**Last refined:** <YYYY-MM-DD>

## Avatar 1: <Name>

| Awareness Level | Estimated % | Creative pitched here | Where it lives |
|---|---|---|---|
| Unaware | X% | [Approach] | [Ad set / content / email] |
| Problem-aware | X% | [Approach] | [Ad set / content / email] |
| Solution-aware | X% | [Approach] | [Ad set / content / email] |
| Product-aware | X% | [Approach] | [Ad set / content / email] |
| Most aware | X% | [Approach] | [Ad set / content / email] |

## Avatar 2: <Name>
[Same matrix]

## Sequencing Plan
- Cold budget split: X% problem-aware, Y% solution-aware
- Retargeting split: ...
- Email sequence touches each stage at least once

## Audit notes
- [What's working at each stage based on current performance — if data exists]

## [VERIFY] flags
- [Anything based on assumption rather than data — e.g., "estimated %" should be validated against survey or behavioral data]
```

---

## INTEGRATION

- `avatar-builder` → awareness matrix lives per avatar
- `necessary-beliefs` → beliefs differ by awareness stage (most-aware needs offer beliefs; problem-aware needs solution-exists beliefs)
- `static-ad-generator/ad-concept-generator` → every concept tags its awareness level
- `meta-ads-operator/creative-testing-framework` → "Awareness Level Test" pattern uses this directly
- `dtc-second-brain` → performance by awareness level can be wiki'd
