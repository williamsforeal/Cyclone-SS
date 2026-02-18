---
title: Apify + Google Cloud playbooks
---

# Playbook 1: Add scraping to an existing app

1. Define data contract (fields, types, freshness SLA).
2. Build Apify Actor for one source and validate output schema.
3. Promote stable Actor input into an Apify Task.
4. Configure schedule (batch) or trigger endpoint (on demand).
5. Consume Dataset items in app ingestion job.
6. Add quality gates (required fields, dedupe keys, sanity ranges).

# Playbook 2: Event-driven pipeline with webhooks

1. Start Actor/Task run.
2. On run completion webhook, pass `runId` and source metadata.
3. Fetch run dataset items.
4. Transform and upsert into destination store.
5. Emit success/failure event for monitoring.

Notes:
- Use idempotency key = source + entity_id + fetched_at bucket.
- Keep retry policy bounded and visible in logs.

# Playbook 3: Prepare data for Vertex agent usage

1. Keep scraping and agent reasoning as separate concerns.
2. Publish cleaned records behind an internal API/tool method.
3. Define operation schema for agent method calls.
4. Deploy Agent Engine with pinned dependencies and env vars.
5. Load test expected traffic and tune runtime controls.

# Playbook 4: Reliability and anti-blocking guardrails

- Rotate user agents and respect target site terms.
- Cap concurrency per domain and add jittered backoff.
- Detect selector drift and alert when extraction confidence drops.
- Snapshot failed pages for debugging.
- Track per-site success rate and median extraction time.

# Playbook 5: Cost controls

- Prefer scheduled aggregation over repeated on-demand browser runs.
- Reduce browser session lifetime and unnecessary page interactions.
- Persist raw HTML only when required for audits/debugging.
- Set dataset retention and archival policy.
- Align agent runtime min/max instances with actual traffic profile.
