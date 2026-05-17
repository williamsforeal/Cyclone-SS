# LOCKED: PDP Section Order
**Do not reorder, add, or remove sections without explicit approval.**  
**Source:** AI Com Academy website build framework + hand_aura_pdp_layout.md  
**Derived from:** "There is a strict layout that I follow for all these pages." — AI Com transcript

---

## SECTION SEQUENCE — templates/product.json `order` array

```
1.  announcement-bar        → promo strip / urgency / shipping cutoff
2.  main-product            → hero: image + title + price + bullets + ATC
3.  icon-bar                → 5-benefit full-width strip (below ATC)
4.  how-it-works            → collapsible row + 4-step mechanism
5.  testimonials            → 3 social proof cards
6.  results-ticker          → horizontal trust strip (cycling)
7.  guarantee               → risk reversal section
8.  faq                     → product-specific accordion (8 questions)
9.  final-cta               → closing section with CTA (optional, high-ticket)
```

---

## MAIN-PRODUCT BLOCK ORDER (inside hero, above-fold)

```
1.  urgency                 → social proof count / guarantee line (above title)
2.  title                   → product name
3.  price                   → price + compare-at (sale display)
4.  emoji_benefits          → 5 benefit pills with emojis
5.  variant_picker          → only if product has multiple variants
6.  buy_buttons             → primary CTA button
7.  estimated_delivery      → shipping line
8.  trust_icons             → 3 icon badges under ATC
9.  single_review           → 1 testimonial directly below trust icons
```

---

## RATIONALE (from AI Com transcript)

> "The first and most important thing of this layout is that we get these benefits super sharp."  
> "Directly under the buy button — trust icons. These are things I've spent a lot of money and time testing."  
> "Put a customer review right under the buy button. When it looks like a social media picture, it performs better."  
> "The very last thing that we're going to put on this is a frequently asked questions."  
> "I have these results. Two more sections [guarantee + FAQ] and then we're done."

---

## WHAT DOES NOT BELONG ON THIS PAGE

❌ Multiple competing CTAs ("Shop Now", "Learn More", "Add to Cart" all at once)  
❌ Broad category navigation that pulls people off the PDP  
❌ Embedded blog content  
❌ Popup-heavy overlays that block the ATC  
❌ More than 8 FAQ items at launch (overwhelming — add later based on real customer questions)  
❌ More than 3 testimonial slots at launch (quality > quantity until UGC is collected)  

---

## HOMEPAGE SECTION ORDER (separate from PDP)

```
1.  announcement-bar
2.  hero-banner             → headline, subhead, CTA button
3.  icon-bar                → 5 quick trust icons
4.  product-feature         → feature/benefit image-text split
5.  testimonials            → 2-3 proof cards
6.  guarantee-strip         → short risk reversal strip
7.  final-cta               → centered close with single CTA
8.  footer
```

Homepage follows same rules: one CTA, no competing paths, mobile-first.
