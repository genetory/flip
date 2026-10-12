"use client";

// 전역 버그·피드백 위젯 — 모든 페이지 우측 하단에 떠 있는 버튼(채널톡 스타일).
// 현재 화면 정보(URL·뷰포트·UA·로그인 사용자)와 함께 메시지를 API로 보내고,
// API가 Discord 팀 채널로 전달한다. 서버 저장/마이그레이션 없음.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { ChatCircleDots, X, PaperPlaneRight, CheckCircle, ImageSquare } from "@phosphor-icons/react";
import { usePlatformT } from "../../lib/i18n";
import { useAuthSession } from "../auth/AuthSessionProvider";

type Category = "bug" | "idea" | "etc";

// 전체 화면 편집기처럼 오른쪽 아래가 작업 공간인 화면에선 띄우지 않는다.
const HIDDEN_PATHS = ["/talent/career/resume/editor", "/talent/career/cover/editor"];

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
  const pathname = usePathname();
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
  if (!mounted || HIDDEN_PATHS.includes(pathname ?? "")) return null;
  return createPortal(
    <div
      ref={wrapperRef}
      // --fab-bottom-offset: 하단 고정 액션 바(예: 채용 상세 '지원하기')가 있는 화면에서
      // 그 바가 이 버튼을 덮지 않도록 위로 비켜서는 값. 해당 화면이 :root 에 설정한다.
      style={{ overflow: "visible", bottom: "calc(max(1.25rem, env(safe-area-inset-bottom)) + var(--fab-bottom-offset, 0px))" }}
      className="fixed right-5 z-[70] print:hidden"
    >
      {/* 팝업 패널 — v2 테마(흰 카드·채운 입력칸·알약 칩·48px 버튼). 포털이라 v2 CSS 변수가 닿지 않아 값으로 쓴다. */}
      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={t("버그·피드백 보내기", "Send feedback", "发送反馈", "Gửi phản hồi", "フィードバック送信", "Kirim masukan")}
          className="mb-3 w-[calc(100vw-2.5rem)] max-w-[360px] overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_-16px_rgba(25,31,40,0.35)] ring-1 ring-black/[0.06]"
        >
          <div className="flex items-start justify-between gap-2 px-5 pb-1 pt-5">
            <div className="min-w-0">
              <p className="text-[18px] font-bold leading-[1.4] text-[#191F28]">{t("무엇이든 알려주세요", "Tell us anything", "告诉我们", "Cho chúng tôi biết", "何でも教えてください", "Beri tahu kami")}</p>
              {status !== "sent" ? <p className="mt-0.5 text-[14px] leading-[1.5] text-[#6B7684]">{t("이 화면에서 불편한 점, 바라는 점 모두 좋아요", "Anything you noticed on this screen", "此页面的任何问题或建议", "Mọi điều bạn thấy ở màn hình này", "この画面で気づいたこと何でも", "Apa pun yang kamu temukan di layar ini")}</p> : null}
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="-mr-2 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#8B95A1] transition hover:bg-[#F2F4F6]">
              <X className="h-5 w-5" weight="bold" aria-hidden />
            </button>
          </div>

          {status === "sent" ? (
            <div className="flex flex-col items-center gap-2 px-5 pb-9 pt-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f8f1]">
                <CheckCircle className="h-8 w-8 text-[#00A661]" weight="fill" aria-hidden />
              </span>
              <p className="mt-1 text-[16px] font-bold text-[#191F28]">{t("보내주셔서 감사해요!", "Thanks for the report!", "感谢反馈！", "Cảm ơn bạn!", "ありがとうございます！", "Terima kasih!")}</p>
              <p className="text-[14px] text-[#6B7684]">{t("빠르게 확인하겠습니다.", "We'll look into it soon.", "我们会尽快查看。", "Chúng tôi sẽ xem sớm.", "すぐに確認します。", "Kami akan segera cek.")}</p>
            </div>
          ) : (
            <div className="px-5 pb-5 pt-3">
              {/* 분류 */}
              <div className="mb-3 flex gap-1.5">
                {cats.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    aria-pressed={category === c.key}
                    className={`inline-flex h-9 items-center rounded-full px-3.5 text-[14px] font-semibold transition ${
                      category === c.key ? "bg-[#191F28] text-white" : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]"
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
                className="w-full resize-none rounded-2xl bg-[#F2F4F6] px-4 py-3 text-[16px] leading-[1.55] text-[#191F28] outline-none ring-[#0B46E8] transition placeholder:text-[#8B95A1] focus:bg-white focus:ring-2"
              />
              {/* 이메일(선택) */}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("답장 받을 이메일(선택)", "Email for reply (optional)", "回复邮箱（可选）", "Email nhận phản hồi (tùy chọn)", "返信用メール(任意)", "Email balasan (opsional)")}
                className="mt-2 h-12 w-full rounded-2xl bg-[#F2F4F6] px-4 text-[16px] text-[#191F28] outline-none ring-[#0B46E8] transition placeholder:text-[#8B95A1] focus:bg-white focus:ring-2"
              />
              {/* 화면 캡처 첨부 토글 */}
              <button
                type="button"
                role="switch"
                aria-checked={attachShot}
                onClick={() => setAttachShot((v) => !v)}
                className="mt-3 flex w-full items-center gap-3 rounded-2xl px-1 py-1 text-left"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf1fd]">
                  <ImageSquare className="h-[18px] w-[18px] text-[#0B46E8]" weight="fill" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-[#333D4B]">{t("현재 화면 캡처 첨부", "Attach a screenshot", "附加当前截图", "Đính kèm ảnh màn hình", "現在の画面を添付", "Lampirkan tangkapan layar")}</span>
                  {attachShot ? <span className="mt-0.5 block text-[12px] leading-[1.4] text-[#8B95A1]">{t("보낼 때 화면 공유 창이 뜰 수 있어요", "A screen-share prompt may appear", "发送时可能出现共享窗口", "Có thể hiện cửa sổ chia sẻ", "画面共有の選択が出る場合があります", "Dialog berbagi layar mungkin muncul")}</span> : null}
                </span>
                <span className={`relative h-6 w-10 shrink-0 rounded-full transition ${attachShot ? "bg-[#0B46E8]" : "bg-[#D1D6DB]"}`} aria-hidden>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${attachShot ? "left-[18px]" : "left-0.5"}`} />
                </span>
              </button>
              {status === "error" ? (
                <p className="mt-2 text-[13px] font-semibold text-[#F04452]">{t("전송에 실패했어요. 잠시 후 다시 시도해 주세요.", "Failed to send. Please try again.", "发送失败，请稍后重试。", "Gửi thất bại. Thử lại sau.", "送信に失敗しました。もう一度お試しください。", "Gagal mengirim. Coba lagi.")}</p>
              ) : null}
              <button
                type="button"
                onClick={submit}
                disabled={!message.trim() || status === "sending"}
                className="mt-4 flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-[#0B46E8] text-[16px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <PaperPlaneRight className="h-[18px] w-[18px]" weight="fill" aria-hidden />
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
        className="ml-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0B46E8] text-white shadow-[0_8px_24px_-6px_rgba(11,70,232,0.45)] transition hover:opacity-90 active:scale-95"
      >
        {open ? <X className="h-5 w-5" weight="bold" aria-hidden /> : <ChatCircleDots className="h-[24px] w-[24px]" weight="fill" aria-hidden />}
      </button>
    </div>,
    document.body
  );
}
