# Apify + Google Cloud Knowledge Pack

This knowledge pack condenses implementation guidance from the provided documentation links for practical app integration.

## Key takeaways

- Apify is the execution layer for scraping and browser automation.
- Playwright is generally the preferred modern browser automation default.
- Production scraping should be run as repeatable tasks with schedules/webhooks.
- Vertex AI Agent Engine deployment is Python-focused and supports object-based or source-based deployment.
- Keep scraping pipelines and agent reasoning interfaces decoupled through curated APIs/data contracts.

## Recommended baseline stack

- **Scraping:** Apify Actor using Playwright.
- **Orchestration:** Apify Task + schedule or webhook.
- **Storage:** Apify Dataset for raw extraction; curated DB/table for app consumption.
- **Agent runtime:** Vertex AI Agent Engine with pinned dependencies and minimal runtime surface.

## Operational checklist

- **Schema control:** Version extracted schemas and avoid silent breaking changes.
- **Data quality:** Validate required fields and numeric parsing.
- **Security:** Use secret managers and avoid credentials in code.
- **Scalability:** Tune concurrency and instance limits from real traffic.
- **Observability:** Correlate run IDs across Apify runs and cloud logs.

## Common pitfalls

- Triggering full browser scraping synchronously in user request paths.
- Coupling LLM agent prompts directly to raw scraped HTML.
- Not pinning dependency versions for deployment reproducibility.
- Ignoring selector drift detection and extraction confidence monitoring.

## Source links

- https://docs.cloud.google.com/agent-builder/agent-engine/deploy
- https://docs.apify.com/academy/puppeteer-playwright
- https://docs.apify.com/academy/apify-platform
- https://docs.apify.com/academy/expert-scraping-with-apify
- https://docs.apify.com/academy/scraping-basics-python/devtools-extracting-data
