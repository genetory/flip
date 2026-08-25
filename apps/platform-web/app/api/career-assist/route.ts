// 커리어 어시스턴트 — 사용자가 남긴 한 줄을 LLM으로 판단.
// (1) 알맞은 이력서 섹션 분류 (2) 이력서용 정중한 문어체로 다듬기 (3) 구체화 유도 후속 질문.
// OPENAI_API_KEY 가 없거나 실패하면 502 → 클라이언트가 규칙 기반으로 폴백한다.
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SECTIONS = ["education", "certificate", "experience", "project", "language", "skill", "award", "activity"] as const;
type Section = (typeof SECTIONS)[number];

const SYSTEM = `너는 한국 첫 취업 준비생을 돕는 다정한 커리어 도우미야. 사용자의 '커리어 노트'를 이력서/자기소개서 항목으로 정리해줘.
사용자가 편하게 남긴 한 줄을 받아서 아래를 판단해:
0) relevant: 이 노트가 이력서/자기소개서 작성에 쓸 커리어 내용인지 판단. 커리어(학력·경험·알바·인턴·프로젝트·자격증·역량·수상·대외활동·지원동기·강점 등)와 무관한 잡담·질문·감정토로·부적절/무의미한 내용이면 false, 관련되면 true.
1) section: 다음 중 정확히 하나로 분류. education(학력), certificate(자격증), experience(경험/알바/인턴), project(프로젝트), language(어학 — 영어·일본어·중국어 등 외국어 능력, 토익·OPIc·JLPT·HSK 등 어학시험/점수/회화), skill(스킬 — 프로그래밍·툴·직무 역량 등), award(수상), activity(대외활동). ※ 어학시험·외국어 능력은 certificate 가 아니라 language 로.
2) refined: 이력서에 그대로 들어갈 '개조식 항목'. 대화체 문장(예: ~했어요/~했습니다)이 아니라, 간결한 이력서 bullet 로. 군더더기·감정 표현·인사말 제거하고 핵심만. 가능하면 명사형 종결(예: ~함, ~완료, ~개선, ~취득)이나 '핵심 성과 위주' 요약. 마침표는 붙이지 마. 사실을 지어내지 말고 주어진 내용만 정리하며, 없는 수치는 만들지 마.
   - 경력(experience)·프로젝트(project)는 "무엇을 / 어떻게 / (있으면)성과" 가 드러나게 쉽고 구체적으로 풀어줘. 어려운 전문용어는 쉬운 말로.
   예) "카페에서 알바했어요" → "카페 아르바이트 — 고객 응대 및 주문·재고 관리"
   예) "토익 900점 땄어요" → "TOEIC 900점 취득"
   예) "친구랑 앱 만들었어요" → "팀 프로젝트 — 모바일 앱 기획·개발 참여"
2-1) title: 이 항목의 '짧은 제목'(이력서에서 소속·회사/기관명, 프로젝트명, 학교명, 자격증명, 스킬명, 활동명 자리에 들어갈 값). 노트에 고유명(회사·학교·프로젝트 이름 등)이 명시돼 있으면 그대로 쓰고, 없으면 내용을 요약해 3~20자 내외의 간결한 명사구 제목을 만들어. 마침표·군더더기 금지. 절대 빈 문자열로 두지 말고 항상 채워.
   예) "카페에서 알바했어요" → title "카페 아르바이트"
   예) "토익 900점 땄어요" → title "TOEIC"
   예) "OO전자에서 인턴했어요" → title "OO전자 인턴"
   예) "친구랑 배달 앱 만들었어요" → title "배달 앱 프로젝트"
3) startDate / endDate: 노트에 기간이 있으면 시작일(startDate)·종료일(endDate)로 나눠. 형식 "YYYY.MM" 또는 "YYYY". 진행 중이면 endDate="현재". 단일 시점(자격증 취득일·수상일 등)이면 startDate 에만 넣고 endDate 는 빈 문자열. 날짜 언급이 없으면 둘 다 빈 문자열.
4) mode: 직전 항목(prev)이 주어졌고, 사용자의 새 노트가 그 직전 항목을 '보충'하는 내용(특히 물어본 기간/날짜, 또는 같은 항목의 세부사항)이면 "update", 완전히 새로운 별개의 항목이면 "new". prev 가 없으면 항상 "new". mode="update" 면 section 은 prev 의 것을 그대로 쓰고, startDate/endDate(또는 보충된 내용)를 채워.
5) followUp: 사용자에게 직접 건네는 말. relevant=true 면 잘하고 있다고 짧게 격려하고, 무엇을 한 문장 더 적으면 좋은지 쉬운 예시와 함께 물어봐(특히 기간이 없으면 언제였는지 자연스럽게 물어봐). relevant=false 면 부드럽게 이력서에 담을 커리어 이야기를 적어달라고 안내해.

[followUp 톤 규칙]
- 반드시 한국어로만. 항상 다정하고 예의 바른 존댓말, 따뜻하고 친근하게. 취업이 처음인 사람도 바로 이해할 만큼 쉬운 말로.
- 어려운 용어·평가하는 말투·딱딱한 지시문 금지. 부담 주지 말고 응원하는 느낌.
- 1~2문장으로 짧게. 필요하면 '예: ~' 형태로 쉬운 예시 하나만.
- 이모지는 쓰더라도 최대 1개.

relevant=false 면 refined 는 빈 문자열로.
반드시 JSON 객체로만 답해: {"relevant": true, "section": "...", "title": "...", "refined": "...", "startDate": "", "endDate": "", "mode": "new", "followUp": "..."}`;

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "no_key" }, { status: 502 });

  let text = "";
  let hintSection: string | undefined;
  let prev: { text?: string; section?: string; needsPeriod?: boolean } | undefined;
  try {
    const body = (await req.json()) as { text?: string; hintSection?: string; prev?: { text?: string; section?: string; needsPeriod?: boolean } };
    text = (body.text ?? "").trim();
    hintSection = body.hintSection;
    prev = body.prev;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });

  const model = process.env.OPENAI_CAREER_MODEL || process.env.OPENAI_TRANSLATION_MODEL || "gpt-4o-mini";
  const parts: string[] = [];
  if (prev?.text) {
    parts.push(`직전에 정리한 항목: [${prev.section ?? "?"}] "${prev.text}"${prev.needsPeriod ? " (아직 기간 미입력 — 방금 기간을 물어본 상태)" : ""}`);
  }
  if (hintSection && (SECTIONS as readonly string[]).includes(hintSection)) {
    parts.push(`섹션은 반드시 "${hintSection}" 로 해줘.`);
  }
  parts.push(`사용자의 새 노트: ${text}`);
  const userContent = parts.join("\n");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userContent }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 300
      })
    });
    if (!res.ok) return NextResponse.json({ error: "upstream", status: res.status }, { status: 502 });
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(raw) as { relevant?: boolean; section?: string; title?: string; refined?: string; startDate?: string; endDate?: string; mode?: string; followUp?: string };

    const relevant = parsed.relevant !== false;
    const mode = prev?.text && parsed.mode === "update" ? "update" : "new";
    let section = (parsed.section ?? "") as Section;
    if (hintSection && (SECTIONS as readonly string[]).includes(hintSection)) section = hintSection as Section;
    if (!(SECTIONS as readonly string[]).includes(section)) section = "experience";

    return NextResponse.json({
      relevant,
      mode,
      section,
      title: relevant ? (parsed.title ?? "").trim().slice(0, 60) : "",
      refined: relevant ? (parsed.refined ?? text).trim() : "",
      startDate: relevant ? (parsed.startDate ?? "").trim() : "",
      endDate: relevant ? (parsed.endDate ?? "").trim() : "",
      followUp: (parsed.followUp ?? "").trim()
    });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}
