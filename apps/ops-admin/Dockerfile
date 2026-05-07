FROM node:22-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY package*.json ./
COPY apps/ops-admin/package.json apps/ops-admin/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/api/prisma apps/api/prisma

RUN for i in 1 2 3; do npm ci --no-audit --no-fund && exit 0; echo "npm ci failed (attempt $i), retrying..."; sleep 15; done; exit 1

COPY . .
RUN npm run build -w apps/ops-admin

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/ops-admin ./apps/ops-admin

EXPOSE 8080
CMD ["sh", "-c", "cd apps/ops-admin && node ../../node_modules/next/dist/bin/next start -H 0.0.0.0 -p 8080"]
