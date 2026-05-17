---
name: json-to-comfy
description: Use when converting structured JSON (from image-to-json) into ComfyUI-ready prompts and workflow settings.
---

# JSON to ComfyUI Prompt Converter

Convert structured JSON (from /image-to-json) into ComfyUI-ready prompts and workflow settings.

## Usage
```
/json-to-comfy [json-input] [product-name]
```

Provide:
- JSON output from `/image-to-json` skill (paste the entire JSON)
- Optional: Your product name to replace accessories/props

## Instructions

You are a ComfyUI prompt engineering specialist. Your job is to convert structured JSON image descriptions into optimized ComfyUI prompts and workflow settings.

### Step 1: Parse the Input JSON

Accept the JSON structure with these sections:
- `subject` - Person description, age, expression, hair, clothing, face
- `accessories` - Headwear, jewelry, devices, props
- `photography` - Camera style, angle, shot type, aspect ratio, texture
- `background` - Setting, colors, elements, atmosphere, lighting

### Step 2: Build ComfyUI Prompt Components

Convert each JSON section into natural language prompt segments:

**Subject Prompt Building:**
```
From JSON subject section:
- Age + expression + description → "mature woman with warm smile talking directly to camera"
- Hair → "long wavy auburn hair pulled back"
- Clothing top → "wearing casual beige long-sleeve top"
- Face/makeup → "natural mature skin texture, minimal makeup"
```

**Accessories & Product Replacement:**
```
If user provides [product-name]:
  - Replace "device" or "prop" with product
  - Example: "microphone" → "holding [PRODUCT] naturally in hand"
Else:
  - Keep original accessories from JSON
```

**Photography Style:**
```
From JSON photography section:
- camera_style → "shot on iPhone, UGC aesthetic"
- shot_type + angle → "medium close-up, eye-level"
- texture → "authentic, sharp focus, slight digital noise"
```

**Background & Lighting:**
```
From JSON background section:
- setting + wall_color → "home studio, neutral tones"
- elements → "blurred bookshelf background, soft depth of field"
- lighting → "soft ring light illuminating face"
```

### Step 3: Generate ComfyUI Outputs

Provide THREE outputs:

#### Output 1: Positive Prompt (Main Prompt)
Concatenate all sections into a flowing, natural prompt:

```
[Subject description], [age], [expression],
[hair details],
[clothing description],
[product/accessory placement],
[background setting],
[lighting],
[camera style],
[shot type and angle],
[texture/quality notes],
[aspect ratio note]
```

**Example:**
```
Mature woman with warm smile talking directly to camera,
long wavy auburn hair pulled back from forehead,
wearing casual beige long-sleeve top,
holding [YOUR PRODUCT] naturally in hand,
home studio setting with neutral tones,
blurred bookshelf in background,
soft ring light illuminating face,
shot on iPhone, UGC aesthetic,
medium close-up, eye-level,
authentic sharp focus with slight digital noise,
9:16 vertical format
```

#### Output 2: Negative Prompt
Generate negative prompt to avoid common AI artifacts:

```
ugly, deformed, noisy, blurry, low contrast,
oversaturated, unrealistic skin, plastic skin,
wrong anatomy, extra fingers, mutated hands,
poorly drawn face, poorly drawn hands,
missing fingers, bad proportions,
disfigured, mutation, duplicate,
text, watermark, signature, username,
jpeg artifacts, compression,
worst quality, low quality,
airbrushed, fake, cgi, 3d render
```

Add specific negatives based on JSON:
- If "natural makeup" → add "heavy makeup, glamour makeup"
- If "UGC aesthetic" → add "professional studio, perfect lighting, polished"
- If "iPhone photography" → add "professional camera, DSLR, cinema camera"

#### Output 3: ComfyUI Workflow Settings

Extract technical parameters as JSON:

