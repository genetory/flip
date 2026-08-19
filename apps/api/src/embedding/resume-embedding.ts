import { PrismaClient } from "@prisma/client";
import { generateEmbedding, toPgVector } from "./position-embedding";

// 이력서(대표) → 시맨틱 인재검색용 임베딩. Position.embedding 과 동일 파이프라인.
// 구조화 content(educations/careers/activities/skills/summary/selfIntroduction/
// desiredJobRole/certifications/languages)를 하나의 문서로 합쳐 임베딩한다.
const MAX_INPUT_CHARS = 8000;

const s = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

export function buildResumeEmbeddingText(content: unknown): string {
  const c = (content && typeof content === "object" ? content : {}) as Record<string, unknown>;
  const lines: string[] = [];
  const role = s(c.desiredJobRole);
  if (role) lines.push(`희망 직무: ${role}`);
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
