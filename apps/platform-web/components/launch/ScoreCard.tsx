"use client";

// 재사용 점수 리포트 카드 — Resume/Cover/Interview Score 공용. "받기" 버튼식(생성 1회 캐시).
// 소비 컴포넌트가 fetchScore(라벨까지 i18n으로 정규화한 ScoreView 반환)만 넘기면 된다.
import { useEffect, useRef, useState } from "react";
import { Sparkle, CircleNotch } from "@phosphor-icons/react";
import { Card } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";

export type ScoreView = {
  total: number;
  breakdown: { label: string; value: number }[];
  why: string;
  sections: { title: string; tone: "good" | "warn" | "info"; items: string[] }[];
};
export type ScoreFetch = (opts: { generate?: boolean; force?: boolean }) => Promise<{
  view: ScoreView | null;
  stale: boolean;
  needsGenerate: boolean;
  unavailable: boolean; // 선행 조건 미충족(예: 이력서 미작성) → 카드 숨김
}>;

const toneColor: Record<string, string> = { good: "text-[#0A9B59]", warn: "text-[#C77700]", info: "text-[#0B46E8]" };
function barColor(v: number): string {
  return v >= 75 ? "bg-[#0A9B59]" : v >= 50 ? "bg-[#0B46E8]" : "bg-[#F5A524]";
}

export function ScoreCard({
  fetchScore,
  scoreLabel,
  badgeEmoji,
  badgeLabel,
  ctaTitle,
  ctaDesc,
  ctaLabel
}: {
  fetchScore: ScoreFetch;
  scoreLabel: string;
  badgeEmoji: string;
  badgeLabel: string;
  ctaTitle: string;
  ctaDesc: string;
  ctaLabel: string;
}) {
  const t = useLaunchT();
  const [state, setState] = useState<"loading" | "ready" | "done" | "none" | "error">("loading");
  const [view, setView] = useState<ScoreView | null>(null);
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  // fetchScore 는 렌더마다 새로 만들어지므로 ref 로 잡아 최초 1회만 호출(effect 루프 방지).
  const fetchRef = useRef(fetchScore);
  fetchRef.current = fetchScore;

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const r = await fetchRef.current({ generate: false });
        if (!alive) return;
        if (r.unavailable) {
          setState("none");
          return;
        }
        if (r.view) {
          setView(r.view);
          setStale(r.stale);
          setState("done");
        } else if (r.needsGenerate) {
          setState("ready");
        } else {
          setState("none");
        }
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
      const r = await fetchRef.current({ generate: true, force });
      if (r.view) {
        setView(r.view);
        setStale(false);
        setState("done");
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  if (state === "none" || state === "loading") return null;

  return (
    <Card className="md:!p-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#0B46E8]">{scoreLabel}</p>
        {state === "done" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#EDF1FD] px-2.5 py-1 text-[11px] font-bold text-[#0B46E8]">
            <span aria-hidden>{badgeEmoji}</span> {badgeLabel}
          </span>
        ) : null}
      </div>

      {state === "ready" ? (
        <div className="mt-3 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2F4F6] text-[22px]" aria-hidden>{badgeEmoji}</span>
          <p className="mt-3 text-[15px] font-bold text-[#191F28]">{ctaTitle}</p>
          <p className="mx-auto mt-1 max-w-[420px] break-keep text-[13px] leading-relaxed text-[#8B95A1]">{ctaDesc}</p>
          <button
            type="button"
            onClick={() => run(false)}
            disabled={busy}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#191F28] px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#0B1227] disabled:opacity-60"
          >
            {busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="h-4 w-4" weight="fill" />}
            {busy ? t("분석 중…", "Analyzing…", "分析中…", "Đang phân tích…", "分析中…", "Menganalisis…") : ctaLabel}
          </button>
          {failed ? <p className="mt-2 text-[12px] font-semibold text-[#F04452]">{t("잠시 문제가 생겼어요. 잠시 후 다시 시도해 주세요.", "Something went wrong. Please try again in a moment.", "出现了一点问题，请稍后再试。", "Đã xảy ra sự cố. Vui lòng thử lại sau.", "問題が発生しました。少し後にもう一度お試しください。", "Terjadi masalah. Silakan coba lagi.")}</p> : null}
        </div>
      ) : null}

      {state === "done" && view ? (
        <div className="mt-4 flex flex-col gap-5">
          {stale ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FFF9EC] px-3 py-2">
              <span className="text-[12px] font-semibold text-[#B7791F]">{t("입력이 바뀌었어요. 다시 받아 최신으로 갱신할 수 있어요.", "Your inputs changed. Refresh to update.", "输入已更改，可重新获取以更新。", "Dữ liệu đã đổi. Nhận lại để cập nhật.", "入力が変わりました。再取得で更新できます。", "Input berubah. Ambil ulang untuk memperbarui.")}</span>
              <button type="button" onClick={() => run(true)} disabled={busy} className="rounded-lg bg-[#191F28] px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-60">
                {busy ? t("갱신 중…", "Refreshing…", "更新中…", "Đang cập nhật…", "更新中…", "Memperbarui…") : t("다시 받기", "Refresh", "重新获取", "Nhận lại", "再取得", "Ambil ulang")}
              </button>
            </div>
          ) : null}

          <div className="rounded-2xl bg-[#F8FAFF] p-5 text-center">
            <p className="text-[12px] font-bold text-[#8B95A1]">{scoreLabel}</p>
            <p className="mt-1 text-[40px] font-black leading-none tracking-[-0.03em] text-[#0B1227]">{view.total}<span className="text-[18px] font-bold text-[#B0B8C1]"> / 100</span></p>
            {view.why ? <p className="mx-auto mt-3 max-w-[460px] break-keep text-[13px] leading-relaxed text-[#4E5968]">{view.why}</p> : null}
          </div>

          <div className="flex flex-col gap-2.5">
            {view.breakdown.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-[12.5px] font-semibold text-[#4E5968]">{b.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#EEF1F5]">
                  <div className={`h-full rounded-full ${barColor(b.value)}`} style={{ width: `${b.value}%` }} />
                </div>
                <span className="w-8 shrink-0 text-right text-[12.5px] font-bold tabular-nums text-[#191F28]">{b.value}</span>
              </div>
            ))}
          </div>

          {view.sections.map((sec, si) => (
            <div key={si} className="rounded-2xl border border-[#EEF1F5] p-4">
              <p className={`text-[12.5px] font-bold ${toneColor[sec.tone] ?? toneColor.info}`}>{sec.title}</p>
              <ul className="mt-2 space-y-1">
                {sec.items.map((it, ii) => <li key={ii} className="break-keep text-[13px] leading-relaxed text-[#333D4B]">· {it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {state === "error" ? (
        <p className="mt-3 text-[13px] text-[#8B95A1]">{t("점수를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.", "Couldn't load the score. Please try again in a moment.", "无法加载分数，请稍后再试。", "Không thể tải điểm. Vui lòng thử lại.", "スコアを読み込めませんでした。少し後に再試行してください。", "Tidak dapat memuat skor. Silakan coba lagi.")}</p>
      ) : null}
    </Card>
  );
}
