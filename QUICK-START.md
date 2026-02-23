# Quick Start - Bomb Ecom OS

Get THE BOMB ECOM OS running in 5 minutes.

## Step 1: Environment Setup (2 min)

```bash
# Copy environment template
cp .env.example .env

# Edit .env - REQUIRED values:
# - AIRTABLE_API_KEY
# - AIRTABLE_BASE_ID
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
# - POSTGRES_PASSWORD (change default!)
# - SESSION_SECRET (32+ chars random string)
```

## Step 2: Start Services (1 min)

```bash
# Start everything
docker-compose up -d

# Watch startup logs
docker-compose logs -f
```

## Step 3: Initialize Database (1 min)

```bash
# Push schema to PostgreSQL
docker exec -it bom-ecom npm run db:push
```

## Step 4: Access & Verify (1 min)

Open in your browser:
- **Bom-Ecom App**: http://localhost:5000
- **n8n Workflows**: http://localhost:5678 (admin/changeme)

## Test Bedrock (Optional)

```bash
docker exec -it bom-ecom npx tsx test-bedrock.ts
```

## Import Workflows

```bash
# See workflows
/list-workflows

# Import
/import-workflow workflows/static-scaler-v3.json
```

---

## That's It! 🎉

**You now have:**
- ✅ Bom-Ecom UI at localhost:5000
- ✅ n8n at localhost:5678
- ✅ PostgreSQL at localhost:5432
- ✅ Ready to automate DTC ads

## Common Commands

```bash
# Stop
docker-compose down

# Restart
docker-compose restart

# Logs
docker-compose logs -f bom-ecom

# Rebuild after code changes
docker-compose build bom-ecom && docker-compose up -d bom-ecom
```

## Need Help?

See [DOCKER-SETUP.md](./DOCKER-SETUP.md) for detailed documentation.
