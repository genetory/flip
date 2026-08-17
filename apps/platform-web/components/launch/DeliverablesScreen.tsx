"use client";

// Career Launch 전체 결과물 페이지 — 4주 프로그램에서 만든 산출물을 한곳에.
// 진단·이력서·자기소개서·면접·최종 리포트. 이력서/자소서는 A4 썸네일 + 크게보기.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "./CareerLaunchHeader";
import { AplyFooter } from "../AplyFooter";
import { Reveal } from "../site/Reveal";
import { SectionTitle } from "./ui";
import { ResumeRender } from "./resume-render";
import { CoverRender } from "./cover-render";
import { fetchResumeData, hasResumeContent, type ResumeData } from "../../lib/launch/resume-data";
import { fetchCoverData, hasCoverContent, type CoverData } from "../../lib/launch/cover-data";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLaunchT } from "../../lib/launch/i18n";

export function DeliverablesScreen() {
  const t = useLaunchT();
  const { isReady } = useAuthSession();
  const [resume, setResume] = useState<ResumeData>({});
  const [cover, setCover] = useState<CoverData>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    let alive = true;
    void (async () => {
      try {
        const [r, c] = await Promise.all([fetchResumeData().catch(() => ({ data: {} as ResumeData })), fetchCoverData().catch(() => ({ data: {} as CoverData }))]);
        if (!alive) return;
        setResume(r.data ?? {});
        setCover(c.data ?? {});
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
    <div className="flex min-h-screen flex-col bg-white">
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
                  emptyLabel={t("3주차에서 작성해요", "Write it in Week 3", "在第3周撰写", "Viết ở Tuần 3", "Week 3で作成", "Tulis di Minggu 3")}
                  t={t}
                >
                  <CoverRender data={cover} />
                </DocCard>
              </div>
            </div>

            {/* 그 외 결과물 — 진단 · 면접 · 최종 리포트 */}
            <div>
              <SectionTitle sub={t("주차별로 완성한 결과와 리포트", "Results and reports from each week", "各周完成的结果与报告", "Kết quả và báo cáo mỗi tuần", "各週で完成した結果とレポート", "Hasil dan laporan tiap minggu")}>{t("진단 · 면접 · 리포트", "Diagnosis · Interview · Report", "诊断·面试·报告", "Chẩn đoán · Phỏng vấn · Báo cáo", "診断・面接・レポート", "Diagnosis · Wawancara · Laporan")}</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                <LinkCard emoji="🧭" href="/career-launch/diagnosis" title={t("취업 준비 진단", "Job-readiness diagnosis", "求职准备诊断", "Chẩn đoán mức độ sẵn sàng", "就職準備診断", "Diagnosis kesiapan kerja")} desc={t("1주차 · 준비도와 직무 방향", "Week 1 · Readiness & direction", "第1周 · 准备度与方向", "Tuần 1 · Mức độ sẵn sàng & định hướng", "Week 1 · 準備度と方向性", "Minggu 1 · Kesiapan & arah")} />
                <LinkCard emoji="🎤" href="/career-launch/interview" title={t("모의면접 준비", "Mock interview prep", "模拟面试准备", "Chuẩn bị phỏng vấn thử", "模擬面接準備", "Persiapan wawancara")} desc={t("4주차 · 유형별 예상 질문·피드백", "Week 4 · Questions & feedback by type", "第4周 · 分类型问题与反馈", "Tuần 4 · Câu hỏi & phản hồi theo loại", "Week 4 · タイプ別質問・フィードバック", "Minggu 4 · Pertanyaan & umpan balik per jenis")} />
                <LinkCard emoji="📊" href="/career-launch/diagnosis?final=1" title={t("최종 수료 리포트", "Final completion report", "最终结业报告", "Báo cáo hoàn thành", "最終修了レポート", "Laporan kelulusan akhir")} desc={t("완주 · 종합 진단과 다음 단계", "Completion · Overall diagnosis & next steps", "结业 · 综合诊断与后续", "Hoàn thành · Chẩn đoán tổng thể & bước tiếp", "修了 · 総合診断と次のステップ", "Selesai · Diagnosis menyeluruh & langkah berikut")} />
                <LinkCard emoji="🔎" href="/talent/jobs" title={t("APLY에서 지원하기", "Apply on APLY", "在 APLY 投递", "Ứng tuyển trên APLY", "APLYで応募する", "Lamar di APLY")} desc={t("완성한 서류로 실제 공고에 지원", "Use your documents on real jobs", "用完成的文件投递真实职位", "Dùng hồ sơ cho việc làm thật", "完成した書類で実際の求人に応募", "Gunakan dokumenmu untuk lowongan nyata")} />
              </div>
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
        <div className="flex aspect-[210/297] items-center justify-center rounded-lg border border-[#E5E8EB] bg-white text-[12.5px] text-[#B0B8C1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</div>
      ) : ready ? (
        <div className="relative mx-auto w-full max-w-[300px]">
          <div className="relative aspect-[210/297] overflow-hidden rounded-lg border border-[#E5E8EB] bg-white shadow-[0_2px_14px_rgba(11,18,39,0.06)]">
            {children}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/85 to-transparent" />
          </div>
          <Link href={fullHref} target="_blank" rel="noopener noreferrer" className="absolute inset-x-0 bottom-3 mx-auto flex w-max items-center gap-1 rounded-full border border-[#E5E8EB] bg-white px-4 py-2 text-[12.5px] font-bold text-[#191F28] shadow-[0_2px_10px_rgba(11,18,39,0.12)] transition hover:bg-[#F6F8FB]">
            {t("크게보기", "View larger", "放大查看", "Xem lớn hơn", "大きく見る", "Lihat lebih besar")} ↗
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

function LinkCard({ emoji, href, title, desc, external }: { emoji: string; href: string; title: string; desc: string; external?: boolean }) {
  const inner = (
    <>
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-[#F2F4F6] text-[19px]">{emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-bold text-[#191F28]">{title}</p>
        <p className="mt-0.5 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{desc}</p>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#C4CAD2]" weight="bold" />
    </>
  );
  const cls = "flex items-start gap-3.5 rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#0B46E8]/30 hover:bg-[#F7F9FF]";
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
  ) : (
    <Link href={href} className={cls}>{inner}</Link>
  );
}
