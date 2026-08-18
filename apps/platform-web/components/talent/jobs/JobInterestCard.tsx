"use client";

// 관심 직무 카드 — 두 형태.
//  - variant="link"(홈): 카드 전체 탭 → 선택 팝업.
//  - variant="edit"(계정설정·프로필): 카드에서 바로 수정(칩 인라인 삭제 + 추가 버튼).
import { useState } from "react";
import Link from "next/link";
import { CaretRight, Plus, X } from "@phosphor-icons/react";
import { useJobInterests, saveJobInterests } from "../../../lib/talent/job-interest";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { usePlatformT } from "../../../lib/i18n";
import { jobTaxonomyLabelOf } from "../../../lib/talent/job-taxonomy-labels";
import { JobInterestModal } from "./JobInterestModal";

export function JobInterestCard({ variant = "link" }: { variant?: "link" | "edit" }) {
  const t = usePlatformT();
  const interests = useJobInterests();
  const [open, setOpen] = useState(false);
  const has = interests.length > 0;

  if (variant === "edit") {
    const remove = (r: string) => saveJobInterests(interests.filter((x) => x !== r));
    return (
      <>
        <section className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
          {/* 인라인 편집 칩 — 각 칩 ×로 삭제, + 추가로 선택 팝업 */}
          <div className="flex flex-wrap gap-2">
            {interests.map((r) => (
              <span key={r} className="inline-flex items-center gap-1 rounded-full bg-[#EDF1FD] py-1.5 pl-3.5 pr-2 text-[12.5px] font-bold text-[#0B46E8]">
                {jobTaxonomyLabelOf(t, r)}
                <button
                  type="button"
                  onClick={() => remove(r)}
                  aria-label={t(`${jobTaxonomyLabelOf(t, r)} 삭제`, `Remove ${jobTaxonomyLabelOf(t, r)}`, `删除 ${jobTaxonomyLabelOf(t, r)}`, `Xóa ${jobTaxonomyLabelOf(t, r)}`, `${jobTaxonomyLabelOf(t, r)} を削除`, `Hapus ${jobTaxonomyLabelOf(t, r)}`)}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-[#8AA6EF] transition hover:bg-white/70 hover:text-[#0B46E8]"
                >
                  <X className="h-3 w-3" weight="bold" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#C7D6F7] px-3.5 py-1.5 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#F0F5FF]"
            >
              <Plus className="h-3.5 w-3.5" weight="bold" /> {t("추가", "Add", "添加", "Thêm", "追加", "Tambah")}
            </button>
          </div>

          {/* 값 — 관심 직무 맞춤 공고로 연결 */}
          {has ? (
            <Link
              href={talentAppRoutes.jobs}
              className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-[#F6F8FB] px-4 py-3 text-[13px] font-bold text-[#4E5968] transition hover:bg-[#EEF1F5] hover:text-[#0B46E8]"
            >
              {t("관심 직무 맞춤 공고 보기", "See jobs matched to your interests", "查看兴趣匹配职位", "Xem việc khớp sở thích", "関心職種に合う求人を見る", "Lihat lowongan sesuai minat")}
              <CaretRight className="h-4 w-4 shrink-0" weight="bold" />
            </Link>
          ) : null}
        </section>
        {open ? <JobInterestModal initial={interests} onClose={() => setOpen(false)} /> : null}
      </>
    );
  }

  // link 형태 — 카드 전체 탭 → 팝업
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center gap-3 rounded-2xl px-5 py-5 text-left transition ${
          has ? "border border-[#EEF1F5] bg-white hover:border-[#0B46E8]/40" : "border border-dashed border-[#DCE3F0] bg-[#FAFBFC] hover:border-[#0B46E8]/40"
        }`}
      >
        <div className="min-w-0 flex-1">
          {has ? (
            <>
              <p className="text-[15px] font-bold text-[#191F28]">{t("나의 관심 직무", "My job interests", "我的兴趣职位", "Nghề tôi quan tâm", "私の関心職種", "Minat pekerjaan saya")}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {interests.map((r) => (
                  <span key={r} className="rounded-full bg-[#EDF1FD] px-2.5 py-1 text-[12px] font-bold text-[#0B46E8]">{jobTaxonomyLabelOf(t, r)}</span>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-[14px] font-bold text-[#191F28]">{t("관심 직무를 골라주세요", "Pick your job interests", "请选择兴趣职位", "Chọn nghề bạn quan tâm", "関心職種を選んでください", "Pilih minat pekerjaan Anda")}</p>
              <p className="mt-0.5 break-keep text-[12.5px] text-[#8B95A1]">{t("고르면 나에게 맞는 공고를 추천해드려요.", "Pick some and we'll recommend matching jobs.", "选择后我们会推荐匹配的职位。", "Chọn xong chúng tôi sẽ gợi ý việc phù hợp.", "選ぶと自分に合う求人をおすすめします。", "Pilih dan kami rekomendasikan lowongan yang cocok.")}</p>
            </>
          )}
        </div>
        <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
      </button>
      {open ? <JobInterestModal initial={interests} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
