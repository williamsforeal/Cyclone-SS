# Static Scaler v3 — Upgrade Guide
# Replaces image-prompt-context + Message a model1 pipeline with
# Creative Director AI + Image Prompt Engineer AI architecture

## OVERVIEW OF CHANGES

### Nodes to MODIFY:
1. `Message a model1` (OpenAI) — new system prompt
2. `Code in JavaScript1` (JSON extractor) — updated parser
3. `Code in JavaScript4` (splitter) — rewrite for new 3-concept format
4. `fal-post` — add strength parameter, fix image_url
5. `Aggregate` — fix field configuration
6. `Upload a file` (AWS S3) — change path to ad-phase1-product-bckgrnd/
7. `Format Image Data` — update field mapping

### Nodes to ADD:
1. `Image Prompt Engineer` (OpenAI node) — inside loop before fal-post

### Flow Change:
```
BEFORE:
  image-prompt-context → Message a model1 → Code extract → Code split → Loop → fal-post

AFTER:
  image-prompt-context → Creative Director (OpenAI) → Parse Concepts → Split 3 Items → Loop → Image Prompt Engineer (OpenAI) → Parse Prompt → fal-post
```

---

## NODE 1: Message a model1 (Creative Director)

### System Prompt
Copy the FULL contents of `prompts/creative-director.md` (everything after the comment header) into the System Message field.

### User Message (Expression)
```
Here is the product and ad context. Generate 3 ad concepts.

Product: PalmAura Smart Warm Compress Hand Massager
Product Image URL: {{ $json.productImageUrl }}
Ad Type: {{ $json.adType }}
Headline from brief: {{ $json.headline }}
Concept from brief: {{ $json.concept }}
CTA from brief: {{ $json.cta }}
Angle from brief: {{ $json.angle }}
Avatar Target: {{ $json.avatarTarget }}
Awareness Level: {{ $json.awarenessLevel }}
Tags: {{ $json.tags }}
Record ID: {{ $json.recordId }}
```

### Settings
- Model: `gpt-4o` (or `chatgpt-4o-latest`)
- Temperature: 0.8
- Max Tokens: 3000
- Simplify Output: false

---

## NODE 2: Code in JavaScript1 (Parse Creative Director Output)

Replace the ENTIRE code with:

```javascript
// Parse Creative Director JSON output from OpenAI
const items = $input.all();
const results = [];

for (const item of items) {
  let text = '';

  // Extract text from various OpenAI output formats
  if (item.json?.output?.[0]?.content?.[0]?.text) {
    text = item.json.output[0].content[0].text;
  } else if (item.json?.text) {
    text = item.json.text;
  } else if (item.json?.content?.[0]?.text) {
    text = item.json.content[0].text;
  } else if (item.json?.message?.content) {
    text = item.json.message.content;
  } else if (typeof item.json === 'string') {
    text = item.json;
  }

  // Clean markdown code blocks
  text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // Find the JSON array
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (!arrayMatch) {
    // Try parsing the whole thing
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        results.push({ json: { concepts: parsed, raw: text } });
      } else {
        results.push({ json: { concepts: [parsed], raw: text } });
      }
    } catch (e) {
      results.push({ json: { error: 'Could not parse JSON', raw: text } });
    }
    continue;
  }

  try {
    const concepts = JSON.parse(arrayMatch[0]);
    results.push({ json: { concepts, raw: text } });
  } catch (e) {
    results.push({ json: { error: 'JSON parse failed', raw: text } });
  }
}

return results;
```

---

## NODE 3: Code in JavaScript4 (Split Into 3 Items)

Replace the ENTIRE code with:

