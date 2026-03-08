# Plan: Product-Agnostic Creative Intelligence Engine — Phase 1

## Context

Jake is building a **product-agnostic ad creative engine** — not just a PalmAura ad generator. The PalmAura campaign data, avatar research, and winning ad analysis are the *training material* that proves the frameworks work. The system should apply those same principles to any product plugged into it.

### What Exists Today
- **Static Scaler v3 workflow** in n8n with GPT-4o Creative Director (basic prompt, no knowledge base)
- **fal.ai Flux Dev** for image generation (treats product as style reference → destroys product identity)
- **ComfyUI running locally** at localhost:8188 with Gemini 2.5 Pro node doing image analysis
- **Google Vertex Chat Model** node in n8n wired to Gemini 2.5 Flash (raw model, no custom instructions)
- **BOMB ECOM OS dashboard** — 1 product, 64 ad concepts, 6 avatars, 30 generated images
- **AWS SageMaker** with `palm_aura_ad_copy` table + `static-scaler-v2` S3 bucket
- **Existing prompts**: `prompts/creative-director.md` (GPT-4o) and `prompts/image-prompt-engineer.md` (scene descriptions)
- **Knowledge base README** written but `vertex-knowledge-base/` folder does NOT exist yet

### What's Wrong
1. Creative Director has no knowledge base — just a basic system prompt with product facts
2. Image generation destroys product identity (fal.ai style transfer, not compositing)
3. No closed loop — winning ad analysis doesn't feed back into generation
4. System is PalmAura-hardcoded, not product-agnostic
5. No compliance filtering, no QA step
6. The Google Vertex Chat Model node is just a raw Gemini connection — no intelligence baked in

### What Jake Wants
A "fine-tuned machine" where:
- The **frameworks** (Schwartz, Ogilvy, Cashvertising, Motion Methodology, StoryBrand) are permanent intelligence
- **Product data** (specs, avatars, UMP/UMS, beliefs, competitors) is swappable input
- **Winning ad analysis** (ComfyUI Gemini node) feeds Learned Concepts back into the Creative Director
- **Visual direction** (the IPE script) is a formal pipeline step, not an afterthought
- Quality is consistent enough to scale across products

---

## Architecture Decision

**n8n-native multi-step pipeline with Gemini 2.5 Flash via Google Vertex Chat Model.**

Why NOT Vertex AI Agent Builder:
- The knowledge base is ~78KB (11 files) — fits easily in Gemini's 1M token context window
- No need for RAG/Data Store/Vector Search at this data volume
- n8n gives full control over each pipeline step (debug, iterate, swap nodes)
- The Google Vertex Chat Model node is already wired and authenticated
- Agent Builder adds GCP infra complexity without clear benefit at this scale

Why NOT fine-tuning:
- The frameworks are explicit rules, not implicit patterns — they work better as system prompt instructions than as fine-tuning data
- Fine-tuning Gemini is expensive and locks you to one model version
- The same quality can be achieved with a comprehensive system prompt + structured knowledge injection

**The "fine-tuned machine" = richly structured system prompts + comprehensive knowledge base injected at runtime.**

---

## Step 1: Create Two-Tier Knowledge Base

The key insight: split **universal frameworks** (never changes) from **product-specific data** (swappable per product).

### Tier 1: Universal Frameworks (`knowledge-base/frameworks/`)
These files encode the creative principles that work for ANY product.

```
knowledge-base/frameworks/
├── schwartz-awareness-stages.md     # 5 stages + how to write for each
├── ogilvy-visual-principles.md      # Simplicity, one idea per ad, headlines sell
├── cashvertising-triggers.json      # 8 Life Forces, 17 Foundational Triggers
├── motion-methodology.md            # Diagnosis → Learned Concept → Ad Family scaling
├── storybrand-structure.md          # Character/Problem/Guide/Plan/Success framework
├── copy-formulas.md                 # PAS, AIDA, BAB, Us vs Them templates + hook library
├── static-visual-matrix.md          # X-Ray Agitation, Waffle Mark, Comparison, Identity Mirror
├── compliance-rules.json            # Universal DTC compliance (FTC, medical claims, etc.)
└── scene-generation-rules.md        # <80 words, no text, no product, decoupled visuals
```

### Tier 2: Product-Specific Data (`knowledge-base/products/palmaura/`)
These files are swapped when you launch a new product.

