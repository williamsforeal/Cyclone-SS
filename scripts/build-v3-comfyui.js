/**
 * build-v3-comfyui.js
 *
 * Transforms static-scaler-v3-upgraded.json into static-scaler-v3-comfyui.json:
 *   1. Replaces langchain OpenAI nodes with HTTP Request nodes (fixes import bug)
 *   2. Replaces fal.ai nodes with ComfyUI API nodes (local image generation)
 *   3. Updates parsers and downstream nodes for new response formats
 *   4. Rewires all connections
 */

const fs = require('fs');
const path = require('path');

// ─── File paths ──────────────────────────────────────────────────────────────
const ROOT = path.join(__dirname, '..');
const inputPath = path.join(ROOT, 'workflows', 'static-scaler-v3-upgraded.json');
const outputPath = path.join(ROOT, 'workflows', 'static-scaler-v3-comfyui.json');
const cdPromptPath = path.join(ROOT, 'prompts', 'creative-director.md');
const ipePromptPath = path.join(ROOT, 'prompts', 'image-prompt-engineer.md');

// ─── Load files ──────────────────────────────────────────────────────────────
console.log('Loading workflow from:', inputPath);
const workflow = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// Load system prompts (strip the markdown header comments)
function loadPrompt(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  // Remove lines starting with # that are file header comments (first 3 lines)
  const lines = raw.split('\n');
  const contentStart = lines.findIndex((l, i) => i > 0 && !l.startsWith('#') && l.trim() !== '');
  return lines.slice(contentStart).join('\n').trim();
}

const cdSystemPrompt = loadPrompt(cdPromptPath);
const ipeSystemPrompt = loadPrompt(ipePromptPath);

console.log('Creative Director prompt loaded:', cdSystemPrompt.length, 'chars');
console.log('Image Prompt Engineer prompt loaded:', ipeSystemPrompt.length, 'chars');

// ─── Helper: find node by name ──────────────────────────────────────────────
function findNode(name) {
  return workflow.nodes.findIndex(n => n.name === name);
}

// ─── Helper: remove node by name ────────────────────────────────────────────
function removeNode(name) {
  const idx = findNode(name);
  if (idx >= 0) {
    workflow.nodes.splice(idx, 1);
    console.log(`  Removed node: ${name}`);
    return true;
  }
  console.warn(`  WARNING: Node not found: ${name}`);
  return false;
}

// ─── Helper: get node position ──────────────────────────────────────────────
function getPosition(name) {
  const idx = findNode(name);
  if (idx >= 0) return workflow.nodes[idx].position;
  return [0, 0];
}

// ─── STEP 1: Replace "Message a model1" with HTTP Request pair ──────────────
console.log('\n=== STEP 1: Replace Creative Director (Message a model1) ===');

const cdPos = getPosition('Message a model1');
removeNode('Message a model1');

// Node A: Build CD Payload (Code node)
const buildCDPayload = {
  parameters: {
    jsCode: `// Build OpenAI Chat Completions payload for Creative Director
const systemPrompt = ${JSON.stringify(cdSystemPrompt)};

const userMessage = \`Here is the product and ad context. Generate 3 ad concepts.

Product: PalmAura Smart Warm Compress Hand Massager
Product Image URL: \${$json.productImageUrl}
Ad Type: \${$json.adType}
Headline from brief: \${$json.headline}
Concept from brief: \${$json.concept}
CTA from brief: \${$json.cta}
Angle from brief: \${$json.angle}
Avatar Target: \${$json.avatarTarget}
Awareness Level: \${$json.awarenessLevel}
Tags: \${$json.tags}
Record ID: \${$json.recordId}\`;

return [{
  json: {
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.8,
    max_tokens: 3000
  }
}];`
  },
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [cdPos[0], cdPos[1]],
  id: 'build-cd-payload-001',
  name: 'Build CD Payload'
};

// Node B: Call Creative Director (HTTP Request)
const callCreativeDirector = {
  parameters: {
    method: 'POST',
    url: 'https://api.openai.com/v1/chat/completions',
    authentication: 'genericCredentialType',
    genericAuthType: 'httpHeaderAuth',
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={{ JSON.stringify($json) }}',
    options: {}
  },
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.3,
  position: [cdPos[0] + 200, cdPos[1]],
  id: 'call-cd-api-001',
  name: 'Call Creative Director',
  credentials: {
    httpHeaderAuth: {
      id: 'openai-bearer-001',
      name: 'OpenAI Bearer'
    }
  }
};

