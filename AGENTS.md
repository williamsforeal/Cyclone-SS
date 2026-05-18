# AGENTS.md

## Cursor Cloud specific instructions

### Architecture overview
This is a Docker Compose stack with three services: PostgreSQL 16 (port 5432), n8n workflow engine (port 5678), and the Bomb Ecom OS app (port 5000). The primary app is in `bom-ecom/` — a React 18 + Express 5 + Vite 7 monolith. See `DOCKER-SETUP.md` and `QUICK-START.md` for full details.

### Running the bom-ecom app locally (dev mode)
The app does **not** auto-load `.env` files. You must export environment variables before running:
```bash
cd bom-ecom
export $(grep -v '^#' .env | xargs)
npm run dev
```
The dev server starts at `http://localhost:5000` with Vite HMR.

### PostgreSQL
Start a local PostgreSQL instance before running the app:
```bash
docker run -d --name postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=bomb_ecom -p 5432:5432 postgres:16-alpine
```
The `DATABASE_URL` in `bom-ecom/.env` should be `postgresql://postgres:password@localhost:5432/bomb_ecom`.

Push the Drizzle ORM schema:
```bash
cd bom-ecom && npx drizzle-kit push
```

### Docker daemon in Cloud Agent VMs
Docker requires special configuration in Cloud Agent VMs (nested containers). After installing Docker:
- Use `fuse-overlayfs` storage driver
- Switch to `iptables-legacy`
- Start with `sudo dockerd &>/tmp/dockerd.log &`
- Fix permissions: `sudo chmod 666 /var/run/docker.sock`

### Key commands (bom-ecom)
| Task | Command |
|------|---------|
| Dev server | `npm run dev` (after exporting env vars) |
| TypeScript check | `npm run check` (has pre-existing type errors) |
| Build | `npm run build` |
| DB schema push | `npx drizzle-kit push` |

### Gotchas
- `npm run check` (tsc) has pre-existing type errors from Express 5 `req.query` typing and missing `@aws-sdk/client-bedrock-runtime`. These do not block development since `tsx` and `esbuild` skip type checking.
- The app health endpoint (`/api/health`) returns 200 even when Airtable/external services are unreachable — it only checks DB connectivity and Airtable table structure.
- n8n is optional for basic UI/API development; it's needed for workflow automation pipelines.
- The root `package.json` is for the standalone ad monitor (`server.js` on port 3001), not for the main bom-ecom app.
