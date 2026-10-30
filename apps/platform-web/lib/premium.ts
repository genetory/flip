// APLY PREMIUM 얼리 액세스(/premium) — 선택지 코드는 API(premiumApplySchema)와 같은 값이다.
// 화면 문구는 언어마다 다르게 보여도 저장은 늘 이 코드로. 새 언어는 L 에 칸만 더하면 된다.
import { pickLocale } from "./i18n";
import type { PlatformLocale } from "./auth-messages";

/** [ko, en, zh, vi, ja, id] — 비우면 영어로 보인다. */
export type L = [string, string, string?, string?, string?, string?];
export const tl = (locale: PlatformLocale, l: L) => pickLocale(locale, ...l);

export const PREMIUM_PLAN_CODES = ["START", "PRO", "GUARANTEE"] as const;
export type PremiumPlan = (typeof PREMIUM_PLAN_CODES)[number] | "UNDECIDED";

export const PREMIUM_DEGREES: { code: string; label: L }[] = [
  { code: "BACHELOR", label: ["학사", "Bachelor's"] },
  { code: "MASTER", label: ["석사", "Master's"] },
  { code: "DOCTORATE", label: ["박사", "Doctorate"] },
  { code: "GRADUATED", label: ["졸업", "Graduated"] },
  { code: "OTHER", label: ["기타", "Other"] }
];

export const PREMIUM_VISAS: { code: string; label: L }[] = [
  { code: "D2", label: ["D-2", "D-2"] },
  { code: "D10", label: ["D-10", "D-10"] },
  { code: "F", label: ["F 계열", "F series"] },
  { code: "E7", label: ["E-7", "E-7"] },
  { code: "OTHER", label: ["기타", "Other"] },
  { code: "UNKNOWN", label: ["모름", "Not sure"] }
];

export const PREMIUM_PLAN_OPTIONS: { code: PremiumPlan; label: L }[] = [
  { code: "START", label: ["START", "START"] },
  { code: "PRO", label: ["PRO", "PRO"] },
  { code: "GUARANTEE", label: ["GUARANTEE", "GUARANTEE"] },
  { code: "UNDECIDED", label: ["아직 모르겠어요", "Not sure yet"] }
];

/** 졸업 시기 — 이미 졸업 · 이번 반기부터 3년치 반기 · 그 이후. 코드: GRADUATED | 2027-H1 | LATER */
export function graduationOptions(now = new Date()): { code: string; label: L }[] {
  const out: { code: string; label: L }[] = [{ code: "GRADUATED", label: ["이미 졸업했어요", "Already graduated"] }];
  let y = now.getFullYear();
  let h = now.getMonth() < 6 ? 1 : 2;
  for (let i = 0; i < 6; i += 1) {
    out.push({ code: `${y}-H${h}`, label: [`${y}년 ${h === 1 ? "상반기" : "하반기"}`, `${h === 1 ? "Early" : "Late"} ${y}`] });
    if (h === 2) {
      y += 1;
      h = 1;
    } else h = 2;
  }
  out.push({ code: "LATER", label: [`${y}년 이후`, `${y} or later`] });
  return out;
}
