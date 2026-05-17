# Command: /theme-config
**Trigger:** `/theme-config`  
**Action:** Generates a complete `settings_data.json` color + typography block from brand-pack.md

---

## WHAT THIS OUTPUTS

A paste-ready JSON block for `config/settings_data.json` in the Shrine theme.  
Covers: color palette tokens, typography settings, button styles.

---

## CLAUDE EXECUTION RULES

1. Read `context/brand-pack.md` — extract all hex codes and font settings
2. Read `reference/shrine-theme/settings-data-guide.md` — get exact key names Shrine expects
3. Output a valid JSON snippet targeting only the `colors` and `typography` sections
4. Do NOT output the entire settings_data.json — only the changed blocks
5. State exactly where in the file these blocks belong (search key to find insertion point)

---

## OUTPUT FORMAT

```json
// Paste into config/settings_data.json under "current" → "sections" → "theme-settings"

"colors": {
  "color_background_1":    "#F8F6F1",
  "color_background_2":    "#ECE8E0",
  "color_foreground":      "#171717",
  "color_accent_1":        "#10233F",
  "color_accent_2":        "#B7372F",
  "color_button":          "#10233F",
  "color_button_label":    "#F8F6F1",
  "color_secondary_button_label": "#10233F",
  "color_card_background": "#ECE8E0",
  "color_card_text":       "#171717",
  "color_badge":           "#B7372F",
  "color_badge_foreground":"#F8F6F1",
  "color_border":          "#68707A"
},
"typography": {
  "type_header_font":      "oswald_n7",
  "type_body_font":        "inter_n4",
  "heading_scale":         110,
  "body_scale":            100
}
```

---

## VERIFICATION STEPS AFTER PASTE

```bash
# From Shopify CLI in your theme directory:
shopify theme check
# Confirm no schema errors before pushing
shopify theme push --only config/settings_data.json
```

---

## NOTES

- Shrine may not support all Google Fonts natively — check `assets/` for font files
- If Oswald isn't available, flag it and default to Montserrat ExtraBold (system available)
- `color_accent_1` maps to primary brand/buttons in most Shrine presets
- `color_accent_2` maps to sale/urgency ribbons
