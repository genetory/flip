FROM node:22-alpine AS builder
# ci trigger: rebuild web image
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=${NEXT_PUBLIC_GA_MEASUREMENT_ID}
ARG NEXT_PUBLIC_ADSENSE_CLIENT_ID
ENV NEXT_PUBLIC_ADSENSE_CLIENT_ID=${NEXT_PUBLIC_ADSENSE_CLIENT_ID}
ARG NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_LEFT
ENV NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_LEFT=${NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_LEFT}
ARG NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_RIGHT
ENV NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_RIGHT=${NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_RIGHT}

COPY package*.json ./
COPY apps/platform-web/package.json apps/platform-web/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/api/prisma apps/api/prisma

RUN for i in 1 2 3; do npm ci --no-audit --no-fund && exit 0; echo "npm ci failed (attempt $i), retrying..."; sleep 15; done; exit 1

COPY . .
RUN npm run build -w apps/platform-web

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/platform-web ./apps/platform-web

EXPOSE 8080
CMD ["sh", "-c", "cd apps/platform-web && node ../../node_modules/next/dist/bin/next start -H 0.0.0.0 -p 8080"]
