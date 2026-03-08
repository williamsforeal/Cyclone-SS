# Plan: Wire Gate Validation Pipeline to Real Apify Actors

## Context

The gate validation pipeline (`workflows/wf-gate-pipeline.json`) has a working structure:
`Webhook → Setup → Prepare Gate → If More? → Run Scraper → Save Result → Advance → Loop`

But the "Run Gate Scraper" node is a **STUB** — it returns placeholder data with `status: 'stub_needs_actor'`. We need to replace it with real Apify API calls that:
1. Trigger the correct Apify actor for each gate
2. Wait for the run to finish
3. Fetch the results
4. Evaluate pass/fail criteria against actual data

The custom KaloData and SimilarWeb actors are **not deployed to Apify yet** — they exist as code in `apify-actors/`. For Amazon and Meta Ads, we use Apify's existing public actors.

## Apify API Pattern (from WF6)

WF6 shows the proven pattern:
```
POST https://api.apify.com/v2/acts/{ACTOR_ID}/runs?token={APIFY_TOKEN}
  → body: actor input JSON
  → response: { data: { id: "runId" } }

Wait 30s

GET https://api.apify.com/v2/actor-runs/{runId}/dataset/items?token={APIFY_TOKEN}&format=json
  → response: array of result items
```

## Gate → Actor Mapping

| Gate | Actor | Status | Input | Key Output Fields |
|------|-------|--------|-------|-------------------|
| 1. KaloData | Custom `kalodata-scraper` | **Need to deploy** | `{ keyword, sessionCookie, maxProducts: 5 }` | revenue_7d, revenue_30d, orders_7d, growth_7d_pct, launch_age_days, aov |
| 2. Amazon | `junglee/free-amazon-product-scraper` (already in MCP) | **Public actor** | `{ queries: [productName], countryCode: "US", maxItems: 10 }` | price, rating, reviewCount, salesRank, title |
| 3. AliExpress | `apify/aliexpress-scraper` or manual | **Public actor** | `{ queries: [productName], maxItems: 5 }` | price, orders, shippingCost, sellerRating |
| 4. Meta Ads | `apify/facebook-ads-scraper` (already in MCP) | **Public actor** | `{ startUrls: [adLibraryUrl], resultsLimit: 20 }` | adCount, activeStatus, pageId |

## What Changes

### Replace the STUB node with a real Code node

The stub at node `gate-run-scraper` (position [1060, 200]) gets replaced with a Code node that:
1. Reads `currentGate.name` to determine which actor to call
2. Makes a `POST` to `https://api.apify.com/v2/acts/{actorId}/runs` with gate-specific input
3. Waits (inline `await new Promise(r => setTimeout(r, 30000))`)
4. Makes a `GET` to fetch dataset items
5. Maps actor output fields to the gate criteria
6. Evaluates each criterion (gte/lte/eq comparisons)
7. Returns `gatePassed: true/false` and `criteriaResults` with actual values

### Actor-specific input builders

```javascript
const actorConfigs = {
  kalodata: {
    actorId: 'YOUR_DEPLOYED_ACTOR_ID',  // After deploying to Apify
    buildInput: (name) => ({
      keyword: name,
      sessionCookie: process.env.KALODATA_SESSION_ID,
      maxProducts: 5,
    }),
    mapOutput: (items) => {
      const best = items[0] || {};
      return {
        revenue_30d: best.revenue_30d || 0,
        launch_age_days: best.launch_age_days || 999,
      };
    }
  },
  amazon: {
    actorId: 'junglee~free-amazon-product-scraper',
    buildInput: (name) => ({
      queries: [name],
      countryCode: 'US',
      maxItems: 10,
    }),
    mapOutput: (items) => ({
      monthly_sales: items.reduce((sum, i) => sum + (i.monthlySales || 0), 0),
      listing_count: items.length,
    })
  },
  aliexpress: {
    // Placeholder until we pick the right actor
    actorId: null,
    buildInput: (name) => ({ query: name }),
    mapOutput: (items) => {
      const best = items[0] || {};
      return {
        profit_margin: (best.price || 0) * 0.6,  // Rough estimate
        weight_kg: best.weight || null,
      };
    }
  },
  meta_ads: {
    actorId: 'apify~facebook-ads-scraper',
    buildInput: (name) => ({
      startUrls: [{
        url: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&q=${encodeURIComponent(name)}&country=US`
      }],
      resultsLimit: 20,
    }),
    mapOutput: (items) => ({
      active_ads_count: items.length,
    })
  },
};
```

### Criteria evaluation logic

```javascript
function evaluateCriteria(criteria, actualData) {
  return criteria.map(c => {
    const actual = actualData[c.name];
    let passed = null;
    if (actual !== null && actual !== undefined) {
      if (c.operator === 'gte') passed = actual >= c.threshold;
      else if (c.operator === 'lte') passed = actual <= c.threshold;
      else if (c.operator === 'eq') passed = actual === c.threshold;
    }
    return { ...c, actualValue: actual, passed };
  });
}
```

Gate passes if ALL criteria pass. Gate fails if ANY criterion fails.

### Also update the "Advance to Next Gate" node

Currently references the stub by name: `$('Run Gate Scraper (STUB)')`. After renaming, update to match the new node name.

## Files Modified

| File | Action |
|------|--------|
| `workflows/wf-gate-pipeline.json` | **Replace** stub node with real Apify API calls + criteria evaluation |

Specifically within the JSON:
- **Node `gate-run-scraper`** (id: `gate-run-scraper`): Replace `jsCode` with real actor calls
- **Node `gate-advance`** (id: `gate-advance`): Update `$('Run Gate Scraper (STUB)')` reference to new node name
- **Connection key** `"Run Gate Scraper (STUB)"`: Rename to match new node name

## Pre-requisite: Deploy KaloData Actor

Before gate 1 works, the KaloData actor needs to be deployed to Apify:
```bash
cd apify-actors/kalodata
apify login --token $APIFY_TOKEN
apify push
```
This gives us the actor ID to use in the gate config. For now, we can set it to a placeholder and skip gate 1 if the actor isn't deployed.

## Env Vars Needed in n8n

Already in `.env`:
- `APIFY_TOKEN` — for all Apify API calls
- `KALODATA_SESSION_ID` — session cookie for KaloData auth

## Verification

1. Import updated workflow to local n8n: `POST http://localhost:5678/api/v1/workflows`
2. Test with a known product:
   ```
   curl -X POST http://localhost:5678/webhook/bomb-validate-candidate \
     -H "Content-Type: application/json" \
     -d '{"candidateId": 1, "candidateName": "Scalp Massager", "singleGate": "amazon"}'
   ```
3. Check n8n execution log — should show real Apify API calls and actual data
4. Check Express backend received the gate result at `/api/ingest/gate-result`
