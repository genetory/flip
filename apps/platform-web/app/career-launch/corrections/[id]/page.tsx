"use client";

// 면접 오답노트 상세 — 저장된 모의면접 한 건. 모달이 아니라 정식 페이지(GNB·앰비언트·푸터)로
// 다른 커리어런치 페이지와 동일한 셸. 카드형(items)은 결과 리스트로 오답노트 재도전까지.
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "../../../../components/launch/CareerLaunchHeader";
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
  // 네트워크 실패("error")와 기록 없음("notfound")을 구분해, 일시 오류를 "기록 없음"으로 오인하지 않게.
  const [phase, setPhase] = useState<"loading" | "ready" | "notfound" | "error">("loading");

  const load = useCallback(async () => {
    setPhase("loading");
    let prog;
    try {
      prog = await fetchProgress();
    } catch {
      setPhase("error");
      return;
    }
    const found = (prog?.postingInterviews ?? []).find((l) => l.id === id) ?? (prog?.basicInterviews ?? []).find((l) => l.id === id) ?? null;
    setLog(found);
    setPhase(found ? "ready" : "notfound");
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

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
      ? t("Step 3 · 기본 면접", "Step 3 · Basic interview", "Step 3 · 基础面试", "Step 3 · Phỏng vấn cơ bản", "Step 3 · 基本面接", "Step 3 · Wawancara dasar")
      : t("Step 4 · 공고별 모의면접", "Step 4 · Posting mock interview", "Step 4 · 公告模拟面试", "Step 4 · Phỏng vấn theo tin", "Step 4 · 求人別模擬面接", "Step 4 · Wawancara per lowongan");
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
    <div className="flex min-h-screen flex-col bg-white">
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-[880px] px-5 pt-6 md:pt-10">
          <Link href="/career-launch/corrections" className="inline-flex items-center gap-1 text-[15px] font-medium text-[color:var(--v2-faint)] transition hover:text-[color:var(--v2-ink-3)]">
            <CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {t("면접 오답노트", "Interview review notes", "面试错题本", "Sổ lỗi phỏng vấn", "面接の復習ノート", "Catatan koreksi wawancara")}
          </Link>

          {phase === "loading" ? (
            <p className="mt-8 text-[15px] text-[color:var(--v2-muted)]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p>
          ) : phase === "error" ? (
            <div className="mt-8">
              <p className="text-[15px] text-[color:var(--v2-muted)]">{t("불러오지 못했어요. 잠시 후 다시 시도해 주세요.", "Couldn't load. Please try again shortly.", "加载失败，请稍后重试。", "Không tải được. Thử lại sau.", "読み込めませんでした。少し後にお試しください。", "Gagal memuat. Coba lagi.")}</p>
              <button type="button" onClick={() => void load()} className="mt-3 inline-flex h-9 items-center rounded-lg bg-[color:var(--v2-band)] px-3.5 text-[14px] font-semibold text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-line)]">{t("다시 시도", "Retry", "重试", "Thử lại", "再試行", "Coba lagi")}</button>
            </div>
          ) : phase === "notfound" || !log ? (
            <p className="mt-8 text-[15px] text-[color:var(--v2-muted)]">{t("면접 기록을 찾을 수 없어요.", "Interview record not found.", "找不到面试记录。", "Không tìm thấy bản ghi.", "面接記録が見つかりません。", "Rekaman tidak ditemukan.")}</p>
          ) : (
            <>
              <div className="mt-3.5">
                <p className="text-[15px] font-semibold text-[color:var(--v2-muted)]">{eyebrow}</p>
                <h1 className="mt-1.5 break-keep text-[24px] font-bold leading-[1.38] tracking-[-0.02em] text-[color:var(--v2-ink)] md:text-[28px]">{label}</h1>
                {date ? <p className="mt-1 text-[14px] text-[color:var(--v2-faint)]">{date}</p> : null}
              </div>

              {items.length ? (
                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-[20px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">{t("면접 결과", "Interview results", "面试结果", "Kết quả phỏng vấn", "面接結果", "Hasil wawancara")}</p>
                    {avg != null ? <span className="rounded-full bg-[color:var(--v2-accent-weak)] px-2.5 py-1 text-[13px] font-bold text-[color:var(--v2-accent)]">{t("평균", "Avg", "平均", "TB", "平均", "Rata")} {avg}</span> : null}
                  </div>
                  <PostingResultList items={items} rescore={logRescore(log)} onItemsChange={updateItems} />
                </div>
              ) : log.messages?.length ? (
                <div className="mt-5 space-y-4 rounded-3xl bg-[color:var(--v2-band)] p-4 md:p-5">
                  {log.messages.map((m, i) =>
                    m.role === "bot" ? (
                      <div key={i} className="flex items-end gap-2">
                        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white text-[15px]">🎤</span>
                        <div className="max-w-[84%] whitespace-pre-wrap break-keep rounded-2xl rounded-bl-md bg-white px-4 py-3 text-[15px] leading-[1.6] text-[color:var(--v2-ink)]"><RichText text={m.text} /></div>
                      </div>
                    ) : (
                      <div key={i} className="flex justify-end">
                        <div className="max-w-[84%] whitespace-pre-wrap break-keep rounded-2xl rounded-br-md bg-[color:var(--v2-accent)] px-4 py-3 text-[15px] leading-[1.6] text-white"><RichText text={m.text} /></div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="mt-8 text-center text-[15px] text-[color:var(--v2-muted)]">{t("표시할 내용이 없어요.", "Nothing to show.", "无内容可显示。", "Không có nội dung.", "表示する内容がありません。", "Tidak ada yang ditampilkan.")}</p>
              )}
            </>
          )}
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}
