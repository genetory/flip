"use client";

// 파트너 내 프로필 — 탤런트 설정과 동일한 결의 프로필 허브.
// 기본 정보(히어로) + 채용 현황(스탯) + 회사 + 알림 + 계정 + 로그아웃.
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CaretRight, SealCheck, SignOut, PencilSimple, Buildings, UserPlus, EnvelopeSimple, X } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { useLanguage } from "../../i18n/LanguageProvider";
import { PLATFORM_LOCALES, type PlatformLocale } from "../../../lib/auth-messages";
import { TCard } from "../../talent/ui/primitives";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import {
  getMyPartnerOrganization,
  getMyPartnerPositions,
  getMyPartnerApplicants,
  getMyPartnerOrganizationMembers,
  createMyPartnerOrganizationJoinCode,
  updatePartnerOrgMemberRole,
  removePartnerOrgMember,
  getPartnerTeamInvites,
  invitePartnerTeamMember,
  revokePartnerTeamInvite,
  type MyPartnerOrganization,
  type PartnerPosition,
  type PartnerApplicantListItem,
  type PartnerOrgMember,
  type PartnerTeamInvite
} from "../../../lib/member-profile-client";

const ORG_ROLE_CLS: Record<PartnerOrgMember["role"], string> = {
  OWNER: "bg-[#EDF1FD] text-[#0B46E8]",
  ADMIN: "bg-[#E7F8EF] text-[#0A9B59]",
  MEMBER: "bg-[#F2F4F6] text-[#8B95A1]"
};
function orgRoleLabel(t: PlatformT, role: PartnerOrgMember["role"]): string {
  switch (role) {
    case "OWNER":
      return t("소유자", "Owner", "所有者", "Chủ sở hữu", "オーナー", "Pemilik");
    case "ADMIN":
      return t("관리자", "Admin", "管理员", "Quản trị", "管理者", "Admin");
    case "MEMBER":
      return t("멤버", "Member", "成员", "Thành viên", "メンバー", "Anggota");
  }
}

function SectionHeader({ title }: { title: string }) {
  return <p className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</p>;
}

// 스탯 카드 — 라벨 + 큰 갯수. 누르면 관련 목록으로. (탤런트 설정과 동일)
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

function Item({ label, href, external }: { label: string; href: string; external?: boolean }) {
  const inner = (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="flex-1 text-[14.5px] text-[#191F28]">{label}</span>
      <CaretRight className="h-4 w-4 text-[#C4CAD2]" />
    </div>
  );
  return external ? (
    <a href={href} className="block transition hover:bg-[#F6F8FB]">{inner}</a>
  ) : (
    <Link href={href} className="block transition hover:bg-[#F6F8FB]">{inner}</Link>
  );
}

const LOCALE_LABELS: Record<PlatformLocale, string> = {
  ko: "한국어",
  en: "English",
  "zh-CN": "中文",
  vi: "Tiếng Việt",
  ja: "日本語",
  id: "Bahasa Indonesia"
};

