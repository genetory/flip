// 커리어런치 코칭 골든 케이스 — 전부 합성(가상 인물). 공개 레포 PII 금지.
// 각 케이스 = '대화 도중 한 턴' 상태(프로필 + 지금까지 대화 + 학생의 최근 메시지) → 코치의 다음 reply 를 평가.
import type { CareerGoldenCase } from "./types";
import {
  buildDiagnosis, buildJob, buildMaterial, buildExperienceMining, buildStrengthStory,
  DIAGNOSIS_CHAT_SCHEMA, JOB_CHAT_SCHEMA, MATERIAL_CHAT_SCHEMA, EXPERIENCE_MINING_SCHEMA, STRENGTH_STORY_SCHEMA,
  type ChatMsg
} from "./prompts";

const asReply = (json: Record<string, unknown>) => (typeof json.reply === "string" ? json.reply : "");
const stepGoal: Record<string, string> = {
  diagnosis_chat: "스텝1 취업 준비 자가진단 — 대화로 준비도를 파악(성급히 끝내지 않기).",
  job_chat: "스텝2 관심 직무 찾기 — 쉬운 선택형 문답으로 흥미·성향을 좁혀 후보 직무 추천.",
  material_chat: "스텝3 선정 직무 깊이 알기 — 전문가로서 직무를 알기 쉽게 설명하며 이끌기.",
  experience_mining: "경험 발굴 — 어떤 경험에서도 강점을 찾아냄('경험 없다'를 그대로 받지 않기).",
  strength_story: "강점 스토리 — 상황·행동·결과로 짧은 이야기 하나를 함께 구성."
};
const judgeCtx = (feature: string, profile: string, messages: ChatMsg[]) =>
  `[코치 지시서 요약]\n- 친한 선배 같은 따뜻한 존댓말, 이모지 가볍게. 한 번에 질문 하나. 학생 답에 먼저 공감.\n- 막막한 열린 질문 대신 대답하기 쉬운 선택형·예시. 모든 답변은 학생이 바로 답할 '다음 한 걸음'으로 끝나기.\n- 프로필로 아는 건 다시 묻지 않기. 없는 사실 지어내지 않기.\n- 이 스텝 목표: ${stepGoal[feature] ?? feature}\n\n[대화 맥락]\n${profile ? `[학생 프로필]\n${profile}\n\n` : ""}지금까지 대화:\n${messages.length ? messages.map((m) => `${m.role === "bot" ? "코치" : "학생"}: ${m.text}`).join("\n") : "(첫 턴)"}`;

// ── 합성 프로필 ─────────────────────────────────────────────────────────
const P_MINSEO = "실명: (미확인)\n계정 표시명: minseo22\n학교: 가상한국대학교\n전공: 경영학\n보유 스킬: Excel, PPT";
const P_NGUYEN = "실명: (미확인)\n계정 표시명: huy_ng\n학교: 가상국제대학교\n전공: 컴퓨터공학\n보유 스킬: Python, Java\n자기소개: 베트남에서 온 유학생, 한국어 공부 중";
const P_JUNHO = "실명: (미확인)\n계정 표시명: junho\n학교: 가상시립대학교\n전공: 통계학\n보유 스킬: SQL, Python, Excel";
const P_SEOYEON = "실명: (미확인)\n계정 표시명: seoyeon\n학교: 가상여자대학교\n전공: 심리학\n보유 스킬: 설문설계, Excel";

const JOB_POOL = [
  { role: "데이터 분석가", keywords: ["SQL", "대시보드", "지표"] },
  { role: "마케팅 MD", keywords: ["상품기획", "트렌드"] },
  { role: "UX 리서처", keywords: ["사용자조사", "인터뷰"] },
  { role: "서비스 기획자", keywords: ["요구사항", "와이어프레임"] },
  { role: "백엔드 개발자", keywords: ["API", "DB"] }
];

