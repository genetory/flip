"use client";

// 전역 버그·피드백 위젯 — 모든 페이지 우측 하단에 떠 있는 버튼(채널톡 스타일).
// 현재 화면 정보(URL·뷰포트·UA·로그인 사용자)와 함께 메시지를 API로 보내고,
// API가 Discord 팀 채널로 전달한다. 서버 저장/마이그레이션 없음.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChatCircleDots, X, PaperPlaneRight, CheckCircle, ImageSquare } from "@phosphor-icons/react";
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
  const [attachShot, setAttachShot] = useState(true);
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // body 포털 마운트(SSR 안전).
  useEffect(() => setMounted(true), []);

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

  // 실제 화면 그대로 캡처 — 브라우저 화면 캡처 API(getDisplayMedia)로 진짜 픽셀을 담는다.
  // 사용자가 공유를 취소하면 undefined(스크린샷 없이 전송).
  async function captureViaDisplayMedia(): Promise<string | undefined> {
    try {
      const md = navigator.mediaDevices as MediaDevices;
      const stream = await md.getDisplayMedia({
        video: { displaySurface: "browser" },
        audio: false,
        preferCurrentTab: true
      } as unknown as DisplayMediaStreamOptions);
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      await video.play().catch(() => {});
      await new Promise((r) => setTimeout(r, 250));
      const w = video.videoWidth;
      const h = video.videoHeight;
      let dataUrl: string | undefined;
      if (w && h) {
        const scale = Math.min(1, 1600 / Math.max(w, 1));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        }
      }
      video.pause();
      video.srcObject = null;
      stream.getTracks().forEach((track) => track.stop());
      return dataUrl;
    } catch {
      return undefined;
    }
  }

  // 폴백 — getDisplayMedia 미지원(모바일 등)에서 DOM 렌더 캡처. 위젯 자신은 제외.
  async function captureViaDom(): Promise<string | undefined> {
    try {
      const html2canvas = (await import("html2canvas")).default;
      const scale = Math.min(1, 1280 / Math.max(window.innerWidth, 1));
      const canvas = await html2canvas(document.body, {
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        scale,
        x: window.scrollX,
        y: window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight,
        ignoreElements: (el) => el === wrapperRef.current
      });
      return canvas.toDataURL("image/jpeg", 0.7);
    } catch {
      return undefined;
    }
  }

  async function captureScreenshot(): Promise<string | undefined> {
    const md = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    if (md && typeof md.getDisplayMedia === "function") {
      // 지원 브라우저: 실제 화면 캡처(취소 시 스크린샷 생략).
      return captureViaDisplayMedia();
    }
    return captureViaDom();
  }

  async function submit() {
    const text = message.trim();
    if (!text || status === "sending") return;
    setStatus("sending");
    try {
      const screenshot = attachShot ? await captureScreenshot() : undefined;
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
          reporterRole: user?.role || undefined,
          screenshot
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

  // body 직계 div 에 걸린 `overflow-x: clip`(가로 드리프트 방지)이 fixed 위젯의
  // 그림자를 좌우로 잘라내므로, body 로 포털 렌더 + inline overflow:visible 로 벗어난다.
  if (!mounted) return null;
  return createPortal(
    <div ref={wrapperRef} style={{ overflow: "visible" }} className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-[70] print:hidden">
      {/* 팝업 패널 */}
      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={t("버그·피드백 보내기", "Send feedback", "发送反馈", "Gửi phản hồi", "フィードバック送信", "Kirim masukan")}
          className="mb-3 w-[calc(100vw-2rem)] max-w-[340px] overflow-hidden rounded-2xl bg-white shadow-[0_16px_48px_-12px_rgba(15,23,42,0.4)] ring-1 ring-black/10"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#EEF0F3] px-4 py-3">
            <p className="text-[14px] font-bold text-[#191F28]">{t("무엇이든 알려주세요", "Tell us anything", "告诉我们", "Cho chúng tôi biết", "何でも教えてください", "Beri tahu kami")}</p>
            <button type="button" onClick={() => setOpen(false)} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="text-[#8B95A1] transition hover:text-[#191F28]">
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
                      category === c.key ? "bg-[#191F28] text-white" : "bg-[#F1F3F5] text-[#4E5968] hover:bg-[#E7EAEE]"
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
                className="w-full resize-none rounded-xl border border-[#E5E8EC] bg-[#FAFBFC] px-3 py-2.5 text-[13.5px] leading-[1.5] text-[#191F28] outline-none transition placeholder:text-[#B0B8C1] focus:border-[#191F28]"
              />
              {/* 이메일(선택) */}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("답장 받을 이메일(선택)", "Email for reply (optional)", "回复邮箱（可选）", "Email nhận phản hồi (tùy chọn)", "返信用メール(任意)", "Email balasan (opsional)")}
                className="mt-2 w-full rounded-xl border border-[#E5E8EC] bg-[#FAFBFC] px-3 py-2 text-[12.5px] text-[#191F28] outline-none transition placeholder:text-[#B0B8C1] focus:border-[#191F28]"
              />
              {/* 화면 캡처 첨부 토글 */}
              <label className="mt-2.5 flex cursor-pointer items-center gap-2 text-[12.5px] font-semibold text-[#4E5968]">
                <input
                  type="checkbox"
                  checked={attachShot}
                  onChange={(e) => setAttachShot(e.target.checked)}
                  className="h-4 w-4 accent-[#0B46E8]"
                />
                <ImageSquare className="h-4 w-4 text-[#8B95A1]" aria-hidden />
                {t("현재 화면 캡처 첨부", "Attach a screenshot", "附加当前截图", "Đính kèm ảnh màn hình", "現在の画面を添付", "Lampirkan tangkapan layar")}
              </label>
              {attachShot ? (
                <p className="mt-1 pl-6 text-[11px] leading-[1.4] text-[#B0B8C1]">{t("보낼 때 화면 공유 선택 창이 뜰 수 있어요", "A screen-share prompt may appear when sending", "发送时可能会出现共享选择窗口", "Có thể hiện cửa sổ chọn chia sẻ khi gửi", "送信時に画面共有の選択が表示される場合があります", "Dialog berbagi layar mungkin muncul saat mengirim")}</p>
              ) : null}
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
        className="ml-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0B46E8] text-white shadow-[0_4px_12px_rgba(11,70,232,0.32)] ring-1 ring-black/5 transition hover:scale-105 hover:bg-[#0A3ECB] active:scale-95"
      >
        {open ? <X className="h-5 w-5" weight="bold" aria-hidden /> : <ChatCircleDots className="h-[24px] w-[24px]" weight="fill" aria-hidden />}
      </button>
    </div>,
    document.body
  );
}
