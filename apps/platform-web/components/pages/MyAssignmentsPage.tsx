"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { getMyAssignments, submitAssignment, type MyAssignment } from "../../lib/member-profile-client";

const STATUS_LABEL: Record<MyAssignment["status"], { className: string }> = {
  ASSIGNED: { className: "bg-amber-100 text-amber-700" },
  SUBMITTED: { className: "bg-blue-100 text-blue-700" },
  REVIEWED: { className: "bg-green-100 text-green-700" },
  CANCELLED: { className: "bg-gray-100 text-gray-500" }
};

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

export function MyAssignmentsPage() {
  const { isAuthenticated, isReady } = useAuthSession();
  const { locale } = useLanguage();
  const tr = (ko: string, en: string, zh: string = en, vi: string = en, ja: string = en, id: string = en) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? ja : locale === "id" ? id : en;
  const statusLabel = (s: MyAssignment["status"]) =>
    s === "ASSIGNED"
      ? tr("제출 대기", "Pending", "待提交", "Chờ nộp", "提出待ち", "Menunggu")
      : s === "SUBMITTED"
        ? tr("제출 완료", "Submitted", "已提交", "Đã nộp", "提出済み", "Terkirim")
        : s === "REVIEWED"
          ? tr("검토 완료", "Reviewed", "已审核", "Đã xem xét", "確認済み", "Ditinjau")
          : tr("취소", "Cancelled", "已取消", "Đã hủy", "キャンセル", "Dibatalkan");
  const [items, setItems] = useState<MyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<MyAssignment["status"] | "ALL">("ALL");
  const [draft, setDraft] = useState<Record<string, { content: string; link: string }>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyAssignments();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("과제 목록을 불러오지 못했습니다.", "Failed to load assignments.", "无法加载作业列表。", "Không thể tải danh sách bài tập.", "課題一覧を読み込めませんでした。", "Gagal memuat daftar tugas."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    void load();
  }, [isReady, isAuthenticated]);

  const filtered = useMemo(
    () => (filterStatus === "ALL" ? items : items.filter((a) => a.status === filterStatus)),
    [items, filterStatus]
  );

  const counts = useMemo(() => {
    const result = { ALL: items.length, ASSIGNED: 0, SUBMITTED: 0, REVIEWED: 0, CANCELLED: 0 };
    for (const it of items) result[it.status] += 1;
    return result;
  }, [items]);

  async function handleSubmit(assignmentId: string) {
    const d = draft[assignmentId];
    if (!d || !d.content.trim()) {
      setError(tr("제출 내용을 입력해 주세요.", "Please enter your submission.", "请输入提交内容。", "Vui lòng nhập nội dung bài nộp.", "提出内容を入力してください。", "Silakan masukkan konten pengiriman."));
      return;
    }
    setSubmitting(assignmentId);
    setError(null);
    try {
      const links = d.link.trim() ? [d.link.trim()] : [];
      await submitAssignment(assignmentId, { submissionContent: d.content.trim(), submissionLinks: links });
      await load();
      setDraft((prev) => {
        const next = { ...prev };
        delete next[assignmentId];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("제출에 실패했습니다.", "Submission failed.", "提交失败。", "Nộp bài thất bại.", "提出に失敗しました。", "Pengiriman gagal."));
    } finally {
      setSubmitting(null);
    }
  }

  if (isReady && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-4xl px-4 py-16">
          <h1 className="text-2xl font-bold text-foreground">
            {tr("로그인이 필요합니다", "Sign in required", "需要登录", "Cần đăng nhập", "ログインが必要です", "Diperlukan masuk")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tr("내 과제를 확인하려면 로그인이 필요합니다.", "Sign in to view your assignments.", "登录后查看您的作业。", "Đăng nhập để xem bài tập của bạn.", "課題を確認するにはログインが必要です。", "Masuk untuk melihat tugas Anda.")}
          </p>
          <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            {tr("로그인하기", "Sign in", "登录", "Đăng nhập", "ログイン", "Masuk")}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {tr("내 과제", "My assignments", "我的作业", "Bài tập của tôi", "私の課題", "Tugas saya")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tr("회사가 부여한 과제를 확인하고 제출하세요.", "Review and submit assignments from companies.", "查看公司分配的作业并提交。", "Xem và nộp bài tập từ các công ty.", "企業から付与された課題を確認し提出してください。", "Tinjau dan kirim tugas dari perusahaan.")}
          </p>
        </header>

        <div className="mb-4 flex flex-wrap gap-2">
          {(["ALL", "ASSIGNED", "SUBMITTED", "REVIEWED", "CANCELLED"] as const).map((key) => {
            const active = filterStatus === key;
            const label = key === "ALL" ? tr("전체", "All", "全部", "Tất cả", "すべて", "Semua") : statusLabel(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilterStatus(key)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  active ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground hover:border-foreground/50"
                }`}
              >
                {label} <span className="ml-1 opacity-70">{counts[key]}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">
            {tr("불러오는 중...", "Loading...", "加载中...", "Đang tải...", "読み込み中...", "Memuat...")}
          </p>
        ) : error ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-md border border-border/50 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            {tr("해당 상태의 과제가 없습니다.", "No assignments in this status.", "暂无该状态的作业。", "Không có bài tập nào ở trạng thái này.", "このステータスの課題はありません。", "Tidak ada tugas pada status ini.")}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((it) => {
              const badge = STATUS_LABEL[it.status];
              const d = draft[it.id] ?? { content: "", link: "" };
              const isSubmitting = submitting === it.id;
              return (
                <article key={it.id} className="rounded-2xl border border-border/70 bg-card p-5">
                  <header className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-foreground">{it.title}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {it.partnerOrganizationName ?? "-"} · {it.positionTitle}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {tr("부여일", "Assigned", "分配日期", "Ngày giao", "付与日", "Tanggal pemberian")}: {formatDateTime(it.assignedAt)}
                        {it.dueAt ? ` · ${tr("마감", "Due", "截止", "Hạn nộp", "締切", "Batas waktu")}: ${formatDateTime(it.dueAt)}` : ""}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}>{statusLabel(it.status)}</span>
                  </header>

                  <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{it.description}</p>

                  {it.status === "ASSIGNED" ? (
                    <div className="mt-4 rounded-lg border border-dashed border-border bg-background p-4">
                      <p className="text-xs font-semibold text-foreground">
                        {tr("제출하기", "Submit", "提交", "Nộp bài", "提出する", "Kirim")}
                      </p>
                      <textarea
                        value={d.content}
                        onChange={(e) => setDraft((prev) => ({ ...prev, [it.id]: { ...d, content: e.target.value } }))}
                        rows={4}
                        placeholder={tr("제출 내용을 입력해 주세요", "Enter your submission", "请输入提交内容", "Nhập nội dung bài nộp", "提出内容を入力してください", "Masukkan konten pengiriman")}
                        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                      <input
                        type="url"
                        value={d.link}
                        onChange={(e) => setDraft((prev) => ({ ...prev, [it.id]: { ...d, link: e.target.value } }))}
                        placeholder={tr("참고 링크 (선택)", "Reference link (optional)", "参考链接(可选)", "Liên kết tham khảo (tuỳ chọn)", "参考リンク(任意)", "Tautan referensi (opsional)")}
                        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => void handleSubmit(it.id)}
                          disabled={isSubmitting}
                          className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90 disabled:cursor-wait"
                        >
                          {isSubmitting
                            ? tr("제출 중...", "Submitting...", "提交中...", "Đang gửi...", "提出中...", "Mengirim...")
                            : tr("제출", "Submit", "提交", "Nộp", "提出", "Kirim")}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {it.submissionContent ? (
                    <div className="mt-4 rounded-lg bg-muted/30 p-3">
                      <p className="text-xs font-semibold text-foreground">
                        {tr("내 제출", "My submission", "我的提交", "Bài nộp của tôi", "私の提出", "Pengiriman saya")} ({formatDateTime(it.submittedAt)})
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{it.submissionContent}</p>
                      {it.submissionLinks.length > 0 ? (
                        <ul className="mt-2 list-disc pl-5 text-xs">
                          {it.submissionLinks.map((link, idx) => (
                            <li key={idx}>
                              <a href={link} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                {link}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}

                  {it.feedbackContent ? (
                    <div className="mt-3 rounded-lg bg-emerald-50 p-3">
                      <p className="text-xs font-semibold text-emerald-700">
                        {tr("회사 피드백", "Company feedback", "公司反馈", "Phản hồi từ công ty", "企業フィードバック", "Umpan balik perusahaan")} ({formatDateTime(it.reviewedAt)}
                        {it.feedbackRating ? ` · ${it.feedbackRating}/5` : ""})
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-emerald-900">{it.feedbackContent}</p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
