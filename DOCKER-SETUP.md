# Docker Setup Guide - Bomb Ecom OS

Complete guide for running THE BOMB ECOM OS (n8n + PostgreSQL + Replit App) in Docker.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Docker Compose Stack                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐       │
│  │  PostgreSQL  │   │     n8n      │   │  Bom-Ecom    │       │
│  │              │   │              │   │     App      │       │
│  │  Port: 5432  │   │  Port: 5678  │   │  Port: 5000  │       │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘       │
│         │                  │                  │                │
│         └──────────────────┴──────────────────┘                │
│                      n8n-network                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │                  │                  │
         └─── Data ─────────┴───── Webhooks ───┘
```

## Services

1. **PostgreSQL** (port 5432)
   - Database for product research, trends, competitor intel
   - Persistent volume: `postgres_data`

2. **n8n** (port 5678)
   - Workflow automation engine
   - Triggers: webhooks from Bom-Ecom app
   - Actions: Airtable, OpenAI, fal.ai, AWS S3, etc.
   - Persistent volume: `n8n_data`

3. **Bom-Ecom** (port 5000)
   - React frontend + Express backend
   - Triggers n8n workflows via webhooks
   - Reads/writes Airtable and PostgreSQL
   - Serves UI at http://localhost:5000

## Prerequisites

- Docker Desktop installed
- Git repository cloned
- `.env` file configured

## Quick Start

### 1. Configure Environment Variables

```bash
# Copy example to .env
cp .env.example .env

# Edit .env with your credentials
# Required: AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AWS credentials
```

### 2. Start All Services

```bash
# Build and start all containers
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f bom-ecom
docker-compose logs -f n8n
docker-compose logs -f postgres
```

### 3. Verify Services Are Running

```bash
# Check container status
docker-compose ps

# Expected output:
# NAME        STATUS        PORTS
# postgres    Up (healthy)  5432
# n8n         Up            5678
# bom-ecom    Up (healthy)  5000
```

### 4. Access Services

- **Bom-Ecom UI**: http://localhost:5000
- **n8n**: http://localhost:5678
  - Username: admin (from .env)
  - Password: changeme (from .env)
- **PostgreSQL**: localhost:5432
  - Database: bomb_ecom
  - User: postgres
  - Password: (from .env)

## Database Setup

### Initialize Database Schema

The Bom-Ecom app uses Drizzle ORM. Run migrations:

```bash
# Enter the bom-ecom container
docker exec -it bom-ecom sh

# Push schema to database
npm run db:push

# Exit container
exit
```

### Verify Database

```bash
# Connect to PostgreSQL
docker exec -it postgres psql -U postgres -d bomb_ecom

# List tables
\dt

# Expected tables:
# product_candidates
# competitor_intel
# trend_items
# product_criteria_checks
# uploaded_media

# Exit
\q
```

## Import n8n Workflows

### Option 1: Using Skills

```bash
# From your local machine (not in Docker)
/list-workflows
/validate-workflow workflows/static-scaler-v3.json
/import-workflow workflows/static-scaler-v3.json
```

### Option 2: Manual Import

1. Open http://localhost:5678
2. Login with credentials from .env
3. Click "Workflows" → "Import from File"
4. Select workflow JSON from `/workflows` directory
5. Save and activate

## Test Bedrock Integration

```bash
# Enter bom-ecom container
docker exec -it bom-ecom sh

# Run Bedrock test
npx tsx test-bedrock.ts

# Expected output:
# ✅ All Bedrock tests passed!

# Exit
exit
```

## Common Commands

### Start/Stop Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Restart specific service
docker-compose restart bom-ecom
docker-compose restart n8n
docker-compose restart postgres
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f bom-ecom
docker-compose logs -f n8n

# Last 100 lines
docker-compose logs --tail=100 bom-ecom
```

### Rebuild After Code Changes

```bash
# Rebuild bom-ecom after code changes
docker-compose build bom-ecom

# Restart with new build
docker-compose up -d bom-ecom
```

### Database Management

```bash
# Backup database
docker exec postgres pg_dump -U postgres bomb_ecom > backup.sql

# Restore database
docker exec -i postgres psql -U postgres bomb_ecom < backup.sql

# Reset database (⚠️ deletes all data)
docker-compose down -v
docker-compose up -d postgres
# Wait for postgres to be healthy, then:
docker exec -it bom-ecom npm run db:push
```