```json
{
  "workflow_type": "text-to-image or image-to-image",
  "recommended_model": "z-image-turbo or flux-dev",
  "dimensions": {
    "aspect_ratio": "9:16",
    "width": 576,
    "height": 1024,
    "note": "Based on photography.aspect_ratio from JSON"
  },
  "sampler_settings": {
    "steps": 25,
    "cfg": 7.0,
    "sampler": "DPM++ 2M",
    "scheduler": "karras",
    "note": "Adjust based on model requirements"
  },
  "controlnet": {
    "use_controlnet": true,
    "type": "openpose or depth",
    "strength": 0.8,
    "note": "Use if recreating specific pose/composition"
  },
  "product_placement": {
    "method": "bria-product-shot",
    "product_name": "[USER_PRODUCT]",
    "placement_type": "in-hand or on-surface",
    "note": "Replace device/prop with product"
  },
  "style_modifiers": {
    "lora": "ugc-style-lora (if available)",
    "strength": 0.6,
    "note": "Use LoRA for consistent UGC aesthetic"
  }
}
```

**Dimension Mapping:**
- `9:16 vertical` → 576 x 1024 (TikTok/Reels)
- `16:9 horizontal` → 1024 x 576 (YouTube)
- `1:1 square` → 1024 x 1024 (Instagram Feed)
- `4:5 vertical` → 864 x 1080 (Instagram Portrait)

### Step 4: Provide n8n Integration Code

Generate JavaScript for n8n function node:

```javascript
// n8n Function Node: JSON to ComfyUI Prompt
const inputJSON = $input.first().json;

// Extract subject details
const subject = inputJSON.subject;
const accessories = inputJSON.accessories;
const photography = inputJSON.photography;
const background = inputJSON.background;

// Build positive prompt
let prompt = `${subject.description}, ${subject.age}, ${subject.expression}, `;
prompt += `${subject.hair.color} hair in ${subject.hair.style} style, `;
prompt += `wearing ${subject.clothing.top.color} ${subject.clothing.top.type}, `;

// Product replacement
const productName = $('Workflow Settings').first().json.product_name || 'product';
if (accessories.device.type !== 'none') {
  prompt += `holding ${productName} naturally, `;
} else if (accessories.prop.type !== 'none') {
  prompt += `with ${productName} visible, `;
}

// Background and lighting
prompt += `${background.setting}, ${background.wall_color} background, `;
prompt += `${background.lighting}, `;

// Photography style
prompt += `${photography.camera_style}, ${photography.shot_type}, `;
prompt += `${photography.angle}, ${photography.texture}`;

// Aspect ratio mapping
const aspectRatios = {
  '9:16': { width: 576, height: 1024 },
  '16:9': { width: 1024, height: 576 },
  '1:1': { width: 1024, height: 1024 },
  '4:5': { width: 864, height: 1080 }
};

const dims = aspectRatios[photography.aspect_ratio] || { width: 1024, height: 1024 };

// Output for ComfyUI
return {
  positive_prompt: prompt,
  negative_prompt: "ugly, deformed, blurry, low quality, oversaturated, plastic skin, bad anatomy",
  width: dims.width,
  height: dims.height,
  model: "z-image-turbo",
  steps: 25,
  cfg: 7.0,
  product_name: productName
};
```

### Step 5: Show ComfyUI Workflow Example

Provide a simple text-based workflow structure:

```
COMFYUI WORKFLOW STRUCTURE:
========================

1. Load Checkpoint
   └─> Model: z-image-turbo (FP8 or GGUF Q8)

2. Load CLIP Text Encoder
   └─> Type: luminina-2

3. CLIP Text Encode (Positive)
   └─> Text: [GENERATED POSITIVE PROMPT]

4. CLIP Text Encode (Negative)
   └─> Text: [GENERATED NEGATIVE PROMPT]

5. Empty SD3 Latent Image
   └─> Width: [FROM SETTINGS]
   └─> Height: [FROM SETTINGS]
   └─> Batch: 1

6. K-Sampler
   ├─> Model: from step 1
   ├─> Positive: from step 3
   ├─> Negative: from step 4
   ├─> Latent: from step 5
   ├─> Steps: 25
   ├─> CFG: 7.0
   └─> Sampler: DPM++ 2M Karras

7. VAE Decode
   └─> Samples: from step 6

8. Save Image
   └─> Images: from step 7
   └─> Prefix: ugc-ad-[PRODUCT_NAME]

OPTIONAL NODES:
- ControlNet (if using reference pose)
- Bria Product-Shot (for product insertion)
- LoRA Loader (for style consistency)
```

