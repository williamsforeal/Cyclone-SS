---
name: n8n-import
description: Import, list, validate, and manage n8n workflow JSON files on localhost:5678. Use when user says "import workflow", "list workflows", "deploy workflow", "n8n import", "validate workflow", or wants to manage n8n workflows.
---

# n8n Workflow Manager

Manage n8n workflows on the local instance at http://localhost:5678.

## Operations

### List All Workflows
```bash
curl -s http://localhost:5678/api/v1/workflows | python3 -c "
import sys, json
data = json.load(sys.stdin)
for w in data.get('data', []):
    print(f\"  {w['id']:>4}  {w['name']}\")
"
```

### Import Workflow from JSON
```bash
curl -s -X POST http://localhost:5678/api/v1/workflows \
  -H "Content-Type: application/json" \
  -d @/path/to/workflow.json
```

### Get Workflow Details
```bash
curl -s http://localhost:5678/api/v1/workflows/{ID} | python3 -m json.tool
```

### Activate / Deactivate
```bash
curl -s -X PATCH http://localhost:5678/api/v1/workflows/{ID} \
  -H "Content-Type: application/json" \
  -d '{"active": true}'
```

### Health Check
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5678/healthz
```

## Critical: n8n Expression Gotcha

In HTTP Request node `jsonBody`, the ENTIRE string must start with `=` to enable expression mode:
- **Correct:** `"jsonBody": "={\n  \"key\": \"{{ $json.val }}\"\n}"`
- **Wrong:** `"jsonBody": "{\n  \"key\": \"={{ $json.val }}\"\n}"`
- Without leading `=`, ALL `{{ }}` are sent as literal text to the API

## Workflow JSON Location

Repo: `workflows/` directory in Cyclone-SS

## 5 Planned Webhooks
1. WF1: Research Pipeline — POST /webhook/bomb-research-product
2. WF2: Ad Copy Generator — POST /webhook/bomb-generate-ads
3. WF3: Image Generation — POST /webhook/bomb-generate-images
4. WF4: Ad Concept — POST /webhook/bomb-ad-concept
5. WF5: Ad Clone — POST /webhook/bomb-ad-clone

## Validation Checklist

When validating a workflow JSON, check:
- [ ] All credential references point to existing credentials
- [ ] Webhook paths are unique and don't conflict
- [ ] HTTP Request nodes with expressions have leading `=` in jsonBody
- [ ] No hardcoded API keys (use credentials or env vars)
- [ ] Node connections are complete (no orphaned nodes)
