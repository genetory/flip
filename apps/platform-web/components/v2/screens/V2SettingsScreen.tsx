"use client";

// v2 내 프로필·설정 — 기존 설정(SettingsScreen)과 같은 내용을 v2 모양으로.
// 프로필 카드 · 내 활동(숫자 세 칸) · 바로 가기 · 관심 직무 · 언어 · 알림 · 계정 · 로그아웃.
import Link from "next/link";
import { useEffect, useState } from "react";
import { V2Shell } from "../V2Shell";
import { Button, Chip, Page, Row, Section, Switch } from "../ui";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { useLanguage } from "../../i18n/LanguageProvider";
import { PLATFORM_LOCALES, type PlatformLocale } from "../../../lib/auth-messages";
import { useNotifPrefs } from "../../../lib/talent/notif-prefs";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useFollowedCompanies } from "../../../lib/talent/company-follow";
import { useJobInterests } from "../../../lib/talent/job-interest";
import { jobTaxonomyLabelOf } from "../../../lib/talent/job-taxonomy-labels";
import { getMyFavoritePositions, getInterestedCompanies } from "../../../lib/member-profile-client";
import { getStoredProfilePhoto, PROFILE_PHOTO_CHANGED_EVENT } from "../../../lib/profile-media";
import { usePlatformT } from "../../../lib/i18n";
import { TalentCardSheet, useTalentPool } from "../talent-pool";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";

const LOCALE_LABELS: Record<PlatformLocale, string> = {
  ko: "한국어",
  en: "English",
  "zh-CN": "中文",
  vi: "Tiếng Việt",
  ja: "日本語",
  id: "Bahasa Indonesia"
};

