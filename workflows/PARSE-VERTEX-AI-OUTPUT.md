# Parsing Vertex AI Output for Bria Product Shot

## The Output Structure

Your Vertex AI model (Claude/Gemini) returns ad family analysis with this structure:

```markdown
### 1. The Learned Concept
- Name: [Concept Name]
- Life Force Trigger: [Psychological trigger]
- Why it Scaled: [Analysis]

### 2. A/B/C Static Scaling Strategy

#### Asset A – [Name] ([Lever])
- Format: 1:1 Static (1080×1080)
- Psychological Lever: [Lever]
- Visual Directive (Fal.ai Ready):
  - Subject: [Scene description]
  - Lighting: [Lighting setup]
  - Composition: [Layout details]
  - [Optional: Tech Detail, Texture, Context]
- Headline Concept: [Headline]
- Why this scales: [Reasoning]

#### Asset B – [Name] ([Lever])
[Same structure]

#### Asset C – [Name] ([Lever])
[Same structure]
```

## Parsing JavaScript for n8n

### Step 1: Extract Visual Directives

Replace your old "Parse Prompt" node with this:

```javascript
// Parse Vertex AI output for Bria Product Shot
const vertexOutput = $input.first().json.output; // or .text depending on node

// Regular expression to extract Visual Directive sections
const assetRegex = /#### \*\*Asset ([A-C]) â (.*?)\*\*[\s\S]*?\*Visual Directive \(Fal\.ai Ready\):\*\*([\s\S]*?)(?=\*\s+\*\*Headline Concept:|\*\*\*|$)/g;

const assets = [];
let match;

while ((match = assetRegex.exec(vertexOutput)) !== null) {
  const assetLetter = match[1]; // A, B, or C
  const assetName = match[2].trim();
  const visualDirective = match[3].trim();

  // Extract individual components
  const subjectMatch = visualDirective.match(/\*Subject:\*\s*(.+?)(?=\n\s*\*|$)/s);
  const lightingMatch = visualDirective.match(/\*Lighting:\*\s*(.+?)(?=\n\s*\*|$)/s);
  const compositionMatch = visualDirective.match(/\*Composition:\*\s*(.+?)(?=\n\s*\*|$)/s);
  const contextMatch = visualDirective.match(/\*Context:\*\s*(.+?)(?=\n\s*\*|$)/s);
  const textureMatch = visualDirective.match(/\*Texture:\*\s*(.+?)(?=\n\s*\*|$)/s);

  // Build scene description for Bria (combine all elements)
  const sceneElements = [
    subjectMatch ? subjectMatch[1].trim() : '',
    lightingMatch ? lightingMatch[1].trim() : '',
    compositionMatch ? compositionMatch[1].trim() : '',
    contextMatch ? contextMatch[1].trim() : '',
    textureMatch ? textureMatch[1].trim() : ''
  ].filter(Boolean);

  const sceneDescription = sceneElements.join(' ');

  assets.push({
    asset: assetLetter,
    name: assetName,
    sceneDescription: sceneDescription,
    subject: subjectMatch ? subjectMatch[1].trim() : '',
    lighting: lightingMatch ? lightingMatch[1].trim() : '',
    composition: compositionMatch ? compositionMatch[1].trim() : ''
  });
}

// Return array of assets ready for Bria
return assets.map(asset => ({
  json: {
    assetId: asset.asset,
    assetName: asset.name,
    briaPayload: {
      scene_description: asset.sceneDescription,
      placement_type: "automatic"
      // product image_url will be added in next node
    }
  }
}));
```

### Step 2: Expected Output Format

The parsing script above will output this structure for each asset:

```json
[
  {
    "assetId": "A",
    "assetName": "The Micro-Dramatization (Visceral)",
    "briaPayload": {
      "scene_description": "A split-screen composition. On the left, a man in his 30s at an office desk, clutching his head, with an anxious expression; a generic coffee cup sits beside him. On the right, the same man, now looking calm and focused, holding a branded mug. Left side features harsh, cool-toned fluorescent light creating deep shadows. Right side is illuminated by warm, natural window light. A clean vertical line divides the 1080x1080 frame. The left half is desaturated and cool; the right half is warm and vibrant.",
      "placement_type": "automatic"
    }
  },
  {
    "assetId": "B",
    "assetName": "The Mechanism Deep Dive (Intellectual)",
    "briaPayload": {
      "scene_description": "A macro shot of a single, dark coffee in a ceramic branded mug, viewed from a 45-degree top-down angle. Clean, even studio softbox lighting against a light grey gradient background, ensuring the texture of the coffee's 'crema' is visible. The mug is placed on the left third of the frame. From the mug, clean graphical lines point to the right, connecting to text callouts in the negative space. Overlaid text callouts with simple icons: 'L-THEANINE: Jitter-free focus,' and 'MCT OIL: No crash, clean energy.'",
      "placement_type": "automatic"
    }
  },
  {
    "assetId": "C",
    "assetName": "The POV Ritual (Aspirational)",
    "briaPayload": {
      "scene_description": "First-person perspective of hands holding the branded coffee mug. The scene is a cozy, productive home office. In the background (with a shallow depth of field) is a neat desk with a closed laptop and a journal. Warm, soft light from a nearby desk lamp creates a feeling of a calm, early morning or late-night work session. Shot to look like an iPhone 15 photo. Realistic skin texture on the hands, with a slight, natural grain over the whole image to convey authenticity.",
      "placement_type": "automatic"
    }
  }
]
```

