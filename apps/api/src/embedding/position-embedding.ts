import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";

const EMBEDDING_MODEL = "text-embedding-3-large";
const EMBEDDING_DIMENSIONS = 768;
const MAX_INPUT_CHARS = 8000;

// Format a JS number[] for the pgvector text input format: "[v1,v2,...]".
// Used in raw SQL because Prisma doesn't natively serialize vectors.
function toPgVector(vector: number[]): string {
  return `[${vector.join(",")}]`;
}

export { toPgVector };

let cachedClient: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (cachedClient) return cachedClient;
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  cachedClient = new OpenAI({ apiKey: key });
  return cachedClient;
}

type PositionEmbeddingInput = {
  title?: string | null;
  preferredJobRole?: string | null;
  workingHours?: string | null;
  mainResponsibilities?: string | null;
  requiredQualifications?: string | null;
  preferredQualifications?: string | null;
  hiringProcess?: string | null;
  dressCode?: string | null;
  additionalNotes?: string | null;
  eligibleVisas?: string[] | null;
  communicationLanguages?: string[] | null;
  preferredNationalities?: string[] | null;
  workLocation?: string | null;
  partnerOrganization?: {
    name?: string | null;
    industry?: string | null;
    description?: string | null;
    strengths?: string | null;
    officeAddress?: string | null;
  } | null;
};

// Concatenate the position + its company context into one document. Order
// matters mildly: high-signal fields (title, role, responsibilities) go
// first so that if we ever truncate, the most important text survives.
export function buildPositionEmbeddingText(input: PositionEmbeddingInput): string {
  const lines: string[] = [];
  if (input.title) lines.push(input.title);
  if (input.preferredJobRole) lines.push(`직무: ${input.preferredJobRole}`);
  if (input.workLocation) lines.push(`근무 지역: ${input.workLocation}`);
  if (input.workingHours) lines.push(`근무 시간: ${input.workingHours}`);
  if (input.mainResponsibilities) lines.push(`주요 업무:\n${input.mainResponsibilities}`);
  if (input.requiredQualifications) lines.push(`필수 자격:\n${input.requiredQualifications}`);
  if (input.preferredQualifications) lines.push(`우대 사항:\n${input.preferredQualifications}`);
  if (input.hiringProcess) lines.push(`채용 프로세스: ${input.hiringProcess}`);
  if (input.dressCode) lines.push(`근무 복장: ${input.dressCode}`);
  if (input.additionalNotes) lines.push(`기타: ${input.additionalNotes}`);
  if (input.eligibleVisas?.length) lines.push(`지원 가능 비자: ${input.eligibleVisas.join(", ")}`);
  if (input.communicationLanguages?.length) lines.push(`소통 언어: ${input.communicationLanguages.join(", ")}`);
  if (input.preferredNationalities?.length) lines.push(`선호 국적: ${input.preferredNationalities.join(", ")}`);

  const org = input.partnerOrganization;
  if (org?.name) lines.push(`회사: ${org.name}`);
  if (org?.industry) lines.push(`산업: ${org.industry}`);
  if (org?.officeAddress) lines.push(`사무실: ${org.officeAddress}`);
  if (org?.description) lines.push(`회사 소개:\n${org.description}`);
  if (org?.strengths) lines.push(`회사 강점:\n${org.strengths}`);

  const joined = lines.filter(Boolean).join("\n\n");
  return joined.length > MAX_INPUT_CHARS ? joined.slice(0, MAX_INPUT_CHARS) : joined;
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const client = getClient();
  if (!client) return null;
  try {
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: trimmed,
      dimensions: EMBEDDING_DIMENSIONS
    });
    const vector = response.data[0]?.embedding;
    if (!Array.isArray(vector) || vector.length === 0) return null;
    return vector;
  } catch (error) {
    console.error("[embedding] generate failed", error);
    return null;
  }
}

// In-memory LRU cache for query embeddings. Search queries are highly
// repetitive ("개발자", "마케팅", company names...) so caching avoids
// hitting OpenAI on every keystroke. Keyed by normalized (lowercased,
// trimmed) text. Map insertion-order doubles as LRU recency.
type QueryCacheEntry = { vector: number[]; expiresAt: number };
const QUERY_CACHE_MAX = 1000;
const QUERY_CACHE_TTL_MS = 60 * 60 * 1000;
const queryEmbedCache = new Map<string, QueryCacheEntry>();

