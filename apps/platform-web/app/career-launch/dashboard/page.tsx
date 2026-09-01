"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, CaretRight, ArrowRight, Monitor, MapPin, CircleNotch, ChatCircleText, GraduationCap, PenNib } from "@phosphor-icons/react";
import { STUDENT, WEEKS } from "../../../lib/launch/data";
import { Card, SectionTitle } from "../../../components/launch/ui";
import { EnrollmentGate } from "../../../components/launch/enrollment-gate";
import { CareerSnapshot } from "../../../components/launch/CareerSnapshot";
import { TalentPassportCard } from "../../../components/launch/TalentPassportCard";
import { MyTimelineCard } from "../../../components/launch/MyTimelineCard";
import { fetchProgress, fetchWeekSchedule, type WeekScheduleEntry } from "../../../lib/launch/progress-client";
import { fetchMySeminars, type CohortSeminar } from "../../../lib/launch/enrollment-client";
import { fetchResumeData, hasResumeContent } from "../../../lib/launch/resume-data";
import { fetchCoverData, hasCoverContent } from "../../../lib/launch/cover-data";
import { weekDoneCount, weekUnlocked, isWeekComplete, type LaunchData } from "../../../lib/launch/step-status";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { LaunchAmbientBackground } from "../../../components/launch/LaunchAmbientBackground";
import { CohortPulseCard } from "../../../components/launch/CohortPulseCard";
import { LeagueCard } from "../../../components/launch/LeagueCard";
import { PilotFeedbackWidget } from "../../../components/launch/PilotFeedbackWidget";
import { fetchDashboard, type DashboardVM } from "../../../lib/launch/dashboard-client";
import { logActivity } from "../../../lib/launch/pilot-client";
import { CoachTodayCard, CurrentWeekCard, NextActionCard, FourWeekJourney, ArtifactStatusCard, GrowthSummaryCard, CohortActivityCard, SeminarCard } from "../../../components/launch/dashboard-cards";
import { DashboardSection, ErrorState, ResumeState, CardSkeleton } from "../../../components/launch/dashboard-states";
import { AplyFooter } from "../../../components/AplyFooter";
import { Reveal } from "../../../components/site/Reveal";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { useLaunchT } from "../../../lib/launch/i18n";
import { useLanguage } from "../../../components/i18n/LanguageProvider";
import { useWeekText, useCompletionCriteria } from "../../../lib/launch/data-i18n";
import { trackCareerFunnel } from "../../../lib/analytics";
import { addLaunchNotification, ensureLaunchNotificationsOwner } from "../../../lib/launch/notifications";

// 베타 설문 링크(env 주입) — 설문 CTA 카드 대신 알림으로 발송.
const SURVEY_MID_URL = process.env.NEXT_PUBLIC_CAREER_SURVEY_MID_URL?.trim() || "";
const SURVEY_FINAL_URL = process.env.NEXT_PUBLIC_CAREER_SURVEY_FINAL_URL?.trim() || "";

