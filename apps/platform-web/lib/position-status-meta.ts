export type PositionStatus = "DRAFT" | "PENDING_REVIEW" | "OPEN" | "PAUSED" | "CLOSED" | "REJECTED";
export type PositionLocale = "ko" | "en" | "zh-CN" | "vi" | "ja" | "id";

type StatusMeta = {
  labelKo: string;
  labelEn: string;
  labelZh: string;
  labelVi: string;
  labelJa: string;
  labelId: string;
  badgeClassName: string;
};

const STATUS_META: Record<PositionStatus, StatusMeta> = {
  DRAFT: { labelKo: "임시저장", labelEn: "Draft", labelZh: "暂存", labelVi: "Bản nháp", labelJa: "下書き", labelId: "Draf", badgeClassName: "bg-slate-50 text-slate-700 border-slate-300" },
  PENDING_REVIEW: { labelKo: "승인대기", labelEn: "Pending review", labelZh: "待审核", labelVi: "Chờ duyệt", labelJa: "承認待ち", labelId: "Menunggu peninjauan", badgeClassName: "bg-amber-50 text-amber-800 border-amber-300" },
  OPEN: { labelKo: "모집중", labelEn: "Open", labelZh: "招聘中", labelVi: "Đang tuyển", labelJa: "募集中", labelId: "Dibuka", badgeClassName: "bg-blue-50 text-blue-700 border-blue-300" },
  PAUSED: { labelKo: "일시중지", labelEn: "Paused", labelZh: "已暂停", labelVi: "Tạm dừng", labelJa: "一時停止", labelId: "Dijeda", badgeClassName: "bg-cyan-50 text-cyan-800 border-cyan-300" },
  CLOSED: { labelKo: "마감", labelEn: "Closed", labelZh: "已结束", labelVi: "Đã đóng", labelJa: "終了", labelId: "Ditutup", badgeClassName: "bg-gray-100 text-gray-700 border-gray-300" },
  REJECTED: { labelKo: "반려", labelEn: "Rejected", labelZh: "已拒绝", labelVi: "Bị từ chối", labelJa: "却下", labelId: "Ditolak", badgeClassName: "bg-red-50 text-red-800 border-red-300" }
};

export function getPublicPositionStatusBadge(status: PositionStatus, locale: PositionLocale) {
  const meta = STATUS_META[status];
  const label =
    locale === "ko" ? meta.labelKo
      : locale === "zh-CN" ? meta.labelZh
        : locale === "vi" ? meta.labelVi
          : locale === "ja" ? meta.labelJa
            : locale === "id" ? meta.labelId
              : meta.labelEn;
  return { label, className: meta.badgeClassName };
}
