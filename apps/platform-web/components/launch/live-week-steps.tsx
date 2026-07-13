"use client";

import { useState } from "react";
import Link from "next/link";
import { RECOMMENDED_JOBS, type Step } from "../../lib/launch/data";
import { useLaunchT } from "../../lib/launch/i18n";
import { useStepText, useJobReason } from "../../lib/launch/data-i18n";

export type DiagResult = { percent: number; level: string; strengths?: string[]; improvements?: string[] } | null;

// 정리한 직무 정보는 '직무명: 내용' 형식으로 쌓인다. 앞의 직무명으로 묶어
// 직무별로 볼 수 있게 그룹핑한다(접두어가 없으면 '기타'로 모은다).
function groupMaterialsByJob(materials: string[]): { job: string; items: string[] }[] {
  const groups: { job: string; items: string[] }[] = [];
  const index = new Map<string, number>();
  for (const raw of materials) {
    const m = raw.match(/^\s*([^:：]{1,40})[:：]\s*(.+)$/);
    const job = m ? m[1].trim() : "기타";
    const item = m ? m[2].trim() : raw.trim();
    if (!item) continue;
    if (!index.has(job)) {
      index.set(job, groups.length);
      groups.push({ job, items: [] });
    }
    groups[index.get(job)!].items.push(item);
  }
  return groups;
}