```
knowledge-base/products/palmaura/
├── product-specs.md                 # 4 temp modes, USB-C, cordless, 10-20min sessions
├── ump-ums.md                       # Hand Stress Loop → Adaptive 360° Warm Compression
├── beliefs.json                     # The 6-belief installation sequence (product-specific instances)
├── offer-stack.md                   # Device + 3 Digital Guides, 60-day guarantee
├── tone-guidelines.md               # Brand-specific voice (calm, clinical-clean, Arrae/Seed aesthetic)
├── avatars/
│   ├── desk-warrior.md              # 25-45 remote workers, RSI, keyboard pain
│   ├── stubborn-provider.md         # 35-55 manual labor, won't admit pain
│   ├── aging-independent.md         # 55+ women, arthritis, independence fears
│   └── creator-gamer.md            # 18-35 gamers/creators, repetitive strain
├── competitors/
│   └── competitor-analysis.md       # Lunix, Breo, Comfier, Bob & Brad teardowns
└── winning-ads/
    └── learned-concepts.json        # Extracted from winning ad analysis (Mode 3 output)
```

### Why This Split Matters
When Jake launches Product #2, he:
1. Creates `knowledge-base/products/product2/` with that product's data
2. The frameworks folder stays identical
3. The system prompt assembles: frameworks + product data at runtime
4. Same quality engine, new product

**Source material for writing these files:**
- [prompts/creative-director.md](prompts/creative-director.md) — product specs, beliefs, segments, rules
- [prompts/image-prompt-engineer.md](prompts/image-prompt-engineer.md) — visual rules, style targets
- Phase 1 Execution Playbook Sections 2.2-2.4 — detailed content for every file
- Existing knowledge base README — file structure (adapt to two-tier split)

---

## Step 2: Build the Multi-Step System Prompts

Each pipeline step gets its own system prompt. The prompts are assembled at runtime by injecting the relevant knowledge base sections.

### 2a. Creative Director Prompt (Mode 1)

**Role:** Generate structured Ad Card JSON from product + avatar + angle input.

**Prompt structure:**
```
[UNIVERSAL FRAMEWORKS — injected from Tier 1]
- Schwartz awareness stages
- Ogilvy principles
- Cashvertising triggers
- Visual framework (X-Ray, Waffle, Comparison, Identity Mirror)
- Copy formulas

[PRODUCT CONTEXT — injected from Tier 2 at runtime]
- Product specs, UMP/UMS, beliefs, offer stack
- Selected avatar profile (one per call)
- Brand tone guidelines
- Compliance rules (banned + approved terms)

[OPERATING RULES — from playbook Section 2.4]
- Single-mindedness: 1 ad = 1 avatar = 1 awareness = 1 trigger
- UMP→UMS bridge always
- Decoupled visuals (no product in scene description)
- Structured JSON output only

[OUTPUT SCHEMA — the Ad Card JSON]
```

**Output:** Ad Card JSON matching playbook Section 2.5 Mode 1 schema (conceptId, segment, angle, awarenessLevel, beliefsReinforced, visualDirection, adCopy, style)

**File to create:** `prompts/creative-director-v2.md`

### 2b. Image Prompt Engineer Prompt (Mode 2)

**Role:** Convert `visualDirection` from Creative Director into a scene_description for image generation.

**Prompt structure:**
```
[SCENE GENERATION RULES — from Tier 1 scene-generation-rules.md]
- NEVER include text, product, logos
- Under 80 words
- Match scene style to ad concept (lifestyle/product-hero/emotional-story/comparison)

[VISUAL MATRIX — from Tier 1 static-visual-matrix.md]
- Which visual framework applies (X-Ray, Waffle, Comparison, Identity Mirror)

[BRAND AESTHETIC — from Tier 2 tone-guidelines.md]
- Color palette, lighting style, mood targets

[INPUT: visualDirection object from Creative Director]
[OUTPUT: scene_description + negative_prompt + dimensions]
```

**File to create:** `prompts/image-prompt-engineer-v2.md`

### 2c. Creative Diagnosis Prompt (Mode 3 — the closed loop)

**Role:** Analyze winning ads and extract Learned Concepts that feed back into the Creative Director.

This is what the ComfyUI Gemini 2.5 Pro node is already doing in your screenshots. The prompt needs to be formalized.

