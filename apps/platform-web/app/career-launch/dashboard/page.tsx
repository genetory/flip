"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { STUDENT, WEEKS } from "../../../lib/launch/data";
import { Card, Pill, SectionTitle } from "../../../components/launch/ui";
import { EnrollmentGate } from "../../../components/launch/enrollment-gate";
import { FinalFeedbackCard } from "../../../components/launch/final-feedback";
import { ResumeRender } from "../../../components/launch/resume-render";
import { CoverRender } from "../../../components/launch/cover-render";
import { fetchProgress, fetchWeekSchedule, type WeekScheduleEntry } from "../../../lib/launch/progress-client";
import { fetchMySeminars, fetchMyEnrollment, type CohortSeminar } from "../../../lib/launch/enrollment-client";
import { fetchResumeData, hasResumeContent } from "../../../lib/launch/resume-data";
import { fetchCoverData, hasCoverContent } from "../../../lib/launch/cover-data";
import { weekDoneCount, weekUnlocked, type LaunchData } from "../../../lib/launch/step-status";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { AplyFooter } from "../../../components/AplyFooter";
import { Reveal } from "../../../components/site/Reveal";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { useLaunchT } from "../../../lib/launch/i18n";
import { useWeekText, useCompletionCriteria } from "../../../lib/launch/data-i18n";
import { trackCareerFunnel } from "../../../lib/analytics";
import { CareerSurveyCta } from "../../../components/launch/survey-cta";