export function V2SettingsScreen() {
  const t = usePlatformT();
  const { user, logout, getAccountUrl } = useAuthSession();
  const { locale, setLocale } = useLanguage();
  const { pushOn, emailOn, setPushOn, setEmailOn } = useNotifPrefs();
  const followed = useFollowedCompanies();
  const interests = useJobInterests();
  const [saved, setSaved] = useState<number | null>(null);
  const [interested, setInterested] = useState<number | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const name = user?.realName || user?.name || t("나", "Me", "我", "Tôi", "私", "Saya");
  const pool = useTalentPool();
  const [poolPreview, setPoolPreview] = useState(false);
  const toast = useTalentPopup();
  const togglePool = (on: boolean) =>
    pool.setVisible(on).catch(() => toast.error(t("바꾸지 못했어요. 잠시 후 다시 해 주세요.", "Couldn't change it. Try again.", "更改失败，请稍后再试。", "Không đổi được. Thử lại.", "変更できませんでした。", "Gagal mengubah.")));

  // 계정 프로필 사진 — GNB·프로필 편집과 같은 소스(이력서 사진과는 별개).
  useEffect(() => {
    const read = () => setPhoto(user ? (user.profileImageUrl ?? getStoredProfilePhoto(user.id)) : null);
    read();
    window.addEventListener(PROFILE_PHOTO_CHANGED_EVENT, read);
    return () => window.removeEventListener(PROFILE_PHOTO_CHANGED_EVENT, read);
  }, [user]);

  useEffect(() => {
    getMyFavoritePositions()
      .then((l) => setSaved(l.length))
      .catch(() => setSaved(0));
    getInterestedCompanies()
      .then((l) => setInterested(l.length))
      .catch(() => setInterested(0));
  }, []);

  const stats = [
    { label: t("나에게 관심 준 회사", "Interested in you", "对你感兴趣", "Quan tâm bạn", "あなたに関心", "Tertarik padamu"), value: interested, href: talentAppRoutes.feed, tone: "bg-[#edf1fd]" },
    { label: t("관심 회사", "Following", "关注的公司", "Đang theo dõi", "関心企業", "Diikuti"), value: followed.length, href: "/talent/activity/following-companies", tone: "bg-[#e8f8f1]" },
    { label: t("저장한 공고", "Saved jobs", "收藏的职位", "Tin đã lưu", "保存した求人", "Tersimpan"), value: saved, href: "/v2/jobs?tab=saved", tone: "bg-[#fff4e8]" }
  ];

  return (
    <V2Shell requireAuth>
      <Page>
        {/* 프로필 */}
        <header className="px-5 pb-8 pt-8 md:pt-12">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color:var(--v2-band)] text-[24px] font-bold text-[color:var(--v2-ink-3)]">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- 계정 사진은 data URL·외부 주소가 섞여 next/image 로 못 받는다.
                <img src={photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <span aria-hidden>{name.charAt(0).toUpperCase()}</span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5">
                <span className="truncate text-[22px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">{name}</span>
                {user?.emailVerified ? (
                  <span className="shrink-0 rounded-full bg-[#edf1fd] px-2 py-0.5 text-[12px] font-bold text-[color:var(--v2-accent)]">{t("인증됨", "Verified", "已验证", "Đã xác minh", "認証済み", "Terverifikasi")}</span>
                ) : (
                  <span className="shrink-0 rounded-full bg-[#fff4e8] px-2 py-0.5 text-[12px] font-bold text-[#c2410c]">{t("인증 전", "Unverified", "未验证", "Chưa xác minh", "未認証", "Belum")}</span>
                )}
              </p>
              {user?.email ? <p className="mt-0.5 truncate text-[15px] text-[color:var(--v2-muted)]">{user.email}</p> : null}
            </div>
          </div>
          <div className="mt-5">
            <Button variant="neutral" full href="/v2/profile">
              {t("프로필 편집", "Edit profile", "编辑资料", "Sửa hồ sơ", "プロフィール編集", "Edit profil")}
            </Button>
          </div>
        </header>

        {/* 내 활동 — 숫자 세 칸 */}
        <Section title={t("내 활동", "My activity", "我的活动", "Hoạt động", "マイアクティビティ", "Aktivitas")}>
          <div className="grid grid-cols-3 gap-2">
            {stats.map((s) => (
              <Link key={s.label} href={s.href} className={`flex min-h-[92px] flex-col justify-between rounded-2xl p-3.5 transition hover:-translate-y-0.5 ${s.tone}`}>
                <span className="text-[13px] font-semibold leading-[1.35] text-[color:var(--v2-ink-3)]">{s.label}</span>
                <span className="text-[24px] font-bold tabular-nums text-[color:var(--v2-ink)]">{s.value ?? "–"}</span>
              </Link>
            ))}
          </div>
        </Section>

        {/* 바로 가기 */}
        <Section title={t("바로 가기", "Shortcuts", "快捷入口", "Lối tắt", "ショートカット", "Pintasan")}>
          <Row href="/v2/career" lead="📄" title={t("내 커리어", "My career", "我的职业", "Sự nghiệp", "マイキャリア", "Karier saya")} meta={t("이력서·자기소개서·관심 직무", "Resume, cover letter, interests", "简历·自荐信·兴趣职位", "CV, thư, ngành quan tâm", "履歴書・自己PR・関心職種", "CV, surat, minat")} />
          <Row href="/v2/payments" lead="🎟️" title={t("이용권·결제 내역", "Passes & payments", "使用券·支付记录", "Vé & thanh toán", "チケット・決済履歴", "Tiket & pembayaran")} meta={t("모의 면접 이용권 충전·환불", "Top up or refund mock interview passes", "充值·退款模拟面试使用券", "Nạp/hoàn vé phỏng vấn", "模擬面接チケットのチャージ・返金", "Isi/refund tiket")} />
          <Row href="/v2/applications" lead="📮" title={t("지원 현황", "Applications", "申请状态", "Ứng tuyển", "応募状況", "Lamaran")} />
          <Row href={talentAppRoutes.programs} lead="🎓" title={t("내 프로그램", "My programs", "我的项目", "Chương trình", "マイプログラム", "Program saya")} />
          <Row href={talentAppRoutes.assignments} lead="📝" title={t("과제", "Assignments", "作业", "Bài tập", "課題", "Tugas")} />
          <Row href={talentAppRoutes.connections} lead="🤝" title={t("파트너 연결", "Partner connections", "伙伴连接", "Kết nối đối tác", "パートナー連携", "Koneksi mitra")} />
        </Section>

        {/* 관심 직무 — 바꾸기는 내 커리어에서 */}
        <Section
          title={t("관심 직무", "Job interests", "感兴趣的职位", "Ngành quan tâm", "関心職種", "Minat kerja")}
          aside={
            <Link href="/v2/career" className="text-[14px] font-semibold text-[color:var(--v2-accent)]">
              {t("바꾸기", "Change", "更改", "Đổi", "変更", "Ubah")}
            </Link>
          }
        >
          {interests.length ? (
            <div className="flex flex-wrap gap-2">
              {interests.map((r) => (
                <span key={r} className="inline-flex h-9 items-center rounded-full bg-[color:var(--v2-band)] px-3.5 text-[14px] font-semibold text-[color:var(--v2-ink-2)]">
                  {jobTaxonomyLabelOf(t, r)}
                </span>
              ))}
            </div>
          ) : (
            <Row href="/v2/career" lead="🎯" title={t("관심 직무 고르기", "Pick job interests", "选择感兴趣的职位", "Chọn ngành quan tâm", "関心職種を選ぶ", "Pilih minat")} meta={t("맞는 공고와 면접 질문을 추천해 드려요", "We'll recommend matching jobs and questions", "为你推荐匹配的职位和问题", "Gợi ý việc và câu hỏi phù hợp", "合う求人と質問をおすすめ", "Kami rekomendasikan yang cocok")} />
          )}
        </Section>

        {/* 언어 */}
        <Section title={t("언어", "Language", "语言", "Ngôn ngữ", "言語", "Bahasa")}>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_LOCALES.map((l) => (
              <Chip key={l} active={locale === l} onClick={() => setLocale(l)}>
                {LOCALE_LABELS[l]}
              </Chip>
            ))}
          </div>
        </Section>

        {/* 알림 */}
        <Section
          title={t("알림", "Notifications", "通知", "Thông báo", "通知", "Notifikasi")}
          aside={
            <Link href="/v2/notifications" className="text-[14px] font-semibold text-[color:var(--v2-accent)]">
              {t("알림함", "Inbox", "通知箱", "Hộp thư", "通知一覧", "Kotak")}
            </Link>
          }
        >
          <div className="flex flex-col">
            <SwitchRow
              title={t("추천 공고 알림", "Job recommendations", "推荐职位通知", "Gợi ý việc làm", "おすすめ求人の通知", "Rekomendasi lowongan")}
              meta={t("관심 직무에 맞는 새 공고", "New jobs matching your interests", "符合兴趣的新职位", "Việc mới phù hợp", "関心職種に合う新着", "Lowongan baru yang cocok")}
              on={pushOn}
              onChange={setPushOn}
            />
            <SwitchRow
              title={t("이메일 소식 받기", "Email updates", "接收邮件动态", "Nhận tin qua email", "メールで受け取る", "Kabar via email")}
              meta={t("새 소식을 이메일로 받아요", "Get news by email", "通过邮件接收新动态", "Nhận tin qua email", "新着をメールで受け取る", "Kabar lewat email")}
              on={emailOn}
              onChange={setEmailOn}
            />
          </div>
        </Section>

        {/* 기업 인재 검색 노출 — 가입하면 기본으로 켜져 있다(블라인드). 끄면 인재 검색·새 연결 요청에서 빠진다. */}
        <Section title={t("기업 인재 검색", "Talent search", "企业人才搜索", "Tìm kiếm nhân tài", "企業の人材検索", "Pencarian talenta")}>
          <SwitchRow
            title={t("내 이력서를 기업에게 보여 주기", "Show my resume to companies", "向企业展示我的简历", "Hiển thị CV cho doanh nghiệp", "履歴書を企業に表示", "Tampilkan CV ke perusahaan")}
            meta={t("이름·연락처는 가린 채 보여요. 끄면 검색과 새 연결 요청에서 빠져요.", "Name and contact stay hidden. Off = out of search and new requests.", "姓名和联系方式隐藏。关闭后不再出现在搜索和新请求中。", "Ẩn tên và liên hệ. Tắt = rời tìm kiếm.", "名前・連絡先は非表示。オフで検索と新規申請から外れます。", "Nama & kontak disembunyikan.")}
            on={pool.status ? !pool.status.optedOut : true}
            onChange={(v) => void togglePool(v)}
          />
          {pool.status?.card ? <Row onClick={() => setPoolPreview(true)} lead="👀" title={t("기업에게 이렇게 보여요", "How companies see you", "企业看到的你", "Doanh nghiệp thấy bạn", "企業からの見え方", "Tampilan bagi perusahaan")} meta={pool.status.visible ? t("지금 인재 검색에 보이는 중", "Visible now", "当前可见", "Đang hiển thị", "現在表示中", "Terlihat") : pool.status.optedOut ? t("지금은 꺼져 있어요", "Currently off", "当前已关闭", "Đang tắt", "現在オフ", "Nonaktif") : t("이력서를 더 채우면 보여요", "Fill your resume to appear", "完善简历后可见", "Hoàn thiện CV để hiển thị", "履歴書を埋めると表示", "Lengkapi CV")} /> : null}
          <Row href="/talent/connections" lead="🤝" title={t("받은 연결 요청", "Connection requests", "收到的连接请求", "Yêu cầu kết nối", "つながり申請", "Permintaan koneksi")} />
        </Section>

        {/* 계정 */}
        <Section title={t("계정", "Account", "账户", "Tài khoản", "アカウント", "Akun")}>
          <Row href={getAccountUrl()} title={t("계정 정보 관리", "Manage account", "管理账户", "Quản lý tài khoản", "アカウント管理", "Kelola akun")} />
          <Row href="mailto:info@flip-ers.com" title={t("고객센터 · 문의", "Help & support", "客服 · 咨询", "Trợ giúp · Liên hệ", "サポート", "Bantuan")} />
          <Row href="/legal/privacy" title={t("개인정보처리방침", "Privacy policy", "隐私政策", "Chính sách bảo mật", "プライバシーポリシー", "Kebijakan privasi")} />
          <Row href="/legal/terms" title={t("이용약관", "Terms of service", "服务条款", "Điều khoản", "利用規約", "Ketentuan")} />
          <Row href="/account/delete" title={<span className="text-[color:var(--v2-muted)]">{t("회원 탈퇴", "Delete account", "注销账户", "Xóa tài khoản", "退会", "Hapus akun")}</span>} />
          <div className="mt-6">
            <button type="button" onClick={() => void logout()} className="flex h-12 w-full items-center justify-center rounded-xl bg-[color:var(--v2-band)] text-[16px] font-semibold text-[color:var(--v2-attention)] transition hover:opacity-90">
              {t("로그아웃", "Log out", "退出登录", "Đăng xuất", "ログアウト", "Keluar")}
            </button>
          </div>
        </Section>
      </Page>
      {poolPreview && pool.status ? <TalentCardSheet t={t} status={pool.status} onClose={() => setPoolPreview(false)} /> : null}
    </V2Shell>
  );
}

function SwitchRow({ title, meta, on, onChange }: { title: string; meta: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-semibold leading-[1.45] text-[color:var(--v2-ink)]">{title}</span>
        <span className="mt-0.5 block text-[14px] leading-[1.5] text-[color:var(--v2-faint)]">{meta}</span>
      </span>
      <Switch on={on} onChange={onChange} label={<span className="sr-only">{title}</span>} />
    </div>
  );
}