// 대시보드용 스텝 목록 — 스텝을 강제로 이어붙이지 않고, 각 스텝을 완료하면
// 그 결과(진단 준비도 / 선정 직무)를 여기서 바로 보여준다. 사용자는 결과를
// 확인하고 원하는 다음 스텝을 고른다.
export function LiveWeekSteps({
  steps,
  diag,
  jobs,
  materials,
  doneIds,
  onReset
}: {
  steps: Step[];
  diag: DiagResult;
  jobs: string[];
  materials: string[];
  doneIds: string[];
  onReset: (id: string) => void;
}) {
  const t = useLaunchT();
  const stepText = useStepText();
  const jobReason = useJobReason();
  // 결과로 완료되지 않는 일반 스텝은 수동 체크.
  const [manual, setManual] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(steps.map((s) => [s.id, Boolean(s.done)]))
  );

  const resultStep = (id: string) => id === "w1s1" || id === "w1s2" || id === "w1s3";
  const isDone = (s: Step) => {
    if (s.id === "w1s1") return Boolean(diag);
    if (s.id === "w1s2") return jobs.length > 0;
    if (s.id === "w1s3") return materials.length > 0;
    if (doneIds.includes(s.id)) return true; // 학습 카드 등 완료 체크형 스텝
    return Boolean(manual[s.id]);
  };


  return (
    <ol className="space-y-1">
      {steps.map((s, i) => {
        const done = isDone(s);
        const last = i === steps.length - 1;
        const toggleable = !resultStep(s.id);
        // 순차 연계 — 이전 스텝을 모두 완료해야 이 스텝을 시작할 수 있다.
        const locked = !done && !steps.slice(0, i).every(isDone);
        return (
          <li key={s.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <button
                type="button"
                disabled={!toggleable || locked}
                onClick={toggleable && !locked ? () => setManual((p) => ({ ...p, [s.id]: !p[s.id] })) : undefined}
                aria-label={toggleable && !locked ? (done ? t("완료 취소", "Undo complete", "取消完成", "Hủy hoàn thành", "完了を取り消す", "Batalkan selesai") : t("완료로 표시", "Mark as complete", "标记为完成", "Đánh dấu hoàn thành", "完了にする", "Tandai selesai")) : undefined}
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-[13px] font-black shadow-sm transition ${
                  done ? "bg-[#0B46E8] text-white" : locked ? "border-2 border-[#E5E8EB] bg-[#F8FAFC] text-[#C9CDD2]" : "border-2 border-[#D7DCE3] bg-white text-[#4E5968]"
                } ${toggleable && !locked ? "hover:border-[#0B46E8] hover:text-[#0B46E8]" : "cursor-default"}`}
              >
                {done ? "✓" : locked ? "🔒" : i + 1}
              </button>
              {!last ? <span className="mt-1.5 w-[2px] flex-1 rounded bg-[#E5E8EB]" /> : null}
            </div>

            <div className={`min-w-0 flex-1 ${last ? "pb-0.5" : "pb-7"}`}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className={`text-[15.5px] font-bold leading-snug tracking-[-0.01em] md:text-[16px] ${done ? "text-[#8B95A1]" : locked ? "text-[#B0B8C1]" : "text-[#191F28]"}`}>
                  {stepText(s.id, "title")}
                </p>
                {!done && s.minutes ? (
                  <span className="rounded-full bg-[#F2F4F6] px-2 py-0.5 text-[11px] font-semibold text-[#8B95A1]">⏱ {t(`약 ${s.minutes}분`, `about ${s.minutes} min`, `约 ${s.minutes} 分钟`, `khoảng ${s.minutes} phút`, `約 ${s.minutes}分`, `sekitar ${s.minutes} mnt`)}</span>
                ) : null}
              </div>
              <p className={`mt-1.5 break-keep text-[13.5px] leading-[1.7] ${done ? "text-[#B0B8C1]" : locked ? "text-[#C9CDD2]" : "text-[#4E5968]"}`}>
                {stepText(s.id, "desc")
                  .split(/(?<=\.)\s+/)
                  .filter(Boolean)
                  .map((line, li) => (
                    <span key={li} className="block">
                      {line}
                    </span>
                  ))}
              </p>

              {/* 진단 결과 */}
              {s.id === "w1s1" && diag ? (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-bold text-[#191F28]">
                        {t("취업 준비도", "Job readiness", "求职准备度", "Mức độ sẵn sàng tìm việc", "就職準備度", "Kesiapan kerja")} <span className="text-[#0B46E8]">{diag.percent}%</span>
                      </p>
                      {diag.level ? <p className="mt-0.5 break-keep text-[12.5px] leading-relaxed text-[#4E5968]">{diag.level}</p> : null}
                    </div>
                    <span className="flex shrink-0 items-center gap-2">
                      <Link href="/career-launch/diagnosis" className="text-[12.5px] font-bold text-[#0B46E8] underline">
                        {t("다시 보기", "View again", "再看一次", "Xem lại", "もう一度見る", "Lihat lagi")}
                      </Link>
                      <button type="button" onClick={() => onReset(s.id)} className="text-[12.5px] font-semibold text-[#8B95A1] underline hover:text-[#4E5968]">
                        {t("삭제", "Delete", "删除", "Xóa", "削除", "Hapus")}
                      </button>
                    </span>
                  </div>
                  {diag.strengths && diag.strengths.length > 0 ? (
                    <div className="mt-2.5">
                      <p className="text-[11.5px] font-bold text-[#3A6B00]">{t("강점", "Strengths", "优势", "Điểm mạnh", "強み", "Kelebihan")}</p>
                      <ul className="mt-1 space-y-0.5">
                        {diag.strengths.map((x, si) => (
                          <li key={si} className="flex gap-1.5 break-keep text-[12.5px] leading-relaxed text-[#333D4B]">
                            <span className="text-[#3A6B00]">✓</span>
                            {x}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : s.id === "w1s2" && jobs.length > 0 ? (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13.5px] font-bold text-[#191F28]">
                      {t("선정한 직무", "Selected jobs", "已选职位", "Công việc đã chọn", "選んだ職務", "Pekerjaan yang dipilih")} <span className="text-[#0B46E8]">{t(`${jobs.length}개`, `${jobs.length}`, `${jobs.length} 个`, `${jobs.length}`, `${jobs.length}件`, `${jobs.length}`)}</span>
                    </p>
                    <span className="flex shrink-0 items-center gap-2">
                      <Link href="/career-launch/jobs?restart=1" className="text-[12.5px] font-bold text-[#0B46E8] underline">
                        {t("다시 선정", "Reselect", "重新选择", "Chọn lại", "選び直す", "Pilih ulang")}
                      </Link>
                      <button type="button" onClick={() => onReset(s.id)} className="text-[12.5px] font-semibold text-[#8B95A1] underline hover:text-[#4E5968]">
                        {t("삭제", "Delete", "删除", "Xóa", "削除", "Hapus")}
                      </button>
                    </span>
                  </div>
                  <ul className="mt-2 space-y-2">
                    {jobs.map((role) => {
                      const job = RECOMMENDED_JOBS.find((x) => x.role === role);
                      return (
                        <li key={role} className="rounded-lg bg-white/70 p-2.5">
                          <p className="text-[13px] font-bold text-[#191F28]">{role}</p>
                          {job?.reason ? <p className="mt-1 break-keep text-[12px] leading-relaxed text-[#4E5968]">{jobReason(job.id)}</p> : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : s.id === "w1s3" && materials.length > 0 ? (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13.5px] font-bold text-[#191F28]">
                      {t("선정 직무 정보", "Selected job info", "所选职位信息", "Thông tin công việc đã chọn", "選んだ職務の情報", "Info pekerjaan yang dipilih")} <span className="text-[#0B46E8]">{t(`${materials.length}개`, `${materials.length}`, `${materials.length} 条`, `${materials.length}`, `${materials.length}件`, `${materials.length}`)}</span> {t("정리 완료", "organized", "整理完成", "đã sắp xếp", "整理完了", "selesai dirapikan")}
                    </p>
                    <span className="flex shrink-0 items-center gap-2">
                      <Link href="/career-launch/materials" className="text-[12.5px] font-bold text-[#0B46E8] underline">
                        {t("이어서 정리", "Continue organizing", "继续整理", "Tiếp tục sắp xếp", "続けて整理", "Lanjut merapikan")}
                      </Link>
                      <button type="button" onClick={() => onReset(s.id)} className="text-[12.5px] font-semibold text-[#8B95A1] underline hover:text-[#4E5968]">
                        {t("삭제", "Delete", "删除", "Xóa", "削除", "Hapus")}
                      </button>
                    </span>
                  </div>
                  <div className="mt-2.5 space-y-2.5">
                    {groupMaterialsByJob(materials).map((g) => (
                      <div key={g.job} className="rounded-lg bg-white/70 p-2.5">
                        <p className="text-[12.5px] font-bold text-[#191F28]">{g.job}</p>
                        <ul className="mt-1.5 space-y-1">
                          {g.items.map((item, ii) => (
                            <li key={ii} className="flex gap-1.5 break-keep text-[12.5px] leading-relaxed text-[#4E5968]">
                              <span className="text-[#3A6B00]">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : done ? (
                // 완료된 학습·일반 스텝 — 완료 표시 + 삭제(초기화)
                <div className="mt-2 flex items-center gap-2 text-[12.5px]">
                  <span className="font-bold text-emerald-600">✓ {t("완료", "Done", "已完成", "Hoàn thành", "完了", "Selesai")}</span>
                  <button
                    type="button"
                    onClick={() => {
                      onReset(s.id);
                      setManual((m) => ({ ...m, [s.id]: false }));
                    }}
                    className="font-semibold text-[#8B95A1] underline hover:text-[#4E5968]"
                  >
                    {t("삭제", "Delete", "删除", "Xóa", "削除", "Hapus")}
                  </button>
                </div>
              ) : locked ? (
                <p className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-[#B0B8C1]">
                  🔒 {t("이전 단계를 완료하면 시작할 수 있어요", "Finish the previous step to start this one.", "完成上一步后即可开始。", "Hoàn thành bước trước để bắt đầu bước này.", "前のステップを完了すると始められます。", "Selesaikan langkah sebelumnya untuk memulai.")}
                </p>
              ) : s.action ? (
                <Link
                  href={s.action.href}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#0B46E8] px-3.5 py-2 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB]"
                >
                  {s.action.label} <span aria-hidden>→</span>
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
