/**
 * build-v3-fal.js
 *
 * Transforms static-scaler-v3-upgraded.json into static-scaler-v3-fixed.json:
 *   1. Replaces langchain OpenAI nodes with HTTP Request nodes (fixes import bug)
 *   2. Updates parsers for Chat Completions response format
 *   3. Keeps fal.ai nodes unchanged
 *   4. Rewires connections
 *   5. Strips activeVersion, shared, tags, versionId metadata
 */

const fs = require('fs');
const path = require('path');

// ─── File paths ──────────────────────────────────────────────────────────────
const ROOT = path.join(__dirname, '..');
const inputPath = path.join(ROOT, 'workflows', 'static-scaler-v3-upgraded.json');
const outputPath = path.join(ROOT, 'workflows', 'static-scaler-v3-fixed.json');
const cdPromptPath = path.join(ROOT, 'prompts', 'creative-director.md');
const ipePromptPath = path.join(ROOT, 'prompts', 'image-prompt-engineer.md');

// ─── Load files ──────────────────────────────────────────────────────────────
console.log('Loading workflow from:', inputPath);
const workflow = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// Load system prompts (strip the markdown header comments at top)
function loadPrompt(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n');
  // Skip lines that start with # at the very top (file header comments)
  const contentStart = lines.findIndex((l, i) => i > 0 && !l.startsWith('#') && l.trim() !== '');
  return lines.slice(contentStart).join('\n').trim();
}

const cdSystemPrompt = loadPrompt(cdPromptPath);
const ipeSystemPrompt = loadPrompt(ipePromptPath);

console.log('Creative Director prompt loaded:', cdSystemPrompt.length, 'chars');
console.log('Image Prompt Engineer prompt loaded:', ipeSystemPrompt.length, 'chars');

// ─── Helper: find node index by name ─────────────────────────────────────────
function findNode(name) {
  return workflow.nodes.findIndex(n => n.name === name);
}

// ─── Helper: remove node by name ─────────────────────────────────────────────
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

// ─── Helper: get node position ───────────────────────────────────────────────
function getPosition(name) {
  const idx = findNode(name);
  if (idx >= 0) return workflow.nodes[idx].position;
  return [0, 0];
}

// ─── STEP 1: Replace "Message a model1" with HTTP Request pair ───────────────
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

// ─── STEP 2: Replace "Image Prompt Engineer" with HTTP Request pair ──────────
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

// ─── STEP 3: Update Code in JavaScript1 (Parse CD Output) ───────────────────
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
  // Fallback: Responses API format (legacy)
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

// ─── STEP 4: Update Parse Prompt node ────────────────────────────────────────
console.log('\n=== STEP 4: Update Parse Prompt (for Chat Completions response) ===');

const parsePromptIdx = findNode('Parse Prompt');
if (parsePromptIdx >= 0) {
  workflow.nodes[parsePromptIdx].parameters.jsCode = `// Parse Image Prompt Engineer output from OpenAI Chat Completions API
// and prepare the payload for Bria Product Shot
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
  // Fallback: Responses API (legacy)
  else if (item.json?.output?.[0]?.content?.[0]?.text) {
    text = item.json.output[0].content[0].text;
  }
  // Fallback: message content
  else if (item.json?.message?.content) {
    text = item.json.message.content;
  }

  // Clean markdown
  text = text.replace(/\`\`\`json\\s*/gi, '').replace(/\`\`\`\\s*/g, '').trim();

  let promptData;
  try {
    const objMatch = text.match(/\\{[\\s\\S]*\\}/);
    promptData = JSON.parse(objMatch ? objMatch[0] : text);
  } catch (e) {
    // Fallback: use raw text as scene description
    promptData = {
      scene_description: text.substring(0, 500),
      placement_type: 'automatic'
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
      sceneDescription: promptData.scene_description || '',
      placementType: promptData.placement_type || 'automatic',
      manualPlacementSelection: promptData.manual_placement_selection || '',
      productImageUrl: productImageUrl,
      conceptId: conceptId,
      adCopy: adCopy,
      recordId: recordId
    }
  });
}

return results;`;
  workflow.nodes[parsePromptIdx].parameters.mode = 'runOnceForAllItems';
  console.log('  Updated Parse Prompt parser');
} else {
  console.warn('  WARNING: Parse Prompt not found');
}

// ─── STEP 5: Switch fal-post to Bria Product Shot ───────────────────────────
console.log('\n=== STEP 5: Switch fal-post to Bria Product Shot ===');

