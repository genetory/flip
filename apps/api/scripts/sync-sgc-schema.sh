#!/bin/bash
# 운영 + 스테이징 DB 양쪽에 Prisma 스키마 sync. SgcApplication 테이블 추가
# 같은 추가-only 변경 후 한 번에 실행하도록.
#
# 사용:
#   bash apps/api/scripts/sync-sgc-schema.sh           # 운영 + 스테이징 둘 다
#   bash apps/api/scripts/sync-sgc-schema.sh prod      # 운영만
#   bash apps/api/scripts/sync-sgc-schema.sh staging   # 스테이징만
#
# 각 환경마다:
#  1) App Service appsettings 에서 DATABASE_URL 가져오기
#  2) 본인 IP 임시 방화벽 허용
#  3) prisma db push
#  4) 방화벽 룰 제거
# 4번은 trap 으로 끝/에러/Ctrl+C 모두에서 항상 실행되게.

set -euo pipefail

TARGET="${1:-all}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT"

# rg-aply 가 어느 구독에 있는지 한 번만 찾아 활성화.
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
  # macOS 기본 bash 3.2 는 ${VAR,,} 가 안 되므로 tr 로 lowercase.
  local LABEL_LOWER
  LABEL_LOWER=$(printf '%s' "$LABEL" | tr '[:upper:]' '[:lower:]')
  local RULE_NAME="temp-sync-${LABEL_LOWER}-$(date +%s)"
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

  # trap 으로 어떤 경로(성공/실패/Ctrl+C)든 항상 룰 제거.
  trap 'az postgres flexible-server firewall-rule delete \
    --resource-group rg-aply --name '"$PG_NAME"' \
    --rule-name '"$RULE_NAME"' --yes >/dev/null 2>&1 || true' RETURN

  echo "[$LABEL] Running prisma db push..."
  DATABASE_URL="$DATABASE_URL_VAR" \
    npm exec --workspace=apps/api -- prisma db push --accept-data-loss

  echo "[$LABEL] ✅ Schema synced."
}

if [ "$TARGET" = "all" ] || [ "$TARGET" = "prod" ]; then
  sync_one "PROD" "aply-api-production" "pg-aply"
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "staging" ]; then
  sync_one "STAGING" "api-staging" "pg-aply-staging"
fi

echo
echo "Done."
