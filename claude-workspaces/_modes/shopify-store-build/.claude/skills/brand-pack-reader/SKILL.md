---
name: brand-pack-reader
description: Use this skill at the start of any Shopify store build session, ad creative session, or design task that needs brand-consistent output. It defines exactly how Claude ingests a brand pack from brands/<brand>/brand-pack.md and applies it to copy, colors, typography, pricing, and section content. Activates whenever a brand-pack.md is in context or a new build session begins.
---

# Brand Pack Reader

**Purpose:** Define exactly how Claude ingests a brand pack and applies it across copy, colors, and structure decisions — ensuring zero hallucination of brand details.

---

## WHAT A BRAND PACK CONTAINS (standard structure)

When Claude reads `brands/<brand>/brand-pack.md`, it extracts and maps:

| Brand Pack Section | What Claude extracts | Where Claude uses it |
|---|---|---|
| Brand name + tagline | Display name, CTA phrasing | All copy, button labels, meta |
| Color palette (hex codes) | Exact hex values + token names | settings_data.json, section backgrounds |
| Typography | Font names + weights | settings_data.json, layout decisions |
| Pricing | Price + compare-at | Product settings, ATC button labels |
| Announcement bar text | Exact copy + colors | Announcement bar section |
| Emoji benefit bullets | 5 pills with emoji + label | main-product emoji_benefits block |
| Sticky ATC | Button label + sub-label | sticky_atc block |
| Buy buttons | Primary label + save callout | buy_buttons block |
| Shipping line | Shipping text | estimated_delivery block |
| Trust icons | Three icons + labels | Below ATC trust bar |
| Founder/About copy | Source for About block | About section |
| Headlines and proof points | Copy for hero, transformation, testimonials | Across PDP |
| Risk reversal / guarantee | Exact phrasing | Guarantee section + below CTA |
| FAQ Q&A | Question + answer pairs | Collapsible FAQ section |

---

## STRICT RULES

1. **Never invent brand details.** If the brand pack doesn't specify, mark `[VERIFY]` and ask Jake.
2. **Hex codes are exact.** Don't approximate "navy blue" → use the exact hex from the pack.
3. **Token names match brand pack.** If the pack calls a color `cast_iron_navy`, use that name in `settings_data.json` — don't rename to `primary` or `brand-color`.
4. **Copy is verbatim, not paraphrased.** When the brand pack gives exact wording (announcement bar, CTA labels, headlines), use exactly that. If you want to suggest an alternative, mark it as a suggestion separately.
5. **Aesthetic constraints are binding.** If the brand pack says "no emoji" or "no clinical imagery," obey.

---

## EXTRACTION PATTERN

When loading a brand pack at session start:

```
Step 1: Identify brand identity block (name, product, USP, core promise)
Step 2: Pull color palette table → store hex codes and token names
Step 3: Pull typography (headings, body, buttons + fallbacks)
Step 4: Pull pricing (price, compare-at, status)
Step 5: Read announcement bar (text + colors)
Step 6: Pull PDP section content (benefit bullets, sticky ATC, buy buttons, etc.)
Step 7: Pull risk reversal + guarantee
Step 8: Pull FAQ Q&A
Step 9: Note any aesthetic rules ("no emoji," "no clinical visuals," etc.)
Step 10: Confirm to Jake: "Brand pack loaded — [brand name], [current campaign]. Ready."
```

---

## OUTPUT VALIDATION

Before delivering any brand-touching output, run this silent check:

- [ ] Every color referenced exists in the brand pack
- [ ] Every font referenced exists in the brand pack
- [ ] Every price/discount matches the brand pack
- [ ] No copy invented beyond what the brand pack authorizes
- [ ] No aesthetic violations (clinical, generic, off-tone)

If any fail → revise before delivery.

---

## CONFLICT HANDLING

If the brand pack contradicts itself (e.g., two different headlines for the same section):

1. Flag the contradiction
2. Show both versions
3. Ask Jake which is current
4. Don't choose silently

If the brand pack contradicts the active campaign offer brief:

1. Flag the contradiction
2. Default to the offer brief (more recent intent) but verify with Jake
3. Suggest updating the brand pack to match
