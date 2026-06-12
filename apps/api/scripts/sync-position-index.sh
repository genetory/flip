#!/bin/bash
# /positions 에서 "오직 Aply에서만!" 탭 응답이 느린 문제 fix.
# 복합 인덱스 (sourceProvider, status, createdAt, id) 를 추가해 INTERNAL +
# OPEN + 최신순 쿼리가 한 인덱스로 끝나게 만든다.
#
# CONCURRENTLY 로 만들어 trafic 영향 없음. prisma db push 가 같은 이름의
# 인덱스를 발견하면 no-op 으로 끝나므로 schema.prisma 와 DB 가 동기화.
#
# 사용:
#   bash apps/api/scripts/sync-position-index.sh           # 운영 + 스테이징
#   bash apps/api/scripts/sync-position-index.sh prod      # 운영만
#   bash apps/api/scripts/sync-position-index.sh staging   # 스테이징만

set -euo pipefail

TARGET="${1:-all}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT"

INDEX_NAME="Position_sourceProvider_status_createdAt_id_idx"

echo "[setup] Looking up rg-aply across subscriptions..."
for SUB in $(az account list --query "[].id" -o tsv); do
  az account set --subscription "$SUB" >/dev/null
  if az group show -n rg-aply --query name -o tsv 2>/dev/null >/dev/null; then
    echo "[setup] ✅ rg-aply found in subscription: $SUB"
    break
  fi
done

sync_one() {
  local LABEL="$1"
  local APP_NAME="$2"
  local PG_NAME="$3"
  local LABEL_LOWER
  LABEL_LOWER=$(printf '%s' "$LABEL" | tr '[:upper:]' '[:lower:]')
  local RULE_NAME="temp-idx-${LABEL_LOWER}-$(date +%s)"
  local DATABASE_URL_VAR=""

  echo
  echo "============================================="
  echo "[$LABEL] $APP_NAME → $PG_NAME"
  echo "============================================="

  echo "[$LABEL] Pulling DATABASE_URL from $APP_NAME..."
  DATABASE_URL_VAR=$(az webapp config appsettings list \
    -n "$APP_NAME" -g rg-aply \
    --query "[?name=='DATABASE_URL'].value | [0]" -o tsv)

  if [ -z "$DATABASE_URL_VAR" ]; then
    echo "[$LABEL] ❌ Could not read DATABASE_URL from $APP_NAME"
    return 1
  fi
  echo "[$LABEL] host: $(echo "$DATABASE_URL_VAR" | sed -E 's#.*@([^/]+)/.*#\1#')"

  echo "[$LABEL] Allowing my IP on $PG_NAME firewall (rule: $RULE_NAME)..."
  local MY_IP
  MY_IP=$(curl -s https://api.ipify.org)
  az postgres flexible-server firewall-rule create \
    --resource-group rg-aply --name "$PG_NAME" \
    --rule-name "$RULE_NAME" \
    --start-ip-address "$MY_IP" --end-ip-address "$MY_IP" >/dev/null

  trap 'az postgres flexible-server firewall-rule delete \
    --resource-group rg-aply --name '"$PG_NAME"' \
    --rule-name '"$RULE_NAME"' --yes >/dev/null 2>&1 || true' RETURN

  # CREATE INDEX CONCURRENTLY — 락 없이. 이미 있으면 IF NOT EXISTS 로 skip.
  # 이 스크립트가 인덱스의 source-of-truth 다. migrate deploy 는 CONCURRENTLY 를
  # 트랜잭션 안에서 못 돌리므로, 마이그레이션 파일이 아닌 이 out-of-band 스크립트로
  # 적용한다. IF NOT EXISTS 라 idempotent — 여러 번 돌려도 안전.
  #
  # ⚠️ 의도적으로 `prisma db push --accept-data-loss` 를 쓰지 않는다. db push 는
  # schema.prisma 전체를 DB 에 강제 동기화하는데, 마이그레이션이 source-of-truth 인
  # 이 환경에서 조금이라도 drift 가 있으면 prod 컬럼/데이터를 파괴할 수 있다.
  echo "[$LABEL] Creating composite index CONCURRENTLY..."
  npm exec --workspace=apps/api -- prisma db execute --url "$DATABASE_URL_VAR" --stdin <<SQL
CREATE INDEX CONCURRENTLY IF NOT EXISTS "$INDEX_NAME"
  ON "Position" ("sourceProvider", "status", "createdAt", "id");
SQL

  echo "[$LABEL] ✅ Index created (or already present)."
}

if [ "$TARGET" = "all" ] || [ "$TARGET" = "prod" ]; then
  sync_one "PROD" "aply-api-production" "pg-aply"
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "staging" ]; then
  sync_one "STAGING" "api-staging" "pg-aply-staging"
fi

echo
echo "Done."
