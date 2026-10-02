"use client";

// 공고 상세의 외국인 지원 상태 + 판정 근거.
// 단정하지 않는 것이 핵심 — "가능성 높음"을 지원 가능으로 읽히게 쓰지 않고, 정보가 없으면
// '불가'가 아니라 '확인 필요'로 적는다.
import { usePlatformT } from "../../../lib/i18n";
import {
  deriveForeignerEligibility,
  eligibilityLabel,
  eligibilityReason,
  eligibilityTone,
  type EligibilityInput
} from "../../../lib/talent/foreigner-eligibility";

export function ForeignerEligibilityNote({ item }: { item: EligibilityInput & { eligibleVisas?: string[] | null } }) {
  const t = usePlatformT();
  const state = deriveForeignerEligibility(item);
  const tone = eligibilityTone(state);
  const visas = (item.eligibleVisas ?? []).filter((v) => v && v !== "FOREIGNER_FRIENDLY");

  return (
    <section className="mt-5 rounded-2xl border border-[#EEF1F5] bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-bold leading-none"
          style={{ backgroundColor: tone.bg, color: tone.fg }}
        >
          {eligibilityLabel(state, (ko, en) => t(ko, en))}
        </span>
        <span className="text-[12px] font-semibold text-[#8B95A1]">
          {t("외국인 지원", "For foreign applicants", "外国人应聘", "Ứng viên nước ngoài", "外国人の応募", "Pelamar WNA")}
        </span>
      </div>
      <p className="mt-2 break-keep text-[13px] leading-relaxed text-[#4E5968]">
        {eligibilityReason(state, (ko, en) => t(ko, en))}
      </p>
      {visas.length > 0 ? (
        <p className="mt-2 text-[12.5px] leading-relaxed text-[#333D4B]">
          <span className="font-bold">{t("지원 가능 비자", "Visas accepted", "可申请签证", "Visa được nhận", "応募可能なビザ", "Visa diterima")}</span>{" "}
          {visas.join(", ")}
        </p>
      ) : null}
      <p className="mt-2 text-[11.5px] leading-relaxed text-[#8B95A1]">
        {t(
          "비자·체류 요건은 개인 상황과 출입국 판단에 따라 달라져요. APLY 는 지원 자격이나 비자 발급을 보장하지 않습니다.",
          "Visa requirements depend on your situation and immigration review. Aply does not guarantee eligibility or a visa."
        )}
      </p>
    </section>
  );
}
