FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/platform-web/package.json apps/platform-web/package.json

RUN npm ci

COPY . .
RUN npm run build -w apps/api

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV API_PORT=8080

COPY --from=builder /app /app

EXPOSE 8080
CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && node dist/index.js"]
