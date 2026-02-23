---
title: Apify and Vertex deployment reference
---

# Vertex AI Agent Engine deployment notes

## Core facts

- Agent Engine deployment supports Python agents.
- Two deployment patterns:
  - from in-memory agent object (interactive development)
  - from source files (CI/CD and declarative workflows)

## Source deployment essentials

Required config keys:
- `source_packages`
- `entrypoint_module`
- `entrypoint_object`
- `class_methods`

Common optional keys:
- `requirements_file`
- `display_name`, `description`, `labels`
- `env_vars`
- `service_account` or `identity_type`
- `min_instances`, `max_instances`, `resource_limits`, `container_concurrency`
- `encryption_spec`
- `agent_framework`

## Dependency and build guidance

- Pin package versions for reproducibility.
- Keep dependencies minimal to reduce break risk.
- For source deployments, store dependencies in `requirements.txt` and pass `requirements_file` if needed.
- Use build scripts only for true system dependencies (for example Node CLI tools).

## Environment variable and secret guidance

- Avoid reserved env names used by Google Cloud runtime.
- Prefer Secret Manager references for sensitive values.
- If deployment reads secrets, ensure the Vertex AI Service Agent can access those secret versions.

## Runtime controls

- `min_instances` / `max_instances` control scaling envelope.
- `resource_limits` controls CPU/memory per container.
- `container_concurrency` controls requests processed per container.
- Tune these against scraping latency, memory use, and expected throughput.

# Apify operations reference

## Platform primitives

- Actor: runnable scraping/automation unit.
- Task: saved Actor input profile for consistent repeated runs.
- Dataset: structured output storage for extracted items.
- Schedules/Webhooks: automation and event-driven integration.

## Browser automation defaults

- Prefer Playwright for new builds unless there is a strict Puppeteer dependency.
- Use browser automation only where dynamic rendering is required.
- Extract with resilient selectors and fallback strategies.

## Data extraction baseline

- Start with manual DevTools validation of selectors.
- Extract each field from specific child elements, not broad text blobs.
- Normalize and type-cast values (`trim`, numeric parsing, currency handling).
- Capture page URL and extraction timestamp for traceability.

# Suggested integration topology

1. Apify Actor collects and normalizes data.
2. Actor writes to Dataset and emits webhook on run completion.
3. Webhook triggers app endpoint, workflow engine, or cloud function.
4. Downstream service validates and stores curated data.
5. Vertex agent reads curated data via tool/API instead of scraping directly in runtime path.
