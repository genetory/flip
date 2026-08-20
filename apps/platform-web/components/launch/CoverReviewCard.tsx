"use client";

// Week 3 — Cover Review. Generic Expression Check + Recruiter Red Team. "받기" 캐시.
import { useEffect, useState } from "react";
import { Sparkle, CircleNotch } from "@phosphor-icons/react";
import { fetchCoverReview, type CoverReview } from "../../lib/launch/feedback-client";
import { Card } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";

export function CoverReviewCard() {
  const t = useLaunchT();
  const [state, setState] = useState<"loading" | "ready" | "done" | "none" | "error">("loading");
  const [r, setR] = useState<CoverReview | null>(null);
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetchCoverReview({ generate: false });
        if (!alive) return;
        if (res.unavailable) return setState("none");
        if (res.result) {
          setR(res.result);
          setStale(res.stale);
          setState("done");
        } else if (res.needsGenerate) setState("ready");
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
      const res = await fetchCoverReview({ generate: true, force });
      if (res.result) {
        setR(res.result);
        setStale(false);
        setState("done");
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
      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#0B46E8]">{t("자소서 심층 리뷰", "Cover letter deep review", "自我介绍深度评审", "Đánh giá sâu thư giới thiệu", "自己紹介書の詳細レビュー", "Ulasan mendalam surat")}</p>
      <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#8B95A1]">{t("누구에게나 통하는 표현과, 까다로운 채용담당자가 의심할 부분을 짚어드려요.", "We flag generic phrasing and what a tough recruiter would doubt.", "指出泛泛表达以及严格招聘官会质疑的地方。", "Chỉ ra câu chung chung và điều NTD khó tính sẽ nghi ngờ.", "誰にでも通じる表現と、厳しい採用担当が疑う点を指摘します。", "Menandai frasa umum dan yang diragukan perekrut ketat.")}</p>

      {state === "ready" ? (
        <div className="mt-3 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2F4F6] text-[22px]" aria-hidden>🔎</span>
          <p className="mt-3 text-[15px] font-bold text-[#191F28]">{t("자소서를 심사관처럼 검토받아 보세요", "Get a reviewer's tough read", "像审查官一样审视你的自我介绍", "Nhận đánh giá khắt khe", "審査官の視点でレビューを受けましょう", "Dapatkan ulasan ketat")}</p>
          <button type="button" onClick={() => run(false)} disabled={busy} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#191F28] px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#0B1227] disabled:opacity-60">
            {busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="h-4 w-4" weight="fill" />}
            {busy ? t("검토 중…", "Reviewing…", "评审中…", "Đang đánh giá…", "レビュー中…", "Meninjau…") : t("심층 리뷰 받기", "Get deep review", "获取深度评审", "Nhận đánh giá sâu", "詳細レビューを受ける", "Dapatkan ulasan")}
          </button>
          {failed ? <p className="mt-2 text-[12px] font-semibold text-[#F04452]">{t("잠시 문제가 생겼어요. 잠시 후 다시 시도해 주세요.", "Something went wrong. Please try again in a moment.", "出现了一点问题，请稍后再试。", "Đã xảy ra sự cố. Vui lòng thử lại sau.", "問題が発生しました。少し後にもう一度お試しください。", "Terjadi masalah. Silakan coba lagi.")}</p> : null}
        </div>
      ) : null}

      {state === "done" && r ? (
        <div className="mt-4 flex flex-col gap-4">
          {stale ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FFF9EC] px-3 py-2">
              <span className="text-[12px] font-semibold text-[#B7791F]">{t("자소서가 바뀌었어요. 다시 받아 갱신할 수 있어요.", "Your cover letter changed. Refresh to update.", "自我介绍已更新，可重新获取。", "Thư đã đổi. Nhận lại.", "自己紹介書が変わりました。再取得で更新できます。", "Surat berubah. Ambil ulang.")}</span>
              <button type="button" onClick={() => run(true)} disabled={busy} className="rounded-lg bg-[#191F28] px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-60">{busy ? "…" : t("다시 받기", "Refresh", "重新获取", "Nhận lại", "再取得", "Ambil ulang")}</button>
            </div>
          ) : null}
          {r.generic.length > 0 ? (
            <div className="rounded-2xl border border-[#EEF1F5] p-4">
              <p className="text-[12.5px] font-bold text-[#C77700]">✍️ {t("두루뭉술한 표현", "Generic phrasing", "泛泛的表达", "Câu chung chung", "ありきたりな表現", "Frasa umum")}</p>
              <ul className="mt-2 space-y-2.5">
                {r.generic.map((g, i) => (
                  <li key={i} className="break-keep text-[12.5px] leading-relaxed">
                    <p className="font-bold text-[#191F28]">“{g.phrase}”</p>
                    <p className="mt-0.5 text-[#8B95A1]">{g.why}</p>
                    <p className="mt-0.5 text-[#0B46E8]">→ {g.suggestion}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {r.redTeam.length > 0 ? (
            <div className="rounded-2xl bg-[#0B1227] p-4 text-white">
              <p className="text-[12.5px] font-bold text-[#FF9E9E]">🛡️ {t("까다로운 채용담당자의 의심", "A tough recruiter's doubts", "严格招聘官的质疑", "Nghi ngờ của NTD khó tính", "厳しい採用担当の疑い", "Keraguan perekrut ketat")}</p>
              <ul className="mt-2 space-y-2">
                {r.redTeam.map((rt, i) => (
                  <li key={i} className="break-keep text-[12.5px] leading-relaxed">
                    <span className="font-bold text-white">{rt.risk}</span> <span className="text-[#C7CEDD]">— {rt.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {state === "error" ? <p className="mt-3 text-[13px] text-[#8B95A1]">{t("불러오지 못했어요. 잠시 후 다시 시도해 주세요.", "Couldn't load. Please try again.", "无法加载，请稍后再试。", "Không thể tải. Vui lòng thử lại.", "読み込めませんでした。", "Tidak dapat memuat.")}</p> : null}
    </Card>
  );
}
