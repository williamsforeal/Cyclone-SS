# Converting Image Prompt Engineer Workflow from OpenAI to Vertex AI

## Current State (Images 1-3)

Your workflow currently uses OpenAI Chat Completions API with these nodes:

### Node 1: Build IPE Payload (JavaScript)
```javascript
const systemPrompt = "You are an expert AI image prompt engineer...";
// Builds OpenAI API payload
```

### Node 2: Call Image Prompt Engineer (HTTP Request)
```
POST https://api.openai.com/v1/chat/completions
Authentication: Bearer Token (OpenAI API Key)
```

### Node 3: Parse Prompt (JavaScript)
```javascript
// Extracts text from OpenAI response format:
// item.json.choices[0].message.content
```

## Desired State (Image 4)

Convert to use n8n's native **Google Vertex Chat Model** node with:
- AI Agent integration
- Simple Memory
- Pinecone Vector Store
- Google Vertex Embeddings

## Why This Conversion is Needed

**Benefits of Vertex AI:**
1. ✅ Access to Claude, Gemini, PaLM, and other models (not just OpenAI)
2. ✅ Unified Google Cloud billing
3. ✅ Better rate limits for production
4. ✅ Native n8n integration (no manual HTTP requests)
5. ✅ Works with AI Agent pattern for complex workflows

## Conversion Steps

### Step 1: Replace Manual HTTP Nodes with Google Vertex Chat Model Node

**Remove these nodes:**
- ❌ Build IPE Payload (JavaScript)
- ❌ Call Image Prompt Engineer (HTTP Request)
- ❌ Parse Prompt (JavaScript)

**Add this node:**
- ✅ @n8n/n8n-nodes-langchain.lmChatGoogleVertex (Google Vertex Chat Model)

### Step 2: Configure Google Vertex Chat Model Node

**Node Settings:**

| Field | Value | Notes |
|-------|-------|-------|
| **Credential** | Select: `Google Service Account` | The one you're setting up now! |
| **Model** | `claude-3-5-sonnet@20241022` or `gemini-1.5-pro` | Choose model from Vertex AI Model Garden |
| **Project ID** | `gen-lang-client-0234791928` | Your Google Cloud project |
| **Location** | `us-central1` | Must match credential region |
| **Max Output Tokens** | `2000` | Adjust based on needs |
| **Temperature** | `0.7` | For creative scene descriptions |

**System Message (from your current systemPrompt):**
```
You are an expert AI image prompt engineer specializing in DTC product advertising photography. Your job: convert a visual concept brief into a scene description for Bria Product Shot — a model that places the actual product photo into a generated scene.

IMPORTANT: Bria Product Shot receives the product image separately. NEVER describe the product itself in the scene description. The model places the product automatically. Describe the SCENE the product will be placed into.

## ABSOLUTE RULES
1. NEVER include text, words, letters, numbers, logos, headlines, watermarks, or ANY typography.
2. NEVER describe the product. The product is placed automatically from its image.
```

### Step 3: Use AI Agent Pattern (Image 4 Architecture)

**New Workflow Structure:**

```
┌─────────────────────────────┐
│ When chat message received  │  ← Trigger
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│        AI Agent             │  ← Orchestrator
│  ┌──────────────────────┐  │
│  │ Google Vertex Chat   │  │  ← Claude/Gemini
│  │ Model                │  │
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │ Simple Memory        │  │  ← Conversation history
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │ Tool: Generate Image │  │  ← Calls Bria Product Shot
│  └──────────────────────┘  │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Pinecone Vector Store       │  ← Optional: RAG for examples
│ (Embeddings Google Vertex)  │
└─────────────────────────────┘
```

### Step 4: Convert JavaScript Logic (If Needed)

**Old Parse Prompt Logic:**
```javascript
// OpenAI response format
let text = '';
if (item.json?.choices?.[0]?.message?.content) {
    text = item.json.choices[0].message.content;
}
```

**New (with Google Vertex Chat Model node):**
No parsing needed! The node outputs text directly:
```javascript
// Access output directly from previous node
const sceneDescription = $input.first().json.output;
```

### Step 5: Configure AI Agent Tools

**Add "Generate Image" tool to AI Agent:**

```javascript
// Tool Definition
{
  name: "generate_image",
  description: "Generates a product scene using Bria Product Shot. Takes a scene description and product image URL.",
  parameters: {
    type: "object",
    properties: {
      sceneDescription: {
        type: "string",
        description: "Scene description for Bria Product Shot (environment only, no product description)"
      },
      productImageUrl: {
        type: "string",
        description: "URL of the product photo to place in the scene"
      },
      placementType: {
        type: "string",
        enum: ["automatic"],
        description: "How to place the product (always automatic)"
      }
    },
    required: ["sceneDescription", "productImageUrl"]
  }
}
```

**Tool Implementation (HTTP Request to Bria):**
```javascript
// When AI Agent calls generate_image tool:
const payload = {
  image_url: $json.productImageUrl,
  scene_description: $json.sceneDescription,
  placement_type: "automatic"
};

// POST to fal.ai/bria/product-shot
```

