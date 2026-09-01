// Career Profile 로컬 통합 테스트 — 실제 DB + 실제 학생 데이터로 병합/저장/이력을 검증한다.
// 안전: 프로필이 없는 학생 1명에게 최초 접근과 동일한 병합을 적용→검증→정리(생성한 행만 삭제).
// 실행: set -a; . ./.env; set +a; npx tsx apps/api/scripts/itest-career-profile-db.ts
import { PrismaClient } from "@prisma/client";
import {
  buildInitialCareerProfile,
  applyProfileUpdate,
  normalizeProfile,
  careerProfileAsksNeeded,
  buildCareerProfileContext,
  redactProfileForLog,
  PROFILE_AREA_KEYS,
  type ResumeContentInput,
  type CoverContentInput,
  type ProgressInput
} from "../src/career-profile";

const prisma = new PrismaClient();
const NOW = new Date().toISOString();
const log = (...a: unknown[]) => console.log(...a);

async function main() {
  // 프로필이 아직 없는 career-launch 학생(이력서 데이터 보유) 1명 선정.
  const resumeRows = await prisma.careerResumeData.findMany({ orderBy: { updatedAt: "desc" }, take: 30 });
  let target: string | null = null;
  for (const r of resumeRows) {
    const exists = await prisma.careerProfile.findUnique({ where: { studentUserId: r.studentUserId }, select: { id: true } });
    if (!exists) {
      target = r.studentUserId;
      break;
    }
  }
  if (!target) {
    log("⚠️  프로필 없는(이력서 보유) 학생을 못 찾음 → 합성 데이터로만 스모크.");
    const p = buildInitialCareerProfile(
      { resume: { basic: { name: "테스트" }, skills: ["X"] }, progress: { selectedJobs: ["PM"] } },
      NOW
    );
    log("  합성 병합 areas:", Object.keys(p.areas).length);
    return;
  }
  log(`대상 학생(익명 처리): ...${target.slice(-6)}`);

  let createdProfile = false;
  try {
    // 1) 실제 소스 로드 → 초기 병합(getOrCreateCareerProfile 로직 재현).
    const [resumeRow, coverRow, progRow] = await Promise.all([
      prisma.careerResumeData.findUnique({ where: { studentUserId: target } }),
      prisma.careerCoverLetterData.findUnique({ where: { studentUserId: target } }),
      prisma.careerLaunchProgress.findUnique({ where: { studentUserId: target } })
    ]);
    const resume = (resumeRow?.content ?? {}) as ResumeContentInput;
    const cover = (coverRow?.content ?? {}) as CoverContentInput;
    const state = (progRow?.state ?? {}) as Record<string, unknown>;
    const progress: ProgressInput = {
      diagnosis: state.diagnosis as ProgressInput["diagnosis"],
      selectedJobs: state.selectedJobs as string[],
      materials: state.materials as string[],
      experienceBank: state.experienceBank as Array<Record<string, unknown>>
    };
    const data = buildInitialCareerProfile({ resume, cover, progress }, NOW);

    // 2) DB 저장(CareerProfile + init 이벤트).
    const created = await prisma.careerProfile.create({ data: { studentUserId: target, data: data as object, revision: 1, mergedAt: new Date() } });
    createdProfile = true;
    await prisma.careerProfileEvent.create({ data: { studentUserId: target, area: "*", action: "init_merge", source: "resume+cover+progress", after: redactProfileForLog(data) as object } });
    log(`  ✓ CareerProfile 생성(revision=${created.revision})`);

    // 3) 읽어와 정규화 + 병합 결과 확인(로그엔 값 대신 상태 요약만).
    const back = await prisma.careerProfile.findUnique({ where: { studentUserId: target } });
    const norm = normalizeProfile(back!.data, NOW);
    const summary = redactProfileForLog(norm);
    log("  ✓ 저장→조회→정규화 OK. 영역 상태 요약:", JSON.stringify(summary.areas).slice(0, 400));

    // 4) dedup: confirmed 영역은 질문 후보에서 빠지는지.
    const asks = careerProfileAsksNeeded(norm, PROFILE_AREA_KEYS);
    log(`  ✓ dedup: confirmed=${asks.confirmedAreas.length}개, ask(질문필요)=${asks.ask.length}개`);
    if (asks.confirmedAreas.length > 0) {
      const overlap = asks.ask.filter((a) => asks.confirmedAreas.includes(a));
      if (overlap.length) throw new Error("confirmed 영역이 ask 에 중복됨: " + overlap.join(","));
      log("    → confirmed 영역이 질문 후보에 없음(재질문 방지 OK)");
    }

    // 5) 업데이트 적용 + 이벤트 기록(사용자 확인).
    const upd = applyProfileUpdate(norm, { area: "targetRole", value: "__ITEST__", intent: "user", source: "user" }, NOW);
    await prisma.careerProfile.update({ where: { studentUserId: target }, data: { data: upd.data as object, revision: created.revision + 1 } });
    await prisma.careerProfileEvent.create({ data: { studentUserId: target, area: upd.event.area, action: upd.event.action, status: upd.event.status ?? null, source: "user", after: upd.event.after as object } });
    const events = await prisma.careerProfileEvent.count({ where: { studentUserId: target } });
    log(`  ✓ 업데이트 적용(action=${upd.event.action}) + 이력 ${events}건`);

    // 6) 컨텍스트 빌더(토큰 절약 요약) 동작 확인.
    const ctx = buildCareerProfileContext(upd.data, { maxChars: 800 });
    log(`  ✓ 컨텍스트 빌더 출력 ${ctx.length}자 (섹션: ${["확정","추론","없는","거부"].filter((s) => ctx.includes(s)).join("/") || "없음"})`);

    log("\n✅ 통합 테스트 통과");
  } finally {
    // 정리: 이 테스트가 생성한 행만 삭제(원래 없던 프로필).
    if (createdProfile) {
      await prisma.careerProfileEvent.deleteMany({ where: { studentUserId: target! } });
      await prisma.careerProfile.delete({ where: { studentUserId: target! } }).catch(() => null);
      log("  ✓ 테스트 데이터 정리 완료(DB 원상복구)");
    }
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error("통합 테스트 실패:", e instanceof Error ? e.message : e);
  await prisma.$disconnect();
  process.exit(1);
});
