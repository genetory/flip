FROM node:22-alpine AS builder
# ci trigger: rebuild web image
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY package*.json ./
COPY apps/platform-web/package.json apps/platform-web/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/api/prisma apps/api/prisma

RUN npm ci

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
