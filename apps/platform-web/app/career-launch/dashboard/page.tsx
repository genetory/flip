"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, CaretRight, ArrowRight, Monitor, MapPin, CircleNotch, ChatCircleText, GraduationCap, PenNib } from "@phosphor-icons/react";
import { STUDENT, WEEKS } from "../../../lib/launch/data";
import { Card, SectionTitle } from "../../../components/launch/ui";
import { EnrollmentGate } from "../../../components/launch/enrollment-gate";
import { FinalFeedbackCard } from "../../../components/launch/final-feedback";
import { fetchProgress, fetchWeekSchedule, type WeekScheduleEntry } from "../../../lib/launch/progress-client";
import { fetchMySeminars, fetchMyEnrollment, type CohortSeminar } from "../../../lib/launch/enrollment-client";
import { fetchResumeData, hasResumeContent } from "../../../lib/launch/resume-data";
import { fetchCoverData, hasCoverContent } from "../../../lib/launch/cover-data";
import { weekDoneCount, weekUnlocked, isWeekComplete, type LaunchData } from "../../../lib/launch/step-status";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { CohortPulseCard } from "../../../components/launch/CohortPulseCard";
import { AplyFooter } from "../../../components/AplyFooter";
import { Reveal } from "../../../components/site/Reveal";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { useLaunchT } from "../../../lib/launch/i18n";
import { useWeekText, useCompletionCriteria } from "../../../lib/launch/data-i18n";
import { trackCareerFunnel } from "../../../lib/analytics";
import { addLaunchNotification, ensureLaunchNotificationsOwner } from "../../../lib/launch/notifications";

