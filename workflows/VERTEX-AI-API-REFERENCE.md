# Vertex AI API Reference
## Practical guide for your n8n workflows

---

## 1. Your Two Endpoint Patterns

### Gemini Models (Google)
```
POST https://us-central1-aiplatform.googleapis.com/v1/projects/gen-lang-client-0234791928/locations/us-central1/publishers/google/models/{MODEL_ID}:generateContent
```

### Claude Models (Anthropic via Vertex)
```
POST https://us-central1-aiplatform.googleapis.com/v1/projects/gen-lang-client-0234791928/locations/us-central1/publishers/anthropic/models/{MODEL_ID}:rawPredict
```

---

## 2. Available Models

### Gemini (publisher: google)
| Model ID | Use Case | Speed |
|----------|----------|-------|
| `gemini-2.0-flash` | Best all-around, multimodal | Fast |
| `gemini-2.0-flash-lite` | Cheapest, simple tasks | Fastest |
| `gemini-2.5-flash` | Latest, reasoning | Fast |
| `gemini-1.5-pro` | Long context (2M tokens) | Moderate |

### Claude (publisher: anthropic)
| Model ID | Use Case | Speed |
|----------|----------|-------|
| `claude-opus-4-6` | Best quality, complex analysis | Slow |
| `claude-sonnet-4-5-20250929` | Balanced quality/speed | Moderate |
| `claude-haiku-4-5-20251001` | Fast, cheap, simple tasks | Fast |
| `claude-3-5-haiku@20241022` | Lightweight tasks | Fastest |

---

## 3. Request Formats

### Gemini Request (your ad analysis workflow)
```json
{
  "systemInstruction": {
    "parts": [{
      "text": "You are an expert DTC ad analyst. Analyze winning static ads and extract a replicable creative formula."
    }]
  },
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "fileData": {
            "mimeType": "image/jpeg",
            "fileUri": "{{$json.adImageUrl}}"
          }
        },
        {
          "text": "Analyze this static ad using the Scientific Upgrade framework. Return A/B/C assets."
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 4096,
    "responseMimeType": "text/plain"
  }
}
```

### Claude Request (via Vertex AI rawPredict)
```json
{
  "anthropic_version": "vertex-2023-10-16",
  "system": "You are an expert DTC ad analyst specializing in Motion Methodology and the Scientific Upgrade framework.",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image",
          "source": {
            "type": "url",
            "url": "{{$json.adImageUrl}}"
          }
        },
        {
          "type": "text",
          "text": "Analyze this static ad. Return 3 assets (A/B/C) with Fal.ai-ready visual directives."
        }
      ]
    }
  ],
  "max_tokens": 4096,
  "temperature": 0.7
}
```

### Response Format Difference

**Gemini response → extract:**
```javascript
$json.candidates[0].content.parts[0].text
```

**Claude response → extract:**
```javascript
$json.content[0].text
```

---

## 4. n8n HTTP Request Node Setup

### Node: Call Gemini via Vertex AI

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **URL** | `https://us-central1-aiplatform.googleapis.com/v1/projects/gen-lang-client-0234791928/locations/us-central1/publishers/google/models/gemini-2.0-flash:generateContent` |
| **Authentication** | `Google Service Account` (your Vertex AI credential) |
| **Body Content Type** | `JSON` |
| **Send Body** | ✅ ON |

**Body:**
```json
{
  "systemInstruction": {
    "parts": [{"text": "{{$json.systemPrompt}}"}]
  },
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "fileData": {
            "mimeType": "image/jpeg",
            "fileUri": "{{$json.imageUrl}}"
          }
        },
        {"text": "{{$json.userMessage}}"}
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 4096
  }
}
```

---

### Node: Call Claude via Vertex AI

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **URL** | `https://us-central1-aiplatform.googleapis.com/v1/projects/gen-lang-client-0234791928/locations/us-central1/publishers/anthropic/models/claude-sonnet-4-5-20250929:rawPredict` |
| **Authentication** | `Google Service Account` (your Vertex AI credential) |
| **Body Content Type** | `JSON` |
| **Send Body** | ✅ ON |

**Body:**
```json
{
  "anthropic_version": "vertex-2023-10-16",
  "system": "{{$json.systemPrompt}}",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image",
          "source": {
            "type": "url",
            "url": "{{$json.imageUrl}}"
          }
        },
        {
          "type": "text",
          "text": "{{$json.userMessage}}"
        }
      ]
    }
  ],
  "max_tokens": 4096,
  "temperature": 0.7
}
```

---

## 5. Streaming vs Non-Streaming

### Non-Streaming (default — use this)
- URL ends in `:generateContent`
- Returns complete response at once
- ✅ Best for n8n (simpler parsing)

### Streaming
- URL ends in `:streamGenerateContent`
- Returns tokens progressively via SSE
- ❌ Complex to handle in n8n HTTP Request nodes
- Use only if response time > 30 seconds and you need partial output

---

## 6. Key Parameters for Your Ad Workflows

### For ad analysis (creative, varied output):
```json
"generationConfig": {
  "temperature": 0.7,
  "topP": 0.9,
  "maxOutputTokens": 4096
}
```

### For structured JSON extraction (precise, deterministic):
```json
"generationConfig": {
  "temperature": 0.2,
  "maxOutputTokens": 2048,
  "responseMimeType": "application/json"
}
```

### For scene description generation (creative but focused):
```json
"generationConfig": {
  "temperature": 0.8,
  "topK": 40,
  "maxOutputTokens": 2048
}
```

---

## 7. Multimodal: Sending Images

