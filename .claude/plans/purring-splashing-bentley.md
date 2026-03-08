# Plan: Skills Ecosystem Expansion + Claude Code Linux Setup

## Previous work (completed)
- OpenClaw 5-agent team deployed on WSL (CTO/Ops/Build/Data/Creative)
- 5 custom OpenClaw skills deployed (ad-family, n8n-import, gcp-deploy, image-to-json, bomb-ecom-notion)
- Claude Code Windows/Cursor: 4 skills + 2 agents in Cyclone-SS/.claude/
- Claude Code WSL: 4 skills + 2 agents in ~/.claude/
- Claude Console: 5 zip files ready in C:\Users\Jake\Downloads\
- API keys secured in ~/.openclaw/.env

---

## Step 1: Self-Improving Agent Skill

Adapt the ClawHub `pskoett/self-improving-agent` pattern. Creates structured error/correction logging so agents learn from mistakes.

### Files to create:
1. `Cyclone-SS/.claude/skills/self-improving/SKILL.md` — Claude Code Windows
2. WSL `~/.claude/skills/self-improving/SKILL.md` — Claude Code Linux
3. `~/.openclaw/workspace/skills/self-improving/SKILL.md` — OpenClaw CTO (propagates to team)
4. `Coding_files/claude-console-skills/self-improving/SKILL.md` + zip — Console/Desktop

Content: When an error occurs or user corrects the agent, log it to memory. Before similar tasks, check past errors. Structured format: error, context, correction, lesson learned.

## Step 2: init-skill Scaffolder

Port `init_skill.py` as a slash command skill with embedded Python script.

### Files to create:
1. `Cyclone-SS/.claude/skills/init-skill/SKILL.md` — with `disable-model-invocation: true`
2. `Cyclone-SS/.claude/skills/init-skill/scripts/init_skill.py` — copy from Downloads
3. WSL `~/.claude/skills/init-skill/SKILL.md`
4. WSL `~/.claude/skills/init-skill/scripts/init_skill.py`

Invocation: `/init-skill my-new-skill --path .claude/skills`

## Step 3: CLAUDE.md for WSL ~/projects/bomb-ecom/

Create project-level memory file for when Claude Code opens the bomb-ecom directory on Linux.

### File to create:
- `~/projects/bomb-ecom/CLAUDE.md`

Content: Project overview, architecture map, key paths (native Linux + /mnt/c/ mappings), technical gotchas, available skills/agents list, convention rules.

## Step 4: Claude Cowork + Desktop Plan

### Claude Cowork
- Reads `.claude/` from project directory (same as Claude Code)
- Skills in Cyclone-SS/.claude/skills/ already available
- Personal skills at ~/.claude/skills/ also available
- No additional files needed

### Claude Desktop
- Upload same zip files from Downloads via Settings > Capabilities > Skills
- Same 5 zips that work for Console work for Desktop
- Add self-improving.zip and init-skill.zip once created

### Coverage Matrix (after this plan):

| Surface | Skills | Agents | CLAUDE.md |
|---------|--------|--------|-----------|
| Claude Code Windows | 6 skills | 2 agents | Cyclone-SS CLAUDE.md (existing) |
| Claude Code WSL | 6 skills | 2 agents | ~/projects/bomb-ecom/CLAUDE.md (new) |
| Claude Console | 7 skills (upload zips) | N/A | N/A |
| Claude Desktop | 7 skills (upload zips) | N/A | N/A |
| Claude Cowork | inherits from project | inherits | inherits |
| OpenClaw | 6+ custom + 50 bundled | 5 agents | workspace files |

## Verification
1. `/init-skill test-skill --path .claude/skills` scaffolds a directory
2. Self-improving triggers on errors, writes to memory
3. `~/projects/bomb-ecom/CLAUDE.md` loads in WSL Claude Code
4. Console shows all custom skills after zip upload

---

# ORIGINAL PLAN (OpenClaw team setup — completed)

## Context

