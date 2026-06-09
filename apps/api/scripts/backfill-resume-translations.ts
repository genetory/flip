import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import OpenAI from "openai";

// 기존 Resume 행 중 한국어 캐시(translations.ko)가 비어 있거나 외국어 본문이
// 새로 들어와 캐시가 부족한 row 를 일괄 번역해 채워 넣는다. API 의
// `buildKoreanTranslations` 와 동일한 룰을 그대로 옮겨 자족 동작.
//
// 동작:
//   기본 dry-run: 영향 받는 row 수 + 첫 5개 미리보기만 출력
//   --apply: 트랜잭션 없이 1건씩 update (중간 실패 시 부분 진행 — 다시 돌리면 이어감)
//
// 비용 통제:
//   - needsKoreanTranslation(): 한글 비중 50%+ 이거나 10자 미만이면 skip
//   - 변경 안 된 단위는 기존 캐시 그대로 → row 당 추가 호출 없음
//   - --limit N 으로 한 번에 최대 N row 만 처리 (cost 사전 캡)
//   - OPENAI_API_KEY 가 없으면 즉시 종료 (apply 모드일 때)
//
// 사용:
//   DATABASE_URL=... npm exec --workspace=apps/api -- \
//     tsx scripts/backfill-resume-translations.ts                # preview
//   DATABASE_URL=... npm exec --workspace=apps/api -- \
//     tsx scripts/backfill-resume-translations.ts --apply        # 실제 백필
//   DATABASE_URL=... npm exec --workspace=apps/api -- \
//     tsx scripts/backfill-resume-translations.ts --apply --limit 20

const prisma = new PrismaClient();
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const TRANSLATION_MODEL = process.env.OPENAI_TRANSLATION_MODEL ?? "gpt-4o-mini";

const SYSTEM_PROMPT =
  "당신은 이력서 번역가입니다. 외국인 지원자의 이력서 텍스트를 한국 기업이 읽기 좋은 자연스러운 한국어로 번역하세요. " +
  "원문에 있는 사실만 사용하고, 새 사실/수치/회사명/날짜를 추가하지 마세요. 의미를 부풀리지 마세요. " +
  "회사명·학교명·자격증명 같은 고유명사는 영문 그대로 두거나 (한국어 표기) 형태로 자연스럽게 표기. " +
  'JSON 한 개의 객체만 응답: { "ko": string }';

// ---- helpers (apps/api/src/index.ts 와 동일 룰) -----------------------------

function koreanRatio(text: string): number {
  if (!text) return 0;
  const total = text.replace(/\s+/g, "").length || 1;
  // U+AC00–U+D7A3: Hangul syllables. 한글 음절만 카운트 — 영어/기호 등은 제외.
  const hangul = (text.match(/[가-힣]/g) ?? []).length;
  return hangul / total;
}

function needsKoreanTranslation(text: string | null | undefined): boolean {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (trimmed.length < 10) return false;
  return koreanRatio(trimmed) < 0.5;
}

type TranslationUnit =
  | { path: "summary"; text: string }
  | { path: "selfIntroduction"; text: string }
  | { path: "careers"; index: number; text: string }
  | { path: "activities"; index: number; text: string };

function collectTranslationUnits(content: unknown): TranslationUnit[] {
  const units: TranslationUnit[] = [];
  if (!content || typeof content !== "object") return units;
  const c = content as Record<string, unknown>;
  const trimStr = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

  if (needsKoreanTranslation(trimStr(c.summary))) units.push({ path: "summary", text: trimStr(c.summary) });
  if (needsKoreanTranslation(trimStr(c.selfIntroduction)))
    units.push({ path: "selfIntroduction", text: trimStr(c.selfIntroduction) });
  if (Array.isArray(c.careers)) {
    c.careers.forEach((cr, idx) => {
      if (typeof cr !== "object" || cr === null) return;
      const desc = trimStr((cr as Record<string, unknown>).description);
      if (needsKoreanTranslation(desc)) units.push({ path: "careers", index: idx, text: desc });
    });
  }
  if (Array.isArray(c.activities)) {
    c.activities.forEach((a, idx) => {
      if (typeof a !== "object" || a === null) return;
      const desc = trimStr((a as Record<string, unknown>).description);
      if (needsKoreanTranslation(desc)) units.push({ path: "activities", index: idx, text: desc });
    });
  }
  return units;
}

type ResumeKoTranslations = {
  summary?: string;
  selfIntroduction?: string;
  careers?: Array<{ description?: string }>;
  activities?: Array<{ description?: string }>;
};
type ResumeTranslations = { ko?: ResumeKoTranslations };

