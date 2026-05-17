# williamsforeal LLC — Skills Registry

**Single source of truth for every skill, MCP, and external tool across the BOMB ECOM OS stack.**

- **Owner:** Jake / williamsforeal
- **Last audited:** 2026-05-17
- **Canonical location:** `C:\Users\Jake\.claude\skills\REGISTRY.md` (also committed to `Cyclone-SS/skills-registry.md`)
- **Update cadence:** Edit on every skill add/promote/retire. Full audit quarterly.

---

## 0. How To Use This Doc

1. **Building a new skill?** Add a stub in §3 *before* writing code.
2. **Looking for a skill?** §1 Master Index is sortable in any editor. Filter by Status or Surface.
3. **Wiring a new MCP?** Log it in §4 with scope and which skills depend on it.
4. **Onboarding a new agent / collaborator?** Send them this file and `CLAUDE.md`. Nothing else.
5. **Quarterly audit?** Run §8 procedure. Retire dead skills. Promote proven ones.

**Rule:** A skill that isn't in this registry doesn't exist. If you find one in the wild, either register it or delete it.

---

## 1. Master Index

### Status Legend
- 🟢 **Deployed** — Live, tested, in active use
- 🟡 **Built** — File exists locally, not yet deployed/tested at scale
- 🟠 **Spec'd** — Designed in docs, no SKILL.md yet
- 🔴 **Planned** — Concept only, not yet designed
- ⚪ **Retired** — Replaced or deprecated

### Priority Legend
- **P0** — Core pipeline. Without it, the system doesn't run.
- **P1** — Intelligence layer. Compounds value of P0.
- **P2** — Automation polish. Removes manual touches.
- **P3** — Reserve / nice-to-have.

| # | Skill ID | Surface | Priority | Status | MCPs | Last Tested |
|---|---|---|---|---|---|---|
| 01 | `bomb-ecom-os-commander` | Code | P0 | 🟡 | airtable, n8n, filesystem | 2026-05-17 |
| 02 | `static-ad-generator` | Code | P0 | 🟡 | filesystem (FAL via env) | 2026-05-17 |
| 03 | `airtable-ops` | Code | P0 | 🟡 | airtable | 2026-05-17 |
| 04 | `n8n-workflow-ops` | Code | P0 | 🟡 | n8n | 2026-05-17 |
| 05 | `openclaw-bridge` | Code | P0 | 🟡 | filesystem | 2026-05-17 |
| 06 | `seedance-ugc-ads` | Cowork+Code | P0 | 🟢 | fal.ai (env), filesystem | 2026-05-17 |
| 07 | `dtc-brand-brain` | Cowork+Code | P0 | 🟢 | filesystem | 2026-05-17 |
| 08 | `morning-ads` | Cowork | P0 | 🟡 | Meta Ads (browser/GoMarble), Slack | — |
| 09 | `ad-forensic-analyst` | Code | P1 | 🟠 | airtable, gethookd | — |
| 10 | `prompt-compiler` | Code | P1 | 🟠 | filesystem | — |
| 11 | `comfyui-dispatcher` | Code | P1 | 🟠 | filesystem (ComfyUI API local) | — |
| 12 | `linux-windows-sync` | Code | P1 | 🟠 | filesystem | — |
| 13 | `ai-marketing-team` | Code | P1 | 🟡 | filesystem (5 sub-agents) | 2026-05-17 |
| 14 | `competitor-ad-monitor` | Cowork→MA | P1 | 🔴 | apify, slack | — |
| 15 | `customer-review-digester` | Cowork→MA | P1 | 🔴 | judge.me/yotpo, slack | — |
| 16 | `friday-executive-brief` | MA | P1 | 🔴 | reads brand-brain, slack | — |
| 17 | `meta-hook-writer` | Chat | P1 | 🟡 | — | — |
| 18 | `creative-brief-generator` | Chat | P1 | 🟡 | — | — |
| 19 | `bannerbear-compositor` | n8n/Code | P2 | 🟠 | bannerbear (HTTP) | — |
| 20 | `s3-uploader` | n8n/Code | P2 | 🟠 | s3 (HTTP) | — |
| 21 | `winning-ads-library` | Code | P2 | 🟠 | airtable | — |
| 22 | `gemini-research-bridge` | Code | P2 | 🟠 | filesystem | — |
| 23 | `google-ads-audit` | Cowork | P2 | 🟡 | google ads (browser) | 2026-05-17 |
| 24 | `meta-ads-audit` | Cowork+Code | P2 | 🟢 | meta ads (browser) | 2026-05-17 |
| 25 | `seo-article-gen` | Cowork | P2 | 🔴 | web search | — |
| 26 | `canva-connect` | Cowork | P2 | 🔴 | canva | — |
| 27 | `cursor-workflow` | Code | P3 | 🔴 | filesystem | — |
| 28 | `data-analyst` | Code | P3 | 🔴 | airtable, supabase | — |
| 29 | `price-tracker` | Code | P3 | 🔴 | apify | — |
| 30 | `self-improving-agent` | All | P3 | 🔴 | filesystem | — |

