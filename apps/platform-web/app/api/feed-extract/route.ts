// 피드 글 → 이력서/자소서 자동 추출 라우터.
// 공유 피드에 올린 글에서 이력서/자소서에 쓸 내용을 판단·구조화해 돌려준다.
// 커리어와 무관한 글은 아무것도 뽑지 않는다(none). 키 없거나 실패 시 502 → 클라이언트 폴백.
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// 이력서 섹션 키(resume-doc의 CareerSection과 일치).
const RESUME_SECTIONS = ["education", "certificate", "experience", "project", "skill", "award", "activity"] as const;
const COVER_QUESTIONS = ["지원 동기", "나의 강점과 준비된 경험", "성장 과정", "성격의 장단점", "입사 후 포부"];

const SYSTEM = `너는 취업 준비생의 커뮤니티 피드 글에서 이력서·자기소개서 소재를 뽑아내는 도우미야.
사용자가 피드에 올린 한 편의 글을 읽고, 커리어에 쓸 만한 내용을 판단해서 아래 JSON으로만 답해.

- resume: 이력서에 넣을 사실이 있으면 채운다.
  - section 은 다음 중 하나: education(학력), certificate(자격증), experience(경력/알바/인턴), project(프로젝트), skill(스킬/역량), award(수상), activity(대외활동/동아리)
  - text 는 이력서 개조식(명사형 종결, 간결)으로 구조화. 대화체 금지.
- cover: 자기소개서 소재(동기·성장·강점·성격·포부 등 서술형 스토리)가 있으면 채운다.
  - question 은 다음 중 하나: ${COVER_QUESTIONS.join(", ")}
  - text 는 자기소개서 문단(존댓말, 2~4문장).
- 둘 다 없으면(잡담·감정·일상 등 커리어 무관) 아무 키도 넣지 말고 {} 로 답해.

규칙:
- 절대 없는 사실·수치·경력을 지어내지 마. 글에 있는 내용만 근거로.
- 애매하면 넣지 마(정확도 우선). 하나만 해당하면 하나만 채워도 된다.

반드시 이 형태의 JSON 객체로만 답해:
{"resume": {"section": "...", "text": "..."}, "cover": {"question": "...", "text": "..."}}
(해당 없으면 그 키 생략)`;

type Extracted = {
  resume?: { section: string; text: string };
  cover?: { question: string; text: string };
};

function sanitize(parsed: Extracted): Extracted {
  const out: Extracted = {};
  const rSection = parsed.resume?.section?.trim();
  const rText = parsed.resume?.text?.trim();
  if (rSection && rText && (RESUME_SECTIONS as readonly string[]).includes(rSection)) {
    out.resume = { section: rSection, text: rText };
  }
  const cQuestion = parsed.cover?.question?.trim();
  const cText = parsed.cover?.text?.trim();
  if (cText) {
    out.cover = { question: COVER_QUESTIONS.includes(cQuestion ?? "") ? cQuestion! : COVER_QUESTIONS[0], text: cText };
  }
  return out;
}

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "no_key" }, { status: 502 });

  let body: { text?: string; name?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const text = (body.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });

  const model = process.env.OPENAI_CAREER_MODEL || process.env.OPENAI_TRANSLATION_MODEL || "gpt-4o-mini";
  const userContent = [body.name ? `작성자: ${body.name}` : "", `피드 글:\n${text}`].filter(Boolean).join("\n");

  const payload = JSON.stringify({
    model,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: userContent }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 500
  });

  const callOpenAI = () =>
    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: payload
    });

  try {
    let res = await callOpenAI();
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1500));
      res = await callOpenAI();
    }
    if (!res.ok) return NextResponse.json({ error: "upstream", status: res.status }, { status: 502 });
    const data = await res.json();
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? "{}") as Extracted;
    return NextResponse.json(sanitize(parsed));
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}
