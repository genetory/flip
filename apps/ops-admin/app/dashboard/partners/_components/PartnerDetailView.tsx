"use client";

import { Trash } from "@phosphor-icons/react";
import { ReactNode, useEffect, useState } from "react";
import { OpsBadge, toneFromEmailVerified, toneFromPartnerOrgRole } from "./OpsBadge";

type PartnerDetailTab = "basic" | "members" | "jobs" | "memo";

type PartnerDetailViewProps = {
  partnerId?: string;
  name: string;
  domain: string;
  partnerTypeLabel: string;
  partnerType?: "UNIVERSITY" | "COMPANY" | "AGENCY";
  companySizeLabel?: string;
  companySize?: "SIZE_1_10" | "SIZE_UNDER_30" | "SIZE_UNDER_50" | "SIZE_OVER_100" | null;
  industryLabel: string;
  industry?: string;
  createdAtLabel: string;
  memberCount?: number | null;
  officeAddress?: string | null;
  website?: string | null;
  socialMedia?: string | null;
  description?: string | null;
  strengths?: string | null;
  adminMemo?: string | null;
  basicContent?: ReactNode;
  memoContent?: ReactNode;
  membersRefreshKey?: number;
  tab?: PartnerDetailTab;
  onTabChange?: (tab: PartnerDetailTab) => void;
  enableManagementActions?: boolean;
};

type PartnerMember = {
  id: string;
  name: string | null;
  email: string;
  partnerOrgRole: "OWNER" | "ADMIN" | "MEMBER" | null;
  emailVerified: boolean;
  createdAt: string;
};

type PartnerPosition = {
  id: string;
  title: string;
  status: "DRAFT" | "OPEN" | "MATCHING" | "CLOSED";
  preferredJobRole: string | null;
  hiringCount: number | null;
  createdAt: string;
};

type PartnerOrgRole = "OWNER" | "ADMIN" | "MEMBER";

type PartnerMetaPayload = {
  ok?: boolean;
  partnerTypes?: Array<"UNIVERSITY" | "COMPANY" | "AGENCY">;
  partnerCompanySizes?: Array<"SIZE_1_10" | "SIZE_UNDER_30" | "SIZE_UNDER_50" | "SIZE_OVER_100">;
  partnerIndustries?: string[];
};

const TOKEN_COOKIE_KEY = "ops_admin_token";

function readCookie(key: string) {
  if (typeof document === "undefined") return "";
  const entry = document.cookie.split("; ").find((item) => item.startsWith(`${key}=`));
  return entry ? decodeURIComponent(entry.split("=")[1] ?? "") : "";
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ko-KR");
}

function toExternalHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function partnerOrgRoleLabel(role: PartnerMember["partnerOrgRole"]) {
  if (role === "OWNER") return "소유자";
  if (role === "ADMIN") return "관리자";
  if (role === "MEMBER") return "멤버";
  return "-";
}

function positionStatusLabel(status: PartnerPosition["status"]) {
  if (status === "DRAFT") return "임시저장";
  if (status === "OPEN") return "공개";
  if (status === "MATCHING") return "매칭 진행";
  return "마감";
}

function positionStatusTone(status: PartnerPosition["status"]) {
  if (status === "DRAFT") return "status-pending" as const;
  if (status === "OPEN") return "status-approved" as const;
  if (status === "MATCHING") return "role-admin" as const;
  return "status-rejected" as const;
}

function companySizeToLabel(size: "SIZE_1_10" | "SIZE_UNDER_30" | "SIZE_UNDER_50" | "SIZE_OVER_100" | null) {
  if (size === "SIZE_1_10") return "1~10인";
  if (size === "SIZE_UNDER_30") return "30인 이하";
  if (size === "SIZE_UNDER_50") return "50인 이하";
  if (size === "SIZE_OVER_100") return "100인 이상";
  return "-";
}

