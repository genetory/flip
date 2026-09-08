"use client";

// 나의 결과물 — 이력서·자기소개서를 실제 A4 미니 프리뷰 2컬럼으로 보여주고,
// 위에는 목표 직무, 아래에는 면접 준비 요약. 프리뷰 컴포넌트는 컨테이너 폭에 맞춰 자동 스케일.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, PencilSimpleLine, Microphone, Target } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { AplyFooter } from "../../../components/AplyFooter";
import { DashboardSection, ErrorState, CardSkeleton } from "../../../components/launch/dashboard-states";
import { ResumePreview } from "../../../components/resume-maker/ResumePreview";
import { DEFAULT_DESIGN } from "../../../lib/resume-maker-types";
import { toResumeContent } from "../../../components/launch/resume-render";
import { CoverRender } from "../../../components/launch/cover-render";
import { fetchResumeData, hasResumeContent, type ResumeData } from "../../../lib/launch/resume-data";
import { fetchCoverData, hasCoverContent, type CoverData } from "../../../lib/launch/cover-data";
import { fetchResumeScore, fetchCoverScore } from "../../../lib/launch/feedback-client";
import { fetchProgress } from "../../../lib/launch/progress-client";
import { useLaunchT } from "../../../lib/launch/i18n";

type LaunchT = ReturnType<typeof useLaunchT>;

function scoreVar(s: number): string {
  return s >= 75 ? "#0A9B59" : s >= 50 ? "#0B46E8" : "#C77700";
}

