# LLM 품질 평가 하니스 (eval)

이력서·자소서·커리어런치 생성형 LLM의 **출력 품질을 수치화**해서, 프롬프트/모델을 바꿀 때
좋아졌는지 나빠졌는지를 **변경 전/후로 비교**하기 위한 도구.

## 핵심 설계
- 프롬프트는 [`src/llm/prompts.ts`](../llm/prompts.ts) **단일 소스**를 실제 API(`index.ts`)와
  이 하니스가 **똑같이** 사용한다 → 하니스가 측정하는 프롬프트 = 프로덕션 프롬프트(드리프트 없음).
- 골든셋은 전부 **합성(가상 인물)** 이다. 공개 레포 규칙상 실제 사용자 데이터·PII 를 넣지 않는다.
- 두 가지로 채점한다:
  - **규칙 검사(checks.ts)** — 결정적. 환각 숫자, 과장어, 분량 목표, 1인칭·존댓말, 키워드 반영,
    줄글 여부, 한국어 여부 등. 가중 통과율(0~100%).
  - **LLM-as-judge(judge.ts)** — 강한 모델(기본 gpt-4o)이 근거성·자연스러움·적합성·구성·종합을
    각 0~5로 채점.

## 실행
```bash
cd apps/api

# 프롬프트만 조립해 눈으로 확인(모델 호출 없음 — 비용 0)
npm run eval -- --dry

# 규칙검사 로직 자체 점검(모델 불필요)
npm run eval -- --selftest

# 라이브 평가(생성 + 규칙검사 + judge) — OpenAI 키 필요
OPENAI_API_KEY=sk-... npm run eval

# 옵션
npm run eval -- --feature cover_letter     # 특정 기능만
OPENAI_API_KEY=... npm run eval -- --no-judge   # 규칙검사만(비용 절감)
```

### 환경변수
- `EVAL_GENERATOR_MODEL` — 생성 모델(기본 = `OPENAI_TRANSLATION_MODEL` = `gpt-4o-mini`, 즉 프로덕션과 동일).
  모델 업그레이드 효과를 보려면 `EVAL_GENERATOR_MODEL=gpt-4o npm run eval` 로 비교.
- `EVAL_JUDGE_MODEL` — judge 모델(기본 `gpt-4o`).

## 결과
- 콘솔에 케이스별 점수 + 요약표.
- `apps/api/eval-report/report-<timestamp>.json` 에 전체 리포트 저장(gitignore).

## 워크플로 (프롬프트 튜닝 시)
1. `npm run eval` 로 현재(baseline) 점수를 남긴다.
2. `src/llm/prompts.ts` 프롬프트를 수정한다.
3. 다시 `npm run eval` 을 돌려 avgCheckScore·judge 종합이 올라갔는지 확인한다.
4. 좋아졌으면 반영, 나빠졌으면 롤백.

## 확장
- 새 기능 추가: `features.ts` 에 `buildMessages`/`extract` 등록 → `golden.ts` 에 케이스 추가.
- 커리어런치 대화 기능(`CAREER_PROMPTS`)도 프롬프트를 `src/llm/prompts.ts` 로 이관하면 동일하게 평가 가능.
- 규칙 검사 추가: `checks.ts` 의 `runChecks` 에 케이스별 검사 push.
