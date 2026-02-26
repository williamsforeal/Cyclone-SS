# AGENTS.md

## Cursor Cloud specific instructions

### Architecture

This is a monorepo for **Cyclone-SS / Bomb Ecom OS**, a DTC e-commerce ad operations platform. The primary application is `bom-ecom/` (React + Express + Drizzle ORM on PostgreSQL). See `DOCKER-SETUP.md` and `QUICK-START.md` for full architecture docs.

### Required services

| Service | How to start | Port |
|---------|-------------|------|
| PostgreSQL 16 | `sudo docker start postgres` (container already created) or `sudo docker run -d --name postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=devpassword -e POSTGRES_DB=bomb_ecom -p 5432:5432 postgres:16-alpine` | 5432 |
| Bom-Ecom App (dev) | `cd bom-ecom && set -a && source .env && set +a && NODE_ENV=development npx tsx server/index.ts` | 5000 |

n8n (port 5678) is optional for local development; the bom-ecom app functions without it.

### Environment variables

The `bom-ecom/.env` file must be sourced before running the dev server because `tsx` does not auto-load `.env` files. Use `set -a; source .env; set +a` before starting. The `DATABASE_URL` env var is required for both the dev server and `drizzle-kit push`.

### Key commands (bom-ecom/)

| Task | Command |
|------|---------|
| Dev server | `NODE_ENV=development npx tsx server/index.ts` |
| Type check | `npx tsc --noEmit` (pre-existing TS errors in `server/routes.ts` — Express query param types) |
| Build | `npm run build` |
| DB schema push | `npx drizzle-kit push` |
| Health check | `curl http://localhost:5000/api/health` |

### Gotchas

- The root `package.json` is for n8n + standalone tools (`server.js`). The main app is in `bom-ecom/`.
- Use Node.js 20 (matching the Dockerfile). The VM has nvm with Node 20 set as default.
- `bom-ecom/` uses `package-lock.json` (npm), not pnpm or yarn.
- Docker must be started before PostgreSQL: `sudo dockerd &>/dev/null &` if the daemon is not running.
- The Docker daemon needs `fuse-overlayfs` storage driver and `iptables-legacy` in the cloud VM environment.
