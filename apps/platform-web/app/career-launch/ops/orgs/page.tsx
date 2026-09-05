"use client";

// Phase 11 기관(B2B) 운영 화면 — 기관 대시보드·담당자·라이선스/좌석·성과 리포트·감사 로그.
// 권한은 서버가 강제(화면 숨김 아님). 집계만 표시, 민감 원문 없음.
import { useCallback, useEffect, useState } from "react";
import { CircleNotch, Buildings } from "@phosphor-icons/react";
import { trackCareerFunnel } from "../../../../lib/analytics";
import {
  fetchOrgs,
  createOrg,
  fetchOrgDashboard,
  fetchOrgMembers,
  addOrgMember,
  fetchOrgLicense,
  fetchOrgReports,
  generateOrgReport,
  fetchOrgAudit,
  type Organization,
  type OrgDashboard,
  type OrgMember,
  type OrgLicense,
  type OrgReportRow,
  type OrgAuditLog
} from "../../../../lib/launch/org-client";

const STATUS_TONE: Record<string, string> = { active: "bg-[#E7F7EF] text-[#0A9B59]", onboarding: "bg-[#F5F8FF] text-[#0B46E8]", prospect: "bg-[#FAFBFC] text-[#8B95A1]", suspended: "bg-[#FFFBEB] text-[#C77700]", expired: "bg-[#FEF2F2] text-[#F04452]", archived: "bg-[#F2F4F6] text-[#8B95A1]" };
type Tab = "dashboard" | "members" | "license" | "reports" | "audit";
const ORG_TYPES = ["university", "college", "vocational_school", "public_agency", "employment_center", "nonprofit", "corporate_program", "other"];

