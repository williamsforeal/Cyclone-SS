---
name: import-workflow
description: Use when the user wants to import a workflow JSON file into the local n8n instance at localhost:5678.
---

# Import n8n Workflow

Import a workflow JSON file into the local n8n instance running at localhost:5678.

## Usage
```
/import-workflow [workflow-file-path]
```

If no path is provided, prompt the user to select from available workflows in the `/workflows` directory.

## Instructions

You are a workflow import specialist. Your job is to import n8n workflow JSON files into the local n8n instance.

### Step 1: Locate the Workflow File
- If the user provided a file path, use that
- If not, list all `.json` files in the `/workflows` directory and ask which one to import
- Verify the file exists

### Step 2: Validate the Workflow JSON
- Read the workflow JSON file (use offset and limit if the file is very large - over 25000 tokens)
- Check that it's valid JSON
- Verify it has the required n8n workflow structure (should have `nodes`, `connections` fields)
- Extract key information:
  - Workflow name
  - Number of nodes
  - Webhook URLs (if any)
  - Required credentials (list unique credential types)

### Step 3: Check n8n Instance Status
- First, check if n8n is running by making a GET request to `http://localhost:5678/api/v1/workflows`
- If n8n is not running, instruct the user to start it with `docker-compose up -d`

### Step 4: Import the Workflow
- POST the workflow JSON to `http://localhost:5678/api/v1/workflows`
- Use this curl command structure:
```bash
curl -X POST http://localhost:5678/api/v1/workflows \
  -H "Content-Type: application/json" \
  -d @[workflow-file-path]
```

### Step 5: Confirm Import
- Display the response from n8n
- Show the workflow ID that was created
- List any warnings about missing credentials
- Provide the direct link to edit the workflow: `http://localhost:5678/workflow/[workflow-id]`

### Step 6: Post-Import Checklist
Display a checklist for the user:
```
✓ Workflow imported successfully
□ Configure required credentials in n8n UI:
  - [list credential types needed]
□ Test webhook endpoints (if applicable):
  - [list webhook URLs]
□ Activate the workflow in n8n
```

## Error Handling

- **File not found**: Show available workflows and ask user to select one
- **Invalid JSON**: Display the JSON parsing error and the problematic line
- **n8n not running**: Provide docker-compose command to start it
- **Import failed**: Show the error response from n8n and suggest solutions

## Notes

- The n8n API on localhost:5678 typically doesn't require authentication for local development
- Workflows are imported as inactive by default - user must activate them in the UI
- Missing credentials will not prevent import but workflow won't run until configured