// 4. 학생 로그인 후 대시보드 — 4주 여정 퍼널 + 진행 + 결과물 + 피드백 개요.
export default function LaunchDashboardPage() {
  const t = useLaunchT();
  const { locale } = useLanguage();
  const weekText = useWeekText();
  const completionCriteria = useCompletionCriteria();
  const router = useRouter();
  // 주차별 최종 결과물(이 주에 나오는 것).
  const WEEK_DELIVERABLE: Record<number, string> = {
    1: t("강점 · 목표 직무", "Strengths · Target roles", "优势 · 目标职务", "Điểm mạnh · Công việc mục tiêu", "強み・目標職種", "Kelebihan · Peran target"),
    2: t("이력서 · 자기소개서", "Resume · Cover letter", "简历 · 自我介绍书", "CV · Thư giới thiệu", "履歴書・自己紹介書", "Resume · Surat lamaran"),
    3: t("모의면접 · 약점 리포트", "Mock interview · Weakness report", "模拟面试 · 弱点报告", "Phỏng vấn thử · Báo cáo điểm yếu", "模擬面接・弱点レポート", "Wawancara simulasi · Laporan kelemahan"),
    4: t("오답노트 · 최종 검증", "Review notes · Final check", "错题本 · 最终验证", "Sổ sửa lỗi · Kiểm tra cuối", "復習ノート・最終検証", "Catatan koreksi · Verifikasi akhir")
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
  // UX Phase 2 — 대시보드 view model(서버 조합, 결정적). 보조 실패해도 레거시 데이터는 유지.
  const [vm, setVm] = useState<DashboardVM | null>(null);
  const [vmPhase, setVmPhase] = useState<"loading" | "ready" | "error">("loading");
  const loadVm = () => {
    setVmPhase("loading");
    void fetchDashboard(locale)
      .then((d) => {
        setVm(d);
        setVmPhase("ready");
        void logActivity("dashboard_view", { week: d.currentWeek }); // 순수 뷰 이벤트 자체 DB 적재(#3, fire-and-forget)
        trackCareerFunnel("career_dashboard_viewed", { currentWeek: d.currentWeek, enrollmentStatus: d.enrollmentStatus, cohortId: d.cohort?.id });
        trackCareerFunnel("career_primary_action_viewed", { actionType: d.nextAction.actionType, currentWeek: d.currentWeek });
      })
      .catch(() => setVmPhase("error"));
  };
  useEffect(() => {
    // locale 변경 시에도 재조회 → 코치/다음행동 문자열이 새 언어로 갱신(KI-10).
    if (isReady && isAuthenticated) loadVm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isAuthenticated, locale]);
  useEffect(() => {
    if (!isReady) return;
    let alive = true;
    void (async () => {
      try {
        // Phase 15 — 대시보드 진입 요청 축소: cohortLabel(미사용)용 fetchMyEnrollment 제거.
        const [p, r, c, sched, sems] = await Promise.all([
          fetchProgress(),
          fetchResumeData().catch(() => ({ data: {} })),
          fetchCoverData().catch(() => ({ data: {} })),
          fetchWeekSchedule().catch(() => ({ weekSchedule: [] as WeekScheduleEntry[], serverNow: new Date().toISOString() })),
          fetchMySeminars().catch(() => [] as CohortSeminar[])
        ]);
        if (alive) {
          setData({ progress: p, resume: r.data ?? {}, cover: c.data ?? {} });
          setSchedule(sched.weekSchedule);
          setServerNow(new Date(sched.serverNow));
          setSeminars(sems);
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
  // 새 산출물 준비 상태(진행 상태에서 바로 읽음) — 결과물 갤러리·스냅샷 반영.
  const expCount = Array.isArray(data.progress.experienceBank) ? data.progress.experienceBank.length : 0;
  const storyReady = Array.isArray(data.progress.storyBank?.data?.stories) && (data.progress.storyBank?.data?.stories?.length ?? 0) > 0;
  const answerReady = Array.isArray(data.progress.answerBank?.data?.answers) && (data.progress.answerBank?.data?.answers?.length ?? 0) > 0;
  // 다음 할 일 — 열려 있고 아직 완료 안 된 첫 주차.
  const nextWeek = WEEKS.find((w) => weekUnlocked(w.week, data, schedule, serverNow) && weekDoneCount(w.steps, data) < w.steps.length) ?? null;
  useEffect(() => {
    if (overall === 100 && !reportedRef.current) {
      reportedRef.current = true;
      trackCareerFunnel("career_report_viewed");
      trackCareerFunnel("career_launch_completed");
    }
  }, [overall]);

  // Career Launch 전용 알림 생성 — 주차 열림·세미나·결과물·완주. 멱등(dedupeKey)이라 중복 없이 쌓인다.
  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    ensureLaunchNotificationsOwner(user?.id ?? null); // 계정 바뀌면 이전 알림 제거
    // 주차 열림
    WEEKS.forEach((w) => {
      if (!weekUnlocked(w.week, data, schedule, serverNow)) return;
      addLaunchNotification({
        dedupeKey: `week-open-${w.week}`,
        emoji: "🔓",
        title: t(`${w.week}주차 미션이 열렸어요`, `Week ${w.week} is now open`, `第${w.week}周任务已开放`, `Tuần ${w.week} đã mở`, `Week ${w.week}のミッションが開きました`, `Minggu ${w.week} telah dibuka`),
        body: `${weekText(w.week, "title")} · ${WEEK_DELIVERABLE[w.week]}`,
        href: `/career-launch/week/${w.week}`
      });
    });
    // 예정된 세미나
    seminars.forEach((s) => {
      const dt = new Date(s.startsAt);
      if (Number.isNaN(dt.getTime()) || dt.getTime() < Date.now()) return;
      const when = dt.toLocaleString(undefined, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" });
      const title = s.title || t(`Week ${s.week} 세미나`, `Week ${s.week} seminar`, `第${s.week}周研讨会`, `Hội thảo Tuần ${s.week}`, `Week ${s.week} セミナー`, `Seminar Minggu ${s.week}`);
      addLaunchNotification({
        dedupeKey: `seminar-${s.week}-${s.startsAt}`,
        emoji: "🎓",
        title: t("세미나 일정이 잡혔어요", "A seminar is scheduled", "研讨会已安排", "Đã có lịch hội thảo", "セミナーが予定されました", "Seminar telah dijadwalkan"),
        body: `${title} · ${when}`,
        href: "/career-launch/dashboard"
      });
    });
    // 결과물 완성
    if (resumeReady) {
      addLaunchNotification({
        dedupeKey: "resume-ready",
        emoji: "📄",
        title: t("이력서가 완성됐어요", "Your resume is ready", "简历已完成", "Hồ sơ đã hoàn thành", "履歴書が完成しました", "Resume sudah siap"),
        body: t("미리보기에서 확인해보세요.", "Check it in the preview.", "在预览中查看吧。", "Xem trong bản xem trước nhé.", "プレビューで確認しましょう。", "Cek di pratinjau."),
        href: "/career-launch/resume-preview"
      });
    }
    if (coverReady) {
      addLaunchNotification({
        dedupeKey: "cover-ready",
        emoji: "📝",
        title: t("자기소개서가 완성됐어요", "Your cover letter is ready", "求职信已完成", "Thư tự giới thiệu đã hoàn thành", "自己紹介書が完成しました", "Cover letter sudah siap"),
        body: t("미리보기에서 확인해보세요.", "Check it in the preview.", "在预览中查看吧。", "Xem trong bản xem trước nhé.", "プレビューで確認しましょう。", "Cek di pratinjau."),
        href: "/career-launch/cover-preview"
      });
    }
    // 완주 → talent(APLY) 서비스로 이어가기
    if (overall === 100) {
      addLaunchNotification({
        dedupeKey: "completed",
        emoji: "🎉",
        title: t("4주 프로그램을 완주했어요!", "You finished the 4-week program!", "你完成了4周项目！", "Bạn đã hoàn thành chương trình 4 tuần!", "4週間プログラムを完走しました！", "Kamu menyelesaikan program 4 minggu!"),
        body: t("이제 실제 공고에 지원해볼까요? APLY에서 이어가요.", "Ready to apply to real jobs? Continue on APLY.", "现在去投递真实职位吧，在 APLY 继续。", "Sẵn sàng ứng tuyển việc thật? Tiếp tục trên APLY.", "実際の求人に応募してみましょう。APLYで続けます。", "Siap melamar pekerjaan nyata? Lanjutkan di APLY."),
        href: "/talent/jobs"
      });
    }
    // 베타 설문 — 주차 완료 시점에 알림으로(카드 대신). W4 완료 시 전체 설문, 아니면 W2 완료 시 중간 설문.
    if (isWeekComplete(4, data) && SURVEY_FINAL_URL) {
      const added = addLaunchNotification({
        dedupeKey: "survey-final",
        emoji: "📋",
        external: true,
        href: SURVEY_FINAL_URL,
        title: t("전체 설문에 참여해주세요", "Please take the full program survey", "请参与整体问卷", "Vui lòng tham gia khảo sát tổng thể", "全体アンケートにご協力ください", "Mohon ikuti survei keseluruhan"),
        body: t("4주 프로그램 피드백으로 바로 개선돼요. 3분이면 충분해요.", "Your feedback improves the program right away. About 3 minutes.", "你的反馈将即刻改进项目。约3分钟。", "Phản hồi giúp cải thiện chương trình ngay. Khoảng 3 phút.", "フィードバックですぐ改善します。3分ほどです。", "Masukanmu langsung memperbaiki program. Sekitar 3 menit.")
      });
      if (added) trackCareerFunnel("survey_final_prompted");
    } else if (isWeekComplete(2, data) && SURVEY_MID_URL) {
      const added = addLaunchNotification({
        dedupeKey: "survey-mid",
        emoji: "📋",
        external: true,
        href: SURVEY_MID_URL,
        title: t("1·2주차 설문에 참여해주세요", "Please take the Week 1–2 survey", "请参与第1·2周问卷", "Vui lòng tham gia khảo sát Tuần 1–2", "1・2週目アンケートにご協力ください", "Mohon ikuti survei Minggu 1–2"),
        body: t("진단·이력서 경험 피드백을 남겨주세요. 3분이면 충분해요.", "Share feedback on the diagnosis and resume. About 3 minutes.", "请留下诊断和简历体验反馈。约3分钟。", "Chia sẻ phản hồi về chẩn đoán và hồ sơ. Khoảng 3 phút.", "診断・履歴書の体験フィードバックをお願いします。3分ほどです。", "Beri masukan soal diagnosis dan resume. Sekitar 3 menit.")
      });
      if (added) trackCareerFunnel("survey_mid_prompted");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isAuthenticated, data, schedule, serverNow, seminars, resumeReady, coverReady, overall]);

  if (!isReady || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="inline-flex items-center gap-2 text-[13px] text-[#8B95A1]"><CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> {t("불러오는 중...", "Loading...", "加载中...", "Đang tải...", "読み込み中...", "Memuat...")}</span>
      </main>
    );
  }

  return (
    <EnrollmentGate>
    <div className="isolate flex min-h-screen flex-col bg-white">
      <LaunchAmbientBackground />
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-10">
          {/* UX Phase 8 — 페이지 시맨틱 h1(스크린리더용, 시각적으로는 코치 카드가 히어로 역할). */}
          <h1 className="sr-only">{t("오늘의 커리어 준비", "Today's career prep", "今日的求职准备", "Chuẩn bị nghề hôm nay", "今日のキャリア準備", "Persiapan karier hari ini")}</h1>
          {/* 운영자는 학생 화면을 본인 계정으로 전부 체험할 수 있음 — 콘솔 복귀 링크 */}
          {user?.role === "OPERATOR" ? (
            <Link href="/career-launch/ops/students" className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-[#F0B429]/40 bg-[#FFF9EC] px-3 py-1.5 text-[12.5px] font-bold text-[#B7791F] transition hover:bg-[#FEF3D6]">
              {t("← 운영자 콘솔 · 지금은 학생 화면 체험 중", "← Operator console · Now previewing the student view", "← 运营者控制台 · 当前正在预览学生页面", "← Bảng điều khiển quản trị · Đang xem thử giao diện học viên", "← 運営者コンソール · 現在は学生画面をプレビュー中", "← Konsol operator · Sedang melihat tampilan siswa")}
            </Link>
          ) : null}
          {/* 프로그램 마스트헤드 — 홈 최상단 히어로. 이 프로그램이 무엇인지 한눈에(정적, vm 무관). */}
          <section className="mt-1 overflow-hidden rounded-2xl border border-[#E7EDFB] bg-gradient-to-br from-[#F4F8FF] via-white to-white">
            <div className="flex flex-col md:flex-row md:items-center">
              {/* 데스크톱: 텍스트 좌 · 이미지 우 / 모바일: 이미지 상 · 텍스트 하 */}
              <div className="order-2 flex-1 p-6 md:order-1 md:py-8 md:pl-8 md:pr-2">
                <p className="cl-eyebrow text-[#3182F6]">CAREER LAUNCH</p>
                <h2 className="cl-headline mt-2 text-[#0B1227]">
                  {t("전담 코치와 함께하는 4주, 취업 준비 완성", "Four weeks with your coach — job-ready", "与专属教练同行的4周，完成求职准备", "4 tuần cùng coach — sẵn sàng xin việc", "専属コーチと4週間で就活準備を完成", "Empat minggu bersama coach — siap melamar")}
                </h2>
                <p className="cl-lead mt-2.5 max-w-xl break-keep text-[#4E5968]">
                  {t(
                    "직무 탐색부터 이력서·자기소개서, 실전 모의면접까지 — 4주 동안 실제 지원에 쓰는 결과물을 완성해요.",
                    "From finding your role to resume, cover letter, and mock interviews — build the real deliverables you'll apply with over four weeks.",
                    "从职业探索到简历、求职信与模拟面试——用四周完成可直接投递的成果。",
                    "Từ khám phá công việc đến hồ sơ, thư xin việc và phỏng vấn thử — hoàn thành kết quả thật để ứng tuyển trong 4 tuần.",
                    "職務探索から履歴書・自己紹介書、模擬面接まで — 4週間で実際に応募に使う成果物を完成させます。",
                    "Dari eksplorasi peran hingga resume, cover letter, dan wawancara simulasi — selesaikan hasil nyata untuk melamar dalam empat minggu."
                  )}
                </p>
                <span className="mt-4 inline-flex items-center rounded-full bg-[#0B46E8] px-3 py-1 text-[11.5px] font-bold text-white">
                  {t("4주 프로그램", "4-week program", "4周项目", "Chương trình 4 tuần", "4週間プログラム", "Program 4 minggu")}
                </span>
              </div>
              <div className="order-1 md:order-2 md:w-[42%] md:flex-none md:self-stretch">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/img_global_career_launch.webp"
                  alt={t("노트북 앞에서 커리어를 준비하는 참가자와 4주 여정·목표·성장 지표 일러스트", "Illustration of a learner preparing their career with the 4-week journey, goal, and growth metrics", "在笔记本电脑前准备求职的参加者与4周旅程、目标与成长指标插图", "Minh họa người học chuẩn bị nghề nghiệp với hành trình 4 tuần, mục tiêu và chỉ số phát triển", "ノートパソコンの前でキャリアを準備する参加者と4週間の道のり・目標・成長指標のイラスト", "Ilustrasi peserta menyiapkan karier dengan perjalanan 4 minggu, tujuan, dan metrik pertumbuhan")}
                  className="block h-auto w-full object-contain md:h-full md:object-cover md:object-center"
                  loading="eager"
                />
              </div>
            </div>
          </section>
          {/* ═══ UX Phase 2 — 오늘의 커리어 준비(코치·현재 주차·오늘 할 일·4주 여정·결과물·성장·함께) ═══ */}
          {vmPhase === "loading" ? (
            <div className="mt-2 flex flex-col gap-3">
              <CardSkeleton height={168} />
              <CardSkeleton height={120} />
              <CardSkeleton height={96} />
            </div>
          ) : vmPhase === "error" || !vm ? (
            <div className="mt-2">
              <ErrorState onRetry={loadVm} />
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-9 md:mt-8 md:gap-10">
              {/* 정체 사용자: 죄책감 없이 이어가기 */}
              {vm.enrollmentStatus === "stalled" ? <ResumeState days={vm.lastActivityDaysAgo} href={vm.nextAction.destination} /> : null}

              {/* 영역 1 — 전담 코치 메시지(최상단) */}
              <CoachTodayCard vm={vm} />

              {/* 영역 3 — 오늘 할 일(단일 행동) */}
              {vm.enrollmentStatus !== "new" ? <NextActionCard vm={vm} /> : null}

              {/* 영역 2 — 현재 주차 */}
              {vm.enrollmentStatus !== "new" && vm.enrollmentStatus !== "completed" ? (
                <CurrentWeekCard vm={vm} doneCount={weekDoneCount(WEEKS[vm.currentWeek - 1]?.steps ?? [], data)} requiredCount={WEEKS[vm.currentWeek - 1]?.steps.length ?? 0} />
              ) : null}

              {/* 영역 4 — 4주 여정 */}
              <DashboardSection title={t("4주 여정", "4-week journey", "4周旅程", "Hành trình 4 tuần", "4週間のジャーニー", "Perjalanan 4 minggu")} sub={t("하나로 연결된 과정이에요", "One connected journey", "一个连贯的过程", "Một hành trình liền mạch", "ひとつながりの過程です", "Satu perjalanan yang terhubung")}>
                <FourWeekJourney vm={vm} />
              </DashboardSection>

              {/* 영역 5 — 최근 결과물 */}
              <DashboardSection title={t("최근 결과물", "Recent deliverables", "最近成果", "Kết quả gần đây", "最近の成果物", "Hasil terbaru")} sub={t("확인이 필요한 것부터", "Start with what needs review", "从需要确认的开始", "Bắt đầu từ những gì cần xem lại", "確認が必要なものから", "Mulai dari yang perlu ditinjau")}>
                <ArtifactStatusCard artifacts={vm.artifacts} />
              </DashboardSection>

              {/* 영역 6 — 내 성장(성장 데이터가 생긴 뒤에만 노출. 모의면접 전엔 순서에 안 맞는 CTA를 띄우지 않음) */}
              {vm.growthSummary.available ? (
                <DashboardSection title={t("내 성장", "My growth", "我的成长", "Sự phát triển của tôi", "私の成長", "Pertumbuhanku")}>
                  <GrowthSummaryCard vm={vm} />
                </DashboardSection>
              ) : null}

              {/* 영역 7 — 함께하는 사람들(보조) */}
              <CohortActivityCard vm={vm} />

              {/* 영역 8 — 일정 및 세미나 */}
              <SeminarCard vm={vm} />
            </div>
          )}

          {/* 완주자 — 최종 성장 리포트·피드백은 '나의 성장'으로, 실제 취업은 APLY로 이어가요. (홈 정리: 하단 레거시 블록 제거) */}
          {vm && (vm.enrollmentStatus === "completed" || overall === 100) ? (
            <div className="mt-8 flex flex-col gap-3">
              <Link href="/career-launch/growth" className="flex items-center justify-between gap-3 rounded-2xl border border-[#EEF1F5] bg-white px-5 py-4 transition hover:border-[#3182F6]/40">
                <div>
                  <p className="cl-eyebrow">4-Week Journey</p>
                  <p className="mt-0.5 text-[14px] font-bold text-[#191F28]">{t("최종 성장 리포트·피드백 보기", "See your growth report and feedback", "查看成长报告与反馈", "Xem báo cáo phát triển và phản hồi", "成長レポート・フィードバックを見る", "Lihat laporan pertumbuhan & umpan balik")}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" weight="bold" aria-hidden />
              </Link>
              <Link href="/talent/home" onClick={() => trackCareerFunnel("next_action_clicked", { action: "go_talent" })} className="group flex items-center justify-between gap-4 rounded-2xl bg-[#0B1227] px-5 py-5 text-left transition hover:bg-[#1A2440]">
                <div className="min-w-0">
                  <p className="text-[15px] font-black text-white">{t("APLY에서 취업 이어가기", "Continue your job search on APLY", "在 APLY 继续求职", "Tiếp tục tìm việc trên APLY", "APLYで就職活動を続ける", "Lanjutkan pencarian kerja di APLY")}</p>
                  <p className="mt-0.5 break-keep text-[12.5px] leading-relaxed text-white/70">{t("완성한 이력서·자기소개서로 실제 공고에 지원하고 취업을 이어가요.", "Apply to real jobs with your finished resume and cover letter.", "用完成的简历与求职信投递真实职位。", "Ứng tuyển việc thật với hồ sơ và thư đã hoàn thành.", "完成した履歴書・自己紹介書で実際の求人に応募しましょう。", "Lamar pekerjaan nyata dengan resume dan surat lamaranmu.")}</p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition"><ArrowRight className="h-[18px] w-[18px]" weight="bold" aria-hidden /></span>
              </Link>
            </div>
          ) : null}
        </div>
      </main>
      <AplyFooter />
      {/* 각 주차를 끝냈을 때 그 주차 설문만 1회 노출(상시 아님). 완료된 최근 주차 기준. */}
      <PilotFeedbackWidget surveyKey={vm ? ([4, 3, 2, 1].map((w) => (vm.weekComplete[w - 1] ? `week${w}_end` : null)).find(Boolean) ?? undefined) : undefined} />
    </div>
    </EnrollmentGate>
  );
}
