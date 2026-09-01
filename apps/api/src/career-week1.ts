// Career Launch Week 1 '나를 이해하고 직무 탐험' — 순수 로직/데이터 계층(DB 무의존, 테스트 가능).
// 직무군 taxonomy + 경험카드 zod 스키마 + 목표 상태/유형 상수.
// (미니체험 템플릿·추천/결정 스키마·완료판정은 해당 기능 제거로 함께 삭제됨.)
// 저장/조회/LLM 호출은 index.ts 가 담당한다.
import { z } from "zod";

// ── 직무군(job family) taxonomy ─────────────────────────────
// 초기 10개 대표 직무군. label 은 화면 표시용, aliases 는 LLM 이 자유 생성한 role 문자열을
// 직무군으로 매핑할 때 쓴다(예: "PM" → product_planning). taxonomy 확장은 이 배열만 늘리면 된다.
export type JobFamily = { key: string; label: string; short: string; description: string; aliases: string[] };
export const JOB_FAMILIES: JobFamily[] = [
  { key: "product_planning", label: "서비스·프로덕트 기획", short: "기획", description: "사용자 문제를 정의하고 우선순위를 정해 서비스·기능을 설계한다.", aliases: ["기획", "pm", "product", "프로덕트", "서비스 기획", "po", "기획자"] },
  { key: "marketing", label: "마케팅", short: "마케팅", description: "타깃을 정하고 메시지·채널·캠페인으로 성과를 만든다.", aliases: ["마케팅", "그로스", "퍼포먼스", "brand", "브랜드", "growth", "performance"] },
  { key: "content", label: "콘텐츠 기획", short: "콘텐츠", description: "타깃에 맞는 콘텐츠를 기획·구성해 배포한다.", aliases: ["콘텐츠", "content", "에디터", "editor", "카피", "sns"] },
  { key: "sales_bd", label: "영업·사업개발", short: "영업·BD", description: "고객 문제를 파악해 가치를 제안하고 관계를 만든다.", aliases: ["영업", "세일즈", "sales", "사업개발", "bd", "business development", "제휴"] },
  { key: "data_analysis", label: "데이터 분석", short: "데이터", description: "데이터에서 패턴을 찾아 의사결정을 돕는다.", aliases: ["데이터", "data", "분석", "analyst", "ba", "bi", "data analyst"] },
  { key: "software_dev", label: "소프트웨어 개발", short: "개발", description: "요구사항을 코드로 구현하고 문제를 해결한다.", aliases: ["개발", "developer", "engineer", "backend", "백엔드", "frontend", "프론트엔드", "소프트웨어", "프로그래밍", "swe", "웹개발", "앱개발"] },
  { key: "design", label: "디자인", short: "디자인", description: "사용자 경험과 화면을 설계·시각화한다.", aliases: ["디자인", "design", "ux", "ui", "product designer", "bx", "그래픽"] },
  { key: "operations_cx", label: "운영·고객경험", short: "운영·CX", description: "서비스 운영과 고객 경험을 관리하고 문제를 해결한다.", aliases: ["운영", "cx", "cs", "고객경험", "operations", "ops", "고객 응대", "customer"] },
  { key: "hr", label: "인사·채용", short: "인사", description: "사람과 조직을 다루고 채용·성장을 돕는다.", aliases: ["인사", "hr", "채용", "recruiting", "people", "hrd", "조직"] },
  { key: "finance", label: "재무·회계", short: "재무", description: "숫자와 자금을 다루고 재무 의사결정을 돕는다.", aliases: ["재무", "회계", "finance", "accounting", "fp&a", "경영관리"] }
];

const FAMILY_BY_KEY: Record<string, JobFamily> = Object.fromEntries(JOB_FAMILIES.map((f) => [f.key, f]));
export function isJobFamilyKey(x: unknown): x is string {
  return typeof x === "string" && Object.prototype.hasOwnProperty.call(FAMILY_BY_KEY, x);
}
export function getJobFamily(key: string): JobFamily | undefined {
  return FAMILY_BY_KEY[key];
}
// LLM 이 준 role/직무명 문자열을 직무군으로 매핑(정확 키 우선, 없으면 alias 부분일치).
export function resolveJobFamily(roleOrKey: string): string | null {
  const s = (roleOrKey || "").trim().toLowerCase();
  if (!s) return null;
  if (FAMILY_BY_KEY[s]) return s;
  for (const f of JOB_FAMILIES) {
    if (f.label.toLowerCase() === s || f.short.toLowerCase() === s) return f.key;
  }
  for (const f of JOB_FAMILIES) {
    if (f.aliases.some((a) => s.includes(a.toLowerCase()) || a.toLowerCase().includes(s))) return f.key;
  }
  return null;
}

// ── JSON 필드 zod 스키마(타입 검증) ─────────────────────────
export const ExperienceStructuredSchema = z.object({
  situation: z.string().max(1000).optional().default(""),
  task: z.string().max(1000).optional().default(""),
  actions: z.array(z.string().max(500)).max(12).optional().default([]),
  result: z.string().max(1000).optional().default(""),
  evidence: z.string().max(1000).optional().default("")
});
export type ExperienceStructured = z.infer<typeof ExperienceStructuredSchema>;

export const ExperienceCardSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().max(60).optional().default(""),
  structuredData: ExperienceStructuredSchema.optional().default({}),
  skills: z.array(z.string().max(60)).max(20).optional().default([]),
  strengths: z.array(z.string().max(60)).max(12).optional().default([]),
  relatedJobFamilies: z.array(z.string().max(40)).max(10).optional().default([]),
  source: z.string().max(40).optional().default("experience_mining"),
  confidence: z.number().min(0).max(1).optional(),
  userConfirmed: z.boolean().optional().default(false)
});
export type ExperienceCard = z.infer<typeof ExperienceCardSchema>;

export const TARGET_STATUSES = ["provisional", "exploring", "confirmed", "rejected"] as const;
export type TargetStatus = (typeof TARGET_STATUSES)[number];
export const TARGET_TYPES = ["primary", "challenge", "alternative"] as const;
export type TargetType = (typeof TARGET_TYPES)[number];