Jake is building a local AI micro development team using OpenClaw on WSL/Linux. He has:
- 3 MD files (CTO-dev-team-builder.md, gem-instructions-CTO.md, notebook-LM-Prompt.md) originally written for Gemini that need revision for OpenClaw
- 7 Clawdbot-setup template files that need customization for his project
- A large knowledge base at `Coding_files/bomb-ecom-files/` with agents, skills, brand KB, workflows
- OpenClaw running at localhost:18789 on WSL
- Claude Code on Windows (Cyclone-SS repo) as the direct coding tool

**Goal:** Create a deployable set of files that configure a 5-agent team on OpenClaw, with the CTO agent as the hub, connected via Discord, rolling out in phases.

**Output location (staging):** `C:\1. Business\williamsforeal LLC\repositories\Coding_files💡\openclaw-micro-team\` (already written)

**Deployment target:** `~/projects/bomb-ecom/` on native Linux filesystem (NOT /mnt/c/)

**Knowledge strategy:** Copy files from Windows into Linux (faster I/O, no /mnt/c/ penalty)

---

## Architecture: 5 Agents (Not 10)

The original 10-role virtual team gets consolidated to 5 agents based on workflow affinity. Each agent is an isolated OpenClaw workspace with its own SOUL.md, tools, and knowledge symlinks.

| Agent ID | Name | Covers Roles | Primary Focus |
|----------|------|-------------|---------------|
| `cto` | Cyclone | CTO Architect + Product Strategy | Architecture, planning, coordination, direct chat with Jake |
| `build` | Forge | Backend + Frontend Engineering | n8n workflows, code, API integrations |
| `data` | Signal | Data Engineering + Analytics | Airtable, BigQuery, scraping, scoring |
| `creative` | Muse | Creative Generation + Automation | Static ads, ComfyUI, UGC, ad families |
| `ops` | Atlas | DevOps/Infra + Security | GCP, Docker, Linux, secrets, monitoring |

**Communication:** Hub-and-spoke. Only CTO talks to Jake (via Discord). Other agents communicate through CTO via `sessions_spawn`/`sessions_send`.

**Phase 1 deploys:** CTO + Ops only. Build/Data/Creative added later.

---

## Files to Create

### Directory Structure

```
openclaw-micro-team/
├── README.md                              # Setup guide with WSL deployment steps
├── openclaw.json                          # Main OpenClaw gateway config
├── setup.sh                               # Bash script to create symlinks + deploy to ~/.openclaw
│
├── revised-docs/                          # The 3 revised MD files
│   ├── CTO-dev-team-builder-v2.md         # Agent team manifest (5 agents, not 10)
│   ├── gem-instructions-CTO-v2.md         # Revised as CTO SOUL.md source material
│   └── notebook-LM-Prompt-v2.md           # Bootstrap audit script for CTO first-run
│
├── shared/                                # Files shared across all agent workspaces
│   └── USER.md                            # Jake's profile (same for all agents)
│
├── workspace-cto/                         # CTO Agent (Phase 1)
│   ├── AGENTS.md
│   ├── SOUL.md
│   ├── IDENTITY.md
│   ├── TOOLS.md
│   ├── HEARTBEAT.md
│   └── BOOTSTRAP.md
│
├── workspace-ops/                         # Ops Agent (Phase 1)
│   ├── AGENTS.md
│   ├── SOUL.md
│   ├── IDENTITY.md
│   ├── TOOLS.md
│   ├── HEARTBEAT.md
│   └── BOOTSTRAP.md
│
├── workspace-build/                       # Build Agent (Phase 2)
│   ├── AGENTS.md
│   ├── SOUL.md
│   ├── IDENTITY.md
│   ├── TOOLS.md
│   ├── HEARTBEAT.md
│   └── BOOTSTRAP.md
│
├── workspace-data/                        # Data Agent (Phase 2)
│   ├── AGENTS.md
│   ├── SOUL.md
│   ├── IDENTITY.md
│   ├── TOOLS.md
│   ├── HEARTBEAT.md
│   └── BOOTSTRAP.md
│
└── workspace-creative/                    # Creative Agent (Phase 2)
    ├── AGENTS.md
    ├── SOUL.md
    ├── IDENTITY.md
    ├── TOOLS.md
    ├── HEARTBEAT.md
    └── BOOTSTRAP.md
