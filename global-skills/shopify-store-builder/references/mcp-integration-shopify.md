# SKILL: mcp-integration/shopify
**Purpose:** Claude Code integration patterns for Shopify MCP — what Claude can execute directly vs. what requires manual action.

---

## SHOPIFY MCP — WHAT'S AVAILABLE

The Shopify MCP is connected in this workspace. Claude can execute these operations directly:

### READ (safe, no confirmation required)
```
- search_products          → find products by title, status, tag, SKU
- get-product              → fetch full product data by GID
- get-collection           → fetch collection data by GID
- search_collections       → list/filter collections
- get-shop-info            → store name, currency, timezone, plan
- list-orders              → recent orders with status
- get-order                → full order detail
- get-inventory-levels     → stock quantities per location
- graphql_query            → read-only GraphQL queries
- run-analytics-query      → ShopifyQL data queries
```

### WRITE (requires explicit user confirmation before executing)
```
- create-product           → new product (starts as Draft)
- update-product           → title, description, status, images, variants
- bulk-update-product-status → activate/archive multiple products
- create-collection        → manual or smart collection
- update-collection        → title, description, rules, sort order
- add-to-collection        → add products to existing collection
- set-inventory            → update stock quantity
- create-discount          → percentage discount code
- graphql_mutation         → any write mutation
```

### NEVER EXECUTES (prohibited in this workspace)
```
- Modifying sharing/permissions
- Deleting products, orders, or customers permanently
- Financial transaction execution
- Account creation
```

---

## STORE BUILD WORKFLOW WITH MCP

### Phase 1: Verify store state before building
```
Claude Code action sequence:
1. get-shop-info              → confirm correct store is connected
2. search_products [handle]   → confirm product exists + get GID
3. get-product [GID]          → read current state of product
4. search_collections         → confirm template collections exist
```

### Phase 2: Product setup
```
# Create product if it doesn't exist
create-product → {
  title: [from brand-pack.md],
  status: "DRAFT",
  variants: [{ price: "XX.XX", compareAtPrice: "XX.XX" }],
  tags: [from brand-pack.md]
}

# Update if already exists
update-product → {
  title: [clean handle from brand-pack.md],
  variants: [{ price, compareAtPrice }],
  status: "DRAFT"
}
```

### Phase 3: Push theme settings (CLI, not MCP)
```bash
# MCP cannot push theme files — use Shopify CLI
cd [theme-directory]
shopify theme push --only config/settings_data.json
shopify theme push --only templates/product.json
```

### Phase 4: Activate at launch
```
bulk-update-product-status → {
  productIds: ["gid://shopify/Product/XXXXX"],
  status: "ACTIVE"
}
```

---

## GRAPHQL PATTERNS FOR STORE BUILDS

### Get product GID by handle
```graphql
query getProductByHandle($handle: String!) {
  productByHandle(handle: $handle) {
    id
    title
    status
    variants(first: 5) {
      edges {
        node {
          id
          price
          compareAtPrice
        }
      }
    }
  }
}
```

### Update compare-at price
```graphql
mutation updateVariantPrice($variantId: ID!, $compareAtPrice: Money!) {
  productVariantUpdate(input: {
    id: $variantId,
    compareAtPrice: $compareAtPrice
  }) {
    productVariant { id price compareAtPrice }
    userErrors { field message }
  }
}
```

---

## CONFIRMATION PROMPT TEMPLATE

Before any write operation, Claude outputs:

```
## Action: [operation name]
**Type:** WRITE — requires your confirmation
**What it does:** [plain English]
**Target:** [product GID / collection GID]
**Data being set:**
  [field]: [value]
  [field]: [value]

Confirm? (yes / no / show me the GraphQL first)
```

---

## ERROR HANDLING

| Error | Likely cause | Fix |
|---|---|---|
| `product_not_found` | Wrong GID or handle | Re-run `search_products` to get current GID |
| `insufficient_access` | MCP token scope | Check Shopify app permissions in admin |
| `variant_required` | No default variant | Add default variant before updating price |
| `theme push failed` | CLI not authenticated | Run `shopify auth login` first |
