# [Brand Name] — Brand Pack
**Fill this file completely before running any build commands.**  
**Claude reads this as the sole source of truth for all copy, colors, and structure decisions.**  
**Do not leave any [PLACEHOLDER] fields unresolved before running /launch-qa.**

---

## 1. Brand Identity

**Brand:** [Brand Name]  
**Product:** [Full Product Name]  
**Offer Name:** [Campaign/Bundle Name]  
**Primary CTA:** [e.g. GET THE PITMASTER BUNDLE]  
**Tagline:** [e.g. Clean the grate. Own the cookout.]  
**One-liner:** [Brand name] makes [product category] for [target audience] who want [core promise].

---

## 2. Color Palette

| Use | Token Name | Hex |
|---|---|---|
| Page background | page_bg | #XXXXXX |
| Primary text | primary_text | #XXXXXX |
| Primary brand / buttons | brand_primary | #XXXXXX |
| Sale / urgency accents | accent_alert | #XXXXXX |
| Soft section background | card_bg | #XXXXXX |
| Utility gray (microcopy) | utility_gray | #XXXXXX |
| Premium accent | premium_accent | #XXXXXX |

**Button system:**
- Primary CTA: `[brand_primary]` background, `[page_bg]` text
- Sale/urgency ribbons: `[accent_alert]` background, `[page_bg]` text
- Trust badges: `[card_bg]` background, `[brand_primary]` icon/text

---

## 3. Typography

- **Headings:** [Font Name] (fallback: [fallback font])
- **Body:** [Font Name] (fallback: [fallback font])
- **Buttons:** [Font Name], All Caps, letter-spacing [X]px

---

## 4. Pricing

- **Price:** $[XX.XX]
- **Compare-at Price:** $[XX.XX]
- **Status:** Draft
- **Handle:** [product-handle-slug]
- **Tags:** [tag1, tag2, tag3]

---

## 5. Announcement Bar

**Text:** [promo text] | [urgency text with real date]  
**Background:** [hex]  
**Text color:** [hex]

---

## 6. PDP Section Content

### Block: urgency
**Text:** [social proof count or guarantee line]

### Block: emoji_benefits (5 pills)
1. [emoji] [≤5 word benefit]
2. [emoji] [≤5 word benefit]
3. [emoji] [≤5 word benefit]
4. [emoji] [≤5 word benefit]
5. [emoji] [≤5 word benefit]

### Block: sticky_atc
**Button label:** [CTA TEXT] — $[price]  
**Sub-label:** Was $[compare-at] (Save [X]%)

### Block: buy_buttons
**Primary button label:** [CTA TEXT]  
**Save callout:** Save $[X] today | $[total-value] total value

### Block: estimated_shipping
**Text:** Ships in [X]hrs · Arrives [X–X] days · [Free US/Intl] Shipping

### Block: reviews
**Display:** [X.X]★ — placeholder until UGC collected

---

## 7. Icon Bar Section (5 benefits)

| Icon | Headline | Sub-copy |
|---|---|---|
| [emoji/icon] | [short headline] | [supporting line] |
| [emoji/icon] | [short headline] | [supporting line] |
| [emoji/icon] | [short headline] | [supporting line] |
| [emoji/icon] | [short headline] | [supporting line] |
| [emoji/icon] | [short headline] | [supporting line] |

---

## 8. Horizontal Ticker (trust strip)

**Items (cycle):**
- [ITEM ONE]
- [ITEM TWO]
- [ITEM THREE]
- [ITEM FOUR]
- [ITEM FIVE]
- [ITEM SIX]

---

## 9. Testimonials (3 slots)

**Slot 1:** "[quote]" — [Name] ⭐⭐⭐⭐⭐  
**Slot 2:** "[quote]" — [Name] ⭐⭐⭐⭐⭐  
**Slot 3:** "[quote]" — [Name] ⭐⭐⭐⭐⭐

Photos: [placeholder / Higgsfield lifestyle / real UGC]

---

## 10. How It Works (4 steps)

**Headline:** [mechanism-focused headline]

| Step | Title | Body |
|---|---|---|
| 1 | [title] | [1-2 sentence description] |
| 2 | [title] | [1-2 sentence description] |
| 3 | [title] | [1-2 sentence description] |
| 4 | [title] | [1-2 sentence description] |

---

## 11. Guarantee Section

**Headline:** [e.g. The 60-Day [Brand] Promise]  
**Body:** [Full guarantee copy — plain English, no fine print framing]  
**CTA:** [e.g. Try It Risk-Free]  
**Background:** [hex]

---

## 12. FAQ (8 questions)

1. **[Q]?** [A]
2. **[Q]?** [A]
3. **[Q]?** [A]
4. **[Q]?** [A]
5. **[Q]?** [A]
6. **[Q]?** [A]
7. **[Q]?** [A]
8. **[Q — shipping/campaign date question]?** [A — with REAL date filled in]

---

## 13. Navigation

| Label | URL |
|---|---|
| Home | / |
| [Product Page Label] | /products/[handle] |
| FAQ | /pages/faq |
| Track Order | /apps/parcelpanel |

---

## 14. Footer

**Tagline:** [brand tagline]  
**Trust row:** [Trust point 1] · [Trust point 2] · Secure Checkout  
**Legal links:** Refund Policy · Shipping Policy · Privacy · Terms · Contact  
**Copyright:** © [year] [Brand Name] — A williamsforeal LLC Brand

---

## 15. Build Notes for Claude Code

- Product images: leave placeholder — Higgsfield outputs uploaded separately
- UGC photos: leave placeholder — source after first orders
- FAQ Q[X]: `[INSERT DATE]` — fill in real shipping cutoff before launch
- Announcement bar date: `[INSERT DATE]` — fill in real date before launch
- Do NOT push product to Active status until /launch-qa passes all blockers
