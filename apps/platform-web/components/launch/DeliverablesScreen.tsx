"use client";

// Career Launch 전체 결과물 페이지 — 4주 프로그램에서 만든 산출물을 한곳에.
// 진단·이력서·자기소개서·면접·최종 리포트. 이력서/자소서는 A4 썸네일 + 크게보기.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CircleNotch, Sparkle, Lightbulb, Target } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "./CareerLaunchHeader";
import { LaunchAmbientBackground } from "./LaunchAmbientBackground";
import { AplyFooter } from "../AplyFooter";
import { Reveal } from "../site/Reveal";
import { SectionTitle } from "./ui";
import { ResumeRender } from "./resume-render";
import { CoverRender } from "./cover-render";
import { fetchResumeData, hasResumeContent, type ResumeData } from "../../lib/launch/resume-data";
import { fetchCoverData, hasCoverContent, type CoverData } from "../../lib/launch/cover-data";
import { fetchProgress, type CareerProgress } from "../../lib/launch/progress-client";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLaunchT } from "../../lib/launch/i18n";

export function DeliverablesScreen() {
  const t = useLaunchT();
  const { isReady } = useAuthSession();
  const [resume, setResume] = useState<ResumeData>({});
  const [cover, setCover] = useState<CoverData>({});
  const [prog, setProg] = useState<CareerProgress | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    let alive = true;
    void (async () => {
      try {
        const [r, c, p] = await Promise.all([
          fetchResumeData().catch(() => ({ data: {} as ResumeData })),
          fetchCoverData().catch(() => ({ data: {} as CoverData })),
          fetchProgress().catch(() => null)
        ]);
        if (!alive) return;
        setResume(r.data ?? {});
        setCover(c.data ?? {});
        setProg(p);
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isReady]);

  const resumeReady = hasResumeContent(resume);
  const coverReady = hasCoverContent(cover);

  return (
    <div className="isolate flex min-h-screen flex-col bg-white">
      <LaunchAmbientBackground />
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-10">
          <Reveal>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">{t("결과물", "Deliverables", "成果", "Kết quả", "成果物", "Hasil")}</p>
              <h1 className="mt-2 break-keep text-[26px] font-black leading-[1.18] tracking-[-0.03em] text-[#191F28] md:text-[34px]">{t("4주 동안 만든 내 결과물", "Everything you built in 4 weeks", "4周内打造的成果", "Thành quả 4 tuần của bạn", "4週間で作った成果物", "Hasil yang kamu buat dalam 4 minggu")}</h1>
              <p className="mt-2.5 max-w-[560px] break-keep text-[14.5px] leading-relaxed text-[#4E5968] md:text-[15.5px]">{t("진단부터 이력서·자기소개서, 면접 준비까지 한곳에 모았어요. 실제 지원에 그대로 활용하세요.", "From diagnosis to your resume, cover letter, and interview prep — all in one place, ready for real applications.", "从诊断到简历、求职信和面试准备，全都集中于此，可直接用于实际投递。", "Từ chẩn đoán đến CV, thư giới thiệu và chuẩn bị phỏng vấn — tất cả một nơi, sẵn sàng để ứng tuyển.", "診断から履歴書・自己紹介書、面接準備まで一箇所に。実際の応募にそのまま使えます。", "Dari diagnosis hingga resume, surat lamaran, dan persiapan wawancara — semua di satu tempat, siap untuk melamar.")}</p>
            </div>
          </Reveal>

          <Reveal delayMs={80}>
          <div className="mt-9 flex flex-col gap-10">
            {/* 이력서 · 자기소개서 — A4 썸네일 */}
            <div>
              <SectionTitle sub={t("대화·편집으로 완성한 지원 서류", "Your application documents", "通过对话与编辑完成的申请文件", "Hồ sơ ứng tuyển bạn đã hoàn thành", "対話・編集で仕上げた応募書類", "Dokumen lamaran yang kamu selesaikan")}>{t("지원 서류", "Application documents", "申请文件", "Hồ sơ ứng tuyển", "応募書類", "Dokumen lamaran")}</SectionTitle>
              <div className="grid gap-5 sm:grid-cols-2">
                <DocCard
                  title={t("내 이력서", "My resume", "我的简历", "CV của tôi", "私の履歴書", "Resume saya")}
                  ready={loaded && resumeReady}
                  loading={!loaded}
                  editHref="/career-launch/resume-collect"
                  fullHref="/career-launch/resume-preview"
                  emptyLabel={t("2주차에서 작성해요", "Build it in Week 2", "在第2周撰写", "Viết ở Tuần 2", "Week 2で作成", "Susun di Minggu 2")}
                  t={t}
                >
                  <ResumeRender data={resume} />
                </DocCard>
                <DocCard
                  title={t("내 자기소개서", "My cover letter", "我的自我介绍书", "Thư giới thiệu của tôi", "私の自己紹介書", "Surat lamaran saya")}
                  ready={loaded && coverReady}
                  loading={!loaded}
                  editHref="/career-launch/cover-collect"
                  fullHref="/career-launch/cover-preview"
                  emptyLabel={t("2주차에서 작성해요", "Write it in Week 2", "在第2周撰写", "Viết ở Tuần 2", "Week 2で作成", "Tulis di Minggu 2")}
                  t={t}
                >
                  <CoverRender data={cover} />
                </DocCard>
              </div>
            </div>

            {/* 취업 준비 프로필 — 4주간의 진단을 한 장으로(준비도 추이·강점·보완점·관심 직무) */}
            <div>
              <SectionTitle sub={t("4주 진단으로 정리한 나의 준비 상태", "Your readiness from the 4-week diagnosis", "4周诊断整理的准备状态", "Tình trạng sẵn sàng qua chẩn đoán 4 tuần", "4週間の診断でまとめた準備状態", "Kesiapan dari diagnosis 4 minggu")}>{t("취업 준비 프로필", "Job-readiness profile", "求职准备档案", "Hồ sơ sẵn sàng", "就職準備プロフィール", "Profil kesiapan kerja")}</SectionTitle>
              <ReadinessProfile prog={prog} t={t} />

              {/* 완성한 자산 → 실제 지원으로 */}
              <Link href="/talent/jobs" className="group mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[#E4EDFB] bg-gradient-to-br from-[#F5F8FF] to-[#EDF2FF] p-4 transition hover:border-[#0B46E8]/40">
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-[#0B1227]">{t("APLY에서 지원하기", "Apply on APLY", "在 APLY 投递", "Ứng tuyển trên APLY", "APLYで応募する", "Lamar di APLY")}</p>
                  <p className="mt-0.5 break-keep text-[12.5px] text-[#8B95A1]">{t("완성한 서류로 실제 공고에 지원", "Use your documents on real jobs", "用完成的文件投递真实职位", "Dùng hồ sơ cho việc làm thật", "完成した書類で実際の求人に応募", "Gunakan dokumenmu untuk lowongan nyata")}</p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#0B46E8] shadow-[0_2px_8px_rgba(11,70,232,0.12)] transition"><ArrowRight className="h-[18px] w-[18px]" weight="bold" aria-hidden /></span>
              </Link>
            </div>
          </div>
          </Reveal>
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}

// 서류 카드 — 준비되면 A4 썸네일 + 크게보기, 아니면 안내 + 작성하러 가기.
// 주차 페이지(week-docs)에서도 4주차 지원 서류 2컬럼에 동일하게 재사용한다.
export function DocCard({ title, ready, loading, editHref, fullHref, emptyLabel, children, t }: { title: string; ready: boolean; loading: boolean; editHref: string; fullHref: string; emptyLabel: string; children: React.ReactNode; t: ReturnType<typeof useLaunchT> }) {
  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-[#FAFBFC] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[14.5px] font-bold text-[#191F28]">{title}</p>
        <Link href={editHref} className="text-[12.5px] font-bold text-[#0B46E8] transition hover:underline">
          {t("편집", "Edit", "编辑", "Sửa", "編集", "Edit")}
        </Link>
      </div>
      {loading ? (
        <div className="flex aspect-[210/297] items-center justify-center gap-2 rounded-lg border border-[#E5E8EB] bg-white text-[12.5px] text-[#B0B8C1]"><CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" aria-hidden /> {t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</div>
      ) : ready ? (
        <div className="relative mx-auto w-full max-w-[300px]">
          <div className="relative aspect-[210/297] overflow-hidden rounded-lg border border-[#E5E8EB] bg-white shadow-[0_2px_14px_rgba(11,18,39,0.06)]">
            {children}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/85 to-transparent" />
          </div>
          <Link href={fullHref} target="_blank" rel="noopener noreferrer" className="absolute inset-x-0 bottom-3 mx-auto flex w-max items-center gap-1 rounded-full border border-[#E5E8EB] bg-white px-4 py-2 text-[12.5px] font-bold text-[#191F28] shadow-[0_2px_10px_rgba(11,18,39,0.12)] transition hover:bg-[#F6F8FB]">
            {t("크게보기", "View larger", "放大查看", "Xem lớn hơn", "大きく見る", "Lihat lebih besar")} <ArrowUpRight className="h-3.5 w-3.5" weight="bold" aria-hidden />
          </Link>
        </div>
      ) : (
        <Link href={editHref} className="flex aspect-[210/297] max-w-[300px] mx-auto w-full flex-col items-center justify-center rounded-lg border border-dashed border-[#DCE3F0] bg-white p-6 text-center transition hover:border-[#0B46E8]/40">
          <span className="text-[26px] opacity-30">📄</span>
          <p className="mt-2 text-[13px] font-semibold text-[#8B95A1]">{emptyLabel}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-bold text-[#0B46E8]">{t("작성하러 가기", "Start writing", "去撰写", "Bắt đầu viết", "作成しに行く", "Mulai menulis")} <ArrowRight className="h-3.5 w-3.5" weight="bold" /></p>
        </Link>
      )}
    </div>
  );
}

// 취업 준비 프로필 — 진단 결과(준비도 추이·강점·보완점·관심 직무)를 이력서·자기소개서와 동급의 결과물로 한 장에.
function ReadinessProfile({ prog, t }: { prog: CareerProgress | null; t: ReturnType<typeof useLaunchT> }) {
  const diag = prog?.diagnosis ?? null;

  // 진단 전 — 비어있는 상태.
  if (!diag) {
    return (
      <div className="rounded-2xl border border-dashed border-[#DDE3EA] bg-[#FAFBFC] p-6 text-center">
        <p className="text-[14px] font-bold text-[#191F28]">{t("아직 취업 준비 프로필이 없어요", "No readiness profile yet", "还没有求职准备档案", "Chưa có hồ sơ sẵn sàng", "まだ準備プロフィールがありません", "Belum ada profil kesiapan")}</p>
        <p className="mx-auto mt-1.5 max-w-[300px] break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{t("1주차 진단을 마치면 준비도·강점·보완점이 여기에 정리돼요.", "Finish the Week 1 diagnosis and your readiness, strengths, and gaps appear here.", "完成第1周诊断后，准备度、优势与不足会整理在这里。", "Hoàn thành chẩn đoán Tuần 1 để xem mức độ sẵn sàng, điểm mạnh và điểm cần cải thiện tại đây.", "Week 1の診断を終えると、準備度・強み・改善点がここにまとまります。", "Selesaikan diagnosis Minggu 1, kesiapan, kekuatan, dan kekurangan muncul di sini.")}</p>
        <Link href="/career-launch/diagnosis" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#0B46E8] px-4 py-2 text-[13px] font-bold text-white transition hover:bg-[#0A3ECF]">
          {t("진단 시작하기", "Start diagnosis", "开始诊断", "Bắt đầu chẩn đoán", "診断を始める", "Mulai diagnosis")}
          <ArrowRight className="h-4 w-4" weight="bold" aria-hidden />
        </Link>
      </div>
    );
  }

  const initPct = prog?.diagnosisInitial?.percent;
  const finalPct = prog?.diagnosisFinal?.percent;
  const current = finalPct ?? diag.percent;
  const delta = finalPct != null && initPct != null ? finalPct - initPct : null;
  const strengths = (diag.strengths ?? []).filter((s) => s?.trim()).slice(0, 3);
  const improvements = (diag.improvements ?? []).filter((s) => s?.trim()).slice(0, 3);
  const jobs = (prog?.selectedJobs ?? []).filter((j) => j?.trim()).slice(0, 6);

  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-[#FAFBFC] p-5">
      {/* 준비도 — 큰 숫자 + 추이 + 게이지 */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-bold text-[#8B95A1]">{t("취업 준비도", "Job readiness", "求职准备度", "Mức độ sẵn sàng", "就職準備度", "Kesiapan kerja")}</p>
        <Link href="/career-launch/diagnosis" className="shrink-0 text-[12px] font-bold text-[#0B46E8] transition hover:underline">{t("다시 진단", "Re-check", "重新诊断", "Kiểm tra lại", "再診断", "Cek lagi")}</Link>
      </div>
      <div className="mt-1.5 flex items-center gap-2.5">
        <span className="text-[38px] font-black leading-none text-[#0B46E8]">
          {current}
          <span className="text-[18px]">%</span>
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-bold text-[#191F28]">{diag.level}</p>
          {delta != null && delta > 0 ? (
            <p className="mt-0.5 text-[12px] font-bold text-[#0A9B59]">{t("사전", "Before", "初始", "Trước", "事前", "Awal")} {initPct}% → {t("현재", "Now", "现在", "Hiện tại", "現在", "Kini")} {current}% · ▲{delta}</p>
          ) : initPct != null ? (
            <p className="mt-0.5 text-[12px] text-[#8B95A1]">{t("사전 진단", "Initial diagnosis", "初始诊断", "Chẩn đoán ban đầu", "事前診断", "Diagnosis awal")} {initPct}%</p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[#EEF1F5]">
        <div className="h-full rounded-full bg-gradient-to-r from-[#5B8DEF] to-[#0B46E8]" style={{ width: `${Math.min(100, Math.max(0, current))}%` }} />
      </div>

      {/* 강점 · 보완점 */}
      {strengths.length > 0 || improvements.length > 0 ? (
        <div className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2">
          {strengths.length > 0 ? (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-[#191F28]">
                <Sparkle className="h-4 w-4 text-[#0A9B59]" weight="fill" aria-hidden />
                {t("강점", "Strengths", "优势", "Điểm mạnh", "強み", "Kekuatan")}
              </p>
              <ul className="space-y-1.5">
                {strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 break-keep text-[12.5px] leading-relaxed text-[#4E5968]">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#0A9B59]" aria-hidden />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {improvements.length > 0 ? (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-[#191F28]">
                <Lightbulb className="h-4 w-4 text-[#F0A020]" weight="fill" aria-hidden />
                {t("보완점", "To improve", "待提升", "Cần cải thiện", "改善点", "Perlu ditingkatkan")}
              </p>
              <ul className="space-y-1.5">
                {improvements.map((s, i) => (
                  <li key={i} className="flex gap-2 break-keep text-[12.5px] leading-relaxed text-[#4E5968]">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#F0A020]" aria-hidden />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* 관심 직무 — 프로그램 중 선정한 직무 방향 */}
      {jobs.length > 0 ? (
        <div className="mt-5 border-t border-[#EEF1F5] pt-4">
          <p className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-[#191F28]">
            <Target className="h-4 w-4 text-[#0B46E8]" weight="fill" aria-hidden />
            {t("관심 직무", "Target roles", "关注职务", "Vị trí quan tâm", "関心職務", "Peran incaran")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {jobs.map((j, i) => (
              <span key={i} className="inline-flex items-center rounded-full bg-[#EDF1FD] px-2.5 py-1 text-[12px] font-bold text-[#0B46E8]">
                {j}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
