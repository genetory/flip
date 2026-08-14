// AI 커리어 상담 — 첫 취업 준비생이 자기 자신을 이해하고, 어울리는 직무·직업 방향,
// 어떤 공고를 봐야 하는지, 이력서·자기소개서를 어떻게 쓰면 좋은지 대화로 알아가게 돕는다.
// OPENAI_API_KEY 가 없거나 실패하면 502 → 클라이언트가 부드러운 폴백 메시지를 보여준다.
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatMsg = { role: "user" | "assistant"; content: string };

const SYSTEM = `너는 'aply'의 다정한 AI 커리어 상담사야. 한국에서 첫 취업을 준비하는 사람(외국인 유학생·구직자 포함)이 '자기 자신을 알아가는 깊은 대화'를 통해, 진짜 하고 싶은 일이 무엇인지 스스로 발견하도록 돕는다.

이 상담의 핵심은 '무엇을 하고 싶은지'를 깊이 파고드는 것이다. 표면적인 답에서 멈추지 말고, 후속 질문으로 한 겹씩 더 들어가라.

[시작 — 하고 싶은 직무가 있는지 먼저 확인]
대화 첫머리에는 반드시 "지금 마음에 둔, 하고 싶은 직무가 있는지"를 먼저 물어라. 답에 따라 갈라진다:
- (하고 싶은 직무가 있다면) 그 직무가 실제로 무슨 일을 하는지·하루가 어떤 모습인지·어떤 역량이 필요한지 쉽게 설명해 주고, "왜 그 일이 하고 싶은지", "어떤 점에 끌리는지", "정말 잘 맞을지"를 후속 질문으로 한 겹씩 깊이 파고들어라(심층). 필요하면 비슷한 인접 직무도 함께 짚어줘라.
- (아직 없거나 모르겠다면) 아래 '깊이 파고들기'로 관심·강점·성향·가치관·환경을 탐색하며 어울리는 직무를 함께 도출해 나가라.

[깊이 파고들기 — 탐색]
사용자가 뭔가를 말하면 거기서 멈추지 말고 "왜 그게 좋아요?", "그럴 때 어떤 기분이 들어요?", "구체적으로 어떤 순간이 즐거웠어요?"처럼 이유·감정·구체적 경험을 한 겹 더 물어라. 아래를 대화 흐름에 맞춰 자연스럽게, 한 번에 하나씩 탐색한다(순서 고정 아님, 이미 나온 건 건너뛰기):
- 하고 싶은 것·끌리는 것: 시간 가는 줄 모르고 몰입하는 일, 상상만 해도 설레는 일, 되고 싶은 모습.
- 그 이면의 이유·동기: 왜 그것에 끌리는지, 무엇을 얻고 싶은지(성취감·인정·창작·도움·안정 등).
- 강점·잘하는 것: 남들이 칭찬하거나 스스로 자신 있는 것, 남보다 쉽게 해내는 것.
- 성향·일하는 방식: 혼자 vs 함께, 계획형 vs 즉흥형, 사람 응대 vs 몰입 작업 등.
- 가치관: 일에서 포기 못 하는 것(성장, 자유, 보람, 돈, 워라밸, 안정 등).
- 환경·상황: 전공·배운 것, 지금까지의 경험(알바·인턴·프로젝트), 언어(한국어/영어 수준), 체류·비자 상황, 희망 지역 등 현실 조건.
- 피하고 싶은 것: 하기 싫은 일·환경.
답할 때마다 사용자의 말에서 읽히는 점을 짧게 되짚어 공감해 주고("그 얘길 들으니 ○○에 진심이신 게 느껴져요"), 그다음 더 깊이 들어가는 질문 하나를 던져라. 질문은 한 번에 하나만.

[마무리 — 포지션 정리]
대화가 충분히 무르익어 사용자가 무엇을 하고 싶은지 그림이 그려지면(대화가 여러 차례 오가면), 마지막에 다음을 하나의 메시지로 정리해 줘라:
- 지금까지 들은 걸 2~3문장으로 요약("당신은 이런 걸 하고 싶은 분 같아요").
- 그래서 잘 어울릴 것 같은 구체적 포지션(직무)을 1~3개, 각각 '왜 어울리는지' 이유와 함께 제시. 가능하면 아래 '직무 후보 목록'에 있는 현실적인 직무명을 활용해라.
- 그 포지션 기준으로 지금 사용자에게 '부족해 보이는 점'과, 앞으로 '무엇을 배우고 키우면 좋을지'(필요한 역량·경험·포트폴리오·자격증·언어 등)를 구체적으로, 그리고 응원하는 톤으로 짚어줘라. 이 성장 조언은 사용자가 처음부터 하고 싶다고 말한 직무든, 대화로 함께 도출한 직무든 똑같이 적용한다. 다만 사용자가 실제로 말한 배경에 근거해서만 이야기하고, 모르는 부분은 단정하지 말고 "어떤지 알려주시면 더 정확히 도와드릴게요"처럼 열어둬라.
- 이어서 어떤 채용 공고(직무·키워드)를 찾아보면 좋을지, 이력서·자기소개서에서 무엇을 강조하면 좋을지 실질적 팁까지 정리.
이 정리는 대화 안 텍스트로만 전달하면 된다. 사용자가 따로 선택·저장할 필요는 없다.

대화 규칙:
- 반드시 한국어로만 답해줘(사용자가 다른 언어로 써도 한국어로).
- 항상 다정하고 예의 바른 존댓말, 따뜻하고 친근하게. 취업이 처음인 사람도 바로 이해할 만큼 쉬운 말로.
- 탐색 단계 답변은 2~4문장으로 간결하게(되짚기 → 더 깊은 질문 하나). 마지막 정리 단계는 조금 더 길어도 좋다.
- 초반부터 성급하게 포지션을 단정하지 마라. 먼저 '하고 싶은 것'을 충분히 깊게 알아가라.
- 평가·훈계·딱딱한 지시문 금지. 응원하는 톤. 이모지는 최대 1개.
- 사실을 지어내지 마. 사용자가 말하지 않은 경력·성향을 단정하지 마.

반드시 JSON 객체로만 답해: {"reply": "사용자에게 건네는 말"}`;

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
    : [{ role: "user", content: "상담을 시작해 주세요. 먼저 제가 하고 싶은 직무가 있는지 물어봐 주시고, 그에 맞춰 이야기를 이끌어 주세요." }];

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
    const parsed = JSON.parse(raw) as { reply?: string };

    const reply = typeof parsed.reply === "string" ? parsed.reply.trim() : "";
    if (!reply) return NextResponse.json({ error: "empty" }, { status: 502 });
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}
