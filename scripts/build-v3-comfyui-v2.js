/**
 * Build Static Scaler v3 (ComfyUI v2) — Fixed Workflow
 *
 * Reads static-scaler-v3-comfyui.json and applies these fixes:
 *
 *   1. Fix checkpoint name:   flux1-dev.safetensors → flux/flux1-dev-fp8.safetensors
 *   2. Fix image dimensions:  1024×1024 → 1024×1280 (4:5 ratio for IG/FB)
 *   3. Empty negative prompt:  Flux Dev ignores it; kept for structural compat
 *   4. Update IPE prompt:      Scene-only (no product in image generation)
 *   5. Add Compliance Filter:  Blocks product/text terms before ComfyUI
 *   6. Fix Check Result URL:   Uses $('Queue ComfyUI') ref (survives retry loop)
 *   7. Add polling loop:       IF node + Retry Wait for slow generations
 *   8. Update Extract Image:   Handles complete/incomplete + graceful errors
 *   9. Update Format Image:    Correct height default + ComfyUI URL handling
 *
 * Usage:   node scripts/build-v3-comfyui-v2.js
 * Output:  workflows/static-scaler-v3-comfyui-v2.json
 */

const fs = require('fs');
const path = require('path');

const INPUT  = path.join(__dirname, '..', 'workflows', 'static-scaler-v3-comfyui.json');
const OUTPUT = path.join(__dirname, '..', 'workflows', 'static-scaler-v3-comfyui-v2.json');

console.log('Reading:', INPUT);
const workflow = JSON.parse(fs.readFileSync(INPUT, 'utf8'));

// Helper to find a node by name
function findNode(name) {
  const node = workflow.nodes.find(n => n.name === name);
  if (!node) console.warn(`  WARNING: Node "${name}" not found`);
  return node;
}

// ============================================================
// Metadata
// ============================================================
workflow.name = 'Static Scaler v3 (v3.3 ComfyUI Fixed)';
workflow.updatedAt = new Date().toISOString();

// ============================================================
// FIX 1-3: Build ComfyUI Payload — corrected for Flux Dev
// ============================================================
console.log('  Fix 1-3: Build ComfyUI Payload');
const buildPayload = findNode('Build ComfyUI Payload');
if (buildPayload) {
  buildPayload.parameters.jsCode = `// Build ComfyUI API payload for Flux Dev — SCENE-ONLY generation
// Product compositing happens separately (BannerBear/Bria)
//
// Flux Dev notes:
//   CFG 1-4 works best (built-in guidance, not like SDXL)
//   Negative prompt has minimal effect — kept empty for compatibility
//   Checkpoint: flux/flux1-dev-fp8.safetensors (fp8 = 8GB VRAM friendly)

const prompt = $json.prompt || 'clean modern desk with warm morning light, minimal aesthetic';
const seed = Math.floor(Math.random() * 2147483647);
const conceptId = $json.conceptId || 'X';

// Style-specific sampler settings (from Phase 1 playbook)
const styleMap = {
  'lifestyle': { steps: 25, cfg: 3.5 },
  'product-hero': { steps: 30, cfg: 4.0 },
  'comparison': { steps: 20, cfg: 3.0 },
  'identity-mirror': { steps: 25, cfg: 3.5 },
  'emotional-story': { steps: 25, cfg: 3.5 }
};
const style = $json.style || 'lifestyle';
const s = styleMap[style] || styleMap['lifestyle'];

// ComfyUI API format
// Node IDs are arbitrary but must be consistent within the workflow
const workflowTemplate = {
  "1": {
    "class_type": "CheckpointLoaderSimple",
    "inputs": { "ckpt_name": "flux/flux1-dev-fp8.safetensors" }
  },
  "2": {
    "class_type": "CLIPTextEncode",
    "inputs": { "text": prompt, "clip": ["1", 1] }
  },
  "3": {
    "class_type": "CLIPTextEncode",
    "inputs": { "text": "", "clip": ["1", 1] }
  },
  "4": {
    "class_type": "EmptyLatentImage",
    "inputs": { "width": 1024, "height": 1280, "batch_size": 1 }
  },
  "5": {
    "class_type": "KSampler",
    "inputs": {
      "seed": seed,
      "steps": s.steps,
      "cfg": s.cfg,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1.0,
      "model": ["1", 0],
      "positive": ["2", 0],
      "negative": ["3", 0],
      "latent_image": ["4", 0]
    }
  },
  "6": {
    "class_type": "VAEDecode",
    "inputs": { "samples": ["5", 0], "vae": ["1", 2] }
  },
  "7": {
    "class_type": "SaveImage",
    "inputs": {
      "filename_prefix": "n8n_ss_" + conceptId + "_" + Date.now(),
      "images": ["6", 0]
    }
  }
};

const clientId = 'n8n-ss-' + Date.now();

return [{
  json: {
    comfyui_payload: { prompt: workflowTemplate, client_id: clientId },
    conceptId: conceptId,
    adCopy: $json.adCopy || {},
    recordId: $json.recordId || '',
    originalPrompt: prompt,
    seed: seed,
    style: style
  }
}];`;
}

