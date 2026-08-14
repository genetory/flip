// 자기소개서 어시스턴트 — 문항 답변을 (refine)다듬거나 (draft)초안 작성.
// 사실을 지어내지 않고, 사용자의 실제 경험(resumeText)만 근거로 한다.
// OPENAI_API_KEY 없거나 실패 시 502 → 클라이언트가 폴백.
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM = `너는 한국 첫 취업 준비생의 자기소개서를 돕는 다정한 도우미야.
- 반드시 한국어로만 답해. 항상 다정하고 예의 바른 존댓말, 진솔하고 자연스러운 문어체. 과장·상투적 표현·거짓 정보 금지.
- 절대 사실을 지어내지 마. 주어진 내용(사용자 답변/메모, 실제 경험 resumeText)만 근거로 써.
mode 에 따라:
- refine: 사용자의 answer 를 자기소개서 문단답게 '더 길고 풍부하게' 풀어써(3~6문장). 짧으면 맥락·동기·구체적 상황·배운 점을 자연스럽게 확장하고, 매끄럽고 설득력 있게 다듬어. 단, 없는 사실·수치·경력은 지어내지 마. → {"answer": "..."}
- draft: question 에 대한 짧은 초안(2~4문장)을 resumeText 의 실제 경험을 근거로 작성. 근거가 부족하면 지어내지 말고 무엇을 적으면 좋을지 안내를 answer 로. → {"answer": "..."}
- chat: 사용자의 '메모'를 주어진 '문항'에 넣을 자기소개서 문단으로 완성해(3~5문장).
  - 짧은 메모라도 맥락·동기·배운 점을 자연스럽게 '부풀려' 구체화하고, 문장은 매끄럽게 다듬어 완성도 높게.
  - 단, 없는 사실·수치·경력은 지어내지 마(메모와 resumeText 범위 안에서 표현만 풍부하게).
  → {"text": "..."}
반드시 JSON 객체로만 답해.`;

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "no_key" }, { status: 502 });

  let body: {
    mode?: string;
    question?: string;
    answer?: string;
    note?: string;
    name?: string;
    resumeText?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const mode = body.mode === "draft" ? "draft" : body.mode === "chat" ? "chat" : "refine";
  const model = process.env.OPENAI_CAREER_MODEL || process.env.OPENAI_TRANSLATION_MODEL || "gpt-4o-mini";

  let userContent = "";
  if (mode === "chat") {
    const question = (body.question ?? "").trim();
    if (!(body.note ?? "").trim()) return NextResponse.json({ error: "empty" }, { status: 400 });
    userContent = [
      "mode: chat",
      `문항: ${question}`,
      `사용자 메모: ${body.note}`,
      body.name ? `이름: ${body.name}` : "",
      body.resumeText ? `참고할 실제 경험:\n${body.resumeText}` : ""
    ]
      .filter(Boolean)
      .join("\n");
  } else {
    const question = (body.question ?? "").trim();
    const answer = (body.answer ?? "").trim();
    if (mode === "refine" && !answer) return NextResponse.json({ error: "empty" }, { status: 400 });
    userContent = [
      `mode: ${mode}`,
      `문항: ${question}`,
      answer ? `현재 답변: ${answer}` : "현재 답변: (없음)",
      body.name ? `이름: ${body.name}` : "",
      body.resumeText ? `참고할 실제 경험:\n${body.resumeText}` : "참고할 실제 경험: (없음)"
    ]
      .filter(Boolean)
      .join("\n");
  }

  const payload = JSON.stringify({
    model,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: userContent }
    ],
    response_format: { type: "json_object" },
    temperature: 0.6,
    max_tokens: 600
  });
  const callOpenAI = () =>
    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: payload
    });

  try {
    let res = await callOpenAI();
    // 일시적 rate limit(429)이면 한 번 재시도.
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1500));
      res = await callOpenAI();
    }
    if (!res.ok) return NextResponse.json({ error: "upstream", status: res.status }, { status: 502 });
    const data = await res.json();
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content) as { text?: string; answer?: string };
    if (mode === "chat") {
      return NextResponse.json({ text: (parsed.text ?? parsed.answer ?? body.note ?? "").trim() });
    }
    return NextResponse.json({ answer: (parsed.answer ?? body.answer ?? "").trim() });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}
