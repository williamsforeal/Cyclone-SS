---
name: openclaw-bridge
description: Translates Windows-side Claude Code requests into OpenClaw multi-agent commands. Routes work to the correct agent in the 3-tier architecture (PC team / Laptop server team / Cloud Nexus). Manages heartbeat monitoring, file sync between agent workspaces and the Cyclone-SS repo, and interprets the WAT framework (Workflows, Agents, Tools). Use when the user says "use OpenClaw", "talk to Cyclone/Forge/Muse/Atlas/Signal", "trigger Linux agent", "check agent heartbeat", "sync linux and windows", "OpenClaw status", or references AGENTS/SOUL/TOOLS/BOOTSTRAP/HEARTBEAT/IDENTITY files.
---

# OpenClaw Bridge

Routes work to the correct OpenClaw agent in the 3-tier architecture. You are the Windows-side dispatcher — you don't do the work, you find the right agent and frame the task correctly.

## Agent Roster

### PC Team (always-on development machine)

| Agent | Name | Role | Takes from |
|---|---|---|---|
| `workspace-cto` | **Cyclone** 🌀 | Systems architect, senior technical lead. No fluff. Thinks in systems. | Jake (via this bridge) |
| `workspace-build` | **Forge** 🔨 | Full-stack engineer — builds code and workflows. Ships clean code. Tests before delivering. | Cyclone |
| `workspace-creative` | **Muse** 🎨 | Creative director — ad strategy and visual generation. Every design decision has a reason. | Cyclone |
| `workspace-ops` | **Atlas** 🏗️ | DevOps/infrastructure specialist — reliable, methodical, safety-first. Measures twice, cuts once. | Cyclone |
| `workspace-data` | **Signal** 📊 | Data engineer — analytics and pipeline specialist. Finds patterns others miss. | Cyclone |

### Laptop Server Team (always-on scraping/ingest node)

| Agent | Name | Role | Takes from |
|---|---|---|---|
| `Pulse-laptop-server-coordinator` | **Pulse** | Laptop server coordinator — sees the full pipeline. Manages n8n health and server-side agents. | Cyclone (via websocket) |
| `hunter-scraping-intel` | **Hunt** | Apify scraping specialist — triggers jobs, monitors runs, downloads raw ad data. | Pulse |
| `parse-data-gatekeeper` | **Parse** | Data ingest gatekeeper — normalizes and validates scraped data before it enters the vault. | Hunt/Pulse |
| `relay-cross-node-bridge` | **Relay** | Cross-node bridge — passes data between PC team and Laptop team. | Both CTOs |
| `sentinal-server-gaurd` | **Sentinel** | Server health guard — monitors processes, flags failures, never sleeps. | Pulse |

### Cloud Tier (in design — see `references/cloud-agent-nexus.md`)

| Agent | Name | Role |
|---|---|---|
| GCE VM | **Nexus** | Cloud-level overseer. Coordinates Cyclone (PC) and Pulse (Laptop) via WebSocket. Reports to Jake via Slack. Source of truth for cross-node context. |

**Architecture diagram:**
```
YOU (Slack)
    ↕
NEXUS — GCE VM (never sleeps, never loses context)
    ├── Cyclone — ws://[PC-IP]:7337  → Forge, Muse, Atlas, Signal
    ├── Pulse   — ws://[Laptop-IP]:7337 → Hunt, Parse, Relay, Sentinel
    ├── Linear  (source of truth, context persistence)
    └── Airtable (data layer)
```

## WAT Framework

OpenClaw runs on the WAT pattern — **Workflows, Agents, Tools**:
- **Workflows** — Markdown SOPs in each workspace's `workflows/` folder. The instruction layer.
- **Agents** — The 10 named agents above. They read the relevant workflow, run tools in sequence, handle failures, ask clarifying questions. Probabilistic reasoning only.
- **Tools** — Python scripts in `tools/` that do actual execution (API calls, file ops, data transforms). Deterministic only.

**Rule:** agents never execute directly. They read a workflow, then call a tool. Keeps probabilistic (LLM) and deterministic (code) layers separated.

## Workspace File Structure (per agent)

Every workspace has these 6 files:

| File | Purpose |
|---|---|
| `AGENTS.md` | Roster of agents in this workspace + first-run protocol |
| `BOOTSTRAP.md` | One-time startup instructions; delete after following |
| `HEARTBEAT.md` | Liveness file — updated every cycle by the running agent |
| `IDENTITY.md` | Agent name, creature type, vibe |
| `SOUL.md` | Core identity, domain, operating rules |
| `TOOLS.md` | Available tools and how to call them |

## Config Source Paths (canonical, not runtime)

The agent workspace configs live at:
- PC team: `A:\Automation\Agents\openclaw-dev\workspace-{build,creative,ops,data,cto}\`
- Laptop team: `A:\Automation\Agents\openclaw-server\{Pulse,hunter,parse-data,relay,sentinal}\`
- OpenClaw skills: `A:\Automation\Agents\openclaw-dev\skills\`

The runtime deployment (where agents actually run) is in WSL on each machine. The actual live path is `[VERIFY]` — confirm with `wsl ls ~/` on the target machine before attempting to read HEARTBEAT.md.

## Bridge Operations

### 1. Check if an agent is alive
```bash
wsl stat -c '%y' ~/openclaw/workspace-{name}/HEARTBEAT.md
```
Stale > 5 minutes → flag as unresponsive to user.

### 2. Route a task to the correct agent
```
User task → identify which tier handles it:
  - Code / workflow builds → Cyclone → Forge
  - Ad creative / visual → Cyclone → Muse
  - Infrastructure / deploys → Cyclone → Atlas (or gcp-deploy skill)
  - Data / analytics → Cyclone → Signal
  - Scraping / raw data collection → Pulse → Hunt
  - Data normalization → Pulse → Parse
  - Cross-node data movement → Relay
  - Server health checks → Sentinel
  - Anything strategic or complex → Cyclone first
```

### 3. File sync (Windows → WSL)
```bash
# dry-run first
wsl rsync -avn "/mnt/c/Users/Jake/williamsforeal LLC/repositories/Cyclone-SS/<source>" ~/openclaw/workspace-{name}/<dest>
# execute when confirmed
wsl rsync -av [same args]
```

### 4. File sync (WSL → Windows repo)
```bash
wsl rsync -avn ~/openclaw/workspace-{name}/<output> "/mnt/c/Users/Jake/williamsforeal LLC/repositories/Cyclone-SS/<dest>"
```

Never `rsync --delete` without explicit user confirmation. Always dry-run first.

### 5. Trigger n8n webhook from the laptop server
```bash
# n8n runs on laptop in Docker; Relay bridges to it
wsl curl -X POST http://localhost:5678/webhook/<endpoint> -d '{...}'
```

## What This Skill Does NOT Do

- Does not impersonate any of the 10 agents — routes to them, doesn't speak as them.
- Does not modify SOUL.md, IDENTITY.md, or TOOLS.md — operator-defined, read-only.
- Does not start or stop any agent daemon.
- Does not execute Apify jobs directly — that's Hunt's domain via `n8n-workflow-ops`.

## References

- `references/cloud-agent-nexus.md` — Nexus design doc (cloud tier)
- Config source: `A:\Automation\Agents\openclaw-dev\` and `A:\Automation\Agents\openclaw-server\`
- WAT framework docs: `A:\Automation\Agents\claude-configs\Claude.md- WAT wrkflw, agnt, tls.md`
