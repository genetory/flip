FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/platform-web/package.json apps/platform-web/package.json
COPY apps/api/prisma apps/api/prisma

RUN for i in 1 2 3; do npm ci --no-audit --no-fund && exit 0; echo "npm ci failed (attempt $i), retrying..."; sleep 15; done; exit 1

COPY . .
RUN npm run build -w apps/api

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV API_PORT=8080

COPY --from=builder /app /app

EXPOSE 8080
CMD ["sh", "-c", "cd apps/api && (npx prisma migrate resolve --rolled-back 20260512014557_init 2>/dev/null || true) && (npx prisma migrate resolve --rolled-back 20260512024556_init 2>/dev/null || true) && npx prisma migrate deploy && node dist/index.js"]
