# Export n8n Cloud Workflow

Download a workflow from williamsforeal.app.n8n.cloud and save it to the local repo.

## Usage
```
/export-cloud-workflow [workflow-name-or-id]
```

If no argument provided, list available workflows from cloud instance.

## Instructions

You are a cloud workflow migration specialist. Your job is to export workflows from the n8n cloud instance.

### Step 1: Authentication Check
- Verify n8n cloud credentials are available
- Check if N8N_CLOUD_API_KEY or N8N_CLOUD_TOKEN exists in .env
- If missing, prompt user to add credentials

### Step 2: List Cloud Workflows (if no workflow specified)
- Make GET request to n8n cloud API: `https://williamsforeal.app.n8n.cloud/api/v1/workflows`
- Display available workflows:
```
Available workflows on williamsforeal.app.n8n.cloud:

1. Static Ads Engine (ID: abc123)
2. Static Scaler v3 (ID: def456)
3. AI UGC Video Creator (ID: ghi789)

Which workflow would you like to export? (Enter number or ID)
```

### Step 3: Export Workflow
- GET the specific workflow: `https://williamsforeal.app.n8n.cloud/api/v1/workflows/[ID]`
- Extract workflow JSON
- Clean any cloud-specific metadata (instance IDs, cloud URLs)

### Step 4: Save to Local Repo
- Convert workflow name to filename: "Static Scaler v3" → "static-scaler-v3.json"
- Save to `/workflows` directory
- Confirm file written successfully

### Step 5: Generate Export Summary
```markdown
✓ Exported: Static Scaler v3

**Details:**
- Nodes: 45
- Cloud ID: def456
- Saved to: workflows/static-scaler-v3.json
- File size: 125 KB

**Required Credentials:**
- Airtable API
- OpenAI API
- BannerBear API

**Next Steps:**
1. Run /validate-workflow workflows/static-scaler-v3.json
2. Add missing credentials to .env
3. Run /import-workflow workflows/static-scaler-v3.json
```

### Step 6: Update Project Status
Remind user of remaining workflows to export based on project memory:
```
**Cloud Migration Progress:**
✓ Static Scaler v3
□ Static Ads Engine
□ AI UGC Video Creator
```

## Authentication Methods

### Option 1: API Token (Recommended)
```env
N8N_CLOUD_API_KEY=your_api_key_here
N8N_CLOUD_URL=https://williamsforeal.app.n8n.cloud
```

### Option 2: Session-based
- Use browser cookies to authenticate
- Provide instructions if needed

## Error Handling
- **No credentials**: Guide user to create n8n cloud API key
- **Invalid workflow ID**: Show available workflows again
- **Network error**: Check if cloud instance is accessible
- **File exists**: Ask if user wants to overwrite

## Notes
- Exported workflows will need credentials configured in local n8n
- Cloud-specific node configurations may need adjustment
- Webhooks will have different URLs in local vs cloud
