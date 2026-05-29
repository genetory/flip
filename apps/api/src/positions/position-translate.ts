import OpenAI from "openai";
import type { PrismaClient } from "@prisma/client";

// gpt-4o-mini is enough for job-posting copy and keeps per-position cost
// negligible (~$0.0005 per translation). Override via env if needed.
const MODEL = process.env.OPENAI_TRANSLATION_MODEL?.trim() || "gpt-4o-mini";

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
  // Updated whenever any source field changes; used to detect stale cache.
  updatedAt: string;
};

type TranslationsBlob = Partial<Record<string, CachedTranslation>>;

// Stable fingerprint of the input fields. If the position is edited, the
// updatedAt timestamp shifts and the cached translation is invalidated.
function isStale(cached: CachedTranslation, sourceUpdatedAt: Date): boolean {
  if (!cached.updatedAt) return true;
  const cachedMs = Date.parse(cached.updatedAt);
  if (Number.isNaN(cachedMs)) return true;
  return cachedMs < sourceUpdatedAt.getTime();
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
    if (!title) return null;
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
    updatedAt: Date;
    translations: unknown;
  } & Record<string, unknown>
): Promise<PositionTranslatableFields | null> {
  const blob = (position.translations ?? {}) as TranslationsBlob;
  const cached = blob.en;
  if (cached && !isStale(cached, position.updatedAt)) {
    // Strip the "updatedAt" before returning so the caller gets clean fields.
    const { updatedAt: _u, ...fields } = cached;
    return fields;
  }
  const source = pickFields(position);
  const translated = await runLLMTranslation(source);
  if (!translated) return null;
  const nextBlob: TranslationsBlob = {
    ...blob,
    en: { ...translated, updatedAt: position.updatedAt.toISOString() }
  };
  // Fire-and-forget persist; serving must not wait on the write.
  prisma.position
    .update({
      where: { id: position.id },
      data: { translations: nextBlob as object }
    })
    .catch((err) => console.error("[position-translate] cache write failed", err));
  return translated;
}

// Convenience: many INTERNAL items in one go. Parallel LLM calls.
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

// True when a viewer's locale should see the English translation.
// (Korean keeps original; everyone else gets English.)
export function shouldTranslateForLocale(locale: string | undefined | null): boolean {
  if (!locale) return false;
  return locale.toLowerCase() !== "ko";
}
