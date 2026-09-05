// Career Launch Phase 11 — 대학·기관 B2B 운영 확장 순수 로직(DB 무의존, 테스트 가능).
// 멀티테넌트 권한 매트릭스(중앙)·좌석 계산·CSV 검증·초대 상태·라이선스 상태. 화면 숨김이 아니라
// 여기서 정의한 permission 을 서버가 강제한다. 개인정보/원문은 다루지 않는다.
import { z } from "zod";

// ── 기관 유형/상태 ──────────────────────────────────────────
export const ORG_TYPES = ["university", "college", "vocational_school", "public_agency", "employment_center", "nonprofit", "corporate_program", "other"] as const;
export type OrgType = (typeof ORG_TYPES)[number];

export const ORG_STATUSES = ["prospect", "onboarding", "active", "suspended", "expired", "archived"] as const;
export type OrgStatus = (typeof ORG_STATUSES)[number];
// 접근 가능한(운영 가능한) 상태 — suspended/expired/archived 는 신규 활성화 제한(기존 데이터는 보존).
export const ORG_OPERABLE_STATUSES: OrgStatus[] = ["onboarding", "active"];
export function orgAllowsNewActivation(status: OrgStatus): boolean {
  return ORG_OPERABLE_STATUSES.includes(status);
}

// ── 역할 ────────────────────────────────────────────────────
// APLY 전역 역할은 기존 MemberRole(OPERATOR=슈퍼유저)로 두고, 여기서는 기관 범위 역할을 정의한다.
export const ORG_ROLES = ["org_admin", "org_observer", "instructor", "counselor"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];
// APLY 전역(기관 무관) 역할.
export const PLATFORM_ROLES = ["aply_super", "aply_operator"] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];
export type ActorRole = OrgRole | PlatformRole;

// ── 중앙 권한 매트릭스 ──────────────────────────────────────
// action 은 "리소스:동작" 관례. 여기 정의된 것만 허용(명시 없으면 거부).
export const PERMISSIONS = [
  "org:read",
  "org:update",
  "org:manage_members",
  "org:manage_settings",
  "template:read",
  "template:create",
  "cohort:read",
  "cohort:create",
  "cohort:update",
  "cohort:clone",
  "student:read",
  "student:enroll",
  "student:unenroll",
  "student:read_raw", // 상담 원문·이력서 원문 등 민감 원문 접근
  "staff:assign",
  "license:read",
  "license:manage",
  "report:read",
  "report:generate",
  "report:download",
  "intervention:read",
  "intervention:manage",
  "audit:read"
] as const;
export type Permission = (typeof PERMISSIONS)[number];

// 역할 → 허용 permission 집합(중앙 관리). aply_super 는 전체.
export const PERMISSION_MATRIX: Record<ActorRole, Permission[]> = {
  aply_super: [...PERMISSIONS],
  aply_operator: [
    "org:read",
    "template:read",
    "template:create",
    "cohort:read",
    "cohort:create",
    "cohort:update",
    "cohort:clone",
    "student:read",
    "student:enroll",
    "student:unenroll",
    "student:read_raw",
    "staff:assign",
    "license:read",
    "report:read",
    "report:generate",
    "report:download",
    "intervention:read",
    "intervention:manage",
    "audit:read"
  ],
  org_admin: [
    "org:read",
    "org:update",
    "org:manage_members",
    "org:manage_settings",
    "template:read",
    "cohort:read",
    "cohort:create",
    "cohort:update",
    "cohort:clone",
    "student:read",
    "student:enroll",
    "student:unenroll",
    "staff:assign",
    "license:read",
    "report:read",
    "report:generate",
    "report:download",
    "intervention:read",
    "audit:read"
  ],
  // 관찰자 — 집계·리포트 열람만. 수정·원문·운영 불가.
  org_observer: ["org:read", "cohort:read", "student:read", "report:read", "report:download", "license:read"],
  // 강사 — 배정 범위(기수/주차/학생)의 진행·결과물 검토·피드백. 원문 민감데이터 접근 불가.
  instructor: ["cohort:read", "student:read", "report:read"],
  // 상담자 — 배정 학생의 개입·필요 요약. 원문은 개입 목적 최소 범위.
  counselor: ["cohort:read", "student:read", "intervention:read", "intervention:manage"]
};