workflow.nodes.push(buildCDPayload);
workflow.nodes.push(callCreativeDirector);
console.log('  Added: Build CD Payload + Call Creative Director');

// ─── STEP 2: Replace "Image Prompt Engineer" with HTTP Request pair ─────────
console.log('\n=== STEP 2: Replace Image Prompt Engineer ===');

const ipePos = getPosition('Image Prompt Engineer');
removeNode('Image Prompt Engineer');

// Node A: Build IPE Payload (Code node)
const buildIPEPayload = {
  parameters: {
    jsCode: `// Build OpenAI Chat Completions payload for Image Prompt Engineer
const systemPrompt = ${JSON.stringify(ipeSystemPrompt)};

const userMessage = \`Convert this visual direction into an image generation prompt.

Visual Direction:
\${JSON.stringify($json.visualDirection)}

Product Image URL: \${$json.productImageUrl}
Style: \${$json.style}\`;

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
}];`
  },
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [ipePos[0], ipePos[1]],
  id: 'build-ipe-payload-001',
  name: 'Build IPE Payload'
};

// Node B: Call Image Prompt Engineer (HTTP Request)
const callIPE = {
  parameters: {
    method: 'POST',
    url: 'https://api.openai.com/v1/chat/completions',
    authentication: 'genericCredentialType',
    genericAuthType: 'httpHeaderAuth',
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={{ JSON.stringify($json) }}',
    options: {}
  },
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.3,
  position: [ipePos[0] + 200, ipePos[1]],
  id: 'call-ipe-api-001',
  name: 'Call Image Prompt Engineer',
  credentials: {
    httpHeaderAuth: {
      id: 'openai-bearer-001',
      name: 'OpenAI Bearer'
    }
  }
};

workflow.nodes.push(buildIPEPayload);
workflow.nodes.push(callIPE);
console.log('  Added: Build IPE Payload + Call Image Prompt Engineer');

// ─── STEP 3: Update Parse Creative Director Output ──────────────────────────
console.log('\n=== STEP 3: Update Code in JavaScript1 (Parse CD Output) ===');

const parseIdx = findNode('Code in JavaScript1');
if (parseIdx >= 0) {
  workflow.nodes[parseIdx].parameters.jsCode = `// Parse Creative Director JSON output from OpenAI Chat Completions API
const items = $input.all();
const results = [];

for (const item of items) {
  let text = '';

  // Primary: Standard Chat Completions response (HTTP Request node)
  if (item.json?.choices?.[0]?.message?.content) {
    text = item.json.choices[0].message.content;
  }
  // Fallback: Direct text field
  else if (item.json?.text) {
    text = item.json.text;
  }
  // Fallback: Responses API format
  else if (item.json?.output?.[0]?.content?.[0]?.text) {
    text = item.json.output[0].content[0].text;
  }
  // Fallback: Raw string
  else if (typeof item.json === 'string') {
    text = item.json;
  }

  // Clean markdown code blocks
  text = text.replace(/\`\`\`json\\s*/gi, '').replace(/\`\`\`\\s*/g, '').trim();

  // Find the JSON array
  const arrayMatch = text.match(/\\[[\\s\\S]*\\]/);
  if (!arrayMatch) {
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

return results;`;
  console.log('  Updated Code in JavaScript1 parser');
} else {
  console.warn('  WARNING: Code in JavaScript1 not found');
}

// ─── STEP 4: Update Parse Prompt node ───────────────────────────────────────
console.log('\n=== STEP 4: Update Parse Prompt (for Chat Completions response) ===');

