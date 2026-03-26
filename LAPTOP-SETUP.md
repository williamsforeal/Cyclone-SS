# Cyclone-SS — Laptop Setup Guide

This guide sets up the full Bomb Ecom OS dev environment on a new machine.
Follow these steps in order. When you're done, you'll have n8n + Bomb Ecom OS running on Docker.

---

## Prerequisites

Install these before starting:

1. **Docker Desktop** — https://www.docker.com/products/docker-desktop/
   - Enable "Start Docker Desktop when you log in" for always-on operation
2. **Git** — https://git-scm.com/download/win
3. **Claude Code CLI** — `npm install -g @anthropic-ai/claude-code` (requires Node.js)

---

## Step 1 — Clone the Repo

```bash
git clone --recurse-submodules https://github.com/williamsforeal/Cyclone-SS.git
cd Cyclone-SS
```

`--recurse-submodules` pulls ComfyUI and efficiency-nodes automatically.

---

## Step 2 — Create Your .env File

The `.env` file holds all API keys and is never committed to git.

```bash
cp .env.example .env
```

Then open `.env` and fill in your actual values. Copy from your desktop machine or password manager. Required keys for basic operation:

| Key | Required for |
|-----|-------------|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Database |
| `N8N_BASIC_AUTH_USER` / `N8N_BASIC_AUTH_PASSWORD` | n8n login |
| `SESSION_SECRET` | Bomb Ecom OS sessions |
| `AIRTABLE_API_KEY` / `AIRTABLE_BASE_ID` | Airtable integration |
| `OPENAI_API_KEY` | AI features |
| `FAL_AI_API_KEY` | Image generation |

All other keys can be added later as you use those features.

---

## Step 3 — Start Docker Services

```bash
docker-compose up -d postgres n8n bom-ecom
```

Wait ~30 seconds for all services to become healthy, then verify:

```bash
docker ps --filter "name=n8n" --filter "name=postgres" --filter "name=bom-ecom" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

All three should show `healthy` or `Up`.

---

## Step 4 — Verify Services

| Service | URL | Credentials |
|---------|-----|-------------|
| n8n | http://localhost:5678 | admin / (your N8N_BASIC_AUTH_PASSWORD from .env) |
| Bomb Ecom OS | http://localhost:5000 | — |
| PostgreSQL | localhost:5432 | (your POSTGRES_USER / POSTGRES_PASSWORD) |

---

## Step 5 — Re-enter n8n Credentials (IMPORTANT)

n8n workflow **files** are in `workflows/` and synced via git. But **credentials** (API keys you configure in the n8n UI) are stored encrypted in a Docker volume — they do NOT transfer between machines.

On first run, go to **n8n → Settings → Credentials** and re-add:
- Airtable
- OpenAI
- AWS
- fal.ai
- Any other services your workflows use

Use the values from your `.env` file as reference.

---

## Step 6 — ComfyUI Setup

ComfyUI runs **natively on Windows** (not in Docker) for GPU access.

The `comfyui/ComfyUI` directory in this repo is the ComfyUI source (submodule). However, the recommended setup is the **portable Windows installer** which bundles Python:

**If you have an AMD GPU (RX 9060 XT or similar):**
- Download the AMD portable build from https://github.com/comfyanonymous/ComfyUI/releases
- Extract to `C:\Users\<YourName>\Downloads\ComfyUI_windows_portable`
- Copy custom nodes from `comfyui/custom_nodes/` into the install's `ComfyUI\custom_nodes\` folder

**If you have NVIDIA or Intel GPU:**
- Download the appropriate portable build for your GPU from the same releases page

**Update `start-dev.bat`** — line 22 has the hardcoded portable path. Change it to match where you installed ComfyUI:
```bat
start "ComfyUI" cmd /k "cd /d C:\Users\<YourName>\Downloads\ComfyUI_windows_portable && .\python_embeded\python.exe -s ComfyUI\main.py --windows-standalone-build --listen 127.0.0.1 --port 8188"
```

---

## Day-to-Day Startup

Double-click `start-dev.bat` in the repo root. It:
1. Starts Docker containers (n8n + postgres + bom-ecom)
2. Opens ComfyUI in a separate terminal window
3. Opens browser tabs for all services

---

## Staying in Sync with Desktop

This repo is on the `dev` branch. Pull latest before working:

```bash
git pull origin dev
git submodule update --init --recursive
```

Push your changes:
```bash
git add .
git commit -m "your message"
git push origin dev
```

**Never force-push to main.**

---

## Troubleshooting

**Containers won't start:**
```bash
docker-compose logs n8n
docker-compose logs bom-ecom
```

**Port already in use:**
```bash
docker-compose down
docker-compose up -d postgres n8n bom-ecom
```

**bom-ecom crashes on startup:**
- Check `DATABASE_URL` in docker-compose.yml matches your POSTGRES_* values in .env
- Wait for postgres to be fully healthy before bom-ecom tries to connect (should be automatic via `depends_on`)

**n8n shows blank / login loop:**
- Clear browser cache or open in incognito
- Verify `N8N_BASIC_AUTH_ACTIVE=true` in .env
