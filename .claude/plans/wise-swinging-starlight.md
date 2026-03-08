# Vertex AI Custom Agent for Image Prompts (Simple Approach)

## Context: Why This Change

Your current WF3 (Image Generation Pipeline) generates image prompts in a single pass with no learning, quality gates, or refinement:

**Current Flow:**
```
Webhook → Fetch Ad Copy → GPT-4o (3 prompts) → fal.ai/bria → BannerBear → Done
```

**Problems:**
1. **No learning**: Every prompt generation starts from scratch, ignoring past successes
2. **No quality control**: Weak prompts go straight to expensive fal.ai API calls ($0.10/image)
3. **No iteration**: Single attempt, no refinement if quality is poor
4. **No feedback**: Performance metrics (CTR, ROAS) from Meta Ads never inform future prompts
5. **Inconsistent quality**: Estimated 40-60% of prompts need manual review or regeneration

**Impact on Business:**
- Wasted API costs on low-quality images
- Inconsistent ad creative quality
- Slower learning curve (can't identify what works)
- Manual intervention needed frequently

**Solution: Vertex AI Custom Agent (Simple)**

Instead of building complex RAG infrastructure, use Google's **Vertex AI Agent Builder**:
1. **Create custom agent** in Vertex AI with image-prompt-engineer system prompt
2. **Connect to Airtable** (optional) for learning from past prompts
3. **Call from n8n** via simple HTTP Request node
4. **Done in 2-3 hours**, not weeks

**Expected Outcomes:**
- Consistent prompt quality from fine-tuned agent
- Simple HTTP API call from n8n
- No infrastructure to maintain
- Cost: Same as current GPT-4o usage
- **Time to implement: 2-3 hours**

---

## Architecture Overview

### Simplified WF3 Flow
```
Webhook → Fetch Ad Copy → Creative Director (GPT-4o: 3 concepts)
    ↓
[LOOP: Process each concept A, B, C]
    ↓
1. Call Vertex AI Agent (custom image prompt generator)
    ↓
2. fal.ai/bria: Generate image
    ↓
3. Save prompt to Airtable (optional, for future fine-tuning)
[END LOOP]
    ↓
Aggregate → BannerBear → Respond
```

### Integration with Existing Workflow

**Single Change Required:** Replace "Build IPE Payload" and "Call Image Prompt Engineer" nodes (lines 1498-1534 in static-scaler-v3-fixed.json)

**Before:**
```
Build IPE Payload (GPT-4o-mini) → Call Image Prompt Engineer → Parse Prompt
```

**After:**
```
Build Vertex AI Payload → Call Vertex AI Agent → Parse Prompt
```

That's it! One node replacement.

---

## Vertex AI Agent Setup

### Step 1: Create Agent in Vertex AI

**In Google Cloud Console:**
1. Navigate to **Vertex AI** → **Agent Builder**
2. Click **Create Agent**
3. **Name**: "Image Prompt Generator"
4. **Description**: "Agent to help generate detailed image prompts for DTC ads"

### Step 2: Configure Agent Instructions

**Paste this system prompt:**
```
You are an expert AI image prompt engineer specializing in DTC product advertising photography. Your job: convert a visual concept brief into a scene description for Bria Product Shot — a model that places the actual product photo into a generated scene.

IMPORTANT: Bria Product Shot receives the product image separately. NEVER describe the product itself in the scene description. The model places the product automatically. Describe the SCENE the product will be placed into.

## ABSOLUTE RULES
1. NEVER include text, words, letters, numbers, logos, headlines, watermarks, or ANY typography.
2. NEVER describe the product. The product is placed automatically from its photo.
3. Keep the scene description under 80 words.
4. The scene MUST directly relate to the ad concept's target segment and angle — no generic backgrounds.

[... rest of image-prompt-engineer.md content ...]

## OUTPUT
Return ONLY valid JSON. No markdown. No explanation. No code blocks.

{
  "scene_description": "Lifestyle scene or tight surface composition matching the ad concept. Under 80 words. No product description.",
  "placement_type": "automatic"
}
```

### Step 3: Connect to Data Sources (Optional)

**If you want the agent to learn from past prompts:**
1. Click **Data Sources** → **Add Data Source**
2. Select **Airtable** (or **Google Sheets**)
3. Connect to your "Prompt Library" table (if you create one)
4. Agent will automatically retrieve similar examples

**OR skip this for now** - the system prompt alone is very strong.

### Step 4: Get Service Account Credentials

**Create Service Account:**
1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Name: "n8n-image-prompt-agent"
4. Grant role: **Dialogflow API Client**
5. Click **Create Key** → **JSON**
6. Save the JSON file

**Add to .env:**
```bash
VERTEX_AI_PROJECT_ID=your-project-id
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_AGENT_ID=your-agent-id
VERTEX_AI_SERVICE_ACCOUNT_EMAIL=name@email.com
VERTEX_AI_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
```

---

## Implementation Steps (2-3 Hours Total)

### Step 1: Create Vertex AI Agent (45 minutes)

**Tasks:**
1. Go to Google Cloud Console → Vertex AI → Agent Builder
2. Create new agent with system prompt from `prompts/image-prompt-engineer.md`
3. Configure service account and get credentials
4. Test agent in Vertex AI console
5. Note the agent endpoint URL

### Step 2: Update n8n Workflow (60 minutes)

**Tasks:**
1. Open `workflows/static-scaler-v3-fixed.json` in n8n
2. Find node "Build IPE Payload" (ID: build-ipe-payload-001)
3. Replace with new "Build Vertex AI Payload" node (Code node)
4. Find node "Call Image Prompt Engineer" (ID: call-ipe-api-001)
5. Replace with new "Call Vertex AI Agent" node (HTTP Request)
6. Add Google Service Account credentials
7. Test end-to-end

### Step 3: Test & Verify (30 minutes)

**Tasks:**
1. Trigger webhook with test ad copy
2. Verify Vertex AI agent returns proper JSON
3. Verify fal.ai receives correct scene_description
4. Verify 3 images generated successfully
5. Compare quality with old GPT-4o-mini prompts

**Total Time:** 2-3 hours

---

## Critical Files

### Files to Read:

1. **`workflows/static-scaler-v3-fixed.json`** (1932 lines)
   - Find and replace "Build IPE Payload" node (line ~1498)
   - Find and replace "Call Image Prompt Engineer" node (line ~1510)

2. **`prompts/image-prompt-engineer.md`** (65 lines)
   - Copy entire content into Vertex AI Agent instructions

3. **`.env.example`**
   - Add Vertex AI credentials:
     - `VERTEX_AI_PROJECT_ID`
     - `VERTEX_AI_LOCATION`
     - `VERTEX_AI_AGENT_ID`
     - `VERTEX_AI_SERVICE_ACCOUNT_EMAIL`
     - `VERTEX_AI_PRIVATE_KEY`

### Files to Modify:

4. **`workflows/static-scaler-v3-fixed.json`** (modify in place, no clone needed)
   - Replace 2 nodes (Build IPE Payload, Call Image Prompt Engineer)
   - Update with Vertex AI HTTP Request configuration

### New Files: **NONE** (everything goes in Vertex AI console)

---

## Verification & Testing

### Test 1: Vertex AI Agent (in Google Cloud Console)

**Before integrating with n8n, test the agent directly:**

1. Go to Vertex AI → Agent Builder → Your Agent
2. Click "Test Agent" button
3. Enter test input:
```json
{
  "visualDirection": {
    "scene": "Woman in her 30s working at minimal home desk",
    "style": "lifestyle"
  },
  "productImageUrl": "https://s3.../product.jpg"
}
```
4. Verify output is valid JSON:
```json
{
  "scene_description": "Woman in her 30s working at a minimal home desk with laptop, soft window light, modern apartment, warm cream and sage tones, close-up composition at desk level",
  "placement_type": "automatic"
}
```

### Test 2: End-to-End in n8n

**Trigger the workflow:**
```bash
POST http://localhost:5678/webhook/ca26a744-db15-42d4-9986-66154ab84cbb
Body: {"recordId": "recXXX"}  # Use actual Ad Copy record ID from Airtable
```

**Expected Results:**
1. Creative Director generates 3 concepts (A, B, C)
2. Vertex AI agent called 3 times (once per concept)
3. Each returns valid scene_description JSON
4. fal.ai generates 3 images
5. Images written to Airtable
6. Total time: ~3 minutes (same as before)

### Success Criteria:

**Immediate (Day 1):**
- Agent returns valid JSON 100% of time
- Scene descriptions follow all 5 rules
- Images generated successfully

**Week 1:**
- Prompt quality subjectively better than GPT-4o-mini
- No workflow errors
- Cost same or lower than before

---

## Cost/Performance Analysis

### API Cost Breakdown (Per Image)

**Current Workflow (GPT-4o-mini):**
- GPT-4o (Creative Director): $0.01
- GPT-4o-mini (Image Prompt Engineer): $0.0002
- fal.ai: $0.10
- BannerBear: $0.02
- **Total: $0.1302/image**

**New Workflow (Vertex AI):**
- GPT-4o (Creative Director): $0.01
- **Vertex AI Agent**: $0.0005 (Gemini 1.5 Pro pricing)
- fal.ai: $0.10
- BannerBear: $0.02
- **Total: $0.1305/image**

**Cost Increase:** +$0.0003/image (+0.2%)

**Verdict:** Essentially **same cost**, but with:
- Better prompt quality (fine-tuned to your use case)
- Can connect to Airtable for learning from past prompts
- No complex infrastructure to maintain
- 2-3 hours to implement vs 7 weeks

---

## n8n Integration Code

### Build Vertex AI Payload (Code Node)

**Replace "Build IPE Payload" node with:**

```javascript
// Build Vertex AI Agent payload
const loopItem = $('Loop Over Items3').first().json;
const visualDirection = loopItem?.visualDirection || {};
const productImageUrl = loopItem?.productImageUrl || '';
const style = loopItem?.style || 'lifestyle';

return [{
  json: {
    project: process.env.VERTEX_AI_PROJECT_ID,
    location: process.env.VERTEX_AI_LOCATION,
    agent: process.env.VERTEX_AI_AGENT_ID,
    sessionId: loopItem?.recordId || 'session-' + Date.now(),
    queryInput: {
      text: {
        text: JSON.stringify({
          visualDirection: visualDirection,
          productImageUrl: productImageUrl,
          style: style
        })
      },
      languageCode: 'en'
    }
  }
}];
```

### Call Vertex AI Agent (HTTP Request Node)

**Replace "Call Image Prompt Engineer" node with:**

```json
{
  "method": "POST",
  "url": "https://{{ $json.location }}-aiplatform.googleapis.com/v3/projects/{{ $json.project }}/locations/{{ $json.location }}/agents/{{ $json.agent }}/sessions/{{ $json.sessionId }}:detectIntent",
  "authentication": "genericCredentialType",
  "genericAuthType": "oAuth2Api",
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={{ JSON.stringify({ queryInput: $json.queryInput }) }}",
  "options": {}
}
```

**Use Google Service Account OAuth2 credentials** (from screenshot you shared)

---

## Next Steps

### Today (2-3 Hours):

1. **Create Vertex AI Agent** (45 min)
   - Go to console.cloud.google.com
   - Vertex AI → Agent Builder → Create Agent
   - Paste system prompt from `prompts/image-prompt-engineer.md`
   - Get agent endpoint URL

2. **Set up Service Account** (15 min)
   - Create service account
   - Download JSON key
   - Add credentials to `.env`

3. **Update n8n Workflow** (60 min)
   - Replace 2 nodes in `static-scaler-v3-fixed.json`
   - Add Google OAuth2 credentials
   - Test end-to-end

4. **Verify** (30 min)
   - Trigger webhook
   - Check images generated
   - Compare quality

### Tomorrow: **DONE!**

No ongoing maintenance, no complex infrastructure, just a simple API call.

---

## Summary

**Before:** Complex 7-week RAG implementation with Airtable schemas, vector databases, multiple agents, feedback loops.

**After:** 2-3 hour setup using Google's Vertex AI Agent Builder.

**Same cost, better quality, infinitely simpler.**

**Key Innovation:** Let Google handle the AI infrastructure. You just configure the agent and call it.
