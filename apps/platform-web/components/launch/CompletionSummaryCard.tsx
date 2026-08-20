"use client";

// 완주 캡스톤 — 🎓 CAREER LAUNCH COMPLETED. Career Score before→after + 체크리스트 + JOB READY.
// 4주 핵심 점수(리포트·이력서·자소서·면접)가 모두 생성되면 노출, 아니면 숨김.
import { useEffect, useState } from "react";
import { GraduationCap, ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { fetchCompletion, type Completion } from "../../lib/launch/feedback-client";
import { useLaunchT } from "../../lib/launch/i18n";

export function CompletionSummaryCard() {
  const t = useLaunchT();
  const [data, setData] = useState<Completion | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchCompletion().then((c) => {
      if (alive) setData(c);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!data || !data.completed) return null;

  const items = [
    { ok: data.checklist.direction, label: t("직무 방향 설정", "Career direction set", "确定职业方向", "Định hướng nghề", "職務の方向設定", "Arah karier ditetapkan") },
    { ok: data.checklist.resume, label: t("이력서 완성", "Resume complete", "简历完成", "Hoàn thành CV", "履歴書完成", "Resume selesai") },
    { ok: data.checklist.cover, label: t("자기소개서 완성", "Cover letter complete", "自我介绍完成", "Hoàn thành thư", "自己紹介書完成", "Surat lamaran selesai") },
    { ok: data.checklist.interview, label: t(`모의면접 ${data.interviewCount}회`, `${data.interviewCount} mock interviews`, `模拟面试 ${data.interviewCount} 次`, `${data.interviewCount} lần phỏng vấn thử`, `模擬面接 ${data.interviewCount}回`, `${data.interviewCount}x wawancara simulasi`) },
    { ok: data.checklist.diagnosis, label: t("취업 준비도 분석", "Job-readiness analyzed", "求职准备度分析", "Phân tích mức sẵn sàng", "就職準備度分析", "Analisis kesiapan kerja") }
  ];

  return (
    <div className="overflow-hidden rounded-3xl bg-[#0B1227] p-6 text-white md:p-7">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-6 w-6 text-[#8FB0FF]" weight="fill" />
        <p className="text-[13px] font-black uppercase tracking-[0.14em] text-[#8FB0FF]">Career Launch Completed</p>
      </div>

      {data.before != null && data.after != null ? (
        <div className="mt-5 flex items-end gap-4">
          <div>
            <p className="text-[11px] font-semibold text-[#9AA6BF]">Career Score</p>
            <div className="mt-1 flex items-end gap-3">
              <span className="text-[20px] font-bold text-[#6B7690] line-through">{data.before}</span>
              <ArrowRight className="mb-1.5 h-5 w-5 text-[#8FB0FF]" weight="bold" />
              <span className="text-[44px] font-black leading-none tracking-[-0.03em] text-white">{data.after}</span>
              <span className="mb-1.5 text-[15px] font-bold text-[#9AA6BF]">/ 100</span>
            </div>
          </div>
        </div>
      ) : null}

      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2 text-[14px] font-semibold text-[#E5E9F0]">
            <CheckCircle className={`h-5 w-5 shrink-0 ${it.ok ? "text-[#3DDC97]" : "text-[#3A4256]"}`} weight="fill" />
            {it.label}
          </li>
        ))}
      </ul>

      <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-[#3DDC97] px-4 py-2 text-[14px] font-black text-[#08301F]">
        🎓 JOB READY
      </div>
    </div>
  );
}
