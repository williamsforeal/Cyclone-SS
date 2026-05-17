# Command: /launch-qa
**Trigger:** `/launch-qa`  
**Action:** Runs full pre-launch QA checklist against the current store build

---

## CLAUDE EXECUTION RULES

1. Read `plans/launch-checklist.md`
2. Read `context/brand-pack.md`
3. For each checklist item — confirm PASS, FAIL, or NEEDS REVIEW
4. Group results: Blockers (must fix before launch) vs. Nice-to-Have (fix post-launch)
5. Output a status report with specific action for each failing item

---

## QA CHECKLIST TEMPLATE

Claude runs through these items and marks each:

### 🔴 BLOCKERS — Cannot launch without these

```
[ ] Product status = Active (not Draft)
[ ] Compare-at price set and rendering on PDP
[ ] Primary CTA button color correct (#10233F navy)
[ ] Announcement bar shows real shipping cutoff date (no placeholder)
[ ] FAQ Q8 shows real Father's Day/campaign cutoff date (no placeholder)
[ ] Meta Pixel firing on product page (verify in Meta Events Manager)
[ ] All settings_data.json color tokens match brand-pack.md palette
[ ] Mobile preview — no broken sections on iPhone viewport
[ ] /pages/faq page exists and renders
[ ] Shipping policy, Refund policy, Privacy, Terms pages exist
[ ] Navigation: correct labels and URLs (no dead links)
[ ] Font: Hero headline using correct heading font from brand-pack.md
[ ] Hero image set (not placeholder / blank)
[ ] Buy button label matches brand-pack.md primary CTA text exactly
```

### 🟡 NEEDS REVIEW — Verify before scaling ad spend

```
[ ] UGC testimonial photos (real or high-quality placeholder)
[ ] Review count / rating (only use real data — not fabricated)
[ ] Social proof stats (verified or clearly framed as estimates)
[ ] Shop Pay / installments widget rendering correctly for price point
[ ] Sticky ATC bar visible on scroll on mobile
[ ] Ticker strip cycling correctly
[ ] Collapsible FAQ rows opening/closing on tap
[ ] Guarantee section rendering with correct background color
[ ] Footer tagline, trust row, copyright all set
[ ] Coach review submitted (AI Com: #store-reviews channel)
```

### 🟢 POST-LAUNCH (not blockers)

```
[ ] Real UGC photos replace placeholder slots
[ ] Review app installed (Judge.me or Loox) after first 5 orders
[ ] Upsells added to post-purchase flow
[ ] Real proof stats replace launch-day estimates after 30 days
[ ] Email/SMS flow connected (Klaviyo)
```

---

## OUTPUT FORMAT

```
## /launch-qa Results — [Brand Name] — [Date]

### 🔴 BLOCKERS (X items)
[list each with: what's wrong + specific fix]

### 🟡 NEEDS REVIEW (X items)  
[list each with: what to verify]

### 🟢 READY (X items)
[list confirmed passing items]

### VERDICT
[READY TO LAUNCH | NOT READY — fix blockers first]

### Next action: [first blocker to fix OR /pdp-section [missing section]]
```
