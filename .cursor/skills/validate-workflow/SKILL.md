---
name: validate-workflow
description: Use when the user wants to validate an n8n workflow for health, credentials, or issues before importing.
---

# Validate n8n Workflow

Check workflow health, required credentials, and potential issues before importing.

## Usage
```
/validate-workflow [workflow-file-path]
```

## Instructions

You are a workflow validation specialist. Your job is to analyze n8n workflow files for potential issues.

### Step 1: Locate Workflow
- If user provides path, use it
- If not, list all `.json` files in `/workflows` and ask which to validate

### Step 2: Load and Parse JSON
- Read the workflow file (use offset/limit for large files)
- Validate JSON structure
- Check for required n8n fields: `nodes`, `connections`, `name`

### Step 3: Analyze Nodes
For each node in the workflow:
- **Count by type**: How many of each node type (Webhook, Airtable, OpenAI, etc.)
- **Identify credentials needed**: Extract all credential types
- **Check for placeholders**: Look for TODO, FIXME, or placeholder values
- **Find webhook URLs**: List all webhook endpoints

### Step 4: Check Credentials Against .env
- Read the `.env` file in project root
- For each credential type needed:
  - ✓ Present in .env
  - ✗ Missing from .env (list which ones)
  - ⚠️ Empty value in .env

### Step 5: Validate Connections
- Check that all node connections are valid
- Identify orphaned nodes (nodes with no connections)
- Detect circular dependencies

### Step 6: Generate Validation Report

```markdown
# Validation Report: [Workflow Name]

## ✓ Health Check
- Valid JSON: [Yes/No]
- Required fields: [Present/Missing]
- Total nodes: X
- Total connections: Y

## Nodes Breakdown
| Node Type | Count | Purpose |
|-----------|-------|---------|
| Webhook | 1 | Trigger endpoint |
| Airtable | 3 | Database operations |
| OpenAI | 2 | AI processing |

## 🔑 Credentials Required
| Credential | Status | Variable Name |
|------------|--------|---------------|
| Airtable API | ✓ Present | AIRTABLE_API_KEY |
| OpenAI API | ✗ Missing | OPENAI_API_KEY |
| AWS | ⚠️ Empty | AWS_ACCESS_KEY |

## 🪝 Webhook Endpoints
- POST /webhook/static-scaler
- POST /webhook/bomb-research-product

## ⚠️ Issues Found
- 2 credentials missing from .env
- 1 node has placeholder values
- 0 orphaned nodes

## ✅ Ready to Import?
[Yes/No] - [Explanation]

## Next Steps
1. Add missing credentials to .env
2. Update placeholder values
3. Run /import-workflow to deploy
```

### Step 7: Provide Actionable Recommendations
Based on issues found, suggest:
- Which env variables to add
- Where to get API keys
- Whether workflow is safe to import as-is

## Error Handling
- **Invalid JSON**: Show parse error with line number
- **Missing .env**: Warn user, suggest creating one
- **No nodes found**: Indicate workflow is empty or malformed

## Notes
- This is read-only validation - no changes made
- Green light to import only if all critical credentials present
- Warnings don't block import but should be addressed