async function buildKoreanTranslations(
  content: unknown,
  previous: ResumeTranslations | null | undefined
): Promise<ResumeTranslations | null> {
  const units = collectTranslationUnits(content);
  if (units.length === 0) return previous?.ko ? { ko: previous.ko } : null;
  if (!openai) return previous?.ko ? { ko: previous.ko } : null;

  const prevKo = previous?.ko ?? {};
  const prevContent = content as Record<string, unknown>;
  const result: ResumeKoTranslations = {
    summary: prevKo.summary,
    selfIntroduction: prevKo.selfIntroduction,
    careers: Array.isArray(prevContent.careers)
      ? (prevContent.careers as unknown[]).map((_, idx) => ({ description: prevKo.careers?.[idx]?.description }))
      : undefined,
    activities: Array.isArray(prevContent.activities)
      ? (prevContent.activities as unknown[]).map((_, idx) => ({ description: prevKo.activities?.[idx]?.description }))
      : undefined
  };

  const promises = units.map(async (unit) => {
    try {
      const completion = await openai!.chat.completions.create({
        model: TRANSLATION_MODEL,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: unit.text }
        ]
      });
      const raw = completion.choices?.[0]?.message?.content ?? "";
      let parsedJson: { ko?: unknown } = {};
      try {
        parsedJson = JSON.parse(raw);
      } catch {
        /* skip */
      }
      const ko = typeof parsedJson.ko === "string" ? parsedJson.ko.trim() : "";
      return ko ? { unit, ko } : null;
    } catch {
      return null;
    }
  });
  const results = await Promise.all(promises);
  for (const r of results) {
    if (!r) continue;
    const { unit, ko } = r;
    if (unit.path === "summary") result.summary = ko;
    else if (unit.path === "selfIntroduction") result.selfIntroduction = ko;
    else if (unit.path === "careers") {
      if (!result.careers) result.careers = [];
      result.careers[unit.index] = { description: ko };
    } else if (unit.path === "activities") {
      if (!result.activities) result.activities = [];
      result.activities[unit.index] = { description: ko };
    }
  }
  return { ko: result };
}

// 기존 캐시가 이번 번역 단위들을 이미 모두 커버하는지 검사. 모두 커버하면
// 추가 호출 없이 skip — preview 정확도와 비용 캡을 위해.
function isCacheCovering(content: unknown, prev: ResumeTranslations | null | undefined): boolean {
  const units = collectTranslationUnits(content);
  if (units.length === 0) return true;
  const ko = prev?.ko ?? {};
  for (const u of units) {
    if (u.path === "summary") {
      if (!ko.summary) return false;
    } else if (u.path === "selfIntroduction") {
      if (!ko.selfIntroduction) return false;
    } else if (u.path === "careers") {
      if (!ko.careers?.[u.index]?.description) return false;
    } else if (u.path === "activities") {
      if (!ko.activities?.[u.index]?.description) return false;
    }
  }
  return true;
}

// ---- main -------------------------------------------------------------------

function parseLimit(): number {
  const idx = process.argv.indexOf("--limit");
  if (idx < 0) return 0;
  const v = Number(process.argv[idx + 1]);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const limit = parseLimit();
  console.info(`Mode: ${apply ? "APPLY (will translate + save)" : "DRY-RUN (preview only)"}`);
  if (limit > 0) console.info(`Limit: ${limit} rows max`);
  if (apply && !openai) {
    console.error("❌ OPENAI_API_KEY 가 없습니다. apply 모드는 실행 불가.");
    process.exit(1);
  }

  // 전체 row 를 stream 형태로 훑되, 영향 받는 row 만 처리. translations 가 null
  // 또는 부분적으로만 채워진 경우를 모두 잡기 위해 모든 row 대상 — 안 바뀐 건
  // isCacheCovering 으로 skip.
  const rows = await prisma.resume.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, userId: true, title: true, content: true, translations: true, updatedAt: true }
  });
  console.info(`Total resumes: ${rows.length}`);

  const candidates = rows.filter((r) => {
    const prev = (r.translations ?? null) as ResumeTranslations | null;
    return !isCacheCovering(r.content, prev);
  });
  console.info(`Need translation backfill: ${candidates.length}`);

  if (candidates.length === 0) {
    console.info("Nothing to do. Done.");
    return;
  }

  console.info("\n--- First few candidates ---");
  for (const r of candidates.slice(0, Math.min(5, candidates.length))) {
    const units = collectTranslationUnits(r.content).map((u) => u.path).join(", ");
    console.info(`  ${r.id.slice(0, 8)} · ${r.title.slice(0, 40)}  → units: ${units}`);
  }

  if (!apply) {
    console.info("\nDry-run only. Re-run with --apply (and optionally --limit N) to translate + save.");
    return;
  }

  const targets = limit > 0 ? candidates.slice(0, limit) : candidates;
  console.info(`\nApplying to ${targets.length} row(s)...`);

  let ok = 0;
  let skipped = 0;
  let failed = 0;
  for (const r of targets) {
    try {
      const prev = (r.translations ?? null) as ResumeTranslations | null;
      const next = await buildKoreanTranslations(r.content, prev);
      if (!next) {
        skipped += 1;
        continue;
      }
      await prisma.resume.update({
        where: { id: r.id },
        data: { translations: next as unknown as Prisma.InputJsonValue }
      });
      ok += 1;
      if (ok % 10 === 0) console.info(`  ...${ok}/${targets.length}`);
    } catch (e) {
      failed += 1;
      console.error(`  ✖ ${r.id}:`, e instanceof Error ? e.message : e);
    }
  }
  console.info(`\n✅ Done. updated=${ok}, skipped=${skipped}, failed=${failed}`);
}

main()
  .catch((e) => {
    console.error("[backfill-resume-translations] Fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
