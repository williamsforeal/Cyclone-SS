---
name: mcp-trendtrack
description: Use this skill when the user asks Claude to track competitor brands, find similar shops, analyze a niche, run a daily brand radar, find winning products in a category, search active Meta ads, or analyze marketing emails. Activates whenever Jake mentions TrendTrack by name, "tracked brands," "competitor radar," "winning products in [niche]," or similar.
---

# TrendTrack MCP Integration

**Purpose:** Continuous brand + niche intelligence — tracked brand monitoring, niche scans, daily change radar, winning product discovery.

---

## TOOLS AVAILABLE

| Tool | Purpose |
|---|---|
| `list_tracked_brands` | List brands the workspace is tracking |
| `analyze_tracked_brand` | Deep-analyze one tracked brand |
| `analyze_brand_changes` | Recent changes for a tracked brand — new ads, hooks, messaging |
| `analyze_shop_emails` | Analyze a shop's email strategy from captured emails |
| `find_similar_shops` | Find competitors / similar shops for a reference shop |
| `find_winning_products` | Currently relevant winning products in a niche |
| `daily_radar` | Last-24h digest across up to 25 tracked brands |
| `search_ads` | Search active Meta ads by copy, brand, domain, URL, category |
| `search_advertisers` | Search Meta/Facebook advertisers by brand name / domain / page |
| `search_emails` | Search marketing emails by query, shop, timeframe, intent |
| `search_shops` | Search TrendTrack shops |
| `lookup` | Resolve public entities by brand name, shop domain, or FB page ID |
| `scan_ad` | Deep-scan a single Meta/Facebook ad — surface labeled opening hook |
| `creative_inspiration_pack` | V2 market/niche creative inspiration pack from active Meta ads |
| `brief_competitor` | Compact competitor brief for a shop/domain/name |
| `list_brandtracker_folders` | List brandtracker folders in workspace |
| `list_favorites` | List favorite ads or shops |
| `check_credits` / `usage_get` | Check credit balance and usage |

---

## DAILY OPERATING RHYTHM

### Morning (5 min)
```
daily_radar → see what changed across tracked brands in last 24h
```
Output: which brands are scaling, which launched new ads, which shifted messaging.

### Pre-creative session (15 min)
```
1. find_winning_products with target niche keywords
2. creative_inspiration_pack for the niche
3. brief_competitor for the 2-3 most relevant brands
```
Output: niche-grounded creative starting points, not generic prompts.

### Pre-launch (30 min)
```
1. analyze_tracked_brand for top 3 competitors
2. analyze_shop_emails for their funnel patterns
3. find_similar_shops to surface any missed competitors
```
Output: full competitive picture before going live.

---

## INTERACTION PATTERN

When Jake asks "what's working in [niche]," default to:

1. `find_winning_products` — see what's selling
2. `search_ads` — see what's running
3. `creative_inspiration_pack` — synthesize for creative starting points

When Jake asks "what's [Brand X] doing right now," default to:

1. `lookup` to resolve the brand identity
2. `analyze_tracked_brand` if tracked, or `brief_competitor` if not
3. `analyze_brand_changes` for recent activity

---

## HALLUCINATION PROTOCOL APPLIED

- TrendTrack metrics are derived from public Meta Ad Library and shop signals. Flag with `[VERIFY]` when used in budget or scaling decisions.
- "Winning" status is TrendTrack's inference. Cross-check against your own ad library scan before betting on it.
- Brand revenue/spend numbers are estimates unless TrendTrack explicitly cites a primary source.

---

## CREDIT MANAGEMENT

`check_credits` and `usage_get` return current balance. Run before any large batch operation (analyzing 10+ brands, multiple niche scans). Tell Jake the cost in advance if it looks heavy.

---

## WHAT NOT TO DO

- Don't run `daily_radar` more than once per day unless Jake asks — duplicates burn credits
- Don't auto-track new brands without Jake's go — tracking has cost
- Don't conflate TrendTrack "winning" with Meta "scaling" — they're different signals
