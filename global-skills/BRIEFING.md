# Skills Installation Briefing
**Date:** 2026-05-17  
**Session:** Global skills implementation for `~/.claude/skills/`  
**Repo path:** `Cyclone-SS/global-skills/` (this directory — synced from `C:\Users\Jake\.claude\skills\`)  
**Author:** Claude Sonnet 4.6 (via Jake Williams)

Read this if context from the original build session has been lost.

---

## What Was Built

A global Claude Code skills library installed at `C:\Users\Jake\.claude\skills\`. Every Claude Code session on this machine — in any project — auto-discovers and loads these skills. The full directory is version-controlled here at `Cyclone-SS/global-skills/`.

### Final Active Skill Count: 31

| Skill | Surface | Status | Source |
|---|---|---|---|
| `ad-family` | Code | 🟢 Deployed | `A:\Automation\Agents\openclaw-dev\skills\ad-family\` |
| `ai-marketing-team` | Code | 🟡 Built | `A:\Scale AI Skool\Claude\marketing\The AI Marketing Team Playbook.md` |
| `airtable-formula` | Code | 🟢 Deployed (pre-existing) | Original |
| `airtable-ops` | Code | 🟡 Built | Authored from `skills-registry.md §3.03` (base `appaz3BOFrhlI1MWf`) |
| `apify-actor-development` | Code | 🟢 Deployed (pre-existing) | Original |
| `apify-actorization` | Code | 🟢 Deployed (pre-existing) | Original |
| `apify-generate-output-schema` | Code | 🟢 Deployed (pre-existing) | Original |
| `apify-ultimate-scraper` | Code | 🟢 Deployed (pre-existing) | Original |
| `bomb-ecom-notion` | Code | 🟡 Built | `A:\Automation\Agents\openclaw-dev\skills\bomb-ecom-notion\` |
| `bomb-ecom-os-commander` | Code | 🟡 Built | Authored from `skills-registry.md §3.01` |
| `brand-dna-builder` | Code | 🟢 Deployed | `williamsforeal/scale-ai-foundation-skills` (fork) |
| `brand-pack-reader` | Code | 🟡 Built | `A:\AI_Training\Skills\Agents\claude-configs\mnt\…\brand-pack-reader\SKILL.md` |
| `brand-voice-profiler` | Code | 🟢 Deployed | `williamsforeal/scale-ai-foundation-skills` (fork) |
| `dtc-brand-brain` | Code | 🟢 Deployed | `C:\Users\Jake\OneDrive\Desktop\skills\dtc-brand-brain\` |
| `gcp-deploy` | Code | 🟡 Built | `A:\Automation\Agents\openclaw-dev\skills\gcp-deploy\` |
| `google-ads-audit` | Cowork+Code | 🟡 Built | `A:\Scale AI Skool\Claude\marketing\The Google Ads Dashboard Skill for Claude Cowork.md` |
| `hallucination-protocol` | All | 🟢 Deployed | `Cyclone-SS\claude-workspaces\_base\.claude\skills\hallucination-protocol\` |
| `icp-deep-dive` | Code | 🟢 Deployed | `williamsforeal/scale-ai-foundation-skills` (fork) |
| `image-to-json` | Code | 🟡 Built | `A:\Automation\Agents\openclaw-dev\skills\image-to-json\` |
| `meta-ads-audit` | Code | 🟢 Deployed | `C:\Users\Jake\OneDrive\Desktop\skills\meta-ads-audit\` |
| `morning-ads` | Cowork+Code | 🟡 Built | `A:\Scale AI Skool\Claude\cowork\The Claude Cowork Computer Use Playbook.md` |
| `n8n-import` | Code | 🟢 Deployed | `A:\Automation\Agents\openclaw-dev\skills\n8n-import\` |
| `n8n-workflow-ops` | Code | 🟡 Built | Consolidated from `Cyclone-SS\.cursor\skills\{list,import,validate,export,create-stub}-workflow\` |
| `openclaw-bridge` | Code | 🟡 Built | Authored + updated from `A:\Automation\Agents\openclaw-dev\` + `openclaw-server\` |
| `operator-mode` | All | 🟢 Deployed | `Cyclone-SS\claude-workspaces\_base\.claude\skills\operator-mode\` |
| `seedance-ugc-ads` | Code+Cowork | 🟢 Deployed | `C:\Users\Jake\OneDrive\Desktop\skills\seedance-ugc-ads (1).skill` (unzipped) |
| `shopify-store-builder` | Code | 🟡 Built | `A:\AI_Training\Skills\Agents\claude-configs\shopify-store-builder\` |
| `static-ad-generator` | Code | 🟡 Built | `A:\Scale AI Skool\Claude\code\The Claude Code Static Ad Generator Playbook.md` |
| `trigger-dev-builder` | Code | 🟡 Built | `A:\AI_Training\Skills\Agents\claude-configs\claude.md - automation teacher.md` |
| `winning-ad-translator` | Code | 🟡 Built | `kalo data.md` session spec — 6-beat Cialdini architecture, Pit Smith proof case |
| `brand-pack-reader` | Code | 🟡 Built | `mnt/user-data/outputs/SHOPIFY-STORE-BUILD-TEMPLATE/` |

### Also Installed (no SKILL.md changes needed)
- `vertex-ai` — (pre-existing in project `.claude/skills/`)

---

## Directory Structure at `~/.claude/skills/`

```
~/.claude/skills/
├── REGISTRY.md                  ← canonical source of truth for all skills
├── _master-prompts/             ← chat-surface prompts (not skills), with INDEX.md
│   ├── INDEX.md
│   ├── ai_campaign_manager_v2.md
│   ├── bomb_scrape_research.md
│   ├── dtc_store_architect.md   ← DTC Website Architect system prompt (Store Architect.md)
│   ├── ecom_growth_architect.md
│   ├── gem_ad_family_architect.md
│   ├── marketing_analyst_intelligence.md
│   ├── second_brain_setup.md
│   ├── ui_design_rules.md
│   └── williamsforeal_notebooklm.md
├── _deferred/                   ← 19 P1/P2/P3 stubs (not yet activated)
│   └── <19 folders, each with SKILL.md [STUB] + _buildlist.md>
├── <31 active skill folders>
└── <loose files — see note below>
```

### Loose files in skills dir (not skills — need cleanup)
These exist at the `~/.claude/skills/` root and should not be there:
- `CLAUDE front end des.md` → belongs in `_master-prompts/`
- `CLAUDE.md - ui design.md` → already copied to `_master-prompts/ui_design_rules.md`
- `claude code bus_DNA.txt` → already copied to `_master-prompts/second_brain_setup.md`
- `gemini project org.md` → check if this has content worth keeping
- `image to json.md` → content of this is now the `image-to-json` skill
- `mcp.json` → Trigger.dev MCP config, also in `trigger-dev-builder/references/mcp-config.json`
- `trigger-ref.md` → check if needed
- `Executive Assistant Initialize Prompt (1).txt` → review for _master-prompts
- `Clawdbot-setup/` → OpenClaw workspace setup files (agents.md, soul.md, etc.) — WRONG LOCATION. Actual dir is `C:\Users\Jake\Clawdbot-setup\`
- `excalidraw-visuals/` → design assets, not a skill
- `Ultimate Media Agent Army (1)/` → n8n JSON tools, not a skill
- `seedance-ugc-ads (1).skill` → redundant .zip, already extracted

---

## Source Directories Surveyed This Session

| Drive/Path | Contents | Skills extracted |
|---|---|---|
| `A:\Scale AI Skool\Claude\code\` | Scale AI playbooks | static-ad-generator, TikTok slideshow ref |
| `A:\Scale AI Skool\Claude\cowork\` | Cowork playbooks | morning-ads, seedance ref |
| `A:\Scale AI Skool\Claude\marketing\` | Marketing playbooks | ai-marketing-team, google-ads-audit |
| `A:\Scale AI Skool\Claude\claude-workspaces\_modes\` | Workspace modes (MODE.md format) | Left as modes — NOT skills |
| `A:\Automation\Agents\openclaw-dev\skills\` | OpenClaw Code skills | ad-family, bomb-ecom-notion, n8n-import, image-to-json, gcp-deploy |
| `A:\Automation\Agents\openclaw-dev\workspace-*\` | OpenClaw agent workspace files | Updated openclaw-bridge SKILL.md |
| `A:\Automation\Agents\openclaw-server\` | Laptop server agents | Updated openclaw-bridge SKILL.md |
| `A:\Automation\Agents\claude-configs\` | Workspace configs | shopify-store-builder, trigger-dev-builder, brand-pack-reader, mcp-integration/shopify |
| `A:\AI_Training\Master_Prompts\` | Master prompts | 5 files → _master-prompts/ |
| `A:\AI_Training\Skills\Agents\claude-configs\` | Additional configs | shopify-store-builder source, trigger-dev, marketing-analyst |
| `C:\Users\Jake\OneDrive\Desktop\skills\` | Ready-format skills | dtc-brand-brain, meta-ads-audit, seedance-ugc-ads |
| `Cyclone-SS\.cursor\skills\` | Cursor IDE skills | n8n-workflow-ops (consolidated) |
| `Cyclone-SS\claude-workspaces\_base\.claude\skills\` | Base workspace skills | hallucination-protocol, operator-mode |
| `williamsforeal/scale-ai-foundation-skills` (GitHub fork) | SCALE AI foundation | brand-dna-builder, brand-voice-profiler, icp-deep-dive |

---

## OpenClaw Agent Roster (for openclaw-bridge)

### PC Team (development machine)
| Agent | Workspace | Role |
|---|---|---|
| Cyclone 🌀 | `workspace-cto` | Systems architect / CTO |
| Forge 🔨 | `workspace-build` | Full-stack engineer |
| Muse 🎨 | `workspace-creative` | Creative director |
| Atlas 🏗️ | `workspace-ops` | DevOps / infrastructure |
| Signal 📊 | `workspace-data` | Data engineer |

### Laptop Server Team
| Agent | Dir | Role |
|---|---|---|
| Pulse | `Pulse-laptop-server-coordinator` | Coordinator / CTO of laptop team |
| Hunt | `hunter-scraping-intel` | Apify scraping specialist |
| Parse | `parse-data-gatekeeper` | Data ingest / validation |
| Relay | `relay-cross-node-bridge` | Cross-node data bridge |
| Sentinel | `sentinal-server-gaurd` | Server health monitor |

### Cloud Tier (in design)
| Agent | Where | Role |
|---|---|---|
| Nexus | GCE VM (planned) | Cloud coordinator — Slack-connected, never sleeps |

**Config sources:**
- PC team workspaces: `A:\Automation\Agents\openclaw-dev\workspace-*\`
- Server agents: `A:\Automation\Agents\openclaw-server\`
- Clawdbot-setup dir: `C:\Users\Jake\Clawdbot-setup\` (agents.md, soul.md, identity.md, bootstrap.md, heartbeat.md, tools.md, personal dna.md)

---

## Architecture Gap — Single SKILL.md vs. Production-Grade 4-File Pattern

The `skill refiner.md` document (from this session) identifies that current skills are single SKILL.md files. Production-grade skills (per Mike Futia's pattern in the SCALE AI fork) follow a 4-file structure:

```
skill-name/
├── SKILL.md              ← YAML frontmatter + protocol (thin wrapper)
├── README.md             ← human-facing install + usage docs
├── scripts/              ← actual implementation (Python/Node/Bash)
│   └── run.py
├── references/           ← templates, schemas, checklists (optional)
└── .gitignore
```

**Key frontmatter fields the pattern demands (not all currently in place):**
```yaml
disable-model-invocation: true   # forces explicit user request
allowed-tools: Bash, Read        # security: minimum viable surface
argument-hint: <required> [--opt]
```

**Verdict:** Current skills function correctly for discovery and Claude guidance, but lack:
- `scripts/` (Python implementations for tools that need them)
- `README.md` (install/use docs)
- `disable-model-invocation` and `allowed-tools` frontmatter
- `.gitignore`

**Priority for upgrade:** Skills that call external APIs (static-ad-generator → generate_ads.py, seedance-ugc-ads already has scripts/, meta-ads-audit) should be upgraded first. Pure-guidance skills (airtable-ops, shopify-store-builder) can stay single-SKILL.md.

---

## Skills to Build Next

Ordered by leverage:

| # | Skill | Why now | Pattern |
|---|---|---|---|
| 1 | `aicom-product-validator` | First gate in the product pipeline — PalmAura + future drops need it | 4-file: validate.py calls Claude Opus with 11-point checklist |
| 2 | `aicom-decision-log` | Simplest 4-file test case. Append-only markdown writer, zero API calls. Tests the full template with no blast radius | 4-file: log.py appends to decisions.md |
| 3 | `dtc-store-architect` | Comprehensive DTC Website Architect (see `_master-prompts/dtc_store_architect.md`) — the Store Architect.md document from this session is the full spec | Wrap the system prompt as a triggerable skill |
| 4 | `video-analyzer` | Already in fork (`williamsforeal/scale-ai-foundation-skills`). Pull and install. Gemini video analysis tool. Used by Scout/Muse for ad teardowns | Clone from fork, symlink |
| 5 | `aicom-break-even-calc` | Simple math tool — COGS + price + AOV → break-even ROAS | 4-file: calc.py, pure math |

---

## Key Files to Know

| File | Path | Purpose |
|---|---|---|
| Skills registry | `~/.claude/skills/REGISTRY.md` | Master index of all 30+ skills |
| This briefing | `Cyclone-SS/global-skills/BRIEFING.md` | This document |
| Skill refiner doc | Session attachment `skill refiner.md` | Architecture pattern analysis |
| DTC Store Architect | `~/.claude/skills/_master-prompts/dtc_store_architect.md` | Full DTC Website Architect system prompt |
| Winning Ad Translator spec | Session attachment `kalo data.md` | 6-beat architecture + Pit Smith proof case |
| OpenClaw bridge | `~/.claude/skills/openclaw-bridge/references/cloud-agent-nexus.md` | Nexus design doc |
| Brand DNA builder | `~/.claude/skills/brand-dna-builder/` | Foundation skill — run before all others |
| Clawdbot-setup | `C:\Users\Jake\Clawdbot-setup\` | OpenClaw workspace setup (soul.md, agents.md, etc.) |

---

## Skills Deployment Rule

**Current discovery method:** Claude Code scans `~/.claude/skills/*/SKILL.md` for YAML frontmatter with `name:` and `description:` fields.

**Future deployment pattern (per skill refiner):**
```bash
git clone https://github.com/williamsforeal/scale-ai-foundation-skills.git ~/scale-skills
ln -s ~/scale-skills/<skill-name> ~/.claude/skills/<skill-name>
```

This makes skills git-versioned and portable. New machine = clone + symlink + done.

**Current state:** Skills are flat copies, not symlinks. They live in `~/.claude/skills/` directly. Also copied to `Cyclone-SS/global-skills/` for version control.

---

## Airtable Schema (for airtable-ops)

**Base ID:** `appaz3BOFrhlI1MWf`

| Table | Key fields | Status flow |
|---|---|---|
| Projects | Name, Brand, Product Image, Logo, Brand Colors, Status | — |
| Ad Copy | Project (link), Angle, Avatar Target, Headline, Description, Primary Text, Status | Draft → Ready → Testing → Winner → Retired |
| Static Creatives | Project (link), Ad Copy (link), Creative Type, Aspect Ratio, Image, Prompt, Error, Status | Queued → Running → Success → Fail |
| Winning Ads Library | ad_id (unique), hook_type, visual_formula, avatar_implied, awareness_level, replication_rating | — |

---

## n8n Workflows in Cyclone-SS/workflows/

| File | Purpose |
|---|---|
| `static-scaler-v3.json` | Static ad generation (FAL → Airtable → BannerBear → S3) |
| `static-scaler-v3-comfyui.json` | Same, ComfyUI local GPU variant |
| `static-scaler-v3-fixed.json` | Patched variant |
| `static-scaler-v3-upgraded.json` | Latest revision |
| `AI UGC Video Creator [SCALE].json` | Seedance-based UGC video pipeline |
| `Facebook Ad System [Nano] [Template].json` | FB ads system template |
| `Nano Banana Unlimited [LM].json` | LM-driven content pipeline |
| `WF10b-firecrawl-scraper.json` | Firecrawl web scraping |

> Static-scaler-v3 workflow ID from old docs: `ivINFwTVVJU0XKp6jTAwN` — **[VERIFY]** with n8n MCP at runtime.

---

## Immediate Next Actions (as of 2026-05-17)

1. **Clean the loose files** from `~/.claude/skills/` root — move to appropriate locations or delete
2. **Move `Clawdbot-setup/` out** of `~/.claude/skills/` — it doesn't belong there. The real dir is `C:\Users\Jake\Clawdbot-setup\`
3. **Build `aicom-decision-log`** — simplest 4-file skill, tests the production pattern with zero blast radius
4. **Build `aicom-product-validator`** — first gate in the product validation pipeline
5. **Pull `video-analyzer` from the fork** — it's already there, just not installed
6. **Run `brand-dna-builder` on PalmAura and Pit Smith** — creates the foundation files everything else reads
7. **Run `brand-voice-profiler`** on both after DNA is done
8. **Run `icp-deep-dive`** on both after voice is done

---

## Brands and Products Reference

| Brand | Product | Stage | Store |
|---|---|---|---|
| Abundria / Palm Aura | Heated hand massager | Active test (dropship) | abundria.store |
| Pit Smith Co. | Pit Smith Pro Cordless Electric Grill Brush | In build (Father's Day campaign) | pitsmithco.com |
| williamsforeal LLC | Parent co. | Holding | — |

**Pit Smith offer:** The Summer Pitmaster Bundle — brush + 2 replacement heads + heat-resistant mitt + Pitmaster's Playbook. $89.99, compare-at $335.94. 60-Day Pitmaster Promise.

**Abundria offer stack (Palm Aura):** Device + USB-C + Hand Health Playbook + 7-Day Relief Challenge + 60-Day Relief Guarantee.

---

## Claude Code Settings Location

Global settings: `C:\Users\Jake\.claude\settings.json`  
Project settings: `Cyclone-SS\.claude\settings.local.json` (user just opened this)  
Skills: `C:\Users\Jake\.claude\skills\`  
Plans: `C:\Users\Jake\.claude\plans\`  
Memory: `C:\Users\Jake\.claude\projects\c--Users-Jake-williamsforeal-LLC-repositories-Cyclone-SS\memory\`
