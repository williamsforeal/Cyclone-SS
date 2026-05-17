---
name: bomb-ecom-notion
description: Manage Bomb Ecom OS project data in Notion. Use when user says "notion", "update project tracker", "add to notion", "project status", or wants to create/read/update Notion pages and databases for williamsforeal LLC projects.
metadata: {"author": "williamsforeal", "version": "1.0.0", "openclaw": {"os": ["linux", "darwin", "win32"], "primaryEnv": "NOTION_API_KEY"}}
---

# Bomb Ecom OS — Notion Integration

## Instructions

Manage project data, documentation, and task tracking in Notion for the Bomb Ecom OS platform.

This skill works alongside the bundled `notion` skill (which provides raw API access). This skill adds project-specific workflows and conventions.

## Project Conventions

### Page Structure
- **Project Hub:** Top-level dashboard for Bomb Ecom OS
- **Sprint Tracker:** Current sprint tasks and status
- **Knowledge Base:** Technical docs, SOPs, architecture decisions
- **Client Work:** Agency delivery tracking (if applicable)

### Database Properties
When creating or updating databases, use these standard properties:
- **Status:** Not Started → In Progress → Review → Done
- **Priority:** P0 (Critical) → P1 (High) → P2 (Medium) → P3 (Low)
- **Owner:** CTO / Build / Data / Creative / Ops (maps to agent team)
- **Sprint:** Week number or sprint name
- **Type:** Feature / Bug / Research / Creative / Infrastructure

## Common Operations

### Create a Sprint Task
Create a new page in the sprint tracker with:
- Title, description, acceptance criteria
- Assigned owner (agent or Jake)
- Priority and sprint assignment
- Link to related technical docs

### Update Project Status
Read current sprint database, summarize:
- Tasks completed this sprint
- Tasks in progress
- Blockers or risks
- Next sprint priorities

### Document Architecture Decision
Create a knowledge base page with:
- Decision title and date
- Context (why this decision was needed)
- Options considered (2 max)
- Decision and rationale
- Consequences and follow-ups

### Log Build Report
Create a progress report page with:
- Date and sprint number
- What was built/shipped
- What was learned
- What's next
- Blockers

## Integration Notes

- The bundled `notion` skill handles raw API calls
- This skill adds Bomb Ecom OS conventions on top
- Always use standard properties when creating database entries
- Link related pages when creating cross-references