// 4. 학생 로그인 후 대시보드 — 4주 여정 퍼널 + 진행 + 결과물 + 피드백 개요.
export default function LaunchDashboardPage() {
  const t = useLaunchT();
  const weekText = useWeekText();
  const completionCriteria = useCompletionCriteria();
  const router = useRouter();
  // 주차별 최종 결과물(이 주에 나오는 것).
  const WEEK_DELIVERABLE: Record<number, string> = {
    1: t("취업 진단 · 직무 방향", "Job diagnosis · Career direction", "求职诊断 · 职业方向", "Chẩn đoán việc làm · Định hướng nghề nghiệp", "就職診断・職務の方向性", "Diagnosis kerja · Arah karier"),
    2: t("대표 이력서", "Master resume", "标准简历", "Hồ sơ chính (Resume)", "メイン履歴書", "Resume utama"),
    3: t("자기소개서", "Cover letter", "求职信", "Thư tự giới thiệu (Cover letter)", "自己紹介書（カバーレター）", "Cover letter"),
    4: t("면접 준비", "Interview prep", "面试准备", "Chuẩn bị phỏng vấn", "面接準備", "Persiapan wawancara")
  };
  const { user, isReady, isAuthenticated } = useAuthSession();
  useEffect(() => {
    if (isReady && !isAuthenticated) router.replace("/career-launch");
  }, [isReady, isAuthenticated, router]);
  // 퍼널: Career Launch 진입(대시보드) 1회 계측.
  useEffect(() => {
    if (isReady && isAuthenticated) trackCareerFunnel("career_launch_started");
  }, [isReady, isAuthenticated]);
  // 퍼널: 완주(최종 리포트 열람 + 완료) 1회 계측.
  const reportedRef = useRef(false);

  const [data, setData] = useState<LaunchData>({ progress: {}, resume: {}, cover: {} });
  const [schedule, setSchedule] = useState<WeekScheduleEntry[]>([]);
  const [serverNow, setServerNow] = useState<Date>(() => new Date(0)); // 스케줄 로드 전엔 과거로 둬서 날짜 오픈 미판정
  const [seminars, setSeminars] = useState<CohortSeminar[]>([]);
  const [cohortLabel, setCohortLabel] = useState<string>("");
  // 프로그램 소개는 기본 접힘 — 재방문 시 실제 진행(4주 여정)이 먼저 보이게.
  const [introOpen, setIntroOpen] = useState(false);
  useEffect(() => {
    if (!isReady) return;
    let alive = true;
    void (async () => {
      try {
        const [p, r, c, sched, sems, enr] = await Promise.all([
          fetchProgress(),
          fetchResumeData().catch(() => ({ data: {} })),
          fetchCoverData().catch(() => ({ data: {} })),
          fetchWeekSchedule().catch(() => ({ weekSchedule: [] as WeekScheduleEntry[], serverNow: new Date().toISOString() })),
          fetchMySeminars().catch(() => [] as CohortSeminar[]),
          fetchMyEnrollment().catch(() => null)
        ]);
        if (alive) {
          setData({ progress: p, resume: r.data ?? {}, cover: c.data ?? {} });
          setSchedule(sched.weekSchedule);
          setServerNow(new Date(sched.serverNow));
          setSeminars(sems);
          // 실제 등록 기수명 표시(활성 우선). 목업 기수명 대체.
          const cs = enr?.cohorts ?? [];
          const c0 = cs.find((x) => x.status === "active") ?? cs[0];
          setCohortLabel(c0 ? [c0.university, c0.name].filter(Boolean).join(" · ") : "");
        }
      } catch {
        // 조회 실패 시 빈 상태
      }
    })();
    return () => {
      alive = false;
    };
  }, [isReady]);

  const displayName = user?.name?.trim() || user?.email || STUDENT.name;
  const totalSteps = WEEKS.reduce((n, w) => n + w.steps.length, 0);
  const doneSteps = WEEKS.reduce((n, w) => n + weekDoneCount(w.steps, data), 0);
  const overall = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;

  const resumeReady = hasResumeContent(data.resume);
  const coverReady = hasCoverContent(data.cover);
  // 다음 할 일 — 열려 있고 아직 완료 안 된 첫 주차.
  const nextWeek = WEEKS.find((w) => weekUnlocked(w.week, data, schedule, serverNow) && weekDoneCount(w.steps, data) < w.steps.length) ?? null;
  useEffect(() => {
    if (overall === 100 && !reportedRef.current) {
      reportedRef.current = true;
      trackCareerFunnel("career_report_viewed");
      trackCareerFunnel("career_launch_completed");
    }
  }, [overall]);

  if (!isReady || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="text-[13px] text-[#8B95A1]">{t("불러오는 중...", "Loading...", "加载中...", "Đang tải...", "読み込み中...", "Memuat...")}</span>
      </main>
    );
  }

  return (
    <EnrollmentGate>
    <div className="flex min-h-screen flex-col bg-[#F6F8FB]">
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-10">
          {/* 운영자는 학생 화면을 본인 계정으로 전부 체험할 수 있음 — 콘솔 복귀 링크 */}
          {user?.role === "OPERATOR" ? (
            <Link href="/career-launch/ops/students" className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-[#F0B429]/40 bg-[#FFF9EC] px-3 py-1.5 text-[12.5px] font-bold text-[#B7791F] transition hover:bg-[#FEF3D6]">
              {t("← 운영자 콘솔 · 지금은 학생 화면 체험 중", "← Operator console · Now previewing the student view", "← 运营者控制台 · 当前正在预览学生页面", "← Bảng điều khiển quản trị · Đang xem thử giao diện học viên", "← 運営者コンソール · 現在は学生画面をプレビュー中", "← Konsol operator · Sedang melihat tampilan siswa")}
            </Link>
          ) : null}
          {/* 인사 + 전체 진행률 (완주 시 축하 히어로로 전환) */}
          <Reveal>
          {overall === 100 ? (
            <section className="rounded-3xl bg-[#0B1227] p-7 text-white md:p-8">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#A6EF3F]">{t("🎉 4주 프로그램 완주", "🎉 4-week program complete", "🎉 完成4周项目", "🎉 Hoàn thành chương trình 4 tuần", "🎉 4週間プログラム完走", "🎉 Menyelesaikan program 4 minggu")}</p>
                <span className="inline-flex shrink-0 items-center rounded-full bg-[#A6EF3F]/20 px-2.5 py-1 text-[12px] font-bold text-[#A6EF3F]">{t("수료 완료", "Completed", "已结业", "Đã hoàn thành", "修了", "Selesai")}</span>
              </div>
              <h1 className="mt-3 break-keep text-[24px] font-black leading-[1.3] tracking-[-0.02em] md:text-[28px]">{t(`${displayName}님, 완주를 축하해요! 🎉`, `Congrats on finishing, ${displayName}! 🎉`, `${displayName}，恭喜你顺利完成！🎉`, `Chúc mừng bạn đã hoàn thành, ${displayName}! 🎉`, `${displayName}さん、完走おめでとうございます！🎉`, `Selamat telah menyelesaikan, ${displayName}! 🎉`)}</h1>
              <p className="mt-2.5 max-w-[92%] break-keep text-[14px] leading-relaxed text-white/65">{t("이력서·자기소개서를 완성하고 면접 준비까지 마쳤어요. 이제 자신 있게 지원해봐요!", "You've finished your resume and cover letter, and prepped for interviews. Now apply with confidence!", "你已完成简历和求职信，也做好了面试准备。现在充满信心地去投递吧！", "Bạn đã hoàn thành hồ sơ và thư tự giới thiệu, và chuẩn bị xong cho phỏng vấn. Giờ hãy tự tin ứng tuyển nhé!", "履歴書・自己紹介書を完成させ、面接準備まで終えました。これからは自信を持って応募しましょう！", "Kamu sudah menyelesaikan resume dan cover letter, serta menyiapkan wawancara. Sekarang lamar dengan percaya diri!")}</p>
              <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/10 p-4">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-white/10 text-[22px]">🏁</span>
                <div>
                  <p className="text-[14px] font-black text-white">{t("전체 진행률 100% · 모든 스텝 완료", "Overall progress 100% · All steps complete", "总进度100% · 所有步骤完成", "Tiến độ tổng thể 100% · Hoàn thành mọi bước", "全体進捗100% · すべてのステップ完了", "Progres keseluruhan 100% · Semua langkah selesai")}</p>
                  <p className="mt-0.5 text-[12px] text-white/55">{t(`완료한 스텝 ${doneSteps}/${totalSteps}`, `Steps completed ${doneSteps}/${totalSteps}`, `已完成步骤 ${doneSteps}/${totalSteps}`, `Bước đã hoàn thành ${doneSteps}/${totalSteps}`, `完了したステップ ${doneSteps}/${totalSteps}`, `Langkah selesai ${doneSteps}/${totalSteps}`)}</p>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-3xl bg-[#0B1227] p-7 text-white md:p-8">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#8CA8FF]">{cohortLabel || t("글로벌 커리어 런치", "Global Career Launch", "全球职业启航", "Global Career Launch", "グローバルキャリアローンチ", "Global Career Launch")}</p>
                <span className="inline-flex shrink-0 items-center rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-bold text-white">{t(`${doneSteps}/${totalSteps} 스텝`, `${doneSteps}/${totalSteps} steps`, `${doneSteps}/${totalSteps} 步骤`, `${doneSteps}/${totalSteps} bước`, `${doneSteps}/${totalSteps} ステップ`, `${doneSteps}/${totalSteps} langkah`)}</span>
              </div>
              <h1 className="mt-3 break-keep text-[24px] font-black leading-[1.3] tracking-[-0.02em] md:text-[28px]">{t(`${displayName}님, 반가워요 👋`, `Welcome, ${displayName} 👋`, `${displayName}，欢迎你 👋`, `Chào mừng bạn, ${displayName} 👋`, `${displayName}さん、ようこそ 👋`, `Selamat datang, ${displayName} 👋`)}</h1>
              <p className="mt-2.5 max-w-[92%] break-keep text-[14px] leading-relaxed text-white/65">{t("4주 동안 이력서·자기소개서를 완성하고 면접까지 준비해요.", "Over 4 weeks, you'll complete your resume and cover letter, and prepare for interviews.", "在4周内完成简历和求职信，并准备好面试。", "Trong 4 tuần, bạn sẽ hoàn thành hồ sơ và thư tự giới thiệu, và chuẩn bị cho phỏng vấn.", "4週間で履歴書・自己紹介書を完成させ、面接まで準備します。", "Selama 4 minggu, kamu akan menyelesaikan resume dan cover letter, serta menyiapkan wawancara.")}</p>
              <div className="mt-6">
                <div className="mb-2 flex items-end justify-between">
                  <p className="text-[12.5px] font-bold text-white/70">{t("전체 진행률", "Overall progress", "总进度", "Tiến độ tổng thể", "全体進捗", "Progres keseluruhan")}</p>
                  <span className="text-[26px] font-black leading-none text-white md:text-[30px]">{overall}<span className="text-[15px] text-white/55">%</span></span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-[#5B86F5] transition-[width] duration-500" style={{ width: `${overall}%` }} />
                </div>
                <p className="mt-2 text-[12px] text-white/50">{t(`완료한 스텝 ${doneSteps}/${totalSteps}`, `Steps completed ${doneSteps}/${totalSteps}`, `已完成步骤 ${doneSteps}/${totalSteps}`, `Bước đã hoàn thành ${doneSteps}/${totalSteps}`, `完了したステップ ${doneSteps}/${totalSteps}`, `Langkah selesai ${doneSteps}/${totalSteps}`)}</p>
              </div>
            </section>
          )}
          </Reveal>

          {/* 다음 할 일 — 열려 있고 미완료인 첫 주차로 바로 이동 */}
          {overall < 100 && nextWeek ? (
            <Reveal delayMs={80}>
            <Link
              href={`/career-launch/week/${nextWeek.week}`}
              className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#0B46E8]/20 bg-[#EDF1FD] px-5 py-4 transition hover:bg-[#E3EAFD]"
            >
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-[#0B46E8]">{t("다음 할 일", "Your next step", "下一步", "Việc tiếp theo", "次にやること", "Langkah berikutnya")}</p>
                <p className="mt-0.5 truncate text-[15px] font-black text-[#0B1227]">
                  Week {nextWeek.week} · {WEEK_DELIVERABLE[nextWeek.week]}
                </p>
              </div>
              <span className="shrink-0 rounded-xl bg-[#0B46E8] px-4 py-2 text-[13.5px] font-bold text-white">
                {t("이어서 하기", "Continue", "继续", "Tiếp tục", "続ける", "Lanjut")} →
              </span>
            </Link>
            </Reveal>
          ) : null}

          {/* 베타 설문 CTA — 1·2주차 완료 / 전체 완료 시점에 자동 노출(링크는 env 주입) */}
          <CareerSurveyCta data={data} />

          {/* 완주 시 — 이력서·자소서·면접 종합 최종 피드백(프로그램 소개처럼 섹션) */}
          {overall === 100 ? (
            <div className="mt-7">
              <SectionTitle sub={t("이력서·자기소개서·면접을 종합한 코치 피드백", "Coach feedback across your resume, cover letter, and interview", "综合简历、求职信与面试的教练反馈", "Phản hồi từ coach tổng hợp hồ sơ, thư tự giới thiệu và phỏng vấn", "履歴書・自己紹介書・面接を総合したコーチのフィードバック", "Umpan balik coach dari resume, cover letter, dan wawancara")}>{t("최종 피드백", "Final feedback", "最终反馈", "Phản hồi cuối cùng", "最終フィードバック", "Umpan balik akhir")}</SectionTitle>
              <FinalFeedbackCard />

              {/* 다음 행동 — 분석으로 끝내지 말고 실제 지원 행동으로 연결 */}
              <div className="mt-6">
                <SectionTitle sub={t("결과물을 실제 지원으로 이어가요", "Turn your results into real applications", "把成果转化为实际投递", "Biến kết quả thành ứng tuyển thực tế", "成果を実際の応募につなげましょう", "Ubah hasil menjadi lamaran nyata")}>{t("다음 행동", "Next actions", "下一步行动", "Hành động tiếp theo", "次のアクション", "Aksi berikutnya")}</SectionTitle>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {[
                    { href: "/positions", emoji: "🔎", label: t("지금 지원할 공고 보기", "Browse jobs to apply", "查看可投递的职位", "Xem vị trí để ứng tuyển", "今すぐ応募できる求人を見る", "Lihat lowongan untuk dilamar"), action: "browse_positions", external: false },
                    { href: "/resume-maker", emoji: "📄", label: t("이력서 최종 수정하기", "Polish your resume", "最终修改简历", "Hoàn thiện hồ sơ", "履歴書を仕上げる", "Sempurnakan resume"), action: "edit_resume", external: true },
                    { href: "/career-launch/interview", emoji: "🎤", label: t("모의면접 한 번 더", "One more mock interview", "再来一次模拟面试", "Phỏng vấn thử lần nữa", "模擬面接をもう一度", "Wawancara simulasi lagi"), action: "mock_interview", external: false }
                  ].map((a) => (
                    <Link
                      key={a.action}
                      href={a.href}
                      target={a.external ? "_blank" : undefined}
                      rel={a.external ? "noopener noreferrer" : undefined}
                      onClick={() => trackCareerFunnel("next_action_clicked", { action: a.action })}
                      className="flex items-center gap-3 rounded-2xl border border-[#E5E8EB] bg-white px-4 py-4 transition hover:border-[#0B46E8]/40 hover:bg-[#F7F9FF]"
                    >
                      <span className="text-[22px]">{a.emoji}</span>
                      <span className="text-[14px] font-bold text-[#0B1227]">{a.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <Reveal delayMs={120}>
          <div className="mt-7 grid gap-7 md:mt-9 lg:grid-cols-[1.55fr_1fr] lg:gap-8">
            {/* ── 메인: 4주 여정(액션 우선) + 프로그램 소개(접기) ── */}
            <div className="flex min-w-0 flex-col gap-7 md:gap-8">
              {/* 프로그램 소개 — order-last 로 4주 여정 뒤에, 기본 접힘 */}
              <div className="order-last">
                <button type="button" onClick={() => setIntroOpen((v) => !v)} className="mb-3 flex w-full items-center justify-between gap-2 text-left">
                  <span className="flex items-center gap-2">
                    <span className="h-[15px] w-[3px] flex-none rounded-full bg-[#0B46E8]" />
                    <span className="text-[17px] font-extrabold tracking-[-0.01em] text-[#0B1227] md:text-[18.5px]">{t("프로그램 소개", "About the program", "项目介绍", "Giới thiệu chương trình", "プログラム紹介", "Tentang program")}</span>
                  </span>
                  <span className="text-[12.5px] font-bold text-[#8B95A1]">{introOpen ? t("접기 ▴", "Hide ▴", "收起 ▴", "Thu gọn ▴", "閉じる ▴", "Tutup ▴") : t("자세히 ▾", "Details ▾", "详情 ▾", "Chi tiết ▾", "詳細 ▾", "Detail ▾")}</span>
                </button>
                {introOpen ? (
                <Card className="md:!p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img_global_career_launch.webp" alt="Global Career Launch" className="mb-4 h-auto w-full rounded-xl" />
                  <p className="text-[15px] font-black text-[#0B1227] md:text-[16px]">{t("AI 코치와 함께하는 4주 취업 완성 부트캠프", "A 4-week job-prep bootcamp with your AI coach", "与AI教练一起完成的4周求职训练营", "Bootcamp chuẩn bị việc làm 4 tuần cùng AI coach", "AIコーチと一緒に取り組む4週間就職完成ブートキャンプ", "Bootcamp persiapan kerja 4 minggu bersama AI coach")}</p>
                  <p className="mt-1.5 break-keep text-[13.5px] leading-relaxed text-[#4E5968]">
                    {t("한국 취업을 준비하는 외국인 유학생을 위한 프로그램이에요. 혼자서는 막막한 취업 준비를 AI 코치가 옆에서 이끌어줘요. 취업 준비 상태 진단부터 직무 방향 설정, 대화만으로 완성하는 이력서·자기소개서, 그리고 유형별 모의면접까지 — 4주 동안 하나씩 밟아가며 완주해요.", "This program is for international students preparing to work in Korea. Job prep can feel overwhelming on your own, so an AI coach guides you every step of the way. From diagnosing where you stand and setting your career direction, to building your resume and cover letter just by chatting, to mock interviews by type — you'll complete it step by step over 4 weeks.", "这是为准备在韩国就业的外国留学生打造的项目。独自准备求职难免感到迷茫，AI教练会一路陪伴引导你。从诊断你的求职准备状态、确定职业方向，到只需对话就能完成的简历与求职信，再到分类型的模拟面试——4周内一步步完成。", "Đây là chương trình dành cho du học sinh nước ngoài chuẩn bị làm việc tại Hàn Quốc. Chuẩn bị việc làm một mình có thể rất mông lung, nên AI coach sẽ đồng hành và dẫn dắt bạn từng bước. Từ chẩn đoán tình trạng chuẩn bị, định hướng nghề nghiệp, hoàn thành hồ sơ và thư tự giới thiệu chỉ bằng trò chuyện, đến phỏng vấn thử theo từng loại — bạn sẽ hoàn thành từng bước trong 4 tuần.", "韓国での就職を目指す外国人留学生のためのプログラムです。一人では途方に暮れがちな就職準備を、AIコーチが隣で導いてくれます。就職準備状況の診断から職務の方向性設定、会話だけで完成する履歴書・自己紹介書、そしてタイプ別の模擬面接まで — 4週間で一つずつ進めて完走します。", "Program ini untuk mahasiswa asing yang bersiap bekerja di Korea. Persiapan kerja bisa terasa membingungkan jika sendirian, jadi AI coach akan membimbingmu di setiap langkah. Mulai dari diagnosis kesiapan, menentukan arah karier, menyusun resume dan cover letter hanya lewat percakapan, hingga simulasi wawancara per jenis — kamu akan menyelesaikannya langkah demi langkah selama 4 minggu.")}
                  </p>
                  <div className="mt-3.5 flex flex-wrap gap-2">
                    {[
                      { e: "💬", t: t("대화로 만드는 이력서·자기소개서", "Resume & cover letter built through conversation", "对话即可完成简历与求职信", "Hồ sơ & thư tự giới thiệu tạo qua trò chuyện", "会話で作る履歴書・自己紹介書", "Resume & cover letter dari percakapan") },
                      { e: "🎓", t: t("주간 세미나", "Weekly seminar", "每周研讨会", "Hội thảo hằng tuần", "週間セミナー", "Seminar mingguan") },
                      { e: "✍️", t: t("코치 1:1 피드백", "1:1 coach feedback", "教练一对一反馈", "Phản hồi 1:1 từ coach", "コーチ1:1フィードバック", "Umpan balik coach 1:1") }
                    ].map((f) => (
                      <span key={f.t} className="inline-flex items-center gap-1.5 rounded-full bg-[#F2F4F6] px-3 py-1.5 text-[12px] font-semibold text-[#4E5968]">
                        <span>{f.e}</span>
                        {f.t}
                      </span>
                    ))}
                  </div>

                  {/* 4주 후 얻는 것 */}
                  <div className="mt-5 border-t border-[#EEF1F5] pt-5">
                    <p className="text-[12.5px] font-bold text-[#0B46E8]">{t("🎯 4주 후, 이런 걸 완성해요", "🎯 After 4 weeks, here's what you'll have", "🎯 4周后，你将完成这些", "🎯 Sau 4 tuần, đây là những gì bạn có", "🎯 4週間後、こんなものが完成します", "🎯 Setelah 4 minggu, inilah yang kamu miliki")}</p>
                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      {[
                        { e: "🧭", t: t("취업 준비도 진단 · 직무 방향", "Job-readiness diagnosis · Career direction", "求职准备度诊断 · 职业方向", "Chẩn đoán mức độ sẵn sàng · Định hướng nghề nghiệp", "就職準備度診断・職務の方向性", "Diagnosis kesiapan kerja · Arah karier") },
                        { e: "📄", t: t("기업에 낼 대표 이력서", "A master resume to send to companies", "可投递企业的标准简历", "Hồ sơ chính để gửi cho công ty", "企業に提出するメイン履歴書", "Resume utama untuk dikirim ke perusahaan") },
                        { e: "📝", t: t("회사 맞춤 자기소개서", "A cover letter tailored to each company", "针对公司量身定制的求职信", "Thư tự giới thiệu phù hợp từng công ty", "会社に合わせた自己紹介書", "Cover letter yang disesuaikan tiap perusahaan") },
                        { e: "🎤", t: t("유형별 모의면접 · 실전 준비", "Mock interviews by type · Real-world prep", "分类型模拟面试 · 实战准备", "Phỏng vấn thử theo loại · Chuẩn bị thực chiến", "タイプ別模擬面接・実践準備", "Simulasi wawancara per jenis · Persiapan nyata") }
                      ].map((o) => (
                        <div key={o.t} className="flex items-center gap-2 rounded-xl bg-[#F8FAFC] px-3 py-2.5">
                          <span className="text-[16px]">{o.e}</span>
                          <span className="break-keep text-[12.5px] font-semibold text-[#333D4B]">{o.t}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 수료 조건 */}
                  <div className="mt-5 border-t border-[#EEF1F5] pt-5">
                    <p className="text-[12.5px] font-bold text-[#3A6B00]">{t("✅ 수료 조건", "✅ Completion requirements", "✅ 结业条件", "✅ Điều kiện hoàn thành", "✅ 修了条件", "✅ Syarat kelulusan")}</p>
                    <ul className="mt-2 space-y-1.5 text-[13px] text-[#333D4B]">
                      {completionCriteria().map((c, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[#B7FF5A] text-[10px] font-black text-[#111]">{i + 1}</span>
                          <span className="break-keep">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
                ) : null}
              </div>

              <div>
                <SectionTitle sub={t("각 주차를 눌러 진행하세요 · 완료할수록 결과물이 완성돼요", "Tap each week to get started · Your deliverables come together as you finish", "点击每一周开始 · 完成越多，成果越完整", "Nhấn vào từng tuần để bắt đầu · Hoàn thành càng nhiều, kết quả càng đầy đủ", "各週をタップして進めましょう · 完了するほど成果物が仕上がります", "Ketuk tiap minggu untuk mulai · Semakin selesai, hasilnya makin lengkap")}>{t("4주 여정", "4-week journey", "4周旅程", "Hành trình 4 tuần", "4週間のジャーニー", "Perjalanan 4 minggu")}</SectionTitle>
                <ol className="space-y-3">
                  {WEEKS.map((w) => {
                    const done = weekDoneCount(w.steps, data);
                    const total = w.steps.length;
                    const unlocked = weekUnlocked(w.week, data, schedule, serverNow);
                    const status = !unlocked
                      ? t("잠김", "Locked", "已锁定", "Đã khóa", "ロック中", "Terkunci")
                      : done === total
                      ? t("완료", "Done", "已完成", "Hoàn thành", "完了", "Selesai")
                      : done > 0
                      ? t("진행 중", "In progress", "进行中", "Đang tiến hành", "進行中", "Sedang berjalan")
                      : t("시작 전", "Not started", "未开始", "Chưa bắt đầu", "未開始", "Belum mulai");
                    const tone = !unlocked ? "grey" : done === total ? "green" : done > 0 ? "blue" : "grey";
                    const card = (
                      <Card className={`!p-4 md:!p-5 ${unlocked ? "transition hover:border-[#0B46E8]/40" : "opacity-60"}`}>
                        <div className="flex items-start gap-3.5">
                          <span
                            className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-[12.5px] font-black leading-none ${
                              !unlocked ? "bg-[#F2F4F6] text-[#B0B8C1]" : done === total ? "bg-emerald-500 text-white" : done > 0 ? "bg-[#0B46E8] text-white" : "border-2 border-[#D7DCE3] bg-white text-[#8B95A1]"
                            }`}
                          >
                            {unlocked ? `W${w.week}` : "🔒"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                              <p className={`text-[15.5px] font-black tracking-[-0.01em] md:text-[16.5px] ${unlocked ? "text-[#191F28]" : "text-[#8B95A1]"}`}>{weekText(w.week, "title")}</p>
                              <Pill tone={tone}>{status}</Pill>
                            </div>
                            <p className="mt-0.5 text-[12.5px] text-[#8B95A1]">{weekText(w.week, "subtitle")}</p>
                            {unlocked ? (
                              <div className="mt-2 flex items-center gap-2">
                                <span className="rounded-full bg-[#EDF1FD] px-2 py-0.5 text-[11px] font-bold text-[#0B46E8]">📦 {WEEK_DELIVERABLE[w.week]}</span>
                                <span className="text-[11.5px] font-semibold text-[#8B95A1]">{t(`스텝 ${done}/${total}`, `Steps ${done}/${total}`, `步骤 ${done}/${total}`, `Bước ${done}/${total}`, `ステップ ${done}/${total}`, `Langkah ${done}/${total}`)}</span>
                              </div>
                            ) : (
                              <p className="mt-2 text-[11.5px] font-medium text-[#B0B8C1]">{t(`🔒 Week ${w.week - 1}를 완료하면 열려요`, `🔒 Unlocks after you finish Week ${w.week - 1}`, `🔒 完成第${w.week - 1}周后解锁`, `🔒 Mở khóa sau khi hoàn thành Tuần ${w.week - 1}`, `🔒 Week ${w.week - 1}を完了すると開きます`, `🔒 Terbuka setelah menyelesaikan Minggu ${w.week - 1}`)}</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                    return <li key={w.week}>{unlocked ? <Link href={`/career-launch/week/${w.week}`} className="block">{card}</Link> : card}</li>;
                  })}
                </ol>
              </div>
            </div>

            {/* ── 사이드바 ── */}
            <div className="min-w-0 space-y-7 md:space-y-8">
              {/* 다가오는 세미나 */}
              <div>
                <SectionTitle>{t("세미나 일정", "Seminar schedule", "研讨会日程", "Lịch hội thảo", "セミナー日程", "Jadwal seminar")}</SectionTitle>
                {seminars.length === 0 ? (
                  <Card className="!p-5 text-center">
                    <p className="text-[13px] text-[#8B95A1]">{t("아직 등록된 세미나가 없어요.", "No seminars scheduled yet.", "还没有安排研讨会。", "Chưa có hội thảo nào.", "まだ登録されたセミナーはありません。", "Belum ada seminar terjadwal.")}</p>
                    <p className="mt-1 text-[12px] text-[#B0B8C1]">{t("일정이 정해지면 여기에 표시돼요.", "It'll appear here once scheduled.", "安排后将在此显示。", "Sẽ hiển thị ở đây khi có lịch.", "日程が決まるとここに表示されます。", "Akan tampil di sini setelah dijadwalkan.")}</p>
                  </Card>
                ) : (
                  <div className="space-y-2.5">
                    {[...seminars].sort((a, b) => a.week - b.week).map((s) => {
                      const dt = new Date(s.startsAt);
                      const valid = !Number.isNaN(dt.getTime());
                      const date = valid ? dt.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", timeZone: "Asia/Seoul" }) : "";
                      const time = valid ? dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" }) : "";
                      return (
                        <Card key={s.week} className="flex items-start gap-3 !p-4">
                          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#EDF1FD] text-[18px]">{s.online ? "💻" : "📍"}</span>
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-bold text-[#191F28]">{s.title || t(`Week ${s.week} 세미나`, `Week ${s.week} seminar`, `第${s.week}周研讨会`, `Hội thảo Tuần ${s.week}`, `Week ${s.week} セミナー`, `Seminar Minggu ${s.week}`)}</p>
                            <p className="mt-0.5 text-[12.5px] text-[#4E5968]">{[date, time].filter(Boolean).join(" · ")}</p>
                            {s.location ? <p className="text-[12px] text-[#8B95A1]">{s.location}</p> : null}
                            {s.online && s.url ? (
                              <a href={s.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[12px] font-semibold text-[#0B46E8] underline">
                                {t("접속 링크 열기", "Open join link", "打开链接", "Mở liên kết tham gia", "参加リンクを開く", "Buka tautan")}
                              </a>
                            ) : null}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 내 결과물 — 이력서·자기소개서 미리보기(없으면 점선 placeholder) */}
              <div className="space-y-4">
                <SectionTitle sub={t("대화로 만드는 이력서와 자기소개서", "A resume and cover letter built through conversation", "对话即可完成的简历与求职信", "Hồ sơ và thư tự giới thiệu tạo qua trò chuyện", "会話で作る履歴書と自己紹介書", "Resume dan cover letter dari percakapan")}>{t("내 결과물", "My deliverables", "我的成果", "Kết quả của tôi", "私の成果物", "Hasil saya")}</SectionTitle>
                <DocPreview title={t("내 이력서", "My resume", "我的简历", "Hồ sơ của tôi", "私の履歴書", "Resume saya")} ready={resumeReady} previewHref="/career-launch/resume-preview" emptyTitle={t("아직 이력서가 없어요", "You don't have a resume yet", "还没有简历", "Bạn chưa có hồ sơ", "まだ履歴書がありません", "Belum ada resume")} emptySub={t("2주차에 대화로 만들어요", "You'll build it through conversation in Week 2", "第2周通过对话完成", "Bạn sẽ tạo qua trò chuyện ở Tuần 2", "Week 2に会話で作ります", "Kamu membuatnya lewat percakapan di Minggu 2")}>
                  {resumeReady ? <ResumeRender data={data.resume} /> : null}
                </DocPreview>
                <DocPreview title={t("내 자기소개서", "My cover letter", "我的求职信", "Thư tự giới thiệu của tôi", "私の自己紹介書", "Cover letter saya")} ready={coverReady} previewHref="/career-launch/cover-preview" emptyTitle={t("아직 자기소개서가 없어요", "You don't have a cover letter yet", "还没有求职信", "Bạn chưa có thư tự giới thiệu", "まだ自己紹介書がありません", "Belum ada cover letter")} emptySub={t("3주차에 대화로 만들어요", "You'll build it through conversation in Week 3", "第3周通过对话完成", "Bạn sẽ tạo qua trò chuyện ở Tuần 3", "Week 3に会話で作ります", "Kamu membuatnya lewat percakapan di Minggu 3")}>
                  {coverReady ? <CoverRender data={data.cover} /> : null}
                </DocPreview>
              </div>
            </div>
          </div>
          </Reveal>
        </div>
      </main>
      <AplyFooter />
    </div>
    </EnrollmentGate>
  );
}

// 결과물 미리보기 — 있으면 실제 문서 렌더 + 크게보기, 없으면 점선 placeholder(안내만, 버튼 없음).
function DocPreview({
  title,
  ready,
  previewHref,
  emptyTitle,
  emptySub,
  children
}: {
  title: string;
  ready: boolean;
  previewHref: string;
  emptyTitle: string;
  emptySub: string;
  children?: React.ReactNode;
}) {
  const t = useLaunchT();
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[13.5px] font-bold text-[#191F28]">{title}</p>
        {ready ? (
          <Link href={previewHref} target="_blank" rel="noopener noreferrer" className="text-[12px] font-bold text-[#0B46E8] transition hover:underline">
            {t("열기 · PDF ↗", "Open · PDF ↗", "打开 · PDF ↗", "Mở · PDF ↗", "開く · PDF ↗", "Buka · PDF ↗")}
          </Link>
        ) : null}
      </div>
      {ready ? (
        children
      ) : (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D7DCE3] bg-[#FAFBFC] p-6 text-center">
          <span className="text-[22px] opacity-40">📄</span>
          <p className="mt-2 text-[13px] font-semibold text-[#8B95A1]">{emptyTitle}</p>
          <p className="mt-0.5 text-[12px] text-[#B0B8C1]">{emptySub}</p>
        </div>
      )}
    </div>
  );
}