export function can(role: ActorRole, permission: Permission): boolean {
  return PERMISSION_MATRIX[role]?.includes(permission) ?? false;
}
// 여러 membership 을 가진 사용자의 유효 권한(합집합).
export function canAny(roles: ActorRole[], permission: Permission): boolean {
  return roles.some((r) => can(r, permission));
}

// ── 좌석 계산 ───────────────────────────────────────────────
// 좌석 정의: allocated(좌석 배정=enrollment) / activated(첫 상담 시작) / completed(Week4 완료).
// 중복 enrollment·재초대로 중복 차감되지 않도록 studentUserId 고유 집합 기준으로 계산한다.
export type SeatStudent = { studentUserId: string; activated: boolean; completed: boolean };
export type SeatUsage = { allocated: number; activated: number; completed: number; contracted: number | null; remaining: number | null; overCommitted: boolean };

export function computeSeatUsage(students: SeatStudent[], contractedSeats: number | null): SeatUsage {
  const uniq = new Map<string, SeatStudent>();
  for (const s of students) {
    const prev = uniq.get(s.studentUserId);
    // 같은 학생 중복이면 활성/완료는 OR 로 병합(중복 차감 방지).
    uniq.set(s.studentUserId, { studentUserId: s.studentUserId, activated: (prev?.activated ?? false) || s.activated, completed: (prev?.completed ?? false) || s.completed });
  }
  const arr = [...uniq.values()];
  const allocated = arr.length;
  const activated = arr.filter((s) => s.activated).length;
  const completed = arr.filter((s) => s.completed).length;
  const remaining = contractedSeats == null ? null : Math.max(0, contractedSeats - allocated);
  const overCommitted = contractedSeats != null && allocated > contractedSeats;
  return { allocated, activated, completed, contracted: contractedSeats, remaining, overCommitted };
}

// 신규 좌석 배정 가능 여부 — 좌석 부족 시 신규 활성화만 제한(기존 데이터 삭제 없음).
export function canAllocateSeat(usage: SeatUsage, orgStatus: OrgStatus, licenseStatus: LicenseStatus): { allowed: boolean; reason?: string } {
  if (!orgAllowsNewActivation(orgStatus)) return { allowed: false, reason: `기관 상태(${orgStatus})에서는 신규 활성화가 제한됩니다` };
  if (!LICENSE_OPERABLE.includes(licenseStatus)) return { allowed: false, reason: `라이선스 상태(${licenseStatus})가 유효하지 않습니다` };
  if (usage.contracted != null && usage.allocated >= usage.contracted) return { allowed: false, reason: "계약 좌석을 모두 사용했습니다(기존 학생은 유지, 신규만 제한)" };
  return { allowed: true };
}

// ── 라이선스 상태 ───────────────────────────────────────────
export const LICENSE_STATUSES = ["draft", "active", "exhausted", "expired", "suspended"] as const;
export type LicenseStatus = (typeof LICENSE_STATUSES)[number];
export const LICENSE_OPERABLE: LicenseStatus[] = ["active"];

// 현재 시각·사용량으로 라이선스 상태를 계산(만료·소진 반영). 저장값 대신 파생 판정에 사용.
export function deriveLicenseStatus(input: { stored: LicenseStatus; endAtMs: number | null; nowMs: number; allocated: number; contractedSeats: number | null }): LicenseStatus {
  if (input.stored === "draft" || input.stored === "suspended") return input.stored;
  if (input.endAtMs != null && input.nowMs > input.endAtMs) return "expired";
  if (input.contractedSeats != null && input.allocated >= input.contractedSeats) return "exhausted";
  return "active";
}

