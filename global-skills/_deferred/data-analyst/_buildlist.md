# Build Checklist — data-analyst

Pulled from `Cyclone-SS/skills-registry.md` §3. Complete every box before promoting this skill out of `_deferred/`.

- [ ] Write `SKILL.md` with full frontmatter (remove `[STUB]` prefix from description)
- [ ] Define trigger phrases that map to the skill's purpose
- [ ] Document MCP dependencies in the SKILL.md body
- [ ] Document external dependencies (API keys, env vars, tool installs)
- [ ] Define inputs and outputs precisely
- [ ] Add `references/` files for any long-form content (playbooks, templates, scripts)
- [ ] Test trigger phrases load the skill correctly in a fresh Claude Code session
- [ ] Run on at least one real task end-to-end
- [ ] Document cost per run if it has external API calls
- [ ] Update the `Status` column in `REGISTRY.md` from 🟠/🔴 to 🟡 Built
- [ ] Move folder from `_deferred/data-analyst` to `~/.claude/skills/data-analyst`
- [ ] After 30 days of clean runs, promote `Status` to 🟢 Deployed
