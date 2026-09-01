"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkle, CircleNotch, ArrowRight } from "@phosphor-icons/react";
import { fetchWeekFeedback } from "../../lib/launch/feedback-client";
import { Card, Pill } from "./ui";
import { RichText } from "./rich-text";
import { useLaunchT } from "../../lib/launch/i18n";

// 1~3주차 코치 피드백 — 그 주차 결과물을 근거로 AI가 생성.
// 자동 생성하지 않고(불필요한 AI 호출 방지), 저장된 피드백이 있으면 보여주고 없으면 '피드백 받기' 버튼으로
// 사용자가 명시적으로 요청할 때만 생성한다(커리어 런치 AI는 무료 — 포인트 차감 없음).
// heading: 헤더 라벨 오버라이드(예: 한 주차에 이력서·자소서 피드백을 나란히 둘 때).
// showNext: 다음 주차로 넘기는 CTA 표시 여부. nextWeek: CTA가 가리킬 주차(기본 week+1).
export function WeekAutoFeedback({ week, heading, showNext = true, nextWeek }: { week: number; heading?: string; showNext?: boolean; nextWeek?: number }) {
  const t = useLaunchT();
  const nextW = nextWeek ?? week + 1;
  const [state, setState] = useState<"loading" | "none" | "ready" | "done" | "error">("loading");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [quota, setQuota] = useState(false);
  const [stale, setStale] = useState(false); // 결과물이 바뀌어 피드백이 옛 내용일 때

  // 진입 시엔 캐시만 조회(생성·과금 없음).
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const { text: fb, needsGenerate, stale: isStale } = await fetchWeekFeedback(week, false);
        if (!alive) return;
        if (fb && fb.trim()) {
          setText(fb);
          setStale(isStale); // 내용이 바뀌었으면 옛 피드백을 보여주되 '다시 받기' 유도
          setState("done");
        } else if (needsGenerate) {
          setState("ready"); // 결과물은 있음 — 받기 버튼 노출
        } else {
          setState("none"); // 결과물 없음
        }
      } catch {
        if (alive) setState("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [week]);

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    setQuota(false);
    try {
      const { text: fb } = await fetchWeekFeedback(week, true);
      if (fb && fb.trim()) {
        setText(fb);
        setStale(false); // 방금 최신 결과물로 재생성
        setState("done");
      } else {
        setState("none");
      }
    } catch (e) {
      if (e instanceof Error && /quota|402|포인트|ticket/i.test(e.message)) setQuota(true);
      else setState((s) => (s === "done" ? "done" : "ready"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13.5px] font-semibold text-[#4E5968]">{heading ?? t("피드백", "Feedback", "反馈", "Phản hồi", "フィードバック", "Umpan balik")}</span>
        {state === "loading" ? (
          <Pill tone="grey">{t("확인 중…", "Checking…", "确认中…", "Đang kiểm tra…", "確認中…", "Memeriksa…")}</Pill>
        ) : state === "done" ? (
          <Pill tone="green">{t("피드백 도착", "Feedback ready", "反馈已到", "Đã có phản hồi", "フィードバック到着", "Umpan balik siap")}</Pill>
        ) : (
          <Pill tone="grey">{t("대기 중", "Waiting", "等待中", "Đang chờ", "待機中", "Menunggu")}</Pill>
        )}
      </div>

      {state === "loading" ? (
        <p className="mt-3 text-[13px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p>
      ) : state === "done" ? (
        <div className="mt-3">
          {stale ? (
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FFF9EC] px-3 py-2">
              <span className="text-[12px] font-semibold text-[#B7791F]">{t("내용이 바뀌었어요. 다시 받아 최신 피드백으로 갱신할 수 있어요.", "Your work changed. Refresh to get updated feedback.", "内容有变。可重新获取以更新反馈。", "Nội dung đã đổi. Nhận lại để cập nhật phản hồi.", "内容が変わりました。再取得で最新のフィードバックに更新できます。", "Isi berubah. Ambil lagi untuk memperbarui umpan balik.")}</span>
              <button type="button" onClick={generate} disabled={busy} className="shrink-0 rounded-lg bg-[#191F28] px-3 py-1.5 text-[12px] font-bold text-white transition hover:bg-[#0B1227] disabled:opacity-60">
                {busy ? t("갱신 중…", "Refreshing…", "更新中…", "Đang cập nhật…", "更新中…", "Memperbarui…") : t("다시 받기", "Refresh", "重新获取", "Nhận lại", "再取得", "Ambil ulang")}
              </button>
            </div>
          ) : null}
          <p className="whitespace-pre-wrap rounded-xl bg-[#F6F8FB] p-3.5 text-[13.5px] leading-relaxed text-[#333D4B]"><RichText text={text} /></p>
          {/* 능동 코치 — 분석에서 멈추지 않고 다음 주차 행동으로 이어준다 */}
          {showNext && nextW <= 4 ? (
            <Link
              href={`/career-launch/week/${nextW}`}
              className="group mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#191F28] px-4 py-3 transition hover:bg-[#0B1227]"
            >
              <span className="min-w-0">
                <span className="block text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">{t("다음 액션", "Next action", "下一步", "Việc tiếp theo", "次のアクション", "Aksi berikutnya")}</span>
                <span className="mt-0.5 block truncate text-[14px] font-bold text-white">{t(`${nextW}주차로 이어가기`, `Continue to Week ${nextW}`, `继续第${nextW}周`, `Tiếp tục Tuần ${nextW}`, `${nextW}週目へ進む`, `Lanjut ke Minggu ${nextW}`)}</span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-white transition" weight="bold" />
            </Link>
          ) : null}
        </div>
      ) : state === "ready" ? (
        <div className="mt-3">
          <p className="text-[13px] leading-relaxed text-[#8B95A1]">{t("이번 주 결과물을 코치가 검토해 피드백을 드려요.", "Your coach reviews this week's work and gives you feedback.", "教练会审阅本周成果并给出反馈。", "Huấn luyện viên sẽ xem xét kết quả tuần này và đưa phản hồi.", "コーチが今週の成果を確認してフィードバックします。", "Pelatih meninjau hasil minggu ini dan memberi umpan balik.")}</p>
          <button
            type="button"
            onClick={generate}
            disabled={busy}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#191F28] px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0B1227] disabled:opacity-60"
          >
            {busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="h-4 w-4" weight="fill" />}
            {busy ? t("받는 중…", "Getting…", "获取中…", "Đang nhận…", "受け取り中…", "Sedang mengambil…") : t("피드백 받기", "Get feedback", "获取反馈", "Nhận phản hồi", "フィードバックを受け取る", "Dapatkan umpan balik")}
          </button>
          {quota ? <p className="mt-2 text-[12px] font-semibold text-[#F04452]">{t("지금은 AI 사용이 많아요. 잠시 후 다시 시도해 주세요.", "AI is busy right now. Please try again in a moment.", "AI 当前繁忙，请稍后再试。", "AI đang bận. Vui lòng thử lại sau giây lát.", "現在AIの利用が集中しています。少し後にお試しください。", "AI sedang sibuk. Silakan coba lagi sesaat lagi.")}</p> : null}
        </div>
      ) : state === "none" ? (
        <p className="mt-3 text-[13px] leading-relaxed text-[#8B95A1]">{t("이번 주 활동을 먼저 진행하면 피드백을 받을 수 있어요.", "Do this week's activities first to get feedback.", "先完成本周的活动即可获得反馈。", "Hãy thực hiện hoạt động tuần này trước để nhận phản hồi.", "今週のアクティビティを先に進めるとフィードバックを受け取れます。", "Lakukan aktivitas minggu ini dulu untuk mendapat umpan balik.")}</p>
      ) : (
        <p className="mt-3 text-[13px] text-[#8B95A1]">{t("피드백을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.", "Couldn't load the feedback. Please try again in a moment.", "无法加载反馈。请稍后再试。", "Không thể tải phản hồi. Vui lòng thử lại sau giây lát.", "フィードバックを読み込めませんでした。少し後にもう一度お試しください。", "Tidak dapat memuat umpan balik. Silakan coba lagi sebentar lagi.")}</p>
      )}
    </Card>
  );
}
