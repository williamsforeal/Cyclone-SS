---
name: image-to-json
description: Convert reference images into structured JSON for AI image generation. Use when user says "image to json", "extract image structure", "generate image spec", or provides a reference image to convert into a generation prompt.
metadata: {"author": "williamsforeal", "version": "1.0.0", "openclaw": {"os": ["linux", "darwin", "win32"]}}
---

# Image to JSON — Visual Reference Extractor

## Instructions

Convert reference images into structured JSON specifications for AI image generation pipelines (fal.ai/bria, ComfyUI, BannerBear).

## Process

### Step 1: Analyze the Reference Image
When provided an image, extract:
- **Composition:** Layout, framing, subject placement
- **Colors:** Dominant palette, accent colors, mood
- **Lighting:** Direction, quality (soft/hard), temperature
- **Environment:** Setting, background elements, atmosphere
- **Text:** Any overlay text, font style, placement
- **Product:** If present, product positioning and prominence

### Step 2: Generate Structured JSON

#### For fal.ai/bria Product Shots
```json
{
  "image_url": "[product photo URL]",
  "scene_description": "[environment description ONLY — do not describe the product]",
  "placement_type": "natural|centered|lifestyle"
}
```

**Critical:** `scene_description` describes the ENVIRONMENT only. The product identity is preserved from `image_url`. Using Flux Dev image-to-image will destroy the product — always use bria/product-shot.

#### For BannerBear Templates
```json
{
  "template_id": "[template]",
  "modifications": [
    {"name": "headline", "text": "[extracted/generated headline]"},
    {"name": "subheadline", "text": "[supporting text]"},
    {"name": "image", "image_url": "[product or lifestyle image URL]"},
    {"name": "cta", "text": "[call to action]"},
    {"name": "background_color", "color": "[hex color]"}
  ]
}
```

#### For ComfyUI Workflows
```json
{
  "positive_prompt": "[detailed scene description with style cues]",
  "negative_prompt": "[elements to exclude]",
  "style_reference": "[art style, mood, technique]",
  "dimensions": {"width": 1024, "height": 1024},
  "cfg_scale": 7.5,
  "steps": 30
}
```

## Output

Always return:
1. Analysis summary (what you see in the reference)
2. The appropriate JSON spec for the target platform
3. Any recommendations for improving the output