```javascript
// Split 3 concepts into individual items for the loop
// Each item carries its concept data + the product image URL
const items = $input.all();
const results = [];

// Get productImageUrl from upstream (preserved through the chain)
// We need to grab it from the image-prompt-context node
const contextData = $('image-prompt-context').first().json;
const productImageUrl = contextData?.productImageUrl || '';
const recordId = contextData?.recordId || '';

for (const item of items) {
  const concepts = item.json.concepts || [];

  for (const concept of concepts) {
    results.push({
      json: {
        conceptId: concept.conceptId || 'X',
        segment: concept.segment || '',
        angle: concept.angle || '',
        awarenessLevel: concept.awarenessLevel || '',
        beliefsReinforced: concept.beliefsReinforced || [],
        visualDirection: concept.visualDirection || {},
        adCopy: concept.adCopy || {},
        productImageUrl: productImageUrl,
        recordId: recordId,
        style: concept.visualDirection?.style || 'lifestyle'
      }
    });
  }
}

// Ensure we always have at least 1 item
if (results.length === 0) {
  results.push({
    json: {
      error: 'No concepts parsed',
      conceptId: 'A',
      visualDirection: {
        scene: 'PalmAura hand massager on a clean linen surface',
        lighting: 'soft natural window light',
        colorPalette: 'warm cream and white',
        composition: 'centered product shot with negative space above',
        productPlacement: 'device front-facing on neutral surface',
        mood: 'calm and clean',
        style: 'product-hero'
      },
      productImageUrl: productImageUrl,
      recordId: recordId,
      style: 'product-hero'
    }
  });
}

return results;
```

---

## NODE 4: Image Prompt Engineer (NEW OpenAI Node)

### Where to place it
Inside the loop, BETWEEN `Loop Over Items3` (second output) and `fal-post`.

The connection flow inside the loop becomes:
```
Loop Over Items3 [output 1: "done"] → Aggregate
Loop Over Items3 [output 0: "each item"] → Image Prompt Engineer → Parse Prompt → fal-post → Wait2 → fal-render → Loop Over Items3
```

### System Prompt
Copy the FULL contents of `prompts/image-prompt-engineer.md` (everything after the comment header) into the System Message field.

### User Message (Expression)
```
Convert this visual direction into a fal.ai image prompt.

Visual Direction:
{{ JSON.stringify($json.visualDirection) }}

Product Image URL: {{ $json.productImageUrl }}
Style: {{ $json.style }}
```

### Settings
- Model: `gpt-4o-mini` (fast + cheap, this is a formatting task)
- Temperature: 0.4
- Max Tokens: 500
- Simplify Output: false

---

## NODE 5: Parse Prompt (NEW Code Node)

Place this BETWEEN `Image Prompt Engineer` and `fal-post`.

```javascript
// Parse Image Prompt Engineer output and prepare fal.ai payload
const items = $input.all();
const results = [];

for (const item of items) {
  let text = '';

  // Extract from OpenAI output formats
  if (item.json?.output?.[0]?.content?.[0]?.text) {
    text = item.json.output[0].content[0].text;
  } else if (item.json?.text) {
    text = item.json.text;
  } else if (item.json?.content?.[0]?.text) {
    text = item.json.content[0].text;
  } else if (item.json?.message?.content) {
    text = item.json.message.content;
  }

  // Clean markdown
  text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  let promptData;
  try {
    // Find JSON object in text
    const objMatch = text.match(/\{[\s\S]*\}/);
    promptData = JSON.parse(objMatch ? objMatch[0] : text);
  } catch (e) {
    // Fallback: use the text as the prompt directly
    promptData = {
      prompt: text.substring(0, 500),
      negativePrompt: 'text, words, letters, logos, watermarks, blurry, low quality',
      strength: 0.55
    };
  }

  // Get upstream data preserved through the loop
  const upstreamItem = $('Loop Over Items3').first().json;
  const productImageUrl = upstreamItem?.productImageUrl || item.json?.productImageUrl || '';
  const conceptId = upstreamItem?.conceptId || item.json?.conceptId || 'X';
  const adCopy = upstreamItem?.adCopy || item.json?.adCopy || {};
  const recordId = upstreamItem?.recordId || item.json?.recordId || '';

  results.push({
    json: {
      prompt: promptData.prompt || '',
      negativePrompt: promptData.negativePrompt || 'text, words, letters, logos',
      strength: promptData.strength || 0.55,
      productImageUrl: productImageUrl,
      conceptId: conceptId,
      adCopy: adCopy,
      recordId: recordId
    }
  });
}

return results;
```

---

## NODE 6: fal-post (MODIFY)

### Updated Body (JSON)
Change the request body to:

```json
{
  "prompt": "={{ $json.prompt }}",
  "image_url": "={{ $json.productImageUrl }}",
  "negative_prompt": "={{ $json.negativePrompt }}",
  "num_images": 1,
  "image_size": "square_hd",
  "strength": {{ $json.strength }},
  "num_inference_steps": 28,
  "guidance_scale": 3.5
}
```

