# Source Playbook Reference

The canonical, long-form playbook for this skill lives at:

**`A:\Scale AI Skool\Claude\code\The Claude Code Static Ad Generator Playbook for DTC Brands & Creative Agencies.md`**

This SKILL.md is a distilled version. When in doubt — or when implementing `generate_ads.py`, the 40 template prompts, or the Brand DNA prompt structure in full — read the source playbook.

## Related repo assets

- `c:\Users\Jake\williamsforeal LLC\repositories\Cyclone-SS\.cursor\skills\ad-family-architect\` — existing Cursor variant of family/variant logic
- `c:\Users\Jake\williamsforeal LLC\repositories\Cyclone-SS\.cursor\skills\image-to-json\` — image → prompt structure
- `c:\Users\Jake\williamsforeal LLC\repositories\Cyclone-SS\.cursor\skills\json-to-comfy\` — JSON → ComfyUI workflow translation
- `c:\Users\Jake\williamsforeal LLC\repositories\Cyclone-SS\claude-workspaces\_modes\static-ad-generator\MODE.md` — workspace-mode definition (concept-first discipline, brand pack binding, families not one-offs)

## TODO list before this skill is fully operational

- [ ] Author `references/template-prompts.md` with all 40 templates (from playbook + repo `prompts/`)
- [ ] Author `references/script-spec.md` for `generate_ads.py` (FAL caller, CLI args: `--templates`, `--quality`)
- [ ] Validate cost per run on test brand (Palm Aura — smallest blast radius)
- [ ] Wire to `airtable-ops` to log queued/successful creatives
