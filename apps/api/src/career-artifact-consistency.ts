// Career Launch Phase 14 — 결과물 간 사실 일관성 검사(구조화 데이터 기반, LLM 무의존, 테스트 가능).
// 목표 직무·회사·학교·기간·직책·프로젝트·역할·기술·성과수치 등이 Career Profile·이력서·자소서·면접에
// 걸쳐 일치하는지 '구조화된 사실'로 비교한다(단순 문자열 일치만으로 판정하지 않음: 정규화 후 비교).
// 판정: match(일치) / paraphrase(표현만 다름) / needs_confirmation(확인 필요) / conflict(충돌) / unsupported(근거 없음).

export const FACT_FIELDS = ["target_job", "company", "school", "period", "title", "project", "role", "tech", "metric", "strength", "gap"] as const;
export type FactField = (typeof FACT_FIELDS)[number];

// 한 사실 값 + 출처 + 확인 상태(Career Profile 6상태·SourceLink 검증상태와 연결).
export type FactValue = {
  value: string;
  source: string; // profile | resume | cover | interview
  confirmed?: boolean; // 사용자 확인(confirmed/user_edited/verified)
  inferred?: boolean; // AI 추론(inferred)
};
export type FactGroup = { field: FactField; label: string; values: FactValue[] };

export type ConsistencyVerdict = "match" | "paraphrase" | "needs_confirmation" | "conflict" | "unsupported";
export type ConsistencyFinding = {
  field: FactField;
  label: string;
  verdict: ConsistencyVerdict;
  values: FactValue[];
  detail: string;
  critical: boolean; // 회사·기간·직책·성과수치 불일치는 critical(허위 위험).
};

// 표현 정규화(공백·대소문자·마침표). 숫자 사실은 별도 규칙.
function normalize(s: string): string {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[.,·]/g, "");
}
// 숫자/기간 필드는 숫자만 뽑아 비교(성과 수치·기간). leading zero 정규화(03=3).
function numericKey(s: string): string {
  return (s.match(/\d+/g) ?? []).map((n) => String(parseInt(n, 10))).join("-");
}
const NUMERIC_FIELDS: FactField[] = ["period", "metric"];
// 불일치가 허위로 이어질 수 있는 필드(사용자 확인 없이 확정 금지).
const CRITICAL_FIELDS: FactField[] = ["company", "school", "period", "title", "metric"];

function keyOf(field: FactField, value: string): string {
  return NUMERIC_FIELDS.includes(field) ? numericKey(value) : normalize(value);
}

// 한 사실 그룹의 판정.
export function classifyFactGroup(group: FactGroup): ConsistencyFinding {
  const vals = group.values.filter((v) => (v.value ?? "").trim().length > 0);
  const critical = CRITICAL_FIELDS.includes(group.field);
  const base = { field: group.field, label: group.label, values: group.values, critical };

  if (vals.length === 0) {
    return { ...base, verdict: "unsupported", detail: "어느 결과물에도 근거가 없어요." };
  }
  // 근거가 하나뿐이고 추론이거나 미확인 → 확인 필요.
  if (vals.length === 1) {
    const only = vals[0];
    if (only.inferred) return { ...base, verdict: "needs_confirmation", detail: "코치가 추론한 내용이라 사용자 확인이 필요해요." };
    if (!only.confirmed) return { ...base, verdict: "needs_confirmation", detail: "아직 확인되지 않은 정보예요." };
    return { ...base, verdict: "match", detail: "확인된 사실이에요." };
  }
  // 여러 근거 — 정규화 키로 비교.
  const keys = new Set(vals.map((v) => keyOf(group.field, v.value)));
  if (keys.size === 1) {
    // 값은 같음. 원문 표현이 다르면 paraphrase, 완전 동일이면 match.
    const rawSame = new Set(vals.map((v) => v.value.trim())).size === 1;
    return { ...base, verdict: rawSame ? "match" : "paraphrase", detail: rawSame ? "결과물 간 일치해요." : "의미는 같고 표현만 달라요." };
  }
  // 값이 다름 → 충돌. 사용자 확인 값이 하나면 그걸 기준으로 안내.
  const confirmedVals = vals.filter((v) => v.confirmed);
  const detail =
    confirmedVals.length === 1
      ? `결과물마다 값이 달라요. 확인된 값('${confirmedVals[0].value}') 기준으로 맞출지 확인이 필요해요.`
      : "결과물마다 값이 달라요. 어떤 값을 기준으로 할지 확인이 필요해요.";
  return { ...base, verdict: "conflict", detail };
}

export type ConsistencyReport = {
  findings: ConsistencyFinding[];
  summary: { total: number; match: number; paraphrase: number; needsConfirmation: number; conflict: number; unsupported: number; criticalConflicts: number };
  // 최종 확정 가능 여부: critical 충돌·근거없음이 있으면 확정 전 확인 필요.
  finalizeBlocked: boolean;
  blockers: string[];
};

export function checkArtifactConsistency(groups: FactGroup[]): ConsistencyReport {
  const findings = groups.map(classifyFactGroup);
  const count = (v: ConsistencyVerdict) => findings.filter((f) => f.verdict === v).length;
  const criticalConflicts = findings.filter((f) => f.critical && (f.verdict === "conflict" || f.verdict === "unsupported")).length;
  const blockers = findings
    .filter((f) => f.critical && (f.verdict === "conflict" || f.verdict === "unsupported"))
    .map((f) => `${f.label}: ${f.detail}`);
  return {
    findings,
    summary: {
      total: findings.length,
      match: count("match"),
      paraphrase: count("paraphrase"),
      needsConfirmation: count("needs_confirmation"),
      conflict: count("conflict"),
      unsupported: count("unsupported"),
      criticalConflicts
    },
    finalizeBlocked: criticalConflicts > 0,
    blockers
  };
}

// 사용자 표현(내부 상태 미노출).
export const CONSISTENCY_VERDICT_LABEL: Record<ConsistencyVerdict, string> = {
  match: "일치",
  paraphrase: "표현만 다름",
  needs_confirmation: "확인 필요",
  conflict: "충돌",
  unsupported: "근거 없음"
};
