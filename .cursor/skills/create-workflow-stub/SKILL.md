---
name: create-workflow-stub
description: Use when the user asks to create a new n8n workflow, scaffold a workflow template, or stub out automation logic.
---

# Create n8n Workflow Stub

Generate a new n8n workflow template based on requirements.

## Usage
```
/create-workflow-stub [workflow-name]
```

Use this to quickly scaffold any of the 5 needed workflows (WF1-WF5) or custom workflows.

## Instructions

You are a workflow scaffolding specialist. Your job is to create properly structured n8n workflow templates.

### Step 1: Determine Workflow Type
If user provides a workflow name, use it. Otherwise, show the 5 planned workflows:

```
Which workflow would you like to create?

**Planned Workflows (from project memory):**
1. WF1: Research Pipeline (POST /webhook/bomb-research-product)
2. WF2: Ad Copy Generator (POST /webhook/bomb-generate-ads)
3. WF3: Image Generation Pipeline (POST /webhook/bomb-generate-images)
4. WF4: Ad Concept (POST /webhook/bomb-ad-concept)
5. WF5: Ad Clone (POST /webhook/bomb-ad-clone)
6. Custom workflow (specify name)

Enter number or custom name:
```

### Step 2: Gather Requirements
For the selected workflow, ask targeted questions:
- **Input**: What data triggers this workflow?
- **Processing**: What transformations/API calls needed?
- **Output**: Where does the result go? (Airtable, file, webhook response)
- **Credentials**: Which APIs will be used?

### Step 3: Generate Workflow Structure
Create a valid n8n workflow JSON with:

**Core Structure:**
```json
{
  "name": "[Workflow Name]",
  "nodes": [
    {
      "parameters": {
        "path": "[webhook-path]",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "webhook-trigger",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1.1,
      "position": [250, 300]
    },
    {
      "parameters": {},
      "id": "placeholder-processing",
      "name": "Processing Node",
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [450, 300],
      "notes": "TODO: Add processing logic here"
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}"
      },
      "id": "webhook-response",
      "name": "Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [650, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{"node": "Processing Node", "type": "main", "index": 0}]]
    },
    "Processing Node": {
      "main": [[{"node": "Response", "type": "main", "index": 0}]]
    }
  },
  "active": false,
  "settings": {},
  "versionId": "00000000-0000-0000-0000-000000000000",
  "id": "temp-id",
  "meta": {},
  "tags": []
}
```

### Step 4: Add Workflow-Specific Nodes
Based on workflow type, add appropriate nodes:

**For Research Pipeline (WF1):**
- Webhook trigger
- HTTP Request to scraping APIs
- Code node for data processing
- Airtable node (create records)
- Response node

**For Ad Copy Generator (WF2):**
- Webhook trigger
- Airtable node (read product data)
- OpenAI node (generate copy)
- Code node (format output)
- Airtable node (save ad copy)
- Response node

**For Image Generation (WF3):**
- Webhook trigger
- fal.ai node (generate images)
- AWS S3 node (store images)
- Airtable node (save URLs)
- Response node

### Step 5: Save Workflow File
- Convert workflow name to filename: "Research Pipeline" → "research-pipeline.json"
- Save to `/workflows` directory
- Create companion markdown file with documentation

### Step 6: Generate Documentation
Create `[workflow-name].md` with:

```markdown
# [Workflow Name]

## Overview
[Description of what this workflow does]

## Webhook Endpoint
POST http://localhost:5678/webhook/[path]

## Input Schema
```json
{
  "productUrl": "string",
  "additionalData": "object"
}
```

## Processing Steps
1. Step 1 description
2. Step 2 description
3. Step 3 description

## Output Schema
```json
{
  "success": "boolean",
  "data": "object"
}
```

## Required Credentials
- [ ] Airtable API (AIRTABLE_API_KEY)
- [ ] OpenAI API (OPENAI_API_KEY)
- [ ] AWS (AWS_ACCESS_KEY, AWS_SECRET_KEY)

## TODO
- [ ] Configure credential nodes
- [ ] Test with sample data
- [ ] Add error handling
- [ ] Optimize for performance

## Testing
```bash
curl -X POST http://localhost:5678/webhook/[path] \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```
```

### Step 7: Summary & Next Steps
```
✓ Created workflow stub: [Workflow Name]

**Files Created:**
- workflows/[workflow-name].json (workflow definition)
- workflows/[workflow-name].md (documentation)

**Next Steps:**
1. Review the TODO items in the documentation
2. Run /import-workflow workflows/[workflow-name].json
3. Configure credentials in n8n UI
4. Replace placeholder nodes with actual logic
5. Test with sample data

**Credentials Needed:**
[List of required API keys]
```

## Templates by Workflow Type

### Template 1: Simple Webhook → Process → Respond
For quick transformations and responses

### Template 2: Webhook → Database → AI → Database → Respond
For AI-powered workflows with data persistence

### Template 3: Webhook → Multi-API → Aggregate → Respond
For workflows calling multiple external services

### Template 4: Scheduled Trigger → Process → Store
For automated background jobs

## Notes
- All workflows start inactive by default
- Webhook paths should follow pattern: `/webhook/bomb-[action]`
- Use NoOp nodes as placeholders for incomplete logic
- Include error handling nodes in production workflows