const parsePromptIdx = findNode('Parse Prompt');
if (parsePromptIdx >= 0) {
  workflow.nodes[parsePromptIdx].parameters.jsCode = `// Parse Image Prompt Engineer output from OpenAI Chat Completions API
// and prepare the payload for ComfyUI image generation
const items = $input.all();
const results = [];

for (const item of items) {
  let text = '';

  // Primary: Standard Chat Completions response
  if (item.json?.choices?.[0]?.message?.content) {
    text = item.json.choices[0].message.content;
  }
  // Fallback: Direct text
  else if (item.json?.text) {
    text = item.json.text;
  }
  // Fallback: Responses API
  else if (item.json?.output?.[0]?.content?.[0]?.text) {
    text = item.json.output[0].content[0].text;
  }
  // Fallback: message content
  else if (item.json?.message?.content) {
    text = item.json.message.content;
  }

  // Clean markdown
  text = text.replace(/\\\`\\\`\\\`json\\\\s*/gi, '').replace(/\\\`\\\`\\\`\\\\s*/g, '').trim();

  let promptData;
  try {
    const objMatch = text.match(/\\{[\\s\\S]*\\}/);
    promptData = JSON.parse(objMatch ? objMatch[0] : text);
  } catch (e) {
    promptData = {
      prompt: text.substring(0, 500),
      negativePrompt: 'text, words, letters, logos, watermarks, blurry, low quality',
      strength: 0.55
    };
  }

  // Get upstream data preserved through the loop
  const loopItem = $('Loop Over Items3').first().json;
  const productImageUrl = loopItem?.productImageUrl || item.json?.productImageUrl || '';
  const conceptId = loopItem?.conceptId || item.json?.conceptId || 'X';
  const adCopy = loopItem?.adCopy || item.json?.adCopy || {};
  const recordId = loopItem?.recordId || item.json?.recordId || '';

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

return results;`;
  // Keep the mode setting
  workflow.nodes[parsePromptIdx].parameters.mode = 'runOnceForAllItems';
  console.log('  Updated Parse Prompt parser');
} else {
  console.warn('  WARNING: Parse Prompt not found');
}

// ─── STEP 5: Replace fal.ai nodes with ComfyUI nodes ───────────────────────
console.log('\n=== STEP 5: Replace fal.ai with ComfyUI ===');

const falPostPos = getPosition('fal-post');
const wait2Pos = getPosition('Wait2');
const falRenderPos = getPosition('fal-render');

removeNode('fal-post');
removeNode('Wait2');
removeNode('fal-render');

// ComfyUI URL (n8n is in Docker, ComfyUI on host)
const COMFYUI_URL = 'http://host.docker.internal:8188';

// Node 1: Upload Product Image to ComfyUI
const uploadToComfyUI = {
  parameters: {
    jsCode: `// Download product image from S3 and prepare for ComfyUI upload
// The actual upload happens in the next HTTP Request node
const productImageUrl = $json.productImageUrl || '';
const conceptId = $json.conceptId || 'X';

// Generate a unique filename for this upload
const filename = 'n8n_product_' + Date.now() + '_' + conceptId + '.jpg';

return [{
  json: {
    ...($json),
    comfyui_image_filename: filename,
    comfyui_product_url: productImageUrl
  }
}];`
  },
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [falPostPos[0] - 50, falPostPos[1]],
  id: 'comfyui-prep-001',
  name: 'Prepare ComfyUI Input'
};

// Node 2: Build ComfyUI workflow payload
const buildComfyUIPayload = {
  parameters: {
    jsCode: `// Build ComfyUI API payload for Flux Dev img2img
// The workflow template is loaded from the embedded JSON below.
// To customize: export a new workflow from ComfyUI in API format
// and replace the template object.

const prompt = $json.prompt || 'professional product photography';
const negativePrompt = $json.negativePrompt || 'text, words, letters, logos, watermarks';
const strength = $json.strength || 0.55;
const seed = Math.floor(Math.random() * 2147483647);
const imageFilename = $json.comfyui_image_filename || 'input.jpg';

// ═══ ComfyUI Workflow Template (Flux Dev img2img) ═══
// IMPORTANT: Replace this template with your actual ComfyUI workflow
// exported in API format from the ComfyUI browser UI.
// This is a standard Flux txt2img template as a starting point.
// To get the correct template:
//   1. Build your workflow in ComfyUI at http://127.0.0.1:8188
//   2. Enable Dev Mode in Settings
//   3. Click "Save (API Format)"
//   4. Replace the workflowTemplate below with the exported JSON
const workflowTemplate = {
  "4": {
    "class_type": "CheckpointLoaderSimple",
    "inputs": {
      "ckpt_name": "flux1-dev.safetensors"
    }
  },
  "5": {
    "class_type": "EmptyLatentImage",
    "inputs": {
      "width": 1024,
      "height": 1024,
      "batch_size": 1
    }
  },
  "6": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "text": prompt,
      "clip": ["4", 1]
    }
  },
  "7": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "text": negativePrompt,
      "clip": ["4", 1]
    }
  },
  "3": {
    "class_type": "KSampler",
    "inputs": {
      "seed": seed,
      "steps": 28,
      "cfg": 3.5,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": strength,
      "model": ["4", 0],
      "positive": ["6", 0],
      "negative": ["7", 0],
      "latent_image": ["5", 0]
    }
  },
  "8": {
    "class_type": "VAEDecode",
    "inputs": {
      "samples": ["3", 0],
      "vae": ["4", 2]
    }
  },
  "9": {
    "class_type": "SaveImage",
    "inputs": {
      "filename_prefix": "n8n_staticscaler_" + $json.conceptId,
      "images": ["8", 0]
    }
  }
};

// Build the ComfyUI API request
const clientId = 'n8n-ss-' + Date.now();

return [{
  json: {
    comfyui_payload: {
      prompt: workflowTemplate,
      client_id: clientId
    },
    // Preserve upstream data for downstream nodes
    conceptId: $json.conceptId,
    adCopy: $json.adCopy,
    recordId: $json.recordId,
    originalPrompt: prompt,
    seed: seed
  }
}];`
  },
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [falPostPos[0] + 100, falPostPos[1]],
  id: 'comfyui-build-001',
  name: 'Build ComfyUI Payload'
};

