"use client";

// Week 3 — Story Bank. Experience Bank 를 STAR+Learning 카테고리별 이야기로. "받기" 캐시.
import { useEffect, useState } from "react";
import { Sparkle, CircleNotch, CaretDown } from "@phosphor-icons/react";
import { fetchStoryBank, type Story } from "../../lib/launch/feedback-client";
import { Card } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";

const CAT_EMOJI: Record<string, string> = {
  성과: "🏆", 실패: "🌱", 갈등: "🤝", 문제해결: "🧩", 리더십: "🧭", 도전: "🚀", 협업: "👥", 고객: "💬"
};

export function StoryBankCard() {
  const t = useLaunchT();
  const [state, setState] = useState<"loading" | "ready" | "done" | "none" | "error">("loading");
  const [stories, setStories] = useState<Story[]>([]);
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const r = await fetchStoryBank({ generate: false });
        if (!alive) return;
        if (r.unavailable) return setState("none");
        if (r.stories) {
          setStories(r.stories);
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
      const r = await fetchStoryBank({ generate: true, force });
      if (r.stories) {
        setStories(r.stories);
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
      <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#0B46E8]">Story Bank</p>
      <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#8B95A1]">{t("정리한 경험을 자소서·면접에서 쓸 이야기로 구조화해요. 하나의 경험이 여러 질문에 쓰여요.", "We turn your experiences into stories for cover letters and interviews — one experience fits many questions.", "把经验整理成自我介绍与面试可用的故事，一段经验可用于多个问题。", "Biến kinh nghiệm thành câu chuyện cho thư & phỏng vấn — một kinh nghiệm dùng cho nhiều câu hỏi.", "経験を自己紹介書・面接で使える物語に構造化。一つの経験が複数の質問に使えます。", "Mengubah pengalaman jadi cerita untuk surat & wawancara — satu pengalaman untuk banyak pertanyaan.")}</p>

      {state === "ready" ? (
        <div className="mt-3 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2F4F6] text-[22px]" aria-hidden>📖</span>
          <p className="mt-3 text-[15px] font-bold text-[#191F28]">{t("내 경험으로 Story Bank 만들기", "Build your Story Bank", "用我的经验建立故事库", "Xây Story Bank từ kinh nghiệm", "経験でStory Bankを作る", "Bangun Story Bank")}</p>
          <button type="button" onClick={() => run(false)} disabled={busy} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#191F28] px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#0B1227] disabled:opacity-60">
            {busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="h-4 w-4" weight="fill" />}
            {busy ? t("정리 중…", "Building…", "整理中…", "Đang tạo…", "作成中…", "Membuat…") : t("Story Bank 만들기", "Build Story Bank", "建立故事库", "Tạo Story Bank", "Story Bankを作る", "Buat Story Bank")}
          </button>
          {failed ? <p className="mt-2 text-[12px] font-semibold text-[#F04452]">{t("잠시 문제가 생겼어요. 잠시 후 다시 시도해 주세요.", "Something went wrong. Please try again in a moment.", "出现了一点问题，请稍后再试。", "Đã xảy ra sự cố. Vui lòng thử lại sau.", "問題が発生しました。少し後にもう一度お試しください。", "Terjadi masalah. Silakan coba lagi.")}</p> : null}
        </div>
      ) : null}

      {state === "done" ? (
        <div className="mt-4 flex flex-col gap-2.5">
          {stale ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FFF9EC] px-3 py-2">
              <span className="text-[12px] font-semibold text-[#B7791F]">{t("경험이 바뀌었어요. 다시 받아 갱신할 수 있어요.", "Your experiences changed. Refresh to update.", "经验已更新，可重新获取。", "Kinh nghiệm đã đổi. Nhận lại.", "経験が変わりました。再取得で更新できます。", "Pengalaman berubah. Ambil ulang.")}</span>
              <button type="button" onClick={() => run(true)} disabled={busy} className="rounded-lg bg-[#191F28] px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-60">{busy ? "…" : t("다시 받기", "Refresh", "重新获取", "Nhận lại", "再取得", "Ambil ulang")}</button>
            </div>
          ) : null}
          {stories.map((s, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="overflow-hidden rounded-2xl border border-[#EEF1F5]">
                <button type="button" onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition hover:bg-[#FAFBFC]">
                  <span className="text-[16px]" aria-hidden>{CAT_EMOJI[s.category] ?? "📌"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-[#191F28]">{s.title}</p>
                    <p className="mt-0.5 text-[11.5px] font-semibold text-[#0B46E8]">{s.category}{s.usableFor.length ? ` · ${s.usableFor.join(", ")}` : ""}</p>
                  </div>
                  <CaretDown className={`h-4 w-4 shrink-0 text-[#C4CAD2] transition ${isOpen ? "rotate-180" : ""}`} weight="bold" />
                </button>
                {isOpen ? (
                  <div className="border-t border-[#F2F4F6] px-4 py-3.5 text-[12.5px] leading-relaxed text-[#333D4B]">
                    {[
                      ["S", s.situation], ["T", s.task], ["A", s.action], ["R", s.result], ["L", s.learning]
                    ].filter(([, v]) => v).map(([k, v]) => (
                      <p key={k} className="mb-1.5 break-keep last:mb-0"><span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded bg-[#EDF1FD] text-[10px] font-black text-[#0B46E8]">{k}</span>{v}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {state === "error" ? <p className="mt-3 text-[13px] text-[#8B95A1]">{t("불러오지 못했어요. 잠시 후 다시 시도해 주세요.", "Couldn't load. Please try again.", "无法加载，请稍后再试。", "Không thể tải. Vui lòng thử lại.", "読み込めませんでした。", "Tidak dapat memuat.")}</p> : null}
    </Card>
  );
}