export function PartnerDetailView({
  partnerId,
  name,
  domain,
  partnerTypeLabel,
  partnerType,
  companySizeLabel,
  companySize,
  industryLabel,
  industry,
  createdAtLabel,
  memberCount,
  officeAddress,
  website,
  socialMedia,
  description,
  strengths,
  adminMemo,
  basicContent,
  memoContent,
  membersRefreshKey = 0,
  tab: controlledTab,
  onTabChange,
  enableManagementActions = false
}: PartnerDetailViewProps) {
  const [uncontrolledTab, setUncontrolledTab] = useState<PartnerDetailTab>("basic");
  const [members, setMembers] = useState<PartnerMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersLoadedKey, setMembersLoadedKey] = useState<string | null>(null);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [positions, setPositions] = useState<PartnerPosition[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsError, setPositionsError] = useState<string | null>(null);
  const [isBasicEditMode, setIsBasicEditMode] = useState(false);
  const [isMemoEditMode, setIsMemoEditMode] = useState(false);
  const [savingBasic, setSavingBasic] = useState(false);
  const [savingMemo, setSavingMemo] = useState(false);
  const [addMemberSubmitting, setAddMemberSubmitting] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [draftName, setDraftName] = useState(name);
  const [draftDomain, setDraftDomain] = useState(domain);
  const [draftPartnerType, setDraftPartnerType] = useState<"UNIVERSITY" | "COMPANY" | "AGENCY">(
    partnerType ?? "COMPANY"
  );
  const [draftCompanySize, setDraftCompanySize] = useState<
    "SIZE_1_10" | "SIZE_UNDER_30" | "SIZE_UNDER_50" | "SIZE_OVER_100" | null
  >(companySize ?? null);
  const [draftIndustry, setDraftIndustry] = useState(industry ?? industryLabel);
  const [draftOfficeAddress, setDraftOfficeAddress] = useState(officeAddress ?? "");
  const [draftWebsite, setDraftWebsite] = useState(website ?? "");
  const [draftSocialMedia, setDraftSocialMedia] = useState(socialMedia ?? "");
  const [draftDescription, setDraftDescription] = useState(description ?? "");
  const [draftStrengths, setDraftStrengths] = useState(strengths ?? "");
  const [draftAdminMemo, setDraftAdminMemo] = useState(adminMemo ?? "");
  const [displayName, setDisplayName] = useState(name);
  const [displayDomain, setDisplayDomain] = useState(domain);
  const [displayPartnerTypeLabel, setDisplayPartnerTypeLabel] = useState(partnerTypeLabel);
  const [displayCompanySizeLabel, setDisplayCompanySizeLabel] = useState(companySizeLabel ?? "-");
  const [displayIndustryLabel, setDisplayIndustryLabel] = useState(industryLabel);
  const [displayOfficeAddress, setDisplayOfficeAddress] = useState(officeAddress ?? null);
  const [displayWebsite, setDisplayWebsite] = useState(website ?? null);
  const [displaySocialMedia, setDisplaySocialMedia] = useState(socialMedia ?? null);
  const [displayDescription, setDisplayDescription] = useState(description ?? null);
  const [displayStrengths, setDisplayStrengths] = useState(strengths ?? null);
  const [displayAdminMemo, setDisplayAdminMemo] = useState(adminMemo ?? null);
  const [memberRole, setMemberRole] = useState<PartnerOrgRole>("MEMBER");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberPassword, setMemberPassword] = useState("");
  const [partnerTypes, setPartnerTypes] = useState<Array<"UNIVERSITY" | "COMPANY" | "AGENCY">>(["COMPANY"]);
  const [partnerCompanySizes, setPartnerCompanySizes] = useState<
    Array<"SIZE_1_10" | "SIZE_UNDER_30" | "SIZE_UNDER_50" | "SIZE_OVER_100">
  >([]);
  const [partnerIndustries, setPartnerIndustries] = useState<string[]>([]);
  const tab = controlledTab ?? uncontrolledTab;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  function handleTabChange(next: PartnerDetailTab) {
    if (!controlledTab) setUncontrolledTab(next);
    onTabChange?.(next);
  }

  useEffect(() => {
    setDraftName(name);
    setDraftDomain(domain);
    setDraftPartnerType(partnerType ?? "COMPANY");
    setDraftCompanySize(companySize ?? null);
    setDraftIndustry(industry ?? industryLabel);
    setDraftOfficeAddress(officeAddress ?? "");
    setDraftWebsite(website ?? "");
    setDraftSocialMedia(socialMedia ?? "");
    setDraftDescription(description ?? "");
    setDraftStrengths(strengths ?? "");
    setDraftAdminMemo(adminMemo ?? "");
    setDisplayName(name);
    setDisplayDomain(domain);
    setDisplayPartnerTypeLabel(partnerTypeLabel);
    setDisplayCompanySizeLabel(companySizeLabel ?? "-");
    setDisplayIndustryLabel(industryLabel);
    setDisplayOfficeAddress(officeAddress ?? null);
    setDisplayWebsite(website ?? null);
    setDisplaySocialMedia(socialMedia ?? null);
    setDisplayDescription(description ?? null);
    setDisplayStrengths(strengths ?? null);
    setDisplayAdminMemo(adminMemo ?? null);
    setIsBasicEditMode(false);
    setIsMemoEditMode(false);
  }, [
    name,
    domain,
    partnerType,
    companySize,
    industry,
    industryLabel,
    partnerTypeLabel,
    companySizeLabel,
    officeAddress,
    website,
    socialMedia,
    description,
    strengths,
    adminMemo
  ]);

  useEffect(() => {
    if (!enableManagementActions || !partnerId) return;
    let mounted = true;
    const run = async () => {
      try {
        const token = readCookie(TOKEN_COOKIE_KEY);
        const response = await fetch(`${apiBaseUrl}/ops/partners/meta`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const payload = (await response.json()) as PartnerMetaPayload;
        if (!mounted || !response.ok || !payload.ok) return;
        if (payload.partnerTypes?.length) setPartnerTypes(payload.partnerTypes);
        if (payload.partnerCompanySizes?.length) setPartnerCompanySizes(payload.partnerCompanySizes);
        if (payload.partnerIndustries?.length) setPartnerIndustries(payload.partnerIndustries);
      } catch {
        // ignore and keep fallback values
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [enableManagementActions, partnerId, apiBaseUrl]);

  useEffect(() => {
    if (tab !== "members") return;
    if (!domain) return;
    const loadKey = `${domain}:${membersRefreshKey}`;
    if (membersLoadedKey === loadKey) return;

    let mounted = true;
    const run = async () => {
      setMembersLoading(true);
      setMembersError(null);
      try {
        const token = readCookie(TOKEN_COOKIE_KEY);
        const params = new URLSearchParams();
        params.set("domain", domain);
        params.set("page", "1");
        params.set("pageSize", "20");
        params.set("sortBy", "createdAt");
        params.set("sortOrder", "desc");
        const response = await fetch(`${apiBaseUrl}/ops/partner-users?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const payload = (await response.json()) as { ok?: boolean; items?: PartnerMember[]; message?: string };
        if (!response.ok || !payload.ok) {
          if (!mounted) return;
          setMembersError(payload.message ?? "멤버 목록을 불러오지 못했습니다.");
          return;
        }
        if (!mounted) return;
        setMembers(payload.items ?? []);
        setMembersLoadedKey(loadKey);
      } catch {
        if (!mounted) return;
        setMembersError("멤버 목록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        if (mounted) setMembersLoading(false);
      }
    };
    void run();

    return () => {
      mounted = false;
    };
  }, [tab, domain, membersLoadedKey, membersRefreshKey, apiBaseUrl]);

  useEffect(() => {
    if (tab !== "jobs") return;
    if (!partnerId) return;

    let mounted = true;
    const run = async () => {
      setPositionsLoading(true);
      setPositionsError(null);
      try {
        const token = readCookie(TOKEN_COOKIE_KEY);
        const params = new URLSearchParams();
        params.set("partnerOrganizationId", partnerId);
        params.set("page", "1");
        params.set("pageSize", "20");
        params.set("sortBy", "createdAt");
        params.set("sortOrder", "desc");
        const response = await fetch(`${apiBaseUrl}/ops/positions?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const payload = (await response.json()) as { ok?: boolean; items?: PartnerPosition[]; message?: string };
        if (!response.ok || !payload.ok) {
          if (!mounted) return;
          setPositionsError(payload.message ?? "채용 공고를 불러오지 못했습니다.");
          return;
        }
        if (!mounted) return;
        setPositions(payload.items ?? []);
      } catch {
        if (!mounted) return;
        setPositionsError("채용 공고를 불러오는 중 오류가 발생했습니다.");
      } finally {
        if (mounted) setPositionsLoading(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [tab, partnerId, apiBaseUrl]);

  async function handleRemoveMember(memberId: string, memberName: string | null) {
    if (!partnerId) return;
    const label = memberName?.trim() ? memberName : "해당 멤버";
    const confirmed = window.confirm(`${label}를 멤버 목록에서 삭제할까요?`);
    if (!confirmed) return;
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/partners/${partnerId}/members/${memberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        window.alert(payload.message ?? "멤버 삭제에 실패했습니다.");
        return;
      }
      setMembers((prev) => prev.filter((member) => member.id !== memberId));
    } catch {
      window.alert("멤버 삭제 중 오류가 발생했습니다.");
    }
  }

  async function handleSaveBasic() {
    if (!partnerId) return;
    if (!draftDomain.trim() || !draftName.trim()) {
      window.alert("도메인과 파트너명은 필수입니다.");
      return;
    }
    setSavingBasic(true);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/partners/${partnerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          partnerType: draftPartnerType,
          domain: draftDomain.trim(),
          name: draftName.trim(),
          companySize: draftCompanySize ?? undefined,
          industry: draftIndustry,
          officeAddress: draftOfficeAddress.trim() || undefined,
          website: draftWebsite.trim() || undefined,
          socialMedia: draftSocialMedia.trim() || undefined,
          description: draftDescription.trim() || undefined,
          strengths: draftStrengths.trim() || undefined,
          adminMemo: draftAdminMemo.trim() || undefined
        })
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        item?: {
          partnerType: "UNIVERSITY" | "COMPANY" | "AGENCY";
          domain: string;
          name: string;
          companySize: "SIZE_1_10" | "SIZE_UNDER_30" | "SIZE_UNDER_50" | "SIZE_OVER_100" | null;
          industry: string;
          officeAddress: string | null;
          website: string | null;
          socialMedia: string | null;
          description: string | null;
          strengths: string | null;
          adminMemo: string | null;
        };
        message?: string;
      };
      if (!response.ok || !payload.ok || !payload.item) {
        window.alert(payload.message ?? "기본 정보 저장에 실패했습니다.");
        return;
      }

      setDisplayName(payload.item.name);
      setDisplayDomain(payload.item.domain);
      setDisplayPartnerTypeLabel(payload.item.partnerType);
      setDisplayCompanySizeLabel(companySizeToLabel(payload.item.companySize));
      setDisplayIndustryLabel(payload.item.industry);
      setDisplayOfficeAddress(payload.item.officeAddress);
      setDisplayWebsite(payload.item.website);
      setDisplaySocialMedia(payload.item.socialMedia);
      setDisplayDescription(payload.item.description);
      setDisplayStrengths(payload.item.strengths);
      setDisplayAdminMemo(payload.item.adminMemo);
      setDraftName(payload.item.name);
      setDraftDomain(payload.item.domain);
      setDraftPartnerType(payload.item.partnerType);
      setDraftCompanySize(payload.item.companySize);
      setDraftIndustry(payload.item.industry);
      setDraftOfficeAddress(payload.item.officeAddress ?? "");
      setDraftWebsite(payload.item.website ?? "");
      setDraftSocialMedia(payload.item.socialMedia ?? "");
      setDraftDescription(payload.item.description ?? "");
      setDraftStrengths(payload.item.strengths ?? "");
      setDraftAdminMemo(payload.item.adminMemo ?? "");
      setMembersLoadedKey(null);
      setIsBasicEditMode(false);
      window.alert("기본 정보가 저장되었습니다.");
    } catch {
      window.alert("기본 정보 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingBasic(false);
    }
  }

  async function handleSaveMemo() {
    if (!partnerId) return;
    setSavingMemo(true);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/partners/${partnerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          partnerType: draftPartnerType,
          domain: draftDomain.trim(),
          name: draftName.trim(),
          companySize: draftCompanySize ?? undefined,
          industry: draftIndustry,
          officeAddress: draftOfficeAddress.trim() || undefined,
          website: draftWebsite.trim() || undefined,
          socialMedia: draftSocialMedia.trim() || undefined,
          description: draftDescription.trim() || undefined,
          strengths: draftStrengths.trim() || undefined,
          adminMemo: draftAdminMemo.trim() || undefined
        })
      });
      const payload = (await response.json()) as { ok?: boolean; item?: { adminMemo: string | null }; message?: string };
      if (!response.ok || !payload.ok || !payload.item) {
        window.alert(payload.message ?? "메모 저장에 실패했습니다.");
        return;
      }
      setDisplayAdminMemo(payload.item.adminMemo);
      setDraftAdminMemo(payload.item.adminMemo ?? "");
      setIsMemoEditMode(false);
      window.alert("메모가 저장되었습니다.");
    } catch {
      window.alert("메모 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingMemo(false);
    }
  }

  async function handleAddMember() {
    if (!partnerId) return;
    if (!memberEmail.trim()) {
      setAddMemberError("이메일은 필수입니다.");
      return;
    }
    setAddMemberSubmitting(true);
    setAddMemberError(null);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/partners/${partnerId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email: memberEmail.trim(),
          name: memberName.trim() || undefined,
          partnerOrgRole: memberRole,
          password: memberPassword.trim() || undefined
        })
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string; temporaryPassword?: string };
      if (!response.ok || !payload.ok) {
        setAddMemberError(payload.message ?? "멤버 추가에 실패했습니다.");
        return;
      }
      if (payload.temporaryPassword) {
        window.alert(`임시 비밀번호가 생성되었습니다: ${payload.temporaryPassword}`);
      }
      setMemberEmail("");
      setMemberName("");
      setMemberRole("MEMBER");
      setMemberPassword("");
      setMembersLoadedKey(null);
      handleTabChange("members");
      window.alert("멤버가 추가되었습니다.");
    } catch {
      setAddMemberError("멤버 추가 중 오류가 발생했습니다.");
    } finally {
      setAddMemberSubmitting(false);
    }
  }

  return (
    <div className="ops-detail-tabbed">
      <div className="ops-detail-tabs" role="tablist" aria-label="파트너 상세 탭">
        <button type="button" role="tab" aria-selected={tab === "basic"} className={`ops-detail-tab ${tab === "basic" ? "is-active" : ""}`} onClick={() => handleTabChange("basic")}>
          기본 정보
        </button>
        <button type="button" role="tab" aria-selected={tab === "members"} className={`ops-detail-tab ${tab === "members" ? "is-active" : ""}`} onClick={() => handleTabChange("members")}>
          멤버 관리
        </button>
        <button type="button" role="tab" aria-selected={tab === "jobs"} className={`ops-detail-tab ${tab === "jobs" ? "is-active" : ""}`} onClick={() => handleTabChange("jobs")}>
          채용 공고
        </button>
        <button type="button" role="tab" aria-selected={tab === "memo"} className={`ops-detail-tab ${tab === "memo" ? "is-active" : ""}`} onClick={() => handleTabChange("memo")}>
          관리자 메모
        </button>
      </div>

      <div className="ops-detail-tab-panel">
        {tab === "basic" ? (
          basicContent ?? (
            <div className="ops-detail-sections">
              <section className="ops-detail-section">
                <h3>기본 정보</h3>
                {enableManagementActions && isBasicEditMode ? (
                  <form className="ops-partner-form ops-detail-edit-form" onSubmit={(e) => e.preventDefault()}>
                    <label>
                      파트너 유형
                      <select value={draftPartnerType} onChange={(e) => setDraftPartnerType(e.target.value as "UNIVERSITY" | "COMPANY" | "AGENCY")}>
                        {partnerTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="ops-partner-form-two-cols">
                      <label>
                        <span className="ops-label-required">(파트너 이메일) 도메인 <span className="ops-required">*</span></span>
                        <input value={draftDomain} onChange={(e) => setDraftDomain(e.target.value)} />
                      </label>
                      <label>
                        <span className="ops-label-required">파트너명 <span className="ops-required">*</span></span>
                        <input value={draftName} onChange={(e) => setDraftName(e.target.value)} />
                      </label>
                    </div>

                    <label>
                      파트너 규모
                      <select
                        value={draftCompanySize ?? ""}
                        onChange={(e) =>
                          setDraftCompanySize(
                            (e.target.value || null) as
                              | "SIZE_1_10"
                              | "SIZE_UNDER_30"
                              | "SIZE_UNDER_50"
                              | "SIZE_OVER_100"
                              | null
                          )
                        }
                      >
                        <option value="">선택 안함</option>
                        {partnerCompanySizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      산업 분야
                      <select value={draftIndustry} onChange={(e) => setDraftIndustry(e.target.value)}>
                        {(partnerIndustries.length ? partnerIndustries : [draftIndustry]).map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      사무실 주소
                      <input value={draftOfficeAddress} onChange={(e) => setDraftOfficeAddress(e.target.value)} />
                    </label>

                    <div className="ops-partner-form-two-cols">
                      <label>
                        웹사이트
                        <input value={draftWebsite} onChange={(e) => setDraftWebsite(e.target.value)} />
                      </label>
                      <label>
                        소셜 미디어
                        <input value={draftSocialMedia} onChange={(e) => setDraftSocialMedia(e.target.value)} />
                      </label>
                    </div>

                    <label>
                      파트너 소개
                      <textarea value={draftDescription} rows={4} onChange={(e) => setDraftDescription(e.target.value)} />
                    </label>
                    <label>
                      자랑거리 / 장점
                      <textarea value={draftStrengths} rows={4} onChange={(e) => setDraftStrengths(e.target.value)} />
                    </label>
                  </form>
                ) : (
                  <div className="ops-detail-grid">
                    <div><span>파트너명</span><strong>{displayName}</strong></div>
                    <div><span>도메인</span><strong>{displayDomain}</strong></div>
                    <div><span>유형</span><strong>{displayPartnerTypeLabel}</strong></div>
                    <div><span>파트너 규모</span><strong>{displayCompanySizeLabel}</strong></div>
                    <div><span>산업</span><strong>{displayIndustryLabel}</strong></div>
                    <div><span>등록일</span><strong>{createdAtLabel}</strong></div>
                    {typeof memberCount === "number" ? <div><span>멤버</span><strong>{memberCount}명</strong></div> : null}
                  </div>
                )}
              </section>

              <section className="ops-detail-section">
                <h3>연락처/링크 정보</h3>
                <div className="ops-detail-grid">
                  <div><span>사무실 주소</span><strong>{displayOfficeAddress || "-"}</strong></div>
                  <div>
                    <span>웹사이트</span>
                    <strong>
                      {displayWebsite ? (
                        <a href={toExternalHref(displayWebsite)} target="_blank" rel="noopener noreferrer">
                          {displayWebsite}
                        </a>
                      ) : (
                        "-"
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>소셜 미디어</span>
                    <strong>
                      {displaySocialMedia ? (
                        <a href={toExternalHref(displaySocialMedia)} target="_blank" rel="noopener noreferrer">
                          {displaySocialMedia}
                        </a>
                      ) : (
                        "-"
                      )}
                    </strong>
                  </div>
                </div>
              </section>

              <section className="ops-detail-section">
                <h3>소개 정보</h3>
                <div className="ops-detail-grid ops-detail-grid-single">
                  <div><span>파트너 소개</span><strong>{displayDescription || "-"}</strong></div>
                  <div><span>자랑거리 / 장점</span><strong>{displayStrengths || "-"}</strong></div>
                </div>
              </section>

              {enableManagementActions ? (
                <section className="ops-detail-section">
                  <div className="ops-detail-actions">
                    {isBasicEditMode ? (
                      <>
                        <button type="button" className="ops-action-cancel" onClick={() => setIsBasicEditMode(false)}>
                          취소
                        </button>
                        <button type="button" className="ops-action-save" onClick={() => void handleSaveBasic()} disabled={savingBasic}>
                          {savingBasic ? "저장 중..." : "저장"}
                        </button>
                      </>
                    ) : (
                      <button type="button" className="ops-action-save" onClick={() => setIsBasicEditMode(true)}>
                        수정
                      </button>
                    )}
                  </div>
                </section>
              ) : null}
            </div>
          )
        ) : tab === "members" ? (
          <section className="ops-detail-section">
            <h3>멤버 관리</h3>
            {enableManagementActions ? (
              <div className="ops-position-inline-form" style={{ marginBottom: 12 }}>
                <input value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} placeholder={`example@${displayDomain || "company.com"}`} />
                <input value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="담당자명(선택)" />
                <select value={memberRole} onChange={(e) => setMemberRole(e.target.value as PartnerOrgRole)}>
                  <option value="OWNER">소유자</option>
                  <option value="ADMIN">관리자</option>
                  <option value="MEMBER">멤버</option>
                </select>
                <input value={memberPassword} onChange={(e) => setMemberPassword(e.target.value)} placeholder="초기 비밀번호(선택)" />
                <button type="button" className="ops-action-save" onClick={() => void handleAddMember()} disabled={addMemberSubmitting}>
                  {addMemberSubmitting ? "추가 중..." : "멤버 추가하기"}
                </button>
              </div>
            ) : null}
            {addMemberError ? <p className="ops-form-error">{addMemberError}</p> : null}
            {membersLoading ? (
              <p className="ops-detail-empty">멤버 목록을 불러오는 중입니다...</p>
            ) : membersError ? (
              <p className="ops-detail-empty">{membersError}</p>
            ) : members.length === 0 ? (
              <p className="ops-detail-empty">등록된 멤버가 없습니다.</p>
            ) : (
              <div className="ops-partner-table-wrap">
                <table className="ops-partner-table ops-partner-users-table ops-partner-members-table">
                  <thead>
                    <tr>
                      <th>담당자명</th>
                      <th>이메일</th>
                      <th>역할</th>
                      <th>상태</th>
                      <th>가입일</th>
                      <th>삭제</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td>{member.name || "-"}</td>
                        <td>{member.email}</td>
                        <td>
                          {member.partnerOrgRole ? (
                            <OpsBadge tone={toneFromPartnerOrgRole(member.partnerOrgRole)}>{partnerOrgRoleLabel(member.partnerOrgRole)}</OpsBadge>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>
                          <OpsBadge tone={toneFromEmailVerified(member.emailVerified)}>{member.emailVerified ? "승인 완료" : "미승인"}</OpsBadge>
                        </td>
                        <td>{formatDate(member.createdAt)}</td>
                        <td>
                          <button
                            type="button"
                            className="ops-icon-danger-button"
                            onClick={() => handleRemoveMember(member.id, member.name)}
                            aria-label="멤버 삭제"
                            title="멤버 삭제"
                          >
                            <Trash size={16} weight="regular" aria-hidden />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : tab === "jobs" ? (
          <section className="ops-detail-section">
            <h3>채용 공고</h3>
            {positionsLoading ? (
              <p className="ops-detail-empty">채용 공고를 불러오는 중입니다...</p>
            ) : positionsError ? (
              <p className="ops-detail-empty">{positionsError}</p>
            ) : positions.length === 0 ? (
              <p className="ops-detail-empty">등록된 채용 공고가 없습니다.</p>
            ) : (
              <div className="ops-partner-table-wrap ops-partner-jobs-table-wrap">
                <table className="ops-partner-table ops-partner-jobs-table">
                  <thead>
                    <tr>
                      <th>제목</th>
                      <th>상태</th>
                      <th>희망 직무</th>
                      <th>희망 인원</th>
                      <th>등록일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((position) => (
                      <tr key={position.id}>
                        <td>{position.title}</td>
                        <td>
                          <OpsBadge tone={positionStatusTone(position.status)}>{positionStatusLabel(position.status)}</OpsBadge>
                        </td>
                        <td>{position.preferredJobRole || "-"}</td>
                        <td>{position.hiringCount ? `${position.hiringCount}명` : "-"}</td>
                        <td>{formatDate(position.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          memoContent ?? (
            <section className="ops-detail-section">
              <h3>관리자 메모</h3>
              {enableManagementActions && isMemoEditMode ? (
                <>
                  <div className="ops-detail-grid ops-detail-grid-single">
                    <label>
                      <span>메모</span>
                      <textarea rows={8} value={draftAdminMemo} onChange={(e) => setDraftAdminMemo(e.target.value)} />
                    </label>
                  </div>
                  <div className="ops-detail-actions">
                    <button type="button" className="ops-action-cancel" onClick={() => setIsMemoEditMode(false)}>
                      취소
                    </button>
                    <button type="button" className="ops-action-save" onClick={() => void handleSaveMemo()} disabled={savingMemo}>
                      {savingMemo ? "저장 중..." : "저장"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="ops-detail-grid ops-detail-grid-single">
                    <div><span>메모</span><strong>{displayAdminMemo || "-"}</strong></div>
                  </div>
                  {enableManagementActions ? (
                    <div className="ops-detail-actions">
                      <button type="button" className="ops-action-save" onClick={() => setIsMemoEditMode(true)}>
                        메모 작성
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </section>
          )
        )}
      </div>
    </div>
  );
}
