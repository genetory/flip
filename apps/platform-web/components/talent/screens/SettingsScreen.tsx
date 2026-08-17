"use client";

// 내 프로필 — 프로필 허브. 프로필 요약 + 내 커리어(이력서·자소서) + 관심 직무 +
// 지원 현황 + 내 활동 + 알림 + 계정. 각 섹션은 관련 상세 화면으로 이어진다.
import Link from "next/link";
import { useEffect, useState } from "react";
import { CaretRight, SealCheck, SignOut, PencilSimple } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { JobInterestCard } from "../jobs/JobInterestCard";
import { CareerFunnelCards } from "../career/CareerFunnelCards";
import { TCard } from "../ui/primitives";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { useLanguage } from "../../i18n/LanguageProvider";
import { PLATFORM_LOCALES, type PlatformLocale } from "../../../lib/auth-messages";
import { useNotifPrefs } from "../../../lib/talent/notif-prefs";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useFollowedCompanies } from "../../../lib/talent/company-follow";
import { getMyFavoritePositions, getInterestedCompanies, type PublicPositionListItem } from "../../../lib/member-profile-client";
import { PointsBalanceCard } from "../PointsBalanceCard";
import { getStoredProfilePhoto, PROFILE_PHOTO_CHANGED_EVENT } from "../../../lib/profile-media";
import { usePlatformT } from "../../../lib/i18n";

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-[#0B46E8]" : "bg-[#D7DCE3]"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

// 섹션 헤더 — 타이틀.
function SectionHeader({ title }: { title: string }) {
  return <p className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</p>;
}

// 내 포인트 — 공용 잔액 카드(내역 페이지 이동 + 충전 팝업).
function MyPointsSection() {
  const t = usePlatformT();
  return (
    <section>
      <SectionHeader title={t("내 포인트", "My points", "我的积分", "Điểm của tôi", "マイポイント", "Poin saya")} />
      <PointsBalanceCard />
    </section>
  );
}

// 섹션 하단 더 보기 버튼 — 홈 포지션 리스트 하단 버튼과 동일한 스타일.
function MoreLink({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="mt-3 flex items-center justify-center gap-1 rounded-2xl border border-[#EEF1F5] bg-white py-3.5 text-[14px] font-bold text-[#0B46E8] transition hover:bg-[#F6F8FB]">
      {label} <CaretRight className="h-4 w-4" weight="bold" />
    </Link>
  );
}

// 스탯 카드 — 라벨 + 큰 갯수. 누르면 관련 상세 목록으로.
function StatCard({ title, count, href }: { title: string; count: number; href: string }) {
  return (
    <Link href={href} className="block rounded-2xl border border-[#EEF1F5] bg-white px-5 py-4 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12.5px] font-normal text-[#8B95A1]">{title}</p>
        <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
      </div>
      <p className="mt-0.5 text-[24px] font-black tracking-[-0.02em] text-[#191F28]">{count}</p>
    </Link>
  );
}

function Item({ label, href, value }: { label: string; href?: string; value?: string }) {
  const inner = (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="flex-1 text-[14.5px] text-[#191F28]">{label}</span>
      {value ? <span className="text-[13px] text-[#8B95A1]">{value}</span> : null}
      {href ? <CaretRight className="h-4 w-4 text-[#C4CAD2]" /> : null}
    </div>
  );
  if (href) return <Link href={href} className="block transition hover:bg-[#F6F8FB]">{inner}</Link>;
  return inner;
}

const LOCALE_LABELS: Record<PlatformLocale, string> = {
  ko: "한국어",
  en: "English",
  "zh-CN": "中文",
  vi: "Tiếng Việt",
  ja: "日本語",
  id: "Bahasa Indonesia"
};

export function SettingsScreen() {
  const t = usePlatformT();
  const { user, logout, getAccountUrl } = useAuthSession();
  const { locale, setLocale } = useLanguage();
  const { pushOn, emailOn, setPushOn, setEmailOn } = useNotifPrefs();
  const [favPositions, setFavPositions] = useState<PublicPositionListItem[]>([]);
  const [interestedCount, setInterestedCount] = useState(0);

  const name = user?.realName || user?.name || t("나", "Me", "我", "Tôi", "私", "Saya");

  // 계정 프로필 사진 — GNB·프로필편집과 동일 소스. 이력서 사진(BasicInfo.photoUrl)과는 별개.
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setProfilePhoto(user ? (user.profileImageUrl ?? getStoredProfilePhoto(user.id)) : null);
    read();
    if (typeof window === "undefined") return;
    window.addEventListener(PROFILE_PHOTO_CHANGED_EVENT, read);
    return () => window.removeEventListener(PROFILE_PHOTO_CHANGED_EVENT, read);
  }, [user?.id, user?.profileImageUrl]);
  const emailVerified = Boolean(user?.emailVerified);

  // 관심 회사(내가 팔로우) — 서버(company-follow).
  const followedCompanies = useFollowedCompanies();

  // 즐겨찾기한 포지션 + 나에게 관심 준 회사 수(서버) 로드.
  useEffect(() => {
    void getMyFavoritePositions()
      .then((list) => setFavPositions(list))
      .catch(() => setFavPositions([]));
    void getInterestedCompanies()
      .then((list) => setInterestedCount(list.length))
      .catch(() => setInterestedCount(0));
  }, []);

  return (
    <TalentAppShell maxWidth="4xl">
      <div className="flex flex-col gap-12">
        {/* 기본 정보 */}
        <section>
          <SectionHeader title={t("기본 정보", "Basic info", "基本信息", "Thông tin cơ bản", "基本情報", "Info dasar")} />
          <div className="rounded-3xl bg-[#F5F8FF] p-6">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-[24px] font-black text-[#0B46E8] shadow-[0_4px_16px_rgba(11,70,232,0.12)]">
              {profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profilePhoto} alt="" className="h-full w-full object-cover" />
              ) : (
                name.slice(0, 1)
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-[19px] font-black tracking-[-0.02em] text-[#0B1227]">{name}</p>
                {emailVerified ? (
                  <SealCheck className="h-[18px] w-[18px] shrink-0 text-[#0B46E8]" weight="fill" aria-label={t("이메일 인증됨", "Email verified", "邮箱已验证", "Email đã xác minh", "メール認証済み", "Email terverifikasi")} />
                ) : (
                  <span className="shrink-0 rounded-md bg-[#FFF3E6] px-2.5 py-0.5 text-[10.5px] font-bold text-[#E8890C]">{t("인증 안됨", "Not verified", "未验证", "Chưa xác minh", "未認証", "Belum terverifikasi")}</span>
                )}
              </div>
              {user?.email ? <p className="mt-0.5 truncate text-[13px] text-[#8B95A1]">{user.email}</p> : null}
            </div>
            <Link
              href={talentAppRoutes.profile}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3.5 py-2.5 text-[13px] font-bold text-[#4E5968] shadow-[0_2px_10px_rgba(11,18,39,0.06)] transition hover:text-[#0B46E8]"
            >
              <PencilSimple className="h-4 w-4" /> {t("프로필 편집", "Edit profile", "编辑资料", "Sửa hồ sơ", "プロフィール編集", "Edit profil")}
            </Link>
          </div>
          </div>
        </section>

        {/* 내 포인트 — 기본정보 바로 아래. AI 포인트는 학생 전용(GNB 티켓 뱃지와 동일). */}
        {user?.role === "STUDENT" ? <MyPointsSection /> : null}

        {/* 내 활동 — 나에게 관심 준 회사 + 관심 회사/포지션. */}
        <section>
          <SectionHeader title={t("내 활동", "My activity", "我的活动", "Hoạt động của tôi", "マイアクティビティ", "Aktivitas saya")} />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard title={t("나에게 관심 준 회사", "Interested in you", "对你感兴趣的公司", "Công ty quan tâm bạn", "あなたに関心", "Tertarik padamu")} count={interestedCount} href={talentAppRoutes.feed} />
            <StatCard title={t("관심 회사", "Followed companies", "关注的公司", "Công ty theo dõi", "関心のある企業", "Perusahaan diikuti")} count={followedCompanies.length} href="/talent/activity/following-companies" />
            <StatCard title={t("즐겨찾기한 포지션", "Saved jobs", "收藏的职位", "Vị trí đã lưu", "保存した求人", "Lowongan tersimpan")} count={favPositions.length} href="/talent/activity/favorite-positions" />
          </div>
        </section>

        {/* 내 커리어 — 이력서/자기소개서 (커리어 상세로 연결) */}
        <section>
          <SectionHeader title={t("내 커리어", "My career", "我的职业", "Sự nghiệp của tôi", "マイキャリア", "Karier saya")} />
          <CareerFunnelCards showPreview />
          <MoreLink label={t("내 커리어 더 보기", "See more", "查看更多", "Xem thêm", "もっと見る", "Lihat selengkapnya")} href={talentAppRoutes.career} />
        </section>

        {/* 프로그램 · 활동 — 참여 프로그램/과제/파트너 연결 진입 (알림 딥링크 외 안정적 진입점) */}
        <section>
          <SectionHeader title={t("프로그램 · 활동", "Programs & activity", "项目 · 活动", "Chương trình · Hoạt động", "プログラム・活動", "Program & aktivitas")} />
          <TCard className="divide-y divide-[#F2F4F6]">
            <Item label={t("내 프로그램", "My programs", "我的项目", "Chương trình của tôi", "マイプログラム", "Program saya")} href={talentAppRoutes.programs} />
            <Item label={t("과제", "Assignments", "作业", "Bài tập", "課題", "Tugas")} href={talentAppRoutes.assignments} />
            <Item label={t("파트너 연결", "Partner connections", "伙伴连接", "Kết nối đối tác", "パートナー連携", "Koneksi mitra")} href={talentAppRoutes.connections} />
          </TCard>
        </section>

        {/* 관심 직무 */}
        <section>
          <SectionHeader title={t("관심 직무", "Job interests", "感兴趣的职务", "Ngành nghề quan tâm", "興味のある職種", "Minat pekerjaan")} />
          <JobInterestCard variant="edit" />
        </section>

        {/* 언어 */}
        <section>
          <SectionHeader title={t("언어", "Language", "语言", "Ngôn ngữ", "言語", "Bahasa")} />
          <TCard>
            <div className="flex items-center gap-3 px-5 py-4">
              <span className="flex-1 text-[14.5px] text-[#191F28]">{t("표시 언어", "Display language", "显示语言", "Ngôn ngữ hiển thị", "表示言語", "Bahasa tampilan")}</span>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as PlatformLocale)}
                aria-label={t("표시 언어", "Display language", "显示语言", "Ngôn ngữ hiển thị", "表示言語", "Bahasa tampilan")}
                className="rounded-xl border border-[#E5E8EB] bg-white px-3 py-2 text-[13.5px] font-semibold text-[#191F28] outline-none focus:border-[#0B46E8]"
              >
                {PLATFORM_LOCALES.map((l) => (
                  <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
                ))}
              </select>
            </div>
          </TCard>
        </section>

        {/* 알림 */}
        <section>
          <SectionHeader title={t("알림", "Notifications", "通知", "Thông báo", "お知らせ", "Notifikasi")} />
          <TCard className="divide-y divide-[#F2F4F6]">
            <div className="flex items-center gap-3 px-5 py-4">
              <span className="flex-1 text-[14.5px] text-[#191F28]">{t("추천 공고 알림", "Job recommendations", "推荐职位通知", "Thông báo gợi ý việc làm", "おすすめ求人の通知", "Notifikasi lowongan")}</span>
              <Toggle on={pushOn} onChange={setPushOn} label={t("추천 공고 알림", "Job recommendations", "推荐职位通知", "Thông báo gợi ý việc làm", "おすすめ求人の通知", "Notifikasi lowongan")} />
            </div>
            <div className="flex items-center gap-3 px-5 py-4">
              <span className="flex-1 text-[14.5px] text-[#191F28]">{t("이메일 소식 받기", "Email updates", "接收邮件动态", "Nhận tin qua email", "メールで受け取る", "Kabar via email")}</span>
              <Toggle on={emailOn} onChange={setEmailOn} label={t("이메일 소식 받기", "Email updates", "接收邮件动态", "Nhận tin qua email", "メールで受け取る", "Kabar via email")} />
            </div>
          </TCard>
          <MoreLink label={t("알림함 열기", "Open notifications", "打开通知箱", "Mở hộp thông báo", "お知らせを開く", "Buka notifikasi")} href={talentAppRoutes.notifications} />
        </section>

        {/* 계정 */}
        <section>
          <SectionHeader title={t("계정", "Account", "账户", "Tài khoản", "アカウント", "Akun")} />
          <TCard className="divide-y divide-[#F2F4F6]">
            <Item label={t("계정 정보 관리", "Manage account", "管理账户信息", "Quản lý tài khoản", "アカウント情報管理", "Kelola akun")} href={getAccountUrl()} />
            <a href="mailto:info@flip-ers.com" className="block transition hover:bg-[#F6F8FB]">
              <div className="flex items-center gap-3 px-5 py-4">
                <span className="flex-1 text-[14.5px] text-[#191F28]">{t("고객센터 · 문의", "Help & support", "客服 · 咨询", "Trợ giúp · Liên hệ", "サポート・お問い合わせ", "Bantuan · Kontak")}</span>
                <CaretRight className="h-4 w-4 text-[#C4CAD2]" />
              </div>
            </a>
            <Item label={t("개인정보처리방침", "Privacy policy", "隐私政策", "Chính sách bảo mật", "プライバシーポリシー", "Kebijakan privasi")} href="/legal/privacy" />
            <Item label={t("이용약관", "Terms of service", "服务条款", "Điều khoản dịch vụ", "利用規約", "Ketentuan layanan")} href="/legal/terms" />
            <Item label={t("회원 탈퇴", "Delete account", "注销账户", "Xóa tài khoản", "退会", "Hapus akun")} href="/account/delete" />
          </TCard>
        </section>

        <button
          type="button"
          onClick={() => void logout()}
          className="mt-2 flex items-center justify-center gap-2 rounded-2xl border border-[#EEF1F5] bg-white py-4 text-[14px] font-semibold text-[#F04452] transition hover:bg-[#FFF5F5]"
        >
          <SignOut className="h-[18px] w-[18px]" /> {t("로그아웃", "Log out", "退出登录", "Đăng xuất", "ログアウト", "Keluar")}
        </button>
      </div>
    </TalentAppShell>
  );
}
