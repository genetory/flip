"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import {
  addMyFavoritePosition,
  applyMyPosition,
  getMyCandidateProfile,
  getMyAppliedPositions,
  getMyApplications,
  withdrawMyApplication,
  type MyApplication,
  getMyFavoritePositions,
  getMyPartnerOrganization,
  getMyPartnerPositions,
  removeMyFavoritePosition,
  type MyCandidateProfile,
  type MyPartnerOrganization,
  type PartnerPosition,
  type PublicPositionListItem
} from "../../lib/member-profile-client";
import { getPublicPositionStatusBadge } from "../../lib/position-status-meta";
import { partnerIndustryLabel } from "../../lib/partner-industry-labels";
import { getApplicationStatusLabel } from "../../lib/status-labels";
import { ReportIssueModal } from "../issues/ReportIssueModal";
import { SelectInterviewSlotModal } from "../interviews/SelectInterviewSlotModal";
import { ProfileCompletionMeter } from "../profile/ProfileCompletionMeter";
import { getStoredProfilePhoto } from "../../lib/profile-media";
import type { PlatformLocale } from "../../lib/auth-messages";
import { BadgeCheck, Bookmark, Briefcase, LayoutGrid, List, Mail, MapPin } from "lucide-react";

const PROFILE_SQUIRCLE_CLIP_ID = "profile-page-squircle-clip";
const PROFILE_SQUIRCLE_PATH = "M50,0 C74,0 86,3 93,10 C97,14 100,26 100,50 C100,74 97,86 93,90 C86,97 74,100 50,100 C26,100 14,97 7,90 C3,86 0,74 0,50 C0,26 3,14 7,10 C14,3 26,0 50,0 Z";
const PROFILE_SQUIRCLE_STYLE = {
  clipPath: `url(#${PROFILE_SQUIRCLE_CLIP_ID})`,
  WebkitClipPath: `url(#${PROFILE_SQUIRCLE_CLIP_ID})`
} as const;

type ProfileSection = {
  title: string;
  description: string;
  fields: string[];
};

type StudentResumeSection = {
  title: string;
  description: string;
  fields: Array<{ label: string; value: string }>;
  href: string;
};

type CompanyFieldKind = "text" | "logo" | "additional";
type PartnerPositionNotification = {
  id: string;
  positionId: string;
  positionTitle: string;
  kind: "status" | "progress";
  message: string;
  createdAt: string;
};

function formatIsoDate(value?: string | null) {
  if (!value) return "-";
  return value.slice(0, 10);
}

function formatList(values?: string[] | null) {
  if (!values || values.length === 0) return "-";
  return values.join(", ");
}

