"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkle, CircleNotch, ArrowRight } from "@phosphor-icons/react";
import { fetchWeekFeedback } from "../../lib/launch/feedback-client";
import { Card, Pill } from "./ui";
import { RichText } from "./rich-text";
import { useLaunchT } from "../../lib/launch/i18n";

// 1~3주차 코치 피드백 — 그 주차 결과물을 근거로 AI가 생성.
// 자동 생성(과금)하지 않고, 저장된 피드백이 있으면 보여주고 없으면 '피드백 받기' 버튼으로
// 사용자가 명시적으로 요청할 때만 생성한다(AI 포인트 1개 소모).
export function WeekAutoFeedback({ week }: { week: number }) {
  const t = useLaunchT();
  const [state, setState] = useState<"loading" | "none" | "ready" | "done" | "error">("loading");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [quota, setQuota] = useState(false);

  // 진입 시엔 캐시만 조회(생성·과금 없음).
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const { text: fb, needsGenerate } = await fetchWeekFeedback(week, false);
        if (!alive) return;
        if (fb && fb.trim()) {
          setText(fb);
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
        <span className="text-[13.5px] font-semibold text-[#4E5968]">{t("피드백", "Feedback", "反馈", "Phản hồi", "フィードバック", "Umpan balik")}</span>
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
          <p className="whitespace-pre-wrap rounded-xl bg-[#F6F8FB] p-3.5 text-[13.5px] leading-relaxed text-[#333D4B]"><RichText text={text} /></p>
          {/* 능동 코치 — 분석에서 멈추지 않고 다음 주차 행동으로 이어준다 */}
          {week < 4 ? (
            <Link
              href={`/career-launch/week/${week + 1}`}
              className="group mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#191F28] px-4 py-3 transition hover:bg-[#0B1227]"
            >
              <span className="min-w-0">
                <span className="block text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">{t("다음 액션", "Next action", "下一步", "Việc tiếp theo", "次のアクション", "Aksi berikutnya")}</span>
                <span className="mt-0.5 block truncate text-[14px] font-bold text-white">{t(`${week + 1}주차로 이어가기`, `Continue to Week ${week + 1}`, `继续第${week + 1}周`, `Tiếp tục Tuần ${week + 1}`, `${week + 1}週目へ進む`, `Lanjut ke Minggu ${week + 1}`)}</span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-white transition group-hover:translate-x-0.5" weight="bold" />
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
            <span className="font-semibold opacity-70">· ⚡1</span>
          </button>
          {quota ? <p className="mt-2 text-[12px] font-semibold text-[#F04452]">{t("AI 포인트가 부족해요. 충전 후 다시 시도해 주세요.", "Not enough AI points. Please recharge and try again.", "AI 积分不足，请充值后再试。", "Không đủ điểm AI. Vui lòng nạp thêm và thử lại.", "AIポイントが不足しています。チャージ後にお試しください。", "Poin AI tidak cukup. Isi ulang lalu coba lagi.")}</p> : null}
        </div>
      ) : state === "none" ? (
        <p className="mt-3 text-[13px] leading-relaxed text-[#8B95A1]">{t("이번 주 활동을 먼저 진행하면 피드백을 받을 수 있어요.", "Do this week's activities first to get feedback.", "先完成本周的活动即可获得反馈。", "Hãy thực hiện hoạt động tuần này trước để nhận phản hồi.", "今週のアクティビティを先に進めるとフィードバックを受け取れます。", "Lakukan aktivitas minggu ini dulu untuk mendapat umpan balik.")}</p>
      ) : (
        <p className="mt-3 text-[13px] text-[#8B95A1]">{t("피드백을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.", "Couldn't load the feedback. Please try again in a moment.", "无法加载反馈。请稍后再试。", "Không thể tải phản hồi. Vui lòng thử lại sau giây lát.", "フィードバックを読み込めませんでした。少し後にもう一度お試しください。", "Tidak dapat memuat umpan balik. Silakan coba lagi sebentar lagi.")}</p>
      )}
    </Card>
  );
}
