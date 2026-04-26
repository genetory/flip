# Flip Monorepo

`flip-ers.com` 리뉴얼을 위한 베이스 모노레포입니다.

## Stack
- Platform Web: Next.js (App Router)
- Partner Admin: Next.js
- Ops Admin: Next.js
- Backend: Node.js + Express
- DB: PostgreSQL
- ORM: Prisma

## Structure
- `apps/platform-web`: 사용자용 서비스 웹
- `apps/partner-admin`: 파트너 관리자 콘솔
- `apps/ops-admin`: 운영 관리자 콘솔
- `apps/api`: 백엔드 API + Prisma
- `packages/ui`: 공통 UI 컴포넌트
- `packages/auth`: 권한/Role 유틸
- `packages/config`: 공통 설정 저장소

## Quick Start
### One Command
```bash
npm run dev:all
```

### Step By Step
1. 환경 변수 파일 생성
```bash
cp .env.example .env
```

2. PostgreSQL 실행
```bash
docker compose up -d
```

3. 의존성 설치
```bash
npm install
```

4. Prisma 클라이언트 생성 + 마이그레이션
```bash
npm run db:generate
npm run db:migrate
```

5. 개발 서버 실행
```bash
npm run dev
```

- Platform Web: http://localhost:3000
- Partner Admin: http://localhost:3001
- Ops Admin: http://localhost:3002
- API: http://localhost:4000

## Member Roles
- `STUDENT`
- `PARTNER` (`UNIVERSITY` | `COMPANY` | `AGENCY`)
- `OPERATOR`

## Auth & RBAC API
기본 인증은 Bearer JWT를 사용합니다.

1. 회원가입
```bash
POST /auth/register
{
  "email": "user@flip.com",
  "name": "User",
  "password": "password1234",
  "accountType": "GENERAL"
}
```

2. 로그인
```bash
POST /auth/login
{
  "email": "user@flip.com",
  "password": "password1234"
}
```

3. 토큰 재발급
```bash
POST /auth/refresh
```
`httpOnly` refresh cookie 기준으로 동작합니다.

4. 내 정보 조회
```bash
GET /auth/me
Authorization: Bearer <accessToken>
```

5. 권한 보호 라우트 예시
- `GET /partner/dashboard` → `PARTNER`, `OPERATOR`
- `GET /ops/dashboard` → `OPERATOR`
- `GET /members` / `POST /members` → `OPERATOR`
