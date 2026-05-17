---
name: list-workflows
description: Use when the user asks to see, list, or overview all n8n workflows in the repository.
---

# List n8n Workflows

Display a comprehensive overview of all n8n workflows in the repository.

## Usage
```
/list-workflows
```

## Instructions

You are a workflow inventory specialist. Your job is to provide a clear overview of all workflows in the project.

### Step 1: Scan the Workflows Directory
- List all `.json` files in the `/workflows` directory
- Ignore non-workflow files (README.md, .sqlite, etc.)

### Step 2: Analyze Each Workflow
For each workflow JSON file found:
- Read the workflow metadata (use offset and limit for large files - read just the first 100 lines to get metadata)
- Extract:
  - **Name**: The workflow name from the JSON
  - **Nodes**: Count of nodes in the workflow
  - **Webhook endpoints**: Any webhook URLs (look for "Webhook" nodes)
  - **Credentials needed**: Unique credential types required (Airtable, OpenAI, AWS, fal.ai, BannerBear, etc.)
  - **File size**: Size of the JSON file in KB
  - **Last modified**: When the file was last updated

### Step 3: Check Import Status (Optional)
If n8n is running (http://localhost:5678 is accessible):
- Query the n8n API to get list of imported workflows
- Match workflow names to see which ones are already imported
- Show import status: ✓ Imported | ✗ Not imported

### Step 4: Display Summary Table
Format the output as a clean table:

```
# Workflow Inventory

## Summary
- Total workflows: X
- Imported to local n8n: Y
- Pending import: Z

## Workflows

| Workflow | Nodes | Webhooks | Status | Size | Last Modified |
|----------|-------|----------|--------|------|---------------|
| Static Scaler v3 | 45 | /webhook/static-scaler | ✓ Imported | 125KB | 2026-02-09 |
| ... | ... | ... | ... | ... | ... |
```

### Step 5: Required Credentials Overview
List all unique credential types needed across ALL workflows:
```
## Credentials Needed Across All Workflows
- Airtable API
- OpenAI API
- AWS (S3)
- fal.ai
- Higgsfield
```

### Step 6: Next Steps Recommendations
Based on the analysis, suggest:
- Which workflows to import next
- Any missing workflows (based on project memory: Static Ads Engine, AI UGC Video Creator)
- Workflows that need updates or documentation

## Display Format

Use clear formatting with:
- Tables for structured data
- Emojis for status indicators (✓ ✗ ⚠️)
- File sizes in human-readable format (KB, MB)
- Dates in YYYY-MM-DD format

## Error Handling

- **No workflows found**: Indicate that the workflows directory is empty and suggest next steps
- **Invalid JSON**: Mark the workflow with ⚠️ and note "Invalid JSON"
- **n8n not running**: Skip import status check and note "Run /import-workflow to import"

## Notes

- This skill provides a read-only overview - it doesn't modify anything
- For large workflow files (>25000 tokens), only read the metadata portion
- If a workflow has documentation (.md file with same name), note it in the table