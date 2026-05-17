---
name: trigger-dev-builder
description: Builds TypeScript automations in Trigger.dev for complete beginners. Follows a strict 9-step workflow: Understand → Research → Clarify → Plan → Build → Environment Setup → Test → Deploy → Verify. Use when the user says "automate this", "build a workflow", "Trigger.dev", "scheduled task", "TypeScript automation", or wants to build any event-driven or scheduled background job. Never writes code before the Plan step is approved.
---

# Trigger.dev Builder

Builds working TypeScript automations in Trigger.dev. Guides from vague idea through deployed, verified production task.

## Critical Rules

- **Never write code before Plan is approved.** Steps 1-4 (Understand → Research → Clarify → Plan) must complete first. This is not negotiable.
- **Always ask the 5 clarifying questions** before planning. Missing one breaks the build.
- **Environment variables go in two places:** `.env` local AND Trigger.dev dashboard secrets. Both. Every time.
- **Test locally before deploying.** Dev server first, then `triggerDev.dev` run, then confirm output.
- **Use Trigger.dev MCP deploy tool** for production push — not manual CLI unless MCP unavailable.

## 9-Step Workflow (never skip steps)

| # | Step | What happens |
|---|---|---|
| 1 | **Understand** | Listen to the user's idea. Do not write code. |
| 2 | **Research** | Identify APIs/services. Check docs, pricing, rate limits, free tiers, auth requirements. |
| 3 | **Clarify** | Ask the 5 questions below. Do not assume anything. |
| 4 | **Plan** | Write what you'll build in plain English. Get explicit approval before proceeding. |
| 5 | **Build** | Create TypeScript task files per conventions below. |
| 6 | **Environment Setup** | Add all env vars to `.env` (local) AND Trigger.dev dashboard. Walk user through both. |
| 7 | **Test Locally** | Start dev server. Trigger a test run. Confirm it works. |
| 8 | **Deploy** | Use Trigger.dev MCP deploy tool to push to production. |
| 9 | **Verify** | Check run logs. Confirm automation is working end-to-end. |

## 5 Questions to Ask Before Writing Any Code

1. **Source:** What data/service does this pull from? Does the user have an account/API key?
2. **Output:** Where should results go? (ClickUp, email, Slack, spreadsheet, database?)
3. **Frequency:** Run on a schedule, respond to an event, or trigger manually?
4. **Accounts:** What services does the user already have access to? What needs signup?
5. **Success:** What does "working" look like? What exact output should they see?

## TypeScript Task Conventions

```typescript
import { task, schedules } from "@trigger.dev/sdk";

// Basic task
export const myTask = task({
  id: "my-task-id",   // kebab-case, unique across project
  run: async (payload: { userId: string }) => {
    // task logic here
    return { result: "done" };
  },
});

// Scheduled task (cron)
export const dailyReport = schedules.task({
  id: "daily-report",
  cron: "0 8 * * *",    // 8am UTC daily
  run: async (payload) => {
    // scheduled logic
  },
});
```

**File structure:**
```
trigger/
├── [task-name].ts      ← one file per task
└── utils/              ← shared helpers
.env                    ← local secrets (git-ignored)
trigger.config.ts       ← project config
```

**Error handling pattern:**
```typescript
try {
  const result = await apiCall();
  return { success: true, data: result };
} catch (error) {
  throw new Error(`Task failed: ${error.message}`); // Trigger.dev catches and logs
}
```

## MCP Server Config

The Trigger.dev MCP server config is in `references/mcp-config.json`:
```json
{
  "mcpServers": {
    "trigger": {
      "command": "npx",
      "args": ["trigger.dev@4.4.0", "mcp"]
    }
  }
}
```
Add this to your `~/.claude/settings.json` under `mcpServers` to enable the deploy tool globally.

## Common Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Task runs locally but fails in prod | Missing env var in dashboard | Check Trigger.dev dashboard secrets — add every var from `.env` |
| Task fires multiple times | No idempotency check | Add a unique key check or use `idempotencyKey` option |
| Cron not firing | Wrong timezone assumption | Trigger.dev cron uses UTC — convert from local time |
| API rate limit in prod | Not throttled | Use `wait.for()` between iterations on large payloads |
| Build fails on deploy | TypeScript errors | Run `tsc --noEmit` before deploying |

## References

- `references/trigger-dev-api.md` — full SDK v4 code examples (task, schedules, batch, wait, etc.)
- `references/mcp-config.json` — Trigger.dev MCP server config for `settings.json`
- Source: `A:\AI_Training\Skills\Agents\claude-configs\claude.md - automation teacher.md`
- API reference source: `A:\AI_Training\Skills\Agents\claude-configs\trigger.dev.claude.md`
