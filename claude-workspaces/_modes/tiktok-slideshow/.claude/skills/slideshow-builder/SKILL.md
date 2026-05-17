---
name: slideshow-builder
description: Use this skill when the user asks Claude to convert a single hook from the hook bank into a complete TikTok slideshow draft — hook slide + 4-6 body slides + soft CTA final slide, with image direction per slide and TikTok-native text styling.
---

# Slideshow Builder

**Purpose:** Take one hook → produce a complete slideshow draft (text + image direction per slide) ready for posting.

---

## SLIDESHOW STRUCTURE

```
Slide 1 — HOOK (the only slide that determines stop rate)
  - Single line text, large font, high contrast
  - Image: most arresting visual in the deck

Slides 2-6 — BODY (4-6 slides — vary by depth needed)
  - One point per slide
  - Each slide is a single sentence or bulletized claim
  - Image: supports the point but doesn't fight the text

Slide 7 — SOFT CTA (final slide)
  - One nudge to action
  - "Link in bio" / "See how it works" / "Follow for more"
  - Brand handle visible
  - Image: cleanest brand-aligned visual in the deck
```

Total: 6-8 slides ideal. Don't go past 10 — engagement drops.

---

## SLIDE-BY-SLIDE CONSTRUCTION

### Slide 1 (Hook)
- Copy: pull verbatim from hook bank entry
- Image: select from `image-collections/<niche>/hook-images/` OR generate via Higgsfield with brand brief
- Text styling: 60-80pt, brand font, high contrast on dark/light background
- Composition: text in top-third OR bottom-third; image is the focal point

### Slides 2-6 (Body)
- Copy: pull "Body slide direction" from hook bank entry → expand each into a single slide
- Image: select from `image-collections/<niche>/body-images/`
- Text styling: 40-50pt (smaller than hook), brand font
- Composition: text overlay; image is contextual

### Slide 7 (Soft CTA)
- Copy: pull "Soft CTA hint" from hook bank entry → finalize
- Image: brand-clean visual; could be a product shot OR a lifestyle moment
- Text styling: same as body
- Add brand handle/logo bottom-right

---

## TIKTOK-NATIVE TEXT STYLING

| Element | Rule |
|---|---|
| Font | Sans-serif, bold or black weight |
| Size (hook) | 60-80pt |
| Size (body) | 40-50pt |
| Color | High-contrast against image — white on dark, black on light, NEVER mid-tone on mid-tone |
| Background | Either: (a) image with text overlay, (b) solid color block with text, (c) text on blurred image |
| Padding | Generous — text shouldn't touch slide edges |
| Lines | Hook slides = 1-2 lines max; body slides = 1-3 lines max |
| Mobile-first | Test at 9:16 vertical, 1080×1920 |

---

## IMAGE SELECTION RULES

| Slide | Image source priority |
|---|---|
| Hook | Highest-stop visual — Pinterest/branded library OR Higgsfield generation |
| Body | Contextual but not distracting — Pinterest collection OR product detail shots |
| CTA | Brand-clean — product hero OR signature lifestyle shot |

If using Pinterest-sourced images:
- Save to `image-collections/<niche>/` for reuse
- Confirm reuse rights (no commercial use of copyrighted images without license)

If generating via Higgsfield:
- Use `higgsfield-image-gen` skill from `static-ad-generator` mode
- Apply brand aesthetic rules

---

## OUTPUT FORMAT

`outputs/slideshows/<hook-slug>-<date>.md`:

```markdown
# Slideshow — <Hook Name> — <Date>
**Brand:** <name>
**Hook category:** <from bank>
**Target avatar:** <avatar>
**Status:** DRAFT (pending review)

## Slide 1 — Hook
- Copy: "[Verbatim from bank]"
- Image: [path or Higgsfield brief]
- Text styling: 70pt, Oswald Bold, white on dark, top-third

## Slide 2
- Copy: "[Body point 1]"
- Image: [path]
- Text styling: 45pt, Inter Bold, black on light, bottom-third

## Slide 3
...

## Slide 7 — Soft CTA
- Copy: "[CTA]"
- Image: [path — brand-clean]
- Text styling: same as body + brand handle
- Brand handle position: bottom-right

## Production Notes
- [Anything special for the design pass]
- [Coach review needed before posting]

## Publish Plan
- Caption: "[3-5 sentence caption with hashtags]"
- Hashtags: <list — niche-relevant, max 5 strong tags>
- Posting time: <per posting cadence doc>
- TikTok title: <short, hook-aligned>

## Compliance Pre-Check
- [ ] No medical claim
- [ ] No copied competitor copy
- [ ] No copyrighted music called out (audio is separate file)
- [ ] No fabricated stats
- [ ] Brand voice consistent across slides
```

---

## ANTI-PATTERNS

| Anti-pattern | Why it's wrong |
|---|---|
| 12-slide slideshow | Engagement drops past slide 8-10 |
| Same image style across all slides | Looks like AI-generated mush; vary contextually |
| Hard CTA on slide 1 | Reads as ad — algorithm and audience both punish |
| Body slides that contradict the hook | Confuses the viewer; they drop off |
| Brand handle only on slide 7 | Add subtle brand presence on body slides too (corner watermark) |

---

## INTEGRATION

- Hook source → `hook-bank-generator` skill
- Image source → Pinterest library OR `higgsfield-image-gen` from static-ad-generator mode
- Performance tracking → `dtc-second-brain/raw/ads/` after posting
- Winning slideshow hooks → translate to `static-ad-generator/ad-concept-generator` for paid amplification
