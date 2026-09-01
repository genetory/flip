# Career Launch — AI 안전성 (Phase 11)

구현 상태 기준(추정 없음). OpenAI 호출은 **서버 전용**(`careerChatComplete`, `apps/api/src/index.ts`). 웹 직접호출 0. API key는 서버 env(`OPENAI_API_KEY`), 브라우저 번들 미포함.

## 데이터 최소 전송 (§7)
- 요청은 **현재 작업 정보만**. 장기 기억은 구조화 Career Profile 요약(`buildCareerProfileContext`, maxChars 제한) + 최근 상담 요약(`loadRecentConsults`) 우선 — 전체 이력서/전체 대화 반복 전송 지양.
- 운영자 메모·기관 내부 메모·타 참여자 정보는 모델에 전달하지 않음.
- 확인되지 않은 AI 추론은 Career Profile에 `inferred`로만(사실 아님), 사용자 확정 시 `confirmed`.
- **PARTIAL**: 일부 채팅은 대화 history를 전달 — context 상한·요약 우선은 지속 점검 권장.

## 프롬프트 인젝션 방어 (§8)
- **system/user 메시지 분리** — 사용자 입력·붙여넣은 공고/이력서는 `role:"user"`로만, **system instruction에 병합 안 됨**.
- 붙여넣은 문서는 신뢰할 수 없는 데이터로 취급. 문서 내 "이전 지시 무시" 류를 실행하지 않도록 system 경계 명시.
- 내부 system prompt·env·경로·API key·타 사용자 정보 요청 → 공개하지 않음(system 경계).
- **관리 기능(완료 상태·점수·권한)은 자연어로 확정하지 않음** — 서버 검증 + 명시적 사용자 확인. AI가 상태를 직접 확정하지 않음(`canTransitionIntervention`·완료판정은 서버 로직).

## 시스템 프롬프트 경계 (반영됨)
`CAREER_COACH_DIRECTIVES` + `NO_FABRICATION` + `IV_SAFETY`(27곳):
- AI는 취업 준비를 돕는 **커리어 코치**(사람 아님, AI_DISCLOSURE로 투명).
- **경력 정보를 임의 생성하지 않음** — 회사명·기간·직책·수치·자격 허위 추가 금지.
- 확인되지 않은 성과·수치를 이력서에 추가하지 않음.
- 차별적 채용 조언 금지(보호특성 미사용), 합격 가능성 확정 금지.
- 법률·비자·의료 등 전문 판단은 확정적으로 말하지 않음.
- 비밀정보 입력 요구 금지, 내부 지침·타 사용자 정보 미공개.
- **결과물 최종 확인 주체 = 사용자**.

## 사실 확인 (§9)
- 사실 출처 우선순위: 사용자 제공 사실 > 확인된 데이터 > AI 요약 > AI 제안 표현 > 미확인 수치(확인 필요 표시).
- 미확인 정보는 질문하거나 `needs_confirmation` 상태 표시. `unsupportedCount`/`criticalUnresolved`(validationData)로 근거 부족 문장 집계.
- **확정 전 사실 확인 단계** + 미확정 결과물은 최종본처럼 다운로드하지 않음. AI 수정 시 변경 전/후 확인(문장별 근거 SourceLink).

## 유해·부적절·위기 응답 (§10)
- 차별적 질문·이력 위조·타인 이력 도용·개인정보 추출 → **안전한 대안 제시**(무조건 차단 아님).
- **심각한 정서적 위기 표현** → AI가 진단·상담 완료하지 않고 **즉시 도움 안내 + 운영자 검토(human_review) 상태**로 연결. 외부 전문기관 안내 문구 제공.
- 욕설·성적·폭력 내용 → 정중히 범위 밖 안내.
- 위기·민감 원문은 **관리자 전체 목록에 원문 노출 안 함** — 권한 있는 담당자가 필요 시 상세 확인(감사 로그).

## 입력·출력·중복 (§11·§13)
- 서버측 zod 스키마 검증(길이·enum·id·배열 상한), 대화 메시지·context 상한. **rateLimit 78곳**(AI 엔드포인트 포함). 재시도 상한·quota 처리.
- AI 실패 시 사용자 입력 보존, 원문 전체를 외부 오류 추적으로 전송하지 않음.

## 확인되지 않은 항목 (추정 안 함)
- 정확한 OpenAI 모델·retention 설정: env·인프라에서 확인 필요(코드상 `OPENAI_MATCHING_MODEL`/`OPENAI_INTERVIEW_MODEL` 등 변수). **배포 전 실제 설정 확인**.