## Complete Example

### Input JSON:
```json
{
  "subject": {
    "description": "Young woman talking to camera",
    "age": "young adult",
    "expression": "friendly smile",
    "hair": {
      "color": "blonde",
      "style": "loose waves, shoulder length"
    },
    "clothing": {
      "top": {
        "type": "casual t-shirt",
        "color": "white"
      }
    }
  },
  "accessories": {
    "device": {
      "type": "smartphone",
      "details": "holding phone in selfie position"
    }
  },
  "photography": {
    "camera_style": "iPhone UGC",
    "angle": "slight high angle",
    "shot_type": "close-up",
    "aspect_ratio": "9:16"
  },
  "background": {
    "setting": "bright bedroom",
    "lighting": "natural window light"
  }
}
```

### User Input:
```
/json-to-comfy [JSON above] "SkinGlow Serum"
```

### Output:

**✅ Positive Prompt:**
```
Young woman with friendly smile talking directly to camera,
blonde hair in loose waves shoulder length,
wearing white casual t-shirt,
holding SkinGlow Serum naturally near face,
bright bedroom setting,
natural window light illuminating face,
shot on iPhone, UGC aesthetic,
close-up, slight high angle,
authentic sharp focus,
9:16 vertical format
```

**❌ Negative Prompt:**
```
ugly, deformed, blurry, low quality, oversaturated,
plastic skin, bad anatomy, heavy makeup, professional studio,
perfect lighting, polished, DSLR, cinema camera,
text, watermark, worst quality
```

**⚙️ ComfyUI Settings:**
```json
{
  "model": "z-image-turbo",
  "width": 576,
  "height": 1024,
  "steps": 25,
  "cfg": 7.0,
  "sampler": "DPM++ 2M Karras",
  "product_replacement": "SkinGlow Serum replaces smartphone"
}
```

## Use Cases

### 1. UGC Ad Recreation
```
Original: Influencer holding competitor's product
Process: /image-to-json → /json-to-comfy "YourProduct"
Result: Same person style, your product
```

### 2. Ad Family Generation (from Motion Methodology)
```
Input: Winning ad JSON from Asset A (Static)
Process: /json-to-comfy → Generate multiple variations
Variations: Different backgrounds, expressions, products
```

### 3. Batch Ad Creation
```
Same JSON structure + different products
Generate: Multiple ads with consistent style
Output: Full product line in UGC style
```

### 4. A/B Testing Variations
```
Base JSON → Generate 5 versions:
- Different lighting
- Different backgrounds
- Different expressions
- Different clothing colors
- Different product angles
```

## Integration with Bomb Ecom OS Workflows

### WF3: Image Generation Pipeline
```
Input: JSON from Airtable
Process: /json-to-comfy conversion
Output: ComfyUI API call → Generated images
Storage: AWS S3 + Airtable URLs
```

### WF5: Ad Clone
```
Step 1: Upload winning ad
Step 2: /image-to-json extraction
Step 3: /json-to-comfy conversion (with your product)
Step 4: ComfyUI generation
Step 5: Save to Airtable as new ad variant
```

### n8n Workflow Integration
```
Trigger: Airtable new record (JSON prompt)
Node 1: HTTP Request to Claude API (/json-to-comfy)
Node 2: Parse response (extract prompts + settings)
Node 3: HTTP Request to ComfyUI API (localhost:5678)
Node 4: Wait for image generation
Node 5: Upload to AWS S3
Node 6: Update Airtable with image URL
```