const falPostIdx = findNode('fal-post');
if (falPostIdx >= 0) {
  const falNode = workflow.nodes[falPostIdx];

  // Change URL to Bria Product Shot (was Flux Dev)
  falNode.parameters.url = 'https://queue.fal.run/fal-ai/bria/product-shot';
  console.log('  Set fal-post URL:', falNode.parameters.url);

  // Replace jsonBody with Bria Product Shot parameters
  // IMPORTANT: n8n requires the ENTIRE jsonBody to start with = to enable expression mode.
  // All other working jsonBody params in this workflow follow this pattern.
  // Without leading =, {{ }} expressions are sent as literal strings.
  falNode.parameters.jsonBody = `={
  "image_url": "{{ $json.productImageUrl }}",
  "scene_description": "{{ $json.sceneDescription }}",
  "placement_type": "{{ $json.placementType }}",
  "shot_size": [1000, 1000],
  "num_results": 1,
  "fast": true
}`;
  console.log('  Set fal-post jsonBody for Bria Product Shot');
  console.log('  Starts with =:', falNode.parameters.jsonBody.startsWith('=') ? 'OK' : 'MISSING');
  console.log('  Has {{ $json.productImageUrl }}:', falNode.parameters.jsonBody.includes('{{ $json.productImageUrl }}') ? 'OK' : 'MISSING');
  console.log('  Has {{ $json.sceneDescription }}:', falNode.parameters.jsonBody.includes('{{ $json.sceneDescription }}') ? 'OK' : 'MISSING');
} else {
  console.warn('  WARNING: fal-post node not found');
}

// ─── STEP 5b: Increase Wait2 timeout for Bria queue ─────────────────────────
console.log('\n=== STEP 5b: Increase Wait2 for Bria queue time ===');
const wait2Idx = findNode('Wait2');
if (wait2Idx >= 0) {
  // Bria Product Shot can have queue times > 30s. Increase to 120s.
  workflow.nodes[wait2Idx].parameters.amount = 120;
  console.log('  Set Wait2 to 120 seconds (was 30)');
} else {
  console.warn('  WARNING: Wait2 not found');
}

// ─── STEP 6: Add Split Image URLs + fix Download fal Image ──────────────────
console.log('\n=== STEP 6: Add Split Image URLs (download all 3 images) ===');

const downloadIdx = findNode('Download fal Image');
const downloadPos = downloadIdx >= 0 ? workflow.nodes[downloadIdx].position : [-192, 1200];

// Add a Code node that splits Airtable response into 3 items (A, B, C)
const splitImageURLs = {
  parameters: {
    jsCode: `// Split Airtable response into 3 items — one per image URL (A, B, C)
const airtableResponse = $input.first().json;
const recordId = airtableResponse.id || '';
const fields = airtableResponse.fields || airtableResponse;
const results = [];

for (const label of ['A', 'B', 'C']) {
  const url = fields[label];
  if (url && typeof url === 'string' && url.startsWith('http')) {
    results.push({
      json: {
        imageUrl: url,
        conceptId: label,
        recordId: recordId,
        id: recordId + '_' + label
      }
    });
  }
}

if (results.length === 0) {
  return [{ json: { error: 'No image URLs found in Airtable response', recordId } }];
}

return results;`
  },
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [downloadPos[0] - 160, downloadPos[1]],
  id: 'split-image-urls-001',
  name: 'Split Image URLs'
};

workflow.nodes.push(splitImageURLs);
console.log('  Added: Split Image URLs node');

// Fix Download fal Image to use dynamic URL from split items
if (downloadIdx >= 0) {
  workflow.nodes[downloadIdx].parameters.url = '={{ $json.imageUrl }}';
  console.log('  Fixed: Download fal Image URL → {{ $json.imageUrl }}');
}

// Fix Upload a file fileName — after binary download, $json.id is lost
// Reference Split Image URLs node directly so the expression resolves
const uploadIdx = findNode('Upload a file');
if (uploadIdx >= 0) {
  workflow.nodes[uploadIdx].parameters.fileName =
    "=ad-phase1-product-bckgrnd/{{ $('Split Image URLs').item.json.id }}.jpg";
  console.log('  Fixed: Upload a file fileName → references Split Image URLs node');
}

// ─── STEP 7: Rewire connections ──────────────────────────────────────────────
console.log('\n=== STEP 7: Rewire connections ===');

const conn = workflow.connections;

// 5a: image-prompt-context → was "Message a model1", now → "Build CD Payload"
if (conn['image-prompt-context']) {
  const outputs = conn['image-prompt-context'].main[0];
  const msgIdx = outputs.findIndex(c => c.node === 'Message a model1');
  if (msgIdx >= 0) {
    outputs[msgIdx].node = 'Build CD Payload';
    console.log('  image-prompt-context → Build CD Payload');
  }
}

// 5b: Add Build CD Payload → Call Creative Director
conn['Build CD Payload'] = {
  main: [[{ node: 'Call Creative Director', type: 'main', index: 0 }]]
};
console.log('  Build CD Payload → Call Creative Director');

// 5c: "Message a model1" → "Code in JavaScript1" becomes "Call Creative Director" → "Code in JavaScript1"
// Remove old connection key
delete conn['Message a model1'];
conn['Call Creative Director'] = {
  main: [[{ node: 'Code in JavaScript1', type: 'main', index: 0 }]]
};
console.log('  Call Creative Director → Code in JavaScript1');