### Step 3: Add Product Image URL

Next node in your workflow:

```javascript
// Merge with product image from Airtable or previous step
const productImageUrl = $('Airtable').first().json.productImage; // or however you fetch it

return {
  json: {
    ...input.item.json,
    briaPayload: {
      ...input.item.json.briaPayload,
      image_url: productImageUrl
    }
  }
};
```

### Step 4: Call Bria Product Shot (for each asset)

Loop over the 3 assets and call Bria:

```javascript
// HTTP Request to fal.ai/bria/product-shot
// Method: POST
// URL: https://fal.run/fal-ai/bria/product-shot

// Body (from previous node):
{
  "image_url": "{{ $json.briaPayload.image_url }}",
  "scene_description": "{{ $json.briaPayload.scene_description }}",
  "placement_type": "{{ $json.briaPayload.placement_type }}"
}
```

## Simplified Alternative (If Regex is Too Complex)

If the regex parsing is too complex, use a simpler approach:

```javascript
// Simpler approach: Use AI to extract structured data
const vertexOutput = $input.first().json.output;

// Call Vertex AI again with extraction prompt
const extractionPrompt = `Extract the Visual Directive scene descriptions from this ad analysis and return as JSON:

${vertexOutput}

Return format:
{
  "assets": [
    {
      "id": "A",
      "sceneDescription": "[combined visual directive text]"
    },
    // ... B and C
  ]
}`;

// Then use that structured JSON directly
```

## Testing Your Parser

### Test Input (from your Vertex AI output):
```markdown
#### **Asset A – The Micro-Dramatization (Visceral)**
*   **Visual Directive (Fal.ai Ready):**
    *   *Subject:* A split-screen composition. On the left, a man in his 30s...
    *   *Lighting:* Left side features harsh, cool-toned fluorescent light...
    *   *Composition:* A clean vertical line divides the 1080x1080 frame...
```

### Expected Parsed Output:
```json
{
  "assetId": "A",
  "sceneDescription": "A split-screen composition. On the left, a man in his 30s at an office desk, clutching his head, with an anxious expression; a generic coffee cup sits beside him. On the right, the same man, now looking calm and focused, holding a branded mug. Left side features harsh, cool-toned fluorescent light creating deep shadows. Right side is illuminated by warm, natural window light. A clean vertical line divides the 1080x1080 frame."
}
```

## Updated Workflow Architecture

**New Flow (with Vertex AI):**

```
Manual Trigger / Webhook
  ↓
[1] Fetch Product Data (Airtable)
  ↓
[2] Google Vertex Chat Model
     ├─ System: "You are an expert ad analyst..."
     ├─ User: "Analyze these static ads: [uploaded images]"
     └─ Output: Full ad family analysis (markdown)
  ↓
[3] Parse Visual Directives (JavaScript)
     └─ Extract A/B/C scene descriptions
  ↓
[4] Split Into Batches (n8n SplitInBatches)
     └─ Loop through 3 assets
  ↓
[5] Add Product Image URL (JavaScript)
     └─ Merge with Airtable data
  ↓
[6] Call Bria Product Shot (HTTP Request)
     ├─ image_url: [product photo]
     ├─ scene_description: [from Asset A/B/C]
     └─ placement_type: "automatic"
  ↓
[7] Store Generated Images (Airtable / S3)
```

**80% fewer nodes than the old OpenAI approach!**

## Debugging Tips

### Issue: Can't extract scene descriptions
**Solution:** Log the raw Vertex output first:
```javascript
console.log('Raw Vertex Output:', $input.first().json.output);
return [$input.first().json];
```

### Issue: Scene descriptions missing elements
**Solution:** Adjust regex to capture optional fields (Context, Texture, Tech Detail)

### Issue: Bria returns errors
**Solution:** Verify scene description:
- ✅ No product descriptions (Bria places product automatically)
- ✅ Only environment/scene details
- ✅ No text, logos, or typography mentioned

## Next Steps

1. Test the JavaScript parser with your actual Vertex output
2. Verify parsed scene descriptions are Bria-compatible
3. Run end-to-end test: Vertex AI → Parser → Bria Product Shot
4. Compare image quality vs. old OpenAI approach
5. Document any edge cases or adjustments needed
