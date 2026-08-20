"use client";

// Week 1 — Career Recommendation. Experience Bank 근거 추천 직무 TOP(fit%·강점·부족·하는일).
// "받기" 버튼식(생성 1회 캐시). 경험 채굴/진단 전이면 자체 숨김.
import { useEffect, useState } from "react";
import { Sparkle, CircleNotch, CaretDown } from "@phosphor-icons/react";
import { fetchJobRecommendation, type RecommendedRole } from "../../lib/launch/feedback-client";
import { Card } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";

function stars(fit: number): string {
  const n = Math.max(1, Math.min(5, Math.round(fit / 20)));
  return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
}

export function JobRecommendationCard() {
  const t = useLaunchT();
  const [state, setState] = useState<"loading" | "ready" | "done" | "none" | "error">("loading");
  const [jobs, setJobs] = useState<RecommendedRole[]>([]);
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<number | null>(0);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const r = await fetchJobRecommendation({ generate: false });
        if (!alive) return;
        if (r.unavailable) return setState("none");
        if (r.jobs) {
          setJobs(r.jobs);
          setStale(r.stale);
          setState("done");
        } else if (r.needsGenerate) setState("ready");
        else setState("none");
      } catch {
        if (alive) setState("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const run = async (force: boolean) => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const r = await fetchJobRecommendation({ generate: true, force });
      if (r.jobs) {
        setJobs(r.jobs);
        setStale(false);
        setState("done");
        setOpen(0);
      } else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  if (state === "none" || state === "loading") return null;

  return (
    <Card className="md:!p-6">
      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#0B46E8]">{t("추천 직무", "Recommended roles", "推荐职务", "Nghề gợi ý", "おすすめ職種", "Peran disarankan")}</p>

      {state === "ready" ? (
        <div className="mt-3 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2F4F6] text-[22px]" aria-hidden>🧭</span>
          <p className="mt-3 text-[15px] font-bold text-[#191F28]">{t("나에게 맞는 직무를 추천받아 보세요", "Get roles matched to you", "获取匹配你的推荐职务", "Nhận nghề phù hợp với bạn", "あなたに合う職種の推薦を受けましょう", "Dapatkan peran yang cocok untukmu")}</p>
          <p className="mx-auto mt-1 max-w-[420px] break-keep text-[13px] leading-relaxed text-[#8B95A1]">{t("정리한 경험을 분석해 적합도·강점·부족 역량까지 알려드려요.", "We analyze your experiences for fit, strengths, and gaps.", "分析你的经验，给出适合度、优势与欠缺能力。", "Phân tích kinh nghiệm để cho biết độ phù hợp, điểm mạnh và thiếu sót.", "経験を分析して適合度・強み・不足を提示します。", "Menganalisis pengalamanmu untuk kecocokan, kelebihan, dan kekurangan.")}</p>
          <button type="button" onClick={() => run(false)} disabled={busy} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#191F28] px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#0B1227] disabled:opacity-60">
            {busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="h-4 w-4" weight="fill" />}
            {busy ? t("분석 중…", "Analyzing…", "分析中…", "Đang phân tích…", "分析中…", "Menganalisis…") : t("직무 추천 받기", "Recommend roles", "获取职务推荐", "Gợi ý nghề", "職種の推薦を受ける", "Rekomendasi peran")}
          </button>
          {failed ? <p className="mt-2 text-[12px] font-semibold text-[#F04452]">{t("잠시 문제가 생겼어요. 잠시 후 다시 시도해 주세요.", "Something went wrong. Please try again in a moment.", "出现了一点问题，请稍后再试。", "Đã xảy ra sự cố. Vui lòng thử lại sau.", "問題が発生しました。少し後にもう一度お試しください。", "Terjadi masalah. Silakan coba lagi.")}</p> : null}
        </div>
      ) : null}

      {state === "done" ? (
        <div className="mt-4 flex flex-col gap-3">
          {stale ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FFF9EC] px-3 py-2">
              <span className="text-[12px] font-semibold text-[#B7791F]">{t("경험이 바뀌었어요. 다시 받아 갱신할 수 있어요.", "Your experiences changed. Refresh to update.", "经验已更新，可重新获取。", "Kinh nghiệm đã đổi. Nhận lại để cập nhật.", "経験が変わりました。再取得で更新できます。", "Pengalaman berubah. Ambil ulang.")}</span>
              <button type="button" onClick={() => run(true)} disabled={busy} className="rounded-lg bg-[#191F28] px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-60">{busy ? t("갱신 중…", "Refreshing…", "更新中…", "Đang cập nhật…", "更新中…", "Memperbarui…") : t("다시 받기", "Refresh", "重新获取", "Nhận lại", "再取得", "Ambil ulang")}</button>
            </div>
          ) : null}
          {jobs.map((j, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="overflow-hidden rounded-2xl border border-[#EEF1F5]">
                <button type="button" onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[#FAFBFC]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EDF1FD] text-[12px] font-black text-[#0B46E8]">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-bold text-[#191F28]">{j.role}</p>
                    <p className="mt-0.5 text-[12px] font-semibold text-[#F5A524]">{stars(j.fit)} <span className="text-[#8B95A1]">Fit {j.fit}%</span></p>
                  </div>
                  <CaretDown className={`h-4 w-4 shrink-0 text-[#C4CAD2] transition ${isOpen ? "rotate-180" : ""}`} weight="bold" />
                </button>
                {isOpen ? (
                  <div className="border-t border-[#F2F4F6] px-4 py-3.5">
                    {j.whatTheyDo ? <p className="break-keep text-[12.5px] leading-relaxed text-[#4E5968]">💼 {j.whatTheyDo}</p> : null}
                    {j.reason ? <p className="mt-2 break-keep text-[13px] leading-relaxed text-[#333D4B]">{j.reason}</p> : null}
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {j.strengths.length > 0 ? (
                        <div>
                          <p className="text-[11.5px] font-bold text-[#0A9B59]">{t("강점", "Strengths", "优势", "Điểm mạnh", "強み", "Kelebihan")}</p>
                          <ul className="mt-1 space-y-0.5">{j.strengths.map((s, k) => <li key={k} className="break-keep text-[12.5px] leading-relaxed text-[#333D4B]">· {s}</li>)}</ul>
                        </div>
                      ) : null}
                      {j.gaps.length > 0 ? (
                        <div>
                          <p className="text-[11.5px] font-bold text-[#C77700]">{t("부족한 역량", "Gaps", "欠缺", "Thiếu", "不足", "Kurang")}</p>
                          <ul className="mt-1 space-y-0.5">{j.gaps.map((s, k) => <li key={k} className="break-keep text-[12.5px] leading-relaxed text-[#333D4B]">· {s}</li>)}</ul>
                        </div>
                      ) : null}
                    </div>
                    {j.toPrepare.length > 0 ? (
                      <div className="mt-3 rounded-xl bg-[#F8FAFF] p-3">
                        <p className="text-[11.5px] font-bold text-[#0B46E8]">{t("앞으로 준비할 것", "To prepare", "接下来准备", "Cần chuẩn bị", "これから準備", "Perlu disiapkan")}</p>
                        <ul className="mt-1 space-y-0.5">{j.toPrepare.map((s, k) => <li key={k} className="break-keep text-[12.5px] leading-relaxed text-[#333D4B]">· {s}</li>)}</ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {state === "error" ? <p className="mt-3 text-[13px] text-[#8B95A1]">{t("추천을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.", "Couldn't load recommendations. Please try again.", "无法加载推荐，请稍后再试。", "Không thể tải gợi ý. Vui lòng thử lại.", "推薦を読み込めませんでした。", "Tidak dapat memuat rekomendasi.")}</p> : null}
    </Card>
  );
}
