---
name: reverse-engineer-winners
description: Use this skill when the user asks Claude to analyze a winning competitor ad, extract its structural patterns, and translate those patterns into Jake's brand. Outputs a structural breakdown + variant prompts. Strict rule — never copy the competitor's literal copy or claims; only the underlying pattern transfers.
---

# Reverse Engineer Winners

**Purpose:** Decompose a winning competitor ad into transferable structural patterns. Apply those patterns to Jake's brand. Never copy literal copy or claims.

---

## INPUT FORMAT

Jake provides:
- The ad (screenshot OR image URL)
- The ad copy (text)
- Why he thinks it's winning (gut sense, GetHookd performance score, ad library cadence, etc.)
- The competitor brand name

---

## ANALYSIS FRAMEWORK

### Visual structure breakdown
- **Composition** — rule of thirds, centered, off-center, full-bleed, layout grid
- **Color** — palette, contrast, light/dark dominance, where the eye lands first
- **Focal point** — product / person / before-after / data viz / text
- **Text placement** — overlay vs caption-only, top/center/bottom, font weight
- **Emotional tone** — calm, urgent, aspirational, intimate, bold
- **Format clues** — static / carousel / animated / video frame

### Copy structure breakdown
- **Hook type** — pattern interrupt / curiosity / pain-first / proof-led / specificity
- **Body framework** — PAS (Problem-Agitate-Solve) / AIDA / BAB (Before-After-Bridge) / Star-Story-Solution
- **Proof element** — testimonial / stat / authority / mechanism / demo
- **CTA style** — soft (learn more) / direct (buy now) / urgent (today only) / conditional (if you're X, this is for you)
- **Length** — short scroll-stopper vs long-form mid-funnel

### Audience inference
- **Avatar** — who is this written FOR?
- **Awareness level** — problem / solution / product / most aware?
- **Sophistication level** (Eugene Schwartz axis 2) — how many competing claims have they seen?

### Why it likely works (hypothesis)
- 2-3 sentences explaining the pattern's psychological mechanism

---

## EXTRACTION → TRANSLATION

For each structural element extracted, translate to Jake's brand:

| Competitor pattern | Jake's translation |
|---|---|
| "Aspirational product-in-hand shot, off-center, soft light" | Palm Aura — hands cradling massager, morning light, ceramic mug nearby |
| Hook: "The 30-second morning ritual changing how women treat hand stiffness" | Pattern: specificity + ritual framing + audience callout. New hook: "[New ritual angle for Jake's avatar]" |
| Body: PAS framework, 3 sentences each | Same framework, Jake's pain + agitate + solve |
| CTA: "See if it's right for you" | Same soft style: "See how it works" |

**Never copy literal:**
- Brand-specific claims ("our patented formula")
- Quoted reviews
- Specific stats ("9 out of 10 customers...")
- Product names or trademarks

---

## OUTPUT FORMAT

Write to `plans/reverse-engineer-<source>-<date>.md`:

```markdown
# Reverse Engineer — <Competitor Brand> — <Date>
**Source ad:** [link or attachment]
**Brand:** <Jake's brand>

## Visual Breakdown
- Composition: ...
- Color: ...
- Focal point: ...
- Text placement: ...
- Emotional tone: ...
- Format: ...

## Copy Breakdown
- Hook type: ...
- Body framework: ...
- Proof element: ...
- CTA style: ...
- Length: ...

## Audience Inference
- Avatar: ...
- Awareness level: ...
- Sophistication level: ...

## Why It Works (Hypothesis)
[2-3 sentences]

## Translation to <Jake's Brand>
[Structural pattern restated for Jake's brand pack]

## 3 Variant Prompts for Higgsfield
### Variant A: <name>
[Higgsfield brief — visual direction]

### Variant B: <name>
[Higgsfield brief]

### Variant C: <name>
[Higgsfield brief]

## Copy Drafts
### Variant A copy
Hook: ...
Body: ...
CTA: ...

### Variant B copy
...

### Variant C copy
...

## Compliance Pre-Check
- [ ] No literal competitor copy retained
- [ ] No fabricated stats
- [ ] No medical/cure claims (for wellness brands)
- [ ] No before/after imagery implying medical results
- [ ] Brand pack palette + voice applied
```

---

## ANTI-PATTERNS

- **Copying the literal hook with words swapped** — Meta + brand integrity both reject. Take the PATTERN, write fresh copy.
- **Adopting the competitor's brand aesthetic** — defeats the purpose. Apply your brand's aesthetic to the competitor's structure.
- **Reverse-engineering 1 winner, calling it "validated"** — one ad isn't a pattern. Reverse-engineer 3-5 in the same vein to find what's actually transferable.
- **Skipping the "why it works" step** — without a hypothesis, you can't tell which element transferred and which didn't when you test.

---

## INTEGRATION

After generating variant prompts, hand off to:
- `higgsfield-image-gen` skill → for image production
- `ad-concept-generator` skill → log the new concepts to the batch
- `dtc-second-brain` → save the reverse-engineer doc into `raw/competitors/` for future wiki compilation
