"use client";

// 파트너 내 프로필 — 탤런트 설정과 동일한 결의 프로필 허브.
// 기본 정보(히어로) + 채용 현황(스탯) + 회사 + 알림 + 계정 + 로그아웃.
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CaretRight, SealCheck, SignOut, PencilSimple, Buildings, UserPlus } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { useAuthSession } from "../../auth/AuthSessionProvider";
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
  type MyPartnerOrganization,
  type PartnerPosition,
  type PartnerApplicantListItem,
  type PartnerOrgMember
} from "../../../lib/member-profile-client";

const ORG_ROLE_LABEL: Record<PartnerOrgMember["role"], { label: string; cls: string }> = {
  OWNER: { label: "소유자", cls: "bg-[#EDF1FD] text-[#0B46E8]" },
  ADMIN: { label: "관리자", cls: "bg-[#E7F8EF] text-[#0A9B59]" },
  MEMBER: { label: "멤버", cls: "bg-[#F2F4F6] text-[#8B95A1]" }
};

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-[#0B46E8]" : "bg-[#D7DCE3]"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
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

export function PartnerSettingsScreen() {
  const { user, logout, getAccountUrl } = useAuthSession();
  const toast = useTalentPopup();
  const [pushOn, setPushOn] = useState(true);
  const [emailOn, setEmailOn] = useState(true);
  const [org, setOrg] = useState<MyPartnerOrganization | null>(null);
  const [positions, setPositions] = useState<PartnerPosition[]>([]);
  const [applicants, setApplicants] = useState<PartnerApplicantListItem[]>([]);
  const [members, setMembers] = useState<PartnerOrgMember[]>([]);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [memberBusy, setMemberBusy] = useState<string | null>(null); // 작업 중인 멤버 id

  const name = user?.realName || user?.name || "파트너";
  const emailVerified = Boolean(user?.emailVerified);

  function reloadMembers() {
    void getMyPartnerOrganizationMembers().then(setMembers).catch(() => {});
  }
  useEffect(() => {
    void getMyPartnerOrganization().then(setOrg).catch(() => {});
    void getMyPartnerPositions().then(setPositions).catch(() => {});
    void getMyPartnerApplicants().then(setApplicants).catch(() => {});
    reloadMembers();
  }, []);

  const myRole = members.find((m) => m.isMe)?.role;
  const canManage = myRole === "OWNER" || myRole === "ADMIN";

  function changeRole(userId: string, role: "ADMIN" | "MEMBER") {
    if (memberBusy) return;
    setMemberBusy(userId);
    updatePartnerOrgMemberRole(userId, role)
      .then(() => {
        toast.success("역할을 변경했어요");
        reloadMembers();
      })
      .catch(() => toast.error("역할 변경에 실패했어요."))
      .finally(() => setMemberBusy(null));
  }
  function removeMember(userId: string, memberName: string) {
    if (memberBusy) return;
    if (!window.confirm(`${memberName} 님을 회사에서 내보낼까요?`)) return;
    setMemberBusy(userId);
    removePartnerOrgMember(userId)
      .then(() => {
        toast.success("팀원을 내보냈어요");
        reloadMembers();
      })
      .catch(() => toast.error("내보내기에 실패했어요."))
      .finally(() => setMemberBusy(null));
  }

  function makeInvite() {
    if (inviting) return;
    setInviting(true);
    createMyPartnerOrganizationJoinCode()
      .then((r) => setInviteCode(r.code))
      .catch(() => toast.error("초대 코드 생성에 실패했어요."))
      .finally(() => setInviting(false));
  }
  function copyInvite() {
    if (!inviteCode) return;
    void navigator.clipboard?.writeText(inviteCode).then(() => toast.success("초대 코드를 복사했어요")).catch(() => {});
  }

  const openCount = positions.filter((p) => p.status === "OPEN").length;
  const appliedCount = applicants.filter((a) => a.status === "APPLIED").length;
  const interviewCount = applicants.filter((a) => a.status === "INTERVIEW").length;

  return (
    <PartnerAppShell>
      <div className="flex flex-col gap-12">
        {/* 기본 정보 */}
        <section>
          <SectionHeader title="기본 정보" />
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
                    <SealCheck className="h-[18px] w-[18px] shrink-0 text-[#0B46E8]" weight="fill" aria-label="이메일 인증됨" />
                  ) : (
                    <span className="shrink-0 rounded-md bg-[#FFF3E6] px-1.5 py-0.5 text-[10.5px] font-bold text-[#E8890C]">인증 안됨</span>
                  )}
                </div>
                {user?.email ? <p className="mt-0.5 truncate text-[13px] text-[#8B95A1]">{user.email}</p> : null}
              </div>
              <Link
                href={partnerRoutes.profile}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3.5 py-2.5 text-[13px] font-bold text-[#4E5968] shadow-[0_2px_10px_rgba(11,18,39,0.06)] transition hover:text-[#0B46E8]"
              >
                <PencilSimple className="h-4 w-4" /> 프로필 편집
              </Link>
            </div>
          </div>
        </section>

        {/* 채용 현황 — 프로필 카드 바로 아래(탤런트 '내 활동'과 동일 위치) */}
        <section>
          <SectionHeader title="채용 현황" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard title="게시 중 공고" count={openCount} href={partnerRoutes.positions} />
            <StatCard title="전체 지원자" count={applicants.length} href={partnerRoutes.applicants} />
            <StatCard title="신규 지원자" count={appliedCount} href={`${partnerRoutes.applicants}?tab=APPLIED`} />
            <StatCard title="면접 진행" count={interviewCount} href={`${partnerRoutes.applicants}?tab=INTERVIEW`} />
          </div>
        </section>

        {/* 회사 — 회사 프로필(탤런트 '내 커리어'와 동일 위치) */}
        <section>
          <SectionHeader title="회사" />
          <Link href={partnerRoutes.company} className="flex items-center gap-3.5 rounded-2xl border border-[#EEF1F5] bg-white p-5 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
            {org?.companyLogoImageData ? (
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-[#EEF1F5] bg-[#F2F4F6]">
                <Image src={org.companyLogoImageData} alt="" fill sizes="44px" className="object-cover" unoptimized />
              </span>
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[#0B46E8]"><Buildings className="h-5 w-5" weight="fill" /></span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14.5px] font-bold text-[#191F28]">{org?.name || "회사 프로필"}</p>
              <p className="mt-0.5 text-[12.5px] text-[#8B95A1]">지원자에게 보이는 우리 회사 정보를 관리해요.</p>
            </div>
            <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
          </Link>
        </section>

        {/* 회사 팀원 */}
        <section>
          <SectionHeader title="회사 팀원" />
          <TCard className="divide-y divide-[#F2F4F6]">
            {members.length === 0 ? (
              <p className="px-5 py-4 text-[13px] text-[#8B95A1]">소속된 팀원 정보를 불러오는 중이에요.</p>
            ) : (
              members.map((m) => {
                const r = ORG_ROLE_LABEL[m.role];
                const manageable = canManage && !m.isMe && m.role !== "OWNER";
                return (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[15px] font-black text-[#0B46E8]">{m.name.slice(0, 1)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-[14.5px] font-bold text-[#191F28]">{m.name}</p>
                        {m.isMe ? <span className="shrink-0 rounded-md bg-[#F2F4F6] px-1.5 py-0.5 text-[10.5px] font-bold text-[#4E5968]">나</span> : null}
                        {!m.emailVerified ? <span className="shrink-0 rounded-md bg-[#FFF3E6] px-1.5 py-0.5 text-[10.5px] font-bold text-[#E8890C]">인증 안됨</span> : null}
                      </div>
                      <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{m.email}</p>
                    </div>
                    {manageable ? (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <div className="flex items-center gap-0.5 rounded-full bg-[#F2F4F6] p-0.5">
                          {(["MEMBER", "ADMIN"] as const).map((role) => (
                            <button key={role} type="button" disabled={memberBusy === m.id} onClick={() => m.role !== role && changeRole(m.id, role)} className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-50 ${m.role === role ? "bg-white text-[#191F28] shadow-[0_1px_3px_rgba(11,18,39,0.1)]" : "text-[#8B95A1]"}`}>
                              {ORG_ROLE_LABEL[role].label}
                            </button>
                          ))}
                        </div>
                        <button type="button" disabled={memberBusy === m.id} onClick={() => removeMember(m.id, m.name)} className="rounded-lg px-2 py-1.5 text-[11.5px] font-bold text-[#F04452] transition hover:bg-[#FDECEE] disabled:opacity-50">내보내기</button>
                      </div>
                    ) : (
                      <span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-bold ${r.cls}`}>{r.label}</span>
                    )}
                  </div>
                );
              })
            )}
          </TCard>

          {/* 팀원 초대 */}
          <div className="mt-3">
            {inviteCode ? (
              <>
                <div className="flex items-center gap-3 rounded-2xl border border-[#E4EDFB] bg-[#F5F8FF] px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-[#8B95A1]">초대 코드</p>
                    <p className="truncate text-[16px] font-black tracking-[0.04em] text-[#0B1227]">{inviteCode}</p>
                  </div>
                  <button type="button" onClick={copyInvite} className="shrink-0 rounded-lg bg-white px-3 py-2 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#EDF1FD]">복사</button>
                </div>
                <p className="mt-1.5 text-[12px] text-[#8B95A1]">이 코드를 팀원에게 공유하세요. 가입 후 코드를 입력하면 우리 회사로 합류해요.</p>
              </>
            ) : (
              <button type="button" onClick={makeInvite} disabled={inviting} className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[#EEF1F5] bg-white py-3.5 text-[14px] font-bold text-[#0B46E8] transition hover:bg-[#F6F8FB] disabled:opacity-50">
                <UserPlus className="h-4 w-4" weight="bold" /> {inviting ? "생성 중…" : "팀원 초대 코드 만들기"}
              </button>
            )}
          </div>
        </section>

        {/* 알림 */}
        <section>
          <SectionHeader title="알림" />
          <TCard className="divide-y divide-[#F2F4F6]">
            <div className="flex items-center gap-3 px-5 py-4">
              <span className="flex-1 text-[14.5px] text-[#191F28]">지원자 알림</span>
              <Toggle on={pushOn} onChange={setPushOn} label="지원자 알림" />
            </div>
            <div className="flex items-center gap-3 px-5 py-4">
              <span className="flex-1 text-[14.5px] text-[#191F28]">이메일 소식 받기</span>
              <Toggle on={emailOn} onChange={setEmailOn} label="이메일 소식 받기" />
            </div>
          </TCard>
          <Link href={partnerRoutes.notifications} className="mt-3 flex items-center justify-center gap-1 rounded-2xl border border-[#EEF1F5] bg-white py-3.5 text-[14px] font-bold text-[#0B46E8] transition hover:bg-[#F6F8FB]">
            알림함 열기 <CaretRight className="h-4 w-4" weight="bold" />
          </Link>
        </section>

        {/* 계정 */}
        <section>
          <SectionHeader title="계정" />
          <TCard className="divide-y divide-[#F2F4F6]">
            <Item label="계정 정보 관리" href={getAccountUrl()} external />
            <Item label="개인정보처리방침" href="/legal/privacy" />
            <Item label="이용약관" href="/legal/terms" />
          </TCard>
        </section>

        <button
          type="button"
          onClick={() => void logout()}
          className="mt-2 flex items-center justify-center gap-2 rounded-2xl border border-[#EEF1F5] bg-white py-4 text-[14px] font-semibold text-[#F04452] transition hover:bg-[#FFF5F5]"
        >
          <SignOut className="h-[18px] w-[18px]" /> 로그아웃
        </button>
      </div>
    </PartnerAppShell>
  );
}
