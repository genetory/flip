"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { STUDENT, WEEKS } from "../../../lib/launch/data";
import { Card, Pill, ProgressBar, SectionTitle } from "../../../components/launch/ui";
import { EnrollmentGate } from "../../../components/launch/enrollment-gate";
import { FinalFeedbackCard } from "../../../components/launch/final-feedback";
import { ResumeRender } from "../../../components/launch/resume-render";
import { CoverRender } from "../../../components/launch/cover-render";
import { fetchProgress, fetchWeekSchedule, type WeekScheduleEntry } from "../../../lib/launch/progress-client";
import { fetchResumeData, hasResumeContent } from "../../../lib/launch/resume-data";
import { fetchCoverData, hasCoverContent } from "../../../lib/launch/cover-data";
import { weekDoneCount, weekUnlocked, type LaunchData } from "../../../lib/launch/step-status";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { useLaunchT } from "../../../lib/launch/i18n";
import { useWeekText, useCompletionCriteria, useStudentCohort } from "../../../lib/launch/data-i18n";
import { trackCareerFunnel } from "../../../lib/analytics";

// 4. 학생 로그인 후 대시보드 — 4주 여정 퍼널 + 진행 + 결과물 + 피드백 개요.
export default function LaunchDashboardPage() {
  const t = useLaunchT();
  const weekText = useWeekText();
  const completionCriteria = useCompletionCriteria();
  const studentCohort = useStudentCohort();
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

  const [data, setData] = useState<LaunchData>({ progress: {}, resume: {}, cover: {} });
  const [schedule, setSchedule] = useState<WeekScheduleEntry[]>([]);
  const [serverNow, setServerNow] = useState<Date>(() => new Date(0)); // 스케줄 로드 전엔 과거로 둬서 날짜 오픈 미판정
  useEffect(() => {
    if (!isReady) return;
    let alive = true;
    void (async () => {
      try {
        const [p, r, c, sched] = await Promise.all([
          fetchProgress(),
          fetchResumeData().catch(() => ({ data: {} })),
          fetchCoverData().catch(() => ({ data: {} })),
          fetchWeekSchedule().catch(() => ({ weekSchedule: [] as WeekScheduleEntry[], serverNow: new Date().toISOString() }))
        ]);
        if (alive) {
          setData({ progress: p, resume: r.data ?? {}, cover: c.data ?? {} });
          setSchedule(sched.weekSchedule);
          setServerNow(new Date(sched.serverNow));
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

  if (!isReady || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="text-[13px] text-[#8B95A1]">{t("불러오는 중...", "Loading...", "加载中...", "Đang tải...", "読み込み中...", "Memuat...")}</span>
      </main>
    );
  }

  return (
    <EnrollmentGate>
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-6xl px-5 pt-6 md:pt-10">
          {/* 운영자는 학생 화면을 본인 계정으로 전부 체험할 수 있음 — 콘솔 복귀 링크 */}
          {user?.role === "OPERATOR" ? (
            <Link href="/career-launch/ops/students" className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-[#F0B429]/40 bg-[#FFF9EC] px-3 py-1.5 text-[12.5px] font-bold text-[#B7791F] transition hover:bg-[#FEF3D6]">
              {t("← 운영자 콘솔 · 지금은 학생 화면 체험 중", "← Operator console · Now previewing the student view", "← 运营者控制台 · 当前正在预览学生页面", "← Bảng điều khiển quản trị · Đang xem thử giao diện học viên", "← 運営者コンソール · 現在は学生画面をプレビュー中", "← Konsol operator · Sedang melihat tampilan siswa")}
            </Link>
          ) : null}
          {/* 인사 + 전체 진행률 (완주 시 축하 히어로로 전환) */}
          {overall === 100 ? (
            <Card className="!border-[#A6EF3F] !bg-[#B7FF5A] md:!p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12.5px] font-bold text-[#3A6B00]">{t("🎉 4주 프로그램 완주", "🎉 4-week program complete", "🎉 完成4周项目", "🎉 Hoàn thành chương trình 4 tuần", "🎉 4週間プログラム完走", "🎉 Menyelesaikan program 4 minggu")}</p>
                  <h1 className="mt-1 text-[22px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[27px]">{t(`${displayName}님, 완주를 축하해요! 🎉`, `Congrats on finishing, ${displayName}! 🎉`, `${displayName}，恭喜你顺利完成！🎉`, `Chúc mừng bạn đã hoàn thành, ${displayName}! 🎉`, `${displayName}さん、完走おめでとうございます！🎉`, `Selamat telah menyelesaikan, ${displayName}! 🎉`)}</h1>
                  <p className="mt-1.5 break-keep text-[14px] leading-relaxed text-[#4E5968]">{t("이력서·자기소개서를 완성하고 면접 준비까지 마쳤어요. 이제 자신 있게 지원해봐요!", "You've finished your resume and cover letter, and prepped for interviews. Now apply with confidence!", "你已完成简历和求职信，也做好了面试准备。现在充满信心地去投递吧！", "Bạn đã hoàn thành hồ sơ và thư tự giới thiệu, và chuẩn bị xong cho phỏng vấn. Giờ hãy tự tin ứng tuyển nhé!", "履歴書・自己紹介書を完成させ、面接準備まで終えました。これからは自信を持って応募しましょう！", "Kamu sudah menyelesaikan resume dan cover letter, serta menyiapkan wawancara. Sekarang lamar dengan percaya diri!")}</p>
                </div>
                <Pill tone="green">{t("수료 완료", "Completed", "已结业", "Đã hoàn thành", "修了", "Selesai")}</Pill>
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white p-4 md:mt-6 md:p-5">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[#EAFFD1] text-[22px]">🏁</span>
                <div>
                  <p className="text-[14px] font-black text-[#0B1227]">{t("전체 진행률 100% · 모든 스텝 완료", "Overall progress 100% · All steps complete", "总进度100% · 所有步骤完成", "Tiến độ tổng thể 100% · Hoàn thành mọi bước", "全体進捗100% · すべてのステップ完了", "Progres keseluruhan 100% · Semua langkah selesai")}</p>
                  <p className="mt-0.5 text-[12px] text-[#8B95A1]">{t(`완료한 스텝 ${doneSteps}/${totalSteps}`, `Steps completed ${doneSteps}/${totalSteps}`, `已完成步骤 ${doneSteps}/${totalSteps}`, `Bước đã hoàn thành ${doneSteps}/${totalSteps}`, `完了したステップ ${doneSteps}/${totalSteps}`, `Langkah selesai ${doneSteps}/${totalSteps}`)}</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="md:!p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-[#8B95A1]">{studentCohort()}</p>
                  <h1 className="mt-1 text-[22px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[27px]">{t(`${displayName}님, 반가워요 👋`, `Welcome, ${displayName} 👋`, `${displayName}，欢迎你 👋`, `Chào mừng bạn, ${displayName} 👋`, `${displayName}さん、ようこそ 👋`, `Selamat datang, ${displayName} 👋`)}</h1>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-[#4E5968]">{t("4주 동안 이력서·자기소개서를 완성하고 면접까지 준비해요.", "Over 4 weeks, you'll complete your resume and cover letter, and prepare for interviews.", "在4周内完成简历和求职信，并准备好面试。", "Trong 4 tuần, bạn sẽ hoàn thành hồ sơ và thư tự giới thiệu, và chuẩn bị cho phỏng vấn.", "4週間で履歴書・自己紹介書を完成させ、面接まで準備します。", "Selama 4 minggu, kamu akan menyelesaikan resume dan cover letter, serta menyiapkan wawancara.")}</p>
                </div>
                <Pill tone="blue">{t(`${doneSteps}/${totalSteps} 스텝`, `${doneSteps}/${totalSteps} steps`, `${doneSteps}/${totalSteps} 步骤`, `${doneSteps}/${totalSteps} bước`, `${doneSteps}/${totalSteps} ステップ`, `${doneSteps}/${totalSteps} langkah`)}</Pill>
              </div>
              <div className="mt-5 rounded-2xl bg-[#F6F8FB] p-4 md:mt-6 md:p-5">
                <div className="mb-2.5 flex items-end justify-between">
                  <div>
                    <p className="text-[13px] font-bold text-[#333D4B]">{t("전체 진행률", "Overall progress", "总进度", "Tiến độ tổng thể", "全体進捗", "Progres keseluruhan")}</p>
                    <p className="mt-0.5 text-[12px] text-[#8B95A1]">{t(`완료한 스텝 ${doneSteps}/${totalSteps}`, `Steps completed ${doneSteps}/${totalSteps}`, `已完成步骤 ${doneSteps}/${totalSteps}`, `Bước đã hoàn thành ${doneSteps}/${totalSteps}`, `完了したステップ ${doneSteps}/${totalSteps}`, `Langkah selesai ${doneSteps}/${totalSteps}`)}</p>
                  </div>
                  <span className="text-[26px] font-black leading-none text-[#0B46E8] md:text-[30px]">
                    {overall}<span className="text-[16px]">%</span>
                  </span>
                </div>
                <ProgressBar value={overall} height={12} />
              </div>
            </Card>
          )}

          {/* 다음 할 일 — 열려 있고 미완료인 첫 주차로 바로 이동 */}
          {overall < 100 && nextWeek ? (
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
          ) : null}

          {/* 완주 시 — 이력서·자소서·면접 종합 최종 피드백(프로그램 소개처럼 섹션) */}
          {overall === 100 ? (
            <div className="mt-7">
              <SectionTitle sub={t("이력서·자기소개서·면접을 종합한 코치 피드백", "Coach feedback across your resume, cover letter, and interview", "综合简历、求职信与面试的教练反馈", "Phản hồi từ coach tổng hợp hồ sơ, thư tự giới thiệu và phỏng vấn", "履歴書・自己紹介書・面接を総合したコーチのフィードバック", "Umpan balik coach dari resume, cover letter, dan wawancara")}>{t("최종 피드백", "Final feedback", "最终反馈", "Phản hồi cuối cùng", "最終フィードバック", "Umpan balik akhir")}</SectionTitle>
              <FinalFeedbackCard />
            </div>
          ) : null}

          <div className="mt-7 grid gap-7 md:mt-9 lg:grid-cols-[1.55fr_1fr] lg:gap-8">
            {/* ── 메인: 프로그램 소개 + 4주 여정 퍼널 ── */}
            <div className="min-w-0 space-y-7 md:space-y-8">
              {/* 프로그램 소개 */}
              <div>
                <SectionTitle>{t("프로그램 소개", "About the program", "项目介绍", "Giới thiệu chương trình", "プログラム紹介", "Tentang program")}</SectionTitle>
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
                <div className="space-y-2.5">
                  {WEEKS.map((w) => (
                    <Card key={w.week} className="flex items-start gap-3 !p-4">
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#EDF1FD] text-[18px]">{w.seminar.online ? "💻" : "📍"}</span>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-bold text-[#191F28]">{t(`Week ${w.week} 세미나`, `Week ${w.week} seminar`, `第${w.week}周研讨会`, `Hội thảo Tuần ${w.week}`, `Week ${w.week} セミナー`, `Seminar Minggu ${w.week}`)}</p>
                        <p className="mt-0.5 text-[12.5px] text-[#4E5968]">{w.seminar.date} · {w.seminar.time}</p>
                        <p className="text-[12px] text-[#8B95A1]">{w.seminar.place}</p>
                      </div>
                    </Card>
                  ))}
                </div>
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
        </div>
      </main>
      <Footer />
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
