# Cyclone-SS
massive-scalin-ads

## 🚀 Quick Start (Recommended)

**Start everything with one command:**
```bash
.\start-dev.bat
```

This launches:
- ✅ n8n workflow automation → http://localhost:5678
- ✅ PostgreSQL database
- ✅ ComfyUI (AI image generation) → http://127.0.0.1:8188

**Stop everything:**
```bash
.\stop-dev.bat
```

**Default n8n login:**
- Username: `admin`
- Password: `changeme` (change after first login!)

---

## Docker & n8n Setup

This project uses Docker Compose to run n8n workflow automation and PostgreSQL.

### Prerequisites
- Docker Desktop installed and running
- Docker Compose (usually included with Docker Desktop)
- ComfyUI portable (AMD) installed at: `C:\Users\Jake\Downloads\ComfyUI_windows_portable_amd\`

### Manual Startup (Alternative)

If you prefer to start services individually:

1. **Start n8n + PostgreSQL:**
   ```bash
   docker-compose up -d n8n postgres
   ```

2. **Start ComfyUI:**
   ```bash
   .\scripts\launch-comfyui.bat
   ```

3. **Access Web Interfaces:**
   - n8n: http://localhost:5678
   - ComfyUI: http://127.0.0.1:8188

4. **Stop services:**
   ```bash
   docker-compose down
   ```

5. **View logs:**
   ```bash
   docker-compose logs -f n8n
   ```

### Configuration

- Edit `docker-compose.yml` to customize n8n settings
- Workflows are stored in the `workflows/` directory
- n8n data is persisted in a Docker volume named `n8n_data`

### Security Notes

**Important:** The `n8n_data/` directory contains sensitive runtime data including:
- Encryption keys used to secure credentials and workflow data
- Database files with workflow and execution history
- Runtime logs and crash reports

**Never commit `n8n_data/` to version control.** This directory is automatically ignored via `.gitignore`. If sensitive data was previously committed, you must:

1. Ensure no other git processes are running (close editors, terminals with git commands)
2. Remove it from git tracking: `git rm --cached -r n8n_data/`
3. Commit the removal: `git commit -m "Remove sensitive n8n_data from version control"`
4. Rotate the encryption key in n8n settings (Settings > Security)
5. Review and rotate any exposed credentials

**Note:** If you encounter a "File exists" error for `.git/index.lock`, another git process is running. Close all git-related processes and try again.

### Environment Variables

Copy `.env.example` to `.env` and customize:
```bash
cp .env.example .env
```

Then edit `.env` with your preferred settings. Keep `N8N_HOST=0.0.0.0` so
n8n listens on all interfaces inside the container and the host can reach it.

### Workflows

Place your n8n workflow JSON files in the `workflows/` directory. You can import them through the n8n web interface.

## 🚀 Production Deployment

Planning to deploy Cyclone-SS as a SaaS application? See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for:
- AWS deployment options (ECS/Fargate, EC2, App Runner)
- IAM role setup guidance
- Domain and SSL configuration
- Cost estimates
- Security best practices
- Complete migration checklist

The deployment guide will help you transition from local development to a production-ready SaaS platform.
