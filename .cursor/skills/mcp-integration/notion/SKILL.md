---
name: mcp-notion
description: Use this skill when the user asks Claude to read, create, update, or search Notion pages and databases. Jake's existing setup includes an "Ad Creation Progress Tracker" database and other DTC workflow trackers. Activate when Jake mentions Notion by name, "my tracker," "update my Notion," or "log this to my workspace."
---

# Notion MCP Integration

**Purpose:** Read/write Jake's Notion workspace — progress tracking, knowledge base, content calendar.

---

## TOOLS AVAILABLE

| Tool | Purpose |
|---|---|
| `notion-search` | Semantic search across Notion workspace + (optionally) the web |
| `notion-fetch` | Get details on a page/database/data source by URL or ID |
| `notion-create-pages` | Create one or more Notion pages with properties + content |
| `notion-update-page` | Update a page's properties or content |
| `notion-duplicate-page` | Duplicate a page |
| `notion-move-pages` | Move pages or databases to a new parent |
| `notion-create-database` | Create a new database (SQL DDL syntax) |
| `notion-update-data-source` | Update database schema/title/attributes |
| `notion-create-view` / `notion-update-view` | Create/update views on a database |
| `notion-create-comment` / `notion-get-comments` | Add or read comments |
| `notion-get-users` / `notion-get-teams` | Workspace metadata |

---

## JAKE'S KNOWN NOTION STRUCTURE

[VERIFY — Jake to confirm current state]

- **Ad Creation Progress Tracker** — DB tracking ad concepts, status, coach feedback
- **Project / brand pages** — Pitsmith, Abundria, Cold Plunge research
- **Course note pages** — AI Com Academy chapter notes
- **Inspiration boards** — for design and ad references

Use `notion-search` first to confirm current structure before assuming what exists.

---

## INTERACTION PATTERN

### Reading progress
```
1. notion-search "ad creation progress tracker"
2. notion-fetch the database
3. Filter/summarize what's in flight
```

### Logging an ad concept
```
1. Get the Ad Creation Progress Tracker DB
2. notion-create-pages with concept fields:
   - Name, Brand, Avatar, Status, Hook, Angle, Awareness Level
   - Coach Feedback (blank, fill after review)
3. Confirm to Jake with the new page URL
```

### Updating after coach review
```
1. notion-search the concept by name
2. notion-update-page with the coach's feedback + new status
```

---

## SAFETY RULES

- **Never delete pages** without explicit confirmation
- **Don't bulk-create** more than 5 pages without Jake's go — DB clutter
- **Property names are case-sensitive** — always fetch the DB schema first before creating
- **Use existing tags/statuses** — don't invent new ones unless Jake asks

---

## PAIRING WITH OTHER MODES

| Mode | What gets logged to Notion |
|---|---|
| `shopify-store-build` | Build milestones, PDP status, launch QA checklist |
| `meta-ads-operator` | Campaign launches, performance milestones, kill decisions |
| `static-ad-generator` | Generated concepts → Ad Creation Progress Tracker |
| `dtc-second-brain` | Synthesis outputs (don't replace the wiki — Notion is the executive summary) |
| `creative-strategy` | Avatar updates, brand pack changes, offer revisions |

---

## WHAT NOT TO DO

- Don't treat Notion as the source of truth for brand pack data — that lives in `brands/<brand>/`
- Don't duplicate the DTC Second Brain wiki into Notion. Notion = summaries + status. Wiki = full intelligence layer.
- Don't auto-update statuses to "Done" — that's Jake's call
