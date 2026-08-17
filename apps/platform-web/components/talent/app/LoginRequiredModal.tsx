"use client";

// 회원 전용 기능(저장·모의면접·지원 등)을 게스트가 시도하면 뜨는 로그인 유도 팝업.
// useLoginGate() 로 감싸 사용: 로그인돼 있으면 동작 실행, 아니면 팝업 → 로그인 페이지 이동.
import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Lock, X } from "@phosphor-icons/react";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { usePlatformT } from "../../../lib/i18n";

export function useLoginGate(opts: { loginPath?: string } = {}) {
  const { isAuthenticated } = useAuthSession();
  const [open, setOpen] = useState(false);
  // 로그인돼 있으면 action 실행, 아니면 로그인 팝업. 반환값: 진행 가능 여부.
  const ensure = useCallback(
    (action?: () => void): boolean => {
      if (isAuthenticated) {
        action?.();
        return true;
      }
      setOpen(true);
      return false;
    },
    [isAuthenticated]
  );
  const modal = open ? <LoginRequiredModal onClose={() => setOpen(false)} loginPath={opts.loginPath} /> : null;
  return { ensure, modal };
}

export function LoginRequiredModal({ onClose, loginPath = "/login" }: { onClose: () => void; loginPath?: string }) {
  const t = usePlatformT();
  const router = useRouter();
  const pathname = usePathname() ?? "/talent/jobs";
  const search = useSearchParams();
  useLockBodyScroll();

  const goLogin = () => {
    const qs = search?.toString();
    const here = qs ? `${pathname}?${qs}` : pathname;
    onClose();
    router.push(`${loginPath}?next=${encodeURIComponent(here)}`);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0B1227]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-[380px] overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(11,18,39,0.18)]" onClick={(e) => e.stopPropagation()}>
        <button type="button" aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} onClick={onClose} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]">
          <X className="h-5 w-5" />
        </button>
        <div className="px-7 pb-7 pt-9 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[#0B46E8]">
            <Lock className="h-6 w-6" weight="fill" />
          </span>
          <h2 className="mt-4 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{t("로그인이 필요한 기능이에요", "Login required", "需要登录才能使用", "Cần đăng nhập", "ログインが必要な機能です", "Perlu masuk")}</h2>
          <p className="mt-1.5 break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">{t("저장·모의 면접·지원 같은 회원 전용 기능이에요. 로그인하고 이용해 주세요.", "Saving, mock interviews, and applying are member-only. Please log in to continue.", "收藏、模拟面试、投递等为会员专属功能。请登录后使用。", "Lưu, phỏng vấn thử, ứng tuyển là tính năng dành cho thành viên. Vui lòng đăng nhập.", "保存・模擬面接・応募などは会員限定機能です。ログインしてご利用ください。", "Simpan, wawancara simulasi, dan melamar khusus anggota. Silakan masuk dulu.")}</p>
          <button type="button" onClick={goLogin} className="mt-5 inline-flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#0B46E8] px-5 text-[15px] font-bold text-white transition hover:bg-[#0A3ECB]">
            {t("로그인하기", "Log in", "去登录", "Đăng nhập", "ログインする", "Masuk")}
          </button>
        </div>
      </div>
    </div>
  );
}