// Node 3: Queue ComfyUI Prompt (HTTP Request)
const queueComfyUI = {
  parameters: {
    method: 'POST',
    url: COMFYUI_URL + '/prompt',
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={{ JSON.stringify($json.comfyui_payload) }}',
    options: {}
  },
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.3,
  position: [falPostPos[0] + 250, falPostPos[1]],
  id: 'comfyui-queue-001',
  name: 'Queue ComfyUI'
};

// Node 4: Wait for Generation
const waitForGen = {
  parameters: {
    amount: 90
  },
  type: 'n8n-nodes-base.wait',
  typeVersion: 1.1,
  position: [wait2Pos[0], wait2Pos[1]],
  id: 'comfyui-wait-001',
  name: 'Wait for Generation',
  webhookId: 'comfyui-wait-webhook-001'
};

// Node 5: Check ComfyUI Result (HTTP Request)
const checkResult = {
  parameters: {
    url: '=' + COMFYUI_URL + '/history/{{ $json.prompt_id }}',
    options: {}
  },
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.3,
  position: [falRenderPos[0], falRenderPos[1]],
  id: 'comfyui-check-001',
  name: 'Check ComfyUI Result'
};

// Node 6: Extract Output Image (Code node)
const extractImage = {
  parameters: {
    jsCode: `// Extract generated image from ComfyUI history response
const data = $json;
const promptId = Object.keys(data)[0]; // First key is the prompt_id
let images = [];

if (data[promptId] && data[promptId].outputs) {
  const outputs = data[promptId].outputs;
  for (const nodeId in outputs) {
    const nodeOutput = outputs[nodeId];
    if (nodeOutput.images) {
      for (const img of nodeOutput.images) {
        images.push(img);
      }
    }
  }
}

if (images.length === 0) {
  // Return error with enough data for downstream to handle gracefully
  return [{
    json: {
      error: 'No images in ComfyUI output',
      images: [{ url: '' }],
      prompt: '',
      seed: 0
    }
  }];
}

const image = images[0];
const COMFYUI = '${COMFYUI_URL}';
const imageUrl = COMFYUI + '/view?filename=' + encodeURIComponent(image.filename) + '&subfolder=' + encodeURIComponent(image.subfolder || '') + '&type=' + encodeURIComponent(image.type || 'output');

// Return in a format compatible with the downstream Format Image Data node
// (same shape as fal.ai response for compatibility)
return [{
  json: {
    images: [{ url: imageUrl, width: 1024, height: 1024 }],
    prompt: $('Build ComfyUI Payload').first().json.originalPrompt || '',
    seed: $('Build ComfyUI Payload').first().json.seed || 0,
    conceptId: $('Build ComfyUI Payload').first().json.conceptId || 'X',
    recordId: $('Build ComfyUI Payload').first().json.recordId || ''
  }
}];`
  },
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [falRenderPos[0] + 160, falRenderPos[1]],
  id: 'comfyui-extract-001',
  name: 'Extract Output Image'
};

workflow.nodes.push(uploadToComfyUI);
workflow.nodes.push(buildComfyUIPayload);
workflow.nodes.push(queueComfyUI);
workflow.nodes.push(waitForGen);
workflow.nodes.push(checkResult);
workflow.nodes.push(extractImage);
console.log('  Added 6 ComfyUI nodes');

