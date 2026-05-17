---
name: mcp-higgsfield
description: Use this skill when the user asks Claude to generate AI images for ad creatives, product visuals, or brand assets via the Higgsfield API. The Higgsfield API is connected to Claude Code in Jake's Cursor setup. Activate whenever Jake mentions Higgsfield, "generate an image," "make me a visual for [ad/PDP/post]," or needs static creative assets.
---

# Higgsfield API Integration

**Purpose:** AI image generation for ad creatives, product hero shots, lifestyle imagery, and brand visuals.

**Connected to:** Claude Code (Cursor) — Jake has the API hooked into his Claude Code workspace.

---

## CORE CAPABILITIES

[VERIFY — Jake to confirm current Higgsfield model access and feature list]

- Photoreal image generation
- Brand-consistent visual styles via reference images
- Product-aware composition (when given a product image)
- Lifestyle/scene generation for ad creatives
- Aspect ratio control (square, story, landscape, vertical)

---

## TYPICAL WORKFLOWS

### Workflow 1 — Hero image for a PDP

```
Inputs:
- Product image (reference)
- Brand color palette (from brand-pack.md)
- Scene direction ("kitchen counter, morning light, minimalist")
- Aspect ratio (square for IG, vertical for stories, landscape for hero)

Output:
- 3-5 variants
- Pick the strongest, refine with iteration prompts
```

### Workflow 2 — Static ad creative

```
Inputs:
- Product image
- Avatar description (from avatar doc)
- Hook/angle (single line)
- Brand aesthetic reference (existing winner OR Kinfolk/editorial reference for Abundria, rugged/American for Pitsmith)

Output:
- Image candidates for ad concept testing
```

### Workflow 3 — Variant generation from a winner

```
1. Take a high-performing existing creative
2. Pass it as style reference
3. Generate variants with:
   - Different scenes
   - Different demographics in the shot
   - Different overlay/text positioning
4. Test the variants without resetting the visual identity
```

---

## BRAND-SPECIFIC STYLE NOTES

### Abundria / Palm Aura
- **Aesthetic:** Kinfolk-editorial — premium wellness, soft natural light, muted earth tones
- **Avoid:** Pharmacy/clinical visuals, white-coat doctors, generic stock imagery
- **Lean into:** Hands in natural settings, soft fabrics, plants, morning rituals, refined simplicity

### Pit Smith Co.
- **Aesthetic:** Rugged American backyard pitmaster — masculine, practical, summer-ready
- **Color palette:** charcoal_black, cast_iron_navy, ember_red, pit_white, brass_heat (from brand-pack.md)
- **Avoid:** Cheap-gadget energy, novelty product styling, overly clinical product shots
- **Lean into:** Dirty grill grate → clean grate (proof shots), cordless freedom, beer + grill lifestyle, Father's Day gifting

### Cold Plunge (TBD positioning, but per market analysis)
- **Aesthetic:** Feminine ritual / nervous-system regulation — soft, intentional, slow
- **Avoid:** Saturated athletic-recovery and "do hard things" angles (Plunge, Edge Theory, Ice Barrel already own)
- **Lean into:** Underserved angles — feminine wellness, perimenopause, couples ritual, sober recovery, nervous-system regulation

---

## SAFETY + COMPLIANCE

- **Never depict real, identifiable people** without permission (Meta will reject + privacy risk)
- **Don't fabricate medical/health imagery** that implies clinical results (e.g., before/after for a wellness product where Meta will read it as a health claim)
- **Brand consistency over novelty** — generate against the established palette and aesthetic, not against trends Jake hasn't signed off on
- **Generated images are drafts.** Coach approval before production use (AI Com Academy phase gate)

---

## HOW THIS PAIRS WITH OTHER SKILLS

| Skill | How it uses Higgsfield |
|---|---|
| `static-ad-generator` mode | Primary use — generate ad concepts from briefs |
| `shopify-store-build` mode | PDP hero images, section visuals |
| `creative-strategy` mode | Visual mood boards for avatar-driven angles |
| `tiktok-slideshow` mode | Hook and body slide images |

---

## WHAT NOT TO DO

- Don't generate variants without a clear brief — wasted credits and noise
- Don't ignore the brand palette — every output must match the active `brands/<brand>/brand-pack.md`
- Don't generate "what a customer might look like" composite shots and present them as testimonials. Use real UGC for testimonials.