// ============================================================
// FIX 4: Build IPE Payload — scene-only system prompt
// ============================================================
console.log('  Fix 4: Build IPE Payload (scene-only)');
const buildIPE = findNode('Build IPE Payload');
if (buildIPE) {
  buildIPE.parameters.jsCode = `// Build OpenAI Chat Completions payload for Image Prompt Engineer
// UPDATED: Scene-only generation (two-stage pipeline)
// Stage 1: Generate background/environment WITHOUT the product
// Stage 2: Product composited on top via BannerBear/Bria (separate node)

const systemPrompt = \`You are an expert AI image prompt engineer for DTC product advertising.
Your job: convert a visual concept brief into a scene-only prompt for Flux image generation.

## CRITICAL RULES — VIOLATIONS WILL RUIN THE AD

1. NEVER include the product (PalmAura, massager, device, gadget) in the prompt.
   The product is composited separately in post-production.
   You are generating ONLY the background scene / environment.

2. NEVER include text, words, letters, numbers, logos, headlines, watermarks, or any typography.
   Copy is added in post-production.

3. Keep the prompt under 80 words. Precise, not verbose.

4. Always include clear negative space where the product will be composited.
   Specify the location: "clean open space in [bottom-right / center / bottom-third] of frame"

5. Describe a real, photographable environment — not abstract or surreal.

## WHAT TO DESCRIBE
- Physical environment (desk, table, shelf, counter, outdoor setting)
- Surface materials and textures (linen, wood, marble, concrete)
- Lighting quality and direction (warm window light, soft diffused, golden hour)
- Color palette as visual descriptors (warm cream, sage green, soft teal)
- Props that signal the target avatar's identity (laptop, coffee mug, gym bag, reading glasses)
- Camera angle and framing (overhead, 45-degree, eye-level)
- Mood and atmosphere (calm, energetic, cozy, professional)

## WHAT TO NEVER DESCRIBE
- The PalmAura device or any hand massager
- Any product at all
- Hands interacting with a device
- Text, logos, or brand elements
- Medical equipment or clinical settings

## AESTHETIC TARGETS
High-end DTC (Arrae, Seed, Jolie style):
- Clean, uncluttered compositions with intentional negative space
- Soft natural or studio lighting, never harsh
- Earth tones: warm cream, sage, soft teal, natural wood, linen
- Professional commercial photography quality

## OUTPUT FORMAT
Return ONLY valid JSON. No markdown. No explanation. No code blocks.
{
  "prompt": "the complete scene description, under 80 words",
  "negativePrompt": "text, words, letters, logos, watermarks, massager, device, product, PalmAura, blurry, low quality",
  "strength": 1.0
}

The "strength" should always be 1.0 (full text-to-image generation, not img2img).\`;

const userMessage = 'Convert this visual direction into a scene-only image prompt.\\n\\nVisual Direction:\\n' + JSON.stringify($json.visualDirection) + '\\n\\nStyle: ' + ($json.style || 'lifestyle') + '\\n\\nIMPORTANT: Do NOT include the product. Describe ONLY the environment where the product will be composited later.';

return [{
  json: {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.4,
    max_tokens: 500
  }
}];`;
}

// ============================================================
// FIX 5: Add Compliance Filter node
// ============================================================
console.log('  Fix 5: Add Compliance Filter node');
const complianceFilter = {
  parameters: {
    jsCode: `// Compliance Filter — blocks banned terms from reaching ComfyUI
// Prevents:
//   1) Product terms in scene descriptions (causes double product)
//   2) Text/typography terms (causes garbled text artifacts)
//   3) Medical claim language

const prompt = $json.prompt || '';
const errors = [];

// Guard 1: Product terms
const productBanned = /\\b(massager|palmaura|device|product|gadget|hand\\s*massag|electronic|appliance)\\b/i;
if (productBanned.test(prompt)) {
  errors.push('Product term: ' + prompt.match(productBanned)[0]);
}

// Guard 2: Text/typography terms
const textBanned = /\\b(text|font|overlay|says|reads|headline|logo|watermark|caption|typography|lettering|words|writing|label|slogan)\\b/i;
if (textBanned.test(prompt)) {
  errors.push('Text term: ' + prompt.match(textBanned)[0]);
}

// Guard 3: Medical claim language
const medicalBanned = /\\b(cure|heal|treat|diagnose|therapy|clinical|prescription|doctor.recommended|medical|therapeutic)\\b/i;
if (medicalBanned.test(prompt)) {
  errors.push('Medical term: ' + prompt.match(medicalBanned)[0]);
}

if (errors.length > 0) {
  // Auto-clean instead of blocking
  let cleaned = prompt;
  cleaned = cleaned.replace(productBanned, '');
  cleaned = cleaned.replace(textBanned, '');
  cleaned = cleaned.replace(medicalBanned, '');
  cleaned = cleaned.replace(/\\s{2,}/g, ' ').trim();

  return [{
    json: {
      ...$json,
      prompt: cleaned,
      complianceWarnings: errors,
      promptBeforeFilter: prompt
    }
  }];
}

return [{ json: { ...$json, complianceWarnings: [] } }];`
  },
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [-1280, 1360],
  id: 'compliance-filter-001',
  name: 'Compliance Filter'
};
workflow.nodes.push(complianceFilter);

