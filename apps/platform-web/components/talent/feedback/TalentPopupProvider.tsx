"use client";

// Talent 전용 확인 팝업 — Aply CIP 모달과 동일한 UI/UX(라이트/화이트, 블루 액센트,
// 넉넉한 여백, 부드러운 그림자, 뒷배경 블러). 전역 토스트 대신 talent 영역에서 사용한다.
// API 는 토스트와 호환(success/error/info)해 기존 호출부를 그대로 옮길 수 있다.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { X, Check, WarningCircle, Info } from "@phosphor-icons/react";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { usePlatformT } from "../../../lib/i18n";

type PopupKind = "success" | "error" | "info";

interface PopupItem {
  id: number;
  kind: PopupKind;
  message: string;
}

interface TalentPopupValue {
  notify: (message: string, kind?: PopupKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const TalentPopupContext = createContext<TalentPopupValue | null>(null);

export function TalentPopupProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<PopupItem | null>(null);

  const notify = useCallback((message: string, kind: PopupKind = "info") => {
    setCurrent((prev) => ({ id: (prev?.id ?? 0) + 1, kind, message }));
  }, []);

  const close = useCallback(() => setCurrent(null), []);

  const value = useMemo<TalentPopupValue>(
    () => ({
      notify,
      success: (message) => notify(message, "success"),
      error: (message) => notify(message, "error"),
      info: (message) => notify(message, "info")
    }),
    [notify]
  );

  return (
    <TalentPopupContext.Provider value={value}>
      {children}
      {current ? <PopupCard item={current} onClose={close} /> : null}
    </TalentPopupContext.Provider>
  );
}

export function useTalentPopup(): TalentPopupValue {
  const ctx = useContext(TalentPopupContext);
  if (!ctx) throw new Error("useTalentPopup must be used within TalentPopupProvider");
  return ctx;
}

const ICON = {
  success: { Icon: Check, bg: "bg-[#EDF1FD]", fg: "text-[#0B46E8]" },
  error: { Icon: WarningCircle, bg: "bg-[#FDECEE]", fg: "text-[#F04452]" },
  info: { Icon: Info, bg: "bg-[#EDF1FD]", fg: "text-[#0B46E8]" }
} as const;

function PopupCard({ item, onClose }: { item: PopupItem; onClose: () => void }) {
  const t = usePlatformT();
  useLockBodyScroll();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, item.id]);

  const { Icon, bg, fg } = ICON[item.kind];

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={item.message}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0B1227]/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[440px] overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(11,18,39,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6] hover:text-[#4E5968]"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 본문 */}
        <div className="px-7 pb-2 pt-9 text-center">
          <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${bg}`}>
            <Icon className={`h-7 w-7 ${fg}`} weight="bold" />
          </span>
          <h2 className="mt-5 break-keep text-[18px] font-black leading-[1.4] tracking-[-0.02em] text-[#0B1227]">{item.message}</h2>
        </div>

        {/* 액션 */}
        <div className="px-7 pb-7 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#0B46E8] px-5 text-[15px] font-bold text-white transition hover:bg-[#0A3ECB]"
          >
            {t("확인", "OK", "确定", "Xác nhận", "確認", "OK")}
          </button>
        </div>
      </div>
    </div>
  );
}