export async function embedQueryCached(text: string): Promise<number[] | null> {
  const key = text.trim().toLowerCase();
  if (!key) return null;
  const now = Date.now();
  const hit = queryEmbedCache.get(key);
  if (hit && hit.expiresAt > now) {
    queryEmbedCache.delete(key);
    queryEmbedCache.set(key, hit);
    return hit.vector;
  }
  if (hit) queryEmbedCache.delete(key);
  const vector = await generateEmbedding(text);
  if (!vector) return null;
  if (queryEmbedCache.size >= QUERY_CACHE_MAX) {
    const oldestKey = queryEmbedCache.keys().next().value;
    if (oldestKey !== undefined) queryEmbedCache.delete(oldestKey);
  }
  queryEmbedCache.set(key, { vector, expiresAt: now + QUERY_CACHE_TTL_MS });
  return vector;
}

// Hybrid keyword scoring. Returns a number in [0, 1] reflecting how well
// the query matches the position's text fields. Used alongside cosine
// similarity so that exact lexical hits (company names, tech stack,
// region) stay near the top even when semantic similarity is moderate.
export type KeywordScoreInput = {
  title?: string | null;
  preferredJobRole?: string | null;
  workLocation?: string | null;
  mainResponsibilities?: string | null;
  requiredQualifications?: string | null;
  preferredQualifications?: string | null;
  partnerOrganizationName?: string | null;
};

// Common Korean postpositional particles (조사). Stripped from query
// tokens before keyword matching so "부산에서 살거야" tokenizes to
// ["부산", "살거야"] and matches workLocation "부산 해운대구". Without
// this, `text.includes("부산에서")` always fails because position
// text never contains the particle. Sorted longest-first to greedy-
// match (e.g., "에서" before "서").
const KOREAN_PARTICLES = [
  "이라서", "라서", "이라도", "라도", "에서", "에게", "이나", "으로",
  "이라", "에", "은", "는", "이", "가", "을", "를", "도", "와", "과", "의", "라", "로", "나"
];

function stripKoreanParticles(token: string): string {
  for (const particle of KOREAN_PARTICLES) {
    if (token.length > particle.length + 1 && token.endsWith(particle)) {
      return token.slice(0, -particle.length);
    }
  }
  return token;
}

// Public helper: expand a free-text query into the set of unique
// substring-search candidates (raw + particle-stripped, lowercased,
// deduped, length-filtered). Used by both keywordScore and the
// SQL-side keyword pool to keep their matching consistent.
// 검색 동의어·별칭 — 사용자가 입력한 직무어를 공고 vocabulary로 넓혀 재현율을 높인다.
// 각 그룹의 한 단어라도 쿼리 토큰과 일치/포함되면 그룹 전체를 후보로 추가한다.
// 후보 풀만 넓히고(제거 없음) 이후 하이브리드 점수·관련도 하한이 무관 결과를 걸러내므로 안전하다.
// 흔한 오탈자(빽엔드/프론트)도 별칭으로 흡수해 가벼운 오타 보정 효과를 낸다.
const SEARCH_SYNONYM_GROUPS: string[][] = [
  ["개발", "개발자", "engineer", "developer", "dev", "엔지니어", "프로그래머"],
  ["백엔드", "backend", "back-end", "서버개발", "빽엔드", "백앤드"],
  ["프론트엔드", "프론트", "frontend", "front-end", "웹개발", "프론트앤드"],
  ["풀스택", "fullstack", "full-stack", "풀스텍"],
  ["디자인", "디자이너", "designer", "design", "ui", "ux"],
  ["기획", "기획자", "pm", "product manager", "프로덕트", "서비스기획"],
  ["마케팅", "마케터", "marketing", "퍼포먼스마케팅", "그로스"],
  ["데이터", "data", "데이터분석", "analyst", "분석가", "데이터사이언티스트"],
  ["영업", "sales", "세일즈", "영업관리"],
  ["인사", "hr", "인사담당", "채용", "리크루터", "recruiter"],
  ["회계", "재무", "finance", "accounting", "경리"],
  ["고객", "고객지원", "cs", "customer", "cx", "상담"],
  ["ai", "인공지능", "머신러닝", "ml", "딥러닝"],
  ["안드로이드", "android", "ios", "모바일", "mobile", "앱개발"],
  ["qa", "품질", "테스터", "quality", "테스트엔지니어"]
];

export function expandQueryCandidates(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out = new Set<string>();
  for (const token of q.split(/\s+/)) {
    if (token.length === 0) continue;
    if (token.length >= 2) out.add(token);
    const stripped = stripKoreanParticles(token);
    if (stripped && stripped.length >= 2 && stripped !== token) out.add(stripped);
  }
  // 동의어 확장 — 쿼리 전체 또는 개별 토큰이 그룹 멤버와 같거나 그 멤버를 포함하면 그룹 전체 추가.
  const haystack = [q, ...out];
  for (const group of SEARCH_SYNONYM_GROUPS) {
    const hit = group.some((term) => haystack.some((h) => h === term || h.includes(term)));
    if (hit) {
      for (const term of group) if (term.length >= 2) out.add(term);
    }
  }
  return Array.from(out);
}

