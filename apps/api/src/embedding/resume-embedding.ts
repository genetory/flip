import { PrismaClient } from "@prisma/client";
import { generateEmbedding, toPgVector } from "./position-embedding";

// 이력서(대표) → 시맨틱 인재검색용 임베딩. Position.embedding 과 동일 파이프라인.
//
// content 에 **두 가지 모양**이 섞여 있다:
//   레거시 resume-maker — educations/careers/activities/skills/languages/certifications/summary/...
//   리뉴얼 에디터       — renewalResume.items[] ({section, text, company, startDate, endDate})
// 지금 사용자가 갈 수 있는 이력서 화면은 리뉴얼 에디터뿐인데(옛 경로는 308 로 보낸다),
// 예전에는 레거시 키만 읽어서 **리뉴얼로 쓴 내용이 임베딩에 하나도 안 들어갔다** —
// 로컬 확인 결과 11개 항목짜리 이력서가 "희망 직무: 백엔드 엔지니어" 15자로 임베딩됐다.
// 레거시 키가 함께 있는 행은 길이만 보면 멀쩡해 보여서 더 안 드러났다(옛 내용을 임베딩 중).
//
// 둘 다 읽고 리뉴얼을 앞에 둔다. 한쪽만 고르면 상대쪽 정보를 잃는데, 임베딩은 텍스트를 합쳐
// 벡터를 만들 뿐이라 둘을 함께 넣어도 손해가 적다.
// 이름·연락처(renewalBasicInfo)는 넣지 않는다 — 검색 품질에 도움이 안 되고 개인정보다.
const MAX_INPUT_CHARS = 8000;

const s = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** 리뉴얼 항목 섹션 → 사람이 읽는 묶음 이름. 임베딩 텍스트의 소제목이 된다. */
const RENEWAL_SECTION_LABEL: Record<string, string> = {
  education: "학력",
  experience: "경력",
  project: "활동·프로젝트",
  activity: "활동·프로젝트",
  certificate: "자격증",
  award: "수상",
  language: "어학",
  skill: "보유 역량"
};

/** 리뉴얼 에디터(renewalResume)에서 임베딩용 줄을 뽑는다. 항목이 없으면 빈 배열. */
function renewalLines(content: Record<string, unknown>): string[] {
  const doc = (content.renewalResume && typeof content.renewalResume === "object" ? content.renewalResume : null) as Record<string, unknown> | null;
  if (!doc) return [];
  const items = Array.isArray(doc.items) ? (doc.items as Record<string, unknown>[]) : [];
  const lines: string[] = [];
  const intro = s(doc.summary);
  if (intro) lines.push(`자기소개:\n${intro}`);
  // 섹션별로 묶는다 — 레거시 쪽 출력 모양과 같게 해서 두 출처가 섞여도 읽히게.
  const groups = new Map<string, string[]>();
  for (const it of items) {
    const label = RENEWAL_SECTION_LABEL[s(it.section)] ?? "기타";
    const period = [s(it.startDate), s(it.endDate)].filter(Boolean).join(" ~ ");
    const line = [s(it.company), s(it.text), period].filter(Boolean).join(" ");
    if (!line) continue;
    groups.set(label, [...(groups.get(label) ?? []), line]);
  }
  for (const [label, rows] of groups) lines.push(`${label}:\n${rows.map((x) => `- ${x}`).join("\n")}`);
  return lines;
}

export function buildResumeEmbeddingText(content: unknown): string {
  const c = (content && typeof content === "object" ? content : {}) as Record<string, unknown>;
  const lines: string[] = [];
  const renewalDoc = (c.renewalResume && typeof c.renewalResume === "object" ? c.renewalResume : null) as Record<string, unknown> | null;
  const role = s(c.desiredJobRole) || s(renewalDoc?.targetRole);
  if (role) lines.push(`희망 직무: ${role}`);
  // 리뉴얼 쪽을 먼저 — 사용자가 지금 편집하는 내용이다.
  lines.push(...renewalLines(c));
  const intro = s(c.summary) || s(c.selfIntroduction);
  if (intro) lines.push(`자기소개:\n${intro}`);
  const arr = (k: string): Record<string, unknown>[] => (Array.isArray(c[k]) ? (c[k] as Record<string, unknown>[]) : []);
  const edus = arr("educations").map((e) => [s(e.schoolName), s(e.major), s(e.degree)].filter(Boolean).join(" ")).filter(Boolean);
  if (edus.length) lines.push(`학력:\n${edus.map((x) => `- ${x}`).join("\n")}`);
  const careers = arr("careers")
    .map((w) => [s(w.companyName), s(w.position), s(w.description)].filter(Boolean).join(" "))
    .filter(Boolean);
  if (careers.length) lines.push(`경력:\n${careers.map((x) => `- ${x}`).join("\n")}`);
  const acts = arr("activities")
    .map((a) => [s(a.organization), s(a.title), s(a.description)].filter(Boolean).join(" "))
    .filter(Boolean);
  if (acts.length) lines.push(`활동·프로젝트:\n${acts.map((x) => `- ${x}`).join("\n")}`);
  const skills = Array.isArray(c.skills) ? (c.skills as unknown[]).filter((x): x is string => typeof x === "string") : [];
  if (skills.length) lines.push(`보유 역량: ${skills.slice(0, 40).join(", ")}`);
  const langs = Array.isArray(c.languages)
    ? (c.languages as Record<string, unknown>[]).map((l) => [s(l.language), s(l.level)].filter(Boolean).join(" ")).filter(Boolean)
    : [];
  if (langs.length) lines.push(`어학: ${langs.join(", ")}`);
  const certs = Array.isArray(c.certifications) ? (c.certifications as unknown[]) : [];
  const certStr = certs.map((x) => (typeof x === "string" ? x : x && typeof x === "object" ? s((x as Record<string, unknown>).name) : "")).filter(Boolean).join(", ");
  if (certStr) lines.push(`자격증: ${certStr}`);

  const joined = lines.filter(Boolean).join("\n\n");
  return joined.length > MAX_INPUT_CHARS ? joined.slice(0, MAX_INPUT_CHARS) : joined;
}

// 대표 이력서 임베딩 재생성. 쓰기 경로에서 fire-and-forget, 백필에서 await.
export async function embedAndSaveResume(prisma: PrismaClient, resumeId: string): Promise<boolean> {
  try {
    const resume = await prisma.resume.findUnique({ where: { id: resumeId }, select: { id: true, content: true } });
    if (!resume) return false;
    const text = buildResumeEmbeddingText(resume.content);
    const vector = await generateEmbedding(text);
    if (!vector) return false;
    const vectorLiteral = toPgVector(vector);
    await prisma.$executeRaw`
      UPDATE "Resume"
      SET "embedding" = ${vectorLiteral}::vector,
          "embeddingUpdatedAt" = NOW()
      WHERE "id" = ${resumeId}
    `;
    return true;
  } catch (error) {
    console.error("[embedding] embedAndSaveResume failed", { resumeId, error });
    return false;
  }
}