**Public skills (Anthropic-provided, always available):**
`docx` · `pptx` · `xlsx` · `pdf` · `frontend-design` · `canvas-design` · `theme-factory` · `skill-creator` · `mcp-builder` · `web-artifacts-builder` · `content-design` · `file-reading` · `pdf-reading` · `product-self-knowledge`

---

## 2. Skills By Surface

### 2A. Claude Code — `C:\Users\Jake\.claude\skills\` (global, all sessions)

**Purpose:** Filesystem, scripts, API loops, repo work. The builder.

Active P0:
- `bomb-ecom-os-commander` — master orchestrator
- `static-ad-generator` — 40+ ads/run via FAL + GPT-Image-2
- `airtable-ops` — CRUD on `appaz3BOFrhlI1MWf`
- `n8n-workflow-ops` — trigger + monitor n8n workflows
- `openclaw-bridge` — maps Linux agent files into Code
- `dtc-brand-brain` — Karpathy-style brand knowledge base
- `seedance-ugc-ads` — multi-shot UGC video pipeline (also Cowork)
- `meta-ads-audit` — CSV-driven Meta Ads scorecard

Deferred (under `_deferred/`):
- All P1/P2/P3 skills in 🟠/🔴 status above

### 2B. Cowork — Claude Desktop Skills

**Purpose:** Computer use, scheduled tasks, multi-step Mac workflows.

Installed via Settings → Skills → Install from file:
- `seedance-ugc-ads.skill` (also available globally)
- `dtc-brand-brain.zip` (also available globally)
- `morning-ads` (SCALE AI ships)
- `meta-ads-audit` (SCALE AI ships)
- `google-ads-audit` (SCALE AI ships)
- `seo-article-gen` (SCALE AI ships)
- `canva-connect` (SCALE AI ships)

### 2C. Claude.ai — Chat + Project

**Purpose:** Strategic reasoning, copy, prompt design, multi-doc synthesis.

Used as **prompts loaded in Project knowledge**, not as SKILL.md files. Stored at `C:\Users\Jake\.claude\skills\_master-prompts\`:
- `bomb_scrape_research.md` (canonical source: `A:\AI_Training\Master_Prompts\`)
- `williamsforeal_notebooklm.md`
- `ai_campaign_manager_v2.md`
- `ecom_growth_architect.md`
- `gem_ad_family_architect.md`

### 2D. Managed Agents (Cloud-Hosted)

**Purpose:** Run on schedule without your Mac. Migration targets for proven Cowork skills.

Target migrations (Q3 2026):
- `morning-ads` → "Daily Performance Analyst" agent
- `competitor-ad-monitor` → "Competitor Ad Monitor" agent
- `customer-review-digester` → "Customer Review Digester" agent
- `creative-performance-reviewer` → "Weekly Creative Reviewer" agent
- `friday-executive-brief` → "Friday Executive Brief" agent

---

## 3. Skill Detail Cards

Each skill's full detail card lives in `C:\Users\Jake\.claude\skills\<skill-name>\SKILL.md`. For deferred skills, see `_deferred/<skill-name>/SKILL.md` (stub) and `_buildlist.md` (build checklist).

For the canonical detail-card schema and full build checklists for every skill, see `Cyclone-SS/skills-registry.md` §3.

---

## 4. MCP Server Registry

| MCP | Status | Used By | Scope | Notes |
|---|---|---|---|---|
| `airtable` | 🟢 connected | airtable-ops, bomb-ecom-os-commander | Base `appaz3BOFrhlI1MWf` | Verify monthly |
| `n8n` | 🟢 connected | n8n-workflow-ops | localhost:5678 | Local only — bridge to cloud later |
| `filesystem` | 🟢 connected | All Code skills | Cyclone-SS repo root | Set in `.claude/settings.json` |
| `shopify` | 🟡 install needed | future shopify-ops skill | `read_products,write_products` to start | Add via `/plugin marketplace add Shopify/shopify-ai-toolkit` |
| `gethookd` | 🟢 connected | ad-forensic-analyst | All scopes | $59/mo subscription |
| `trendtrack` | 🟢 connected | competitor-ad-monitor | API key configured | — |
| `supabase` | 🟢 connected | RAG pipelines | Project Demo 2.22.25 | — |
| `notion` | 🟢 connected | brand-brain optional | — | Used for campaign logs |
| `figma` | 🟢 connected | claude-design handoff | — | Optional, design system |
| `canva` | 🟢 connected | canva-connect | — | — |
| `google-drive` | 🟢 connected | RAG triggers | — | n8n watches RAG folder |
| `gmail` | 🟢 connected | routing workflow | — | Pattern from `Routing.json` |
| `linear` | 🟢 connected | task management | — | Optional |
| `mermaid` | 🟢 connected | diagrams | — | For docs |
| `apify` | 🔴 add | scrapers (FB Ad Library, reviews, AliExpress) | — | Needed for competitor-ad-monitor |
| `gomarble` | 🔴 add | morning-ads agent (Managed) | Meta + GA4 | For cloud migration |
| `slack` | 🔴 add | all agent outputs | `chat:write` to brief channels | — |

---

## 5. External Tool Registry

| Tool | Purpose | Subscription | Critical? |
|---|---|---|---|
| **GetHookd** | Ad library + Trend Radar + DNA Multiplier | $59/mo | Yes |
| **TrendTrack** | Brand spy, competitor monitoring | Subscription | Yes |
| **fal.ai** | GPT-Image-2, Seedance, Flux models | Per-use ($20+ credit) | Yes |
| **Anthropic API** | Claude calls outside chat | Per-token | Yes |
| **Google Gemini API** | Video analysis in GetHookd app | Per-token | Yes |
| **OpenAI API** | Optional (Veo, alt models) | Per-token | Optional |
| **Apify** | AliExpress, Reviews, FB Ad Library scrapers | ~$50/mo cap | Yes |
| **Shopify** | Storefronts (PalmAura, Abundria) | Per-plan | Yes |
| **Airtable** | Operations DB | Pro plan | Yes |
| **n8n** | Workflow orchestration | Self-hosted | Yes |
| **Supabase** | RAG vector DB | Free tier → upgrade | Yes |
| **BannerBear** | Final image composite | Per-use | Yes (for ads pipeline) |
| **S3 / R2** | CDN + asset storage | Per-GB | Yes |
| **Replit** | GetHookd app + Meta Analyzer app | Free → upgrade as needed | Yes |
| **ComfyUI** | Local image gen (RX 9060 XT) | Free / hardware | Optional |

---

## 6. Cost Tracking

Update weekly. Hard guardrails:
- Apify AliExpress: ~$1.50/1k items
- Apify Reviews: ~$2/1k reviews
- Apify FB Ads Library: ~$0.75/1k ads
- Cap `maxItems` on every actor call

---

## 7. Skill Build Checklist Template

Copy this for every new skill before writing code.

```markdown
### New Skill: `[skill-name]`

