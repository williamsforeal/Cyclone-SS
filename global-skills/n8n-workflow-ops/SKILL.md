---
name: n8n-workflow-ops
description: Trigger, monitor, validate, list, and import n8n workflows. Consolidates list/import/validate/export/create-stub operations against the local n8n instance at localhost:5678 and against workflow JSON files in the Cyclone-SS repo. Use when the user says "trigger n8n", "run workflow", "check n8n execution", "import workflow", "list workflows", "validate workflow", "debug failed workflow", or references workflow IDs / webhook endpoints.
---

# n8n Workflow Ops

All n8n operations from Claude Code. Trigger, monitor, validate, import, list, debug. Single skill, not five.

## Critical Rules

- Never hardcode workflow IDs from memory. Fetch IDs at runtime via the `n8n` MCP `n8n_list_workflows` tool — workflow IDs in static docs may be stale.
- Always check n8n health before triggering: `GET http://localhost:5678/api/v1/workflows` should respond 200.
- Always validate a workflow JSON before importing — check `nodes`, `connections`, `name` exist; check credentials are mapped to `.env`.
- Never auto-restart n8n. If localhost:5678 is unreachable, instruct the user to run `docker-compose up -d` and stop.
- After triggering, surface the execution ID immediately so the user can monitor.

## Operations

### List workflows
```
mcp__MCP_DOCKER__n8n_list_workflows
```
For each: name, node count, webhook endpoints, credential types needed, last modified, import status.

### Validate a workflow JSON before import
1. Read `c:\Users\Jake\williamsforeal LLC\repositories\Cyclone-SS\workflows\<name>.json`
2. Verify required fields: `nodes`, `connections`, `name`
3. Count node types, extract credential requirements
4. Check `.env` for required credentials → flag missing
5. Surface webhook endpoints
6. Look for placeholder values (TODO, FIXME, `your-key-here`)

### Import a workflow
```
mcp__MCP_DOCKER__n8n_create_workflow  # paste the validated JSON
```
Or use `import-workflow.js` script in `scripts/` if the MCP path requires manual JSON munging.

### Trigger a webhook workflow
```
mcp__MCP_DOCKER__n8n_trigger_webhook_workflow
```
Required: workflow webhook path + payload.

### Monitor an execution
```
mcp__MCP_DOCKER__n8n_get_execution
```
Required: execution ID returned at trigger time.

### Debug a failed execution
1. Get execution detail → identify failing node
2. Read node error message
3. Cross-reference with common failure table below

## Known Workflows in Cyclone-SS Repo

| File | Purpose |
|---|---|
| `workflows/static-scaler-v3.json` | Static ad generation pipeline (FAL → Airtable → BannerBear → S3) |
| `workflows/static-scaler-v3-comfyui.json` | Same pipeline, ComfyUI variant for local GPU |
| `workflows/static-scaler-v3-fixed.json` | Patched variant — see `static-scaler-v3-upgrade-guide.md` |
| `workflows/static-scaler-v3-upgraded.json` | Latest revision |
| `workflows/AI UGC Video Creator [SCALE].json` | Seedance-based UGC video pipeline |
| `workflows/Facebook Ad System [Nano] [Template].json` | FB ads system template |
| `workflows/Nano Banana Unlimited [LM].json` | LM-driven content generation |
| `workflows/WF10b-firecrawl-scraper.json` | Web scraping via Firecrawl |

> The specific workflow ID `ivINFwTVVJU0XKp6jTAwN` referenced in older docs for `static-scaler-v3` is `[VERIFY]` — fetch the current ID via `n8n_list_workflows` before triggering.

## Common Failure Modes + Fixes

| Symptom | Cause | Fix |
|---|---|---|
| fal.ai timeout in workflow | Wait node too short | Bump Wait from 30s → 60s |
| Airtable 422 in workflow | Required field null OR option name mismatch | Check field map; verify Single Select options match exactly |
| BannerBear queue stuck | Template ID wrong or image URL not reachable | Verify template + that S3 URLs are public |
| S3 upload fails | Bucket policy or env creds | Check bucket policy + AWS keys in `.env` |
| Webhook returns 404 | Workflow not active | Toggle workflow to Active in n8n UI |
| `localhost:5678` unreachable | n8n container not running | `docker-compose up -d` from repo root |

## What This Skill Does NOT Do

- Does not author new workflow JSON from scratch — that requires manual design in the n8n UI first.
- Does not modify credentials in `.env` — that's a separate user action.
- Does not interact with cloud-hosted n8n — this skill is local-only.

## References

- Consolidated from these legacy `.cursor/skills/` sub-skills:
  - `.cursor/skills/list-workflows/SKILL.md`
  - `.cursor/skills/import-workflow/SKILL.md`
  - `.cursor/skills/validate-workflow/SKILL.md`
  - `.cursor/skills/export-cloud-workflow/SKILL.md`
  - `.cursor/skills/create-workflow-stub/SKILL.md`
- Helper scripts: `scripts/import-workflow.js`, `scripts/import-workflow.bat`
- All workflow files: `c:\Users\Jake\williamsforeal LLC\repositories\Cyclone-SS\workflows\`
