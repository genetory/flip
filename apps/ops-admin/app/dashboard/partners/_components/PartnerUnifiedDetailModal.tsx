"use client";

import { X } from "@phosphor-icons/react";
import { FormEvent, MouseEvent, SyntheticEvent, useEffect, useMemo, useRef, useState } from "react";
import { getOpsBadgeClassName } from "./OpsBadge";
import { PartnerDetailView } from "./PartnerDetailView";

const TOKEN_COOKIE_KEY = "ops_admin_token";

type PartnerType = "UNIVERSITY" | "COMPANY" | "AGENCY";
type PartnerCompanySize = "SIZE_1_10" | "SIZE_UNDER_30" | "SIZE_UNDER_50" | "SIZE_OVER_100";
type PartnerDetailTab = "basic" | "members" | "jobs" | "memo";
type PartnerOrgRole = "OWNER" | "ADMIN" | "MEMBER";
type PartnerMetaPayload = {
  ok?: boolean;
  partnerIndustries?: string[];
};

export type PartnerDetailModel = {
  id: string;
  partnerType: PartnerType;
  name: string;
  companySize: PartnerCompanySize | null;
  officeAddress: string | null;
  website: string | null;
  socialMedia: string | null;
  industry: string;
  description: string | null;
  strengths: string | null;
  adminMemo: string | null;
  memberCount?: number;
  createdAt: string;
};

type PartnerUnifiedDetailModalProps = {
  open: boolean;
  partner: PartnerDetailModel | null;
  onClose: () => void;
  onUpdated?: (partner: PartnerDetailModel) => void;
};

const industryLabelMap: Record<string, string> = {
  EDUCATION: "교육 / Education",
  AGRICULTURE: "농업 / Agriculture",
  AGRICULTURAL_PRODUCTS: "농산물 / Agricultural Products",
  PETS: "반려동물 / Pets",
  FITNESS: "피트니스 / Fitness",
  WELLNESS: "웰니스 / Wellness",
  BEAUTY: "뷰티 / Beauty",
  TRAVEL: "여행 / Travel",
  GOLF: "골프 / Golf",
  IT: "IT",
  DEVELOPMENT: "개발 / Development",
  AI: "AI",
  LLM: "LLM",
  DEEP_LEARNING: "딥러닝 / Deep Learning",
  IOT: "IoT",
  IMAGE_PROCESSING: "영상처리 / Image Processing",
  THREE_D: "3D",
  DEVICE: "디바이스 / Device",
  APP_TECH: "앱테크 / App Tech",
  STARTUP: "스타트업 / Startup",
  PLATFORM: "플랫폼 / Platform",
  COMMERCE: "커머스 / Commerce",
  AGENCY: "에이전시 / Agency",
  COMMUNITY: "커뮤니티 / Community",
  GLOBAL: "글로벌 / Global",
  B2B: "B2B",
  SAAS: "SaaS",
  PRODUCTIVITY: "업무생산성 / Productivity",
  CRM: "CRM",
  AUTOMATION: "자동화 / Automation",
  CONSULTING: "컨설팅 / Consulting",
  ADVERTISING: "광고 / Advertising",
  MARKETING: "마케팅 / Marketing",
  CONTENT: "콘텐츠 / Content",
  WEB_NOVEL: "웹소설 / Web Novel",
  K_POP: "K-pop",
  CHARACTER: "캐릭터 / Character",
  AVATAR: "아바타 / Avatar",
  VIRTUAL: "버추얼 / Virtual",
  PUBLIC_DATA: "공공데이터 / Public Data",
  CONSTRUCTION: "건설 / Construction",
  FOREIGNER: "외국인 / Foreigner",
  HR: "HR / Human Resources",
  MENTAL_CARE: "멘탈케어 / Mental Care",
  RENTAL: "렌탈 / Rental"
};

function industryLabel(value: string) {
  return industryLabelMap[value] ?? value;
}

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

function companySizeLabel(size: PartnerCompanySize | null) {
  if (size === "SIZE_1_10") return "1~10인";
  if (size === "SIZE_UNDER_30") return "30인 이하";
  if (size === "SIZE_UNDER_50") return "50인 이하";
  if (size === "SIZE_OVER_100") return "100인 이상";
  return "-";
}

