// 파트너 앱 공용 라벨/스타일.
import type { PartnerApplicantStatus } from "../member-profile-client";

export const PARTNER_APPLICANT_STATUS: Record<PartnerApplicantStatus, { label: string; cls: string }> = {
  APPLIED: { label: "신규 지원", cls: "bg-[#EDF1FD] text-[#0B46E8]" },
  REVIEWING: { label: "검토 중", cls: "bg-[#FFF3E6] text-[#E8890C]" },
  INTERVIEW: { label: "면접", cls: "bg-[#FFF3E6] text-[#E8890C]" },
  OFFERED: { label: "합격 제안", cls: "bg-[#EDF1FD] text-[#0B46E8]" },
  ACCEPTED: { label: "합격", cls: "bg-[#E7F8EF] text-[#12B76A]" },
  REJECTED: { label: "불합격", cls: "bg-[#FDECEE] text-[#F04452]" },
  WITHDRAWN: { label: "철회", cls: "bg-[#F2F4F6] text-[#8B95A1]" },
  COMPLETED: { label: "완료", cls: "bg-[#F2F4F6] text-[#8B95A1]" }
};

type PositionStatus = "DRAFT" | "PENDING_REVIEW" | "OPEN" | "PAUSED" | "CLOSED" | "REJECTED";

export const PARTNER_POSITION_STATUS: Record<PositionStatus, { label: string; cls: string }> = {
  DRAFT: { label: "작성 중", cls: "bg-[#F2F4F6] text-[#8B95A1]" },
  PENDING_REVIEW: { label: "검토 요청", cls: "bg-[#FFF3E6] text-[#E8890C]" },
  OPEN: { label: "게시 중", cls: "bg-[#E7F8EF] text-[#12B76A]" },
  PAUSED: { label: "일시중지", cls: "bg-[#FFF3E6] text-[#E8890C]" },
  CLOSED: { label: "마감", cls: "bg-[#F2F4F6] text-[#8B95A1]" },
  REJECTED: { label: "반려", cls: "bg-[#FDECEE] text-[#F04452]" }
};

export const PARTNER_RECOMMENDATION: Record<"HIGH" | "NORMAL" | "CHECK", { label: string; cls: string }> = {
  HIGH: { label: "적극 추천", cls: "bg-[#E7F8EF] text-[#0A9B59]" },
  NORMAL: { label: "보통", cls: "bg-[#F2F4F6] text-[#8B95A1]" },
  CHECK: { label: "확인 필요", cls: "bg-[#FFF3E6] text-[#E8890C]" }
};

// ── 다국어 라벨 훅 — 상태 칩 텍스트를 언어별로. cls 는 위 맵에서 그대로 사용.
import { usePlatformT } from "../i18n";
export function usePartnerApplicantStatusLabel(): (k: PartnerApplicantStatus) => string {
  const t = usePlatformT();
  return (k) => {
    switch (k) {
      case "APPLIED": return t("신규 지원", "New", "新申请", "Mới", "新規", "Baru");
      case "REVIEWING": return t("검토 중", "Reviewing", "审核中", "Đang xem", "選考中", "Ditinjau");
      case "INTERVIEW": return t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara");
      case "OFFERED": return t("합격 제안", "Offer", "录用", "Đề nghị", "内定", "Tawaran");
      case "ACCEPTED": return t("합격", "Accepted", "已录用", "Đã nhận", "承諾", "Diterima");
      case "REJECTED": return t("불합격", "Rejected", "未通过", "Từ chối", "不採用", "Ditolak");
      case "WITHDRAWN": return t("철회", "Withdrawn", "已撤回", "Đã rút", "取消", "Ditarik");
      case "COMPLETED": return t("완료", "Done", "完成", "Hoàn tất", "完了", "Selesai");
      default: return k;
    }
  };
}
export function usePartnerPositionStatusLabel(): (k: string) => string {
  const t = usePlatformT();
  return (k) => {
    switch (k) {
      case "DRAFT": return t("작성 중", "Draft", "草稿", "Nháp", "下書き", "Draf");
      case "PENDING_REVIEW": return t("검토 요청", "Review", "待审", "Chờ duyệt", "審査待ち", "Menunggu");
      case "OPEN": return t("게시 중", "Open", "招募中", "Đang mở", "掲載中", "Dibuka");
      case "PAUSED": return t("일시중지", "Paused", "暂停", "Tạm dừng", "一時停止", "Dijeda");
      case "CLOSED": return t("마감", "Closed", "已截止", "Đã đóng", "締切", "Ditutup");
      case "REJECTED": return t("반려", "Rejected", "退回", "Bị trả", "差戻し", "Ditolak");
      default: return k;
    }
  };
}
export function usePartnerRecommendationLabel(): (k: "HIGH" | "NORMAL" | "CHECK") => string {
  const t = usePlatformT();
  return (k) => {
    switch (k) {
      case "HIGH": return t("적극 추천", "Top pick", "强烈推荐", "Đề xuất cao", "強く推薦", "Sangat");
      case "NORMAL": return t("보통", "Normal", "一般", "Bình thường", "普通", "Biasa");
      case "CHECK": return t("확인 필요", "Check", "需确认", "Cần kiểm tra", "要確認", "Cek");
      default: return k;
    }
  };
}
