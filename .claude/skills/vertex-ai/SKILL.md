---
name: vertex-ai
description: Vertex AI API reference for Gemini and Claude endpoints. Use when user says "vertex", "gemini api", "claude api", "vertex ai", or needs to make API calls to Google AI models or Anthropic models via Vertex AI.
user-invocable: false
---

# Vertex AI API Reference

Project: `gen-lang-client-0234791928` | Region: `us-central1`

## Gemini Endpoints

**Generate Content:**
```
POST https://us-central1-aiplatform.googleapis.com/v1/projects/gen-lang-client-0234791928/locations/us-central1/publishers/google/models/{MODEL}:generateContent
```

Models: `gemini-2.0-flash`, `gemini-2.0-pro`, `gemini-1.5-pro`, `gemini-1.5-flash`

**Auth:** `Authorization: Bearer $(gcloud auth print-access-token)`

**Request body:**
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{"text": "Your prompt here"}]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 8192
  }
}
```

**Response path:** `$json.candidates[0].content.parts[0].text`

## Claude via Vertex AI

**Raw Predict:**
```
POST https://us-central1-aiplatform.googleapis.com/v1/projects/gen-lang-client-0234791928/locations/us-central1/publishers/anthropic/models/{MODEL}:rawPredict
```

Models: `claude-sonnet-4-20250514`, `claude-haiku-35-20241022`

**Auth:** `Authorization: Bearer $(gcloud auth print-access-token)`

**Request body (MUST include anthropic_version):**
```json
{
  "anthropic_version": "vertex-2023-10-16",
  "messages": [
    {"role": "user", "content": "Your prompt here"}
  ],
  "max_tokens": 4096
}
```

**Response path:** `$json.content[0].text`

## n8n Integration

When using these endpoints in n8n HTTP Request nodes:
- Use Google Cloud OAuth2 credential for auth
- The ENTIRE jsonBody must start with `=` for expression mode
- Gemini response: `{{ $json.candidates[0].content.parts[0].text }}`
- Claude response: `{{ $json.content[0].text }}`

## Quick Test (bash)

```bash
# Test Gemini
curl -X POST \
  "https://us-central1-aiplatform.googleapis.com/v1/projects/gen-lang-client-0234791928/locations/us-central1/publishers/google/models/gemini-2.0-flash:generateContent" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"role":"user","parts":[{"text":"Hello"}]}]}'
```

## Common Errors

- **403 Forbidden:** Token expired. Run `gcloud auth print-access-token` to refresh.
- **404 Not Found:** Wrong model name. Check available models with `gcloud ai models list --region=us-central1`.
- **400 Bad Request (Claude):** Missing `anthropic_version` field in request body.