## Advanced Features

### Style Consistency with LoRAs
If you train a brand LoRA:
```
Add to workflow settings:
"lora": {
  "name": "your-brand-style",
  "strength": 0.7,
  "trigger_words": "brandstyle, ugc aesthetic"
}

Add to positive prompt:
"in brandstyle, ugc aesthetic, [rest of prompt]"
```

### ControlNet for Pose Preservation
```
Input: Original winning ad image
Process:
  1. Extract pose with ControlNet preprocessor
  2. Use /json-to-comfy for new prompt
  3. Apply ControlNet with extracted pose
  4. Generate with your product
Result: Exact same pose, your brand
```

### Batch Product Variations
```javascript
// n8n: Loop through products
const products = ['Product A', 'Product B', 'Product C'];
const baseJSON = $input.first().json;

const outputs = products.map(product => {
  // Call /json-to-comfy for each product
  return convertJSONtoComfy(baseJSON, product);
});

return outputs;
```

## Error Handling

**Missing JSON fields:**
- Provide defaults for optional fields
- Warn if critical fields missing (subject, photography)

**Invalid aspect ratio:**
- Default to 1:1 (1024x1024)
- Suggest closest valid ratio

**Product name not provided:**
- Keep original accessories from JSON
- Suggest adding product name for replacement

**Unsupported model in settings:**
- Default to z-image-turbo
- List available models

## Multi-Image Reference Workflows (from ComfyUI Course)

### Technique 1: IT Tools Line Loader (Multiple Prompts)
Generate multiple variations from different prompts automatically:

```
WORKFLOW:
=========
Load Image (reference)
  ↓
IT Tools Line Loader
  ├─> Prompt 1: "Woman holding SkinGlow serum"
  ├─> Prompt 2: "Woman applying SkinGlow serum to face"
  └─> Prompt 3: "Woman showing SkinGlow results"
  ↓
CLIP Text Encode (connects to line loader)
  ↓
K-Sampler
  ├─> Control: increment (goes through each prompt)
  └─> Batch: 3 (generates all 3)
```

**Usage:**
```
1. Create text with one prompt per line
2. Connect IT Tools Line Loader to positive prompt
3. Set seed to "increment"
4. Set batch count to number of prompts
5. Run once → generates all variations
```

### Technique 2: IT Tools Prompt Loader (File-Based)
Load prompts from external text file:

```
WORKFLOW:
=========
IT Tools Prompt Loader
  └─> file_path: "prompts/ugc-variants.txt"
  ↓
CLIP Text Encode
  ↓
K-Sampler (random or increment seed)
```

**File Format (ugc-variants.txt):**
```
Young woman holding product near face, bright smile, natural lighting
Mature woman applying product to skin, satisfied expression, bathroom mirror
Fitness enthusiast using product post-workout, authentic sweat, gym background
```

### Technique 3: Image Compar Node (A/B Testing)
Compare generated variations side-by-side:

```
WORKFLOW:
=========
Generate Image A (Variation 1)
  ↓
Save/Preview
  ↓
Generate Image B (Variation 2)
  ↓
Image Compar Node
  ├─> Image A: first generation
  └─> Image B: second generation
  ↓
Visual side-by-side comparison
```

**n8n Integration:**
```javascript
// Generate multiple variants and compare
const variants = [];

for (let i = 0; i < 5; i++) {
  const result = await generateComfyImage({
    prompt: basePrompt,
    seed: baseSeed + i
  });
  variants.push(result.image_url);
}

// Store for comparison
return {
  variant_urls: variants,
  comparison_pairs: [
    [variants[0], variants[1]],
    [variants[2], variants[3]]
  ]
};
```

### Technique 4: Batch Image Generation
Generate multiple variations in single workflow:

```
WORKFLOW:
=========
Empty SD3 Latent Image
  └─> Batch: 8 (generates 8 variations at once)
  ↓
K-Sampler
  ├─> Seed: random
  └─> Processes all 8 in parallel
  ↓
Save Image (saves all 8 automatically)
```

