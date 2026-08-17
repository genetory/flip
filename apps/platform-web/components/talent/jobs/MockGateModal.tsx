"use client";

// 모의 면접 시작 전 서류 확인 팝업 — 지원과 동일하게 이력서·자기소개서 완성이 필수.
// 공고 상세(회사 모의)·내 커리어(내 서류 모의)에서 공용으로 사용.
import { useEffect } from "react";
import Link from "next/link";
import { X, Check } from "@phosphor-icons/react";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { useResumeDoc, resumeCompleteness } from "../../../lib/talent/resume-doc";
import { useCoverDoc, coverCompleteness } from "../../../lib/talent/cover-doc";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { usePlatformT } from "../../../lib/i18n";

// allowWithoutDocs: 공고 기반 모의면접처럼 이력서·자기소개서가 없어도 진행 가능한 경우.
// true면 강제하지 않고 '유무 차이'만 안내하며 시작 버튼을 항상 열어둔다.
export function MockGateModal({ onClose, onConfirm, allowWithoutDocs = false }: { onClose: () => void; onConfirm: () => void; allowWithoutDocs?: boolean }) {
  const t = usePlatformT();
  useLockBodyScroll();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const resume = useResumeDoc();
  const cover = useCoverDoc();
  const rp = resumeCompleteness(resume);
  const cp = coverCompleteness(cover);
  const ready = rp >= 100 && cp >= 100;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B1227]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-h-[90vh] w-full max-w-[420px] overflow-y-auto rounded-3xl bg-white shadow-[0_20px_60px_rgba(11,18,39,0.18)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-7 pt-7">
          <div>
            <h2 className="text-[19px] font-black tracking-[-0.02em] text-[#0B1227]">{t("모의 면접을 시작할까요?", "Start the mock interview?", "开始模拟面试？", "Bắt đầu phỏng vấn thử?", "模擬面接を始めますか？", "Mulai wawancara simulasi?")}</h2>
            <p className="mt-1.5 break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">{allowWithoutDocs ? t("이력서·자기소개서가 없어도 바로 시작할 수 있어요.", "You can start even without a resume or cover letter.", "没有简历或自我介绍也能直接开始。", "Bạn có thể bắt đầu ngay cả khi chưa có CV hay thư xin việc.", "履歴書・自己PRがなくてもすぐ始められます。", "Bisa mulai walau tanpa resume atau surat lamaran.") : t("지원과 동일하게 이력서·자기소개서가 준비돼야 시작할 수 있어요.", "Like applying, your resume and cover letter must be ready to start.", "与申请一样，需准备好简历和自我介绍才能开始。", "Giống như ứng tuyển, CV và thư xin việc phải sẵn sàng.", "応募と同様、履歴書・自己PRが準備できると始められます。", "Seperti melamar, resume dan surat lamaran harus siap.")}</p>
          </div>
          <button type="button" aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} onClick={onClose} className="-mr-1.5 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-2.5 px-7">
          <DocStatus label={t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")} pct={rp} href={talentAppRoutes.resume} />
          <DocStatus label={t("자기소개서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Surat lamaran")} pct={cp} href={talentAppRoutes.cover} />
        </div>

        {allowWithoutDocs ? (
          <p className="mx-7 mt-4 rounded-xl bg-[#F5F8FF] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#4E5968]">
            {ready
              ? t("이력서·자기소개서를 바탕으로 내 경험에 맞춘 질문이 나와요.", "Questions are tailored to your experience from your resume and cover letter.", "将根据你的简历与自我介绍，生成贴合你经历的问题。", "Câu hỏi được cá nhân hóa theo CV và thư xin việc của bạn.", "履歴書・自己PRを基に、あなたの経験に合わせた質問が出ます。", "Pertanyaan disesuaikan dengan pengalamanmu dari resume dan surat lamaran.")
              : t("지금은 서류가 없어 공고·직무 기반의 일반 질문이 나와요. 이력서·자기소개서를 완성하면 내 경험에 맞춘 질문으로 더 정확해져요.", "Without documents, you'll get general questions based on the posting and role. Completing your resume and cover letter makes them tailored to your experience.", "目前没有材料，将生成基于职位与岗位的通用问题。完善简历与自我介绍后，会更贴合你的经历。", "Chưa có hồ sơ nên sẽ là câu hỏi chung theo tin tuyển dụng và vị trí. Hoàn thiện CV và thư xin việc sẽ chính xác hơn theo bạn.", "書類がない今は求人・職務ベースの一般質問です。履歴書・自己PRを完成すると、あなたの経験に合わせて精度が上がります。", "Tanpa dokumen, pertanyaan bersifat umum berdasarkan lowongan dan peran. Melengkapi resume dan surat lamaran membuatnya sesuai pengalamanmu.")}
          </p>
        ) : !ready ? (
          <p className="mx-7 mt-4 rounded-xl bg-[#FDECEE] px-3.5 py-2.5 text-[12.5px] font-semibold leading-relaxed text-[#F04452]">
            {t("서류를 완성해야 모의 면접을 볼 수 있어요. 미완성 서류를 마저 채워주세요.", "Complete your documents to take the mock interview. Please finish the unfinished ones.", "完成材料后才能进行模拟面试。请补全未完成的材料。", "Hoàn tất hồ sơ để phỏng vấn thử. Hãy hoàn thiện phần còn thiếu.", "書類を完成させると模擬面接を受けられます。未完成の書類を仕上げてください。", "Lengkapi dokumen untuk wawancara simulasi. Selesaikan yang belum selesai.")}
          </p>
        ) : null}

        <div className="px-7 pb-7 pt-6">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!allowWithoutDocs && !ready}
            className="inline-flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#0B46E8] px-5 text-[15px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("모의 면접 시작하기", "Start mock interview", "开始模拟面试", "Bắt đầu phỏng vấn thử", "模擬面接を始める", "Mulai wawancara simulasi")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DocStatus({ label, pct, href }: { label: string; pct: number; href: string }) {
  const t = usePlatformT();
  const done = pct >= 100;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#EEF1F5] bg-white p-4">
      {done ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[#0B46E8]">
          <Check className="h-4 w-4" weight="bold" />
        </span>
      ) : (
        <span className="w-9 shrink-0 text-center text-[14px] font-black text-[#B0B8C1]">{pct}%</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-[#191F28]">{label}</p>
        <p className="text-[12px] text-[#8B95A1]">{done ? t("준비됐어요", "Ready", "已就绪", "Sẵn sàng", "準備完了", "Siap") : pct === 0 ? t("아직 시작 전이에요", "Not started yet", "尚未开始", "Chưa bắt đầu", "まだ未着手です", "Belum dimulai") : t("완성도를 채워주세요", "Please complete it", "请完善内容", "Hãy hoàn thiện", "完成度を上げてください", "Silakan lengkapi")}</p>
      </div>
      {!done ? (
        <Link href={href} className="shrink-0 rounded-lg bg-[#F2F4F6] px-3 py-1.5 text-[12px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]">
          {pct === 0 ? t("만들기", "Create", "创建", "Tạo", "作成", "Buat") : t("완성하기", "Complete", "完善", "Hoàn tất", "完成する", "Lengkapi")}
        </Link>
      ) : null}
    </div>
  );
}
