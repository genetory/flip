"use client";

// 저장 상태 표시 — 이력서·자소서는 긴 글을 쓰는 화면이라 "지금 저장됐나?"가 불안 요소다.
// 저장은 renewal-docs-store 가 700ms debounce 로 서버 Resume.content 에 PATCH 한다.
import { CloudCheck, CloudArrowUp, WarningCircle } from "@phosphor-icons/react";
import { useDocsSaveState } from "../../../lib/talent/resume-doc";
import { usePlatformT } from "../../../lib/i18n";

export function SaveStatus({ className = "" }: { className?: string }) {
  const t = usePlatformT();
  const state = useDocsSaveState();
  // 한 번도 안 바꿨으면(idle) 아무것도 띄우지 않는다 — 불필요한 노이즈.
  if (state === "idle") return null;

  if (state === "error") {
    return (
      <span className={`inline-flex items-center gap-1 text-[11.5px] font-bold text-[#F04452] ${className}`} role="status">
        <WarningCircle className="h-3.5 w-3.5" weight="fill" />
        {t("저장 실패 · 재시도 중","Save failed · retrying","保存失败·重试中","Lưu lỗi · đang thử lại","保存失敗・再試行中","Gagal · mencoba lagi")}
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className={`inline-flex items-center gap-1 text-[11.5px] font-bold text-[#8B95A1] ${className}`} role="status">
        <CloudCheck className="h-3.5 w-3.5" weight="fill" />
        {t("저장됨","Saved","已保存","Đã lưu","保存済み","Tersimpan")}
      </span>
    );
  }
  // pending · saving
  return (
    <span className={`inline-flex items-center gap-1 text-[11.5px] font-bold text-[#B0B8C1] ${className}`} role="status">
      <CloudArrowUp className="h-3.5 w-3.5" weight="fill" />
      {t("저장 중…","Saving…","保存中…","Đang lưu…","保存中…","Menyimpan…")}
    </span>
  );
}
