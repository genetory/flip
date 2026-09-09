"use client";

// 전역 버그·피드백 위젯 — 모든 페이지 우측 하단에 떠 있는 버튼(채널톡 스타일).
// 현재 화면 정보(URL·뷰포트·UA·로그인 사용자)와 함께 메시지를 API로 보내고,
// API가 Discord 팀 채널로 전달한다. 서버 저장/마이그레이션 없음.
import { useEffect, useRef, useState } from "react";
import { Bug, X, PaperPlaneRight, CheckCircle } from "@phosphor-icons/react";
import { usePlatformT } from "../../lib/i18n";
import { useAuthSession } from "../auth/AuthSessionProvider";

type Category = "bug" | "idea" | "etc";

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") || "http://localhost:4000";
}

export function FeedbackWidget() {
  const t = usePlatformT();
  const { user } = useAuthSession();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 로그인 사용자면 이메일 프리필.
  useEffect(() => {
    if (user?.email) setEmail((prev) => prev || user.email || "");
  }, [user?.email]);

  // 열릴 때 포커스 + ESC 닫기 + 바깥 클릭 닫기.
  useEffect(() => {
    if (!open) return;
    const focusTimer = setTimeout(() => textareaRef.current?.focus(), 60);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const cats: { key: Category; label: string }[] = [
    { key: "bug", label: t("버그", "Bug", "问题", "Lỗi", "バグ", "Bug") },
    { key: "idea", label: t("개선 제안", "Idea", "建议", "Đề xuất", "改善提案", "Ide") },
    { key: "etc", label: t("기타", "Other", "其他", "Khác", "その他", "Lainnya") }
  ];
  const catServerLabel: Record<Category, string> = { bug: "버그", idea: "개선 제안", etc: "기타" };

  async function submit() {
    const text = message.trim();
    if (!text || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch(`${apiBase()}/feedback/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          category: catServerLabel[category],
          url: typeof window !== "undefined" ? window.location.href : undefined,
          path: typeof window !== "undefined" ? window.location.pathname : undefined,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          viewport: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : undefined,
          locale: typeof document !== "undefined" ? document.documentElement.lang : undefined,
          reporterEmail: email.trim() || undefined,
          reporterName: user?.name || undefined,
          reporterRole: user?.role || undefined
        })
      });
      if (!res.ok && res.status !== 204) throw new Error(String(res.status));
      setStatus("sent");
      setMessage("");
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
      }, 1600);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[70] print:hidden">
      {/* 팝업 패널 */}
      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={t("버그·피드백 보내기", "Send feedback", "发送反馈", "Gửi phản hồi", "フィードバック送信", "Kirim masukan")}
          className="mb-3 w-[calc(100vw-2rem)] max-w-[340px] overflow-hidden rounded-2xl bg-white shadow-[0_16px_48px_-12px_rgba(15,23,42,0.4)] ring-1 ring-black/10"
        >
          <div className="flex items-center justify-between gap-2 bg-[#0B46E8] px-4 py-3 text-white">
            <p className="text-[14px] font-bold">{t("무엇이든 알려주세요", "Tell us anything", "告诉我们", "Cho chúng tôi biết", "何でも教えてください", "Beri tahu kami")}</p>
            <button type="button" onClick={() => setOpen(false)} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="text-white/80 transition hover:text-white">
              <X className="h-5 w-5" weight="bold" aria-hidden />
            </button>
          </div>

          {status === "sent" ? (
            <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
              <CheckCircle className="h-10 w-10 text-[#0A9B59]" weight="fill" aria-hidden />
              <p className="text-[14px] font-bold text-[#191F28]">{t("보내주셔서 감사해요!", "Thanks for the report!", "感谢反馈！", "Cảm ơn bạn!", "ありがとうございます！", "Terima kasih!")}</p>
              <p className="text-[12.5px] text-[#8B95A1]">{t("빠르게 확인하겠습니다.", "We'll look into it soon.", "我们会尽快查看。", "Chúng tôi sẽ xem sớm.", "すぐに確認します。", "Kami akan segera cek.")}</p>
            </div>
          ) : (
            <div className="p-4">
              <p className="mb-2 text-[11.5px] font-semibold text-[#8B95A1]">{t("현재 화면에서 발견한 점을 보내주세요", "Report what you found on this screen", "反馈此页面的问题", "Báo lỗi trên màn hình này", "この画面で気づいた点を送ってください", "Laporkan dari layar ini")}</p>
              {/* 분류 */}
              <div className="mb-2.5 flex gap-1.5">
                {cats.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-[12.5px] font-bold transition ${
                      category === c.key ? "bg-[#0B46E8] text-white" : "bg-[#F1F3F5] text-[#4E5968] hover:bg-[#E7EAEE]"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              {/* 메시지 */}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder={t(
                  "예: 이 버튼을 누르면 화면이 멈춰요",
                  "e.g. The screen freezes when I tap this button",
                  "例如：点击此按钮后页面卡住",
                  "VD: Màn hình treo khi bấm nút này",
                  "例: このボタンを押すと画面が固まります",
                  "Contoh: Layar macet saat tombol ini ditekan"
                )}
                className="w-full resize-none rounded-xl border border-[#E5E8EC] bg-[#FAFBFC] px-3 py-2.5 text-[13.5px] leading-[1.5] text-[#191F28] outline-none transition placeholder:text-[#B0B8C1] focus:border-[#0B46E8]"
              />
              {/* 이메일(선택) */}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("답장 받을 이메일(선택)", "Email for reply (optional)", "回复邮箱（可选）", "Email nhận phản hồi (tùy chọn)", "返信用メール(任意)", "Email balasan (opsional)")}
                className="mt-2 w-full rounded-xl border border-[#E5E8EC] bg-[#FAFBFC] px-3 py-2 text-[12.5px] text-[#191F28] outline-none transition placeholder:text-[#B0B8C1] focus:border-[#0B46E8]"
              />
              {status === "error" ? (
                <p className="mt-2 text-[12px] font-semibold text-[#E11D48]">{t("전송에 실패했어요. 잠시 후 다시 시도해 주세요.", "Failed to send. Please try again.", "发送失败，请稍后重试。", "Gửi thất bại. Thử lại sau.", "送信に失敗しました。もう一度お試しください。", "Gagal mengirim. Coba lagi.")}</p>
              ) : null}
              <button
                type="button"
                onClick={submit}
                disabled={!message.trim() || status === "sending"}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0B46E8] py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PaperPlaneRight className="h-4 w-4" weight="fill" aria-hidden />
                {status === "sending" ? t("보내는 중…", "Sending…", "发送中…", "Đang gửi…", "送信中…", "Mengirim…") : t("보내기", "Send", "发送", "Gửi", "送信", "Kirim")}
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* 플로팅 버튼 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("버그·피드백 보내기", "Send feedback", "发送反馈", "Gửi phản hồi", "フィードバック送信", "Kirim masukan")}
        aria-expanded={open}
        className="ml-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0B46E8] text-white shadow-[0_8px_24px_-6px_rgba(11,70,232,0.6)] ring-1 ring-black/5 transition hover:scale-105 hover:bg-[#0A3ECB] active:scale-95"
      >
        {open ? <X className="h-5 w-5" weight="bold" aria-hidden /> : <Bug className="h-[22px] w-[22px]" weight="fill" aria-hidden />}
      </button>
    </div>
  );
}