// ─── STEP 6: Update Format Image Data for ComfyUI output ───────────────────
console.log('\n=== STEP 6: Update Format Image Data ===');

const formatIdx = findNode('Format Image Data');
if (formatIdx >= 0) {
  workflow.nodes[formatIdx].parameters.jsCode = `// Format aggregated image data for Airtable
// Handles both ComfyUI and fal.ai response formats
const items = $input.all();
const output = {
  'Ad Sets': '',
  A: '',
  B: '',
  C: '',
  Seed: '',
  Width: 1024,
  Height: 1024,
  Model: 'flux/dev (ComfyUI)',
  Status: 'Generated',
  'Prompt Used': ''
};

// Get the aggregated data array
const data = items[0]?.json?.data || items;
const imageUrls = [];
const prompts = [];

for (const entry of data) {
  const json = entry.json || entry;

  // Extract image URL (works for both ComfyUI and fal.ai format)
  if (json.images && json.images.length > 0) {
    imageUrls.push(json.images[0].url);
    if (json.images[0].width) output.Width = json.images[0].width;
    if (json.images[0].height) output.Height = json.images[0].height;
  } else if (json.url) {
    imageUrls.push(json.url);
  } else if (json.imageUrl) {
    imageUrls.push(json.imageUrl);
  }

  // Collect prompts and seeds
  if (json.prompt) prompts.push(json.prompt);
  if (json.seed) output.Seed = String(json.seed);
}

// Map to A, B, C
output.A = imageUrls[0] || '';
output.B = imageUrls[1] || '';
output.C = imageUrls[2] || '';
output['Ad Sets'] = 'Generated ' + imageUrls.length + ' variants';
output['Prompt Used'] = prompts.join(' | ');

// Get record ID from upstream
const contextData = $('image-prompt-context').first().json;
output.recordId = contextData?.recordId || '';

return [{ json: output }];`;
  console.log('  Updated Format Image Data');
} else {
  console.warn('  WARNING: Format Image Data not found');
}

// ─── STEP 7: Rewire all connections ─────────────────────────────────────────
console.log('\n=== STEP 7: Rewire connections ===');

const conn = workflow.connections;

// --- Creative Director chain ---
// OLD: image-prompt-context → Message a model1 → Code in JavaScript1
// NEW: image-prompt-context → Build CD Payload → Call Creative Director → Code in JavaScript1

// Update image-prompt-context outputs: replace Message a model1 with Build CD Payload
if (conn['image-prompt-context']) {
  const outputs = conn['image-prompt-context'].main[0];
  for (let i = 0; i < outputs.length; i++) {
    if (outputs[i].node === 'Message a model1') {
      outputs[i].node = 'Build CD Payload';
      console.log('  Rewired: image-prompt-context → Build CD Payload');
    }
  }
}

// Add: Build CD Payload → Call Creative Director
conn['Build CD Payload'] = {
  main: [[{ node: 'Call Creative Director', type: 'main', index: 0 }]]
};

// Replace: Message a model1 → Code in JavaScript1
// with: Call Creative Director → Code in JavaScript1
delete conn['Message a model1'];
conn['Call Creative Director'] = {
  main: [[{ node: 'Code in JavaScript1', type: 'main', index: 0 }]]
};
console.log('  Rewired: Build CD Payload → Call Creative Director → Code in JavaScript1');

// --- Image Prompt Engineer chain (inside loop) ---
// OLD: Loop Over Items3 → Image Prompt Engineer → Parse Prompt → fal-post → Wait2 → fal-render → Loop Over Items3
// NEW: Loop Over Items3 → Build IPE Payload → Call Image Prompt Engineer → Parse Prompt → Prepare ComfyUI Input → Build ComfyUI Payload → Queue ComfyUI → Wait for Generation → Check ComfyUI Result → Extract Output Image → Loop Over Items3

// Update Loop Over Items3 output[1] (the "each item" branch)
if (conn['Loop Over Items3']) {
  const loopOutputs = conn['Loop Over Items3'].main;
  if (loopOutputs[1]) {
    for (let i = 0; i < loopOutputs[1].length; i++) {
      if (loopOutputs[1][i].node === 'Image Prompt Engineer') {
        loopOutputs[1][i].node = 'Build IPE Payload';
        console.log('  Rewired: Loop Over Items3 → Build IPE Payload');
      }
    }
  }
}

// Add: Build IPE Payload → Call Image Prompt Engineer
conn['Build IPE Payload'] = {
  main: [[{ node: 'Call Image Prompt Engineer', type: 'main', index: 0 }]]
};