**Settings for batch:**
- Batch 4-8: Fast, reasonable VRAM usage
- Batch 1: Slower but uses less VRAM
- Batch 16+: Very fast but requires high VRAM

### Technique 5: Multiple Reference Images (ControlNet)
Use multiple winning ads as reference:

```
WORKFLOW:
=========
Load Image 1 (Pose Reference)
  ↓
ControlNet Preprocessor (OpenPose)
  ↓
Apply ControlNet (Pose)
  ↓
Load Image 2 (Style Reference)
  ↓
ControlNet Preprocessor (Depth)
  ↓
Apply ControlNet (Depth)
  ↓
K-Sampler (combines both ControlNets)
```

**Use Case:**
- Image 1: Extract pose from winning UGC ad
- Image 2: Extract composition from different ad
- Result: Combined elements from both references

### Technique 6: Prompt Styler + Multiple Templates
Apply consistent style across multiple prompts:

```
WORKFLOW:
=========
IT Tools Prompt Styler
  ├─> Base Prompt: "Woman holding product"
  ├─> Style File: "pixaroma-styles.yaml"
  └─> Template: "UGC Photography"
  ↓
Applies style template to base prompt
  ↓
IT Tools Line Loader (variations)
  ├─> "holding product near face"
  ├─> "applying product to skin"
  └─> "showing product results"
  ↓
Both nodes connect to CLIP Text Encode
  ↓
Generates styled variations automatically
```

## Complete Multi-Product Workflow Example

### Scenario: Generate UGC ads for 3 different products using same JSON template

```
INPUT:
======
Base JSON: Young woman, UGC style, 9:16 format
Products: ["SkinGlow Serum", "FitFuel Protein", "BrainBoost Pills"]

WORKFLOW:
=========
1. IT Tools Line Loader
   Prompts:
   - "Young woman holding SkinGlow Serum, skincare routine"
   - "Young woman holding FitFuel Protein, post-workout"
   - "Young woman holding BrainBoost Pills, study session"

2. Load Image (Reference Pose)
   ↓
3. ControlNet OpenPose Preprocessor
   ↓
4. Apply ControlNet (strength: 0.8)
   ├─> Preserves same pose across all 3

5. K-Sampler
   ├─> Seed: increment (different seed per product)
   ├─> Batch: 3 (generates all 3 products)

6. Save Image
   └─> Prefix: "ugc-{product_name}"

OUTPUT:
=======
- ugc-skinglow-001.png (same pose, skincare context)
- ugc-fitfuel-002.png (same pose, fitness context)
- ugc-brainboost-003.png (same pose, study context)
```

## Tips for Best Results

1. **Keep JSON structure consistent** - Use same template from /image-to-json
2. **Product placement matters** - Specify "in hand", "on table", "near face"
3. **Lighting is critical** - Copy exact lighting from winning ads
4. **UGC authenticity** - Don't over-polish, keep "imperfect" elements
5. **Test aspect ratios** - Match your target platform (TikTok=9:16, IG=4:5)
6. **Batch generate** - Create 5-10 variations, pick winners
7. **Use ControlNet** - For precise pose/composition replication
8. **Save winning prompts** - Store in Airtable for reuse
9. **IT Tools for automation** - Use Line Loader for multiple prompts
10. **Image Compar for testing** - Compare variations side-by-side
11. **Increment seeds** - Get controlled variations across products
12. **Combine ControlNets** - Stack pose + depth for better control

## Output Format

Always provide:
1. ✅ **Positive Prompt** (copy-ready for ComfyUI)
2. ❌ **Negative Prompt** (quality control)
3. ⚙️ **Settings JSON** (dimensions, sampler, model)
4. 📋 **n8n Integration Code** (optional, if requested)
5. 🎨 **Workflow Structure** (visual guide)
6. 💡 **Usage Tips** (context-specific advice)