function DocCard({
  label,
  score,
  empty,
  emptyHint,
  openHref,
  editHref,
  preview,
  t
}: {
  label: string;
  score: number | null;
  empty: boolean;
  emptyHint: string;
  openHref: string;
  editHref: string;
  preview: React.ReactNode;
  t: LaunchT;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_-6px_rgba(20,24,31,0.18)]">
      {/* A4 미니 프리뷰 */}
      <Link href={openHref} target="_blank" rel="noopener noreferrer" className="relative block h-[260px] overflow-hidden border-b border-[#EEF1F5] bg-[#F4F6F9]">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <span className="text-[26px]" aria-hidden>📄</span>
            <p className="break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{emptyHint}</p>
          </div>
        ) : (
          <>
            <div className="p-3">{preview}</div>
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#F4F6F9] to-transparent" />
          </>
        )}
      </Link>
      {/* 하단 정보 */}
      <div className="flex items-center justify-between gap-2 p-4">
        <div className="min-w-0">
          <p className="text-[14px] font-black text-[#191F28]">{label}</p>
          {score != null ? (
            <span className="mt-1 inline-flex items-baseline gap-0.5 text-[12px] font-black tabular-nums" style={{ color: scoreVar(score) }}>{score}<span className="text-[10px] font-bold text-[#B0B8C1]">/100</span></span>
          ) : (
            <span className="mt-1 block text-[12px] font-semibold text-[#8B95A1]">{empty ? t("아직 작성 전", "Not started", "尚未开始", "Chưa bắt đầu", "未作成", "Belum mulai") : t("작성됨", "Written", "已撰写", "Đã viết", "作成済み", "Sudah ditulis")}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link href={editHref} className="inline-flex items-center gap-1 rounded-lg border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]"><PencilSimpleLine className="h-3.5 w-3.5" weight="bold" /> {t("수정", "Edit", "修改", "Sửa", "編集", "Edit")}</Link>
          <Link href={openHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-[#0B46E8] px-3 py-1.5 text-[12px] font-bold text-white transition hover:bg-[#0A3ECB]">{t("열기", "Open", "打开", "Mở", "開く", "Buka")} <ArrowUpRight className="h-3.5 w-3.5" weight="bold" /></Link>
        </div>
      </div>
    </div>
  );
}

export default function DeliverablesPage() {
  const t = useLaunchT();
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [resume, setResume] = useState<ResumeData>({});
  const [cover, setCover] = useState<CoverData>({});
  const [rScore, setRScore] = useState<number | null>(null);
  const [cScore, setCScore] = useState<number | null>(null);
  const [targetJob, setTargetJob] = useState<string>("");
  const [iv, setIv] = useState<{ avg: number; count: number } | null>(null);

  const load = () => {
    setPhase("loading");
    void Promise.all([
      fetchResumeData().catch(() => ({ data: {} as ResumeData })),
      fetchCoverData().catch(() => ({ data: {} as CoverData })),
      fetchResumeScore({ generate: false }).catch(() => ({ score: null })),
      fetchCoverScore({ generate: false }).catch(() => ({ score: null })),
      fetchProgress().catch(() => null)
    ])
      .then(([r, c, rs, cs, prog]) => {
        setResume(r.data ?? {});
        setCover(c.data ?? {});
        setRScore(rs.score?.total ?? null);
        setCScore(cs.score?.total ?? null);
        setTargetJob(typeof prog?.targetJob === "string" ? prog.targetJob : "");
        // 기본(내 서류) + 공고별 면접 모두 포함.
        const logs = [...(Array.isArray(prog?.basicInterviews) ? prog!.basicInterviews! : []), ...(Array.isArray(prog?.postingInterviews) ? prog!.postingInterviews! : [])];
        const items = logs.flatMap((l) => l.items ?? []).filter((it) => typeof it.score === "number");
        setIv(items.length ? { avg: Math.round(items.reduce((s, it) => s + it.score, 0) / items.length), count: items.length } : null);
        setPhase("ready");
      })
      .catch(() => setPhase("error"));
  };
  useEffect(load, []);

  const resumeEmpty = !hasResumeContent(resume);
  const coverEmpty = !hasCoverContent(cover);

  return (
    <div className="cl-surface flex min-h-screen flex-col bg-[#F1F1F4]">
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-8">
          <p className="cl-eyebrow">Career Launch</p>
          <h1 className="cl-display mt-1.5">{t("나의 결과물", "My deliverables", "我的成果", "Kết quả của tôi", "私の成果物", "Hasil saya")}</h1>
          <p className="cl-lead mt-2.5 max-w-[52ch]">{t("4주 동안 만든 이력서·자기소개서와 면접 준비 결과를 한곳에서 확인해요.", "See the resume, cover letter, and interview prep you built over four weeks, all in one place.", "在一处查看你4周里完成的简历、自我介绍书和面试准备成果。", "Xem CV, thư giới thiệu và chuẩn bị phỏng vấn bạn đã làm trong 4 tuần, tại một nơi.", "4週間で作った履歴書・自己紹介書と面接準備の成果を一か所で確認します。", "Lihat resume, surat lamaran, dan persiapan wawancara yang kamu buat selama 4 minggu, di satu tempat.")}</p>

          {targetJob ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--cl-accent-soft)] px-3.5 py-1.5">
              <Target className="h-4 w-4 text-[#0B46E8]" weight="fill" aria-hidden />
              <span className="text-[13px] font-bold text-[#0B46E8]">{t(`목표 직무 · ${targetJob}`, `Target role · ${targetJob}`, `目标职务 · ${targetJob}`, `Nghề mục tiêu · ${targetJob}`, `目標職種 · ${targetJob}`, `Peran target · ${targetJob}`)}</span>
            </div>
          ) : null}

          <hr className="cl-rule mt-5" />

          {phase === "loading" ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <CardSkeleton height={340} />
              <CardSkeleton height={340} />
            </div>
          ) : phase === "error" ? (
            <div className="mt-6"><ErrorState onRetry={load} /></div>
          ) : (
            <div className="mt-6 flex flex-col gap-7">
              {/* 지원 서류 — 2컬럼 문서 프리뷰 */}
              <DashboardSection title={t("지원 서류", "Application documents", "申请材料", "Giấy tờ ứng tuyển", "応募書類", "Dokumen lamaran")} sub={t("실제 지원할 이력서·자기소개서", "The resume & cover letter you'll apply with", "实际投递的简历与自我介绍", "CV & thư để ứng tuyển", "実際に応募する履歴書・自己紹介書", "Resume & surat untuk melamar")}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <DocCard
                    t={t}
                    label={t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")}
                    score={rScore}
                    empty={resumeEmpty}
                    emptyHint={t("2주차에서 이력서를 작성하면 여기에 미리보기가 나타나요.", "Build your resume in Week 2 to see a preview here.", "在第2周撰写简历后，这里会显示预览。", "Tạo CV ở tuần 2 để xem bản xem trước tại đây.", "2週目で履歴書を作成するとここにプレビューが表示されます。", "Buat resume di Minggu 2 untuk melihat pratinjau di sini.")}
                    openHref="/career-launch/resume-preview"
                    editHref="/career-launch/resume-collect"
                    preview={<ResumePreview content={toResumeContent(resume)} design={DEFAULT_DESIGN} preserveOrder />}
                  />
                  <DocCard
                    t={t}
                    label={t("자기소개서", "Cover letter", "自我介绍书", "Thư giới thiệu", "自己紹介書", "Surat lamaran")}
                    score={cScore}
                    empty={coverEmpty}
                    emptyHint={t("2주차에서 자기소개서를 작성하면 여기에 미리보기가 나타나요.", "Write your cover letter in Week 2 to see a preview here.", "在第2周撰写自我介绍后，这里会显示预览。", "Viết thư giới thiệu ở tuần 2 để xem bản xem trước tại đây.", "2週目で自己紹介書を作成するとここにプレビューが表示されます。", "Tulis surat lamaran di Minggu 2 untuk melihat pratinjau di sini.")}
                    openHref="/career-launch/cover-preview"
                    editHref="/career-launch/cover-collect"
                    preview={<CoverRender data={cover} />}
                  />
                </div>
              </DashboardSection>

              {/* 면접 준비 요약 */}
              <DashboardSection title={t("면접 준비", "Interview prep", "面试准备", "Chuẩn bị phỏng vấn", "面接準備", "Persiapan wawancara")} sub={t("모의면접 연습 결과", "Your mock interview results", "模拟面试结果", "Kết quả phỏng vấn thử", "模擬面接の結果", "Hasil wawancara simulasi")}>
                <div className="flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-[0_2px_12px_-6px_rgba(20,24,31,0.18)]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--cl-accent-soft)] text-[#0B46E8]"><Microphone className="h-5 w-5" weight="duotone" aria-hidden /></span>
                  <div className="min-w-0 flex-1">
                    {iv ? (
                      <>
                        <p className="text-[14px] font-black text-[#191F28]">{t(`평균 ${iv.avg}점 · ${iv.count}문항 연습`, `Avg ${iv.avg} · ${iv.count} questions`, `平均 ${iv.avg}分 · 练习 ${iv.count} 题`, `TB ${iv.avg} · ${iv.count} câu`, `平均 ${iv.avg}点 · ${iv.count}問`, `Rata ${iv.avg} · ${iv.count} soal`)}</p>
                        <p className="mt-0.5 text-[12px] text-[#8B95A1]">{t("면접 히스토리와 피드백을 확인해요.", "Review your interview history and feedback.", "查看面试记录与反馈。", "Xem lịch sử và phản hồi phỏng vấn.", "面接履歴とフィードバックを確認します。", "Lihat riwayat dan umpan balik wawancara.")}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[14px] font-black text-[#191F28]">{t("아직 모의면접 기록이 없어요", "No mock interviews yet", "还没有模拟面试记录", "Chưa có phỏng vấn thử", "まだ模擬面接の記録がありません", "Belum ada wawancara simulasi")}</p>
                        <p className="mt-0.5 text-[12px] text-[#8B95A1]">{t("3주차에서 모의면접을 연습해 보세요.", "Practice mock interviews in Week 3.", "在第3周练习模拟面试。", "Luyện phỏng vấn thử ở tuần 3.", "3週目で模擬面接を練習しましょう。", "Berlatih wawancara di Minggu 3.")}</p>
                      </>
                    )}
                  </div>
                  <Link href={iv ? "/career-launch/corrections" : "/career-launch/program?week=3"} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#0B46E8] px-3.5 py-2 text-[12.5px] font-bold text-white transition hover:bg-[#0A3ECB]">{iv ? t("오답노트", "Review notes", "错题本", "Sổ lỗi", "復習ノート", "Catatan") : t("연습하기", "Practice", "练习", "Luyện", "練習", "Berlatih")} <ArrowRight className="h-3.5 w-3.5" weight="bold" /></Link>
                </div>
              </DashboardSection>
            </div>
          )}
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}
