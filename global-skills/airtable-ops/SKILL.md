---
name: airtable-ops
description: All Airtable read/write operations across the BOMB ECOM OS stack. Single source of truth on Airtable schema for base appaz3BOFrhlI1MWf (Projects, Ad Copy, Static Creatives, Winning Ads Library). Use when the user says "read records", "update Airtable", "find queued creatives", "query by avatar", "log winning ad", or any Airtable CRUD operation. Routes through the airtable MCP server — never uses raw API curls.
---

# Airtable Ops

All Airtable CRUD across BOMB ECOM OS. Single skill, single source of truth on the schema.

## Critical Rules

- Always use the `airtable` MCP server — never raw HTTP calls.
- Never fabricate record IDs. Read first, write second.
- Attachment fields require array of objects: `[{"url": "https://..."}]`. URL must be publicly reachable.
- Single Select fields return objects on read; on write, pass the option **name** as a string.
- Linked Record fields are arrays of record IDs, not names: `["recXXXXXXXXXXXXXX"]`.
- Idempotency: when logging recurring entries (e.g. winning ads), upsert by a unique key field, not by record ID.
- If the airtable MCP is not connected, stop and tell the user. Do not silently retry with a different transport.

## Base + Tables

**Base ID:** `appaz3BOFrhlI1MWf` (williamsforeal Operations)

| Table | Key Fields | Status Flow |
|---|---|---|
| Projects | Name, Brand, Product Image, Logo, Brand Colors, Status | — |
| Ad Copy | Project (link), Angle, Avatar Target, Headline, Description, Primary Text, Status | Draft → Ready → Testing → Winner → Retired |
| Static Creatives | Project (link), Ad Copy (link), Creative Type, Aspect Ratio, Image, Prompt, Error, Status | Queued → Running → Success → Fail |
| Winning Ads Library | ad_id (unique), hook_type, visual_formula, avatar_implied, awareness_level, replication_rating | — |

> Table IDs and field IDs are not hardcoded here — fetch them via `mcp__airtable*__list_tables` at runtime if needed. Field labels above are display names and may shift; if a query fails, re-fetch the schema before retrying.

## Common Queries

| Intent | Filter |
|---|---|
| Get queued creatives | Static Creatives WHERE `Status` = "Queued" |
| Get winners by avatar | Ad Copy WHERE `Avatar Target` = "{avatar}" AND `Status` = "Winner" |
| Get failed jobs | Static Creatives WHERE `Status` = "Fail" — surface `Error` field |
| Log winning ad | Upsert into Winning Ads Library by `ad_id` |
| Project by brand | Projects WHERE `Brand` = "{brand}" |

## Write Patterns

**New creative, queued for generation:**
```
Create record in Static Creatives:
  Project: ["recXXX"]              # linked record array
  Ad Copy: ["recYYY"]              # linked record array
  Creative Type: "Lifestyle"       # single select option name
  Aspect Ratio: "1:1"
  Prompt: "<full prompt text>"
  Status: "Queued"
```

**Mark creative successful with output image:**
```
Update record recZZZ:
  Status: "Success"
  Image: [{"url": "https://cdn.../output.png"}]
```

**Upsert winning ad (idempotent by ad_id):**
```
1. Query Winning Ads Library WHERE ad_id = "{ad_id}"
2. If found → update existing record
3. If not found → create new record
```

## Failure Modes + Fixes

| Error | Cause | Fix |
|---|---|---|
| 422 Unprocessable | Required field null OR option name mismatch on Single Select | Re-fetch schema; check exact option spelling/case |
| 404 on linked record | Linked record was deleted but ID still cached | Re-query parent record to refresh links |
| Attachment fails to render | URL not publicly accessible OR signed URL expired | Re-upload to S3/CDN with long-lived public URL |
| Rate limit (429) | Too many writes in short window | Batch writes; airtable MCP usually handles this |

## What This Skill Does NOT Do

- Does not upload images to S3/CDN — that's a separate step before the Airtable write.
- Does not trigger n8n workflows after writing — that's `n8n-workflow-ops`.
- Does not analyze ad performance — read-only data fetch only.
