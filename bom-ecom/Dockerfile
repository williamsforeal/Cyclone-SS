# Bomb Ecom OS - Docker Configuration
# Multi-stage: build with all deps, run with production only
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
# Install ALL deps (including devDeps like tsx needed for build)
RUN npm ci
COPY . .
RUN npm run build

# --- Production stage ---
FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 5000
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
CMD ["npm", "start"]