### Option A: URL (easiest — Google Cloud Storage or public URL)
```json
{
  "fileData": {
    "mimeType": "image/jpeg",
    "fileUri": "https://your-s3-bucket.com/ad-image.jpg"
  }
}
```

### Option B: Base64 (for local/binary images)
```json
{
  "inlineData": {
    "mimeType": "image/jpeg",
    "data": "{{$binary.data.toString('base64')}}"
  }
}
```

### Which to use:
- **URL (Option A)**: If image is already hosted (Airtable attachments, S3, Google Drive)
- **Base64 (Option B)**: If image comes from a previous n8n node as binary

---

## 8. Your Exact Workflow Integration

### Full Flow: Static Ad → Vertex AI → ComfyUI

```
[Airtable] → [Vertex AI] → [Parse Output] → [ComfyUI]
   ↓              ↓                ↓               ↓
Product       Analyze ad      Extract scene   Generate
image URL     + concept       descriptions    5 variants
```

### Step 1: Fetch from Airtable
```javascript
// Output: { productImageUrl, adImageUrl, productName }
```

### Step 2: Vertex AI Analysis
```javascript
// n8n HTTP Request node
// URL: .../publishers/google/models/gemini-2.0-flash:generateContent

// Body:
{
  "systemInstruction": {
    "parts": [{
      "text": "You are an expert DTC ad analyst using Motion Methodology and the Scientific Upgrade framework. Analyze the uploaded ad and return a detailed A/B/C creative brief with Fal.ai-ready visual directives."
    }]
  },
  "contents": [{
    "role": "user",
    "parts": [
      {
        "fileData": {
          "mimeType": "image/jpeg",
          "fileUri": "{{ $('Fetch from Airtable').item.json.adImageUrl }}"
        }
      },
      {
        "text": "Analyze this winning static ad. Extract the creative concept, psychological triggers, and generate A/B/C scaling variants with visual directives formatted for Bria Product Shot image generation."
      }
    ]
  }],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 4096
  }
}
```

### Step 3: Parse Response
```javascript
// Extract text from Gemini response
const analysisText = $json.candidates[0].content.parts[0].text;

// Or from Claude response
// const analysisText = $json.content[0].text;

return [{ json: { analysis: analysisText } }];
```

### Step 4: Build ComfyUI Payload
```javascript
// Extract scene descriptions from analysis
const analysis = $json.analysis;

// Simple extraction (use regex for production)
const assetAMatch = analysis.match(/Asset A[\s\S]*?Visual Directive[\s\S]*?Subject:(.*?)(?=Lighting:|$)/i);
const sceneA = assetAMatch ? assetAMatch[1].trim() : '';

return [{
  json: {
    prompt: {
      "6": { // Positive prompt node in your ComfyUI workflow
        "inputs": {
          "text": sceneA,
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode"
      }
      // ... rest of ComfyUI workflow nodes
    }
  }
}];
```

### Step 5: Send to ComfyUI API
```javascript
// n8n HTTP Request node
// POST http://localhost:8188/prompt
// Body: { "prompt": {{ $json.prompt }} }
```

---

## 9. Error Handling

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | Service account credentials invalid | Verify credential in n8n, check JSON key |
| `403 Forbidden` | Missing Vertex AI User role | Add `roles/aiplatform.user` to service account |
| `404 Not Found` | Wrong model ID or publisher | Check model ID spelling, verify publisher name |
| `429 Too Many Requests` | Rate limit hit | Add retry logic or reduce request frequency |
| `FINISH_REASON_SAFETY` | Content blocked by safety filter | Adjust safetySettings thresholds |

### Safety Settings (relax for ad creative)
```json
"safetySettings": [
  {
    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    "threshold": "BLOCK_ONLY_HIGH"
  },
  {
    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
  }
]
```

---

## 10. Model Selection Guide for Your Use Cases

| Task | Best Model | Why |
|------|------------|-----|
| **Ad concept analysis** | `gemini-2.0-flash` | Multimodal, fast, cheap |
| **Deep creative analysis** | `claude-sonnet-4-5-20250929` | Best writing quality |
| **Scene description extraction** | `gemini-2.0-flash-lite` | Simple extraction, cheapest |
| **Image prompt engineering** | `claude-opus-4-6` | Best creative output |
| **Quick JSON structuring** | `gemini-2.0-flash-lite` | Fast + JSON mode |
| **Batch processing (100+ ads)** | `gemini-2.0-flash-lite` | Cheapest at scale |

---

## 11. Token Counting (Before Expensive Calls)

Pre-check token usage to avoid surprises:

```
POST https://us-central1-aiplatform.googleapis.com/v1/projects/gen-lang-client-0234791928/locations/us-central1/publishers/google/models/gemini-2.0-flash:countTokens
```

**Body:** Same as generateContent request

**Response:**
```json
{
  "totalTokens": 1234,
  "totalBillableCharacters": 4567
}
```

Use this before batching to estimate costs.

---

## Quick Reference

### Your Project Details
```
Project ID:  gen-lang-client-0234791928
Location:    us-central1
Credential:  Google Service Account (n8n stored)
```

### Endpoint Templates
```
Gemini:  https://us-central1-aiplatform.googleapis.com/v1/projects/gen-lang-client-0234791928/locations/us-central1/publishers/google/models/{MODEL}:generateContent

Claude:  https://us-central1-aiplatform.googleapis.com/v1/projects/gen-lang-client-0234791928/locations/us-central1/publishers/anthropic/models/{MODEL}:rawPredict
```

### Response Extraction
```javascript
// Gemini
$json.candidates[0].content.parts[0].text

// Claude
$json.content[0].text
```
