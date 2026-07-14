import { createHash } from "crypto";
import OpenAI from "openai";
import { Prisma, type PrismaClient } from "@prisma/client";

// Hardcoded to a model that actually exists. The earlier env-driven default
// ("OPENAI_TRANSLATION_MODEL") had landed on an invalid model name in prod
// and silently failed every request, so we pin gpt-4o-mini here to match the
// rest of the LLM call sites (saju).
const MODEL = "gpt-4o-mini";

let cachedClient: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (cachedClient) return cachedClient;
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  cachedClient = new OpenAI({ apiKey: key });
  return cachedClient;
}

// User-visible free-text fields that should be translated. Taxonomy fields
// (preferredJobRole / eligibleVisas / etc.) stay in Korean as canonical keys.
export type PositionTranslatableFields = {
  title: string;
  workType: string | null;
  hiringProcess: string | null;
  workingHours: string | null;
  workLocation: string | null;
  mainResponsibilities: string | null;
  requiredQualifications: string | null;
  preferredQualifications: string | null;
  dressCode: string | null;
  additionalNotes: string | null;
};

// Input snapshot used both as the LLM source and the cache key fingerprint.
export type PositionTranslatableInput = PositionTranslatableFields;

function pickFields(p: Record<string, unknown>): PositionTranslatableFields {
  return {
    title: String(p.title ?? ""),
    workType: (p.workType as string | null | undefined) ?? null,
    hiringProcess: (p.hiringProcess as string | null | undefined) ?? null,
    workingHours: (p.workingHours as string | null | undefined) ?? null,
    workLocation: (p.workLocation as string | null | undefined) ?? null,
    mainResponsibilities: (p.mainResponsibilities as string | null | undefined) ?? null,
    requiredQualifications: (p.requiredQualifications as string | null | undefined) ?? null,
    preferredQualifications: (p.preferredQualifications as string | null | undefined) ?? null,
    dressCode: (p.dressCode as string | null | undefined) ?? null,
    additionalNotes: (p.additionalNotes as string | null | undefined) ?? null
  };
}

type CachedTranslation = PositionTranslatableFields & {
  // Content fingerprint of the source fields at translation time. Used to
  // detect "is this cache still valid?" without depending on Position.updatedAt
  // — which would bump every time we WRITE the cache itself (Prisma @updatedAt)
  // and cause an endless re-translation loop.
  sourceHash: string;
};

type TranslationsBlob = Partial<Record<string, CachedTranslation>>;

function hashSource(content: PositionTranslatableFields): string {
  // Order-stable canonical string of the source fields. Empty/null is folded
  // to "" so a transition between null and "" doesn't flap the hash.
  const keys = Object.keys(content).sort() as Array<keyof PositionTranslatableFields>;
  const canon = keys.map((k) => `${k}=${content[k] ?? ""}`).join("");
  return createHash("sha256").update(canon).digest("hex").slice(0, 16);
}

async function runLLMTranslation(
  content: PositionTranslatableFields
): Promise<PositionTranslatableFields | null> {
  const client = getClient();
  if (!client) return null;

  const prompt = [
    `Translate the following Korean job posting fields into natural, professional English.`,
    ``,
    `Rules:`,
    `- Preserve meaning exactly. Do NOT add, drop, or invent information.`,
    `- Keep the same field names and the same null-ness — if a field is null, return null.`,
    `- title: short, scannable job title (no extra phrases).`,
    `- workType / dressCode: translate concise descriptors (e.g. "정장" → "Business formal").`,
    `- Lists in Korean (bullets, numbered, line-separated) MUST keep the same line/bullet structure in English.`,
    `- Tone: clear, friendly, employer-side English suitable for a global candidate.`,
    `- Do NOT translate proper nouns (company names, product names, technologies).`,
    ``,
    `Return ONLY a strict JSON object with the same shape:`,
    `{`,
    `  "title": "<translated>",`,
    `  "workType": <translated or null>,`,
    `  "hiringProcess": <translated or null>,`,
    `  "workingHours": <translated or null>,`,
    `  "workLocation": <translated or null>,`,
    `  "mainResponsibilities": <translated or null>,`,
    `  "requiredQualifications": <translated or null>,`,
    `  "preferredQualifications": <translated or null>,`,
    `  "dressCode": <translated or null>,`,
    `  "additionalNotes": <translated or null>`,
    `}`,
    ``,
    `Source (Korean):`,
    JSON.stringify(content)
  ].join("\n");

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You translate Korean job postings into English and return strict JSON only."
        },
        { role: "user", content: prompt }
      ]
    });
    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PositionTranslatableFields>;
    const trimOrNull = (v: unknown): string | null => {
      if (typeof v !== "string") return null;
      const t = v.trim();
      return t.length > 0 ? t : null;
    };
    const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
    if (!title) {
      console.warn("[position-translate] LLM returned empty title; raw=", raw.slice(0, 200));
      return null;
    }
    return {
      title,
      workType: trimOrNull(parsed.workType),
      hiringProcess: trimOrNull(parsed.hiringProcess),
      workingHours: trimOrNull(parsed.workingHours),
      workLocation: trimOrNull(parsed.workLocation),
      mainResponsibilities: trimOrNull(parsed.mainResponsibilities),
      requiredQualifications: trimOrNull(parsed.requiredQualifications),
      preferredQualifications: trimOrNull(parsed.preferredQualifications),
      dressCode: trimOrNull(parsed.dressCode),
      additionalNotes: trimOrNull(parsed.additionalNotes)
    };
  } catch (error) {
    console.error("[position-translate] LLM failed", error);
    return null;
  }
}