**Prompt structure:**
```
[ANALYSIS FRAMEWORKS — from Tier 1]
- Motion Methodology (Diagnosis framework)
- Schwartz awareness stages (classify the ad)
- Cashvertising triggers (identify which ones fire)
- Visual matrix (classify the visual approach)

[INPUT: winning ad image + copy + performance data (ROAS, CTR)]
[OUTPUT: Learned Concept JSON — playbook Section 2.5 Mode 3 schema]
```

**Output:** `learned_concept`, `psychological_trigger`, `awareness_stage`, `scaling_potential`, `ad_family_brief`

**File to create:** `prompts/creative-diagnosis.md`

### 2d. Compliance Filter (Code node, not LLM)

**Regex guards from playbook Part 5:**
- Guard 1: Product term detection in scene descriptions
- Guard 2: Text/typography term detection
- Guard 3: JSON parse safety with fallback extraction
- Medical claim term blacklist

**File to create:** `prompts/compliance-filter.js`

### 2e. QA Check Prompt (Mode 4)

**Role:** Score generated output against quality criteria before Airtable write.

**File to create:** `prompts/qa-check.md`

---

## Step 3: ComfyUI Integration (Replace fal.ai)

Based on playbook Part 1. The two-stage generation strategy is correct:
- **Stage 1:** ComfyUI generates scene background (no product)
- **Stage 2:** BannerBear composites real product photo onto scene

### n8n Nodes to Build

1. **Build ComfyUI Payload** — Code node, takes scene_description, builds ComfyUI API JSON
   - Source: playbook Section 1.1 (the code is ready to use with minor adjustments)
   - Uses: `flux1-dev-fp8.safetensors`, 1024x1280, euler sampler
   - CFG needs testing: playbook says 3.5, existing guide says 7.5

2. **POST to ComfyUI** — HTTP Request, `POST http://127.0.0.1:8188/prompt`

3. **Poll ComfyUI History** — Code node, polls `/history/{prompt_id}`
   - Source: playbook Section 1.3

4. **Get ComfyUI Image** — HTTP Request, `GET http://127.0.0.1:8188/view?filename=X`, binary response

5. **ComfyUI Health Check** — Code node, checks `/system_stats`, falls back to fal.ai if down

### Key files:
- [workflows/comfyui/COMFYUI-INTEGRATION-GUIDE.md](workflows/comfyui/COMFYUI-INTEGRATION-GUIDE.md) — existing reference
- [workflows/comfyui/vertex-to-comfyui-batch.json](workflows/comfyui/vertex-to-comfyui-batch.json) — batch workflow template

---

## Step 4: Wire the Full Pipeline

### New workflow: `static-scaler-v4.json`

```
[KEEP AS-IS]
Webhook → Get Ad Copy (Airtable) → Classify Ad Type → Update Ad Type
  → Get Product Record → Extract Product Image URL
  → get-binary-pa (download) → upload-image (S3)
  → Merge (Ad Copy + S3 URL) → image-prompt-context

[STEP 1: CREATIVE DIRECTOR — new]
  → Assemble System Prompt (Code node: load frameworks + product KB)
  → AI Agent + Google Vertex Chat Model (Gemini 2.5 Flash)
  → JSON Parse Safety (Code node — Guard 3)
  → Compliance Regex Filter (Code node — Guards 1+2+medical)

[STEP 2: IMAGE PROMPT ENGINEER — new]
  → AI Agent + Google Vertex Chat Model (IPE system prompt)
  → Product Term Filter (Code node — rejects product mentions in scene desc)

[STEP 3: IMAGE GENERATION — replace fal.ai]
  → Splitter (A/B/C variants from Creative Director)
  → Loop Over Items
    → ComfyUI Health Check (fallback: fal.ai)
    → Build ComfyUI Payload
    → POST to ComfyUI
    → Wait 45-60s
    → Poll ComfyUI History
    → Get ComfyUI Image (binary)

[STEP 4: OUTPUT — keep with modifications]
  → Aggregate
  → Format Image Data (modified for ComfyUI output — playbook Section 3.4)
  → Create Ad URLs → Upload to Airtable (Images table)
```

### What changes from v3:
| Old | New | Why |
|-----|-----|-----|
| GPT-4o (Message a model1) | AI Agent + Gemini 2.5 Flash + KB prompt | Grounded, product-agnostic |
| Single prompt | Two-step (Creative Director → IPE) | Decoupled visual direction |
| fal-post → Wait 30s → fal-render | ComfyUI payload → POST → Poll → Download | Local generation, no product mutation |
| No guards | 4 guard nodes (compliance, JSON, product terms, health check) | Quality enforcement |

