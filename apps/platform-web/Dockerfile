FROM node:22-alpine AS builder
WORKDIR /app

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

COPY --from=builder /app/apps/platform-web/.next/standalone ./
RUN npm install --omit=dev --ignore-scripts
COPY --from=builder /app/apps/platform-web/.next/static ./apps/platform-web/.next/static
COPY --from=builder /app/apps/platform-web/public ./apps/platform-web/public

EXPOSE 8080
CMD ["node", "server.js"]