### Important Notes
- `strength` controls how much of the reference image is preserved (0 = all reference, 1 = all generation)
- `0.55` is a good starting point — increase if images are too close to original, decrease if product gets lost
- `guidance_scale` of 3.5 is recommended for Flux dev
- `num_inference_steps` of 28 gives good quality without being slow

---

## NODE 7: Aggregate (MODIFY)

### Fix the configuration
Change "Fields To Include" from `images, images, images` to just `images`.

The aggregate should collect ALL items from the loop into a single list. The field name `images` should match what fal-render returns.

If using "Aggregate All Item Data (Into a Single List)":
- Put Output in Field: `data`
- Include: All Fields (not Specified Fields)

This ensures all 3 fal.ai responses are collected properly.

---

## NODE 8: Format Image Data (MODIFY)

Replace the ENTIRE code with:

```javascript
// Format aggregated image data for Airtable
const items = $input.all();
const output = {
  'Ad Sets': '',
  A: '',
  B: '',
  C: '',
  Seed: '',
  Width: 1024,
  Height: 1024,
  Model: 'flux/dev',
  Status: 'Generated',
  'Prompt Used': ''
};

// Get the aggregated data array
const data = items[0]?.json?.data || items;
const imageUrls = [];
const prompts = [];

for (const entry of data) {
  const json = entry.json || entry;

  // Extract image URL from fal.ai response
  if (json.images && json.images.length > 0) {
    imageUrls.push(json.images[0].url);
    if (json.images[0].width) output.Width = json.images[0].width;
    if (json.images[0].height) output.Height = json.images[0].height;
  } else if (json.url) {
    imageUrls.push(json.url);
  }

  // Collect prompts and seeds
  if (json.prompt) prompts.push(json.prompt);
  if (json.seed) output.Seed = String(json.seed);
}

// Map to A, B, C
output.A = imageUrls[0] || '';
output.B = imageUrls[1] || '';
output.C = imageUrls[2] || '';
output['Ad Sets'] = `Generated ${imageUrls.length} variants`;
output['Prompt Used'] = prompts.join(' | ');

// Get record ID from upstream
const contextData = $('image-prompt-context').first().json;
output.recordId = contextData?.recordId || '';

return [{ json: output }];
```

---

## NODE 9: Upload a file (AWS S3) (MODIFY)

### Change File Name from:
```
ads/{{ new Date().toISOString().split('T')[0] }}/{{ $json.id }}.jpg
```

### To:
```
ad-phase1-product-bckgrnd/{{ $json.id }}.jpg
```

---

## PRESERVING AD COPY FOR BANNERBEAR

The ad copy (headline, subheadline, bodyBullets, CTA) is generated by the Creative Director but must survive through the loop to be used later by BannerBear.

### Option A: Store in Airtable immediately after Creative Director
Add a new Airtable "Update" node right after `Code in JavaScript4` (splitter) that writes the adCopy for each concept back to Airtable. Then BannerBear reads it from there.

### Option B: Carry through the loop
The splitter code above already preserves `adCopy` on each item. The `Parse Prompt` code also carries it forward. You can access it in the Format Image Data node and pass it to BannerBear.

### Recommended: Option A
After the splitter, add an Airtable update that stores:
- Concept A headline, B headline, C headline
- All body copy and CTAs
- Linked to the record ID

This way the copy is safe regardless of what happens in the image generation loop.

---

## SUMMARY OF THE NEW FLOW

```
Webhook → Get Ad Copy → Preserve Context → Classify Ad Type → Update Airtable
  → Get Product → Extract Image URL → Download Image → Upload to S3 (products/)
    → Merge
      → image-prompt-context (unchanged)
        → Creative Director (OpenAI GPT-4o) [NEW SYSTEM PROMPT]
          → Parse Concepts (Code) [REWRITTEN]
            → Split 3 Items (Code) [REWRITTEN]
              → Loop Over Items3
                ├→ [done] Aggregate [FIXED] → Format Image Data [REWRITTEN]
                │    → Create Ad URLs (Airtable) → Download → Upload S3 [NEW PATH]
                └→ [each] Image Prompt Engineer (OpenAI GPT-4o-mini) [NEW NODE]
                     → Parse Prompt (Code) [NEW NODE]
                       → fal-post [UPDATED BODY]
                         → Wait2 → fal-render → back to Loop
```