// ============================================================
// FIX 6: Check ComfyUI Result — stable URL reference
// ============================================================
console.log('  Fix 6: Check ComfyUI Result URL');
const checkResult = findNode('Check ComfyUI Result');
if (checkResult) {
  // Use $('Queue ComfyUI') reference so URL survives retry loop
  checkResult.parameters.url =
    "=http://host.docker.internal:8188/history/{{ $('Queue ComfyUI').first().json.prompt_id }}";
}

// ============================================================
// FIX 7: Wait for Generation — reduce to 60s
// ============================================================
console.log('  Fix 7: Wait for Generation → 60s');
const waitNode = findNode('Wait for Generation');
if (waitNode) {
  waitNode.parameters.amount = 60;
}

// ============================================================
// FIX 8: Extract Output Image — completion check + graceful errors
// ============================================================
console.log('  Fix 8: Extract Output Image');
const extractNode = findNode('Extract Output Image');
if (extractNode) {
  extractNode.parameters.jsCode = `// Extract generated image from ComfyUI history response
// Returns { complete: true/false } for polling loop support

const data = $json;

// Find the prompt_id in the response (it's the top-level key, a UUID)
const keys = Object.keys(data).filter(k => k.length > 20);
const promptId = keys[0] || '';

// Case 1: Not in history yet
if (!promptId || !data[promptId]) {
  return [{
    json: {
      complete: false,
      error: 'Prompt not yet in ComfyUI history'
    }
  }];
}

// Case 2: In history but not completed
const status = data[promptId].status || {};
if (!status.completed) {
  return [{
    json: {
      complete: false,
      error: 'Generation still in progress'
    }
  }];
}

// Case 3: Completed — extract image URLs
const outputs = data[promptId].outputs || {};
const images = [];
for (const nodeId in outputs) {
  if (outputs[nodeId].images) {
    for (const img of outputs[nodeId].images) {
      images.push(img);
    }
  }
}

if (images.length === 0) {
  return [{
    json: {
      complete: true,
      images: [{ url: '', width: 1024, height: 1280 }],
      error: 'No images in ComfyUI output',
      seed: 0
    }
  }];
}

const image = images[0];
const COMFYUI = 'http://host.docker.internal:8188';
const imageUrl = COMFYUI
  + '/view?filename=' + encodeURIComponent(image.filename)
  + '&subfolder=' + encodeURIComponent(image.subfolder || '')
  + '&type=' + encodeURIComponent(image.type || 'output');

// Return in fal.ai-compatible format for downstream compatibility
return [{
  json: {
    complete: true,
    images: [{ url: imageUrl, width: 1024, height: 1280 }],
    imageUrl: imageUrl,
    prompt: $('Build ComfyUI Payload').first().json.originalPrompt || '',
    seed: $('Build ComfyUI Payload').first().json.seed || 0,
    conceptId: $('Build ComfyUI Payload').first().json.conceptId || 'X',
    recordId: $('Build ComfyUI Payload').first().json.recordId || ''
  }
}];`;
}

// ============================================================
// FIX 7b: Add polling loop nodes (IF + Retry Wait)
// ============================================================
console.log('  Fix 7b: Add Generation Complete? IF node');
const ifNode = {
  parameters: {
    conditions: {
      options: { caseSensitive: true, leftValue: '' },
      conditions: [
        {
          id: 'gen-complete-condition',
          leftValue: '={{ $json.complete }}',
          rightValue: 'true',
          operator: {
            type: 'boolean',
            operation: 'true'
          }
        }
      ],
      combinator: 'and'
    }
  },
  type: 'n8n-nodes-base.if',
  typeVersion: 2.2,
  position: [-506, 1344],
  id: 'gen-complete-if-001',
  name: 'Generation Complete?'
};
workflow.nodes.push(ifNode);