function toDisplayTitle(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function inferWorkType(value?: string | null): "On-site" | "Hybrid" | "Remote" {
  const text = (value ?? "").toLowerCase();
  if (text.includes("remote") || text.includes("재택")) return "Remote";
  if (text.includes("hybrid") || text.includes("하이브리드")) return "Hybrid";
  return "On-site";
}

function workTypeLabel(value: string, locale: PlatformLocale) {
  const normalized = value.toLowerCase().replace(/[\s_-]/g, "");
  const pick = (ko: string, en: string, zh: string, vi: string, ja: string = en, id: string = en) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? ja : locale === "id" ? id : en;
  if (normalized === "remote") return pick("원격근무", "Remote", "远程办公", "Làm việc từ xa", "リモート勤務", "Kerja jarak jauh");
  if (normalized === "hybrid") return pick("혼합근무", "Hybrid", "混合办公", "Làm việc kết hợp", "ハイブリッド勤務", "Hybrid");
  if (normalized === "onsite") return pick("대면근무", "On-site", "现场办公", "Làm việc tại văn phòng", "オフィス勤務", "Di kantor");
  return value;
}

function formatPostedDate(value: string, locale: PlatformLocale) {
  const created = new Date(value);
  if (Number.isNaN(created.getTime())) return "-";
  const now = Date.now();
  const diffMs = Math.max(0, now - created.getTime());
  const minutes = Math.floor(diffMs / (60 * 1000));
  const pick = (ko: string, en: string, zh: string, vi: string, ja: string = en, id: string = en) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? ja : locale === "id" ? id : en;
  if (minutes < 60) {
    const n = Math.max(1, minutes);
    return pick(`${n}분 전`, `${n}m ago`, `${n} 分钟前`, `${n} phút trước`, `${n}分前`, `${n} menit lalu`);
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return pick(`${hours}시간 전`, `${hours}h ago`, `${hours} 小时前`, `${hours} giờ trước`, `${hours}時間前`, `${hours} jam lalu`);
  const days = Math.floor(hours / 24);
  if (days < 7) return pick(`${days}일 전`, `${days}d ago`, `${days} 天前`, `${days} ngày trước`, `${days}日前`, `${days} hari lalu`);
  const y = created.getFullYear();
  const m = String(created.getMonth() + 1).padStart(2, "0");
  const d = String(created.getDate()).padStart(2, "0");
  return `${y}. ${m}. ${d}`;
}

function getPositionStatusBadge(
  status: PublicPositionListItem["status"],
  locale: PlatformLocale
) {
  return getPublicPositionStatusBadge(status, locale);
}

function companyHref(partnerOrganizationId?: string | null) {
  if (!partnerOrganizationId?.trim()) return null;
  return `/companies/${encodeURIComponent(partnerOrganizationId.trim())}`;
}

export function ProfilePage() {
  const { locale } = useLanguage();
  const tr = (ko: string, en: string, zh: string = en, vi: string = en, ja: string = en, id: string = en) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? ja : locale === "id" ? id : en;
  const { user, isReady, isAuthenticated, logout } = useAuthSession();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [partnerOrg, setPartnerOrg] = useState<MyPartnerOrganization | null>(null);
  const [partnerOrgChecked, setPartnerOrgChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "positions" | "notifications">("info");
  const [studentTab, setStudentTab] = useState<"info" | "resume" | "applied" | "favorites">("info");
  const [postedPositions, setPostedPositions] = useState<PublicPositionListItem[]>([]);
  const [partnerPositions, setPartnerPositions] = useState<PartnerPosition[]>([]);
  const [positionsError, setPositionsError] = useState<string | null>(null);
  const [postedViewMode, setPostedViewMode] = useState<"grid" | "list">("list");
  const [studentViewMode, setStudentViewMode] = useState<"grid" | "list">("list");
  const [favoritePositions, setFavoritePositions] = useState<PublicPositionListItem[]>([]);
  const [appliedPositions, setAppliedPositions] = useState<PublicPositionListItem[]>([]);
  const [applications, setApplications] = useState<MyApplication[]>([]);
  const [reportTarget, setReportTarget] = useState<MyApplication | null>(null);
  const [interviewTarget, setInterviewTarget] = useState<MyApplication | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  async function handleWithdraw(app: MyApplication) {
    const confirmed = window.confirm(
      `'${app.positionTitle}' 지원을 철회하시겠습니까? 철회 후에는 다시 지원하기 어려울 수 있어요.`
    );
    if (!confirmed) return;
    setWithdrawingId(app.id);
    try {
      await withdrawMyApplication(app.id);
      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: "WITHDRAWN" as const } : a))
      );
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "철회에 실패했습니다.");
    } finally {
      setWithdrawingId(null);
    }
  }
  const [studentPositionsError, setStudentPositionsError] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<MyCandidateProfile | null>(null);

  const canEditBasic = user?.role === "PARTNER" || user?.role === "STUDENT";

  const positionNotifications = useMemo<PartnerPositionNotification[]>(() => {
    const notifications = partnerPositions.flatMap((position) => {
      const statusLogs = (position.statusHistories ?? []).map((history) => {
        const fromLabel = history.fromStatus ? getPublicPositionStatusBadge(history.fromStatus, locale).label : null;
        const toLabel = getPublicPositionStatusBadge(history.toStatus, locale).label;
        const base = fromLabel ? `${fromLabel} -> ${toLabel}` : toLabel;
        return {
          id: `status-${history.id}`,
          positionId: position.id,
          positionTitle: position.title,
          kind: "status" as const,
          message: history.note?.trim()
            ? `${tr("상태가 변경되었습니다", "Status has been changed", "状态已变更", "Trạng thái đã thay đổi", "ステータスが変更されました", "Status telah diubah")} (${base}, ${history.note.trim()})`
            : `${tr("상태가 변경되었습니다", "Status has been changed", "状态已变更", "Trạng thái đã thay đổi", "ステータスが変更されました", "Status telah diubah")} (${base})`,
          createdAt: history.createdAt
        };
      });

      const progressLogs = (position.postingProgressLogs ?? []).map((log) => ({
        id: `progress-${log.id}`,
        positionId: position.id,
        positionTitle: position.title,
        kind: "progress" as const,
        message: log.message,
        createdAt: log.createdAt
      }));

      return [...statusLogs, ...progressLogs];
    });

    return notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 30);
  }, [locale, partnerPositions, tr]);

  const enumDisplay = (value?: string | null) => {
    if (!value) return "-";
    const visa: Record<string, string> = {
      D10_JOB_SEEKING: tr("D-10 구직", "D-10 Job Seeking", "D-10 求职", "D-10 Tìm việc", "D-10 求職", "D-10 Pencari kerja"),
      D2_STUDENT: tr("D-2 유학", "D-2 Student", "D-2 留学", "D-2 Du học", "D-2 留学", "D-2 Pelajar"),
      D4_GENERAL_TRAINING: tr("D-4 일반연수", "D-4 General Training", "D-4 一般研修", "D-4 Đào tạo chung", "D-4 一般研修", "D-4 Pelatihan umum"),
      F2_RESIDENCE: tr("F-2 거주", "F-2 Residence", "F-2 居住", "F-2 Cư trú", "F-2 居住", "F-2 Tempat tinggal"),
      F4_OVERSEAS_KOREAN: tr("F-4 재외동포", "F-4 Overseas Korean", "F-4 在外同胞", "F-4 Người Hàn ở nước ngoài", "F-4 在外同胞", "F-4 Diaspora Korea"),
      F5_PERMANENT_RESIDENCE: tr("F-5 영주", "F-5 Permanent Residence", "F-5 永住", "F-5 Thường trú", "F-5 永住", "F-5 Penduduk tetap"),
      F6_MARRIAGE_IMMIGRATION: tr("F-6 결혼이민", "F-6 Marriage Immigration", "F-6 结婚移民", "F-6 Kết hôn nhập cư", "F-6 結婚移民", "F-6 Imigrasi pernikahan"),
      E7_SPECIFIC_ACTIVITY: tr("E-7 특정활동", "E-7 Specific Activity", "E-7 特定活动", "E-7 Hoạt động cụ thể", "E-7 特定活動", "E-7 Aktivitas khusus"),
      H1_WORKING_HOLIDAY: tr("H-1 워킹홀리데이", "H-1 Working Holiday", "H-1 打工度假", "H-1 Working Holiday", "H-1 ワーキングホリデー", "H-1 Working Holiday"),
      OTHER: tr("기타", "Other", "其他", "Khác", "その他", "Lainnya")
    };
    const educationType: Record<string, string> = {
      HIGH_SCHOOL: tr("고등학교", "High School", "高中", "Trung học phổ thông", "高校", "Sekolah menengah atas"),
      ASSOCIATE: tr("전문학사", "Associate", "专科", "Cao đẳng", "短期大学士", "Diploma"),
      BACHELOR: tr("학사", "Bachelor", "学士", "Cử nhân", "学士", "Sarjana"),
      MASTER: tr("석사", "Master", "硕士", "Thạc sĩ", "修士", "Magister"),
      DOCTOR: tr("박사", "Doctor", "博士", "Tiến sĩ", "博士", "Doktor"),
      BOOTCAMP: tr("부트캠프", "Bootcamp", "训练营", "Bootcamp", "ブートキャンプ", "Bootcamp"),
      CERTIFICATE: tr("자격/수료", "Certificate", "资格/结业", "Chứng chỉ", "資格・修了", "Sertifikat"),
      OTHER: tr("기타", "Other", "其他", "Khác", "その他", "Lainnya")
    };
    const educationStatus: Record<string, string> = {
      ENROLLED: tr("재학", "Enrolled", "在读", "Đang học", "在学中", "Aktif kuliah"),
      GRADUATED: tr("졸업", "Graduated", "毕业", "Đã tốt nghiệp", "卒業", "Lulus"),
      LEAVE_OF_ABSENCE: tr("휴학", "Leave of Absence", "休学", "Bảo lưu", "休学", "Cuti akademik"),
      DROPPED_OUT: tr("중퇴", "Dropped Out", "退学", "Bỏ học", "中退", "Putus kuliah"),
      OTHER: tr("기타", "Other", "其他", "Khác", "その他", "Lainnya")
    };
    const languageType: Record<string, string> = {
      KOREAN: tr("한국어", "Korean", "韩语", "Tiếng Hàn", "韓国語", "Bahasa Korea"),
      ENGLISH: tr("영어", "English", "英语", "Tiếng Anh", "英語", "Bahasa Inggris"),
      CHINESE: tr("중국어", "Chinese", "中文", "Tiếng Trung", "中国語", "Bahasa Tionghoa"),
      JAPANESE: tr("일본어", "Japanese", "日语", "Tiếng Nhật", "日本語", "Bahasa Jepang"),
      VIETNAMESE: tr("베트남어", "Vietnamese", "越南语", "Tiếng Việt", "ベトナム語", "Bahasa Vietnam"),
      INDONESIAN: tr("인도네시아어", "Indonesian", "印尼语", "Tiếng Indonesia", "インドネシア語", "Bahasa Indonesia"),
      THAI: tr("태국어", "Thai", "泰语", "Tiếng Thái", "タイ語", "Bahasa Thai"),
      MALAY: tr("말레이어", "Malay", "马来语", "Tiếng Mã Lai", "マレー語", "Bahasa Melayu"),
      FILIPINO: tr("필리핀어", "Filipino", "菲律宾语", "Tiếng Philippines", "フィリピン語", "Bahasa Filipina"),
      HINDI: tr("힌디어", "Hindi", "印地语", "Tiếng Hindi", "ヒンディー語", "Bahasa Hindi"),
      SPANISH: tr("스페인어", "Spanish", "西班牙语", "Tiếng Tây Ban Nha", "スペイン語", "Bahasa Spanyol"),
      FRENCH: tr("프랑스어", "French", "法语", "Tiếng Pháp", "フランス語", "Bahasa Prancis"),
      GERMAN: tr("독일어", "German", "德语", "Tiếng Đức", "ドイツ語", "Bahasa Jerman"),
      OTHER: tr("기타", "Other", "其他", "Khác", "その他", "Lainnya")
    };
    const languageLevel: Record<string, string> = {
      BEGINNER: tr("초급", "Beginner", "初级", "Sơ cấp", "初級", "Pemula"),
      INTERMEDIATE: tr("중급", "Intermediate", "中级", "Trung cấp", "中級", "Menengah"),
      ADVANCED: tr("고급", "Advanced", "高级", "Cao cấp", "上級", "Mahir"),
      NATIVE: tr("원어민", "Native", "母语", "Bản ngữ", "ネイティブ", "Penutur asli")
    };
    const activityType: Record<string, string> = {
      PROJECT: tr("프로젝트", "Project", "项目", "Dự án", "プロジェクト", "Proyek"),
      VOLUNTEER: tr("봉사활동", "Volunteer", "志愿活动", "Tình nguyện", "ボランティア活動", "Kegiatan sukarela"),
      INTERNSHIP: tr("인턴십", "Internship", "实习", "Thực tập", "インターンシップ", "Magang"),
      CERTIFICATE: tr("자격증", "Certificate", "证书", "Chứng chỉ", "資格", "Sertifikat"),
      AWARD: tr("수상", "Award", "获奖", "Giải thưởng", "受賞", "Penghargaan"),
      EXTRACURRICULAR: tr("대외활동", "Extracurricular", "课外活动", "Hoạt động ngoại khóa", "学外活動", "Kegiatan ekstrakurikuler"),
      OTHER: tr("기타", "Other", "其他", "Khác", "その他", "Lainnya")
    };

    return (
      visa[value] ??
      educationType[value] ??
      educationStatus[value] ??
      languageType[value] ??
      languageLevel[value] ??
      activityType[value] ??
      toDisplayTitle(value)
    );
  };

  const businessSections: ProfileSection[] = useMemo(
    () => {
      const sections: ProfileSection[] = [
        {
          title: tr("기본 정보", "Basic information", "基本信息", "Thông tin cơ bản", "基本情報", "Informasi dasar"),
          description: tr("파트너명, 산업군, 웹사이트, 주소, 소개, 기업 이미지, 추가 이미지를 관리합니다.", "Manage partner name, industry, website, address, description, company image, and additional images.", "管理合作伙伴名称、行业、网站、地址、简介、公司形象及附加图片。", "Quản lý tên đối tác, ngành nghề, trang web, địa chỉ, giới thiệu, hình ảnh công ty và hình ảnh bổ sung.", "パートナー名、業種、ウェブサイト、住所、紹介、企業画像、追加画像を管理します。", "Kelola nama mitra, industri, situs web, alamat, deskripsi, gambar perusahaan, dan gambar tambahan."),
          fields: []
        }
      ];
      if (user?.role !== "OPERATOR") {
        sections.push({
          title: tr("인증 정보", "Verification", "认证信息", "Thông tin xác minh", "認証情報", "Verifikasi"),
          description: tr("최종 인증을 위해 필수 서류/이미지를 업로드합니다.", "Upload required documents/images for final verification.", "上传最终认证所需的文件/图片。", "Tải lên các tài liệu/hình ảnh bắt buộc để xác minh cuối cùng.", "最終認証に必要な書類・画像をアップロードします。", "Unggah dokumen/gambar yang diperlukan untuk verifikasi akhir."),
          fields: []
        });
      }
      return sections;
    },
    [locale, user?.role]
  );

  const roleLabel = useMemo(() => {
    if (!user) return "";
    if (user.role === "PARTNER") return tr("파트너회원", "Partner", "合作伙伴会员", "Hội viên đối tác", "パートナー会員", "Mitra");
    if (user.role === "OPERATOR") return tr("운영자", "Operator", "运营者", "Quản trị viên", "運営者", "Operator");
    if (user.role === "STUDENT") return tr("일반회원", "General", "普通会员", "Hội viên thường", "一般会員", "Umum");
    return "";
  }, [locale, user]);

  const partnerVerificationBadge = useMemo(() => {
    if (user?.role !== "PARTNER") return null;
    if (!partnerOrg) return null;
    if (partnerOrg?.verification?.isApproved) {
      return {
        className: "bg-emerald-50 text-emerald-700",
        label: tr("운영중", "Active", "运营中", "Đang hoạt động", "運営中", "Aktif")
      };
    }
    return {
      className: "bg-amber-50 text-amber-700",
      label: tr("검토중 (승인 대기)", "Under review (approval pending)", "审核中（等待批准）", "Đang xem xét (chờ phê duyệt)", "審査中(承認待ち)", "Sedang ditinjau (menunggu persetujuan)")
    };
  }, [partnerOrg, partnerOrg?.verification?.isApproved, tr, user?.role]);

  const avatarFallback = useMemo(() => {
    if (user?.name?.trim()) return user.name.trim()[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return "U";
  }, [user?.email, user?.name]);

  useEffect(() => {
    if (!user) return;
    setProfileImage(user.profileImageUrl ?? getStoredProfilePhoto(user.id));
  }, [user]);

  useEffect(() => {
    if (!user || (user.role !== "PARTNER" && user.role !== "OPERATOR")) return;
    let isMounted = true;

    void (async () => {
      try {
        const item = await getMyPartnerOrganization();
        if (!isMounted) return;
        setPartnerOrg(item);
        setProfileError(null);
      } catch (error) {
        if (!isMounted) return;
        setPartnerOrg(null);
        setProfileError(error instanceof Error ? error.message : tr("파트너 정보를 불러오지 못했습니다.", "Failed to load partner profile.", "无法加载合作伙伴资料。", "Không thể tải hồ sơ đối tác.", "パートナー情報の読み込みに失敗しました。", "Gagal memuat profil mitra."));
      } finally {
        if (isMounted) setPartnerOrgChecked(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [locale, user]);

  useEffect(() => {
    if (!user || (user.role !== "PARTNER" && user.role !== "OPERATOR")) return;
    let isMounted = true;

    void (async () => {
      try {
        const mine = await getMyPartnerPositions();
        if (!isMounted) return;
        setPartnerPositions(mine);
        const items: PublicPositionListItem[] = mine.map((item) => ({
          ...item,
          sourceKind: "INTERNAL",
          sourceProvider: "INTERNAL",
          sourceExternalId: null,
          sourceUrl: null,
          sourceFetchedAt: null,
          matchingParticipantsCount: 0,
          partnerOrganization: partnerOrg
            ? {
                id: partnerOrg.id,
                name: partnerOrg.name ?? "-",
                industry: partnerOrg.industry ?? "OTHER",
                companySize: partnerOrg.companySize ?? null,
                officeAddress: partnerOrg.officeAddress ?? null
              }
            : null
        }));
        setPostedPositions(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setPositionsError(null);
      } catch (error) {
        if (!isMounted) return;
        setPositionsError(error instanceof Error ? error.message : tr("등록한 포지션 목록을 불러오지 못했습니다.", "Failed to load posted positions.", "无法加载已发布的职位列表。", "Không thể tải danh sách vị trí đã đăng.", "登録したポジション一覧の読み込みに失敗しました。", "Gagal memuat daftar posisi yang diposting."));
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [locale, partnerOrg?.id, user]);

  useEffect(() => {
    if (!user || user.role === "PARTNER" || user.role === "OPERATOR") return;
    let isMounted = true;

    void (async () => {
      try {
        const [favorites, applied, profile, apps] = await Promise.all([
          getMyFavoritePositions(),
          getMyAppliedPositions(),
          getMyCandidateProfile(),
          getMyApplications().catch(() => [] as MyApplication[])
        ]);
        if (!isMounted) return;
        setFavoritePositions(favorites);
        setAppliedPositions(applied);
        setApplications(apps);
        setStudentProfile(profile ?? null);
        setStudentPositionsError(null);
      } catch (error) {
        if (!isMounted) return;
        setStudentPositionsError(error instanceof Error ? error.message : tr("포지션 목록을 불러오지 못했습니다.", "Failed to load positions.", "无法加载职位列表。", "Không thể tải danh sách vị trí.", "ポジション一覧の読み込みに失敗しました。", "Gagal memuat daftar posisi."));
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [locale, user]);

  useEffect(() => {
    if (!user) return;

    if (user.role === "PARTNER" || user.role === "OPERATOR") {
      if (tabParam === "positions" || tabParam === "notifications" || tabParam === "info") {
        setActiveTab(tabParam);
      } else {
        setActiveTab("info");
      }
      return;
    }

    if (tabParam === "resume" || tabParam === "applied" || tabParam === "favorites" || tabParam === "info") {
      setStudentTab(tabParam);
    } else {
      setStudentTab("info");
    }
  }, [tabParam, user]);

  const additionalCompanyImages = useMemo(() => {
    const raw = partnerOrg?.officePhotoImageData;
    if (!raw) return [] as string[];
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      }
      return [raw];
    } catch {
      return [raw];
    }
  }, [partnerOrg?.officePhotoImageData]);

  const basicCompanyFields = useMemo(
    () => [
      {
        label: tr("로고 이미지", "Logo image", "Logo 图片", "Hình ảnh logo", "ロゴ画像", "Gambar logo"),
        value: partnerOrg?.companyLogoImageData ? tr("업로드 완료", "Uploaded", "已上传", "Đã tải lên", "アップロード完了", "Telah diunggah") : tr("미업로드", "Not uploaded", "未上传", "Chưa tải lên", "未アップロード", "Belum diunggah"),
        kind: "logo" as CompanyFieldKind
      },
      {
        label: tr("추가 이미지", "Additional images", "附加图片", "Hình ảnh bổ sung", "追加画像", "Gambar tambahan"),
        value: additionalCompanyImages.length > 0 ? tr("업로드 완료", "Uploaded", "已上传", "Đã tải lên", "アップロード完了", "Telah diunggah") : tr("미업로드", "Not uploaded", "未上传", "Chưa tải lên", "未アップロード", "Belum diunggah"),
        kind: "additional" as CompanyFieldKind
      },
      { label: tr("파트너명", "Partner name", "合作伙伴名称", "Tên đối tác", "パートナー名", "Nama mitra"), value: partnerOrg?.name ?? "-", kind: "text" as CompanyFieldKind },
      { label: tr("회사 코드", "Company code", "公司代码", "Mã công ty", "会社コード", "Kode perusahaan"), value: partnerOrg?.slug ?? "-", kind: "text" as CompanyFieldKind },
      { label: tr("산업군", "Industry", "行业", "Ngành nghề", "業種", "Industri"), value: partnerIndustryLabel(partnerOrg?.industry), kind: "text" as CompanyFieldKind },
      { label: tr("웹사이트", "Website", "网站", "Trang web", "ウェブサイト", "Situs web"), value: partnerOrg?.website ?? "-", kind: "text" as CompanyFieldKind },
      { label: tr("주소", "Address", "地址", "Địa chỉ", "住所", "Alamat"), value: partnerOrg?.officeAddress ?? "-", kind: "text" as CompanyFieldKind },
      { label: tr("소개", "Description", "简介", "Giới thiệu", "紹介", "Deskripsi"), value: partnerOrg?.description ?? "-", kind: "text" as CompanyFieldKind }
    ],
    [additionalCompanyImages.length, locale, partnerOrg]
  );

  const verificationFields = useMemo(
    () => [
      {
        label: tr("사업자등록증", "Business registration", "营业执照", "Giấy đăng ký kinh doanh", "事業者登録証", "Registrasi bisnis"),
        value: partnerOrg?.businessRegistrationDocumentData ? tr("업로드 완료", "Uploaded", "已上传", "Đã tải lên", "アップロード完了", "Telah diunggah") : tr("미업로드", "Not uploaded", "未上传", "Chưa tải lên", "未アップロード", "Belum diunggah")
      },
      {
        label: tr("4대보험 가입자명부", "4-insurance subscriber list", "四大保险参保人员名册", "Danh sách tham gia 4 loại bảo hiểm", "4大保険加入者名簿", "Daftar peserta 4 asuransi"),
        value: partnerOrg?.fourInsuranceSubscriberListData ? tr("업로드 완료", "Uploaded", "已上传", "Đã tải lên", "アップロード完了", "Telah diunggah") : tr("미업로드", "Not uploaded", "未上传", "Chưa tải lên", "未アップロード", "Belum diunggah")
      }
    ],
    [
      locale,
      partnerOrg?.businessRegistrationDocumentData,
      partnerOrg?.fourInsuranceSubscriberListData
    ]
  );

  const verificationSummary = useMemo(() => {
    const notUploadedLabel = tr("미업로드", "Not uploaded", "未上传", "Chưa tải lên", "未アップロード", "Belum diunggah");
    const requiredLabels = new Set([
      tr("사업자등록증", "Business registration", "营业执照", "Giấy đăng ký kinh doanh", "事業者登録証", "Registrasi bisnis"),
      tr("4대보험 가입자명부", "4-insurance subscriber list", "四大保险参保人员名册", "Danh sách tham gia 4 loại bảo hiểm", "4大保険加入者名簿", "Daftar peserta 4 asuransi")
    ]);
    const missingRequired = verificationFields
      .filter((field) => requiredLabels.has(field.label) && field.value === notUploadedLabel)
      .map((field) => field.label);

    const isApproved = Boolean(partnerOrg?.verification?.isApproved);

    if (isApproved) {
      return tr(
        missingRequired.length === 0
          ? "운영중: 운영자 승인이 완료되었습니다."
          : `운영중: 운영자 승인 완료 (서류 보완 필요: ${missingRequired.join(", ")}).`,
        missingRequired.length === 0
          ? "Active: operator approval is completed."
          : `Active: operator approved (documents to complete: ${missingRequired.join(", ")}).`
      );
    }

    return tr(
      missingRequired.length === 0
        ? "검토중: 운영자 승인 대기 상태입니다."
        : `검토중: 운영자 승인 대기 (서류 보완 필요: ${missingRequired.join(", ")}).`,
      missingRequired.length === 0
        ? "Under review: waiting for operator approval."
        : `Under review: waiting for operator approval (documents to complete: ${missingRequired.join(", ")}).`
    );
  }, [locale, partnerOrg?.verification?.isApproved, verificationFields]);


  const studentResumeSections = useMemo<StudentResumeSection[]>(
    () => [
      {
        title: tr("근무 가능 조건", "Work availability", "工作可行条件", "Điều kiện làm việc", "勤務可能条件", "Ketersediaan kerja"),
        description: tr("매칭 정확도를 높이는 기본 조건입니다.", "Core conditions that improve matching accuracy.", "提高匹配准确度的基本条件。", "Điều kiện cơ bản giúp nâng cao độ chính xác khi ghép cặp.", "マッチング精度を高める基本条件です。", "Kondisi inti yang meningkatkan akurasi pencocokan."),
        fields: [
          { label: tr("비자 유형", "Visa type", "签证类型", "Loại visa", "ビザの種類", "Jenis visa"), value: enumDisplay(studentProfile?.visaType) },
          { label: tr("거주 지역", "Residence region", "居住地区", "Khu vực cư trú", "居住地域", "Wilayah tempat tinggal"), value: studentProfile?.residenceProvince ?? "-" },
          {
            label: tr("시작 가능 시점", "Available start timing", "可入职时间", "Thời điểm có thể bắt đầu", "開始可能時期", "Waktu mulai tersedia"),
            value:
              studentProfile?.programStartOption === "SPECIFIC_DATE"
                ? `${tr("특정 날짜", "Specific date", "特定日期", "Ngày cụ thể", "特定の日付", "Tanggal tertentu")} (${formatIsoDate(studentProfile?.programStartDate)})`
                : studentProfile?.programStartOption === "ASAP"
                  ? tr("즉시 가능", "ASAP", "立即可入职", "Có thể ngay", "すぐに可能", "Segera")
                  : "-"
          }
        ],
        href: "/profile/resume/edit/work-availability"
      },
      {
        title: tr("학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan"),
        description: tr("최종 학력과 현재 상태를 보여주세요.", "Share your latest education and current status.", "请展示最终学历及当前状态。", "Hãy chia sẻ học vấn cao nhất và trạng thái hiện tại.", "最終学歴と現在の状況をお知らせください。", "Bagikan pendidikan terakhir dan status saat ini."),
        fields: [
          { label: tr("학교명", "School", "学校名称", "Tên trường", "学校名", "Nama sekolah"), value: studentProfile?.educations?.[0]?.schoolName ?? "-" },
          { label: tr("전공", "Major", "专业", "Chuyên ngành", "専攻", "Jurusan"), value: studentProfile?.educations?.[0]?.major ?? "-" },
          {
            label: tr("학위/재학 상태", "Degree/enrollment status", "学位/在读状态", "Bằng cấp/Trạng thái học", "学位・在学状況", "Gelar/status keanggotaan"),
            value: studentProfile?.educations?.[0]
              ? `${enumDisplay(studentProfile.educations[0].educationType)} / ${enumDisplay(studentProfile.educations[0].status)}`
              : "-"
          }
        ],
        href: "/profile/resume/edit/education"
      },
      {
        title: tr("언어 능력", "Language skills", "语言能力", "Kỹ năng ngôn ngữ", "言語スキル", "Kemampuan bahasa"),
        description: tr("업무 가능한 언어 수준을 입력해 주세요.", "Add your working language levels.", "请输入可胜任工作的语言水平。", "Hãy nhập trình độ ngôn ngữ có thể sử dụng trong công việc.", "業務で使用できる言語レベルを入力してください。", "Masukkan tingkat bahasa kerja Anda."),
        fields: [
          { label: tr("언어", "Language", "语言", "Ngôn ngữ", "言語", "Bahasa"), value: enumDisplay(studentProfile?.languageSkills?.[0]?.language) },
          { label: tr("레벨", "Level", "级别", "Cấp độ", "レベル", "Tingkat"), value: enumDisplay(studentProfile?.languageSkills?.[0]?.level) },
          {
            label: tr("시험/인증", "Test/certificate", "考试/认证", "Kỳ thi/Chứng chỉ", "試験・認定", "Tes/sertifikat"),
            value: studentProfile?.languageSkills?.[0]
              ? [studentProfile.languageSkills[0].testName, studentProfile.languageSkills[0].score].filter(Boolean).join(" / ") || "-"
              : "-"
          }
        ],
        href: "/profile/resume/edit/language"
      },
      {
        title: tr("경력", "Experience", "经历", "Kinh nghiệm", "経歴", "Pengalaman kerja"),
        description: tr("인턴/아르바이트/정규 경력을 추가해 주세요.", "Add internship/part-time/full-time experience.", "请添加实习/兼职/全职经历。", "Hãy thêm kinh nghiệm thực tập/bán thời gian/toàn thời gian.", "インターン・アルバイト・正社員の経歴を追加してください。", "Tambahkan pengalaman magang/paruh waktu/penuh waktu."),
        fields: [
          { label: tr("회사명", "Company", "公司名称", "Tên công ty", "会社名", "Perusahaan"), value: studentProfile?.careers?.[0]?.companyName ?? "-" },
          { label: tr("직무", "Role", "职位", "Vị trí", "職務", "Peran"), value: studentProfile?.careers?.[0]?.position ?? "-" },
          {
            label: tr("기간", "Period", "期间", "Thời gian", "期間", "Periode"),
            value: studentProfile?.careers?.[0]
              ? `${formatIsoDate(studentProfile.careers[0].startDate)} ~ ${
                studentProfile.careers[0].isCurrent ? tr("현재", "Current", "至今", "Hiện tại", "現在", "Sekarang") : formatIsoDate(studentProfile.careers[0].endDate)
              }`
              : "-"
          }
        ],
        href: "/profile/resume/edit/career"
      },
      {
        title: tr("활동 경험", "Activities", "活动经历", "Kinh nghiệm hoạt động", "活動経歴", "Pengalaman kegiatan"),
        description: tr("프로젝트/대외활동/수상 이력을 보여주세요.", "Show projects, extracurriculars, and awards.", "请展示项目/课外活动/获奖经历。", "Hãy thể hiện dự án/hoạt động ngoại khóa/giải thưởng.", "プロジェクト・学外活動・受賞歴を表示してください。", "Tampilkan proyek, kegiatan ekstrakurikuler, dan penghargaan."),
        fields: [
          { label: tr("활동 유형", "Activity type", "活动类型", "Loại hoạt động", "活動の種類", "Jenis kegiatan"), value: enumDisplay(studentProfile?.activityExperiences?.[0]?.activityType) },
          { label: tr("활동명", "Title", "活动名称", "Tên hoạt động", "活動名", "Judul"), value: studentProfile?.activityExperiences?.[0]?.title ?? "-" },
          { label: tr("성과", "Outcome", "成果", "Thành quả", "成果", "Hasil"), value: studentProfile?.activityExperiences?.[0]?.description ?? "-" }
        ],
        href: "/profile/resume/edit/activity"
      },
      {
        title: tr("소개/동기", "Profile text", "介绍/动机", "Giới thiệu/Động lực", "自己紹介・志望動機", "Pengantar profil"),
        description: tr("나를 설명하는 핵심 텍스트 항목입니다.", "Key text areas that explain your profile.", "用于介绍自己的核心文本项。", "Các mục văn bản chính giới thiệu bản thân.", "自分を説明する主要なテキスト項目です。", "Area teks utama yang menjelaskan profil Anda."),
        fields: [
          { label: tr("스킬", "Skills", "技能", "Kỹ năng", "スキル", "Keahlian"), value: formatList(studentProfile?.skills) },
          { label: tr("자기소개", "Self introduction", "自我介绍", "Giới thiệu bản thân", "自己紹介", "Pengenalan diri"), value: studentProfile?.selfIntroduction?.trim() || "-" },
          { label: tr("선호 조건", "Preferences", "偏好条件", "Điều kiện ưu tiên", "希望条件", "Preferensi"), value: studentProfile?.preferenceConditionNote?.trim() || "-" },
          { label: tr("추가 정보", "Additional notes", "附加信息", "Thông tin bổ sung", "追加情報", "Catatan tambahan"), value: studentProfile?.additionalInfoNote?.trim() || "-" }
        ],
        href: "/profile/resume/edit/profile-text"
      }
    ],
    [locale, studentProfile, tr]
  );

  async function toggleStudentFavorite(positionId: string) {
    if (!user || user.role !== "STUDENT") return;
    const isFavorite = favoritePositions.some((item) => item.id === positionId);
    const previous = favoritePositions;
    const source =
      appliedPositions.find((item) => item.id === positionId)
      ?? favoritePositions.find((item) => item.id === positionId);
    const optimistic = isFavorite
      ? favoritePositions.filter((item) => item.id !== positionId)
      : source
      ? [source, ...favoritePositions]
      : favoritePositions;
    setFavoritePositions(optimistic);

    try {
      if (isFavorite) {
        await removeMyFavoritePosition(positionId);
      } else {
        await addMyFavoritePosition(positionId);
      }
    } catch (error) {
      setFavoritePositions(previous);
      window.alert(error instanceof Error ? error.message : tr("즐겨찾기 처리에 실패했습니다.", "Failed to update favorite.", "收藏处理失败。", "Không thể cập nhật mục yêu thích.", "お気に入りの処理に失敗しました。", "Gagal memperbarui favorit."));
    }
  }

  async function applyFromStudentFavorite(positionId: string) {
    if (!user || user.role !== "STUDENT") return;
    if (appliedPositions.some((item) => item.id === positionId)) return;

    try {
      await applyMyPosition(positionId);
      if (!appliedPositions.some((item) => item.id === positionId)) {
        const found = favoritePositions.find((item) => item.id === positionId);
        if (found) {
          setAppliedPositions((prev) => [found, ...prev]);
        }
      }
      window.alert(tr("지원한 포지션에 추가되었습니다.", "Added to applied positions.", "已添加到已申请职位。", "Đã thêm vào vị trí đã ứng tuyển.", "応募済みポジションに追加されました。", "Ditambahkan ke posisi yang dilamar."));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : tr("지원 처리에 실패했습니다.", "Failed to apply.", "申请处理失败。", "Không thể ứng tuyển.", "応募処理に失敗しました。", "Gagal melamar."));
    }
  }

  async function handleProfileLogout() {
    await logout();
    window.location.href = "/";
  }

  function handleDeleteAccount() {
    window.location.href = "/account/delete";
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <svg width="0" height="0" aria-hidden className="absolute">
        <defs>
          <clipPath id={PROFILE_SQUIRCLE_CLIP_ID} clipPathUnits="objectBoundingBox">
            <path d={PROFILE_SQUIRCLE_PATH} transform="scale(0.01)" />
          </clipPath>
        </defs>
      </svg>
      <Header />
      <main className="container py-12 md:py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 font-display text-3xl font-bold tracking-tight">{tr("내 프로필", "My profile", "我的资料", "Hồ sơ của tôi", "私のプロフィール", "Profil saya")}</h1>

          {!isReady ? (
            <section className="rounded-2xl bg-white p-5 md:p-6">
              <p className="text-sm text-muted-foreground">{tr("프로필 정보를 불러오는 중...", "Loading profile information...", "正在加载资料信息...", "Đang tải thông tin hồ sơ...", "プロフィール情報を読み込み中...", "Memuat informasi profil...")}</p>
            </section>
          ) : !isAuthenticated || !user ? (
            <section className="rounded-2xl bg-white p-5 md:p-6">
              <p className="mt-2 text-sm text-muted-foreground">{tr("로그인이 필요합니다.", "Sign in is required.", "需要登录。", "Cần đăng nhập.", "ログインが必要です。", "Diperlukan masuk.")}</p>
              <div className="mt-4">
                <Button variant="dark" asChild>
                  <Link href="/login">{tr("로그인하러 가기", "Go to login", "前往登录", "Đi đến đăng nhập", "ログインへ移動", "Pergi ke halaman masuk")}</Link>
                </Button>
              </div>
            </section>
          ) : (
            <section className="space-y-6">
              <div className="rounded-2xl border border-border/70 bg-card p-5 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {profileImage ? (
                    <img src={profileImage} alt={tr("프로필 사진", "Profile photo", "头像", "Ảnh hồ sơ", "プロフィール写真", "Foto profil")} className="h-16 w-16 object-cover" style={PROFILE_SQUIRCLE_STYLE} />
                  ) : (
                    <div className={`grid h-16 w-16 place-items-center text-lg font-semibold ${
                      user.role === "STUDENT" ? "border border-border/60 bg-[#F8FAFC] text-muted-foreground" : "bg-muted"
                    }`} style={PROFILE_SQUIRCLE_STYLE}>{avatarFallback}</div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold">{user.name ?? tr("이름 없음", "No name", "无名称", "Không có tên", "名前なし", "Tanpa nama")}</p>
                      {roleLabel ? (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{roleLabel}</span>
                      ) : null}
                      {partnerVerificationBadge ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${partnerVerificationBadge.className}`}>
                          <BadgeCheck className="h-3.5 w-3.5" />
                          {partnerVerificationBadge.label}
                        </span>
                      ) : null}
                    </div>
                    {user.authProvider === "KAKAO" ? (
                      <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <span className="grid h-4 w-4 place-items-center rounded-sm bg-[#FEE500]">
                          <svg aria-hidden className="h-2.5 w-2.5 text-[#191919]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3C6.48 3 2 6.58 2 11c0 2.86 1.86 5.36 4.66 6.78L5.5 21.5c-.1.34.27.62.57.43L10.5 19c.5.05 1 .08 1.5.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                          </svg>
                        </span>
                        <span>{tr("카카오로 연결중", "Connected with Kakao", "通过 Kakao 连接", "Đã kết nối Kakao", "Kakaoで連携中", "Terhubung dengan Kakao")}</span>
                      </div>
                    ) : user.authProvider === "GOOGLE" ? (
                      <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <svg aria-hidden className="h-4 w-4" viewBox="0 0 48 48">
                          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                          <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                        </svg>
                        <span>{tr("구글로 연결중", "Connected with Google", "通过 Google 连接", "Đã kết nối Google", "Googleで連携中", "Terhubung dengan Google")}</span>
                      </div>
                    ) : user.authProvider === "NAVER" ? (
                      <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <span className="grid h-4 w-4 place-items-center rounded-sm bg-[#03C75A] text-[10px] font-black leading-none text-white">N</span>
                        <span>{tr("네이버로 연결중", "Connected with Naver", "通过 Naver 连接", "Đã kết nối Naver", "Naverで連携中", "Terhubung dengan Naver")}</span>
                      </div>
                    ) : (
                      <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild disabled={!canEditBasic}>
                  <Link href="/profile/edit">{tr("편집", "Edit", "编辑", "Chỉnh sửa", "編集", "Edit")}</Link>
                </Button>
              </div>

              {profileError ? <p className="text-sm text-destructive">{profileError}</p> : null}
              </div>

              {user.role === "STUDENT" ? (
                <Link
                  href="/matching-probability"
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-gradient-to-br from-[#FAF5FF] to-[#F0F9FF] p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-elevated md:p-6"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-white text-2xl shadow-sm">🎯</span>
                    <div className="min-w-0">
                      <p className="font-display text-base font-bold tracking-tight text-foreground">
                        {tr("내 한국 취업 모험 시작하기", "Start my Korea job quest", "开始我的韩国求职冒险", "Bắt đầu hành trình tìm việc Hàn Quốc", "韓国就職アドベンチャーを始める", "Mulai petualangan kerja di Korea")}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
                        {tr(
                          "프로필 기반 점수 + AI 코치의 강점/보완 분석.",
                          "Score-based readiness + AI coaching on strengths and gaps.",
                          "基于资料的分数 + AI 教练分析。",
                          "Điểm dựa trên hồ sơ + huấn luyện AI."
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary transition group-hover:translate-x-0.5" aria-hidden>→</span>
                </Link>
              ) : null}

              <div className="space-y-6">
                {user.role === "PARTNER" ? (
                  partnerOrgChecked && !partnerOrg ? (
                    <article className="space-y-5 rounded-2xl border border-border/70 bg-card p-5 md:p-6">
                      <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-border/70 bg-muted/10 p-6 text-left">
                        <div>
                          <h3 className="text-base font-semibold">
                            {tr("아직 파트너로 등록되지 않았어요", "You haven't registered as a partner yet", "您还未注册为合作伙伴", "Bạn chưa đăng ký làm đối tác", "まだパートナーとして登録されていません", "Anda belum terdaftar sebagai mitra")}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {tr(
                              "파트너 정보를 등록하거나 초대 코드로 합류하면 정보·포지션·알림을 관리할 수 있어요.",
                              "Register your partner info or join via invite code to manage details, positions, and notifications.",
                              "注册合作伙伴信息或通过邀请码加入后，即可管理信息、职位和通知。",
                              "Đăng ký thông tin đối tác hoặc tham gia bằng mã mời để quản lý thông tin, vị trí và thông báo."
                            )}
                          </p>
                        </div>
                        <Button variant="dark" asChild>
                          <Link href="/partner-profile/edit">
                            {tr("파트너 등록하기", "Register as partner", "注册为合作伙伴", "Đăng ký làm đối tác", "パートナー登録", "Daftar sebagai mitra")}
                          </Link>
                        </Button>
                      </div>
                    </article>
                  ) : (
                  <article className="overflow-hidden rounded-2xl border border-border/70 bg-card">
                    <div className="flex items-center gap-1 border-b border-border/70 px-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab("info")}
                        className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                          activeTab === "info" ? "text-foreground after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tr("정보", "Info", "信息", "Thông tin", "情報", "Info")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("positions")}
                        className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                          activeTab === "positions" ? "text-foreground after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tr("올려진 포지션", "Posted positions", "已发布的职位", "Vị trí đã đăng", "掲載中のポジション", "Posisi yang diposting")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("notifications")}
                        className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                          activeTab === "notifications" ? "text-foreground after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tr("알림", "Notifications", "通知", "Thông báo", "通知", "Notifikasi")}
                      </button>
                    </div>
                    <div className="space-y-5 p-5 md:p-6">

                    {activeTab === "info" ? (
                      <div className="space-y-6">
                        {businessSections.map((section, sectionIndex) => (
                          <div key={section.title} className={`space-y-3 ${sectionIndex > 0 ? "border-t border-border/60 pt-6" : ""}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                              </div>
                              {user.role === "PARTNER" ? (
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={section.title === tr("인증 정보", "Verification", "认证信息", "Thông tin xác minh", "認証情報", "Verifikasi") ? "/partner-profile/verification/edit" : "/partner-profile/edit"}>
                                    {tr("편집", "Edit", "编辑", "Chỉnh sửa", "編集", "Edit")}
                                  </Link>
                                </Button>
                              ) : null}
                            </div>

                            {section.title === tr("기본 정보", "Basic information", "基本信息", "Thông tin cơ bản", "基本情報", "Informasi dasar") ? (
                              <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                                {basicCompanyFields.map((field) => (
                                  <div
                                    key={field.label}
                                    className={`text-sm ${
                                      field.label === tr("소개", "Description", "简介", "Giới thiệu", "紹介", "Deskripsi") ? "sm:col-span-2" : ""
                                    }`}
                                  >
                                    <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                                    {field.kind === "logo" ? (
                                      partnerOrg?.companyLogoImageData ? (
                                        <div className="mt-2 inline-flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-white p-3">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img
                                            src={partnerOrg.companyLogoImageData}
                                            alt={tr("로고 이미지", "Logo image", "Logo 图片", "Hình ảnh logo", "ロゴ画像", "Gambar logo")}
                                            className="h-full w-full object-contain"
                                          />
                                        </div>
                                      ) : (
                                        <div className="mt-2 inline-flex h-32 w-32 items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/30 text-xs font-medium text-muted-foreground">
                                          {tr("미등록", "Not set", "未上传", "Chưa có", "未登録", "Belum ada")}
                                        </div>
                                      )
                                    ) : field.kind === "additional" ? (
                                      additionalCompanyImages.length > 0 ? (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {additionalCompanyImages.slice(0, 4).map((image, index) => {
                                            const isLastVisible = index === 3 && additionalCompanyImages.length > 4;
                                            return (
                                              <div key={`${field.label}-${index}`} className="relative h-16 w-16 overflow-hidden rounded-lg border border-border/60 bg-muted/20">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                  src={image}
                                                  alt={`${tr("추가 이미지", "Additional image", "附加图片", "Hình ảnh bổ sung", "追加画像", "Gambar tambahan")} ${index + 1}`}
                                                  className="h-full w-full object-cover"
                                                />
                                                {isLastVisible ? (
                                                  <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-xs font-semibold text-white">
                                                    +{additionalCompanyImages.length - 4}
                                                  </div>
                                                ) : null}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {[0, 1, 2, 3].map((slotIndex) => (
                                            <div key={slotIndex} className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-[10px] font-medium text-muted-foreground">
                                              {slotIndex === 0 ? tr("미등록", "Not set", "未上传", "Chưa có", "未登録", "Belum ada") : ""}
                                            </div>
                                          ))}
                                        </div>
                                      )
                                    ) : (
                                      <p className={`mt-1 break-words text-foreground ${
                                        field.label === tr("소개", "Description", "简介", "Giới thiệu", "紹介", "Deskripsi") ? "whitespace-pre-wrap leading-relaxed" : ""
                                      }`}>{field.value}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : section.title === tr("인증 정보", "Verification", "认证信息", "Thông tin xác minh", "認証情報", "Verifikasi") ? (
                              <div className="space-y-3">
                                <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                                  {verificationFields.map((field) => (
                                    <div key={field.label} className="text-sm">
                                      <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                                      <p className="mt-1 break-words text-foreground">{field.value}</p>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-xs text-muted-foreground">{verificationSummary}</p>
                              </div>
                            ) : (
                              <ul className="grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                                {section.fields.map((field) => (
                                  <li key={field} className="leading-relaxed">· {field}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : activeTab === "positions" ? (
                      <div className="space-y-3">
                        <div className="flex items-start justify-end gap-3">
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant={postedViewMode === "list" ? "dark" : "outline"}
                              size="icon"
                              aria-label={tr("리스트 보기", "List view", "列表视图", "Xem dạng danh sách", "リスト表示", "Tampilan daftar")}
                              onClick={() => setPostedViewMode("list")}
                            >
                              <List className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant={postedViewMode === "grid" ? "dark" : "outline"}
                              size="icon"
                              aria-label={tr("그리드 보기", "Grid view", "网格视图", "Xem dạng lưới", "グリッド表示", "Tampilan grid")}
                              onClick={() => setPostedViewMode("grid")}
                            >
                              <LayoutGrid className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {positionsError ? <p className="text-sm text-destructive">{positionsError}</p> : null}

                        {postedPositions.length === 0 ? (
                          <div className="rounded-md border border-border/50 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                            {tr("아직 등록된 포지션이 없습니다.", "No posted positions yet.", "尚未发布任何职位。", "Chưa có vị trí nào được đăng.", "まだ登録されたポジションはありません。", "Belum ada posisi yang diposting.")}
                          </div>
                        ) : postedViewMode === "grid" ? (
                          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {postedPositions.map((item) => (
                              <PostedPositionGridCard key={item.id} item={item} canEdit={user.role === "PARTNER"} />
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {postedPositions.map((item) => (
                              <PostedPositionRow key={item.id} item={item} canEdit={user.role === "PARTNER"} />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {positionNotifications.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            {tr("아직 알림이 없습니다.", "No notifications yet.", "暂无通知。", "Chưa có thông báo nào.", "まだ通知はありません。", "Belum ada notifikasi.")}
                          </p>
                        ) : (
                          <div className="max-h-[560px] space-y-2 overflow-auto pr-1">
                            {positionNotifications.map((notification) => (
                              <article key={notification.id} className="rounded-md border border-border/50 bg-background p-3">
                                <div className="mb-1 flex items-center gap-2">
                                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                    notification.kind === "status"
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-emerald-50 text-emerald-700"
                                  }`}>
                                    {notification.kind === "status" ? tr("상태 변경", "Status update", "状态变更", "Thay đổi trạng thái", "ステータス変更", "Pembaruan status") : tr("진행 로그", "Progress log", "进度日志", "Nhật ký tiến trình", "進行ログ", "Log progres")}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground">{formatPostedDate(notification.createdAt, locale)}</span>
                                </div>
                                <p className="line-clamp-1 text-xs text-muted-foreground">{notification.positionTitle}</p>
                                <p className="mt-1 text-sm text-foreground">{notification.message}</p>
                              </article>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                  </article>
                  )
                ) : user.role === "STUDENT" ? (
                  <article className="overflow-hidden rounded-2xl border border-border/70 bg-card">
                    <div className="flex items-center gap-1 overflow-x-auto border-b border-border/70 px-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setStudentTab("info")}
                        className={`relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                          studentTab === "info" ? "text-foreground after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tr("정보", "Info", "信息", "Thông tin", "情報", "Info")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentTab("resume")}
                        className={`relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                          studentTab === "resume" ? "text-foreground after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tr("이력관리", "Resume", "简历管理", "Quản lý sơ yếu lý lịch", "履歴管理", "Resume")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentTab("applied")}
                        className={`relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                          studentTab === "applied" ? "text-foreground after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tr("지원한 포지션", "Applied positions", "已申请的职位", "Vị trí đã ứng tuyển", "応募したポジション", "Posisi yang dilamar")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentTab("favorites")}
                        className={`relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                          studentTab === "favorites" ? "text-foreground after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tr("즐겨찾기한 포지션", "Favorite positions", "收藏的职位", "Vị trí đã lưu", "お気に入りのポジション", "Posisi favorit")}
                      </button>
                    </div>
                    <div className="space-y-5 p-5 md:p-6">

                    {studentTab === "info" ? (
                      <div className="space-y-6">
                        <ProfileCompletionMeter />
                        <div className="space-y-4 border-t border-border/60 pt-6">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">{tr("기본 정보", "Basic information", "基本信息", "Thông tin cơ bản", "基本情報", "Informasi dasar")}</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {tr("프로필의 핵심 연락/신상 정보를 관리합니다.", "Manage your core contact and personal profile information.", "管理资料中的核心联系方式与个人信息。", "Quản lý thông tin liên hệ và thông tin cá nhân cốt lõi của hồ sơ.", "プロフィールの主要な連絡先・個人情報を管理します。", "Kelola informasi kontak dan profil pribadi inti Anda.")}
                              </p>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link href="/profile/edit">{tr("편집", "Edit", "编辑", "Chỉnh sửa", "編集", "Edit")}</Link>
                            </Button>
                          </div>
                          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                            <div className="text-sm">
                              <p className="text-xs font-medium text-muted-foreground">{tr("프로필 사진", "Profile photo", "头像", "Ảnh hồ sơ", "プロフィール写真", "Foto profil")}</p>
                              <p className="mt-1 break-words text-foreground">{profileImage ? tr("등록됨", "Uploaded", "已注册", "Đã đăng ký", "登録済み", "Telah diunggah") : tr("미등록", "Not uploaded", "未注册", "Chưa đăng ký", "未登録", "Belum diunggah")}</p>
                            </div>
                            <div className="text-sm">
                              <p className="text-xs font-medium text-muted-foreground">{tr("실명", "Legal name", "真实姓名", "Tên thật", "本名", "Nama asli")}</p>
                              <p className="mt-1 break-words text-foreground">{user.realName ?? "-"}</p>
                            </div>
                            <div className="text-sm">
                              <p className="text-xs font-medium text-muted-foreground">{tr("닉네임", "Nickname", "昵称", "Biệt danh", "ニックネーム", "Nama panggilan")}</p>
                              <p className="mt-1 break-words text-foreground">{user.name ?? "-"}</p>
                            </div>
                            <div className="text-sm">
                              <p className="text-xs font-medium text-muted-foreground">{tr("연락처", "Phone", "联系方式", "Liên hệ", "連絡先", "Telepon")}</p>
                              <p className="mt-1 break-words text-foreground">{user.phoneNumber ?? "-"}</p>
                            </div>
                            <div className="text-sm">
                              <p className="text-xs font-medium text-muted-foreground">{tr("성별", "Gender", "性别", "Giới tính", "性別", "Jenis kelamin")}</p>
                              <p className="mt-1 break-words text-foreground">
                                {user.gender === "MALE"
                                  ? tr("남성", "Male", "男", "Nam", "男性", "Laki-laki")
                                  : user.gender === "FEMALE"
                                    ? tr("여성", "Female", "女", "Nữ", "女性", "Perempuan")
                                    : user.gender === "OTHER"
                                      ? tr("기타", "Other", "其他", "Khác", "その他", "Lainnya")
                                      : tr("선택 안 함", "Prefer not to say", "不选择", "Không chọn", "選択しない", "Tidak ingin menyebutkan")}
                              </p>
                            </div>
                            <div className="text-sm">
                              <p className="text-xs font-medium text-muted-foreground">{tr("생년월일", "Date of birth", "出生日期", "Ngày sinh", "生年月日", "Tanggal lahir")}</p>
                              <p className="mt-1 break-words text-foreground">{user.birthDate ? user.birthDate.slice(0, 10) : "-"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : studentTab === "resume" ? (
                      <div className="space-y-6">
                        {studentResumeSections.map((section, sectionIndex) => (
                          <section key={section.title} className={`space-y-3 ${sectionIndex > 0 ? "border-t border-border/60 pt-6" : ""}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{section.title}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                              </div>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={section.href}>{tr("편집", "Edit", "编辑", "Chỉnh sửa", "編集", "Edit")}</Link>
                              </Button>
                            </div>
                            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                              {section.fields.map((field) => (
                                <div key={`${section.title}-${field.label}`} className="text-sm">
                                  <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                                  <p className="mt-1 break-words text-foreground">{field.value}</p>
                                </div>
                              ))}
                            </div>
                          </section>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {studentTab === "applied" ? (
                          <div className="flex flex-wrap items-center gap-3">
                            <Link
                              href="/profile/programs"
                              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                            >
                              {tr("내 프로그램 →", "My programs →", "我的项目 →", "Chương trình của tôi →", "私のプログラム →", "Program saya →")}
                            </Link>
                            <Link
                              href="/profile/assignments"
                              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                            >
                              {tr("내 과제 보기 →", "View my assignments →", "查看我的作业 →", "Xem bài tập của tôi →", "私の課題を見る →", "Lihat tugas saya →")}
                            </Link>
                          </div>
                        ) : null}
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-muted-foreground">
                            {studentTab === "applied" ? appliedPositions.length : favoritePositions.length}
                            {tr("개", "", "个", "", "件", "")}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant={studentViewMode === "list" ? "dark" : "outline"}
                              size="icon"
                              aria-label={tr("리스트 보기", "List view", "列表视图", "Xem dạng danh sách", "リスト表示", "Tampilan daftar")}
                              onClick={() => setStudentViewMode("list")}
                            >
                              <List className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant={studentViewMode === "grid" ? "dark" : "outline"}
                              size="icon"
                              aria-label={tr("그리드 보기", "Grid view", "网格视图", "Xem dạng lưới", "グリッド表示", "Tampilan grid")}
                              onClick={() => setStudentViewMode("grid")}
                            >
                              <LayoutGrid className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {studentPositionsError ? <p className="text-sm text-destructive">{studentPositionsError}</p> : null}

                        {(() => {
                          const source = studentTab === "applied" ? appliedPositions : favoritePositions;
                          const favoriteIdSet = new Set(favoritePositions.map((item) => item.id));
                          const appliedIdSet = new Set(appliedPositions.map((item) => item.id));
                          const applicationByPositionId = new Map(applications.map((a) => [a.positionId, a]));

                          if (source.length === 0) {
                            return (
                              <div className="rounded-md border border-border/50 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                                {studentTab === "applied"
                                  ? tr("아직 지원한 포지션이 없습니다.", "No applied positions yet.", "尚未申请任何职位。", "Chưa có vị trí nào đã ứng tuyển.", "まだ応募したポジションはありません。", "Belum ada posisi yang dilamar.")
                                  : tr("아직 즐겨찾기한 포지션이 없습니다.", "No favorite positions yet.", "尚未收藏任何职位。", "Chưa có vị trí yêu thích nào.", "まだお気に入りのポジションはありません。", "Belum ada posisi favorit.")}
                              </div>
                            );
                          }

                          if (studentViewMode === "grid") {
                            return (
                              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                {source.map((item) => {
                                  const app = studentTab === "applied" ? applicationByPositionId.get(item.id) : null;
                                  const statusBadge = app ? getApplicationStatusLabel(app.status, "student") : null;
                                  return (
                                    <div key={item.id} className="space-y-2">
                                      {statusBadge || app ? (
                                        <div className="flex items-center justify-between gap-2">
                                          {statusBadge ? (
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadge.className}`}>
                                              {statusBadge.label}
                                            </span>
                                          ) : <span />}
                                          {app ? (
                                            <div className="flex items-center gap-2">
                                              {app.status === "INTERVIEW" ? (
                                                <button
                                                  type="button"
                                                  onClick={() => setInterviewTarget(app)}
                                                  className="text-[11px] font-semibold text-primary hover:underline"
                                                >
                                                  {tr("면접 일정 선택", "Select interview slot", "选择面试时间", "Chọn lịch phỏng vấn", "面接日程を選択", "Pilih jadwal wawancara")}
                                                </button>
                                              ) : null}
                                              {app.status !== "ACCEPTED" && app.status !== "WITHDRAWN" ? (
                                                <button
                                                  type="button"
                                                  disabled={withdrawingId === app.id}
                                                  onClick={() => void handleWithdraw(app)}
                                                  className="text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                                                >
                                                  {tr("지원 철회", "Withdraw", "撤回申请", "Rút đơn", "応募取り下げ", "Tarik lamaran")}
                                                </button>
                                              ) : null}
                                              <button
                                                type="button"
                                                onClick={() => setReportTarget(app)}
                                                className="text-[11px] font-semibold text-destructive hover:underline"
                                              >
                                                {tr("이슈 신고", "Report issue", "举报问题", "Báo cáo vấn đề", "問題を報告", "Laporkan masalah")}
                                              </button>
                                            </div>
                                          ) : null}
                                        </div>
                                      ) : null}
                                      <PostedPositionGridCard
                                        item={item}
                                        canEdit={false}
                                        showStudentActions
                                        isFavorite={favoriteIdSet.has(item.id)}
                                        isApplied={appliedIdSet.has(item.id)}
                                        onToggleFavorite={() => {
                                          void toggleStudentFavorite(item.id);
                                        }}
                                        onApply={() => {
                                          void applyFromStudentFavorite(item.id);
                                        }}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-3">
                              {source.map((item) => {
                                const app = studentTab === "applied" ? applicationByPositionId.get(item.id) : null;
                                const statusBadge = app ? getApplicationStatusLabel(app.status, "student") : null;
                                return (
                                  <div key={item.id} className="space-y-2">
                                    {statusBadge || app ? (
                                      <div className="flex items-center justify-between gap-2">
                                        {statusBadge ? (
                                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadge.className}`}>
                                            {statusBadge.label}
                                          </span>
                                        ) : <span />}
                                        {app ? (
                                          <div className="flex items-center gap-2">
                                            {app.status === "INTERVIEW" ? (
                                              <button
                                                type="button"
                                                onClick={() => setInterviewTarget(app)}
                                                className="text-[11px] font-semibold text-primary hover:underline"
                                              >
                                                {tr("면접 일정 선택", "Select interview slot", "选择面试时间", "Chọn lịch phỏng vấn", "面接日程を選択", "Pilih jadwal wawancara")}
                                              </button>
                                            ) : null}
                                            {app.status !== "ACCEPTED" && app.status !== "WITHDRAWN" ? (
                                              <button
                                                type="button"
                                                disabled={withdrawingId === app.id}
                                                onClick={() => void handleWithdraw(app)}
                                                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                                              >
                                                {tr("지원 철회", "Withdraw", "撤回申请", "Rút đơn", "応募取り下げ", "Tarik lamaran")}
                                              </button>
                                            ) : null}
                                            <button
                                              type="button"
                                              onClick={() => setReportTarget(app)}
                                              className="text-[11px] font-semibold text-destructive hover:underline"
                                            >
                                              {tr("이슈 신고", "Report issue", "举报问题", "Báo cáo vấn đề", "問題を報告", "Laporkan masalah")}
                                            </button>
                                          </div>
                                        ) : null}
                                      </div>
                                    ) : null}
                                    <PostedPositionRow
                                      item={item}
                                      canEdit={false}
                                      showStudentActions
                                      isFavorite={favoriteIdSet.has(item.id)}
                                      isApplied={appliedIdSet.has(item.id)}
                                      onToggleFavorite={() => {
                                        void toggleStudentFavorite(item.id);
                                      }}
                                      onApply={() => {
                                        void applyFromStudentFavorite(item.id);
                                      }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    </div>
                  </article>
                ) : null}

                <article className="rounded-2xl border border-border/70 bg-card">
                  <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{tr("로그아웃", "Log out", "退出登录", "Đăng xuất", "ログアウト", "Keluar")}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {tr("현재 계정에서 로그아웃합니다.", "Sign out from your current account.", "从当前账户退出登录。", "Đăng xuất khỏi tài khoản hiện tại.", "現在のアカウントからログアウトします。", "Keluar dari akun Anda saat ini.")}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="sm:self-start" onClick={() => void handleProfileLogout()}>
                      {tr("로그아웃", "Log out", "退出登录", "Đăng xuất", "ログアウト", "Keluar")}
                    </Button>
                  </div>
                  <div className="flex flex-col gap-3 border-t border-border/60 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
                    <div>
                      <h3 className="text-sm font-semibold text-destructive">{tr("회원 탈퇴", "Delete account", "注销账户", "Xoá tài khoản", "退会", "Hapus akun")}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {tr(
                          "탈퇴 시 모든 데이터(프로필, 지원, 프로그램, 알림 등)가 즉시 삭제됩니다.",
                          "Deleting your account removes all your data (profile, applications, programs, notifications) immediately.",
                          "注销账户后,您的所有数据(资料、申请、项目、通知等)将立即被删除。",
                          "Xoá tài khoản sẽ xoá ngay toàn bộ dữ liệu của bạn.",
                          "退会するとすべてのデータ(プロフィール、応募、プログラム、通知など)が即時削除されます。",
                          "Menghapus akun akan menghapus semua data Anda (profil, lamaran, program, notifikasi) segera."
                        )}
                      </p>
                    </div>
                    <Button variant="destructive" size="sm" className="sm:self-start" onClick={() => void handleDeleteAccount()}>
                      {tr("회원 탈퇴", "Delete account", "注销账户", "Xoá tài khoản", "退会", "Hapus akun")}
                    </Button>
                  </div>
                </article>
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
      <ReportIssueModal
        open={reportTarget !== null}
        onClose={() => setReportTarget(null)}
        defaultApplicationId={reportTarget?.id}
        defaultPositionId={reportTarget?.positionId}
      />
      <SelectInterviewSlotModal
        open={interviewTarget !== null}
        applicationId={interviewTarget?.id}
        positionTitle={interviewTarget?.positionTitle}
        onClose={() => setInterviewTarget(null)}
      />
    </div>
  );
}

const PostedPositionRow = ({
  item,
  canEdit,
  showStudentActions = false,
  isFavorite = false,
  isApplied = false,
  onToggleFavorite,
  onApply
}: {
  item: PublicPositionListItem;
  canEdit: boolean;
  showStudentActions?: boolean;
  isFavorite?: boolean;
  isApplied?: boolean;
  onToggleFavorite?: () => void;
  onApply?: () => void;
}) => {
  const { locale } = useLanguage();
  const tr = (ko: string, en: string, zh: string = en, vi: string = en, ja: string = en, id: string = en) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? ja : locale === "id" ? id : en;
  const itemCompany = item.partnerOrganization?.name?.trim() || tr("파트너 기업", "Partner company", "合作伙伴企业", "Doanh nghiệp đối tác", "パートナー企業", "Perusahaan mitra");
  const itemCompanyHref = companyHref(item.partnerOrganization?.id);
  const itemWorkType = item.workType ?? inferWorkType(item.workingHours);
  const itemLocation = item.workLocation?.trim() || item.partnerOrganization?.officeAddress?.trim() || tr("협의", "To be discussed", "面议", "Thỏa thuận", "協議", "Akan dibahas");
  const itemJobRole = item.preferredJobRole?.trim() || tr("직무 미정", "Role TBD", "职位待定", "Chưa xác định vị trí", "職務未定", "Peran belum ditentukan");
  const thumbnail = item.thumbnailImages?.[0];
  const statusBadge = getPositionStatusBadge(item.status, locale);

  return (
    <article className="group relative rounded-xl border border-border/60 bg-card p-4">
      <Link href={`/positions/${item.id}`} aria-label={`${item.title} ${tr("상세보기", "View details", "查看详情", "Xem chi tiết", "詳細を見る", "Lihat detail")}`} className="absolute inset-0 z-10 rounded-xl" />
      <p className="absolute right-4 top-3 text-[11px] text-muted-foreground">{formatPostedDate(item.createdAt, locale)}</p>
      <div className="flex flex-col gap-2 md:grid md:grid-cols-[180px_1fr_auto] md:items-stretch md:gap-3">
        <div className="relative aspect-[16/9] w-full shrink-0 self-start overflow-hidden rounded-xl md:w-[180px] md:self-auto">
          <span className={`absolute left-2 top-2 z-20 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
          {thumbnail ? (
            <img src={thumbnail} alt={`${itemCompany} ${tr("썸네일", "thumbnail", "缩略图", "ảnh thu nhỏ", "サムネイル", "thumbnail")}`} className="block h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center bg-muted font-display text-2xl font-bold leading-none text-muted-foreground">
              {itemCompany[0]?.toUpperCase() ?? "P"}
            </div>
          )}
        </div>

        <div className="flex-1 md:flex md:flex-col md:justify-center">
          <div className="mb-0.5 min-w-0 text-xs text-muted-foreground">
            {itemCompanyHref ? (
              <Link href={itemCompanyHref} className="relative z-20 block max-w-[45%] truncate font-semibold">
                {itemCompany}
              </Link>
            ) : (
              <p className="max-w-[45%] truncate font-semibold">{itemCompany}</p>
            )}
            <p className="mt-1 truncate leading-tight">{itemJobRole}</p>
          </div>
          <h3 className="line-clamp-1 font-display text-lg font-bold leading-snug">{item.title}</h3>
          <div className="mt-0.5 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-xs text-muted-foreground">
            <span className="inline-flex min-w-0 max-w-[50%] items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" />{itemLocation}</span>
            <span className="inline-flex min-w-0 items-center gap-1 truncate"><Briefcase className="h-3 w-3 shrink-0" />{workTypeLabel(itemWorkType, locale)}</span>
          </div>
        </div>

        <div className="relative z-20 flex shrink-0 flex-row items-center justify-between gap-2 border-t border-border/60 pt-1.5 md:mt-auto md:self-end md:border-0 md:pt-0">
          <div className="flex items-center gap-1.5">
            {showStudentActions ? (
              <>
                <Button variant="outline" size="icon" aria-label={tr("저장", "Save", "保存", "Lưu", "保存", "Simpan")} onClick={onToggleFavorite}>
                  <Bookmark className={isFavorite ? "fill-current text-foreground" : ""} />
                </Button>
                <Button
                  variant="dark"
                  size="sm"
                  onClick={onApply}
                  disabled={isApplied}
                  className={isApplied ? "border border-zinc-300 bg-zinc-200 text-zinc-500 disabled:opacity-100" : undefined}
                >
                  {isApplied ? tr("지원완료", "Applied", "已申请", "Đã ứng tuyển", "応募完了", "Telah melamar") : tr("지원하기", "Apply", "申请", "Ứng tuyển", "応募する", "Lamar")}
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/positions/${item.id}`}>{tr("상세보기", "View details", "查看详情", "Xem chi tiết", "詳細を見る", "Lihat detail")}</Link>
              </Button>
            )}
            {canEdit && !showStudentActions ? (
              <Button variant="dark" size="sm" asChild>
                <Link href={`/positions/${item.id}/edit`}>{tr("수정하기", "Edit", "编辑", "Chỉnh sửa", "編集する", "Edit")}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
};

const PostedPositionGridCard = ({
  item,
  canEdit,
  showStudentActions = false,
  isFavorite = false,
  isApplied = false,
  onToggleFavorite,
  onApply
}: {
  item: PublicPositionListItem;
  canEdit: boolean;
  showStudentActions?: boolean;
  isFavorite?: boolean;
  isApplied?: boolean;
  onToggleFavorite?: () => void;
  onApply?: () => void;
}) => {
  const { locale } = useLanguage();
  const tr = (ko: string, en: string, zh: string = en, vi: string = en, ja: string = en, id: string = en) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? ja : locale === "id" ? id : en;
  const itemCompany = item.partnerOrganization?.name?.trim() || tr("파트너 기업", "Partner company", "合作伙伴企业", "Doanh nghiệp đối tác", "パートナー企業", "Perusahaan mitra");
  const itemCompanyHref = companyHref(item.partnerOrganization?.id);
  const itemWorkType = item.workType ?? inferWorkType(item.workingHours);
  const itemLocation = item.workLocation?.trim() || item.partnerOrganization?.officeAddress?.trim() || tr("협의", "To be discussed", "面议", "Thỏa thuận", "協議", "Akan dibahas");
  const itemJobRole = item.preferredJobRole?.trim() || tr("직무 미정", "Role TBD", "职位待定", "Chưa xác định vị trí", "職務未定", "Peran belum ditentukan");
  const thumbnail = item.thumbnailImages?.[0];
  const statusBadge = getPositionStatusBadge(item.status, locale);

  return (
    <article className="group relative flex h-full flex-col rounded-xl border border-border/60 bg-card p-4">
      <Link href={`/positions/${item.id}`} aria-label={`${item.title} ${tr("상세보기", "View details", "查看详情", "Xem chi tiết", "詳細を見る", "Lihat detail")}`} className="absolute inset-0 z-10 rounded-xl" />
      <div className="relative">
        <span className={`absolute left-2 top-2 z-20 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadge.className}`}>
          {statusBadge.label}
        </span>
        {thumbnail ? (
          <img src={thumbnail} alt={`${itemCompany} ${tr("썸네일", "thumbnail", "缩略图", "ảnh thu nhỏ", "サムネイル", "thumbnail")}`} className="block aspect-[16/9] w-full rounded-xl object-cover" />
        ) : (
          <div className="grid aspect-[16/9] w-full place-items-center rounded-xl bg-muted font-display text-4xl font-bold text-muted-foreground">
            {itemCompany[0]?.toUpperCase() ?? "P"}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        <div className="min-w-0 md:flex md:flex-col md:justify-center">
          {itemCompanyHref ? (
            <Link href={itemCompanyHref} className="relative z-20 block truncate font-semibold">
              {itemCompany}
            </Link>
          ) : (
            <p className="truncate font-semibold">{itemCompany}</p>
          )}
          <p className="mt-1 truncate">{itemJobRole}</p>
        </div>
      </div>

      <h3 className="mt-1 truncate font-display text-base font-bold leading-tight">{item.title}</h3>
      <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-xs text-muted-foreground">
        <span className="inline-flex min-w-0 max-w-[58%] items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" />{itemLocation}</span>
        <span className="inline-flex min-w-0 items-center gap-1 truncate"><Briefcase className="h-3 w-3 shrink-0" />{workTypeLabel(itemWorkType, locale)}</span>
      </div>

      <div className="relative z-20 mt-auto flex items-center gap-2 pt-3">
        {showStudentActions ? (
          <>
            <Button variant="outline" size="icon" aria-label={tr("저장", "Save", "保存", "Lưu", "保存", "Simpan")} onClick={onToggleFavorite}>
              <Bookmark className={isFavorite ? "fill-current text-foreground" : ""} />
            </Button>
            <Button
              variant="dark"
              className={`h-10 flex-1 text-sm ${isApplied ? "border border-zinc-300 bg-zinc-200 text-zinc-500 disabled:opacity-100" : ""}`}
              onClick={onApply}
              disabled={isApplied}
            >
              {isApplied ? tr("지원완료", "Applied", "已申请", "Đã ứng tuyển", "応募完了", "Telah melamar") : tr("지원하기", "Apply", "申请", "Ứng tuyển", "応募する", "Lamar")}
            </Button>
          </>
        ) : (
          <Button variant="outline" className="h-10 flex-1 text-sm" asChild>
            <Link href={`/positions/${item.id}`}>{tr("상세보기", "View details", "查看详情", "Xem chi tiết", "詳細を見る", "Lihat detail")}</Link>
          </Button>
        )}

        {canEdit && !showStudentActions ? (
          <Button variant="dark" className="h-10 flex-1 text-sm" asChild>
            <Link href={`/positions/${item.id}/edit`}>{tr("수정하기", "Edit", "编辑", "Chỉnh sửa", "編集する", "Edit")}</Link>
          </Button>
        ) : null}
      </div>
    </article>
  );
};
