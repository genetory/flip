"use client";

// 파트너 채용 진행(Hiring) — 인터뷰/채용 파이프라인을 단계별로 한눈에.
// 제안→수락→일정→완료→합격 순으로 묶고, 각 후보에 Verified·Readiness를 표시.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, CaretRight } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { usePlatformT } from "../../../lib/i18n";
import { TListSkeleton, TError } from "../../talent/ui/primitives";
import { PartnerEmptyCard } from "../ui/cards";
import { getPartnerPipeline, type PipelineItem } from "../../../lib/member-profile-client";
import { blindTalentName } from "../../../lib/partner/blind";
import { partnerRoutes } from "../../../lib/partner/app-nav";

export function PartnerHiringScreen() {
  const t = usePlatformT();
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  function load() {
    setStatus("loading");
    getPartnerPipeline()
      .then((list) => {
        setItems(list);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
  }, []);

  const STAGES: { keys: PipelineItem["status"][]; label: string; accent?: boolean }[] = [
    { keys: ["PENDING"], label: t("제안 대기", "Requested", "已提议", "Đã đề nghị", "提案待ち", "Diminta") },
    { keys: ["ACCEPTED"], label: t("수락됨", "Accepted", "已接受", "Đã chấp nhận", "承認済み", "Diterima") },
    { keys: ["SCHEDULED"], label: t("인터뷰 일정", "Scheduled", "已排期", "Đã hẹn lịch", "面接予定", "Terjadwal") },
    { keys: ["COMPLETED"], label: t("인터뷰 완료", "Interviewed", "已面试", "Đã phỏng vấn", "面接完了", "Selesai wawancara") },
    { keys: ["PASSED"], label: t("합격", "Passed", "通过", "Đạt", "合格", "Lulus"), accent: true },
    { keys: ["DECLINED", "REJECTED"], label: t("종료", "Closed", "已结束", "Đã đóng", "終了", "Ditutup") }
  ];

  return (
    <PartnerAppShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-8">
        <header className="mb-5">
          <h1 className="text-[22px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[26px]">{t("채용 진행", "Hiring pipeline", "招聘进度", "Tiến trình tuyển dụng", "採用進行", "Alur rekrutmen")}</h1>
          <p className="mt-1.5 break-keep text-[13.5px] text-[#8B95A1]">{t("인터뷰를 제안한 인재를 단계별로 관리하세요. 후보를 눌러 상세에서 다음 단계로 진행할 수 있어요.", "Manage the talent you've invited, stage by stage. Tap a candidate to advance them from their detail page.", "按阶段管理已邀约的人才。点击候选人可在详情页推进下一步。", "Quản lý nhân tài đã mời theo từng giai đoạn. Nhấn vào ứng viên để tiến bước ở trang chi tiết.", "面接を打診した人材を段階ごとに管理。候補者をタップして詳細から次の段階へ。", "Kelola talenta yang diundang per tahap. Ketuk kandidat untuk melanjutkan dari halaman detail.")}</p>
        </header>

        {status === "loading" ? <TListSkeleton /> : null}
        {status === "error" ? <TError onRetry={load} /> : null}

        {status === "ready" ? (
          items.length === 0 ? (
            <PartnerEmptyCard
              emoji="🤝"
              title={t("아직 진행 중인 채용이 없어요", "No active hiring yet", "暂无进行中的招聘", "Chưa có tuyển dụng nào", "進行中の採用はありません", "Belum ada rekrutmen")}
              desc={t("인재 검색에서 마음에 드는 후보에게 인터뷰를 제안하면 여기에 쌓여요.", "Invite a candidate from Talent search and they'll show up here.", "在人才搜索中邀约候选人后会显示在此。", "Mời ứng viên từ tìm kiếm nhân tài, họ sẽ hiện ở đây.", "人材検索から候補者に打診するとここに表示されます。", "Undang kandidat dari pencarian talenta, mereka akan muncul di sini.")}
            />
          ) : (
            <div className="flex flex-col gap-6">
              {/* 요약 — 진행 중 / 합격 / 전체 */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { v: items.filter((i) => ["ACCEPTED", "SCHEDULED", "COMPLETED"].includes(i.status)).length, label: t("진행 중", "In progress", "进行中", "Đang tiến hành", "進行中", "Berjalan"), ink: "#0B46E8" },
                  { v: items.filter((i) => i.status === "PASSED").length, label: t("합격", "Passed", "已通过", "Đạt", "合格", "Lulus"), ink: "#0A9B59" },
                  { v: items.length, label: t("전체", "Total", "全部", "Tổng", "全体", "Total"), ink: "#0B1227" }
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-[#EEF1F5] bg-white p-3.5 text-center">
                    <p className="text-[22px] font-black tabular-nums" style={{ color: s.ink }}>{s.v}</p>
                    <p className="mt-0.5 text-[11.5px] font-semibold text-[#8B95A1]">{s.label}</p>
                  </div>
                ))}
              </div>
              {STAGES.map((stage) => {
                const group = items.filter((it) => stage.keys.includes(it.status));
                if (group.length === 0) return null;
                return (
                  <section key={stage.label}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${stage.accent ? "bg-[#0A9B59]" : "bg-[#0B46E8]"}`} aria-hidden />
                      <h2 className="text-[14px] font-black tracking-[-0.01em] text-[#191F28]">{stage.label}</h2>
                      <span className="text-[12.5px] font-bold text-[#8B95A1]">{group.length}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {group.map((it) => (
                        <Link
                          key={it.connectionId}
                          href={`${partnerRoutes.talent}/${it.candidateUserId}`}
                          className="group flex items-center gap-3 rounded-2xl border border-[#EEF1F5] bg-white p-3.5 transition hover:border-[#0B46E8]/40"
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[15px] font-black text-[#0B46E8]">
                            {(it.name ?? blindTalentName(t, null, it.candidateUserId)).slice(0, 1)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <p className="text-[14.5px] font-bold text-[#191F28]">{it.name ?? blindTalentName(t, null, it.candidateUserId)}</p>
                              {it.verified ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-[#E7F8EF] px-2 py-0.5 text-[10.5px] font-bold text-[#0A9B59]">
                                  <ShieldCheck className="h-3 w-3" weight="fill" aria-hidden /> Verified
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-0.5 text-[12px] text-[#8B95A1]">Readiness {it.readiness}</p>
                          </div>
                          <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2] transition group-hover:translate-x-0.5 group-hover:text-[#0B46E8]" weight="bold" aria-hidden />
                        </Link>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )
        ) : null}
      </div>
    </PartnerAppShell>
  );
}