console.log('  Fix 7b: Add Retry Wait node');
const retryWait = {
  parameters: {
    amount: 20
  },
  type: 'n8n-nodes-base.wait',
  typeVersion: 1.1,
  position: [-656, 1500],
  id: 'retry-wait-001',
  name: 'Retry Wait',
  webhookId: 'retry-wait-webhook-001'
};
workflow.nodes.push(retryWait);

// ============================================================
// FIX 9: Format Image Data — correct defaults
// ============================================================
console.log('  Fix 9: Format Image Data');
const formatNode = findNode('Format Image Data');
if (formatNode) {
  formatNode.parameters.jsCode = `// Format aggregated image data for Airtable
// Handles ComfyUI output format (local URLs from /view endpoint)
const items = $input.all();
const output = {
  'Ad Sets': '',
  A: '',
  B: '',
  C: '',
  Seed: '',
  Width: 1024,
  Height: 1280,
  Model: 'flux/dev (ComfyUI local)',
  Status: 'Generated',
  'Prompt Used': ''
};

const data = items[0]?.json?.data || items;
const imageUrls = [];
const prompts = [];

for (const entry of data) {
  const json = entry.json || entry;

  // Extract image URL — handle ComfyUI and fal.ai formats
  if (json.imageUrl) {
    imageUrls.push(json.imageUrl);
  } else if (json.images && json.images.length > 0) {
    imageUrls.push(json.images[0].url);
    if (json.images[0].width) output.Width = json.images[0].width;
    if (json.images[0].height) output.Height = json.images[0].height;
  } else if (json.url) {
    imageUrls.push(json.url);
  }

  if (json.prompt) prompts.push(json.prompt);
  if (json.seed) output.Seed = String(json.seed);
  if (json.error) output.Status = 'Partial';
}

output.A = imageUrls[0] || '';
output.B = imageUrls[1] || '';
output.C = imageUrls[2] || '';
output['Ad Sets'] = 'Generated ' + imageUrls.length + ' variants';
output['Prompt Used'] = prompts.join(' | ');

const contextData = $('image-prompt-context').first().json;
output.recordId = contextData?.recordId || '';

if (imageUrls.length === 0) output.Status = 'Failed';

return [{ json: output }];`;
}

// ============================================================
// CONNECTION CHANGES
// ============================================================
console.log('  Updating connections...');

// 1. Parse Prompt → Compliance Filter (was → Prepare ComfyUI Input)
workflow.connections['Parse Prompt'] = {
  main: [[{ node: 'Compliance Filter', type: 'main', index: 0 }]]
};

// 2. Compliance Filter → Prepare ComfyUI Input
workflow.connections['Compliance Filter'] = {
  main: [[{ node: 'Prepare ComfyUI Input', type: 'main', index: 0 }]]
};

// 3. Extract Output Image → Generation Complete? (was → Loop Over Items3)
workflow.connections['Extract Output Image'] = {
  main: [[{ node: 'Generation Complete?', type: 'main', index: 0 }]]
};

// 4. Generation Complete? → true: Loop Over Items3, false: Retry Wait
workflow.connections['Generation Complete?'] = {
  main: [
    // Output 0 (true) → Loop Over Items3
    [{ node: 'Loop Over Items3', type: 'main', index: 0 }],
    // Output 1 (false) → Retry Wait
    [{ node: 'Retry Wait', type: 'main', index: 0 }]
  ]
};

// 5. Retry Wait → Check ComfyUI Result (loop back for retry)
workflow.connections['Retry Wait'] = {
  main: [[{ node: 'Check ComfyUI Result', type: 'main', index: 0 }]]
};

// ============================================================
// WRITE OUTPUT
// ============================================================
const output = JSON.stringify(workflow, null, 2);
fs.writeFileSync(OUTPUT, output, 'utf8');
console.log('\nWrote:', OUTPUT);
console.log('Size:', (output.length / 1024).toFixed(1) + ' KB');
console.log('\nChanges applied:');
console.log('  ✓ Checkpoint: flux/flux1-dev-fp8.safetensors');
console.log('  ✓ Dimensions: 1024×1280 (4:5 ratio)');
console.log('  ✓ Negative prompt: empty (Flux Dev compat)');
console.log('  ✓ IPE prompt: scene-only (no product)');
console.log('  ✓ Compliance Filter: product/text/medical guards');
console.log('  ✓ Polling loop: IF + Retry Wait (20s retry)');
console.log('  ✓ Extract: completion check + graceful errors');
console.log('  ✓ Format: 1280 height default + ComfyUI URLs');
console.log('  ✓ Check URL: $("Queue ComfyUI") stable ref');
console.log('\nTo import: POST workflows/static-scaler-v3-comfyui-v2.json to n8n');
