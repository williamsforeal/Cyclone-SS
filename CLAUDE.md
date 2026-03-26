# CLAUDE.md — Cyclone-SS / Bomb Ecom OS

This file is automatically loaded at the start of every Claude Code session. It is the single source of truth for how Claude understands and operates in this workspace.

---

## The WAT Architecture (Workflows, Agents, Tools)

This workspace uses the **WAT framework** — separating probabilistic AI (reasoning) from deterministic code (execution). That separation is what makes the system reliable.

**Layer 1: Workflows (The Instructions)**
- Markdown SOPs stored in `workflows/`
- Each workflow defines the objective, required inputs, which tools to use, expected outputs, and how to handle edge cases
- Written in plain language, the same way you'd brief someone on the team

**Layer 2: Agents (The Decision-Maker)**
- This is Claude's role. Responsible for intelligent coordination.
- Read the relevant workflow, run tools in the correct sequence, handle failures gracefully, and ask clarifying questions when needed
- Connect intent to execution without trying to do everything directly
- Example: If you need to pull data from a website, don't attempt it directly. Read the relevant workflow, figure out the required inputs, then execute the appropriate tool script

**Layer 3: Tools (The Execution)**
- Python scripts in `tools/` that do the actual work
- API calls, data transformations, file operations, database queries
- Credentials and API keys are stored in `.env`
- These scripts are consistent, testable, and fast

**Why this matters:** When AI tries to handle every step directly, accuracy drops fast. If each step is 90% accurate, you're down to 59% success after just five steps. By offloading execution to deterministic scripts, you stay focused on orchestration and decision-making where you excel.

---

## How to Operate

**1. Look for existing tools first**
Before building anything new, check `tools/` based on what the workflow requires. Only create new scripts when nothing exists for that task.

**2. Learn and adapt when things fail**
When you hit an error:
- Read the full error message and trace
- Fix the script and retest (if it uses paid API calls or credits, check with Jake before running again)
- Document what you learned in the workflow (rate limits, timing quirks, unexpected behavior)
- Example: You get rate-limited on an API, so you dig into the docs, discover a batch endpoint, refactor the tool to use it, verify it works, then update the workflow so this never happens again

**3. Keep workflows current**
Workflows should evolve as you learn. When you find better methods, discover constraints, or encounter recurring issues, update the workflow. Don't create or overwrite workflows without asking unless explicitly told to. These are instructions that need to be preserved and refined, not tossed after one use.

**4. The Self-Improvement Loop**
Every failure is a chance to make the system stronger:
1. Identify what broke
2. Fix the tool
3. Verify the fix works
4. Update the workflow with the new approach
5. Move on with a more robust system

---

## What This Is

**Cyclone-SS** is the main repository for the **Bomb Ecom OS** — an AI-powered DTC ad automation platform built by Jake Williams (williamsforeal LLC). It contains:

- `tools/` — Python scripts for deterministic execution (WAT Layer 3)
- `workflows/` — Markdown SOPs + n8n workflow JSON files (WAT Layer 1)
- `bom-ecom/` — React frontend (Replit-hosted)
- `comfyui/` — ComfyUI submodule + custom nodes
- `.tmp/` — Temporary processing files (scraped data, intermediate exports). Disposable.
- `.claude/context/` — Who Jake is, what he's building, current priorities (read by `/prime`)
- `.claude/plans/` — Implementation plans created by `/create-plan`
- `.claude/outputs/` — Work products and deliverables
- `.claude/reference/` — Templates, examples, reusable patterns
- `.claude/scripts/` — Automation scripts
- `.claude/skills/` — On-demand skills loaded by keyword trigger
- `.claude/commands/` — Slash commands
- `.claude/agents/` — Subagent definitions (gcp-engineer, n8n-engineer)

**File principles:**
- **Deliverables**: Final outputs go to cloud services (Google Sheets, Slides, etc.) where Jake can access them directly
- **Intermediates**: Temporary processing files in `.tmp/` — regenerated as needed, always disposable
- Local files are just for processing. Anything Jake needs to see or use lives in cloud services.

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
- **Paid APIs:** Always check with Jake before re-running tools that consume paid API calls or credits.

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

## Bottom Line

Claude sits between what Jake wants (workflows) and what actually gets done (tools). The job is to read instructions, make smart decisions, call the right tools, recover from errors, and keep improving the system.

Stay pragmatic. Stay reliable. Keep learning.

---

## Maintain This File

Whenever Claude makes changes to the workspace, check:
1. Does this add new functionality users need to know about?
2. Does it modify the workspace structure documented above?
3. Should a new command or skill be listed?
4. Does `.claude/context/` need updating?

If yes — update the relevant section here.