// Replace: Image Prompt Engineer → Parse Prompt
// with: Call Image Prompt Engineer → Parse Prompt
delete conn['Image Prompt Engineer'];
conn['Call Image Prompt Engineer'] = {
  main: [[{ node: 'Parse Prompt', type: 'main', index: 0 }]]
};
console.log('  Rewired: Build IPE Payload → Call IPE → Parse Prompt');

// Replace: Parse Prompt → fal-post with Parse Prompt → Prepare ComfyUI Input
if (conn['Parse Prompt']) {
  conn['Parse Prompt'].main[0] = [{ node: 'Prepare ComfyUI Input', type: 'main', index: 0 }];
}

// ComfyUI chain
conn['Prepare ComfyUI Input'] = {
  main: [[{ node: 'Build ComfyUI Payload', type: 'main', index: 0 }]]
};
conn['Build ComfyUI Payload'] = {
  main: [[{ node: 'Queue ComfyUI', type: 'main', index: 0 }]]
};
conn['Queue ComfyUI'] = {
  main: [[{ node: 'Wait for Generation', type: 'main', index: 0 }]]
};
conn['Wait for Generation'] = {
  main: [[{ node: 'Check ComfyUI Result', type: 'main', index: 0 }]]
};
conn['Check ComfyUI Result'] = {
  main: [[{ node: 'Extract Output Image', type: 'main', index: 0 }]]
};

// Replace: fal-render → Loop Over Items3
// with: Extract Output Image → Loop Over Items3
delete conn['fal-post'];
delete conn['Wait2'];
delete conn['fal-render'];
conn['Extract Output Image'] = {
  main: [[{ node: 'Loop Over Items3', type: 'main', index: 0 }]]
};
console.log('  Rewired: ComfyUI chain → Loop Over Items3');

// ─── STEP 8: Clean up old version data ──────────────────────────────────────
console.log('\n=== STEP 8: Clean up old version data ===');

// Remove activeVersion (contains old nodes that would confuse n8n import)
if (workflow.activeVersion) {
  delete workflow.activeVersion;
  console.log('  Removed activeVersion (old node history)');
}
// Remove versionId / versionCounter (let n8n create new ones)
delete workflow.versionId;
delete workflow.activeVersionId;
delete workflow.versionCounter;
// Remove shared/tags (instance-specific)
delete workflow.shared;
delete workflow.tags;

// ─── STEP 9: Update workflow metadata ───────────────────────────────────────
console.log('\n=== STEP 9: Update metadata ===');
workflow.name = 'Static Scaler v3 (v3.2 ComfyUI)';
workflow.updatedAt = new Date().toISOString();
// Reset ID so n8n creates a new workflow on import
delete workflow.id;

// ─── STEP 10: Write output ──────────────────────────────────────────────────
fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2));
console.log('\nWorkflow saved to:', outputPath);

// ─── Summary ────────────────────────────────────────────────────────────────
console.log('\n=== SUMMARY ===');
console.log('Nodes in workflow:', workflow.nodes.length);
console.log('Connections:', Object.keys(workflow.connections).length);
console.log('\nChanges made:');
console.log('  [1] Replaced Message a model1 → Build CD Payload + Call Creative Director');
console.log('  [2] Replaced Image Prompt Engineer → Build IPE Payload + Call Image Prompt Engineer');
console.log('  [3] Updated Code in JavaScript1 parser for Chat Completions format');
console.log('  [4] Updated Parse Prompt parser for Chat Completions format');
console.log('  [5] Replaced fal-post/Wait2/fal-render → 6 ComfyUI nodes');
console.log('  [6] Updated Format Image Data for ComfyUI output');
console.log('  [7] Rewired all connections');
console.log('\n⚠️  BEFORE IMPORTING:');
console.log('  1. Create an "OpenAI Bearer" HTTP Header Auth credential in n8n:');
console.log('     Name: "OpenAI Bearer"');
console.log('     Header Name: Authorization');
console.log('     Header Value: Bearer <your-openai-api-key>');
console.log('  2. Ensure ComfyUI is running at localhost:8188');
console.log('  3. Ensure docker-compose.yml has extra_hosts for host.docker.internal');
console.log('  4. The ComfyUI workflow template in Build ComfyUI Payload is a PLACEHOLDER.');
console.log('     Replace it with your actual Flux Dev workflow exported from ComfyUI.');