// ── 초대 상태 ───────────────────────────────────────────────
export const INVITE_STATUSES = ["pending", "sent", "opened", "registered", "enrolled", "expired", "cancelled", "failed"] as const;
export type InviteStatus = (typeof INVITE_STATUSES)[number];
// 허용 전이(단순 전방향 + 취소/만료). 실제 외부 발송은 없으므로 sent 는 링크 생성 시점으로 본다.
const INVITE_TRANSITIONS: Record<InviteStatus, InviteStatus[]> = {
  pending: ["sent", "cancelled", "expired"],
  sent: ["opened", "registered", "enrolled", "cancelled", "expired", "failed"],
  opened: ["registered", "enrolled", "cancelled", "expired"],
  registered: ["enrolled", "cancelled", "expired"],
  enrolled: [],
  expired: [],
  cancelled: [],
  failed: ["pending", "cancelled"]
};
export function canTransitionInvite(from: InviteStatus, to: InviteStatus): boolean {
  return INVITE_TRANSITIONS[from]?.includes(to) ?? false;
}

// ── CSV 일괄 등록 검증 ──────────────────────────────────────
export const CSV_MAX_ROWS = 500;
// 최소 정보만 수집: email(필수), name(선택), externalId(선택). 원문 개인정보 최소화.
export const csvRowSchema = z.object({
  email: z.string().email(),
  name: z.string().max(80).optional(),
  externalId: z.string().max(80).optional()
});
export type CsvRow = z.infer<typeof csvRowSchema>;
export type CsvValidationRow = { row: number; ok: boolean; email?: string; name?: string; externalId?: string; error?: string; duplicateInFile?: boolean };
export type CsvValidationResult = { total: number; valid: number; invalid: number; duplicates: number; rows: CsvValidationRow[]; capped: boolean };

// 업로드 전 미리보기·행별 검증·파일 내 중복 검사. 실제 등록은 하지 않는다(순수).
export function validateCsvRows(raw: Array<Record<string, unknown>>): CsvValidationResult {
  const capped = raw.length > CSV_MAX_ROWS;
  const slice = raw.slice(0, CSV_MAX_ROWS);
  const seen = new Set<string>();
  const rows: CsvValidationRow[] = slice.map((r, i) => {
    const parsed = csvRowSchema.safeParse({ email: typeof r.email === "string" ? r.email.trim().toLowerCase() : r.email, name: r.name, externalId: r.externalId });
    if (!parsed.success) {
      return { row: i + 1, ok: false, error: parsed.error.issues[0]?.message ?? "invalid" };
    }
    const email = parsed.data.email;
    const dup = seen.has(email);
    seen.add(email);
    return { row: i + 1, ok: !dup, email, name: parsed.data.name, externalId: parsed.data.externalId, duplicateInFile: dup, error: dup ? "파일 내 중복" : undefined };
  });
  return {
    total: rows.length,
    valid: rows.filter((r) => r.ok).length,
    invalid: rows.filter((r) => !r.ok && !r.duplicateInFile).length,
    duplicates: rows.filter((r) => r.duplicateInFile).length,
    rows,
    capped
  };
}

// ── 리포트: 작은 표본 숨김 ──────────────────────────────────
// 기관 제출용 리포트는 집계만. 표본이 이보다 작으면 세부 분류를 숨긴다(개인 식별 방지).
export const REPORT_MIN_GROUP = 5;
export function shouldHideGroup(n: number): boolean {
  return n < REPORT_MIN_GROUP;
}
export const METRIC_VERSION = "org_metrics_v1";

// ── 감사 로그 액션(중앙 목록) ──────────────────────────────
export const AUDIT_ACTIONS = [
  "org.create",
  "org.update",
  "org.status_change",
  "org.member_add",
  "org.member_remove",
  "org.member_role_change",
  "org.settings_change",
  "cohort.create",
  "cohort.clone",
  "cohort.schedule_change",
  "student.enroll",
  "student.unenroll",
  "student.csv_upload",
  "seat.allocate",
  "staff.assign",
  "flag.change",
  "report.generate",
  "report.download",
  "intervention.status_change"
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
