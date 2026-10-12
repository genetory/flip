"use client";

// 국적 — 고르면 바로 계정(User.nationality)에 저장하고 세션을 새로 받아 다른 화면(비자 안내·외국인 채용 필터)도 바로 따라오게 한다.
import { useState } from "react";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { useLanguage } from "../../i18n/LanguageProvider";
import { usePlatformT } from "../../../lib/i18n";
import { updateMyBasicInfo } from "../../../lib/member-profile-client";
import { NATIONALITY_CODES, nationalityLabel } from "../../../lib/nationality";

export function NationalityField({
  className = "",
  onSaved,
}: {
  className?: string;
  onSaved?: (code: string) => void;
}) {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const { user, refreshSession } = useAuthSession();
  const [value, setValue] = useState<string>(user?.nationality ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const other = t("기타", "Other", "其他", "Khác", "その他", "Lainnya");
  // 예전에 글자로 저장된 값(운영자 입력)도 목록 맨 위에 그대로 보여 준다.
  const legacy =
    value && !(NATIONALITY_CODES as readonly string[]).includes(value)
      ? value
      : null;

  const save = async (code: string) => {
    setValue(code);
    setState("saving");
    try {
      await updateMyBasicInfo({ nationality: code || null });
      await refreshSession();
      setState("saved");
      onSaved?.(code);
    } catch {
      setState("error");
    }
  };

  return (
    <div className={className}>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => void save(e.target.value)}
          disabled={state === "saving"}
          aria-label={t(
            "국적",
            "Nationality",
            "国籍",
            "Quốc tịch",
            "国籍",
            "Kebangsaan",
          )}
          className="h-12 w-full appearance-none rounded-xl bg-[#F2F4F6] pl-4 pr-10 text-[16px] font-medium text-[#191F28] outline-none focus-visible:ring-2 focus-visible:ring-[#0B46E8]/40 disabled:opacity-60"
        >
          <option value="">
            {t(
              "국적을 골라 주세요",
              "Select nationality",
              "请选择国籍",
              "Chọn quốc tịch",
              "国籍を選んでください",
              "Pilih kebangsaan",
            )}
          </option>
          {legacy ? <option value={legacy}>{legacy}</option> : null}
          {NATIONALITY_CODES.map((code) => (
            <option key={code} value={code}>
              {nationalityLabel(code, locale, other)}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      <p className="mt-1.5 min-h-[18px] text-[13px] text-[#8B95A1]">
        {state === "saving"
          ? t(
              "저장하는 중…",
              "Saving…",
              "保存中…",
              "Đang lưu…",
              "保存中…",
              "Menyimpan…",
            )
          : state === "saved"
            ? t(
                "저장했어요",
                "Saved",
                "已保存",
                "Đã lưu",
                "保存しました",
                "Tersimpan",
              )
            : state === "error"
              ? t(
                  "저장하지 못했어요. 다시 골라 주세요.",
                  "Couldn't save. Try again.",
                  "保存失败，请重新选择。",
                  "Không lưu được. Thử lại.",
                  "保存できませんでした。",
                  "Gagal menyimpan.",
                )
              : t(
                  "외국인이면 비자에 맞춘 안내와 외국인 채용 공고를 보여 드려요.",
                  "If you're international, we tailor visa tips and foreigner-friendly jobs.",
                  "如果是外国人，我们会提供签证指南和外国人可申请的职位。",
                  "Nếu là người nước ngoài, chúng tôi gợi ý theo visa và việc làm phù hợp.",
                  "外国の方にはビザ案内と外国人採用の求人を表示します。",
                  "Jika WNA, kami tampilkan panduan visa dan lowongan untuk WNA.",
                )}
      </p>
    </div>
  );
}
