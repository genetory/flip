#!/usr/bin/env bash
set -e

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo ".env file created from .env.example"
fi

set -a
. ./.env
set +a

echo "Starting PostgreSQL with Docker..."
docker compose up -d

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
npm run db:generate

echo "Running Prisma migrations..."
npm run db:migrate

echo "Starting platform-web + partner-admin + ops-admin + api development servers..."
npm run dev
