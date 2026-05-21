// Sanity check saju pillar computation against published manse-ryeok
// values. The day-pillar anchor (1984-01-31 = 갑자일) was calibrated
// against a real published birthday (1987-08-12 = 계사일).
//
// Run: npx tsx apps/api/scripts/verify-saju-pillars.ts
import { computeSajuPillars } from "../src/saju/saju-llm";

const gold: Array<{ birthDate: string; birthTime?: string; expect: string; note: string }> = [
  {
    birthDate: "1987-08-12",
    birthTime: "10:00",
    expect: "year=정묘 month=무신 day=계사 hour=정사",
    note: "Published manse: 정묘년 무신월 계사일 정사시 (calibration anchor)"
  },
  {
    birthDate: "1984-01-31",
    expect: "year=계해 month=을축 day=갑자",
    note: "1984-01-31 = 갑자일 (60-cycle reset). Year=계해 because before 입춘."
  },
  {
    birthDate: "1984-02-10",
    birthTime: "12:00",
    expect: "year=갑자 month=병인 day=갑술 hour=경오",
    note: "1984-02-10 — well after 입춘, fully in 갑자년 인월."
  }
];

const inspect: Array<{ birthDate: string; birthTime?: string }> = [
  { birthDate: "1990-01-01", birthTime: "12:00" },
  { birthDate: "1995-11-08", birthTime: "22:30" },
  { birthDate: "2000-07-15", birthTime: "10:00" },
  { birthDate: "2024-04-08", birthTime: "14:00" }
];

let pass = 0;
let fail = 0;
console.log("=== Gold cases (must pass) ===");
for (const c of gold) {
  const p = computeSajuPillars(c.birthDate, c.birthTime ?? null);
  const got = `year=${p.yearKo.slice(0, 2)} month=${p.monthKo.slice(0, 2)} day=${p.dayKo.slice(0, 2)}${p.hourKo ? ` hour=${p.hourKo.slice(0, 2)}` : ""}`;
  const ok = got === c.expect;
  if (ok) pass += 1;
  else fail += 1;
  console.log(`${ok ? "✓" : "✗"} ${c.birthDate} ${c.birthTime ?? ""}  ${c.note}`);
  console.log(`    expected: ${c.expect}`);
  console.log(`    got     : ${got}`);
}

console.log("\n=== Inspection (cross-check manually) ===");
for (const c of inspect) {
  const p = computeSajuPillars(c.birthDate, c.birthTime ?? null);
  console.log(`${c.birthDate} ${c.birthTime ?? ""}  →  연 ${p.yearKo.slice(0, 2)} · 월 ${p.monthKo.slice(0, 2)} · 일 ${p.dayKo.slice(0, 2)}${p.hourKo ? ` · 시 ${p.hourKo.slice(0, 2)}` : ""}`);
}

console.log(`\n${pass}/${pass + fail} gold cases passed`);
process.exit(fail === 0 ? 0 : 1);
