# Azure 배포 체크리스트 (Docker 전환)

## 1) 리소스 준비
- Resource Group: `rg-aply`
- App Service (Linux, Container) 2개
  - `platform-web-staging` / `platform-web-production`
  - `api-staging` / `api-production`
- PostgreSQL (Flexible Server)
  - `pg-aply-staging` (DB: `aply`)
  - `pg-aply-production` (DB: `aply`)
- Container Registry 1개 (Docker Hub/ACR/GHCR 중 하나)

## 2) GitHub Environment 준비
- `staging`, `production` 생성
- 각 Environment에 동일 키 이름으로 시크릿 등록:
  - `REGISTRY_SERVER` (예: `ghcr.io/<org>` 또는 `acraply.azurecr.io`)
  - `REGISTRY_USERNAME`
  - `REGISTRY_PASSWORD`
  - `WEB_IMAGE_NAME` (예: `platform-web`)
  - `API_IMAGE_NAME` (예: `api`)
  - `AZURE_WEBAPP_PLATFORM_NAME`
  - `AZURE_WEBAPP_PLATFORM_PUBLISH_PROFILE`
  - `AZURE_WEBAPP_API_NAME`
  - `AZURE_WEBAPP_API_PUBLISH_PROFILE`

## 3) App Service를 Container 모드로 설정
각 App Service에서:
- Deployment Center > Source: Container Registry
- 임시 이미지 지정(아무 태그 1회) 후 저장
- 이후 GitHub Actions가 새 태그로 교체 배포

## 4) App Settings (staging 예시)
### platform-web-staging
- `NODE_ENV=production`
- `PORT=8080`
- `NEXT_PUBLIC_API_URL=https://<api-staging-domain>`

### api-staging
- `NODE_ENV=production`
- `API_PORT=8080`
- `DATABASE_URL=postgresql://<USER>:<PASS>@pg-aply-staging.postgres.database.azure.com:5432/aply?sslmode=require`
- `JWT_SECRET`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `PLATFORM_WEB_URL=https://<platform-web-staging-domain>`
- `PARTNER_ADMIN_URL`
- `OPS_ADMIN_URL`
- `OPENAI_API_KEY` (선택)

## 5) 배포 트리거
- `develop` push -> `staging` 환경으로 이미지 빌드/푸시/배포
- `main` push -> `production` 환경으로 이미지 빌드/푸시/배포

## 6) 확인
- API health: `https://<api-domain>/health`
- WEB: `https://<web-domain>`
- 로그인/커뮤니티(피드/좋아요/댓글/번역) 동작 확인

## 7) 로컬 Docker 실행
```bash
docker compose up --build
```
- WEB: `http://localhost:3000`
- API: `http://localhost:4000/health`
