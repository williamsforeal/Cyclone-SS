# N8N Workflows

This directory contains n8n workflow JSON files that can be imported into your n8n instance.

## Importing Workflows

1. Start n8n using `docker-compose up -d`
2. Open http://localhost:5678
3. Login with credentials from .env file
4. Go to Workflows > Import from File
5. Select the workflow JSON file from this directory

## Available Workflows

- **comfyui-trigger.json** – Submits a txt2img workflow to ComfyUI. Import and run manually. Requires ComfyUI container on `n8n-network` at `http://comfyui:8188`.

## Higgsfield (Static Scaler variants)

Workflows `static-scaler-v3*.json` call **Higgsfield Soul** at `https://platform.higgsfield.ai/higgsfield-ai/soul/standard`. Authentication is built in the HTTP Request node as:

`Authorization` = `={{ 'Key ' + $env.HIGGSFIELD_CLIENT_ID + ':' + $env.HIGGSFIELD_CLIENT_SECRET }}`

Set `HIGGSFIELD_CLIENT_ID` and `HIGGSFIELD_CLIENT_SECRET` in your project `.env`. The `n8n` service in `docker-compose.yml` passes these variables into the container; restart n8n after changing `.env`.

To verify credentials before importing a workflow, run from the repo root:

`./scripts/higgsfield-smoke-test.sh` (requires a populated `.env` or exported variables).
