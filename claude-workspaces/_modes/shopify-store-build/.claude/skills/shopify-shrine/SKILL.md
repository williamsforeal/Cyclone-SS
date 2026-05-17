---
name: shopify-shrine
description: Use this skill when the user asks Claude to edit, build, or modify a Shopify Shrine theme — adding sections, updating settings_data.json, editing main-product blocks, or working with templates/product.json. Encodes Shrine's specific file structure and schema patterns so Claude doesn't guess at file locations or section formats.
---

# Shopify Shrine Theme

**Purpose:** Encode Shrine theme structure so Claude can build and edit sections correctly without guessing file locations or schema patterns.

---

## SHRINE THEME FILE STRUCTURE (relevant to store builds)

```
theme-root/
├── config/
│   ├── settings_data.json     ← Color tokens, typography, global settings
│   └── settings_schema.json   ← Defines available settings in the editor
├── layout/
│   └── theme.liquid           ← Global layout wrapper — don't touch unless adding fonts
├── sections/                  ← Individual page sections (Liquid + schema)
│   ├── announcement-bar.liquid
│   ├── header.liquid
│   ├── main-product.liquid    ← Primary PDP section
│   ├── icon-bar.liquid        ← Trust badge bar
│   ├── collapsible-content.liquid
│   ├── testimonials.liquid
│   ├── faq.liquid
│   └── ...
├── templates/                 ← Page templates as JSON
│   ├── product.json           ← Default product template
│   └── product.[brand].json   ← Custom product template (we build these)
├── assets/                    ← Images, CSS, JS
└── snippets/                  ← Reusable Liquid partials
```

---

## CUSTOM PRODUCT TEMPLATE WORKFLOW

For each brand, create a custom template:

1. Duplicate `templates/product.json` → `templates/product.<brand>.json`
2. Edit the section ordering and settings in the new file
3. Assign the product to use the new template (Shopify Admin → Product → Theme Template)

**Why:** Keeps the default template clean; lets each brand have its own PDP without forking the whole theme.

---

## SETTINGS_DATA.JSON STRUCTURE

This is where brand colors, fonts, and global tokens live.

```json
{
  "current": {
    "colors_solid_button_background_primary": "#10233F",  // cast_iron_navy
    "colors_solid_button_labels_primary": "#F8F6F1",      // pit_white
    "colors_background_1": "#F8F6F1",                     // pit_white page bg
    "type_header_font": "oswald_n7",
    "type_body_font": "inter_n4",
    ...
  }
}
```

**Critical rules:**
- Token paths come from `settings_schema.json` — don't invent new keys
- Hex codes match the brand pack exactly
- Font names use Shopify's font format: `<family>_<style>_<weight>` (e.g., `oswald_n7` = Oswald weight 700)

---

## MAIN-PRODUCT SECTION BLOCKS

The `sections/main-product.liquid` section contains nested **blocks** that build the PDP hero:

| Block type | Purpose |
|---|---|
| `urgency` | Urgency text above title |
| `emoji_benefits` | 5-pill benefit bar |
| `title` | Product title (sized for mobile) |
| `price` | Price + compare-at |
| `variants` | Variant selectors (size, color, etc.) |
| `sticky_atc` | Sticky add-to-cart bar |
| `buy_buttons` | Primary CTA + save callout |
| `shipping_estimate` | Shipping line below button |
| `trust_icons` | 3-icon trust bar |
| `featured_review` | Single review card with photo |

Block order is set in the JSON template, not the Liquid file. Edit `templates/product.<brand>.json` to reorder.

---

## SECTION VS BLOCK — WHICH TO EDIT

- **Reorder sections (e.g., move FAQ above guarantee)** → edit `templates/product.<brand>.json`
- **Add new content to existing section (e.g., change benefit bullet text)** → edit the section's settings via theme editor OR via `themeFilesUpsert` on `templates/product.<brand>.json`
- **Add brand-new layout that doesn't exist** → create a new section in `sections/` then add to template

---

## EDITING VIA SHOPIFY MCP (graphql)

To update a template file:

```graphql
mutation themeFilesUpsert($themeId: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
  themeFilesUpsert(themeId: $themeId, files: $files) {
    upsertedThemeFiles { filename }
    userErrors { field message }
  }
}
```

Always:
1. Read current state via `themeFiles` query first
2. Build the new file content
3. `themeFilesUpsert` to write
4. Confirm `userErrors` is empty

---

## COMMON GOTCHAS

1. **Shrine's basic doesn't have `text_style: "heading"`** — use `subtitle` and override the font manually. See Pitsmith PDP v4 build note.
2. **Section settings vs block settings** — they're separate. A section has settings; each block within it has its own settings.
3. **Liquid file changes don't reflect in the editor schema** until the section is reloaded. Restart the theme editor after `themeFilesUpsert` on a `.liquid` file.
4. **Templates can override section visibility** — a section can be hidden in one template but shown in another.

---

## DON'T DO

- Don't edit `product.liquid` directly when you only need to change `product.json`
- Don't add fonts to `theme.liquid` without registering them in `settings_schema.json` first
- Don't push changes to the live theme. Duplicate first.
- Don't assume Shrine version — verify via `theme.liquid` header comment or Jake's confirmation
