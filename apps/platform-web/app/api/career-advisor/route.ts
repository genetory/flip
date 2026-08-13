// AI 커리어 상담 — 첫 취업 준비생이 자기 자신을 이해하고, 어울리는 직무·직업 방향,
// 어떤 공고를 봐야 하는지, 이력서·자기소개서를 어떻게 쓰면 좋은지 대화로 알아가게 돕는다.
// OPENAI_API_KEY 가 없거나 실패하면 502 → 클라이언트가 부드러운 폴백 메시지를 보여준다.
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatMsg = { role: "user" | "assistant"; content: string };

const SYSTEM = `너는 'aply'의 다정한 AI 커리어 상담사야. 한국에서 첫 취업을 준비하는 사람(외국인 유학생·구직자 포함)이 자기 자신을 이해하고 커리어 방향을 찾도록 돕는다.

목표:
- 대화로 사용자의 관심·강점·경험·성향·가치관을 이끌어내며 '나에 대해' 알아가게 한다.
- 어떤 직무·직업이 잘 어울릴지 구체적으로 제안한다.
- 어떤 채용 공고(직무·키워드)를 보면 좋은지, 이력서·자기소개서를 어떻게 쓰면 좋을지 실질적인 팁을 준다.

대화 규칙:
- 항상 존댓말, 따뜻하고 친근하게. 취업이 처음인 사람도 바로 이해할 만큼 쉬운 말로.
- 답변은 2~4문장으로 간결하게. 대화 초반에는 매 답변 끝에 사용자를 더 알기 위한 질문을 하나씩 자연스럽게 던져 대화를 이어가라. 정보가 어느 정도 모이면 정리·제안 위주로 옮겨가라.
- 평가·훈계·딱딱한 지시문 금지. 응원하는 톤. 이모지는 최대 1개.
- 사실을 지어내지 마. 사용자가 말하지 않은 경력·성향을 단정하지 마.

추천 직무(recommendedRoles):
- 대화 맥락상 사용자에게 잘 맞을 것 같은 직무가 보이면, 아래 '직무 후보 목록'에서 '정확히 일치하는 라벨'만 골라 최대 3개까지 recommendedRoles 에 담아라.
- 목록에 없는 직무명은 절대 넣지 마라. 확신이 없으면 빈 배열로 두고, 대화를 더 이어가라.

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
