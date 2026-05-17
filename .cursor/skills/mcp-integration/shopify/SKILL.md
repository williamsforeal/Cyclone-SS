---
name: mcp-shopify
description: Use this skill when the user asks Claude to interact with their Shopify store — read products, update PDPs, edit themes, manage inventory, create discounts, query analytics, or run any Shopify Admin operation. This skill documents the 25 dedicated Shopify connector tools, the Shopify AI Toolkit plugin (Claude Code), and the safety rules around write operations.
---

# Shopify MCP Integration

**Available in:** Claude Code (full plugin) + Claude Desktop/Web (connector with 25 tools)
**Auth:** OAuth via Shopify CLI (`npx shopify store auth --store <store>.myshopify.com`)
**Plugin install:** `/plugin marketplace add Shopify/shopify-ai-toolkit` then enable in plugins panel

---

## STORES JAKE HAS CONNECTED

[VERIFY — current state, ask Jake to confirm]

- `pitsmith-co.myshopify.com` (or similar) — Pit Smith Co. (active build, Shrine theme)
- `abundria.store` — Abundria / Palm Aura (live, configured)
- Cold plunge brand store — not yet created

Use `get-shop-info` and `switch-shop` to confirm which store is active before any write operation.

---

## THE 25 TOOLS — WHAT EACH DOES

### Products (5)
- `search_products` — Find by title, vendor, type, tag, status, price, inventory, SKU. Read-only.
- `get-product` — Full detail on one product including variants, images, inventory.
- `create-product` — Add new with title, description, variants, pricing, images. **WRITE.**
- `update-product` — Change titles, descriptions, status, images, variant pricing, SKUs. **WRITE.**
- `bulk-update-product-status` — Flip multiple products to Active/Draft/Archived. **WRITE.**

### Orders (2, read-only)
- `list-orders` — Recent orders with customer, totals, financial + fulfillment status
- `get-order` — Full detail incl. line items, shipping address, tracking

⚠️ **Known limitation:** No create/update order capability. Order writes must happen in Shopify admin or fulfillment apps.

### Customers (1, read-only)
- `list-customers` — Name, email, phone, order count, total spent. Supports tag/email/country/marketing-status filters.

### Inventory (2)
- `get-inventory-levels` — Stock per variant per location
- `set-inventory` — Set available qty for a variant at a location. **WRITE.** Includes safety check via `compareQuantity`.

### Discounts (1)
- `create-discount` — Percentage codes. Optional collection scope, customer segments, min purchase, min qty. **WRITE.**
  - ⚠️ Uses Shopify customer **segments**, not tag filters directly. Create segment in Shopify first if needed.

### Collections (5)
- `search_collections` — Browse and filter
- `get-collection` — Full detail
- `create-collection` — Manual or smart (rule-based). **WRITE.**
- `update-collection` — Modify title, description, image, sort, smart rules. **WRITE.**
- `add-to-collection` — Add products to existing collection. **WRITE.**

### Analytics (1)
- `run-analytics-query` — ShopifyQL against sales/orders/sessions/customers/fulfillments/inventory/payments tables. Most powerful tool in the roster.

### Shop Info (2)
- `get-shop-info` — Name, plan, currency, timezone, country
- `switch-shop` — Switch active store for agencies / multi-brand operators

### Storefront Generation (1)
- `get-new-store-previews` — Generate up to 3 storefront previews. New stores only, not redesigns.

### Asset Upload (1)
- `upload-image` — Upload image, get permanent Shopify CDN URL. ⚠️ Can be brittle — host publicly first if it fails.

### GraphQL Escape Hatch (5, advanced)
- `graphql_schema`, `graphql_query`, `graphql_mutation`, `validate_graphql_codeblocks`, `search_docs_chunks` — Direct Admin API access for anything dedicated tools don't cover.

---

## SAFETY RULES (mandatory)

### Before any WRITE operation:

1. **Confirm the store** — `get-shop-info` first if it's been more than one turn since last verified
2. **Read before write** — Use `search_products` or `get-product` to confirm state before update/delete
3. **State the diff** — "I'm about to update X from `[old]` to `[new]`. Confirm?"
4. **Wait for Jake's go-ahead** — Don't write unless explicitly told to write

### Known brittle areas:
- **Image uploads** — Use public URLs (Imgur/CDN) when possible. `upload-image` can fail silently.
- **Bulk operations** — Risk of compounding errors. Run 1-2 products first, verify, then bulk.
- **Theme writes** — Always work on a duplicate theme (see screenshot from Jake: "Copy of Copy of shrine-theme-1"). Never write directly to the live theme without explicit approval.

---

## SHOPIFY AI TOOLKIT (Claude Code plugin, April 9 2026)

Beyond the connector, Claude Code has access to the **Shopify AI Toolkit plugin**:

- Official, built and maintained by Shopify
- Auto-updates as new capabilities ship
- Auth via same Shopify CLI flow (OAuth in browser)
- Adds: validated GraphQL queries, official Shopify docs search, theme code validation

**Install (one time):**
```
/plugin marketplace add Shopify/shopify-ai-toolkit
```
Then enable `shopify-plugin@shopify-ai-toolkit` in the Plugins tab → restart Claude Code.

**First auth (in any project):**
```
List all products in my Shopify store. My store URL is <store>.myshopify.com
```
Include the full subdomain. Claude runs the CLI auth; OAuth window opens; install the connector app; browser confirms; Claude is now connected.

**Adding write scopes later:**
```
Authenticate to my store with these scopes: read_products, write_products,
read_orders, read_inventory, write_inventory, read_content, write_content.
My store is <store>.myshopify.com
```

---

## WORKFLOWS

### Monday morning briefing (uses ~9 tools)
See `_modes/shopify-store-build/MODE.md` for the full briefing prompt.

### PDP build workflow
1. Read `brands/<brand>/brand-pack.md`
2. Read `_modes/shopify-store-build/reference/shrine-theme/pdp-section-order.md`
3. Build sections per spec, paste into duplicate theme
4. Run launch QA checklist

### Bulk product description rewrite for AI shopping
See workflow 1 in The Claude Code + Shopify AI Playbook (referenced in source materials).

---

## WHAT NOT TO DO

- Don't `bulk-update-product-status` to ARCHIVED without explicit confirmation
- Don't `set-inventory` without `compareQuantity` — race condition risk
- Don't create discount codes without confirming customer eligibility (`all_customers` vs segments) — defaults to clarification prompt if unset
- Don't modify the live theme. Always duplicate first.
- Don't write to a client/multi-brand store without confirming `switch-shop` first
