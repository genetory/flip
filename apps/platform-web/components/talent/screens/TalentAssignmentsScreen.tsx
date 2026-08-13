"use client";

// 탤런트 과제 — 회사가 부여한 과제 확인·제출·피드백 확인. (레거시 /profile/assignments 의 모던 버전)
import { useEffect, useMemo, useState } from "react";
import { Buildings, Star } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TalentBackButton } from "../TalentBackButton";
import { TLoading, TError } from "../ui/primitives";
import { useTalentPopup } from "../feedback/TalentPopupProvider";
import { getMyAssignments, submitAssignment, type MyAssignment } from "../../../lib/member-profile-client";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";

function statusInfo(t: PlatformT): Record<MyAssignment["status"], { label: string; cls: string }> {
  return {
    ASSIGNED: { label: t("제출 대기", "To submit", "待提交", "Chờ nộp", "提出待ち", "Menunggu"), cls: "bg-[#FFF3E6] text-[#E8890C]" },
    SUBMITTED: { label: t("제출 완료", "Submitted", "已提交", "Đã nộp", "提出済み", "Terkirim"), cls: "bg-[#EDF1FD] text-[#0B46E8]" },
    REVIEWED: { label: t("검토 완료", "Reviewed", "已审阅", "Đã duyệt", "確認済み", "Ditinjau"), cls: "bg-[#E7F8EF] text-[#0A9B59]" },
    CANCELLED: { label: t("취소", "Cancelled", "已取消", "Đã hủy", "取消", "Dibatalkan"), cls: "bg-[#F2F4F6] text-[#8B95A1]" }
  };
}

