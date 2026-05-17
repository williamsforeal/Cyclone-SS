---
name: mcp-google-drive
description: Use this skill when the user asks Claude to search, read, or organize files in Google Drive — particularly AI Com Academy course transcripts, coach feedback docs, brand research, and shared spreadsheets. Activate when Jake mentions Drive, "my course materials," "coach review," or references a specific Google Doc.
---

# Google Drive MCP Integration

**Purpose:** Read course material, coach feedback, brand research, and other Drive-stored docs.

---

## TOOLS AVAILABLE

| Tool | Purpose |
|---|---|
| `drive_search` / `google_drive_search` | Search Drive by query, name, fullText, mimeType, date, owner |
| `google_drive_fetch` | Fetch specific docs by ID |
| `Google Drive:read_file_content` | Natural-language read of a file |
| `Google Drive:get_file_metadata` | File metadata (size, owner, modified) |
| `Google Drive:list_recent_files` | Recent files in user's Drive |
| `Google Drive:download_file_content` | Download as base64 |
| `Google Drive:create_file` | Create/upload a file |
| `Google Drive:copy_file` | Duplicate a file |

---

## KNOWN DRIVE FOLDERS (Jake's setup)

[VERIFY — confirm current paths with Jake]

- **AI Com Academy course transcripts** (Chapters 2, 6, 7, etc.)
- **Coach feedback docs** (per-chapter, per-asset review notes)
- **Foundational docs:** Research Doc, Avatar Sheet, Offer Brief, Necessary Beliefs (per brand)
- **Brand assets:** logos, packaging, product photography

---

## INTERACTION PATTERNS

### Search by topic
```
drive_search("Palm Aura avatar")
→ returns matching docs across folders
```

### Read a coach review
```
1. drive_search the coach feedback doc by date or asset name
2. read_file_content to pull the actual notes
3. Synthesize: what changed, what's blocking, what's approved
```

### Pull foundational docs for a creative session
```
1. drive_search("avatar palm aura")
2. drive_search("offer brief palm aura")
3. drive_search("necessary beliefs palm aura")
4. drive_search("research doc palm aura")
5. Synthesize into context for the creative-strategy mode
```

---

## SAFETY RULES

- **Read-only by default.** Don't create or modify Drive files unless Jake asks explicitly.
- **Cite the source doc** when synthesizing — Jake needs traceability for coach reviews
- **Don't trust filenames as content.** Always read the doc; names drift from content.

---

## PAIRING WITH OTHER WORKSPACES

| Mode | What Drive provides |
|---|---|
| `creative-strategy` | Foundational docs (avatar, offer, beliefs) — source of truth |
| `static-ad-generator` | Reference photography, brand assets |
| `dtc-second-brain` | Drop Drive search outputs into `raw/` for wiki compilation |
| `shopify-store-build` | Product photography, video assets for PDP |

---

## WHAT NOT TO DO

- Don't auto-summarize a full chapter transcript unless Jake asks — they're long and waste context
- Don't fetch every doc in a folder by default — search with intent
- Don't assume a file's content from its title (per Hallucination Protocol)