---

## Step 5: Creative Diagnosis Loop (Mode 3)

This is a SEPARATE workflow (not part of Static Scaler) that feeds the engine:

```
[TRIGGER] Manual or scheduled — feed winning ad images
  → Load Image (from Airtable or file)
  → ComfyUI Gemini 2.5 Pro node (image analysis)
    System prompt: creative-diagnosis.md
  → Extract Learned Concept JSON
  → Append to knowledge-base/products/palmaura/winning-ads/learned-concepts.json
  → Update Airtable (Ad Concepts table — learned_concept field)
```

This closes the loop: winning ads → analysis → Learned Concepts → feed back into Creative Director knowledge base → better ads.

**Not building this in Phase 1** — but the knowledge base structure accounts for it (`winning-ads/learned-concepts.json`), and the Creative Diagnosis prompt (Mode 3) will be written.

---

## Execution Order

### Phase A: Knowledge Base + Prompts (immediate, no dependencies)
1. Create `knowledge-base/frameworks/` — 9 universal framework files
2. Create `knowledge-base/products/palmaura/` — product-specific files + 4 avatar files + competitors
3. Write `prompts/creative-director-v2.md` — upgraded with full KB injection pattern
4. Write `prompts/image-prompt-engineer-v2.md` — with visual matrix rules
5. Write `prompts/creative-diagnosis.md` — Mode 3 for the analysis loop
6. Write `prompts/compliance-filter.js` — regex guards
7. Write `prompts/qa-check.md` — QA scoring prompt

### Phase B: ComfyUI Integration (requires ComfyUI running at localhost:8188)
1. Test ComfyUI API manually (`curl POST /prompt`, `GET /history`, `GET /view`)
2. Build 5 n8n code snippets (payload builder, poster, poller, downloader, health check)
3. Test single image generation: scene description → ComfyUI → image file

### Phase C: Workflow Assembly (requires Phase A + B)
1. Create `workflows/static-scaler-v4.json` based on v3 structure
2. Replace Creative Director node → AI Agent + Vertex Chat Model + v2 prompt
3. Add IPE step after Creative Director
4. Replace fal.ai loop → ComfyUI loop
5. Add guard nodes (compliance, JSON parse, product term filter)
6. Modify Format Image Data for ComfyUI output format
7. Test full pipeline: one Ad Copy record → Airtable Images table

### Phase D: Creative Diagnosis (future — after pipeline is stable)
1. Formalize ComfyUI Gemini analysis workflow
2. Write Learned Concepts back to knowledge base
3. Close the loop

---

## Verification

1. **Knowledge base**: Two-tier structure exists, all files have content + metadata headers
2. **Creative Director**: Given avatar + angle → returns valid Ad Card JSON, zero banned terms, single-minded
3. **Image Prompt Engineer**: Given visualDirection → returns <80 word scene_description, zero product/text mentions
4. **Compliance filter**: Catches "cure"/"heal"/"treat" in copy, catches "massager"/"PalmAura" in scene descriptions
5. **ComfyUI generation**: Scene description → 1024x1280 clean scene image (no product, no text artifacts)
6. **Full pipeline**: Webhook trigger → image appears in Airtable Images table with correct field mapping
7. **Product-agnostic test**: Swap product KB folder → system generates coherent ads for new product (manual verification)

---

## Files Changed/Created Summary

### New directories:
- `knowledge-base/frameworks/` (9 files)
- `knowledge-base/products/palmaura/` (5 files + `avatars/` 4 files + `competitors/` 1 file + `winning-ads/` 1 file)

### New prompts:
- `prompts/creative-director-v2.md`
- `prompts/image-prompt-engineer-v2.md`
- `prompts/creative-diagnosis.md`
- `prompts/compliance-filter.js`
- `prompts/qa-check.md`

### New workflow:
- `workflows/static-scaler-v4.json`

### Existing files preserved (not deleted):
- `prompts/creative-director.md` (v1 — kept for reference)
- `prompts/image-prompt-engineer.md` (v1 — kept for reference)
- `workflows/static-scaler-v3*.json` (all variants — kept as fallback)
