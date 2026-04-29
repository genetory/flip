# Azure 배포 체크리스트 (Staging + Production)

## 1) Azure 리소스 준비
- Azure App Service 4개
  - `platform-web-staging` / `platform-web-production`
  - `api-staging` / `api-production`
- Azure Database for PostgreSQL
  - 권장: staging/prod 분리 (최소 1개도 가능)

## 2) GitHub Environments + Secrets 등록
- GitHub repository > Settings > Environments 에서 `staging`, `production` 생성
- 각 Environment에 아래 시크릿을 **동일한 키 이름**으로 등록
  - `AZURE_WEBAPP_PLATFORM_NAME`
  - `AZURE_WEBAPP_PLATFORM_PUBLISH_PROFILE`
  - `AZURE_WEBAPP_API_NAME`
  - `AZURE_WEBAPP_API_PUBLISH_PROFILE`

각 Publish Profile은 App Service > 개요 > 게시 프로필 다운로드에서 획득.

## 3) App Service Startup Command
루트 레포를 통째로 배포하므로 Startup Command를 꼭 지정해야 합니다.

- Platform Web App startup command:
```bash
npm run start:platform
```

- API App startup command:
```bash
npm run db:migrate:deploy && npm run start:api
```

## 4) Platform Web 환경변수 (App Settings)
- `NODE_ENV=production`
- `NEXT_PUBLIC_API_URL=https://<api-app>.azurewebsites.net`

## 5) API 환경변수 (App Settings)
- `NODE_ENV=production`
- `API_PORT=4000`
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=...`
- `JWT_ACCESS_SECRET=...`
- `JWT_REFRESH_SECRET=...`
- `PLATFORM_WEB_URL=https://<platform-app>.azurewebsites.net`
- `PARTNER_ADMIN_URL=https://<partner-admin-domain>`
- `OPS_ADMIN_URL=https://<ops-admin-domain>`
- `OPENAI_API_KEY=...` (번역/매칭 기능 사용 시)
- `OPENAI_MATCHING_MODEL=gpt-5.4`
- `OPENAI_TRANSLATION_MODEL=gpt-5.4-mini`

메일 기능 사용 시:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE`
- `EMAIL_FROM`
- `EMAIL_VERIFICATION_BASE_URL`

## 6) 최초 데이터 작업
- 마이그레이션은 API startup command에서 자동 실행됩니다.
- 커뮤니티 목업 데이터가 필요하면 1회 실행:
```bash
npm run db:seed:community
```

## 7) 배포 실행
- `develop` 브랜치 push 시 `staging` 배포
- `main` 브랜치 push 시 `production` 배포
- 또는 GitHub Actions에서 수동 실행 (`workflow_dispatch`)

## 8) 점검
- API 헬스체크: `https://<api-app>.azurewebsites.net/health`
- 웹 접속: `https://<platform-app>.azurewebsites.net`
- 커뮤니티 목록/작성/좋아요/댓글/번역 정상동작 확인
