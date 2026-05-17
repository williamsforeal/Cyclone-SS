# Command: /pdp-section [section-name]
**Trigger:** `/pdp-section hero` or `/pdp-section faq` etc.  
**Action:** Builds a single PDP section using brand-pack.md as source of truth

---

## USAGE

```
/pdp-section [section-name]

Valid section names (must match pdp-section-order.md):
  hero          → Above-fold hero with urgency, bullets, ATC
  icon-bar      → 5-icon benefit bar (full width, below hero)
  how-it-works  → Collapsible row + 4-step process section
  testimonials  → 3-slot testimonial cards
  ticker        → Horizontal trust ticker strip
  guarantee     → Risk reversal section (60-day style)
  faq           → Product-specific accordion FAQ (8 questions)
  footer        → Navigation + footer + legal links
```

---

## CLAUDE EXECUTION RULES FOR THIS COMMAND

1. Read `context/brand-pack.md` — extract copy, colors, CTAs for the section
2. Read `reference/shrine-theme/section-schema.md` — get the correct Shrine block structure
3. Generate the section in one of these formats:
   - **Settings JSON block** — paste into `templates/product.json` in Shrine
   - **Liquid snippet** — paste into `/sections/` folder
   - **Plain copy block** — paste into Shopify theme editor fields manually
4. State which format the output is in and exactly where it goes in the theme
5. Flag any placeholder content that must be filled before launch

---

## OUTPUT FORMAT TEMPLATE

```
## Section: [section-name]
**Output type:** [Settings JSON | Liquid | Plain copy]
**Where it goes:** [exact file path or theme editor location]
**Shrine block name:** [e.g. main-product, icon-bar, collapsible_content]

--- PASTE START ---
[generated output]
--- PASTE END ---

**Placeholders remaining:**
- [ ] [e.g. Father's Day shipping cutoff date]
- [ ] [e.g. UGC photo for testimonial slot 1]

**Next action:** /pdp-section [next-section] OR /launch-qa if all sections done
```