```

**Total files to create: ~35 files**

---

## Implementation Steps

### Step 1: Create directory structure
- Create `openclaw-micro-team/` and all subdirectories

### Step 2: Write `openclaw.json`
Main gateway config with:
- Gateway on port 18789
- Discord channel config (with placeholder for bot token)
- 5 agent definitions (CTO as default, 4 specialists)
- CTO: `tools.profile: "full"`, heartbeat every 30m
- Ops: `tools.profile: "coding"` + cron, deny message/browser
- Build/Data/Creative: `tools.profile: "coding"`, deny message
- Agent-to-agent sessions enabled
- Session reset: daily at 4am or after 120min idle

### Step 3: Write shared/USER.md
Jake's profile: name, timezone, company, brands, project context, communication preferences, success criteria.

### Step 4: Write CTO workspace files (Phase 1)
- **SOUL.md**: Adapted from gem-instructions-CTO.md. Contains: 5-output pattern (Decision/Plan/Verification/Risk/Next), operating principles (ship>discuss, Linux-first, no secrets in chat), 4 modes (CTO Critic, Build Coach, Incident, Design Review), team coordination protocol, project context from MEMORY.md, Definition of Done.
- **AGENTS.md**: Adapted from Clawdbot template + project-specific sections (repo paths, service URLs, inter-agent protocol, knowledge base instructions)
- **IDENTITY.md**: Name=Cyclone, Creature=AI systems architect, Vibe=Sharp and strategic
- **TOOLS.md**: Local notes (n8n URL, Cyclone-SS paths on Windows/WSL, GCP project, Airtable base)
- **HEARTBEAT.md**: Check git status, n8n health, agent sessions, notify Jake if noteworthy
- **BOOTSTRAP.md**: Verify workspace, verify tools, initialize memory, report to Discord, delete self

### Step 5: Write Ops workspace files (Phase 1)
- **SOUL.md**: DevOps specialist. GCP operations (project gen-lang-client-0234791928), Docker Compose management, Linux/WSL, security rules (no hardcoded secrets, least-privilege IAM), monitoring/logging. Sourced from gcp-engineer.md content.
- **AGENTS.md**: Same base + ops-specific knowledge paths
- **IDENTITY.md**: Name=Atlas, Vibe=Reliable and methodical
- **TOOLS.md**: Docker paths, GCP project reference, SSH details
- **HEARTBEAT.md**: Docker container status, disk usage check, notify CTO if issues
- **BOOTSTRAP.md**: Verify workspace, verify gcloud CLI available, initialize memory, report to CTO

### Step 6: Write Build/Data/Creative workspace files (Phase 2 prep)
Same pattern for each, with domain-specific SOUL.md content:
- **Build (Forge)**: n8n workflows, n8n expression gotchas (leading `=`), Vertex AI endpoints, Replit frontend, API integrations
- **Data (Signal)**: Airtable (base appvPrfjiuXIhdNuW), BigQuery, Apify scraping, AI Com scoring methodology, transcript extraction
- **Creative (Muse)**: Motion Methodology, ad families, ComfyUI, fal-ai/bria product shots, PalmAura/Abundria brand compliance, static ad templates

### Step 7: Write revised doc files
- **CTO-dev-team-builder-v2.md**: System map (current architecture), 5-agent team definitions with I/O contracts, per-agent skill directories, 5 OpenClaw-native execution playbooks, phased 90-day build plan
- **gem-instructions-CTO-v2.md**: Clean version of CTO SOUL.md as standalone reference doc
- **notebook-LM-Prompt-v2.md**: Bootstrap audit script - 7-section ecosystem review remapped to 5 agents, WSL-specific paths, phased deployment roadmap

### Step 8: Rewrite setup.sh for native Linux paths
Updated bash script that:
1. Creates `~/projects/bomb-ecom/` and `~/.openclaw/` directory structures
2. **Copies** knowledge files from `/mnt/c/.../bomb-ecom-files/` to `~/projects/bomb-ecom/knowledge/`
3. **Copies** relevant Cyclone-SS files to `~/projects/bomb-ecom/cyclone-ss/`
4. Copies workspace files to `~/.openclaw/workspace*` dirs
5. Creates local symlinks from workspace `knowledge/` dirs to `~/projects/bomb-ecom/knowledge/`
6. Copies `openclaw.json` to `~/.openclaw/`
7. Prints verification checklist
8. Includes `--refresh` flag to re-copy knowledge files from Windows

### Step 9: Update README.md with native Linux instructions

### Step 10: Update all 16 files with /mnt/c/ → ~/projects/bomb-ecom/ path changes
See "PATH MIGRATION" section above for full list of files needing updates.

---

## PATH MIGRATION (Updated)

All files that previously referenced `/mnt/c/` paths need updating to use native Linux paths:

**Old paths (slow, /mnt/c/):**
- `/mnt/c/1. Business/williamsforeal LLC/repositories/Coding_files💡/bomb-ecom-files`
- `/mnt/c/1. Business/williamsforeal LLC/repositories/Cyclone-SS`

**New paths (fast, native Linux):**
- `~/projects/bomb-ecom/` — deployment root
- `~/projects/bomb-ecom/knowledge/` — copied knowledge files
- `~/.openclaw/workspace*` — OpenClaw reads workspaces from here

### Files that need /mnt/c/ → ~/projects/bomb-ecom/ path updates:
1. `openclaw.json` — workspace paths
2. `setup.sh` — source paths, copy logic (cp instead of ln -s)
3. `workspace-cto/TOOLS.md` — repo and KB paths
4. `workspace-cto/AGENTS.md` — project resource table
5. `workspace-cto/SOUL.md` — project context paths
6. `workspace-cto/HEARTBEAT.md` — git status path
7. `workspace-cto/BOOTSTRAP.md` — git log path
8. `workspace-ops/SOUL.md` — Docker compose path
9. `workspace-ops/AGENTS.md` — resource table
10. `workspace-ops/TOOLS.md` — Docker compose path
11. `workspace-ops/BOOTSTRAP.md` — commands
12. `workspace-build/TOOLS.md` — repo/workflow paths
13. `workspace-data/TOOLS.md` — knowledge pipeline path
14. `revised-docs/CTO-dev-team-builder-v2.md` — system map paths
15. `revised-docs/notebook-LM-Prompt-v2.md` — audit command paths
16. `README.md` — installation instructions

### setup.sh changes:
- Instead of `ln -s` (symlinks to /mnt/c/), use `cp` (copy from /mnt/c/ to ~/projects/bomb-ecom/knowledge/)
- One-time copy during setup, with a `--refresh` flag to re-copy if Windows files change
- All workspace TOOLS.md paths point to `~/projects/bomb-ecom/` not `/mnt/c/`

---

## Knowledge File Mapping (Copies, Not Symlinks)

Each agent workspace gets a `knowledge/` directory. setup.sh copies files from Windows into `~/projects/bomb-ecom/knowledge/` then symlinks from workspace to that local copy.

**Source (Windows via /mnt/c/):** `/mnt/c/1. Business/williamsforeal LLC/repositories/Coding_files💡/bomb-ecom-files`
**Local copy target:** `~/projects/bomb-ecom/knowledge/`
**Repo mirror:** `~/projects/bomb-ecom/cyclone-ss/` (relevant files only)

### CTO knowledge/
- `agent-playbook.md` -> bomb-ecom/assets/williamsforeal LLC/Agent-playbook.md
- `jake-memory.md` -> bomb-ecom/knowledge-db/Jake Memory.md
- `systems-architect.md` -> bomb-ecom/agents/Systems Architect.md

### Ops knowledge/
- `gcp-engineer.md` -> Cyclone-SS/.claude/agents/gcp-engineer.md
- `gcp-deploy-skill.md` -> Cyclone-SS/.claude/skills/gcp-deploy/SKILL.md
- `google-cloud.md` -> bomb-ecom/knowledge-db/gcloud/google cloud.md

### Build knowledge/
- `n8n-skills.md` -> bomb-ecom/agents/skills/n8n-skills.md
- `n8n-airtable-skills.md` -> bomb-ecom/agents/skills/n8n-airtable-skills.md
- `systems-architect.md` -> bomb-ecom/agents/Systems Architect.md

### Data knowledge/
- `airtable-skills.md` -> bomb-ecom/agents/skills/Airtable Skils.md
- `product-research.md` -> bomb-ecom/knowledge-db/abundria-knowledge-db/product research.md
- `marketing-genius/` -> bomb-ecom/knowledge-db/abundria-knowledge-db/marketing-genius/

### Creative knowledge/
- `ad-fam-architect.md` -> bomb-ecom/agents/skills/ad-fam-architect.md
- `ad-director-instructions.md` -> bomb-ecom/agents/skills/ad-director-instructions.md
- `static-ad-generator.md` -> bomb-ecom/agents/skills/static ad generator prompt.md
- `visual-json-extractor.md` -> bomb-ecom/agents/Visual-json-extractor.md
- `comfyui-arsenal.md` -> bomb-ecom/agents/skills/COMFYUI-ARSENAL-GUIDE.md
- `brand-os/` -> bomb-ecom/knowledge-db/abundria-knowledge-db/brand-identity/01_Brand_OS/
- `creative-frameworks/` -> bomb-ecom/products/04_Creative_Frameworks/
- `psychographic-mapping/` -> bomb-ecom/products/03_Psychographic_Mapping/

---

## Verification

### Phase 1 Verification (CTO + Ops)
1. Run `setup.sh` on WSL
2. Start OpenClaw gateway: `openclaw gateway --port 18789`
3. Open web UI at localhost:18789, confirm CTO agent responds with its identity
4. Set up Discord bot (README instructions), connect channel
5. Message CTO via Discord: "What's your name and role?" - expect identity from SOUL.md
6. Message CTO: "Check Docker status" - expect CTO to delegate to Ops via sessions_spawn
7. Verify Ops agent runs `docker ps` and reports back through CTO
8. Check heartbeat cycle: CTO should check git status + n8n health every 30 min
9. Confirm Ops heartbeat checks Docker + disk usage

### Phase 2 Verification (Build + Data + Creative)
10. Deploy remaining 3 agent workspaces via setup.sh (uncomment phase 2)
11. Message CTO: "Generate an ad family for PalmAura" - expect delegation to Creative
12. Message CTO: "List n8n workflows" - expect delegation to Build
13. Message CTO: "Review Airtable schema" - expect delegation to Data

---

## Key Source Files Referenced

| Source File | Used For |
|-------------|----------|
| `Clawdbot-setup/soul.md` | Template for all SOUL.md files |
| `Clawdbot-setup/agents.md` | Template for all AGENTS.md files |
| `Clawdbot-setup/tools.md` | Template for all TOOLS.md files |
| `Clawdbot-setup/identity.md` | Template for all IDENTITY.md files |
| `Clawdbot-setup/bootstrap.md` | Template for all BOOTSTRAP.md files |
| `Clawdbot-setup/heartbeat.md` | Template for all HEARTBEAT.md files |
| `Clawdbot-setup/personal dna.md` | Template for USER.md |
| `gem-instructions-CTO.md` (attached) | Primary source for CTO SOUL.md |
| `CTO-dev-team-builder.md` (attached) | Source for team manifest revision |
| `notebook-LM-Prompt.md` (attached) | Source for bootstrap audit revision |
| `Cyclone-SS/.claude/agents/gcp-engineer.md` | Ops agent knowledge |
| `Cyclone-SS/.claude/skills/gcp-deploy/SKILL.md` | Ops agent knowledge |
| `bomb-ecom-files/agents/skills/ad-fam-architect.md` | Creative agent knowledge |
| `bomb-ecom-files/agents/skills/ad-director-instructions.md` | Creative agent knowledge |
| `bomb-ecom-files/agents/skills/n8n-skills.md` | Build agent knowledge |
| `bomb-ecom-files/agents/Systems Architect.md` | Build/CTO agent knowledge |
