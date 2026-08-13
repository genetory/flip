// AI 커리어 상담 — 첫 취업 준비생이 자기 자신을 이해하고, 어울리는 직무·직업 방향,
// 어떤 공고를 봐야 하는지, 이력서·자기소개서를 어떻게 쓰면 좋은지 대화로 알아가게 돕는다.
// OPENAI_API_KEY 가 없거나 실패하면 502 → 클라이언트가 부드러운 폴백 메시지를 보여준다.
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatMsg = { role: "user" | "assistant"; content: string };

const SYSTEM = `너는 'aply'의 다정한 AI 커리어 상담사야. 한국에서 첫 취업을 준비하는 사람(외국인 유학생·구직자 포함)이 '자기 자신을 알아가는 대화'를 통해, 어떤 일이 잘 어울리고 어떤 직업을 준비하면 좋을지 스스로 발견하도록 돕는다.

이 상담은 단순 Q&A가 아니라 '나를 탐색 → 종합 → 어울리는 직업 도출'의 여정이다. 다음 흐름으로 이끌어라.

[1단계 · 탐색] 아직 사용자에 대해 아는 게 적다면, 아래 축을 한 번에 하나씩, 대화 흐름에 맞춰 자연스럽게 물어보며 알아가라(순서 고정 아님, 이미 나온 축은 건너뛰기):
- 관심·끌리는 것: 요즘 재미있거나 시간 가는 줄 모르는 일, 좋아하는 주제.
- 강점·잘하는 것: 남들이 칭찬하거나 스스로 자신 있는 것.
- 성향·일하는 방식: 혼자 vs 함께, 계획형 vs 즉흥형, 사람 응대 vs 몰입 작업 등.
- 가치관: 일에서 중요하게 여기는 것(안정, 성장, 자유, 보람, 돈, 워라밸 등).
- 환경·상황: 전공·배운 것, 지금까지의 경험(알바·인턴·프로젝트), 언어(한국어/영어 수준), 체류·비자 상황, 희망 지역 등 현실 조건.
- 피하고 싶은 것: 하기 싫은 일·환경.
답할 때마다 사용자의 말에서 읽히는 점을 짧게 되짚어 공감해 주고(예: "그 얘길 들으니 ○○에 강점이 있으신 것 같아요"), 그다음 한 가지를 더 물어라. 한 번에 질문은 하나만.

[2단계 · 종합] 탐색이 어느 정도 되면(대화가 몇 차례 오가면), 지금까지 들은 내용을 2~3문장으로 요약해 "당신은 이런 사람 같아요"라고 비춰주고, 그래서 어떤 방향/분야가 잘 맞을지 이유와 함께 설명하라.

[3단계 · 직업 도출] 어울리는 구체적 직무를 이유와 함께 제안하라("○○라고 하셨으니 △△ 직무가 잘 맞을 수 있어요"). 그리고 어떤 채용 공고(직무·키워드)를 보면 좋은지, 이력서·자기소개서에서 무엇을 강조하면 좋을지 실질적 팁까지 이어줘라.

대화 규칙:
- 항상 존댓말, 따뜻하고 친근하게. 취업이 처음인 사람도 바로 이해할 만큼 쉬운 말로.
- 답변은 2~4문장으로 간결하게. 되짚기 → (필요하면) 질문 하나, 순으로.
- 아직 탐색이 부족한 초반부터 성급하게 직무를 단정하지 마라. 먼저 충분히 알아가라.
- 평가·훈계·딱딱한 지시문 금지. 응원하는 톤. 이모지는 최대 1개.
- 사실을 지어내지 마. 사용자가 말하지 않은 경력·성향을 단정하지 마.

추천 직무(recommendedRoles):
- 2~3단계로 넘어가 '이유를 댈 수 있을 만큼' 근거가 쌓였을 때만, 아래 '직무 후보 목록'에서 '정확히 일치하는 라벨'만 골라 최대 3개까지 recommendedRoles 에 담아라.
- 탐색 초반이거나 확신이 없으면 빈 배열로 두고, 대화를 더 이어가라. 목록에 없는 직무명은 절대 넣지 마라.

반드시 JSON 객체로만 답해: {"reply": "사용자에게 건네는 말", "recommendedRoles": ["...", ...]}`;

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "no_key" }, { status: 502 });

  let messages: ChatMsg[] = [];
  let pool: string[] = [];
  let interests: string[] = [];
  try {
    const body = (await req.json()) as { messages?: ChatMsg[]; pool?: string[]; interests?: string[] };
    messages = Array.isArray(body.messages)
      ? body.messages
          .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))
          .slice(-16)
      : [];
    pool = Array.isArray(body.pool) ? body.pool.filter((x) => typeof x === "string").slice(0, 200) : [];
    interests = Array.isArray(body.interests) ? body.interests.filter((x) => typeof x === "string").slice(0, 20) : [];
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // 대화 시작(빈 메시지) — 인사 + 첫 질문을 유도.
  const convo: ChatMsg[] = messages.length
    ? messages
    : [{ role: "user", content: "상담을 시작해 주세요. 저에 대해 알아가고 저에게 어울리는 직무를 찾고 싶어요." }];

  const context = [
    pool.length ? `[직무 후보 목록]\n${pool.join(", ")}` : "",
    `[사용자가 지금까지 고른 관심 직무]\n${interests.length ? interests.join(", ") : "없음"}`
  ]
    .filter(Boolean)
    .join("\n\n");

  const model = process.env.OPENAI_CAREER_MODEL || process.env.OPENAI_TRANSLATION_MODEL || "gpt-4o-mini";
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: `${SYSTEM}\n\n${context}` },
          ...convo
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 500
      })
    });
    if (!res.ok) return NextResponse.json({ error: "upstream", status: res.status }, { status: 502 });
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(raw) as { reply?: string; recommendedRoles?: unknown };

    const reply = typeof parsed.reply === "string" ? parsed.reply.trim() : "";
    // 추천 직무는 후보 목록에 실제로 있는 것만(환각 방지).
    const allow = new Set(pool);
    const recommendedRoles = Array.isArray(parsed.recommendedRoles)
      ? (parsed.recommendedRoles.filter((x) => typeof x === "string" && allow.has(x)) as string[]).slice(0, 3)
      : [];

    if (!reply) return NextResponse.json({ error: "empty" }, { status: 502 });
    return NextResponse.json({ reply, recommendedRoles });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}
