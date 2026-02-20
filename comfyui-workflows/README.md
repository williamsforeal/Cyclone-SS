# ComfyUI Workflows

This directory contains ComfyUI workflow JSON files you can load or run via the API.

## Workflow Types

### API format (`*_api.json`)
- Used with ComfyUI's `/prompt` endpoint
- Send as `{"prompt": <workflow_json>}` via POST
- Node IDs are string keys; each node has `class_type` and `inputs`

### UI format (from ComfyUI export)
- Use **File → Load** in ComfyUI to load workflow JSON
- Or **File → Export (API)** to get API-format for programmatic use

## Files

| File | Description |
|------|-------------|
| `basic_txt2img_api.json` | Minimal txt2img: checkpoint → CLIP encode → KSampler → VAE decode → SaveImage |

## Running via API

```bash
# Start ComfyUI first: docker compose --profile comfyui up -d
curl -X POST http://localhost:8188/prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": <paste workflow JSON>}'
```

## Models

Place model files (`.safetensors`, `.ckpt`) in the ComfyUI models volume. Default paths:
- Checkpoints: `models/checkpoints/`
- LoRAs: `models/loras/`
- VAE: `models/vae/`

Update `ckpt_name` in the workflow to match your model filename.
