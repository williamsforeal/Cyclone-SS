---
name: mcp-gethookd
description: Use this skill when the user asks Claude to research competitor ads, look up top-performing ads in a category, analyze spied-on brands, or pull ad library data through GetHookd. Activates whenever Jake mentions "competitor ads," "winning ads," "ad library," "spy on [brand]," or references GetHookd by name.
---

# GetHookd MCP Integration

**Purpose:** Competitor ad intelligence — search the GetHookd ad library, look up brands, retrieve top ads for a niche.

---

## TOOLS AVAILABLE

| Tool | Purpose |
|---|---|
| `search_ads` | Free-text search by query, platform, performance bucket |
| `search_brands` | Search the global brands catalog by name substring |
| `get_ad` | Pull single ad by internal `ad_id` |
| `get_brand` | Pull single brand by internal `brand_id` |
| `get_brand_spy` | Get a spied brand's detail |
| `get_top_ads` | Top-performing ads for a spied brand, ranked by performance |
| `list_brand_spies` | List the workspace's currently spied-on brands |

---

## TYPICAL WORKFLOWS

### Workflow 1 — Find top ads in Jake's category

```
1. search_brands → find competitor brand IDs
2. get_top_ads → retrieve their top performers
3. Synthesize: what hooks repeat? what angles dominate? what's saturated?
```

### Workflow 2 — Spy on a specific brand
```
1. list_brand_spies → confirm brand is being tracked
2. get_brand_spy → pull full brand intel
3. get_top_ads → current ranked winners
```

### Workflow 3 — Reverse-engineer a winning ad

```
1. get_ad with the ad_id
2. Pass output to the reverse-engineer-winners skill (in static-ad-generator mode)
3. Generate variant prompts that capture the structure without copying the brand
```

---

## SAFETY + COMPLIANCE

- **Never copy competitor brand names or literal claims** into Jake's ad copy. Use structural insights only.
- **Paraphrase customer voice** from competitor ads — never quote verbatim
- **Performance metrics from GetHookd are inferred from public ad library signals.** Flag with `[VERIFY]` when used in planning docs.

---

## HOW THIS PAIRS WITH OTHER TOOLS

| Used with | Purpose |
|---|---|
| TrendTrack | GetHookd = ad library; TrendTrack = active brand tracking + niche analysis |
| Meta Ad Library (manual) | GetHookd gives you the database; Meta Ad Library gives you the live, current state |
| static-ad-generator mode | Feed competitor winners into the reverse-engineer skill |
| dtc-second-brain mode | Drop GetHookd outputs into `raw/competitors/` for the wiki to compile |

---

## WHAT NOT TO DO

- Don't auto-pull top ads without a category or brand specified — you'll get noise
- Don't treat GetHookd performance scores as Meta-verified — they're inferred
- Don't recommend cloning a competitor's exact copy. The angle is the asset, not the wording.