export function PartnerSettingsScreen() {
  const t = usePlatformT();
  const { user, logout, getAccountUrl } = useAuthSession();
  const toast = useTalentPopup();
  const { locale, setLocale } = useLanguage();
  const [org, setOrg] = useState<MyPartnerOrganization | null>(null);
  const [positions, setPositions] = useState<PartnerPosition[]>([]);
  const [applicants, setApplicants] = useState<PartnerApplicantListItem[]>([]);
  const [members, setMembers] = useState<PartnerOrgMember[]>([]);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [memberBusy, setMemberBusy] = useState<string | null>(null); // 작업 중인 멤버 id
  const [invites, setInvites] = useState<PartnerTeamInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [sendingInvite, setSendingInvite] = useState(false);

  const name = user?.realName || user?.name || t("파트너", "Partner", "合作伙伴", "Đối tác", "パートナー", "Mitra");
  const emailVerified = Boolean(user?.emailVerified);

  function reloadMembers() {
    void getMyPartnerOrganizationMembers().then(setMembers).catch(() => {});
  }
  function reloadInvites() {
    void getPartnerTeamInvites().then(setInvites).catch(() => {});
  }
  useEffect(() => {
    void getMyPartnerOrganization().then(setOrg).catch(() => {});
    void getMyPartnerPositions().then(setPositions).catch(() => {});
    void getMyPartnerApplicants().then(setApplicants).catch(() => {});
    reloadMembers();
    reloadInvites();
  }, []);

  const myRole = members.find((m) => m.isMe)?.role;
  const canManage = myRole === "OWNER" || myRole === "ADMIN";

  function sendInvite() {
    const email = inviteEmail.trim();
    if (!email || sendingInvite) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t("올바른 이메일 주소를 입력해주세요.", "Enter a valid email address.", "请输入有效的邮箱地址。", "Vui lòng nhập email hợp lệ.", "有効なメールアドレスを入力してください。", "Masukkan alamat email yang valid."));
      return;
    }
    setSendingInvite(true);
    invitePartnerTeamMember(email, inviteRole)
      .then(() => {
        toast.success(t("초대 메일을 보냈어요", "Invite email sent", "已发送邀请邮件", "Đã gửi email mời", "招待メールを送りました", "Email undangan terkirim"));
        setInviteEmail("");
        setInviteRole("MEMBER");
        reloadInvites();
      })
      .catch((e) => toast.error(e?.message || t("초대에 실패했어요.", "Couldn't send the invite.", "邀请失败。", "Không thể gửi lời mời.", "招待に失敗しました。", "Gagal mengirim undangan.")))
      .finally(() => setSendingInvite(false));
  }
  function revokeInvite(id: string) {
    revokePartnerTeamInvite(id)
      .then(() => {
        toast.success(t("초대를 취소했어요", "Invite canceled", "已取消邀请", "Đã hủy lời mời", "招待を取り消しました", "Undangan dibatalkan"));
        reloadInvites();
      })
      .catch(() => toast.error(t("초대 취소에 실패했어요.", "Couldn't cancel the invite.", "取消邀请失败。", "Không thể hủy lời mời.", "招待の取り消しに失敗しました。", "Gagal membatalkan undangan.")));
  }

  function changeRole(userId: string, role: "ADMIN" | "MEMBER") {
    if (memberBusy) return;
    setMemberBusy(userId);
    updatePartnerOrgMemberRole(userId, role)
      .then(() => {
        toast.success(t("역할을 변경했어요", "Role updated", "已更改角色", "Đã đổi vai trò", "役割を変更しました", "Peran diperbarui"));
        reloadMembers();
      })
      .catch(() => toast.error(t("역할 변경에 실패했어요.", "Couldn't change the role.", "更改角色失败。", "Không thể đổi vai trò.", "役割の変更に失敗しました。", "Gagal mengubah peran.")))
      .finally(() => setMemberBusy(null));
  }
  function removeMember(userId: string, memberName: string) {
    if (memberBusy) return;
    if (!window.confirm(t(`${memberName} 님을 회사에서 내보낼까요?`, `Remove ${memberName} from the company?`, `确定将 ${memberName} 移出公司吗？`, `Xóa ${memberName} khỏi công ty?`, `${memberName} さんを会社から外しますか？`, `Keluarkan ${memberName} dari perusahaan?`))) return;
    setMemberBusy(userId);
    removePartnerOrgMember(userId)
      .then(() => {
        toast.success(t("팀원을 내보냈어요", "Member removed", "已移除成员", "Đã xóa thành viên", "メンバーを外しました", "Anggota dikeluarkan"));
        reloadMembers();
      })
      .catch(() => toast.error(t("내보내기에 실패했어요.", "Couldn't remove the member.", "移除失败。", "Không thể xóa.", "削除に失敗しました。", "Gagal mengeluarkan.")))
      .finally(() => setMemberBusy(null));
  }

  function makeInvite() {
    if (inviting) return;
    setInviting(true);
    createMyPartnerOrganizationJoinCode()
      .then((r) => setInviteCode(r.code))
      .catch(() => toast.error(t("초대 코드 생성에 실패했어요.", "Couldn't create an invite code.", "生成邀请码失败。", "Không thể tạo mã mời.", "招待コードの生成に失敗しました。", "Gagal membuat kode undangan.")))
      .finally(() => setInviting(false));
  }
  function copyInvite() {
    if (!inviteCode) return;
    void navigator.clipboard?.writeText(inviteCode).then(() => toast.success(t("초대 코드를 복사했어요", "Invite code copied", "已复制邀请码", "Đã sao chép mã mời", "招待コードをコピーしました", "Kode undangan disalin"))).catch(() => {});
  }

  const openCount = positions.filter((p) => p.status === "OPEN").length;
  const appliedCount = applicants.filter((a) => a.status === "APPLIED").length;
  const interviewCount = applicants.filter((a) => a.status === "INTERVIEW").length;

  return (
    <PartnerAppShell>
      <div className="flex flex-col gap-12">
        {/* 기본 정보 */}
        <section>
          <SectionHeader title={t("기본 정보", "Basic info", "基本信息", "Thông tin cơ bản", "基本情報", "Info dasar")} />
          <div className="rounded-3xl bg-[#F5F8FF] p-6">
            <div className="flex items-center gap-4">
              {user?.profileImageUrl ? (
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white shadow-[0_4px_16px_rgba(11,70,232,0.12)]">
                  <Image src={user.profileImageUrl} alt="" fill sizes="64px" className="object-cover" unoptimized />
                </span>
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-[24px] font-black text-[#0B46E8] shadow-[0_4px_16px_rgba(11,70,232,0.12)]">
                  {name.slice(0, 1)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[19px] font-black tracking-[-0.02em] text-[#0B1227]">{name}</p>
                  {emailVerified ? (
                    <SealCheck className="h-[18px] w-[18px] shrink-0 text-[#0B46E8]" weight="fill" aria-label={t("이메일 인증됨", "Email verified", "邮箱已验证", "Email đã xác minh", "メール認証済み", "Email terverifikasi")} />
                  ) : (
                    <span className="shrink-0 rounded-md bg-[#FFF3E6] px-2.5 py-0.5 text-[10.5px] font-bold text-[#E8890C]">{t("인증 안됨", "Unverified", "未验证", "Chưa xác minh", "未認証", "Belum diverifikasi")}</span>
                  )}
                </div>
                {user?.email ? <p className="mt-0.5 truncate text-[13px] text-[#8B95A1]">{user.email}</p> : null}
              </div>
              <Link
                href={partnerRoutes.profile}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3.5 py-2.5 text-[13px] font-bold text-[#4E5968] shadow-[0_2px_10px_rgba(11,18,39,0.06)] transition hover:text-[#0B46E8]"
              >
                <PencilSimple className="h-4 w-4" /> {t("프로필 편집", "Edit profile", "编辑资料", "Sửa hồ sơ", "プロフィール編集", "Edit profil")}
              </Link>
            </div>
          </div>
        </section>

        {/* 채용 현황 — 프로필 카드 바로 아래(탤런트 '내 활동'과 동일 위치) */}
        <section>
          <SectionHeader title={t("채용 현황", "Hiring", "招聘概况", "Tuyển dụng", "採用状況", "Rekrutmen")} />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard title={t("게시 중 공고", "Open postings", "在招职位", "Tin đang mở", "掲載中求人", "Lowongan aktif")} count={openCount} href={`${partnerRoutes.positions}?tab=OPEN`} />
            <StatCard title={t("전체 지원자", "All applicants", "全部申请者", "Tất cả ứng viên", "全応募者", "Semua pelamar")} count={applicants.length} href={partnerRoutes.applicants} />
            <StatCard title={t("신규 지원자", "New applicants", "新申请者", "Ứng viên mới", "新規応募者", "Pelamar baru")} count={appliedCount} href={`${partnerRoutes.applicants}?tab=APPLIED`} />
            <StatCard title={t("면접 진행", "Interviewing", "面试中", "Phỏng vấn", "面接中", "Wawancara")} count={interviewCount} href={`${partnerRoutes.applicants}?tab=INTERVIEW`} />
          </div>
        </section>

        {/* 회사 — 회사 프로필(탤런트 '내 커리어'와 동일 위치) */}
        <section>
          <SectionHeader title={t("회사", "Company", "公司", "Công ty", "会社", "Perusahaan")} />
          <Link href={partnerRoutes.company} className="flex items-center gap-3.5 rounded-2xl border border-[#EEF1F5] bg-white p-5 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
            {org?.companyLogoImageData ? (
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-[#EEF1F5] bg-[#F2F4F6]">
                <Image src={org.companyLogoImageData} alt="" fill sizes="44px" className="object-cover" unoptimized />
              </span>
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[#0B46E8]"><Buildings className="h-5 w-5" weight="fill" /></span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14.5px] font-bold text-[#191F28]">{org?.name || t("회사 프로필", "Company profile", "公司资料", "Hồ sơ công ty", "会社プロフィール", "Profil perusahaan")}</p>
              <p className="mt-0.5 text-[12.5px] text-[#8B95A1]">{t("지원자에게 보이는 우리 회사 정보를 관리해요.", "Manage the company info applicants see.", "管理申请者可见的公司信息。", "Quản lý thông tin công ty mà ứng viên thấy.", "応募者に表示される会社情報を管理します。", "Kelola info perusahaan yang dilihat pelamar.")}</p>
            </div>
            <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
          </Link>
        </section>

        {/* 회사 팀원 */}
        <section>
          <SectionHeader title={t("회사 팀원", "Team members", "公司团队", "Thành viên công ty", "会社メンバー", "Anggota tim")} />
          <TCard className="divide-y divide-[#F2F4F6]">
            {members.length === 0 ? (
              <p className="px-5 py-4 text-[13px] text-[#8B95A1]">{t("소속된 팀원 정보를 불러오는 중이에요.", "Loading team members.", "正在加载团队成员信息。", "Đang tải thành viên.", "メンバー情報を読み込み中です。", "Memuat anggota tim.")}</p>
            ) : (
              members.map((m) => {
                const rCls = ORG_ROLE_CLS[m.role];
                const manageable = canManage && !m.isMe && m.role !== "OWNER";
                return (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[15px] font-black text-[#0B46E8]">{m.name.slice(0, 1)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-[14.5px] font-bold text-[#191F28]">{m.name}</p>
                        {m.isMe ? <span className="shrink-0 rounded-md bg-[#F2F4F6] px-2.5 py-0.5 text-[10.5px] font-bold text-[#4E5968]">{t("나", "Me", "我", "Tôi", "自分", "Saya")}</span> : null}
                        {!m.emailVerified ? <span className="shrink-0 rounded-md bg-[#FFF3E6] px-2.5 py-0.5 text-[10.5px] font-bold text-[#E8890C]">{t("인증 안됨", "Unverified", "未验证", "Chưa xác minh", "未認証", "Belum diverifikasi")}</span> : null}
                      </div>
                      <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{m.email}</p>
                    </div>
                    {manageable ? (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <div className="flex items-center gap-0.5 rounded-full bg-[#F2F4F6] p-0.5">
                          {(["MEMBER", "ADMIN"] as const).map((role) => (
                            <button key={role} type="button" disabled={memberBusy === m.id} onClick={() => m.role !== role && changeRole(m.id, role)} className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-50 ${m.role === role ? "bg-white text-[#191F28] shadow-[0_1px_3px_rgba(11,18,39,0.1)]" : "text-[#8B95A1]"}`}>
                              {orgRoleLabel(t, role)}
                            </button>
                          ))}
                        </div>
                        <button type="button" disabled={memberBusy === m.id} onClick={() => removeMember(m.id, m.name)} className="rounded-lg px-2 py-1.5 text-[11.5px] font-bold text-[#F04452] transition hover:bg-[#FDECEE] disabled:opacity-50">{t("내보내기", "Remove", "移除", "Xóa", "削除", "Keluarkan")}</button>
                      </div>
                    ) : (
                      <span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-bold ${rCls}`}>{orgRoleLabel(t, m.role)}</span>
                    )}
                  </div>
                );
              })
            )}
          </TCard>

          {canManage ? (
            <>
              {/* 이메일로 팀원 초대 */}
              <div className="mt-3 rounded-2xl border border-[#EEF1F5] bg-white p-4">
                <div className="flex items-center gap-1.5">
                  <EnvelopeSimple className="h-4 w-4 text-[#0B46E8]" weight="fill" />
                  <p className="text-[13.5px] font-bold text-[#191F28]">{t("이메일로 팀원 초대", "Invite by email", "邮件邀请成员", "Mời qua email", "メールで招待", "Undang via email")}</p>
                </div>
                <p className="mt-0.5 text-[12px] text-[#8B95A1]">{t("초대 메일의 링크에서 이메일을 확인하면 자동으로 우리 회사에 합류해요.", "They join automatically after confirming the link in the invite email.", "对方在邀请邮件链接中确认邮箱后会自动加入公司。", "Họ tự động tham gia sau khi xác nhận liên kết trong email mời.", "招待メールのリンクでメールを確認すると自動的に会社に参加します。", "Mereka bergabung otomatis setelah mengonfirmasi tautan di email undangan.")}</p>
                <div className="mt-3 flex flex-col gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") sendInvite(); }}
                    placeholder={t("초대할 이메일 주소", "Email to invite", "邀请的邮箱地址", "Email cần mời", "招待するメールアドレス", "Email untuk diundang")}
                    className="w-full rounded-xl bg-[#F5F6F8] px-3.5 py-2.5 text-[14px] text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:ring-2 focus:ring-[#0B46E8]/30"
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 rounded-full bg-[#F2F4F6] p-0.5">
                      {(["MEMBER", "ADMIN"] as const).map((role) => (
                        <button key={role} type="button" onClick={() => setInviteRole(role)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${inviteRole === role ? "bg-white text-[#191F28] shadow-[0_1px_3px_rgba(11,18,39,0.1)]" : "text-[#8B95A1]"}`}>
                          {orgRoleLabel(t, role)}
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={sendInvite} disabled={sendingInvite || !inviteEmail.trim()} className="ml-auto shrink-0 rounded-xl bg-[#0B46E8] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">
                      {sendingInvite ? t("보내는 중…", "Sending…", "发送中…", "Đang gửi…", "送信中…", "Mengirim…") : t("초대 보내기", "Send invite", "发送邀请", "Gửi lời mời", "招待を送る", "Kirim undangan")}
                    </button>
                  </div>
                </div>
              </div>

              {/* 대기 중 초대 */}
              {invites.length ? (
                <TCard className="mt-3 divide-y divide-[#F2F4F6]">
                  {invites.map((inv) => (
                    <div key={inv.id} className="flex items-center gap-3 px-5 py-3.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F2F4F6] text-[#8B95A1]"><EnvelopeSimple className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-bold text-[#191F28]">{inv.email}</p>
                        <p className="mt-0.5 text-[12px] text-[#8B95A1]">{inv.expired ? t("만료됨", "Expired", "已过期", "Hết hạn", "期限切れ", "Kedaluwarsa") : t("초대 대기 중", "Pending", "待接受", "Đang chờ", "招待待ち", "Menunggu")} · {orgRoleLabel(t, inv.partnerOrgRole)}</p>
                      </div>
                      <button type="button" onClick={() => revokeInvite(inv.id)} aria-label={t("초대 취소", "Cancel invite", "取消邀请", "Hủy lời mời", "招待取消", "Batal undang")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#8B95A1] transition hover:bg-[#FDECEE] hover:text-[#F04452]"><X className="h-4 w-4" weight="bold" /></button>
                    </div>
                  ))}
                </TCard>
              ) : null}

              {/* 또는 초대 코드 (보조) */}
              <div className="mt-3">
                {inviteCode ? (
                  <>
                    <div className="flex items-center gap-3 rounded-2xl border border-[#E4EDFB] bg-[#F5F8FF] px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-[#8B95A1]">{t("초대 코드", "Invite code", "邀请码", "Mã mời", "招待コード", "Kode undangan")}</p>
                        <p className="truncate text-[16px] font-black tracking-[0.04em] text-[#0B1227]">{inviteCode}</p>
                      </div>
                      <button type="button" onClick={copyInvite} className="shrink-0 rounded-lg bg-white px-3 py-2 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#EDF1FD]">{t("복사", "Copy", "复制", "Sao chép", "コピー", "Salin")}</button>
                    </div>
                    <p className="mt-1.5 text-[12px] text-[#8B95A1]">{t("가입 후 코드를 입력하면 합류해요. 이메일 초대가 더 간편해요.", "They join by entering the code after signing up. Email invites are easier.", "注册后输入邀请码即可加入。邮件邀请更方便。", "Họ tham gia bằng cách nhập mã sau khi đăng ký. Mời qua email tiện hơn.", "登録後にコードを入力すると参加できます。メール招待がより簡単です。", "Mereka bergabung dengan memasukkan kode setelah mendaftar. Undangan email lebih mudah.")}</p>
                  </>
                ) : (
                  <button type="button" onClick={makeInvite} disabled={inviting} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#EEF1F5] bg-white py-3 text-[13px] font-bold text-[#8B95A1] transition hover:bg-[#F6F8FB] disabled:opacity-50">
                    <UserPlus className="h-4 w-4" weight="bold" /> {inviting ? t("생성 중…", "Creating…", "生成中…", "Đang tạo…", "生成中…", "Membuat…") : t("또는 초대 코드로 공유", "Or share an invite code", "或用邀请码分享", "Hoặc chia sẻ mã mời", "または招待コードで共有", "Atau bagikan kode undangan")}
                  </button>
                )}
              </div>
            </>
          ) : null}
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
          <SectionHeader title={t("알림", "Notification", "通知", "Thông báo", "通知", "Notifikasi")} />
          <Link href={partnerRoutes.notifications} className="flex items-center justify-center gap-1 rounded-2xl border border-[#EEF1F5] bg-white py-3.5 text-[14px] font-bold text-[#0B46E8] transition hover:bg-[#F6F8FB]">
            {t("알림함 열기", "Open notifications", "打开通知箱", "Mở hộp thông báo", "通知を開く", "Buka notifikasi")} <CaretRight className="h-4 w-4" weight="bold" />
          </Link>
        </section>

        {/* 계정 */}
        <section>
          <SectionHeader title={t("계정", "Account", "账户", "Tài khoản", "アカウント", "Akun")} />
          <TCard className="divide-y divide-[#F2F4F6]">
            <Item label={t("계정 정보 관리", "Manage account", "管理账户信息", "Quản lý tài khoản", "アカウント管理", "Kelola akun")} href={getAccountUrl()} />
            <a href="mailto:info@flip-ers.com" className="block transition hover:bg-[#F6F8FB]">
              <div className="flex items-center gap-3 px-5 py-4">
                <span className="flex-1 text-[14.5px] text-[#191F28]">{t("고객센터 · 문의", "Support · Contact", "客服 · 咨询", "Hỗ trợ · Liên hệ", "サポート · お問い合わせ", "Dukungan · Kontak")}</span>
                <CaretRight className="h-4 w-4 text-[#C4CAD2]" />
              </div>
            </a>
            <Item label={t("개인정보처리방침", "Privacy Policy", "隐私政策", "Chính sách bảo mật", "プライバシーポリシー", "Kebijakan privasi")} href="/legal/privacy" />
            <Item label={t("이용약관", "Terms of Service", "服务条款", "Điều khoản dịch vụ", "利用規約", "Ketentuan layanan")} href="/legal/terms" />
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
    </PartnerAppShell>
  );
}
