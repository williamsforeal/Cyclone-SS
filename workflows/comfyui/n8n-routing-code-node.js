/**
 * n8n Code Node: Route & Build ComfyUI Payload
 *
 * POSITION: Inside the "Loop Over Items" node, replacing the old "Build ComfyUI Payload" node.
 *
 * INPUTS expected on $json:
 *   - cleanPrompt / prompt   → scene description (from Vertex/GPT Creative Director)
 *   - adType / Ad_Type       → Airtable field: "Before/After", "Comparison", "Testimonial", etc.
 *   - angle / Angle          → Airtable field: "Pain", "Us vs Them", "Transformation", etc.
 *   - avatar / Avatar        → Airtable field: "Desk Workers", "Women 45+", "Gamers", etc.
 *   - conceptId              → "A", "B", or "C" (from Splitter node)
 *   - recordId               → Airtable record ID (for filename prefix + writeback)
 *   - headline               → Ad headline (preserved for Airtable writeback)
 *   - cta                    → CTA text (preserved for Airtable writeback)
 *   - productImageUrl        → S3 URL of PalmAura product photo (for BannerBear compositing)
 *
 * OUTPUT: $json with comfyui_payload ready to POST to localhost:8188/api/prompt
 *
 * ROUTING LOGIC:
 *   B (DTC Static)    → Comparison, Before/After, Benefits Wheel | Us vs Them, Cost, Science, Social Proof
 *   C (StoryBrand)    → Testimonial | Transformation, Gift, Identity | Women 45+, Hobbyists, Gift Buyers
 *   A (Realistic)     → Everything else (default — Pain angle, Desk Workers, Gamers, etc.)
 */

const scenePrompt = $json.cleanPrompt || $json.prompt || '';
const adType  = ($json.adType  || $json.Ad_Type || '').toLowerCase().trim();
const angle   = ($json.angle   || $json.Angle   || '').toLowerCase().trim();
const avatar  = ($json.avatar  || $json.Avatar  || '').toLowerCase().trim();
const conceptId = $json.conceptId || 'A';
const seed = Math.floor(Math.random() * 2147483647);

// ─────────────────────────────────────────────────────────────────
// ROUTING: Read ad concept data → select visual style variant
// ─────────────────────────────────────────────────────────────────

const dtcAdTypes  = ['comparison', 'before/after', 'benefits wheel'];
const dtcAngles   = ['us vs them', 'cost', 'science', 'social proof'];

const storyAdTypes  = ['testimonial'];
const storyAngles   = ['transformation', 'gift', 'identity'];
const storyAvatars  = ['women 45+', 'hobbyists', 'gift buyers'];

let variant;
if (dtcAdTypes.includes(adType) || dtcAngles.includes(angle)) {
  variant = 'B'; // DTC Static — graphic, high contrast, clean
} else if (storyAdTypes.includes(adType) || storyAngles.includes(angle) || storyAvatars.includes(avatar)) {
  variant = 'C'; // StoryBrand — cinematic, emotional, golden hour
} else {
  variant = 'A'; // Realistic Lifestyle — default, editorial photography
}

// ─────────────────────────────────────────────────────────────────
// VARIANT CONFIGS — matches the 3 workflow JSON files
// ─────────────────────────────────────────────────────────────────

const variants = {
  A: {
    styleSuffix: 'editorial lifestyle photography, warm natural light, authentic environment, shallow depth of field, 35mm film quality, genuine candid moment, Canon EOS R5 aesthetic',
    negative:    'text, words, letters, numbers, logos, watermarks, typography, overlay, captions, massager, device, product, PalmAura, electronic gadget, blurry, low quality, distorted, deformed, artificial studio lighting, overexposed, oversaturated, CGI, fake, render, 3D',
    steps: 28, cfg: 3.5, sampler: 'euler', scheduler: 'normal'
  },
  B: {
    styleSuffix: 'clean DTC advertisement aesthetic, commercial photography, high contrast, strong composition, generous negative space in lower third for text overlay, professional studio lighting, crisp sharp edges, minimal design, graphic clarity, brand campaign aesthetic',
    negative:    'text, words, letters, logos, watermarks, typography, overlay, captions, massager, device, product, PalmAura, people, faces, hands, blurry, bokeh, film grain, natural imperfections, warm soft tones, lo-fi aesthetic, messy, cluttered, low quality, distorted, deformed',
    steps: 25, cfg: 5.0, sampler: 'dpmpp_2m', scheduler: 'karras'
  },
  C: {
    styleSuffix: 'cinematic storytelling photography, warm emotional lighting, golden hour atmosphere, documentary photography style, hope and transformation narrative, intimate quiet moment, soft bokeh background, nostalgic warmth, quiet determination, Leica M10 aesthetic',
    negative:    'text, words, letters, logos, watermarks, typography, overlay, captions, massager, device, product, PalmAura, electronic, cold tones, clinical, sterile, harsh lighting, high contrast, graphic design, minimalist, artificial, over-processed, CGI, fake, blurry, low quality, distorted, deformed',
    steps: 26, cfg: 3.0, sampler: 'euler_ancestral', scheduler: 'normal'
  }
};

const config = variants[variant];
const fullPrompt = scenePrompt.trim() + ', ' + config.styleSuffix;

// ─────────────────────────────────────────────────────────────────
// BUILD COMFYUI NODE GRAPH (API format)
// Node IDs: 1=Checkpoint, 2=Positive, 3=Negative, 4=Latent, 5=KSampler, 6=VAEDecode, 7=Save
// ─────────────────────────────────────────────────────────────────

const workflowNodes = {
  "1": {
    "class_type": "CheckpointLoaderSimple",
    "inputs": { "ckpt_name": "flux1-dev-fp8.safetensors" }
  },
  "2": {
    "class_type": "CLIPTextEncode",
    "inputs": { "text": fullPrompt, "clip": ["1", 1] }
  },
  "3": {
    "class_type": "CLIPTextEncode",
    "inputs": { "text": config.negative, "clip": ["1", 1] }
  },
  "4": {
    "class_type": "EmptyLatentImage",
    "inputs": { "width": 1024, "height": 1280, "batch_size": 1 }
  },
  "5": {
    "class_type": "KSampler",
    "inputs": {
      "seed":         seed,
      "steps":        config.steps,
      "cfg":          config.cfg,
      "sampler_name": config.sampler,
      "scheduler":    config.scheduler,
      "denoise":      1.0,
      "model":        ["1", 0],
      "positive":     ["2", 0],
      "negative":     ["3", 0],
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
      "filename_prefix": `palmaura_${variant}_${conceptId}_${$json.recordId || 'x'}`,
      "images": ["6", 0]
    }
  }
};

const clientId = `n8n-${variant}-${conceptId}-${Date.now()}`;

return [{
  json: {
    // ComfyUI API payload — POST this to localhost:8188/api/prompt
    comfyui_payload: {
      prompt: workflowNodes,
      client_id: clientId
    },
    // Metadata for downstream nodes
    client_id:        clientId,
    variant:          variant,         // "A" | "B" | "C"
    conceptId:        conceptId,
    seed:             seed,
    fullPrompt:       fullPrompt,      // Full prompt sent to ComfyUI (for debugging)
    originalPrompt:   scenePrompt,
    // Preserved for Airtable writeback
    recordId:         $json.recordId        || '',
    headline:         $json.headline        || '',
    cta:              $json.cta             || '',
    productImageUrl:  $json.productImageUrl || '',
    adType:           adType,
    angle:            angle,
    avatar:           avatar
  }
}];
