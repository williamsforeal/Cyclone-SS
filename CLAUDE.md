# CLAUDE.md — Cyclone-SS / Bomb Ecom OS

This file is automatically loaded at the start of every Claude Code session. It is the single source of truth for how Claude understands and operates in this workspace.

---

## What This Is

**Cyclone-SS** is the main repository for the **Bomb Ecom OS** — an AI-powered DTC ad automation platform built by Jake Williams (williamsforeal LLC). It contains:

- `bom-ecom/` — React frontend (Replit-hosted)
- `workflows/` — n8n workflow JSON files
- `comfyui/` — ComfyUI submodule + custom nodes
- `.claude/context/` — Who Jake is, what he's building, current priorities (read by `/prime`)
- `.claude/plans/` — Implementation plans created by `/create-plan`
- `.claude/outputs/` — Work products and deliverables
- `.claude/reference/` — Templates, examples, reusable patterns
- `.claude/scripts/` — Automation scripts
- `.claude/skills/` — On-demand skills loaded by keyword trigger
- `.claude/commands/` — Slash commands
- `.claude/agents/` — Subagent definitions (gcp-engineer, n8n-engineer)

---

## Session Workflow

1. **Start** — Run `/prime` to load full context
2. **Work** — Direct tasks, ask questions, iterate
3. **Plan changes** — Use `/create-plan [request]` before significant additions
4. **Execute** — Use `/implement [plan-path]` to execute a plan
5. **Maintain** — Claude updates this file and `.claude/context/` when the workspace changes

---

## Commands

### /prime
Initialize a new session. Claude reads this file + all `.claude/context/` files, then confirms understanding of who Jake is, what's being built, and what's in-flight.

### /create-plan [request]
Create a detailed implementation plan before making changes. Saves to `.claude/plans/YYYY-MM-DD-[slug].md`. Use this before any non-trivial change.

Example: `/create-plan build WF1 research pipeline`

### /implement [plan-path]
Execute a plan step by step. Validates work after each step. Updates this file if the workspace structure changes.

Example: `/implement .claude/plans/2026-02-27-wf1-research-pipeline.md`

---

## Critical Technical Rules

- **n8n expressions:** The ENTIRE `jsonBody` string must start with `=` to enable expression mode. `={{ $json.val }}` inside a non-`=` string sends literal text.
- **Image generation:** NEVER use Flux Dev for product shots — it destroys product identity. Always use `fal-ai/bria/product-shot`.
- **Vertex AI:** Claude endpoint requires `"anthropic_version": "vertex-2023-10-16"` in body. See `workflows/VERTEX-AI-API-REFERENCE.md`.
- **Git:** `main` = stable, `dev` = active development. Never force-push to main.
- **Secrets:** All API keys in `.env`. Never commit secrets.

---

## Key Infrastructure

| Component        | Details                                                            |
| ---------------- | ------------------------------------------------------------------ |
| n8n              | localhost:5678 (Docker Compose, SQLite)                            |
| Airtable         | base appvPrfjiuXIhdNuW — "Static Scaler 1000"                      |
| GCP project      | gen-lang-client-0234791928, us-central1                            |
| Vertex AI        | Gemini 2.5 Pro/Flash + Claude via Vertex                           |
| OpenClaw agents  | 5 agents on WSL Linux — ~/projects/bomb-ecom/openclaw-micro-team/  |
| ComfyUI          | Local Windows (AMD GPU), localhost:8188                            |

---

## Skills (loaded on-demand by keyword)

| Skill             | Trigger phrases                                         |
| ----------------- | ------------------------------------------------------- |
| `ad-family`       | "ad family", "scale this ad", "Motion Methodology"      |
| `n8n-import`      | "import workflow", "deploy workflow", "list workflows"  |
| `gcp-deploy`      | "deploy to GCP", "Cloud Run", "push to GCR"             |
| `vertex-ai`       | "vertex", "gemini api", "claude api via vertex"         |
| `skill-creator`   | "create a skill", "build a skill", "package a skill"    |
| `mcp-integration` | "add MCP server", "configure MCP", "mcp.json"           |

---

## Maintain This File

Whenever Claude makes changes to the workspace, check:
1. Does this add new functionality users need to know about?
2. Does it modify the workspace structure documented above?
3. Should a new command or skill be listed?
4. Does `.claude/context/` need updating?

If yes — update the relevant section here.
