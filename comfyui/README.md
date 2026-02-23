# ComfyUI Workflows & API

This folder contains ComfyUI workflow JSON files and utilities for connecting to ComfyUI via API.

## Container Status

ComfyUI runs in Docker on **port 8188**. Start it with:

```bash
docker-compose up -d comfyui
```

- **Web UI**: http://localhost:8188
- **API base**: http://localhost:8188

## Workflow Formats

### 1. API Format (for `/prompt` endpoint)

Used when submitting workflows programmatically. Node IDs are keys; each node has `class_type` and `inputs`.

- **Location**: `workflows/*_api.json`
- **Submit**: `POST http://localhost:8188/prompt` with body `{"prompt": <workflow_json>}`

### 2. Visual Format (for UI import)

Full workflow schema with `version`, `nodes`, `links`, `groups`. Use in ComfyUI: **Load** → select file.

- **Location**: `workflows/*_visual.json`
- **Schema**: [ComfyUI Workflow JSON Spec](https://docs.comfy.org/specs/workflow_json)

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/prompt` | POST | Submit workflow (API format) |
| `/prompt` | GET | Queue status |
| `/history/{prompt_id}` | GET | Get execution result |
| `/queue` | GET | Current queue |
| `/object_info` | GET | Available node types |
| `/view?filename=...` | GET | Download output image |

## Example: Submit workflow via curl

```bash
curl -X POST "http://localhost:8188/prompt" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\": $(cat workflows/txt2img_api.json)}"
```

## Example: Poll for result

```bash
# After submit, you get prompt_id
curl "http://localhost:8188/history/{prompt_id}"
```

## n8n Integration

Use the workflow in `../workflows/comfyui-trigger.json` to trigger ComfyUI from n8n.
