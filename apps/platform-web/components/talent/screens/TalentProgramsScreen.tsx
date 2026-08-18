"use client";

// 탤런트 프로그램 — 채용 확정 후 온보딩 진행 현황. (레거시 /profile/programs 의 모던 버전, 읽기 전용)
import { useEffect, useState } from "react";
import { Buildings, CalendarBlank, Certificate, ThumbsUp } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TalentBackButton } from "../TalentBackButton";
import { TLoading, TError } from "../ui/primitives";
import { getMyPrograms, type MyProgram } from "../../../lib/member-profile-client";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";

const STATUS_CLS: Record<MyProgram["status"], string> = {
  ACTIVE: "bg-[#EDF1FD] text-[#0B46E8]",
  COMPLETED: "bg-[#E7F8EF] text-[#0A9B59]",
  CANCELLED: "bg-[#F2F4F6] text-[#8B95A1]"
};
function statusLabel(t: PlatformT, s: MyProgram["status"]): string {
  switch (s) {
    case "ACTIVE": return t("진행 중", "In progress", "进行中", "Đang tiến hành", "進行中", "Berjalan");
    case "COMPLETED": return t("완료", "Completed", "已完成", "Hoàn thành", "完了", "Selesai");
    case "CANCELLED": return t("취소", "Cancelled", "已取消", "Đã hủy", "キャンセル", "Dibatalkan");
  }
}

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("ko-KR");
}
function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

export function TalentProgramsScreen() {
  const t = usePlatformT();
  const [items, setItems] = useState<MyProgram[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  function load() {
    setStatus("loading");
    getMyPrograms()
      .then((d) => {
        setItems(d);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <TalentAppShell>
      <div className="flex flex-col gap-5">
        <div>
          <TalentBackButton className="mb-3" />
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{t("프로그램", "Programs", "项目", "Chương trình", "プログラム", "Program")}</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">{t("채용이 확정된 회사와의 온보딩 진행을 확인해요.", "Track onboarding progress with companies where you've been hired.", "查看已录用公司的入职进展。", "Theo dõi tiến trình nhập việc với công ty đã tuyển bạn.", "採用が確定した会社とのオンボーディング進捗を確認しましょう。", "Lihat progres onboarding dengan perusahaan yang menerimamu.")}</p>
        </div>

        {status === "loading" ? <TLoading /> : null}
        {status === "error" ? <TError onRetry={load} /> : null}

        {status === "ready" ? (
          items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[22px]" aria-hidden>🎓</span>
              <p className="mt-3 text-[15px] font-bold text-[#191F28]">{t("아직 진행 중인 프로그램이 없어요", "No active programs yet", "还没有进行中的项目", "Chưa có chương trình nào", "まだ進行中のプログラムがありません", "Belum ada program berjalan")}</p>
              <p className="mt-1 text-[13px] text-[#8B95A1]">{t("합격하면 온보딩 프로그램이 여기에 표시돼요.", "Onboarding programs appear here once you're hired.", "被录用后，入职项目会显示在这里。", "Chương trình nhập việc sẽ hiển thị khi bạn trúng tuyển.", "合格するとオンボーディングプログラムがここに表示されます。", "Program onboarding muncul di sini setelah kamu diterima.")}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {items.map((p) => {
                const upcoming = p.meetings.find((m) => m.status === "SCHEDULED");
                return (
                  <div key={p.id} className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-bold text-[#191F28]">{p.application.position.title}</p>
                      <span className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold ${STATUS_CLS[p.status]}`}>{statusLabel(t, p.status)}</span>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-[#8B95A1]">
                      <Buildings className="h-3.5 w-3.5 text-[#B0B8C1]" /> {p.application.position.partnerOrganization?.name ?? t("회사", "Company", "公司", "Công ty", "会社", "Perusahaan")}
                      · {fmtDate(p.startsAt)}{p.endsAt ? ` ~ ${fmtDate(p.endsAt)}` : " ~"}
                    </p>

                    {upcoming ? (
                      <p className="mt-2.5 flex items-center gap-1.5 rounded-xl bg-[#F5F8FF] px-3 py-2 text-[12.5px] font-semibold text-[#0B46E8]">
                        <CalendarBlank className="h-4 w-4" weight="fill" /> {t("다음 미팅", "Next meeting", "下次会议", "Cuộc họp tiếp theo", "次のミーティング", "Rapat berikutnya")} · {fmtDateTime(upcoming.scheduledAt)}
                      </p>
                    ) : null}

                    {(p.certificate || p.recommendation) ? (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {p.certificate ? <span className="inline-flex items-center gap-1 rounded-md bg-[#E7F8EF] px-2 py-1 text-[11.5px] font-bold text-[#0A9B59]"><Certificate className="h-3.5 w-3.5" weight="fill" /> {t("수료증 발급됨", "Certificate issued", "已发放结业证书", "Đã cấp chứng nhận", "修了証発行済み", "Sertifikat terbit")}</span> : null}
                        {p.recommendation ? <span className="inline-flex items-center gap-1 rounded-md bg-[#EDF1FD] px-2 py-1 text-[11.5px] font-bold text-[#0B46E8]"><ThumbsUp className="h-3.5 w-3.5" weight="fill" /> {t("추천서 발급됨", "Recommendation issued", "已发放推荐信", "Đã cấp thư giới thiệu", "推薦状発行済み", "Rekomendasi terbit")}</span> : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )
        ) : null}
      </div>
    </TalentAppShell>
  );
}