// Per-field weights for keyword scoring. workLocation gets a high
// weight (parity with title) because location queries ("부산 근무",
// "remote", "강남") are very explicit user intent and the semantic
// embedding doesn't differentiate cities well — embeddings are
// dominated by job content, so "부산 근무" and "서울 근무" return
// nearly identical ANN scores.
const KEYWORD_FIELD_WEIGHTS: Array<{ key: keyof KeywordScoreInput; weight: number }> = [
  { key: "title", weight: 0.5 },
  { key: "workLocation", weight: 0.5 },
  { key: "partnerOrganizationName", weight: 0.4 },
  { key: "preferredJobRole", weight: 0.35 },
  { key: "mainResponsibilities", weight: 0.12 },
  { key: "requiredQualifications", weight: 0.1 },
  { key: "preferredQualifications", weight: 0.08 }
];

export function keywordScore(input: KeywordScoreInput, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const rawTokens = q.split(/\s+/).filter((t) => t.length > 0);
  if (rawTokens.length === 0) return 0;
  // Strip Korean particles so conversational phrasing ("부산에서 살거야")
  // still produces a usable "부산" stem for substring matching. We keep
  // the ratio denominator as the *original* token count so scores
  // don't shrink just because we added stripped variants.
  const tokenVariants = rawTokens.map((t) => {
    const variants = new Set<string>([t]);
    const stripped = stripKoreanParticles(t);
    if (stripped && stripped !== t) variants.add(stripped);
    return Array.from(variants);
  });

  let score = 0;
  for (const { key, weight } of KEYWORD_FIELD_WEIGHTS) {
    const text = (input[key] ?? "").toString().toLowerCase();
    if (!text) continue;
    const matched = tokenVariants.filter((variants) => variants.some((v) => text.includes(v))).length;
    if (matched === 0) continue;
    // Per-field contribution scales with how many query tokens hit
    // this field. A field that contains all tokens gets full weight.
    score += weight * (matched / rawTokens.length);
    // Bonus for the whole query appearing as a phrase in one field
    // (e.g. exact company name match) — caps the field contribution
    // at 1.5x its base weight.
    if (q.length > 1 && rawTokens.length > 1 && text.includes(q)) {
      score += weight * 0.5;
    }
  }

  return Math.min(score, 1);
}

// Cosine similarity of two equal-length vectors. Returns 0 on size mismatch
// or if either side is zero-magnitude so the caller never has to special-case.
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Re-embed a position by id. Fire-and-forget from write paths; awaited from
// importers and the backfill script. Pulls partner-org context so the
// embedding captures company-side semantic signal too.
export async function embedAndSavePosition(prisma: PrismaClient, positionId: string): Promise<boolean> {
  try {
    const position = await prisma.position.findUnique({
      where: { id: positionId },
      include: {
        partnerOrganization: {
          select: {
            name: true,
            industry: true,
            description: true,
            strengths: true,
            officeAddress: true
          }
        }
      }
    });
    if (!position) return false;

    const text = buildPositionEmbeddingText({
      title: position.title,
      preferredJobRole: position.preferredJobRole,
      workingHours: position.workingHours,
      mainResponsibilities: position.mainResponsibilities,
      requiredQualifications: position.requiredQualifications,
      preferredQualifications: position.preferredQualifications,
      hiringProcess: position.hiringProcess,
      dressCode: position.dressCode,
      additionalNotes: position.additionalNotes,
      eligibleVisas: position.eligibleVisas,
      communicationLanguages: position.communicationLanguages,
      preferredNationalities: position.preferredNationalities,
      workLocation: position.workLocation,
      partnerOrganization: position.partnerOrganization
    });

    const vector = await generateEmbedding(text);
    if (!vector) return false;

    // pgvector column is Unsupported() in Prisma so we write via raw SQL.
    // Use the textual vector literal `[v1,v2,...]` cast to vector.
    const vectorLiteral = toPgVector(vector);
    await prisma.$executeRaw`
      UPDATE "Position"
      SET "embedding" = ${vectorLiteral}::vector,
          "embeddingUpdatedAt" = NOW()
      WHERE "id" = ${positionId}
    `;
    return true;
  } catch (error) {
    console.error("[embedding] embedAndSavePosition failed", { positionId, error });
    return false;
  }
}
