# Static Scaler v3.3: Switch to Bria Product Shot

## Context

The OpenAI langchain fix from v3.2 is working — Creative Director generates 3 ad concepts, Image Prompt Engineer converts them to prompts. But the **image generation model is wrong**.

`fal-ai/flux/dev/image-to-image` is a **style transfer** model. It takes the product photo and morphs/transforms it based on the text prompt. This is why:
- The product doesn't look like the actual PalmAura device
- Generated images show random objects (animals, etc.) instead of the product
- The product identity is destroyed even at low strength values

**What we actually need:** Send both a text prompt (scene description) AND the product image, where the product appears faithfully in a new scene. This is **product placement**, not style transfer.

**Solution:** Switch to `fal-ai/bria/product-shot` — purpose-built for eCommerce product placement:
- Accepts `image_url` (product photo) — preserves product identity with high fidelity
- Accepts `scene_description` (text) — generates the scene/background around the product
- $0.04/image (vs $0.03 for Flux — negligible difference)
- Supports automatic and manual product positioning
- Built on licensed data (commercially safe)

## Plan

### Step 1: Update Image Prompt Engineer System Prompt

**File:** `prompts/image-prompt-engineer.md`

**Why:** Current prompt generates **empty rooms and surfaces** — generic backgrounds disconnected from the ad concept. The user wants lifestyle scenes (like Image 3: woman at desk with product in context). Bria CAN generate scenes with people — we just need to tell the IPE to include them.

**Key problems with current IPE prompt:**
1. Says "describe ONLY environment, background, surfaces" → generates empty rooms
2. No connection to the ad concept's target segment or angle → generic backgrounds
3. No people/lifestyle context → product sits alone on a table
4. Product appears too small because scenes are wide/zoomed out

**Changes:**
- **Lifestyle/emotional-story scenes**: Include people and activities relevant to the target segment (e.g., "woman working at a laptop, modern home office" for remote workers segment)
- **Product-hero scenes**: Keep surface/background focus but make the composition TIGHT and CLOSE (table close-up, not wide room)
- **Scene must match the ad concept**: Use the segment, angle, and mood from the Creative Director's visualDirection to drive the scene description
- **Tighter compositions**: Describe close-up, zoomed-in scenes so the product appears larger relative to the frame
- Keep "never describe the product itself" rule (Bria handles that)
- Output format stays: `{scene_description, placement_type}`

### Step 2: Update Parse Prompt in Build Script

**File:** `scripts/build-v3-fal.js` → Step 4 (Parse Prompt node code)

**Changes:**
- Extract `scene_description` from IPE output (instead of `prompt`)
- Extract `placement_type` (default: `"automatic"`)
- Pass through `productImageUrl` from upstream (unchanged)
- Drop `negativePrompt` and `strength` fields

### Step 3: Fix fal-post jsonBody expression evaluation

**File:** `scripts/build-v3-fal.js` → Step 5 (fal-post fix)

**Root cause:** n8n requires the ENTIRE jsonBody string to start with `=` to enable expression mode. Every working jsonBody in the workflow follows this pattern (lines 506, 1323, 1343, 1478, 1517). Without the leading `=`, all `{{ }}` are sent as literal strings.

**Wrong** (current — `=` inside each value, missing at start):
```
"jsonBody": "{\n  \"placement_type\": \"={{ $json.placementType }}\",\n  ..."
```

**Correct** (`=` at start, no `=` inside values):
```
"jsonBody": "={\n  \"placement_type\": \"{{ $json.placementType }}\",\n  ..."
```

**Changes to fal-post node:**
- URL: `https://queue.fal.run/fal-ai/bria/product-shot` (already set)
- jsonBody — prefix entire string with `=`, remove `=` from inside values:
```
={\n  "image_url": "{{ $json.productImageUrl }}",\n  "scene_description": "{{ $json.sceneDescription }}",\n  "placement_type": "{{ $json.placementType }}",\n  "shot_size": [1000, 1000],\n  "num_results": 1,\n  "fast": true\n}
```

**What stays the same:**
- fal-post → Wait2 → fal-render chain (Bria uses the same fal.ai queue API — `response_url` polling works identically)
- fal-render output format: `{images: [{url, content_type}]}` — same structure, downstream nodes work as-is
- All OpenAI nodes (Build CD/IPE Payload, Call Creative Director/IPE) — unchanged
- Code in JavaScript1 (CD parser) — unchanged
- Split Image URLs, Download fal Image, Upload a file — unchanged
- Aggregate, Format Image Data, Create Ad URLs — unchanged

### Step 4: Rebuild and Import

```bash
node scripts/build-v3-fal.js
```

Output: `workflows/static-scaler-v3-fixed.json` (overwrites previous)

Import into n8n at localhost:5678. No new credentials needed — uses the same `fal.ai` HTTP Header Auth credential already configured.

## Files to Modify

| File | Change |
|------|--------|
| `prompts/image-prompt-engineer.md` | Update output format for Bria (scene_description, no negativePrompt/strength) |
| `scripts/build-v3-fal.js` | Update Step 4 (Parse Prompt) and Step 5 (fal-post) for Bria API |

## Files to Generate

| File | Purpose |
|------|---------|
| `workflows/static-scaler-v3-fixed.json` | Rebuilt workflow with Bria Product Shot |

## Files NOT Changed

| File | Why |
|------|-----|
| `prompts/creative-director.md` | visualDirection fields still valid — scene, lighting, colorPalette, etc. |
| `workflows/static-scaler-v3-upgraded.json` | Base workflow (read-only input) |

## Verification

1. **Build:** `node scripts/build-v3-fal.js` completes with no errors
2. **Import:** Workflow imports into n8n with all 37 nodes and 32 connections
3. **OpenAI nodes:** Creative Director returns 3 ad concepts (already confirmed working)
4. **Image Prompt Engineer:** Returns `{scene_description, placement_type}` for each concept
5. **fal-post:** jsonBody starts with `=` and expressions evaluate (no literal `{{ }}` strings)
6. **Scene quality:** Scenes match the ad concept (lifestyle has people, product-hero has tight compositions)
7. **Product identity:** PalmAura device visible and recognizable in generated images
8. **Product size:** Product is prominent in the frame (like Image 3), not tiny in a wide room
9. **Full pipeline:** 3 images generated, all 3 uploaded to S3, Airtable updated with A/B/C URLs