## Environment Variables

### Required for All Services

```env
# Airtable
AIRTABLE_BASE_ID=appvPrfjiuXIhdNuW
AIRTABLE_API_KEY=your_key

# AWS (for Bedrock + S3)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=strong_password_here
POSTGRES_DB=bomb_ecom

# Session
SESSION_SECRET=random_32_char_minimum_secret
```

### Optional Services

```env
# OpenAI (alternative to Bedrock)
OPENAI_API_KEY=sk-proj-xxx

# fal.ai (image generation)
FAL_AI_API_KEY=your_key

# BannerBear (ad creative)
BANNERBEAR_API_KEY=your_key

# Notion (optional)
NOTION_API_KEY=your_key
NOTION_DATABASE_ID=your_id
```

## Networking

All services communicate via the `n8n-network` Docker network:

**Internal URLs (from within containers):**
- PostgreSQL: `postgresql://postgres:password@postgres:5432/bomb_ecom`
- n8n: `http://n8n:5678/webhook/`
- Bom-Ecom: `http://bom-ecom:5000`

**External URLs (from your machine):**
- PostgreSQL: `localhost:5432`
- n8n: `http://localhost:5678`
- Bom-Ecom: `http://localhost:5000`

## Troubleshooting

### Bom-Ecom App Won't Start

```bash
# Check logs
docker-compose logs bom-ecom

# Common issues:
# 1. PostgreSQL not ready → wait for healthy status
# 2. Missing .env variables → check .env file
# 3. Build failed → rebuild: docker-compose build bom-ecom
```

### n8n Can't Connect to Services

```bash
# Verify all containers are on same network
docker network inspect cyclone-ss_n8n-network

# Check environment variables are passed
docker exec n8n env | grep AIRTABLE
docker exec n8n env | grep AWS
```

### PostgreSQL Connection Errors

```bash
# Check if PostgreSQL is healthy
docker-compose ps postgres

# If not healthy, check logs
docker-compose logs postgres

# Recreate if needed
docker-compose down postgres
docker-compose up -d postgres
```

### Port Already in Use

```bash
# If port 5000, 5678, or 5432 is in use:

# Option 1: Stop conflicting service
# On Windows: netstat -ano | findstr :5000

# Option 2: Change port in docker-compose.yml
# Change "5000:5000" to "5001:5000" (host:container)
```

## Health Checks

All services have health checks:

```bash
# Check health status
docker-compose ps

# Manual health checks:
curl http://localhost:5000/api/health
curl http://localhost:5678/healthz
docker exec postgres pg_isready -U postgres
```

## Data Persistence

Data is stored in Docker volumes:

```bash
# List volumes
docker volume ls | grep cyclone

# cyclone-ss_n8n_data       - n8n workflows and credentials
# cyclone-ss_postgres_data  - PostgreSQL database

# Backup volumes
docker run --rm -v cyclone-ss_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

## Production Deployment

For production deployment:

1. **Update docker-compose.yml**:
   - Add `--restart always` policies
   - Configure reverse proxy (nginx/traefik)
   - Enable HTTPS/SSL
   - Set secure passwords

2. **Environment**:
   - Use production-grade PostgreSQL (RDS, managed service)
   - Enable Bedrock for cost optimization
   - Configure CloudFront for S3 assets
   - Set up monitoring (Grafana, DataDog)

3. **Security**:
   - Never expose PostgreSQL port publicly
   - Use secrets management (AWS Secrets Manager)
   - Enable n8n authentication
   - Configure CORS properly

## Next Steps

1. ✅ Services running → Import n8n workflows
2. ✅ Workflows imported → Test with sample data
3. ✅ Tests passing → Connect to Airtable
4. ✅ Airtable connected → Access UI and start building

## Support

- **Docker Issues**: Check Docker Desktop status
- **n8n Issues**: Check n8n logs and documentation
- **App Issues**: Check bom-ecom logs and API responses
- **Database Issues**: Check PostgreSQL logs and connections

For specific errors, always check logs first:
```bash
docker-compose logs -f [service-name]
```