export const CAREER_GOLDEN: CareerGoldenCase[] = [
  (() => {
    const m: ChatMsg[] = [
      { role: "bot", text: "안녕하세요 민서님 😊 경영학 전공이시네요! 먼저 어떤 직무로 취업을 생각하고 계신지 궁금해요. 혹시 마음에 둔 방향이 있을까요?" },
      { role: "user", text: "음 마케팅 쪽이요 근데 아직 잘 몰라요" }
    ];
    return { id: "diag_vague_direction", feature: "diagnosis_chat", note: "방향 모호 — 다그치지 말고 쉬운 후속", ...buildDiagnosis(P_MINSEO, m), schema: DIAGNOSIS_CHAT_SCHEMA as unknown as Record<string, unknown>, schemaName: "diagnosis_chat", strict: false, extractReply: asReply, judgeContext: judgeCtx("diagnosis_chat", P_MINSEO, m) };
  })(),
  (() => {
    const m: ChatMsg[] = [
      { role: "bot", text: "안녕하세요 후이님 😊 컴퓨터공학 전공이시군요! 한국에서 개발자로 취업을 준비 중이신가요?" },
      { role: "user", text: "네 맞아요. 근데 한국어 회의는 아직 어려워요" }
    ];
    return { id: "diag_intl_korean", feature: "diagnosis_chat", note: "유학생 한국어 수준 — 공감+구체화", ...buildDiagnosis(P_NGUYEN, m), schema: DIAGNOSIS_CHAT_SCHEMA as unknown as Record<string, unknown>, schemaName: "diagnosis_chat", strict: false, extractReply: asReply, judgeContext: judgeCtx("diagnosis_chat", P_NGUYEN, m) };
  })(),
  (() => {
    const m: ChatMsg[] = [
      { role: "bot", text: "안녕하세요 준호님 😊 통계학 전공이시네요! 일할 때 어느 쪽이 더 끌리세요? ① 사람과 소통·도움 ② 데이터·숫자 다루기 ③ 만들기·창작 ④ 기획·아이디어" },
      { role: "user", text: "2번이요 숫자 보는 거 좋아해요" }
    ];
    return { id: "job_narrowing", feature: "job_chat", note: "흥미 좁혀가기 — 다음 쉬운 질문/추천 흐름", ...buildJob(P_JUNHO, m, JOB_POOL, []), schema: JOB_CHAT_SCHEMA as unknown as Record<string, unknown>, schemaName: "job_chat", strict: false, extractReply: asReply, judgeContext: judgeCtx("job_chat", P_JUNHO, m) };
  })(),
  (() => {
    const m: ChatMsg[] = [
      { role: "bot", text: "안녕하세요 서연님 😊 심리학 전공을 살릴 방향을 같이 찾아봐요. 사람의 행동이나 마음을 이해하는 일과, 데이터로 패턴을 보는 일 중 어느 쪽이 더 끌려요?" },
      { role: "user", text: "잘 모르겠어요 둘 다 그냥 그래요" }
    ];
    return { id: "job_stuck", feature: "job_chat", note: "학생 막힘 — 다그치지 말고 더 쉬운 선택지", ...buildJob(P_SEOYEON, m, JOB_POOL, []), schema: JOB_CHAT_SCHEMA as unknown as Record<string, unknown>, schemaName: "job_chat", strict: false, extractReply: asReply, judgeContext: judgeCtx("job_chat", P_SEOYEON, m) };
  })(),
  (() => {
    const m: ChatMsg[] = [
      { role: "bot", text: "좋아요! 먼저 첫 번째로 고르신 데이터 분석가부터 알아볼게요 😊 데이터 분석가는 회사의 지표를 SQL로 뽑아 대시보드로 정리하고, 'A안이 나은지 B안이 나은지'를 실험으로 확인하는 일을 많이 해요. 혹시 이 중에 더 궁금한 부분이 있을까요?" },
      { role: "user", text: "음 그냥 잘 모르겠어요" }
    ];
    return { id: "material_leadme", feature: "material_chat", note: "학생 막막 — 전문가로서 알기 쉽게 설명 후 이끌기", ...buildMaterial(P_JUNHO, m, ["데이터 분석가", "서비스 기획자"], []), schema: MATERIAL_CHAT_SCHEMA as unknown as Record<string, unknown>, schemaName: "material_chat", strict: false, extractReply: asReply, judgeContext: judgeCtx("material_chat", P_JUNHO, m) };
  })(),
  (() => {
    const m: ChatMsg[] = [
      { role: "bot", text: "안녕하세요 서연님 😊 지금까지 해온 일이나 활동 중에 가장 시간을 많이 쏟았던 경험이 하나 있을까요? 어떤 거든 좋아요!" },
      { role: "user", text: "저는 진짜 경험이 없어요.. 카페 알바 한 게 다예요" }
    ];
    return { id: "exp_noexp", feature: "experience_mining", note: "'경험 없다' — 알바에서 강점 찾아내기", ...buildExperienceMining(P_SEOYEON, m, ""), schema: EXPERIENCE_MINING_SCHEMA as unknown as Record<string, unknown>, schemaName: "experience_mining", strict: false, extractReply: asReply, judgeContext: judgeCtx("experience_mining", P_SEOYEON, m) };
  })(),
  (() => {
    const m: ChatMsg[] = [
      { role: "bot", text: "정리해주신 '편의점 알바에서 발주 개선한 경험' 좋네요 😊 그때 어떤 상황이었는지 조금 더 들려줄래요? 무슨 문제가 있었어요?" },
      { role: "user", text: "재고가 자꾸 떨어져서 손님들이 자주 찾는 물건이 없었어요" }
    ];
    return { id: "story_situation", feature: "strength_story", note: "상황→행동으로 자연스럽게 이끌기", ...buildStrengthStory(P_MINSEO, m, "편의점 알바 발주 개선", ""), schema: STRENGTH_STORY_SCHEMA as unknown as Record<string, unknown>, schemaName: "strength_story", strict: false, extractReply: asReply, judgeContext: judgeCtx("strength_story", P_MINSEO, m) };
  })()
];