### Step 6: Test with Different Models

**Model Options in Vertex AI:**

| Model | Use Case | Cost |
|-------|----------|------|
| `claude-3-5-sonnet@20241022` | Best quality scene descriptions | $$$ |
| `claude-3-5-haiku@20241022` | Fast, good quality | $ |
| `gemini-1.5-pro` | Google's flagship, multimodal | $$ |
| `gemini-1.5-flash` | Fast, cheaper alternative | $ |

**Testing Script:**
```javascript
// Test prompt
const testInput = {
  productName: "PalmAura device",
  visualConcept: "Cozy living room scene with warm lighting",
  mood: "Warm and reassuring"
};

// Expected output (scene description only, no product mention):
// "A cozy living room featuring a plush taupe armchair..."
```

## Migration Checklist

### Before Migration
- [ ] Complete Vertex AI service account setup (from our previous plan)
- [ ] Test Vertex AI credentials in n8n
- [ ] Export current workflow as backup
- [ ] Document current OpenAI prompts and settings

### During Migration
- [ ] Add Google Vertex Chat Model node to workflow
- [ ] Configure with service account credential
- [ ] Select model (Claude 3.5 Sonnet recommended)
- [ ] Copy system prompt from "Build IPE Payload" to model's system message
- [ ] Remove old OpenAI HTTP Request nodes
- [ ] Update any parsing logic to use new node output format

### After Migration
- [ ] Test with sample product and concept brief
- [ ] Compare output quality vs OpenAI version
- [ ] Verify Bria Product Shot integration still works
- [ ] Monitor costs in Google Cloud Console
- [ ] Update documentation

### Optional Enhancements (Image 4 Pattern)
- [ ] Add AI Agent wrapper for multi-step workflows
- [ ] Implement Simple Memory for conversation history
- [ ] Add Pinecone Vector Store for RAG (example-based learning)
- [ ] Use Google Vertex Embeddings for similarity search

## Response Format Differences

### OpenAI Response
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Scene description here..."
      }
    }
  ],
  "usage": {
    "prompt_tokens": 984,
    "completion_tokens": 86,
    "total_tokens": 1070
  }
}
```

### Google Vertex Chat Model Node Output
```json
{
  "output": "Scene description here...",
  "usage": {
    "promptTokens": 984,
    "completionTokens": 86,
    "totalTokens": 1070
  }
}
```

**Key Difference:** Direct access via `.output` instead of `.choices[0].message.content`

## Cost Comparison

**OpenAI GPT-4 (current):**
- Input: $10 / 1M tokens
- Output: $30 / 1M tokens

**Vertex AI Claude 3.5 Sonnet:**
- Input: $3 / 1M tokens
- Output: $15 / 1M tokens
- **50-70% cost savings!**

**Vertex AI Gemini 1.5 Pro:**
- Input: $1.25 / 1M tokens
- Output: $5 / 1M tokens
- **80-85% cost savings!**

## Troubleshooting

### Issue: "Credential not found"
**Solution:** Make sure you completed the Vertex AI service account setup and saved credentials in n8n.

### Issue: "Model not found"
**Solution:**
1. Enable Vertex AI API in Google Cloud Console
2. Verify model name is correct (e.g., `claude-3-5-sonnet@20241022`)
3. Check that model is available in your region (`us-central1`)

### Issue: "Permission denied"
**Solution:** Verify service account has `Vertex AI User` role:
```bash
gcloud projects get-iam-policy gen-lang-client-0234791928 \
  --flatten="bindings[].members" \
  --filter="bindings.members:n8n-vertex-ai@*"
```

### Issue: "Output format different from expected"
**Solution:** Update downstream nodes to use `.output` instead of `.choices[0].message.content`

## Next Steps

1. **Complete Vertex AI Credentials Setup** (from previous plan)
2. **Test Google Vertex Chat Model node** with simple prompt
3. **Migrate one workflow** as proof of concept
4. **Compare outputs** between OpenAI and Vertex AI versions
5. **Roll out** to other workflows if successful

## Example: Simple Test Workflow

**Before Migration (OpenAI):**
```
Manual Trigger
  ↓
Build IPE Payload (JavaScript)
  ↓
Call Image Prompt Engineer (HTTP Request - OpenAI)
  ↓
Parse Prompt (JavaScript)
  ↓
Output
```

**After Migration (Vertex AI):**
```
Manual Trigger
  ↓
Google Vertex Chat Model
  ↓
Output (direct access to .output)
```

**80% fewer nodes, cleaner workflow!**

## Resources

- [n8n Google Vertex AI Docs](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.lmchatgooglevertex/)
- [Vertex AI Model Garden](https://console.cloud.google.com/vertex-ai/model-garden)
- [Claude on Vertex AI](https://docs.anthropic.com/en/api/claude-on-vertex-ai)
- [Gemini API Reference](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini)