// Returns translated fields for the given locale. Cache key is "en" — we
// translate to English only and serve it to every non-Korean viewer. INTERNAL
// filter is applied by the caller (we trust the caller). Best-effort: returns
// null on any failure so the caller can fall back to the original Korean text.
export async function getPositionTranslation(
  prisma: PrismaClient,
  position: {
    id: string;
    translations: unknown;
  } & Record<string, unknown>
): Promise<PositionTranslatableFields | null> {
  const source = pickFields(position);
  const sourceHash = hashSource(source);
  const blob = (position.translations ?? {}) as TranslationsBlob;
  const cached = blob.en;
  if (cached && cached.sourceHash === sourceHash) {
    // Strip the bookkeeping field before returning so the caller gets clean fields.
    const { sourceHash: _h, ...fields } = cached;
    return fields;
  }
  const translated = await runLLMTranslation(source);
  if (!translated) return null;
  const nextBlob: TranslationsBlob = {
    ...blob,
    en: { ...translated, sourceHash }
  };
  // Await the write so a single repeat call cannot retrigger LLM. Cost is
  // a few ms compared to an LLM round-trip we just spent ~2s on.
  try {
    await prisma.position.update({
      where: { id: position.id },
      data: { translations: nextBlob as unknown as Prisma.InputJsonValue }
    });
    console.log("[position-translate] cached", position.id, "hash=", sourceHash);
  } catch (err) {
    console.error("[position-translate] cache write failed", position.id, err);
  }
  return translated;
}

// Convenience: many INTERNAL items in one go. Parallel LLM calls.
// NOTE: this BLOCKS on the LLM for cache misses — only use where waiting is acceptable
// (e.g. a single position detail). List endpoints must use the cached-only variant below.
export async function getPositionTranslationsBatch(
  prisma: PrismaClient,
  positions: Array<{ id: string; updatedAt: Date; translations: unknown } & Record<string, unknown>>
): Promise<Map<string, PositionTranslatableFields>> {
  const out = new Map<string, PositionTranslatableFields>();
  const results = await Promise.all(
    positions.map(async (p) => ({ id: p.id, fields: await getPositionTranslation(prisma, p) }))
  );
  for (const r of results) {
    if (r.fields) out.set(r.id, r.fields);
  }
  return out;
}

// 같은 공고를 동시에 여러 요청이 번역하지 않도록 하는 진행 중 표시.
const inFlightTranslations = new Set<string>();

// 목록용 — 절대 LLM 을 기다리지 않는다.
//
// 기존에는 목록 응답 경로에서 캐시가 없으면 그 자리에서 LLM 번역(2~4초)을 돌렸다.
// INTERNAL(직접등록) 공고에만 번역이 붙는 탓에, 외부 공고 목록은 5ms 인데
// Aply 공고 목록만 첫 요청이 4초씩 걸렸다. 공고를 수정하면 sourceHash 가 바뀌므로
// 그 다음 접속자가 매번 그 비용을 대신 치렀다.
//
// 이제 캐시가 있으면 쓰고, 없으면 원문(한국어)을 그대로 보여준 뒤 백그라운드에서 번역해
// 다음 요청부터 번역본이 나오게 한다. 사용자는 번역을 기다리지 않는다.
export async function getPositionTranslationsCachedOnly(
  prisma: PrismaClient,
  positions: Array<{ id: string; updatedAt: Date; translations: unknown } & Record<string, unknown>>
): Promise<Map<string, PositionTranslatableFields>> {
  const out = new Map<string, PositionTranslatableFields>();

  for (const p of positions) {
    const source = pickFields(p);
    const sourceHash = hashSource(source);
    const cached = ((p.translations ?? {}) as TranslationsBlob).en;

    if (cached && cached.sourceHash === sourceHash) {
      const { sourceHash: _h, ...fields } = cached;
      out.set(p.id, fields);
      continue;
    }

    // 캐시 미스 — 응답을 막지 않고 뒤에서 채운다.
    if (!inFlightTranslations.has(p.id)) {
      inFlightTranslations.add(p.id);
      void getPositionTranslation(prisma, p)
        .catch((err) => console.error("[position-translate] background failed", p.id, err))
        .finally(() => inFlightTranslations.delete(p.id));
    }
  }

  return out;
}

// True when a viewer's locale should see the English translation.
// (Korean keeps original; everyone else gets English.)
export function shouldTranslateForLocale(locale: string | undefined | null): boolean {
  if (!locale) return false;
  return locale.toLowerCase() !== "ko";
}

// 공고를 저장한 뒤 번역을 미리 만들어 둔다(응답을 막지 않는 fire-and-forget).
// 외부(크롤링) 공고는 번역하지 않으므로 INTERNAL 만 대상으로 한다.
export async function warmPositionTranslation(prisma: PrismaClient, positionId: string): Promise<void> {
  try {
    const position = await prisma.position.findUnique({ where: { id: positionId } });
    if (!position || position.sourceKind !== "INTERNAL") return;
    if (inFlightTranslations.has(positionId)) return;
    inFlightTranslations.add(positionId);
    try {
      await getPositionTranslation(prisma, position as unknown as { id: string; translations: unknown } & Record<string, unknown>);
    } finally {
      inFlightTranslations.delete(positionId);
    }
  } catch (err) {
    console.error("[position-translate] warm failed", positionId, err);
  }
}
