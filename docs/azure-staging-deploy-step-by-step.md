# Azure Staging Deploy Guide (Docker, Monorepo)

이 문서는 현재 레포 상태를 기준으로 `apps/platform-web` + `apps/api`를 Azure App Service(Linux Container)에 staging 배포하는 절차입니다.

기준 날짜: 2026-04-29

## 0) 현재 레포 상태 요약
- Web Dockerfile: `apps/platform-web/Dockerfile`
- API Dockerfile: `apps/api/Dockerfile`
- GitHub Actions: `.github/workflows/deploy-azure-containers.yml`
- `develop` 브랜치 push 시 `staging` Environment로 자동 배포됨

즉, 코드 측 자동 배포 파이프라인은 이미 존재하고, 지금은 Azure/GitHub 설정만 채우면 됩니다.

## 1) Azure 리소스 만들기 (staging만)
Azure Portal에서 아래를 먼저 준비합니다.

1. Resource Group 생성
- 예: `rg-aply-staging`

2. PostgreSQL Flexible Server 생성
- 예: `pg-aply-staging`
- DB 이름: `aply`
- Public access 사용 시 GitHub Actions/앱 접근 허용 규칙 확인
- 연결 문자열 형태:
  `postgresql://<USER>:<PASS>@pg-aply-staging.postgres.database.azure.com:5432/aply?sslmode=require`

3. Web App 2개 생성 (Linux, Container)
- `platform-web-staging`
- `api-staging`

4. Container Registry 준비 (택1)
- ACR / GHCR / Docker Hub 중 하나
- 워크플로우는 `REGISTRY_SERVER`, `REGISTRY_USERNAME`, `REGISTRY_PASSWORD` 사용

## 2) Publish Profile 다운로드
각 App Service에서:
- `Overview` -> `Get publish profile` 클릭
- 파일 2개 확보:
  - `platform-web-staging.PublishSettings`
  - `api-staging.PublishSettings`

이 XML 전체 내용을 GitHub Environment Secret에 그대로 넣습니다.

## 3) GitHub Environment `staging` 생성 + Secret 등록
GitHub Repo -> `Settings` -> `Environments` -> `staging` 생성 후 아래 시크릿을 등록합니다.

필수 Secret 키:
- `REGISTRY_SERVER`
- `REGISTRY_USERNAME`
- `REGISTRY_PASSWORD`
- `WEB_IMAGE_NAME` (예: `platform-web`)
- `API_IMAGE_NAME` (예: `api`)
- `AZURE_WEBAPP_PLATFORM_NAME` (예: `platform-web-staging`)
- `AZURE_WEBAPP_PLATFORM_PUBLISH_PROFILE` (platform-web publish profile XML 전체)
- `AZURE_WEBAPP_API_NAME` (예: `api-staging`)
- `AZURE_WEBAPP_API_PUBLISH_PROFILE` (api publish profile XML 전체)

참고:
- 현재 워크플로우는 브랜치 기준으로 자동 환경 선택:
  - `develop` -> `staging`
  - `main` -> `production`

## 4) App Service 컨테이너 기본 설정
각 App Service (`platform-web-staging`, `api-staging`)에서:

1. `Deployment Center` -> `Container Registry`로 설정
2. 임시 이미지/태그를 한 번 저장 (초기화 목적)
3. 이후부터는 GitHub Actions가 이미지 태그를 갱신하며 배포

## 5) App Settings 입력 (중요)
워크플로우는 컨테이너 이미지만 배포합니다. 런타임 환경변수는 Azure App Settings에서 넣어야 합니다.

### 5-1) `api-staging` App Settings
- `NODE_ENV=production`
- `API_PORT=8080`
- `DATABASE_URL=postgresql://<USER>:<PASS>@pg-aply-staging.postgres.database.azure.com:5432/aply?sslmode=require`
- `JWT_SECRET=<강한값>`
- `JWT_ACCESS_SECRET=<강한값>`
- `JWT_REFRESH_SECRET=<강한값>`
- `PLATFORM_WEB_URL=https://platform-web-staging.azurewebsites.net`
- `PARTNER_ADMIN_URL=https://partner-admin-staging.azurewebsites.net` (없으면 임시 도메인)
- `OPS_ADMIN_URL=https://ops-admin-staging.azurewebsites.net` (없으면 임시 도메인)
- `EMAIL_VERIFICATION_BASE_URL=https://platform-web-staging.azurewebsites.net/verify-email`
- `OPENAI_API_KEY=<선택>`
- `OPENAI_MATCHING_MODEL=gpt-5.4`
- `OPENAI_TRANSLATION_MODEL=gpt-5.4-mini`

선택(권장):
- `OPENAI_MATCHING_MIN_COMPLETION_PERCENT=60`
- `OPENAI_MATCHING_HIGH_COMPLETION_BONUS=8`
- `OPENAI_MATCHING_LOW_COMPLETION_PENALTY=12`
- `OPENAI_MATCHING_MAX_POOL=120`
- `OPENAI_MATCHING_TEXT_MAX=280`

### 5-2) `platform-web-staging` App Settings
- `NODE_ENV=production`
- `PORT=8080`
- `NEXT_PUBLIC_API_URL=https://api-staging.azurewebsites.net`

필요 시 추가:
- `NEXT_PUBLIC_PARTNER_ADMIN_URL=...`
- `NEXT_PUBLIC_OPS_ADMIN_URL=...`

## 6) 첫 staging 배포 실행
1. `develop` 브랜치에 커밋 후 push
2. GitHub Actions `Deploy Azure Containers (Web + API)` 실행 확인
3. 성공 시 자동으로 두 App Service에 각각 새 이미지 배포

## 7) 배포 검증
1. API 헬스체크
- `https://api-staging.azurewebsites.net/health`

2. Web 접속
- `https://platform-web-staging.azurewebsites.net`

3. 핵심 기능 점검
- 로그인/회원가입
- 이메일 인증 링크 생성
- 커뮤니티 피드/좋아요/댓글
- API CORS 오류 여부

## 8) 자주 발생하는 이슈
1. `Missing secret`로 워크플로우 실패
- `staging` Environment secret 키 이름 오타 확인

2. API 시작 실패
- `DATABASE_URL`, `JWT_*` 누락 여부 확인
- App Service 로그에서 `prisma migrate deploy` 에러 확인

3. Web에서 API 호출 실패
- `NEXT_PUBLIC_API_URL` 도메인 확인 (`https://api-staging...`)
- API의 `PLATFORM_WEB_URL`과 실제 웹 도메인 일치 확인

4. CORS 에러
- API에서 허용 origins는 `PLATFORM_WEB_URL`, `PARTNER_ADMIN_URL`, `OPS_ADMIN_URL` 기반
- staging 도메인으로 정확히 입력해야 함

## 9) Production 확장 시
이미 워크플로우에 `main -> production` 경로가 포함되어 있으므로, 나중에는 동일 키를 `production` Environment에 채우면 됩니다.