export function PartnerUnifiedDetailModal({ open, partner, onClose, onUpdated }: PartnerUnifiedDetailModalProps) {
  const detailDialogRef = useRef<HTMLDialogElement>(null);
  const addMemberDialogRef = useRef<HTMLDialogElement>(null);
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);

  const [detailDraft, setDetailDraft] = useState<PartnerDetailModel | null>(partner);
  const [isDetailEditMode, setIsDetailEditMode] = useState(false);
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailTab, setDetailTab] = useState<PartnerDetailTab>("basic");
  const [membersRefreshKey, setMembersRefreshKey] = useState(0);

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [addMemberEmail, setAddMemberEmail] = useState("");
  const [addMemberName, setAddMemberName] = useState("");
  const [addMemberRole, setAddMemberRole] = useState<PartnerOrgRole>("MEMBER");
  const [addMemberPassword, setAddMemberPassword] = useState("");
  const [addMemberSubmitting, setAddMemberSubmitting] = useState(false);
  const [addMemberErrorMessage, setAddMemberErrorMessage] = useState<string | null>(null);
  const [partnerIndustries, setPartnerIndustries] = useState<string[]>([]);

  useEffect(() => {
    setDetailDraft(partner);
    setIsDetailEditMode(false);
    setDetailTab("basic");
  }, [partner?.id]);

  useEffect(() => {
    const dialog = detailDialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open || !partner?.id) return;
    let mounted = true;
    const run = async () => {
      try {
        const token = readCookie(TOKEN_COOKIE_KEY);
        const response = await fetch(`${apiBaseUrl}/ops/partners/${partner.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const payload = (await response.json()) as { ok?: boolean; item?: PartnerDetailModel };
        if (!mounted || !response.ok || !payload.ok || !payload.item) return;
        setDetailDraft(payload.item);
      } catch {
        // keep snapshot fallback
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [open, partner?.id, apiBaseUrl]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    const run = async () => {
      try {
        const token = readCookie(TOKEN_COOKIE_KEY);
        const response = await fetch(`${apiBaseUrl}/ops/partners/meta`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const payload = (await response.json()) as PartnerMetaPayload;
        if (!mounted || !response.ok || !payload.ok) return;
        if (payload.partnerIndustries?.length) setPartnerIndustries(payload.partnerIndustries);
      } catch {
        // keep fallback value
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [open, apiBaseUrl]);

  useEffect(() => {
    const dialog = addMemberDialogRef.current;
    if (!dialog) return;
    if (isAddMemberModalOpen) {
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (dialog.open) dialog.close();
  }, [isAddMemberModalOpen]);

  function requestCloseDetailModal() {
    setIsDetailEditMode(false);
    onClose();
  }

  function resetAddMemberForm() {
    setAddMemberEmail("");
    setAddMemberName("");
    setAddMemberRole("MEMBER");
    setAddMemberPassword("");
    setAddMemberErrorMessage(null);
  }

  function requestCloseAddMemberModal() {
    if (addMemberSubmitting) return;
    setIsAddMemberModalOpen(false);
    resetAddMemberForm();
  }

  function handleDialogCancel(event: SyntheticEvent<HTMLDialogElement, Event>, closeHandler: () => void) {
    event.preventDefault();
    closeHandler();
  }

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>, closeHandler: () => void) {
    const dialog = event.currentTarget;
    const rect = dialog.getBoundingClientRect();
    const isInsideDialog =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!isInsideDialog) closeHandler();
  }

  async function saveDetail() {
    if (!detailDraft) return;
    if (!detailDraft.name.trim()) {
      window.alert("파트너명은 필수입니다.");
      return;
    }
    setDetailSaving(true);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/partners/${detailDraft.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          partnerType: detailDraft.partnerType,
          name: detailDraft.name.trim(),
          companySize: detailDraft.companySize || undefined,
          officeAddress: detailDraft.officeAddress?.trim() || undefined,
          website: detailDraft.website?.trim() || undefined,
          socialMedia: detailDraft.socialMedia?.trim() || undefined,
          industry: detailDraft.industry,
          description: detailDraft.description?.trim() || undefined,
          strengths: detailDraft.strengths?.trim() || undefined,
          adminMemo: detailDraft.adminMemo?.trim() || undefined
        })
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string; item?: PartnerDetailModel };
      if (!response.ok || !payload.ok || !payload.item) {
        window.alert(payload.message ?? "수정에 실패했습니다.");
        return;
      }
      setDetailDraft((prev) => (prev ? { ...prev, ...payload.item! } : payload.item!));
      setIsDetailEditMode(false);
      onUpdated?.(payload.item);
    } catch {
      window.alert("수정 중 오류가 발생했습니다.");
    } finally {
      setDetailSaving(false);
    }
  }

  async function handleAddMemberSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detailDraft) return;
    if (!addMemberEmail.trim()) {
      setAddMemberErrorMessage("이메일은 필수입니다.");
      return;
    }
    setAddMemberSubmitting(true);
    setAddMemberErrorMessage(null);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/partners/${detailDraft.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email: addMemberEmail.trim(),
          name: addMemberName.trim() || undefined,
          partnerOrgRole: addMemberRole,
          password: addMemberPassword.trim() || undefined
        })
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string; temporaryPassword?: string };
      if (!response.ok || !payload.ok) {
        setAddMemberErrorMessage(payload.message ?? "멤버 추가에 실패했습니다.");
        return;
      }
      if (payload.temporaryPassword) {
        window.alert(`임시 비밀번호가 생성되었습니다: ${payload.temporaryPassword}`);
      }
      setIsAddMemberModalOpen(false);
      resetAddMemberForm();
      setMembersRefreshKey((prev) => prev + 1);
    } catch {
      setAddMemberErrorMessage("멤버 추가 중 오류가 발생했습니다.");
    } finally {
      setAddMemberSubmitting(false);
    }
  }

  return (
    <>
      <dialog
        ref={detailDialogRef}
        className="ops-modal-dialog"
        onCancel={(e) => handleDialogCancel(e, requestCloseDetailModal)}
        onClick={(e) => handleDialogClick(e, requestCloseDetailModal)}
      >
        {detailDraft ? (
          <article className="ops-modal-card ops-detail-modal-card">
            <div className="ops-modal-fixed-top">
              <div className="ops-modal-header">
                <div className="ops-detail-title-wrap">
                  <h2>{detailDraft.name}</h2>
                  <span className={getOpsBadgeClassName("status-approved")}>운영중</span>
                </div>
                <div className="ops-detail-top-right">
                  <button type="button" className="ops-modal-close" onClick={requestCloseDetailModal} aria-label="닫기">
                    <X size={16} weight="bold" aria-hidden />
                  </button>
                </div>
              </div>
            </div>

            <div className="ops-modal-scroll-body">
              <PartnerDetailView
                partnerId={detailDraft.id}
                name={detailDraft.name}
                partnerTypeLabel={detailDraft.partnerType}
                partnerType={detailDraft.partnerType}
                companySizeLabel={companySizeLabel(detailDraft.companySize)}
                companySize={detailDraft.companySize}
                industryLabel={detailDraft.industry}
                industry={detailDraft.industry}
                createdAtLabel={formatDate(detailDraft.createdAt)}
                memberCount={detailDraft.memberCount}
                officeAddress={detailDraft.officeAddress}
                website={detailDraft.website}
                socialMedia={detailDraft.socialMedia}
                description={detailDraft.description}
                strengths={detailDraft.strengths}
                adminMemo={detailDraft.adminMemo}
                membersRefreshKey={membersRefreshKey}
                basicContent={
                  isDetailEditMode ? (
                    <form className="ops-partner-form ops-detail-edit-form" onSubmit={(e) => e.preventDefault()}>
                      <label>
                        파트너 유형
                        <select
                          value={detailDraft.partnerType}
                          onChange={(e) => setDetailDraft({ ...detailDraft, partnerType: e.target.value as PartnerType })}
                        >
                          <option value="UNIVERSITY">대학</option>
                          <option value="AGENCY">에이전시</option>
                          <option value="COMPANY">파트너</option>
                        </select>
                      </label>

                      <div className="ops-partner-form-two-cols">
                        <label>
                          <span className="ops-label-required">파트너명 <span className="ops-required">*</span></span>
                          <input value={detailDraft.name} onChange={(e) => setDetailDraft({ ...detailDraft, name: e.target.value })} />
                        </label>
                      </div>

                      <label>
                        파트너 규모
                        <select
                          value={detailDraft.companySize ?? ""}
                          onChange={(e) =>
                            setDetailDraft({
                              ...detailDraft,
                              companySize: (e.target.value || null) as PartnerCompanySize | null
                            })
                          }
                        >
                          <option value="">선택 안함</option>
                          <option value="SIZE_1_10">1~10인</option>
                          <option value="SIZE_UNDER_30">30인 이하</option>
                          <option value="SIZE_UNDER_50">50인 이하</option>
                          <option value="SIZE_OVER_100">100인 이상</option>
                        </select>
                      </label>

                      <label>
                        산업 분야
                        <select
                          value={detailDraft.industry}
                          onChange={(e) => setDetailDraft({ ...detailDraft, industry: e.target.value })}
                        >
                          {(partnerIndustries.length ? partnerIndustries : [detailDraft.industry]).map((item) => (
                            <option key={item} value={item}>
                              {industryLabel(item)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        사무실 주소
                        <input value={detailDraft.officeAddress ?? ""} onChange={(e) => setDetailDraft({ ...detailDraft, officeAddress: e.target.value })} />
                      </label>

                      <div className="ops-partner-form-two-cols">
                        <label>
                          웹사이트
                          <input value={detailDraft.website ?? ""} onChange={(e) => setDetailDraft({ ...detailDraft, website: e.target.value })} />
                        </label>
                        <label>
                          소셜 미디어
                          <input value={detailDraft.socialMedia ?? ""} onChange={(e) => setDetailDraft({ ...detailDraft, socialMedia: e.target.value })} />
                        </label>
                      </div>

                      <label>
                        파트너 소개
                        <textarea value={detailDraft.description ?? ""} rows={4} onChange={(e) => setDetailDraft({ ...detailDraft, description: e.target.value })} />
                      </label>

                      <label>
                        자랑거리 / 장점
                        <textarea value={detailDraft.strengths ?? ""} rows={4} onChange={(e) => setDetailDraft({ ...detailDraft, strengths: e.target.value })} />
                      </label>

                      <label>
                        관리자 메모
                        <textarea value={detailDraft.adminMemo ?? ""} rows={4} onChange={(e) => setDetailDraft({ ...detailDraft, adminMemo: e.target.value })} />
                      </label>
                    </form>
                  ) : undefined
                }
                memoContent={
                  isDetailEditMode ? (
                    <form className="ops-partner-form ops-detail-edit-form" onSubmit={(e) => e.preventDefault()}>
                      <label>
                        관리자 메모
                        <textarea
                          value={detailDraft.adminMemo ?? ""}
                          rows={8}
                          onChange={(e) => setDetailDraft({ ...detailDraft, adminMemo: e.target.value })}
                          placeholder="운영 메모를 입력하세요."
                        />
                      </label>
                    </form>
                  ) : undefined
                }
                tab={detailTab}
                onTabChange={setDetailTab}
              />
            </div>

            <div className="ops-modal-fixed-bottom ops-detail-actions">
              {isDetailEditMode ? (
                <>
                  <button
                    type="button"
                    className="ops-action-cancel"
                    onClick={() => {
                      setIsDetailEditMode(false);
                      if (partner) setDetailDraft(partner);
                    }}
                  >
                    취소
                  </button>
                  <button type="button" className="ops-action-save" onClick={() => void saveDetail()} disabled={detailSaving}>
                    {detailSaving ? "저장 중..." : "저장"}
                  </button>
                </>
              ) : (
                <>
                  {detailTab === "basic" ? (
                    <button type="button" className="ops-action-save" onClick={() => setIsDetailEditMode(true)}>
                      수정
                    </button>
                  ) : null}
                  {detailTab === "memo" ? (
                    <button type="button" className="ops-action-save" onClick={() => setIsDetailEditMode(true)}>
                      메모 작성
                    </button>
                  ) : null}
                  {detailTab === "members" ? (
                    <button
                      type="button"
                      className="ops-action-save"
                      onClick={() => {
                        resetAddMemberForm();
                        setIsAddMemberModalOpen(true);
                      }}
                    >
                      멤버 추가하기
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </article>
        ) : null}
      </dialog>

      <dialog
        ref={addMemberDialogRef}
        className="ops-modal-dialog"
        onCancel={(e) => handleDialogCancel(e, requestCloseAddMemberModal)}
        onClick={(e) => handleDialogClick(e, requestCloseAddMemberModal)}
      >
        <article className="ops-modal-card">
          <div className="ops-modal-fixed-top">
            <div className="ops-modal-header">
              <h2>멤버 추가하기</h2>
              <button type="button" className="ops-modal-close" onClick={requestCloseAddMemberModal} aria-label="닫기">
                <X size={16} weight="bold" aria-hidden />
              </button>
            </div>
          </div>

          <div className="ops-modal-scroll-body">
            <form id="ops-member-create-form-unified" className="ops-partner-form" onSubmit={handleAddMemberSubmit}>
              <label>
                이메일
                <input
                  value={addMemberEmail}
                  onChange={(e) => setAddMemberEmail(e.target.value)}
                  placeholder="example@company.com"
                />
              </label>
              <label>
                담당자명
                <input value={addMemberName} onChange={(e) => setAddMemberName(e.target.value)} placeholder="이름" />
              </label>
              <label>
                역할
                <select value={addMemberRole} onChange={(e) => setAddMemberRole(e.target.value as PartnerOrgRole)}>
                  <option value="OWNER">소유자</option>
                  <option value="ADMIN">관리자</option>
                  <option value="MEMBER">멤버</option>
                </select>
              </label>
              <label>
                초기 비밀번호 (선택)
                <input value={addMemberPassword} onChange={(e) => setAddMemberPassword(e.target.value)} placeholder="비워두면 임시 비밀번호 자동 생성" />
              </label>
              {addMemberErrorMessage ? <p className="ops-form-error">{addMemberErrorMessage}</p> : null}
            </form>
          </div>

          <div className="ops-modal-fixed-bottom ops-detail-actions">
            <button type="button" className="ops-action-cancel" onClick={requestCloseAddMemberModal}>
              취소
            </button>
            <button type="submit" form="ops-member-create-form-unified" className="ops-action-save" disabled={addMemberSubmitting}>
              {addMemberSubmitting ? "추가 중..." : "멤버 추가하기"}
            </button>
          </div>
        </article>
      </dialog>
    </>
  );
}