**Status:** 🔴 Planned

**Purpose (1 sentence):**
[What it does, why it exists]

**Surface:** [Code / Cowork / Chat / Managed Agent]

**Triggers (when Claude auto-loads):**
- "[phrase 1]"
- "[phrase 2]"

**MCP dependencies:** [list]

**External dependencies:**
- API keys: [list]
- Env vars: [list]
- Tool installs: [list]

**Inputs:** [what it consumes]
**Outputs:** [what it produces — files, table writes, Slack messages]
**Cost per run:** [estimate]

**Test plan:**
- [ ] Unit: skill loads on trigger
- [ ] Integration: produces expected output on test case
- [ ] Regression: re-run after MCP changes
- [ ] Cost: actual cost within estimate
```

---

## 8. Quarterly Audit Procedure

Run every 3 months. Update **Last audited** date at the top.

### Step 1 — Verify Status
Confirm every Status column. Demote skills not run in 90 days to ⚪ Retired (unless seasonal).

### Step 2 — Cost Reconciliation
Plug actual spend into §6. Flag any tool where actual > 1.5x cap.

### Step 3 — MCP Health Check
```powershell
Get-Content "$env:USERPROFILE\.claude\settings.json" | ConvertFrom-Json |
  Select-Object -ExpandProperty mcpServers |
  Format-List
```
Ping each MCP endpoint in §4. Update Status column.

### Step 4 — Skill File Validation
```powershell
Get-ChildItem "$env:USERPROFILE\.claude\skills\*\SKILL.md" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    [PSCustomObject]@{
        Skill = $_.Directory.Name
        HasFrontmatter = $content -match '^---'
        HasName = $content -match 'name:'
        HasDescription = $content -match 'description:'
    }
}
```
Any skill missing frontmatter or description is broken.

### Step 5 — Promote / Retire
- **Promote** 🟡 Built → 🟢 Deployed after 30+ days clean runs.
- **Promote** from `_deferred/` to top-level when ready to activate.
- **Retire** any skill not used in 90 days. Move to `_retired/`.

### Step 6 — Update Registry
Edit this file. Bump **Last audited** date.

---

## 9. The Operating Principle

> **A skill exists if it's in this registry. A skill works if it's been tested in the last 30 days. A skill stays if it earned its keep last quarter.**

Build → Test → Register → Audit → Repeat.
