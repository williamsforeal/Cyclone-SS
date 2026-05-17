# Claude Workspaces — `_base`

Universal scaffolding for all williamsforeal LLC Claude Code workspaces.

## What this is

A modular Claude Code workspace template. Three layers:

| Layer | Purpose | Reusable? |
|---|---|---|
| `_base/` | Universal — operator identity, hallucination protocol, MCP integrations | Yes — every workspace inherits this |
| `_modes/<name>/` | Operating modes — Shopify build, ad generation, etc. | Yes — composable per project |
| `brands/<name>/` | Brand context — pack, voice, offer, audience | Yes — any mode can read any brand |

## Composing a workspace

To start a new project, copy this structure:

```
my-project/
├── CLAUDE.md                    ← Symlink or copy of _base/CLAUDE.md
├── .claude/                     ← Symlink or copy of _base/.claude/
├── MODE.md                      ← Copy from _modes/<chosen-mode>/MODE.md
├── context/
│   └── brand-pack.md            ← Copy from brands/<chosen-brand>/brand-pack.md
├── plans/
└── outputs/
```

Or use Claude Code's symlink approach (recommended) so updates to `_base` propagate to all child workspaces.

## What each base skill does

- **hallucination-protocol** — The 5-rule fact-grounding system. Loads on every reasoning task.
- **operator-mode** — Voice, structure, formatting rules.
- **mcp-integration/** — Per-tool MCP reference (Shopify, GetHookd, TrendTrack, Notion, Drive, Higgsfield).

## What each command does

- `/start-session` — Initialize session, read mode + brand, report state
- `/handoff` — Generate a handoff doc summarizing session state
- `/verify` — Run Hallucination Protocol audit on the last output
- `/next-action` — Force a single concrete next action

See individual `SKILL.md` and command files for full specs.