// 5d: Loop Over Items3 output[1] → was "Image Prompt Engineer", now → "Build IPE Payload"
if (conn['Loop Over Items3']) {
  const loopOutput1 = conn['Loop Over Items3'].main[1];
  if (loopOutput1) {
    const ipeIdx = loopOutput1.findIndex(c => c.node === 'Image Prompt Engineer');
    if (ipeIdx >= 0) {
      loopOutput1[ipeIdx].node = 'Build IPE Payload';
      console.log('  Loop Over Items3[1] → Build IPE Payload');
    }
  }
}

// 5e: Add Build IPE Payload → Call Image Prompt Engineer
conn['Build IPE Payload'] = {
  main: [[{ node: 'Call Image Prompt Engineer', type: 'main', index: 0 }]]
};
console.log('  Build IPE Payload → Call Image Prompt Engineer');

// 5f: "Image Prompt Engineer" → "Parse Prompt" becomes "Call Image Prompt Engineer" → "Parse Prompt"
delete conn['Image Prompt Engineer'];
conn['Call Image Prompt Engineer'] = {
  main: [[{ node: 'Parse Prompt', type: 'main', index: 0 }]]
};
console.log('  Call Image Prompt Engineer → Parse Prompt');

// 7g: Insert Split Image URLs between Create Ad URLs and Download fal Image
// Old: Create Ad URLs → Download fal Image
// New: Create Ad URLs → Split Image URLs → Download fal Image
if (conn['Create Ad URLs']) {
  const createOutputs = conn['Create Ad URLs'].main[0];
  const dlIdx = createOutputs.findIndex(c => c.node === 'Download fal Image');
  if (dlIdx >= 0) {
    createOutputs[dlIdx].node = 'Split Image URLs';
    console.log('  Create Ad URLs → Split Image URLs');
  }
}
conn['Split Image URLs'] = {
  main: [[{ node: 'Download fal Image', type: 'main', index: 0 }]]
};
console.log('  Split Image URLs → Download fal Image');

// Verify fal.ai chain is intact
console.log('\n=== Verify fal.ai chain ===');
console.log('  Parse Prompt → fal-post:', conn['Parse Prompt']?.main?.[0]?.[0]?.node === 'fal-post' ? 'OK' : 'MISSING');
console.log('  fal-post → Wait2:', conn['fal-post']?.main?.[0]?.[0]?.node === 'Wait2' ? 'OK' : 'MISSING');
console.log('  Wait2 → fal-render:', conn['Wait2']?.main?.[0]?.[0]?.node === 'fal-render' ? 'OK' : 'MISSING');
console.log('  fal-render → Loop Over Items3:', conn['fal-render']?.main?.[0]?.[0]?.node === 'Loop Over Items3' ? 'OK' : 'MISSING');

// ─── STEP 8: Strip metadata ─────────────────────────────────────────────────
console.log('\n=== STEP 8: Strip metadata ===');

delete workflow.activeVersion;
delete workflow.activeVersionId;
delete workflow.versionId;
delete workflow.versionCounter;
delete workflow.shared;
delete workflow.tags;
delete workflow.updatedAt;
delete workflow.createdAt;
console.log('  Removed: activeVersion, versionId, shared, tags, timestamps');

// Rename workflow
workflow.name = 'Static Scaler v3.2 (Fixed OpenAI)';
console.log('  Renamed to:', workflow.name);

// ─── STEP 9: Write output ───────────────────────────────────────────────────
console.log('\n=== STEP 9: Write output ===');

const output = JSON.stringify(workflow, null, 2);
fs.writeFileSync(outputPath, output);

// Summary stats
const nodeNames = workflow.nodes.map(n => n.name);
const connKeys = Object.keys(workflow.connections);

console.log('\nOutput:', outputPath);
console.log('Nodes:', workflow.nodes.length);
console.log('Connection keys:', connKeys.length);
console.log('\nNode list:');
nodeNames.forEach(n => console.log('  -', n));

// Verify no old nodes remain
const oldNodes = ['Message a model1', 'Image Prompt Engineer'];
const remaining = oldNodes.filter(n => nodeNames.includes(n));
if (remaining.length > 0) {
  console.error('\nERROR: Old nodes still present:', remaining);
  process.exit(1);
}

// Verify new nodes exist
const newNodes = ['Build CD Payload', 'Call Creative Director', 'Build IPE Payload', 'Call Image Prompt Engineer', 'Split Image URLs'];
const missing = newNodes.filter(n => !nodeNames.includes(n));
if (missing.length > 0) {
  console.error('\nERROR: New nodes missing:', missing);
  process.exit(1);
}

// Verify fal.ai nodes still exist
const falNodes = ['fal-post', 'Wait2', 'fal-render'];
const missingFal = falNodes.filter(n => !nodeNames.includes(n));
if (missingFal.length > 0) {
  console.error('\nERROR: fal.ai nodes missing:', missingFal);
  process.exit(1);
}

console.log('\nAll checks passed. Import this workflow into n8n.');
console.log('NOTE: Create "OpenAI Bearer" HTTP Header Auth credential first:');
console.log('  - Name: OpenAI Bearer');
console.log('  - Header Name: Authorization');
console.log('  - Header Value: Bearer sk-proj-...');
