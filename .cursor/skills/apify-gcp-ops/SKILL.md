---
name: apify-gcp-ops
description: Designs and implements web scraping operations that combine Apify actors with Google Cloud agent deployment and runtime controls. Use when users mention Apify, Puppeteer, Playwright, Actor workflows, Vertex AI Agent Engine, or production scraping architecture.
---

# Apify + Google Cloud Operations

## When to use this skill

Apply this skill when the user wants to:
- add web scraping to an app
- run scraping in production with retries, scheduling, and storage
- connect Apify actor outputs to Google Cloud agents or services
- deploy Python agents on Vertex AI Agent Engine

## Default approach

Use this baseline architecture unless the user specifies otherwise:
1. Scraping runtime: Apify Actor (Playwright preferred; Puppeteer supported).
2. Data persistence: Apify Dataset (raw) and optional transformed store (BigQuery, Cloud SQL, or app DB).
3. Orchestration: Webhook or scheduled trigger to push/pull results.
4. App integration: App calls Apify API (or Task) and consumes dataset items.
5. Agent integration: Vertex AI Agent Engine agent consumes curated data/tools, not raw page HTML.

## Decision rules

- For modern browser automation defaults, choose Playwright first.
- For reusable production runs, create an Apify Task from a stable Actor input.
- For low-latency app responses, precompute with schedules/webhooks instead of scraping on-demand.
- For Vertex deployment reproducibility, pin dependencies and keep requirements minimal.
- For secrets, use managed secrets (Secret Manager on GCP, Secrets in Apify) instead of hardcoding.

## Implementation workflow

1. Confirm target websites, fields, cadence, and legal constraints.
2. Define extraction selectors and validation checks for each field.
3. Build/iterate Actor locally; capture retries and anti-blocking strategy.
4. Persist outputs with schema versioning (for backward compatibility).
5. Add operational controls: schedules, alerts, failure thresholds, idempotency keys.
6. Expose clean contract to app/agent (typed JSON model, stable field names).
7. Deploy agent/app side with env vars and IAM permissions.

## Output contract template

Use stable payloads like:

```json
{
  "source": "example-site",
  "fetched_at": "2026-02-17T00:00:00Z",
  "entity_id": "sku-123",
  "title": "Item title",
  "price": 19.99,
  "currency": "USD",
  "url": "https://example.com/item/sku-123",
  "metadata": {
    "selector_version": "v1",
    "run_id": "apify-run-id"
  }
}
```

## Quick checks before shipping

- Data quality: required fields present, numeric parsing validated, duplicates controlled.
- Reliability: retries/backoff configured, timeout budgets set, dead-letter path defined.
- Security: no secrets in code or logs; least privilege for service accounts/tokens.
- Cost: browser concurrency tuned, schedule frequency justified, storage retention defined.
- Observability: run IDs correlated across Apify and GCP logs/metrics.

## Additional resources

- Deployment and Agent Engine details: [reference.md](reference.md)
- Scraping operations playbook: [playbooks.md](playbooks.md)
