# Cyclone-SS
massive-scalin-ads

## Docker & n8n Setup

This project uses Docker Compose to run n8n workflow automation.

### Prerequisites
- Docker Desktop installed and running
- Docker Compose (usually included with Docker Desktop)

### Quick Start

<<<<<<< Current (Your changes)
1. **Start n8n with Docker Compose:**
   docker-compose up -d
=======
1. **Start n8n (and optionally ComfyUI):**
   ```bash
   docker-compose up -d                    # n8n only
   docker-compose --profile comfyui up -d  # n8n + ComfyUI (NVIDIA GPU)
>>>>>>> Incoming (Background Agent changes)
   ```

2. **Access n8n Web Interface:**
   - Open your browser and go to: http://localhost:5678
   - Default credentials:
     - Username: `admin`
     - Password: `changeme`
   - **Important:** Change the password after first login!

3. **Stop n8n:**
   ```bash
   docker-compose down
   ```

4. **View logs:**
   ```bash
   docker-compose logs -f n8n
   ```

### Configuration

- Edit `docker-compose.yml` to customize n8n settings
- Workflows are stored in the `workflows/` directory
- n8n data is persisted in a Docker volume named `n8n_data`

### Environment Variables

Copy `.env.example` to `.env` and customize:
```bash
cp .env.example .env
```

Then edit `.env` with your preferred settings.

### Workflows

- **n8n**: Place workflow JSON files in `workflows/`. Import via n8n web interface (Workflows → Import from File).
- **ComfyUI**: Place workflow JSON in `comfyui-workflows/`. Load in ComfyUI (File → Load) or send via API to `http://localhost:8188/prompt`.

### ComfyUI

- **URL**: http://localhost:8188 (when running with `--profile comfyui`)
- **GPU**: Uses NVIDIA GPU by default. For CPU-only, switch image to `ghcr.io/ai-dock/comfyui:latest-cpu` and remove the `deploy.resources` section in `docker-compose.yml`.
- **Workflows**: See `comfyui-workflows/README.md` for API format and examples.
