# Cyclone-SS
massive-scalin-ads

## Docker & n8n Setup

This project uses Docker Compose to run n8n workflow automation.

### Prerequisites
- Docker Desktop installed and running
- Docker Compose (usually included with Docker Desktop)

### Quick Start

1. **Start n8n with Docker Compose:**
   docker-compose up -d
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

Place your n8n workflow JSON files in the `workflows/` directory. You can import them through the n8n web interface.
