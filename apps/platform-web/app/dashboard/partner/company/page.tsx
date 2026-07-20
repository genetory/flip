"use client";

import { useEffect, useState } from "react";
import { X } from "@phosphor-icons/react";
import {
  getMyPartnerOrganization,
  isPartnerOrganizationProfileComplete,
  isPartnerOrganizationVerificationComplete,
  type MyPartnerOrganization
} from "../../../../lib/member-profile-client";
import { partnerIndustryLabel } from "../../../../lib/partner-industry-labels";
import { PartnerCompanyProfileEditPage } from "../../../../components/pages/PartnerCompanyProfileEditPage";
import { PartnerCompanyVerificationEditPage } from "../../../../components/pages/PartnerCompanyVerificationEditPage";

const COMPANY_SIZE_LABEL: Record<string, string> = {
  SIZE_1_10: "1-10명",
  SIZE_UNDER_30: "11-30명",
  SIZE_UNDER_50: "31-50명",
  SIZE_OVER_100: "100명 이상"
};

const PARTNER_TYPE_LABEL: Record<string, string> = {
  UNIVERSITY: "대학교",
  COMPANY: "기업",
  AGENCY: "에이전시"
};

type ModalMode = null | "profile" | "verification";

export default function PartnerCompanyPage() {
  const [org, setOrg] = useState<MyPartnerOrganization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalMode>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    void (async () => {
      try {
        const item = await getMyPartnerOrganization();
        if (!ignore) setOrg(item ?? null);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "회사 정보를 불러오지 못했습니다.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (modal === null) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modal]);

  function closeModal() {
    setModal(null);
    setReloadKey((k) => k + 1);
  }

  const profileComplete = isPartnerOrganizationProfileComplete(org);
  const verificationComplete = isPartnerOrganizationVerificationComplete(org);
  // 어떤 항목이 비었는지 구체적으로 안내(막연한 '미완료' 대신).
  const missingProfile = [!org?.name?.trim() ? "회사명" : null, !org?.industry ? "산업 분야" : null].filter(Boolean) as string[];
  const missingVerification = [
    !org?.businessRegistrationDocumentData ? "사업자등록증" : null,
    !org?.fourInsuranceSubscriberListData ? "4대 보험 가입자명단" : null
  ].filter(Boolean) as string[];
  const modalTitle = modal === "profile" ? "회사 정보 편집" : modal === "verification" ? "인증 정보 편집" : "";

  return (
    <section className="ops-content-section">
      <header>
        <h1>회사 정보/검증</h1>
        <p>파트너 회사 정보를 확인하고 편집할 수 있어요.</p>
      </header>

      {loading ? (
        <div className="ops-empty-card">회사 정보를 불러오는 중...</div>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : !org ? (
        <article className="ops-card">
          <div style={{ border: "1px dashed var(--line-strong)", borderRadius: 12, padding: 24, background: "var(--surface-2)" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--ink)" }}>아직 파트너로 등록되지 않았어요</h2>
            <p className="ops-card-subtle" style={{ marginTop: 8, fontSize: 14 }}>
              파트너 정보를 등록하거나 초대 코드로 합류하면 정보·포지션·알림을 관리할 수 있어요.
            </p>
            <button type="button" onClick={() => setModal("profile")} className="ops-btn ops-btn-primary" style={{ marginTop: 16, height: 38, padding: "0 18px" }}>
              파트너 등록하기
            </button>
          </div>
        </article>
      ) : (
        <>
          <article className="ops-card">
            <div className="ops-card-header" style={{ marginBottom: 16 }}>
              <h2>회사 기본 정보</h2>
              <button type="button" onClick={() => setModal("profile")} className="ops-btn">
                편집
              </button>
            </div>
            <dl style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", margin: 0, fontSize: 14 }}>
              <div>
                <dt className="ops-form-label">회사명</dt>
                <dd style={{ color: "var(--ink)", fontWeight: 500, margin: 0 }}>{org.name}</dd>
              </div>
              <div>
                <dt className="ops-form-label">파트너 타입</dt>
                <dd style={{ color: "var(--ink)", fontWeight: 500, margin: 0 }}>{PARTNER_TYPE_LABEL[org.partnerType] ?? org.partnerType}</dd>
              </div>
              <div>
                <dt className="ops-form-label">업종</dt>
                <dd style={{ color: "var(--ink)", fontWeight: 500, margin: 0 }}>{partnerIndustryLabel(org.industry)}</dd>
              </div>
              <div>
                <dt className="ops-form-label">회사 규모</dt>
                <dd style={{ color: "var(--ink)", fontWeight: 500, margin: 0 }}>{org.companySize ? COMPANY_SIZE_LABEL[org.companySize] ?? org.companySize : "-"}</dd>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <dt className="ops-form-label">웹사이트</dt>
                <dd style={{ color: "var(--ink)", fontWeight: 500, margin: 0 }}>{org.website ?? "-"}</dd>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <dt className="ops-form-label">주소</dt>
                <dd style={{ color: "var(--ink)", fontWeight: 500, margin: 0 }}>{org.officeAddress ?? "-"}</dd>
              </div>
            </dl>
          </article>

          <article className="ops-card">
            <div className="ops-card-header" style={{ marginBottom: 16 }}>
              <h2>인증 상태</h2>
              <button type="button" onClick={() => setModal("verification")} className="ops-btn">
                인증 정보 편집
              </button>
            </div>
            <ul style={{ display: "flex", flexDirection: "column", gap: 12, margin: 0, padding: 0, listStyle: "none", fontSize: 14 }}>
              <li>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <span style={{ color: "var(--ink-faint)" }}>회사 프로필</span>
                  <span className={`ops-pill ${profileComplete ? "ops-pill-green" : "ops-pill-amber"}`}>
                    {profileComplete ? "완료" : "미완료"}
                  </span>
                </div>
                {!profileComplete && missingProfile.length > 0 ? (
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>빠진 항목: {missingProfile.join(", ")}</span>
                    <button type="button" className="ops-btn ops-btn-primary" onClick={() => setModal("profile")}>지금 완료하기</button>
                  </div>
                ) : null}
              </li>
              <li>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <span style={{ color: "var(--ink-faint)" }}>인증 정보</span>
                  <span className={`ops-pill ${verificationComplete ? "ops-pill-green" : "ops-pill-amber"}`}>
                    {verificationComplete ? "완료" : "미완료"}
                  </span>
                </div>
                {!verificationComplete && missingVerification.length > 0 ? (
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>빠진 항목: {missingVerification.join(", ")}</span>
                    <button type="button" className="ops-btn ops-btn-primary" onClick={() => setModal("verification")}>지금 완료하기</button>
                  </div>
                ) : null}
              </li>
            </ul>
            <p className="ops-card-subtle" style={{ marginTop: 12 }}>
              두 항목이 모두 완료되어야 포지션 모집 등 파트너 기능을 제한 없이 사용할 수 있어요.
            </p>
          </article>
        </>
      )}

      {modal !== null ? (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11, 18, 39, 0.55)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 960,
              maxHeight: "calc(100vh - 48px)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 24px 60px -20px rgba(15, 23, 42, 0.4)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{modalTitle}</p>
              <button
                type="button"
                onClick={closeModal}
                aria-label="닫기"
                style={{ background: "transparent", border: 0, cursor: "pointer", color: "var(--ink-faint)", lineHeight: 1, display: "inline-flex" }}
              >
                <X size={20} weight="bold" aria-hidden />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {modal === "profile" ? (
                <PartnerCompanyProfileEditPage embedded onClose={closeModal} />
              ) : modal === "verification" ? (
                <PartnerCompanyVerificationEditPage embedded onClose={closeModal} />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
