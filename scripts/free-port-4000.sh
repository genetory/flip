#!/usr/bin/env bash
set -euo pipefail

PORT=4000

PIDS="$(lsof -ti tcp:${PORT} -sTCP:LISTEN || true)"
if [ -z "${PIDS}" ]; then
  exit 0
fi

echo "[dev:api] Port ${PORT} is in use. Stopping existing process(es): ${PIDS}"
kill ${PIDS} || true
sleep 1

REMAINING="$(lsof -ti tcp:${PORT} -sTCP:LISTEN || true)"
if [ -n "${REMAINING}" ]; then
  echo "[dev:api] Force stopping remaining process(es): ${REMAINING}"
  kill -9 ${REMAINING} || true
fi