export default function OrgOpsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [orgId, setOrgId] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [dashboard, setDashboard] = useState<OrgDashboard | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [license, setLicense] = useState<OrgLicense | null>(null);
  const [reports, setReports] = useState<OrgReportRow[]>([]);
  const [audit, setAudit] = useState<OrgAuditLog[]>([]);
  // 생성/추가 폼.
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgType, setNewOrgType] = useState("university");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("org_admin");

  const reloadOrgs = useCallback(async () => {
    try {
      const { organizations } = await fetchOrgs();
      setOrgs(organizations);
      if (organizations[0] && !orgId) setOrgId(organizations[0].id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "기관을 불러오지 못했어요.");
    }
  }, [orgId]);

  useEffect(() => {
    trackCareerFunnel("career_admin_cohort_dashboard_viewed");
    void reloadOrgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setErr("");
    try {
      if (tab === "dashboard") setDashboard(await fetchOrgDashboard(orgId));
      else if (tab === "members") setMembers(await fetchOrgMembers(orgId));
      else if (tab === "license") setLicense(await fetchOrgLicense(orgId));
      else if (tab === "reports") setReports(await fetchOrgReports(orgId));
      else if (tab === "audit") setAudit(await fetchOrgAudit(orgId));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [orgId, tab]);
  useEffect(() => {
    void load();
  }, [load]);

  const doCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    try {
      const o = await createOrg({ name: newOrgName.trim(), type: newOrgType });
      setNewOrgName("");
      await reloadOrgs();
      setOrgId(o.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "생성 실패");
    }
  };
  const doAddMember = async () => {
    if (!memberEmail.trim()) return;
    try {
      await addOrgMember(orgId, memberEmail.trim(), memberRole);
      setMemberEmail("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "추가 실패");
    }
  };
  const doGenReport = async (type: "organization_summary" | "cohort_performance") => {
    try {
      await generateOrgReport(orgId, type);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "생성 실패");
    }
  };

  return (
    <div className="py-6">
      <div className="w-full max-w-[1120px] mx-auto">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <Buildings size={22} className="text-[#0B46E8]" />
            <div>
              <h1 className="text-[20px] font-bold text-[#191F28]">기관(B2B) 운영</h1>
              <p className="text-[13px] text-[#8B95A1] mt-0.5">기관별 데이터 분리·기수·좌석·성과 리포트. 권한은 서버가 강제해요.</p>
            </div>
          </div>
          <select value={orgId} onChange={(e) => setOrgId(e.target.value)} className="h-9 px-3 rounded-lg border border-[#E5E8EB] bg-white text-[13px]">
            {orgs.length === 0 && <option value="">기관 없음</option>}
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.type})
              </option>
            ))}
          </select>
        </div>

        {/* 기관 생성(APLY 운영자) */}
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#EEF1F5] bg-white p-3">
          <span className="text-[13px] font-semibold text-[#4E5968]">새 기관</span>
          <input value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} placeholder="기관명" className="h-8 px-2 rounded-lg border border-[#E5E8EB] text-[13px]" />
          <select value={newOrgType} onChange={(e) => setNewOrgType(e.target.value)} className="h-8 px-2 rounded-lg border border-[#E5E8EB] text-[13px]">
            {ORG_TYPES.map((tpe) => (
              <option key={tpe} value={tpe}>
                {tpe}
              </option>
            ))}
          </select>
          <button onClick={doCreateOrg} className="h-8 px-3 rounded-lg bg-[#0B46E8] text-white text-[13px]">
            생성
          </button>
        </div>

        <div className="flex gap-1 mb-4 border-b border-[#EEF1F5]">
          {([["dashboard", "대시보드"], ["members", "담당자"], ["license", "좌석/라이선스"], ["reports", "성과 리포트"], ["audit", "감사 로그"]] as [Tab, string][]).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-3 py-2 text-[13px] font-medium border-b-2 -mb-px ${tab === k ? "border-[#0B46E8] text-[#0B46E8]" : "border-transparent text-[#8B95A1]"}`}>
              {label}
            </button>
          ))}
        </div>

        {err && <div className="mb-3 px-3 py-2 rounded-lg bg-[#FEF2F2] text-[#F04452] text-[13px]">{err}</div>}
        {loading && (
          <div className="flex items-center gap-2 text-[#8B95A1] text-[13px] py-8 justify-center">
            <CircleNotch className="animate-spin" size={18} /> 불러오는 중…
          </div>
        )}

        {!loading && tab === "dashboard" && dashboard && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ["진행 기수", `${dashboard.summary.cohortsActive}/${dashboard.summary.cohortsTotal}`],
                ["계약 좌석", dashboard.summary.contractedSeats ?? "—"],
                ["배정 좌석", dashboard.summary.allocatedSeats],
                ["활성 좌석", dashboard.summary.activatedSeats],
                ["참여자", dashboard.summary.totalParticipants],
                ["완주", dashboard.summary.completed],
                ["완주율", `${dashboard.summary.completionRatePct}%`],
                ["패키지 완성", dashboard.summary.packagesFinalized]
              ].map(([label, v]) => (
                <div key={label as string} className="bg-white rounded-xl border border-[#EEF1F5] p-3">
                  <div className="text-[12px] text-[#8B95A1]">{label}</div>
                  <div className="text-[20px] font-bold text-[#191F28] tabular-nums">{v as string}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-[#EEF1F5] overflow-hidden">
              <div className="px-3 py-2 text-[13px] font-semibold border-b border-[#EEF1F5]">기수 현황</div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-[#8B95A1] text-left">
                      <th className="px-3 py-2 font-medium">기수</th>
                      <th className="px-3 py-2 font-medium">참여</th>
                      <th className="px-3 py-2 font-medium">활성</th>
                      <th className="px-3 py-2 font-medium">완주</th>
                      <th className="px-3 py-2 font-medium">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.cohorts.map((c) => (
                      <tr key={c.id} className="border-t border-[#F2F4F6]">
                        <td className="px-3 py-2">{c.name}</td>
                        <td className="px-3 py-2 tabular-nums">{c.enrolled}</td>
                        <td className="px-3 py-2 tabular-nums">{c.active}</td>
                        <td className="px-3 py-2 tabular-nums">{c.completed}</td>
                        <td className="px-3 py-2">{c.status}</td>
                      </tr>
                    ))}
                    {dashboard.cohorts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-[#8B95A1]">아직 기수가 없어요.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[12px] text-[#8B95A1]">내 역할: {dashboard.myRoles.join(", ") || "—"}</p>
          </div>
        )}

        {!loading && tab === "members" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#EEF1F5] bg-white p-3">
              <input value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} placeholder="담당자 이메일(가입된 사용자)" className="h-8 px-2 rounded-lg border border-[#E5E8EB] text-[13px] min-w-[220px]" />
              <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)} className="h-8 px-2 rounded-lg border border-[#E5E8EB] text-[13px]">
                {["org_admin", "org_observer", "instructor", "counselor"].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button onClick={doAddMember} className="h-8 px-3 rounded-lg bg-[#0B46E8] text-white text-[13px]">
                추가
              </button>
            </div>
            <div className="bg-white rounded-xl border border-[#EEF1F5] overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-[#8B95A1] text-left">
                    <th className="px-3 py-2 font-medium">담당자</th>
                    <th className="px-3 py-2 font-medium">이메일</th>
                    <th className="px-3 py-2 font-medium">역할</th>
                    <th className="px-3 py-2 font-medium">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-t border-[#F2F4F6]">
                      <td className="px-3 py-2">{m.name ?? "—"}</td>
                      <td className="px-3 py-2">{m.email ?? "—"}</td>
                      <td className="px-3 py-2">{m.role}</td>
                      <td className="px-3 py-2">{m.status}</td>
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-[#8B95A1]">담당자가 없어요.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && tab === "license" && license && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ["계약 좌석", license.usage.contracted ?? "—"],
                ["배정", license.usage.allocated],
                ["활성", license.usage.activated],
                ["완주", license.usage.completed],
                ["잔여", license.usage.remaining ?? "—"],
                ["라이선스", (license.license?.derivedStatus as string) ?? "미설정"]
              ].map(([label, v]) => (
                <div key={label as string} className="bg-white rounded-xl border border-[#EEF1F5] p-3">
                  <div className="text-[12px] text-[#8B95A1]">{label}</div>
                  <div className="text-[20px] font-bold text-[#191F28] tabular-nums">{v as string}</div>
                </div>
              ))}
            </div>
            {license.usage.overCommitted && <div className="px-3 py-2 rounded-lg bg-[#FFFBEB] text-[#C77700] text-[13px]">계약 좌석을 초과했어요. 기존 학생은 유지되고 신규 활성화만 제한됩니다.</div>}
            <p className="text-[12px] text-[#8B95A1]">좌석 정의: 배정=등록, 활성=첫 상담 시작, 완주=Week 4 완료. 중복 등록은 1좌석으로 계산해요. 라이선스 설정은 APLY 운영자만 변경할 수 있어요.</p>
          </div>
        )}

        {!loading && tab === "reports" && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <button onClick={() => doGenReport("organization_summary")} className="h-8 px-3 rounded-lg bg-[#0B46E8] text-white text-[13px]">
                기관 전체 리포트 생성
              </button>
              <button onClick={() => doGenReport("cohort_performance")} className="h-8 px-3 rounded-lg border border-[#E5E8EB] text-[13px]">
                기수 성과 리포트 생성
              </button>
            </div>
            <div className="bg-white rounded-xl border border-[#EEF1F5] overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-[#8B95A1] text-left">
                    <th className="px-3 py-2 font-medium">유형</th>
                    <th className="px-3 py-2 font-medium">metricVersion</th>
                    <th className="px-3 py-2 font-medium">생성일</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="border-t border-[#F2F4F6]">
                      <td className="px-3 py-2">{r.reportType}</td>
                      <td className="px-3 py-2 text-[#8B95A1]">{r.metricVersion}</td>
                      <td className="px-3 py-2 tabular-nums">{new Date(r.generatedAt).toLocaleString("ko-KR")}</td>
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-[#8B95A1]">생성된 리포트가 없어요.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-[12px] text-[#8B95A1]">리포트는 집계 스냅샷만 저장해요. 표본 5명 미만은 세부 분류를 숨기고, 학생 원문(이력서·상담·면접 답변)은 포함하지 않아요.</p>
          </div>
        )}

        {!loading && tab === "audit" && (
          <div className="bg-white rounded-xl border border-[#EEF1F5] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[#8B95A1] text-left">
                  <th className="px-3 py-2 font-medium">시각</th>
                  <th className="px-3 py-2 font-medium">액션</th>
                  <th className="px-3 py-2 font-medium">역할</th>
                  <th className="px-3 py-2 font-medium">대상</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((l) => (
                  <tr key={l.id} className="border-t border-[#F2F4F6]">
                    <td className="px-3 py-2 tabular-nums text-[#8B95A1]">{new Date(l.createdAt).toLocaleString("ko-KR")}</td>
                    <td className="px-3 py-2">{l.action}</td>
                    <td className="px-3 py-2">{l.actorRole ?? "—"}</td>
                    <td className="px-3 py-2 text-[#8B95A1]">{l.targetType ?? ""} {l.targetId ? l.targetId.slice(-6) : ""}</td>
                  </tr>
                ))}
                {audit.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-[#8B95A1]">감사 로그가 없어요.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
