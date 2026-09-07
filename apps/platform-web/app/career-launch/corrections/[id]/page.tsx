"use client";

// 면접 오답노트 상세 — 저장된 모의면접 한 건. 모달이 아니라 정식 페이지(GNB·앰비언트·푸터)로
// 다른 커리어런치 페이지와 동일한 셸. 카드형(items)은 결과 리스트로 오답노트 재도전까지.
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "../../../../components/launch/CareerLaunchHeader";
import { LaunchAmbientBackground } from "../../../../components/launch/LaunchAmbientBackground";
import { AplyFooter } from "../../../../components/AplyFooter";
import { RichText } from "../../../../components/launch/rich-text";
import { PostingResultList } from "../../../../components/launch/PostingResultList";
import { logRescore } from "../../../../lib/launch/interview-logs";
import { fetchProgress, patchProgress, type PostingInterviewLog, type PostingInterviewItem } from "../../../../lib/launch/progress-client";
import { useLaunchT } from "../../../../lib/launch/i18n";

export default function CorrectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useLaunchT();
  const { id } = use(params);
  const [log, setLog] = useState<PostingInterviewLog | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "notfound">("loading");

  useEffect(() => {
    let alive = true;
    void (async () => {
      const prog = await fetchProgress().catch(() => null);
      if (!alive) return;
      const found = (prog?.postingInterviews ?? []).find((l) => l.id === id) ?? (prog?.basicInterviews ?? []).find((l) => l.id === id) ?? null;
      setLog(found);
      setPhase(found ? "ready" : "notfound");
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const updateItems = (items: PostingInterviewItem[]) => {
    if (!log) return;
    const updated = { ...log, items };
    setLog(updated);
    void (async () => {
      const prog = await fetchProgress().catch(() => null);
      if (updated.source === "basic") {
        const arr = Array.isArray(prog?.basicInterviews) ? prog!.basicInterviews! : [];
        await patchProgress({ basicInterviews: arr.map((l) => (l.id === updated.id ? updated : l)) }).catch(() => {});
      } else {
        const arr = Array.isArray(prog?.postingInterviews) ? prog!.postingInterviews! : [];
        await patchProgress({ postingInterviews: arr.map((l) => (l.id === updated.id ? updated : l)) }).catch(() => {});
      }
    })();
  };

  const label = log ? [log.company, log.title].filter(Boolean).join(" · ") || t("모의면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi") : "";
  const eyebrow =
    log?.source === "basic"
      ? t("3주차 · 기본 면접", "Week 3 · Basic interview", "第3周 · 基础面试", "Tuần 3 · Phỏng vấn cơ bản", "Week 3 · 基本面接", "Minggu 3 · Wawancara dasar")
      : t("4주차 · 공고별 모의면접", "Week 4 · Posting mock interview", "第4周 · 公告模拟面试", "Tuần 4 · Phỏng vấn theo tin", "Week 4 · 求人別模擬面接", "Minggu 4 · Wawancara per lowongan");
  const date = log
    ? (() => {
        try {
          return new Date(log.at).toLocaleString();
        } catch {
          return "";
        }
      })()
    : "";
  const items = log?.items ?? [];
  const avg = items.length ? Math.round(items.reduce((s, it) => s + it.score, 0) / items.length) : null;

  return (
    <div className="isolate flex min-h-screen flex-col bg-white">
      <LaunchAmbientBackground />
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-10">
          <Link href="/career-launch/corrections" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
            <CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {t("면접 오답노트", "Interview review notes", "面试错题本", "Sổ lỗi phỏng vấn", "面接の復習ノート", "Catatan koreksi wawancara")}
          </Link>

          {phase === "loading" ? (
            <p className="mt-8 text-[13px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p>
          ) : phase === "notfound" || !log ? (
            <p className="mt-8 text-[13px] text-[#8B95A1]">{t("면접 기록을 찾을 수 없어요.", "Interview record not found.", "找不到面试记录。", "Không tìm thấy bản ghi.", "面接記録が見つかりません。", "Rekaman tidak ditemukan.")}</p>
          ) : (
            <>
              <div className="mt-3.5">
                <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">{eyebrow}</p>
                <h1 className="mt-1.5 break-keep text-[20px] font-black leading-[1.2] tracking-[-0.02em] text-[#191F28] md:text-[26px]">{label}</h1>
                {date ? <p className="mt-1.5 text-[12.5px] text-[#8B95A1]">{date}</p> : null}
              </div>

              {items.length ? (
                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-[14px] font-black text-[#191F28]">{t("면접 결과", "Interview results", "面试结果", "Kết quả phỏng vấn", "面接結果", "Hasil wawancara")}</p>
                    {avg != null ? <span className="rounded-full bg-[#EDF1FD] px-2.5 py-1 text-[12px] font-bold text-[#0B46E8]">{t("평균", "Avg", "平均", "TB", "平均", "Rata")} {avg}</span> : null}
                  </div>
                  <PostingResultList items={items} rescore={logRescore(log)} onItemsChange={updateItems} />
                </div>
              ) : log.messages?.length ? (
                <div className="mt-5 space-y-4 rounded-3xl border border-[#EEF1F5] bg-gradient-to-b from-[#F7F9FF] to-white p-4 md:p-5">
                  {log.messages.map((m, i) =>
                    m.role === "bot" ? (
                      <div key={i} className="flex items-end gap-2">
                        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[15px]">🎤</span>
                        <div className="max-w-[84%] whitespace-pre-wrap break-keep rounded-2xl rounded-bl-md bg-white px-4 py-3 text-[14px] leading-relaxed text-[#191F28] shadow-[0_1px_3px_rgba(17,24,39,0.06)]"><RichText text={m.text} /></div>
                      </div>
                    ) : (
                      <div key={i} className="flex justify-end">
                        <div className="max-w-[84%] whitespace-pre-wrap break-keep rounded-2xl rounded-br-md bg-[#0B46E8] px-4 py-3 text-[14px] leading-relaxed text-white shadow-[0_2px_8px_-2px_rgba(11,70,232,0.4)]"><RichText text={m.text} /></div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="mt-8 text-center text-[13px] text-[#8B95A1]">{t("표시할 내용이 없어요.", "Nothing to show.", "无内容可显示。", "Không có nội dung.", "表示する内容がありません。", "Tidak ada yang ditampilkan.")}</p>
              )}
            </>
          )}
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}
