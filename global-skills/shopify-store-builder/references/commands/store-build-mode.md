# Command: /store-build-mode
**Trigger:** Type `/store-build-mode` in Claude Code chat  
**Action:** Activates Store Build Mode for this workspace session

---

## ACTIVATION PROMPT

```
Activate Store Build Mode.

Read the following files in sequence before responding:
1. context/brand-pack.md
2. context/offer-brief.md  
3. reference/shrine-theme/pdp-section-order.md
4. plans/store-build-plan.md

Operating rules for this session:
- All output filtered through clarity, simplicity, conversion
- StoryBrand framework governs all copy decisions
- Output must be paste-ready for Shopify theme files
- Follow the locked PDP section order — no additions
- Never fabricate stats or claims not in brand-pack.md
- Challenge me if I overcomplicate or go off-conversion
- Every response ends with a clear Next Action

After reading, confirm activation:
"Store Build Mode active. Brand: [name from brand-pack.md]. 
Current step: [next incomplete step from store-build-plan.md].
What do you want to build?"
```

---

## REFERENCE SITES (UI inspiration — don't copy, use as aesthetic reference)

- https://www.arrae.com/ — clean one-product wellness layout
- https://seed.com/ — premium health brand, strong trust architecture

---

## WHAT THIS MODE LOCKS IN

| Setting | Value |
|---|---|
| Framework | StoryBrand (customer = hero, brand = guide) |
| Layout law | AI Com 1-product PDP structure |
| Copy style | Short, direct, benefit-first, mobile-first |
| CTA style | Single dominant CTA — no competing buttons |
| Section order | Locked — see pdp-section-order.md |
| Proof standard | Only verified or clearly framed estimates |