// 베타 설문 링크(env 주입) — 설문 CTA 카드 대신 알림으로 발송.
const SURVEY_MID_URL = process.env.NEXT_PUBLIC_CAREER_SURVEY_MID_URL?.trim() || "";
const SURVEY_FINAL_URL = process.env.NEXT_PUBLIC_CAREER_SURVEY_FINAL_URL?.trim() || "";

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
    <div className="flex min-h-screen flex-col bg-white">
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-10">
          {/* 운영자는 학생 화면을 본인 계정으로 전부 체험할 수 있음 — 콘솔 복귀 링크 */}
          {user?.role === "OPERATOR" ? (
            <Link href="/career-launch/ops/students" className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-[#F0B429]/40 bg-[#FFF9EC] px-3 py-1.5 text-[12.5px] font-bold text-[#B7791F] transition hover:bg-[#FEF3D6]">
              {t("← 운영자 콘솔 · 지금은 학생 화면 체험 중", "← Operator console · Now previewing the student view", "← 运营者控制台 · 当前正在预览学生页面", "← Bảng điều khiển quản trị · Đang xem thử giao diện học viên", "← 運営者コンソール · 現在は学生画面をプレビュー中", "← Konsol operator · Sedang melihat tampilan siswa")}
            </Link>
          ) : null}
          {/* 인사 히어로 — 카드 없이, 원형 진행 링(완주 시 문구만 전환) */}
          <Reveal>
          <div className="pt-2 md:pt-4">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">{overall === 100 ? t("수료 완료", "Completed", "已结业", "Đã hoàn thành", "修了", "Selesai") : (cohortLabel || t("글로벌 커리어 런치", "Global Career Launch", "全球职业启航", "Global Career Launch", "グローバルキャリアローンチ", "Global Career Launch"))}</p>
                <h1 className="mt-2 break-keep text-[23px] font-black leading-[1.2] tracking-[-0.03em] text-[#191F28] md:text-[30px]">{overall === 100 ? t(`${displayName}님, 완주를 축하해요`, `Congrats on finishing, ${displayName}`, `${displayName}，恭喜你顺利完成`, `Chúc mừng bạn đã hoàn thành, ${displayName}`, `${displayName}さん、完走おめでとうございます`, `Selamat telah menyelesaikan, ${displayName}`) : t(`${displayName}님, 반가워요`, `Welcome, ${displayName}`, `${displayName}，欢迎你`, `Chào mừng bạn, ${displayName}`, `${displayName}さん、ようこそ`, `Selamat datang, ${displayName}`)}</h1>
                <p className="mt-2.5 break-keep text-[14px] leading-relaxed text-[#4E5968] md:text-[15px]">{overall === 100 ? t("이력서·자기소개서를 완성하고 면접 준비까지 마쳤어요. 이제 자신 있게 지원해봐요.", "You've finished your resume and cover letter, and prepped for interviews. Now apply with confidence.", "你已完成简历和求职信，也做好了面试准备。现在充满信心地去投递吧。", "Bạn đã hoàn thành hồ sơ và thư tự giới thiệu, và chuẩn bị xong cho phỏng vấn. Giờ hãy tự tin ứng tuyển nhé.", "履歴書・自己紹介書を完成させ、面接準備まで終えました。これからは自信を持って応募しましょう。", "Kamu sudah menyelesaikan resume dan cover letter, serta menyiapkan wawancara. Sekarang lamar dengan percaya diri.") : t("4주 동안 이력서·자기소개서를 완성하고 면접까지 준비해요.", "Over 4 weeks, you'll complete your resume and cover letter, and prepare for interviews.", "在4周内完成简历和求职信，并准备好面试。", "Trong 4 tuần, bạn sẽ hoàn thành hồ sơ và thư tự giới thiệu, và chuẩn bị cho phỏng vấn.", "4週間で履歴書・自己紹介書を完成させ、面接まで準備します。", "Selama 4 minggu, kamu akan menyelesaikan resume dan cover letter, serta menyiapkan wawancara.")}</p>
              </div>
              <HeroProgress pct={overall} done={doneSteps} total={totalSteps} />
            </div>
          </div>
          </Reveal>

          {/* 다음 할 일 — 흑백 다크 CTA(주 액션 강조), 미완료 첫 주차로 이동 */}
          {overall < 100 && nextWeek ? (
            <Reveal delayMs={80}>
            <Link
              href={`/career-launch/week/${nextWeek.week}`}
              className="group mt-3 flex items-center justify-between gap-4 rounded-2xl bg-[#191F28] p-5 transition hover:bg-[#0B1227] md:p-6"
            >
              <div className="min-w-0">
                <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">{t("다음 할 일", "Your next step", "下一步", "Việc tiếp theo", "次にやること", "Langkah berikutnya")}</p>
                <p className="mt-1.5 truncate text-[16.5px] font-bold text-white md:text-[18px]">
                  {t(`${nextWeek.week}주차`, `Week ${nextWeek.week}`, `第${nextWeek.week}周`, `Tuần ${nextWeek.week}`, `${nextWeek.week}週目`, `Minggu ${nextWeek.week}`)} · {WEEK_DELIVERABLE[nextWeek.week]}
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition group-hover:bg-white/20 group-hover:translate-x-0.5"><ArrowRight className="h-[18px] w-[18px]" weight="bold" aria-hidden /></span>
            </Link>
            </Reveal>
          ) : null}

          {/* 내 기수와 함께 — 익명 진행률(동기부여). 동기 2명 이상일 때만 노출 */}
          {overall < 100 ? <div className="mt-3"><CohortPulseCard /></div> : null}

          {/* 최종 피드백·다음 행동 섹션은 아래 '내 결과물' 섹션 다음으로 이동함 */}

          <Reveal delayMs={120}>
          <div className="mt-8 flex flex-col gap-10 md:mt-10">
            {/* ── 프로그램 소개 (맨 위, 펼침) ── */}
            <div>
                <SectionTitle>{t("프로그램 소개", "About the program", "项目介绍", "Giới thiệu chương trình", "プログラム紹介", "Tentang program")}</SectionTitle>
                <article className="rounded-3xl border border-[#EEF1F5] bg-white p-5 md:p-7">
                  <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#0B46E8]">Global Career Launch</p>
                  <h3 className="mt-2 break-keep text-[20px] font-black leading-[1.32] tracking-[-0.02em] text-[#0B1227] md:text-[23px]">{t("AI 코치와 함께하는 4주 취업 완성 부트캠프", "A 4-week job-prep bootcamp with your AI coach", "与AI教练一起完成的4周求职训练营", "Bootcamp chuẩn bị việc làm 4 tuần cùng AI coach", "AIコーチと一緒に取り組む4週間就職完成ブートキャンプ", "Bootcamp persiapan kerja 4 minggu bersama AI coach")}</h3>
                  {/* 프로그램 이미지 — 원본 비율 유지하며 축소 노출(크롭 없음) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img_global_career_launch.webp" alt="Global Career Launch" className="mt-5 h-auto w-full max-w-[400px] rounded-2xl" />
                  <p className="mt-5 break-keep text-[14px] leading-[1.75] text-[#4E5968] md:text-[14.5px]">
                    {t("한국 취업을 준비하는 외국인 유학생을 위한 프로그램이에요. 혼자서는 막막한 취업 준비를 AI 코치가 옆에서 이끌어줘요. 취업 준비 상태 진단부터 직무 방향 설정, 대화만으로 완성하는 이력서·자기소개서, 그리고 유형별 모의면접까지 — 4주 동안 하나씩 밟아가며 완주해요.", "This program is for international students preparing to work in Korea. Job prep can feel overwhelming on your own, so an AI coach guides you every step of the way. From diagnosing where you stand and setting your career direction, to building your resume and cover letter just by chatting, to mock interviews by type — you'll complete it step by step over 4 weeks.", "这是为准备在韩国就业的外国留学生打造的项目。独自准备求职难免感到迷茫，AI教练会一路陪伴引导你。从诊断你的求职准备状态、确定职业方向，到只需对话就能完成的简历与求职信，再到分类型的模拟面试——4周内一步步完成。", "Đây là chương trình dành cho du học sinh nước ngoài chuẩn bị làm việc tại Hàn Quốc. Chuẩn bị việc làm một mình có thể rất mông lung, nên AI coach sẽ đồng hành và dẫn dắt bạn từng bước. Từ chẩn đoán tình trạng chuẩn bị, định hướng nghề nghiệp, hoàn thành hồ sơ và thư tự giới thiệu chỉ bằng trò chuyện, đến phỏng vấn thử theo từng loại — bạn sẽ hoàn thành từng bước trong 4 tuần.", "韓国での就職を目指す外国人留学生のためのプログラムです。一人では途方に暮れがちな就職準備を、AIコーチが隣で導いてくれます。就職準備状況の診断から職務の方向性設定、会話だけで完成する履歴書・自己紹介書、そしてタイプ別の模擬面接まで — 4週間で一つずつ進めて完走します。", "Program ini untuk mahasiswa asing yang bersiap bekerja di Korea. Persiapan kerja bisa terasa membingungkan jika sendirian, jadi AI coach akan membimbingmu di setiap langkah. Mulai dari diagnosis kesiapan, menentukan arah karier, menyusun resume dan cover letter hanya lewat percakapan, hingga simulasi wawancara per jenis — kamu akan menyelesaikannya langkah demi langkah selama 4 minggu.")}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {[
                      { Icon: ChatCircleText, t: t("대화로 만드는 이력서·자기소개서", "Resume & cover letter built through conversation", "对话即可完成简历与求职信", "Hồ sơ & thư tự giới thiệu tạo qua trò chuyện", "会話で作る履歴書・自己紹介書", "Resume & cover letter dari percakapan") },
                      { Icon: GraduationCap, t: t("주간 세미나", "Weekly seminar", "每周研讨会", "Hội thảo hằng tuần", "週間セミナー", "Seminar mingguan") },
                      { Icon: PenNib, t: t("코치 1:1 피드백", "1:1 coach feedback", "教练一对一反馈", "Phản hồi 1:1 từ coach", "コーチ1:1フィードバック", "Umpan balik coach 1:1") }
                    ].map((f) => (
                      <span key={f.t} className="inline-flex items-center gap-1.5 rounded-full bg-[#F2F4F6] px-3 py-1.5 text-[12px] font-semibold text-[#4E5968]">
                        <f.Icon className="h-3.5 w-3.5 text-[#0B46E8]" weight="fill" aria-hidden />
                        {f.t}
                      </span>
                    ))}
                  </div>

                  {/* 4주 후 얻는 것 — 넘버드 매거진 리스트 */}
                  <div className="mt-7 border-t border-[#F2F4F6] pt-6">
                    <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">{t("4주 후, 이런 걸 완성해요", "After 4 weeks, here's what you'll have", "4周后，你将完成这些", "Sau 4 tuần, đây là những gì bạn có", "4週間後、こんなものが完成します", "Setelah 4 minggu, inilah yang kamu miliki")}</p>
                    <ol className="mt-3.5 space-y-3.5">
                      {[
                        t("취업 준비도 진단 · 직무 방향", "Job-readiness diagnosis · Career direction", "求职准备度诊断 · 职业方向", "Chẩn đoán mức độ sẵn sàng · Định hướng nghề nghiệp", "就職準備度診断・職務の方向性", "Diagnosis kesiapan kerja · Arah karier"),
                        t("기업에 낼 대표 이력서", "A master resume to send to companies", "可投递企业的标准简历", "Hồ sơ chính để gửi cho công ty", "企業に提出するメイン履歴書", "Resume utama untuk dikirim ke perusahaan"),
                        t("회사 맞춤 자기소개서", "A cover letter tailored to each company", "针对公司量身定制的求职信", "Thư tự giới thiệu phù hợp từng công ty", "会社に合わせた自己紹介書", "Cover letter yang disesuaikan tiap perusahaan"),
                        t("유형별 모의면접 · 실전 준비", "Mock interviews by type · Real-world prep", "分类型模拟面试 · 实战准备", "Phỏng vấn thử theo loại · Chuẩn bị thực chiến", "タイプ別模擬面接・実践準備", "Simulasi wawancara per jenis · Persiapan nyata")
                      ].map((label, i) => (
                        <li key={label} className="flex gap-4">
                          <span className="mt-px w-6 shrink-0 text-[13px] font-black tabular-nums text-[#0B46E8]">{String(i + 1).padStart(2, "0")}</span>
                          <span className="break-keep text-[13.5px] leading-relaxed text-[#333D4B] md:text-[14px]">{label}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* 수료 조건 */}
                  <div className="mt-6 border-t border-[#F2F4F6] pt-6">
                    <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">{t("수료 조건", "Completion requirements", "结业条件", "Điều kiện hoàn thành", "修了条件", "Syarat kelulusan")}</p>
                    <ul className="mt-3 space-y-2 text-[13px] text-[#333D4B]">
                      {completionCriteria().map((c, i) => (
                        <li key={i} className="flex gap-2.5">
                          <span className="mt-0.5 flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full bg-[#F2F4F6] text-[10px] font-black text-[#4E5968]">{i + 1}</span>
                          <span className="break-keep leading-relaxed">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
            </div>

            <div>
                <SectionTitle sub={t("각 주차를 눌러 진행하세요 · 완료할수록 결과물이 완성돼요", "Tap each week to get started · Your deliverables come together as you finish", "点击每一周开始 · 完成越多，成果越完整", "Nhấn vào từng tuần để bắt đầu · Hoàn thành càng nhiều, kết quả càng đầy đủ", "各週をタップして進めましょう · 完了するほど成果物が仕上がります", "Ketuk tiap minggu untuk mulai · Semakin selesai, hasilnya makin lengkap")}>{t("4주 여정", "4-week journey", "4周旅程", "Hành trình 4 tuần", "4週間のジャーニー", "Perjalanan 4 minggu")}</SectionTitle>
                <ol className="divide-y divide-[#EEF1F5] border-y border-[#EEF1F5]">
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
                    const inner = (
                      <div className="flex items-center gap-4 py-5">
                        <span className={`flex w-14 shrink-0 items-center text-[13px] font-black ${unlocked ? "text-[#191F28]" : "text-[#C4CAD2]"}`}>{unlocked ? t(`${w.week}주차`, `Week ${w.week}`, `第${w.week}周`, `Tuần ${w.week}`, `${w.week}週目`, `Minggu ${w.week}`) : <Lock className="h-4 w-4" weight="fill" aria-hidden />}</span>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-[15.5px] font-bold tracking-[-0.01em] ${unlocked ? "text-[#191F28]" : "text-[#B0B8C1]"}`}>{weekText(w.week, "title")}</p>
                          <p className="mt-0.5 truncate text-[13px] text-[#8B95A1]">
                            {unlocked ? `${WEEK_DELIVERABLE[w.week]} · ${t(`스텝 ${done}/${total}`, `Steps ${done}/${total}`, `步骤 ${done}/${total}`, `Bước ${done}/${total}`, `ステップ ${done}/${total}`, `Langkah ${done}/${total}`)}` : weekText(w.week, "subtitle")}
                          </p>
                        </div>
                        <span className={`shrink-0 text-[12.5px] font-medium ${unlocked && done === total ? "text-[#191F28]" : "text-[#B0B8C1]"}`}>{status}</span>
                        {unlocked ? <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2] transition group-hover:translate-x-0.5" weight="bold" aria-hidden /> : null}
                      </div>
                    );
                    return <li key={w.week}>{unlocked ? <Link href={`/career-launch/week/${w.week}`} className="group -mx-2 block rounded-xl px-2 transition hover:bg-[#FAFBFC]">{inner}</Link> : inner}</li>;
                  })}
                </ol>
            </div>

            {/* ── 다가오는 세미나 ── */}
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
                          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#EDF1FD] text-[#0B46E8]">{s.online ? <Monitor className="h-5 w-5" weight="fill" aria-hidden /> : <MapPin className="h-5 w-5" weight="fill" aria-hidden />}</span>
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
              <div id="deliverables" className="scroll-mt-20 space-y-4">
                <SectionTitle sub={t("대화로 만드는 이력서와 자기소개서", "A resume and cover letter built through conversation", "对话即可完成的简历与求职信", "Hồ sơ và thư tự giới thiệu tạo qua trò chuyện", "会話で作る履歴書と自己紹介書", "Resume dan cover letter dari percakapan")}>{t("내 결과물", "My deliverables", "我的成果", "Kết quả của tôi", "私の成果物", "Hasil saya")}</SectionTitle>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DeliverableCard
                    title={t("내 이력서", "My resume", "我的简历", "Hồ sơ của tôi", "私の履歴書", "Resume saya")}
                    ready={resumeReady}
                    previewHref="/career-launch/resume-preview"
                    doneMsg={t("이력서가 완성됐어요", "Your resume is ready", "简历已完成", "Hồ sơ đã hoàn thành", "履歴書が完成しました", "Resume sudah siap")}
                    emptyMsg={t("2주차에 대화로 만들어요", "Built through conversation in Week 2", "第2周通过对话完成", "Tạo qua trò chuyện ở Tuần 2", "Week 2に会話で作ります", "Dibuat lewat percakapan di Minggu 2")}
                  />
                  <DeliverableCard
                    title={t("내 자기소개서", "My cover letter", "我的求职信", "Thư tự giới thiệu của tôi", "私の自己紹介書", "Cover letter saya")}
                    ready={coverReady}
                    previewHref="/career-launch/cover-preview"
                    doneMsg={t("자기소개서가 완성됐어요", "Your cover letter is ready", "求职信已完成", "Thư tự giới thiệu đã hoàn thành", "自己紹介書が完成しました", "Cover letter sudah siap")}
                    emptyMsg={t("3주차에 대화로 만들어요", "Built through conversation in Week 3", "第3周通过对话完成", "Tạo qua trò chuyện ở Tuần 3", "Week 3に会話で作ります", "Dibuat lewat percakapan di Minggu 3")}
                  />
                </div>
              </div>

            {/* ── 완주 시 — 최종 피드백 + 다음 행동 ('내 결과물' 아래) ── */}
            {overall === 100 ? (
              <div>
                <SectionTitle sub={t("이력서·자기소개서·면접을 종합한 코치 피드백", "Coach feedback across your resume, cover letter, and interview", "综合简历、求职信与面试的教练反馈", "Phản hồi từ coach tổng hợp hồ sơ, thư tự giới thiệu và phỏng vấn", "履歴書・自己紹介書・面接を総合したコーチのフィードバック", "Umpan balik coach dari resume, cover letter, dan wawancara")}>{t("최종 피드백", "Final feedback", "最终反馈", "Phản hồi cuối cùng", "最終フィードバック", "Umpan balik akhir")}</SectionTitle>
                <FinalFeedbackCard />

                {/* APLY(탤런트)로 이어가기 — 완주 후 실제 취업 활동으로 연결 */}
                <Link
                  href="/talent/home"
                  onClick={() => trackCareerFunnel("next_action_clicked", { action: "go_talent" })}
                  className="group mt-6 flex items-center justify-between gap-4 rounded-2xl bg-[#0B1227] px-5 py-5 text-left transition hover:bg-[#1A2440]"
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-black text-white">{t("APLY에서 취업 이어가기", "Continue your job search on APLY", "在 APLY 继续求职", "Tiếp tục tìm việc trên APLY", "APLYで就職活動を続ける", "Lanjutkan pencarian kerja di APLY")}</p>
                    <p className="mt-0.5 break-keep text-[12.5px] leading-relaxed text-white/70">{t("완성한 이력서·자기소개서로 실제 공고에 지원하고 취업을 이어가요.", "Apply to real jobs with your finished resume and cover letter.", "用完成的简历与求职信投递真实职位。", "Ứng tuyển việc thật với hồ sơ và thư đã hoàn thành.", "完成した履歴書・自己紹介書で実際の求人に応募しましょう。", "Lamar pekerjaan nyata dengan resume dan surat lamaranmu.")}</p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition group-hover:translate-x-0.5"><ArrowRight className="h-[18px] w-[18px]" weight="bold" aria-hidden /></span>
                </Link>
              </div>
            ) : null}
          </div>
          </Reveal>
        </div>
      </main>
      <AplyFooter />
    </div>
    </EnrollmentGate>
  );
}

// 결과물 카드 — talent '내 커리어'와 동일한 형태. 문서를 인라인으로 펼치지 않고,
// 완성 링 + 상태 메시지 + '미리보기'(새 탭) 링크만 노출.
function DeliverableCard({ title, ready, previewHref, doneMsg, emptyMsg }: { title: string; ready: boolean; previewHref: string; doneMsg: string; emptyMsg: string }) {
  const t = useLaunchT();
  const shell = ready
    ? "border border-[#EEF1F5] bg-white hover:border-[#0B46E8]/40 hover:shadow-[0_4px_16px_rgba(11,18,39,0.05)]"
    : "border border-dashed border-[#DCE3F0] bg-transparent";
  return (
    <div className={`flex flex-col rounded-2xl p-5 transition ${shell}`}>
      <DocRing ready={ready} />
      <p className="mt-3 text-[15px] font-bold text-[#191F28]">{title}</p>
      <div className="mt-0.5 flex items-center justify-between gap-2">
        <p className="break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{ready ? doneMsg : emptyMsg}</p>
        {ready ? (
          <Link href={previewHref} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg bg-[#F2F4F6] px-3.5 py-2 text-[12.5px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]">
            {t("미리보기", "Preview", "预览", "Xem trước", "プレビュー", "Pratinjau")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

// 히어로 원형 진행 링 — 흑백, 중앙에 전체 % + 스텝 수.
function HeroProgress({ pct, done, total }: { pct: number; done: number; total: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return (
    <div className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center md:h-[88px] md:w-[88px]">
      <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="36" cy="36" r={r} fill="none" stroke="#E5E8EB" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="#191F28"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-[16px] font-black tabular-nums text-[#191F28] md:text-[18px]">{pct}%</span>
        <span className="mt-1 text-[10px] font-semibold tabular-nums text-[#B0B8C1]">{done}/{total}</span>
      </div>
    </div>
  );
}

// 완성 상태 링 — 완료 시 파란 링 + 체크, 미완성은 빈 트랙.
function DocRing({ ready }: { ready: boolean }) {
  const color = "#0B46E8";
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0" aria-hidden>
      <circle cx="26" cy="26" r="20" fill="none" stroke="#EDF1FD" strokeWidth="5" />
      {ready ? (
        <>
          <circle cx="26" cy="26" r="20" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" transform="rotate(-90 26 26)" />
          <path d="M18.5 26.5 l4.5 4.5 l10 -11" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}
    </svg>
  );
}
