/**
 * Static Scaler v3 Upgrade Script
 * Applies all changes from workflows/static-scaler-v3-upgrade-guide.md
 *
 * Run: node scripts/apply-v3-upgrade.js
 */

const fs = require('fs');
const path = require('path');

const WORKFLOW_PATH = path.join(__dirname, '..', 'workflows', 'static-scaler-v3.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'workflows', 'static-scaler-v3-upgraded.json');

// Read the workflow
const raw = fs.readFileSync(WORKFLOW_PATH, 'utf8');
const workflow = JSON.parse(raw);

// Helper: find node by name
function findNode(name) {
  return workflow.nodes.find(n => n.name === name);
}

// Helper: find connection by source node name
function findConnectionFrom(sourceName) {
  return workflow.connections[sourceName];
}

console.log(`Loaded workflow: ${workflow.name}`);
console.log(`Total nodes: ${workflow.nodes.length}`);
console.log('---');

// ============================================================
// 1. MODIFY: Message a model1 → Creative Director
// ============================================================
console.log('1. Updating Message a model1 → Creative Director...');

const creativeDirector = findNode('Message a model1');
if (!creativeDirector) throw new Error('Node "Message a model1" not found');

// Read the creative director prompt
const cdPromptPath = path.join(__dirname, '..', 'prompts', 'creative-director.md');
const cdPromptRaw = fs.readFileSync(cdPromptPath, 'utf8');
// Strip the header comments (lines starting with #)
const cdPromptLines = cdPromptRaw.split('\n');
const cdPromptStart = cdPromptLines.findIndex((line, i) => i > 0 && !line.startsWith('#') && line.trim() !== '');
const cdSystemPrompt = cdPromptLines.slice(cdPromptStart > 0 ? cdPromptStart : 3).join('\n').trim();

creativeDirector.parameters.messages = {
  values: [
    {
      content: cdSystemPrompt,
      role: "system"
    },
    {
      content: `Here is the product and ad context. Generate 3 ad concepts.

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
Record ID: {{ $json.recordId }}`,
      role: "user"
    }
  ]
};

// Update model settings
creativeDirector.parameters.model = {
  __rl: true,
  value: "chatgpt-4o-latest",
  mode: "list"
};
creativeDirector.parameters.options = {
  temperature: 0.8,
  maxTokens: 3000
};

console.log('   ✓ System prompt updated to Creative Director');
console.log('   ✓ User message updated with context fields');
console.log('   ✓ Temperature: 0.8, Max Tokens: 3000');

// ============================================================
// 2. MODIFY: Code in JavaScript1 → Parse Creative Director Output
// ============================================================
console.log('2. Updating Code in JavaScript1 → Parse Creative Director Output...');

const parseConceptsNode = findNode('Code in JavaScript1');
if (!parseConceptsNode) throw new Error('Node "Code in JavaScript1" not found');

parseConceptsNode.parameters.jsCode = `// Parse Creative Director JSON output from OpenAI
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
  text = text.replace(/\`\`\`json\\s*/gi, '').replace(/\`\`\`\\s*/g, '').trim();

  // Find the JSON array
  const arrayMatch = text.match(/\\[[\\s\\S]*\\]/);
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

return results;`;

console.log('   ✓ Parser rewritten for new 3-concept JSON array format');

// ============================================================
// 3. MODIFY: Code in JavaScript4 → Split Into 3 Items
// ============================================================
console.log('3. Updating Code in JavaScript4 → Split Into 3 Items...');

const splitterNode = findNode('Code in JavaScript4');
if (!splitterNode) throw new Error('Node "Code in JavaScript4" not found');

splitterNode.parameters.jsCode = `// Split 3 concepts into individual items for the loop
// Each item carries its concept data + the product image URL
const items = $input.all();
const results = [];

// Get productImageUrl from upstream (preserved through the chain)
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

return results;`;

console.log('   ✓ Splitter rewritten for 3-concept format with upstream context');

// ============================================================
// 4. ADD: Image Prompt Engineer (new OpenAI node)
// ============================================================
console.log('4. Adding Image Prompt Engineer node...');

const ipPromptPath = path.join(__dirname, '..', 'prompts', 'image-prompt-engineer.md');
const ipPromptRaw = fs.readFileSync(ipPromptPath, 'utf8');
const ipPromptLines = ipPromptRaw.split('\n');
const ipPromptStart = ipPromptLines.findIndex((line, i) => i > 0 && !line.startsWith('#') && line.trim() !== '');
const ipSystemPrompt = ipPromptLines.slice(ipPromptStart > 0 ? ipPromptStart : 3).join('\n').trim();

// Position it near fal-post but shifted left
const falPostNode = findNode('fal-post');
const loopNode = findNode('Loop Over Items3');

const imagePromptEngineer = {
  parameters: {
    model: {
      __rl: true,
      value: "gpt-4o-mini",
      mode: "list"
    },
    messages: {
      values: [
        {
          content: ipSystemPrompt,
          role: "system"
        },
        {
          content: `Convert this visual direction into a fal.ai image prompt.

Visual Direction:
{{ JSON.stringify($json.visualDirection) }}

Product Image URL: {{ $json.productImageUrl }}
Style: {{ $json.style }}`,
          role: "user"
        }
      ]
    },
    options: {
      temperature: 0.4,
      maxTokens: 500
    },
    simplifyOutput: false
  },
  type: "@n8n/n8n-nodes-langchain.openAi",
  typeVersion: 2.1,
  position: [
    falPostNode ? falPostNode.position[0] - 400 : 2400,
    falPostNode ? falPostNode.position[1] : 800
  ],
  id: "img-prompt-engineer-001",
  name: "Image Prompt Engineer",
  credentials: creativeDirector.credentials // same OpenAI creds
};

workflow.nodes.push(imagePromptEngineer);
console.log('   ✓ Image Prompt Engineer node added (GPT-4o-mini, temp 0.4)');

// ============================================================
// 5. ADD: Parse Prompt (new Code node)
// ============================================================
console.log('5. Adding Parse Prompt node...');

const parsePrompt = {
  parameters: {
    jsCode: `// Parse Image Prompt Engineer output and prepare fal.ai payload
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
  text = text.replace(/\`\`\`json\\s*/gi, '').replace(/\`\`\`\\s*/g, '').trim();

  let promptData;
  try {
    // Find JSON object in text
    const objMatch = text.match(/\\{[\\s\\S]*\\}/);
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

return results;`,
    mode: "runOnceForAllItems"
  },
  type: "n8n-nodes-base.code",
  typeVersion: 2,
  position: [
    falPostNode ? falPostNode.position[0] - 200 : 2600,
    falPostNode ? falPostNode.position[1] : 800
  ],
  id: "parse-prompt-001",
  name: "Parse Prompt"
};

workflow.nodes.push(parsePrompt);
console.log('   ✓ Parse Prompt node added');

// ============================================================
// 6. MODIFY: fal-post → updated body with strength + negative prompt
// ============================================================
console.log('6. Updating fal-post body...');

if (!falPostNode) throw new Error('Node "fal-post" not found');

// Find the body parameter and update it
if (falPostNode.parameters.sendBody !== false) {
  falPostNode.parameters.sendBody = true;
}
falPostNode.parameters.specifyBody = "json";
falPostNode.parameters.jsonBody = `{
  "prompt": "={{ $json.prompt }}",
  "image_url": "={{ $json.productImageUrl }}",
  "negative_prompt": "={{ $json.negativePrompt }}",
  "num_images": 1,
  "image_size": "square_hd",
  "strength": {{ $json.strength }},
  "num_inference_steps": 28,
  "guidance_scale": 3.5
}`;

console.log('   ✓ fal-post body updated with strength, negative_prompt, guidance_scale');

// ============================================================
// 7. MODIFY: Aggregate → fix field configuration
// ============================================================
console.log('7. Fixing Aggregate node...');

const aggregateNode = findNode('Aggregate');
if (!aggregateNode) throw new Error('Node "Aggregate" not found');

aggregateNode.parameters = {
  aggregate: "aggregateAllItemData",
  options: {
    outputField: "data"
  }
};

console.log('   ✓ Aggregate set to "All Item Data" with output field "data"');

// ============================================================
// 8. MODIFY: Format Image Data → updated field mapping
// ============================================================
console.log('8. Updating Format Image Data...');

const formatNode = findNode('Format Image Data');
if (!formatNode) throw new Error('Node "Format Image Data" not found');

formatNode.parameters.jsCode = `// Format aggregated image data for Airtable
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
output['Ad Sets'] = \`Generated \${imageUrls.length} variants\`;
output['Prompt Used'] = prompts.join(' | ');

// Get record ID from upstream
const contextData = $('image-prompt-context').first().json;
output.recordId = contextData?.recordId || '';

return [{ json: output }];`;

console.log('   ✓ Format Image Data rewritten for A/B/C mapping');

// ============================================================
// 9. MODIFY: Upload a file → change S3 path
// ============================================================
console.log('9. Updating Upload a file S3 path...');

const uploadNode = findNode('Upload a file');
if (!uploadNode) throw new Error('Node "Upload a file" not found');

if (uploadNode.parameters.fileName) {
  uploadNode.parameters.fileName = 'ad-phase1-product-bckgrnd/{{ $json.id }}.jpg';
  console.log('   ✓ S3 path changed to ad-phase1-product-bckgrnd/');
} else {
  // Try additionalFields
  if (uploadNode.parameters.additionalFields && uploadNode.parameters.additionalFields.fileName) {
    uploadNode.parameters.additionalFields.fileName = 'ad-phase1-product-bckgrnd/{{ $json.id }}.jpg';
    console.log('   ✓ S3 path changed to ad-phase1-product-bckgrnd/');
  } else {
    console.log('   ⚠ Could not find fileName parameter — check manually');
  }
}

// ============================================================
// 10. REWIRE CONNECTIONS: Insert new nodes into the loop
// ============================================================
console.log('10. Rewiring connections...');

// The current flow inside the loop is:
//   Loop Over Items3 [output 0] → fal-post → Wait2 → fal-render → Loop Over Items3
//
// New flow:
//   Loop Over Items3 [output 0] → Image Prompt Engineer → Parse Prompt → fal-post → Wait2 → fal-render → Loop Over Items3

// Find existing connection from Loop Over Items3 output 0
const loopConnections = workflow.connections['Loop Over Items3'];
if (loopConnections && loopConnections.main) {
  // Output 0 (each item) currently goes to fal-post
  // Change it to go to Image Prompt Engineer instead
  const output0 = loopConnections.main[1]; // index 1 is "each item" output in splitInBatches
  if (output0) {
    // Save original target (should be fal-post)
    const originalTarget = JSON.parse(JSON.stringify(output0));
    console.log(`   Current Loop output[1] target: ${originalTarget[0]?.node || 'unknown'}`);

    // Redirect Loop → Image Prompt Engineer
    loopConnections.main[1] = [{
      node: "Image Prompt Engineer",
      type: "main",
      index: 0
    }];
    console.log('   ✓ Loop Over Items3 [each] → Image Prompt Engineer');
  }
}

// Add connection: Image Prompt Engineer → Parse Prompt
workflow.connections['Image Prompt Engineer'] = {
  main: [[{
    node: "Parse Prompt",
    type: "main",
    index: 0
  }]]
};
console.log('   ✓ Image Prompt Engineer → Parse Prompt');

// Add connection: Parse Prompt → fal-post
workflow.connections['Parse Prompt'] = {
  main: [[{
    node: "fal-post",
    type: "main",
    index: 0
  }]]
};
console.log('   ✓ Parse Prompt → fal-post');

// fal-post → Wait2 → fal-render → Loop: these stay the same
console.log('   ✓ fal-post → Wait2 → fal-render → Loop (unchanged)');

// ============================================================
// WRITE OUTPUT
// ============================================================
console.log('---');

// Update workflow meta
workflow.name = workflow.name + ' (v3.1 Upgraded)';

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(workflow, null, 2), 'utf8');
console.log(`\n✅ Upgraded workflow saved to: ${OUTPUT_PATH}`);
console.log(`   Nodes: ${workflow.nodes.length} (was ${workflow.nodes.length - 2}, added 2 new)`);
console.log('\nNext steps:');
console.log('  1. Review the upgraded workflow JSON');
console.log('  2. Import with: /import-workflow workflows/static-scaler-v3-upgraded.json');
console.log('  3. Fix Webhook to POST in n8n UI');
console.log('  4. Fix Merge node to "Merge by Key" on recordId in n8n UI');
console.log('  5. Configure OpenAI credentials for Image Prompt Engineer node');
