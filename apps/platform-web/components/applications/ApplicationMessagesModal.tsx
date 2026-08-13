"use client";

import { useEffect, useRef, useState } from "react";
import { PaperPlaneRight, X } from "@phosphor-icons/react";
import { getApplicationMessages, sendApplicationMessage, type ApplicationMessage } from "../../lib/member-profile-client";
import { usePlatformT } from "../../lib/i18n";

type Props = {
  open: boolean;
  applicationId?: string;
  positionTitle?: string | null;
  companyName?: string | null;
  onClose: () => void;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// 지원자 ↔ 회사 메시지(쪽지) 스레드 — 질문·일정 조율 등. 지원 건별로 열린다.
export function ApplicationMessagesModal({ open, applicationId, positionTitle, companyName, onClose }: Props) {
  const t = usePlatformT();
  const [messages, setMessages] = useState<ApplicationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !applicationId) return;
    setLoading(true);
    setError(null);
    getApplicationMessages(applicationId)
      .then((items) => setMessages(items))
      .catch((err) => setError(err instanceof Error ? err.message : t("메시지를 불러오지 못했습니다.", "Failed to load messages.", "无法加载消息。", "Không thể tải tin nhắn.", "メッセージを読み込めませんでした。", "Gagal memuat pesan.")))
      .finally(() => setLoading(false));
  }, [open, applicationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading]);

  if (!open) return null;

  async function handleSend() {
    const content = draft.trim();
    if (!content || sending || !applicationId) return;
    setSending(true);
    setError(null);
    try {
      await sendApplicationMessage(applicationId, content);
      setDraft("");
      const items = await getApplicationMessages(applicationId);
      setMessages(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("전송에 실패했습니다.", "Failed to send.", "发送失败。", "Gửi không thành công.", "送信に失敗しました。", "Gagal mengirim."));
    } finally {
      setSending(false);
    }
  }

  const company = companyName?.trim() || t("회사", "Company", "公司", "Công ty", "会社", "Perusahaan");

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1227]/55 p-5"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-elevated"
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-3 border-b border-[#F2F4F6] p-5">
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold text-[#191F28]">{t("회사에 문의하기", "Contact the company", "联系公司", "Liên hệ công ty", "会社に問い合わせる", "Hubungi perusahaan")}</h2>
            <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
              {company}
              {positionTitle ? ` · ${positionTitle}` : ""}
            </p>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-lg p-1 text-muted-foreground transition hover:bg-muted" aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")}>
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* 스레드 */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-[#F9FAFB] p-4">
          {loading ? (
            <p className="py-8 text-center text-[13px] text-muted-foreground">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-muted-foreground">
              {t("아직 주고받은 메시지가 없어요.", "No messages yet.", "还没有消息。", "Chưa có tin nhắn nào.", "まだメッセージがありません。", "Belum ada pesan.")}<br />{t("궁금한 점이나 일정 조율을 회사에 남겨보세요.", "Leave a question or scheduling request for the company.", "向公司留言提问或协调日程吧。", "Hãy để lại câu hỏi hoặc điều chỉnh lịch cho công ty.", "質問や日程調整を会社に残してみましょう。", "Sampaikan pertanyaan atau penyesuaian jadwal kepada perusahaan.")}
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.authorRole === "STUDENT";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <span className="px-1 text-[10.5px] font-semibold text-muted-foreground">
                      {mine ? t("나", "Me", "我", "Tôi", "自分", "Saya") : company}
                    </span>
                    <div
                      className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                        mine ? "bg-[#0B46E8] text-white" : "border border-[#EDEFF3] bg-white text-[#191F28]"
                      }`}
                    >
                      {m.content}
                    </div>
                    <span className="px-1 text-[10px] text-muted-foreground/70">{formatTime(m.createdAt)}</span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        {/* 입력 */}
        <div className="border-t border-[#F2F4F6] p-3">
          {error ? <p className="mb-2 px-1 text-[12px] font-medium text-rose-500">{error}</p> : null}
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              rows={2}
              maxLength={4000}
              placeholder={t("메시지를 입력하세요… (⌘/Ctrl+Enter 전송)", "Type a message… (⌘/Ctrl+Enter to send)", "输入消息…（⌘/Ctrl+Enter 发送）", "Nhập tin nhắn… (⌘/Ctrl+Enter để gửi)", "メッセージを入力… (⌘/Ctrl+Enterで送信)", "Ketik pesan… (⌘/Ctrl+Enter untuk kirim)")}
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-[#E5E8EB] bg-white px-3 py-2.5 text-[13.5px] text-[#191F28] placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={sending || !draft.trim()}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 text-[13.5px] font-bold text-white transition hover:bg-[#0A3FCF] disabled:opacity-50"
            >
              <PaperPlaneRight weight="fill" className="h-4 w-4" aria-hidden />
              {t("전송", "Send", "发送", "Gửi", "送信", "Kirim")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