function fmt(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

type Tab = "ALL" | MyAssignment["status"];
function tabs(t: PlatformT): { key: Tab; label: string }[] {
  return [
    { key: "ALL", label: t("전체", "All", "全部", "Tất cả", "すべて", "Semua") },
    { key: "ASSIGNED", label: t("제출 대기", "To submit", "待提交", "Chờ nộp", "提出待ち", "Menunggu") },
    { key: "SUBMITTED", label: t("제출 완료", "Submitted", "已提交", "Đã nộp", "提出済み", "Terkirim") },
    { key: "REVIEWED", label: t("검토 완료", "Reviewed", "已审阅", "Đã duyệt", "確認済み", "Ditinjau") }
  ];
}

export function TalentAssignmentsScreen() {
  const tr = usePlatformT();
  const toast = useTalentPopup();
  const [items, setItems] = useState<MyAssignment[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [tab, setTab] = useState<Tab>("ALL");

  function load() {
    setStatus("loading");
    getMyAssignments()
      .then((d) => {
        setItems(d);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { ALL: items.length, ASSIGNED: 0, SUBMITTED: 0, REVIEWED: 0, CANCELLED: 0 };
    for (const it of items) c[it.status] += 1;
    return c;
  }, [items]);
  const list = tab === "ALL" ? items : items.filter((a) => a.status === tab);

  function onSubmitted(updated: MyAssignment) {
    setItems((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }

  return (
    <TalentAppShell>
      <div className="flex flex-col gap-5">
        <div>
          <TalentBackButton className="mb-3" />
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{tr("과제", "Assignments", "作业", "Bài tập", "課題", "Tugas")}</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">{tr("회사가 부여한 과제를 확인하고 제출해요.", "Check and submit assignments from companies.", "查看并提交公司布置的作业。", "Xem và nộp bài tập từ công ty.", "会社が出した課題を確認して提出しましょう。", "Cek dan kirim tugas dari perusahaan.")}</p>
        </div>

        {status === "loading" ? <TLoading /> : null}
        {status === "error" ? <TError onRetry={load} /> : null}

        {status === "ready" ? (
          <>
            <div className="flex gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {tabs(tr).map((t) => {
                const on = tab === t.key;
                return (
                  <button key={t.key} type="button" onClick={() => setTab(t.key)} aria-current={on ? "page" : undefined} className={`relative shrink-0 pb-1.5 text-[15px] font-bold transition ${on ? "text-[#191F28]" : "text-[#B0B8C1] hover:text-[#8B95A1]"}`}>
                    {t.label} ({counts[t.key]})
                    {on ? <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-[#0B46E8]" /> : null}
                  </button>
                );
              })}
            </div>

            {list.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[22px]" aria-hidden>📝</span>
                <p className="mt-3 text-[15px] font-bold text-[#191F28]">{tr("해당 상태의 과제가 없어요", "No assignments in this status", "没有该状态的作业", "Không có bài ở trạng thái này", "この状態の課題はありません", "Tidak ada tugas di status ini")}</p>
                <p className="mt-1 text-[13px] text-[#8B95A1]">{tr("회사가 과제를 부여하면 여기에 표시돼요.", "Assignments from companies will appear here.", "公司布置作业后会显示在这里。", "Bài tập từ công ty sẽ hiển thị ở đây.", "会社が課題を出すとここに表示されます。", "Tugas dari perusahaan akan muncul di sini.")}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {list.map((a) => (
                  <AssignmentCard key={a.id} a={a} onSubmitted={onSubmitted} onError={() => toast.error(tr("제출에 실패했어요.", "Submission failed.", "提交失败。", "Gửi thất bại.", "提出に失敗しました。", "Gagal mengirim."))} onDone={() => toast.success(tr("과제를 제출했어요", "Assignment submitted", "已提交作业", "Đã nộp bài", "課題を提出しました", "Tugas terkirim"))} />
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </TalentAppShell>
  );
}

function AssignmentCard({ a, onSubmitted, onError, onDone }: { a: MyAssignment; onSubmitted: (u: MyAssignment) => void; onError: () => void; onDone: () => void }) {
  const t = usePlatformT();
  const s = statusInfo(t)[a.status];
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [links, setLinks] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!content.trim() || busy) return;
    setBusy(true);
    try {
      const linkArr = links.split("\n").map((l) => l.trim()).filter(Boolean);
      const res = await submitAssignment(a.id, { submissionContent: content.trim(), submissionLinks: linkArr });
      const updated = (res as { item?: MyAssignment }).item;
      onSubmitted(updated ?? { ...a, status: "SUBMITTED", submissionContent: content.trim(), submissionLinks: linkArr, submittedAt: new Date().toISOString() });
      onDone();
      setOpen(false);
    } catch {
      onError();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[15px] font-bold text-[#191F28]">{a.title}</p>
            <span className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold ${s.cls}`}>{s.label}</span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-[#8B95A1]">
            <Buildings className="h-3.5 w-3.5 text-[#B0B8C1]" /> {a.partnerOrganizationName ?? t("회사", "Company", "公司", "Công ty", "会社", "Perusahaan")} · {a.positionTitle}
            {a.dueAt ? ` · ${t("마감", "Due", "截止", "Hạn", "締切", "Batas")} ${fmt(a.dueAt)}` : ""}
          </p>
        </div>
      </div>

      <p className="mt-2.5 whitespace-pre-wrap break-keep text-[13px] leading-relaxed text-[#4E5968]">{a.description}</p>

      {/* 제출 */}
      {a.status === "ASSIGNED" ? (
        open ? (
          <div className="mt-3 flex flex-col gap-2 rounded-xl bg-[#F8FAFB] p-3.5">
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder={t("제출 내용을 작성해주세요.", "Write your submission.", "请填写提交内容。", "Nhập nội dung nộp.", "提出内容を入力してください。", "Tulis konten pengumpulan.")} className="w-full resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#191F28] outline-none focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]" />
            <textarea value={links} onChange={(e) => setLinks(e.target.value)} rows={2} placeholder={t("링크(선택) — 한 줄에 하나씩", "Links (optional) — one per line", "链接（可选）— 每行一个", "Liên kết (tùy chọn) — mỗi dòng một", "リンク（任意）— 1行に1つ", "Tautan (opsional) — satu per baris")} className="w-full resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[13px] text-[#191F28] outline-none focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className="rounded-xl px-3.5 py-2 text-[13px] font-bold text-[#4E5968] ring-1 ring-[#E4EAF2] transition hover:bg-white disabled:opacity-50">{t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}</button>
              <button type="button" onClick={submit} disabled={busy || !content.trim()} className="rounded-xl bg-[#0B46E8] px-4 py-2 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">{busy ? t("제출 중…", "Submitting…", "提交中…", "Đang gửi…", "提出中…", "Mengirim…") : t("제출하기", "Submit", "提交", "Nộp", "提出する", "Kirim")}</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setOpen(true)} className="mt-3 w-full rounded-xl bg-[#0B46E8] py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]">{t("과제 제출하기", "Submit assignment", "提交作业", "Nộp bài tập", "課題を提出する", "Kirim tugas")}</button>
        )
      ) : null}

      {/* 내 제출 */}
      {a.submissionContent ? (
        <div className="mt-3 rounded-xl bg-[#F8FAFB] p-3.5">
          <p className="text-[11.5px] font-bold text-[#8B95A1]">{t("내 제출", "My submission", "我的提交", "Bài đã nộp", "提出内容", "Kiriman saya")} · {fmt(a.submittedAt)}</p>
          <p className="mt-1 whitespace-pre-wrap break-keep text-[13px] leading-relaxed text-[#191F28]">{a.submissionContent}</p>
          {a.submissionLinks.length ? (
            <div className="mt-1.5 flex flex-col gap-0.5">
              {a.submissionLinks.map((l, i) => (
                <a key={i} href={l} target="_blank" rel="noreferrer" className="truncate text-[12.5px] font-semibold text-[#0B46E8] hover:underline">{l}</a>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* 회사 피드백 */}
      {a.feedbackContent ? (
        <div className="mt-2.5 rounded-xl border border-[#E7F8EF] bg-[#F3FCF7] p-3.5">
          <p className="flex items-center gap-1 text-[11.5px] font-bold text-[#0A9B59]">
            {t("회사 피드백", "Company feedback", "公司反馈", "Phản hồi công ty", "会社のフィードバック", "Umpan balik perusahaan")} · {fmt(a.reviewedAt)}
            {a.feedbackRating ? <span className="ml-1 inline-flex items-center gap-0.5">· <Star className="h-3 w-3" weight="fill" /> {a.feedbackRating}/5</span> : null}
          </p>
          <p className="mt-1 whitespace-pre-wrap break-keep text-[13px] leading-relaxed text-[#191F28]">{a.feedbackContent}</p>
        </div>
      ) : null}
    </div>
  );
}
