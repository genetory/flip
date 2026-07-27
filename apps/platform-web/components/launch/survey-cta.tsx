"use client";

import { useEffect, useState } from "react";
import { isWeekComplete, type LaunchData } from "../../lib/launch/step-status";
import { useLaunchT } from "../../lib/launch/i18n";
import { trackCareerFunnel } from "../../lib/analytics";

// 베타 설문 CTA — 주차 완료 시점에 자동으로 뜨는 설문 참여 배너.
//  - 1·2주차 완료(W2 complete) → 중간 설문(NEXT_PUBLIC_CAREER_SURVEY_MID_URL)
//  - 전체(3·4주차) 완료(W4 complete) → 전체 설문(NEXT_PUBLIC_CAREER_SURVEY_FINAL_URL)
//  - URL 미설정이면 노출 안 함(하위호환). 참여(또는 숨김) 시 localStorage로 재노출 방지.
//  - W4 완료 시엔 중간 설문은 숨기고 전체 설문만(중간은 이미 지난 게이트).

const MID_URL = process.env.NEXT_PUBLIC_CAREER_SURVEY_MID_URL?.trim() || "";
const FINAL_URL = process.env.NEXT_PUBLIC_CAREER_SURVEY_FINAL_URL?.trim() || "";
const DISMISS_KEY = "aply.career.survey.dismissed"; // "mid" | "final" 저장

type Kind = "mid" | "final";

export function CareerSurveyCta({ data }: { data: LaunchData }) {
  const t = useLaunchT();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DISMISS_KEY);
      setDismissed(new Set(raw ? (JSON.parse(raw) as string[]) : []));
    } catch {
      // 무시 — 저장소 접근 실패 시 그냥 노출
    }
    setReady(true);
  }, []);

  const w2 = isWeekComplete(2, data);
  const w4 = isWeekComplete(4, data);

  // 노출 대상 결정 — 전체 설문 우선(W4 완료 시 중간은 지난 단계).
  let kind: Kind | null = null;
  let url = "";
  if (w4 && FINAL_URL) {
    kind = "final";
    url = FINAL_URL;
  } else if (w2 && MID_URL) {
    kind = "mid";
    url = MID_URL;
  }

  // 노출 시점에 1회 계측(참여 유도 노출).
  useEffect(() => {
    if (!ready || !kind || dismissed.has(kind)) return;
    trackCareerFunnel(kind === "final" ? "survey_final_prompted" : "survey_mid_prompted");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, kind, dismissed.has(kind ?? "")]);

  if (!ready || !kind || dismissed.has(kind)) return null;

  const dismiss = (k: Kind) => {
    const next = new Set(dismissed);
    next.add(k);
    setDismissed(next);
    try {
      window.localStorage.setItem(DISMISS_KEY, JSON.stringify([...next]));
    } catch {
      // 무시
    }
  };

  const copy =
    kind === "final"
      ? {
          tag: t("전체 설문", "Final survey", "整体问卷", "Khảo sát tổng thể", "全体アンケート", "Survei akhir"),
          title: t(
            "4주 프로그램 전체 설문에 참여해주세요",
            "Please take the full 4-week program survey",
            "请参与4周项目的整体问卷",
            "Vui lòng tham gia khảo sát toàn bộ chương trình 4 tuần",
            "4週間プログラム全体のアンケートにご協力ください",
            "Mohon ikuti survei keseluruhan program 4 minggu"
          ),
          desc: t(
            "여러분의 피드백으로 프로그램을 바로 개선합니다. 3분이면 충분해요.",
            "Your feedback directly improves the program. It takes about 3 minutes.",
            "你的反馈将直接用于改进项目。大约需要3分钟。",
            "Phản hồi của bạn giúp cải thiện chương trình ngay. Chỉ mất khoảng 3 phút.",
            "皆さんのフィードバックですぐにプログラムを改善します。3分ほどで終わります。",
            "Masukanmu langsung memperbaiki program. Hanya sekitar 3 menit."
          )
        }
      : {
          tag: t("1·2주차 설문", "Week 1–2 survey", "第1·2周问卷", "Khảo sát Tuần 1–2", "1・2週目アンケート", "Survei Minggu 1–2"),
          title: t(
            "1·2주차 완료! 설문에 참여해주세요",
            "You finished Weeks 1–2! Please take the survey",
            "第1·2周完成！请参与问卷",
            "Bạn đã hoàn thành Tuần 1–2! Vui lòng tham gia khảo sát",
            "1・2週目完了！アンケートにご協力ください",
            "Kamu menyelesaikan Minggu 1–2! Mohon ikuti survei"
          ),
          desc: t(
            "진단·이력서 경험은 어땠나요? 지금 남겨주시면 다음 주차에 바로 반영해요.",
            "How was the diagnosis and resume experience? Tell us now and we'll reflect it next week.",
            "诊断和简历体验如何？现在告诉我们，下周即刻反映。",
            "Trải nghiệm chẩn đoán và hồ sơ thế nào? Cho chúng tôi biết ngay để phản ánh vào tuần tới.",
            "診断・履歴書の体験はいかがでしたか？今教えていただければ次の週にすぐ反映します。",
            "Bagaimana pengalaman diagnosis dan resume? Beri tahu kami sekarang dan kami terapkan minggu depan."
          )
        };

  return (
    <div className="mt-4 rounded-2xl border border-[#F0B429]/40 bg-[#FFF9EC] px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-[#B7791F]">📋 {copy.tag}</p>
          <p className="mt-0.5 text-[15px] font-black text-[#0B1227]">{copy.title}</p>
          <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#8A6D1F]">{copy.desc}</p>
        </div>
        <div className="flex flex-none items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackCareerFunnel(kind === "final" ? "survey_final_clicked" : "survey_mid_clicked");
              dismiss(kind!);
            }}
            className="rounded-xl bg-[#F0B429] px-4 py-2 text-[13.5px] font-bold text-white transition hover:bg-[#E0A420]"
          >
            {t("설문 참여하기", "Take the survey", "参与问卷", "Tham gia khảo sát", "アンケートに回答", "Ikuti survei")} ↗
          </a>
          <button
            type="button"
            onClick={() => dismiss(kind!)}
            className="rounded-xl px-2 py-2 text-[12.5px] font-semibold text-[#B7791F]/70 transition hover:text-[#B7791F]"
          >
            {t("나중에", "Later", "稍后", "Để sau", "後で", "Nanti")}
          </button>
        </div>
      </div>
    </div>
  );
}
