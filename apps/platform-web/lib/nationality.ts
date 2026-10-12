// 국적 — 회원 정보(User.nationality)에 ISO-3166 2글자 코드로 저장한다(KR, VN …).
// 국가 이름은 브라우저 내장 Intl.DisplayNames 로 화면 언어에 맞춰 보여 준다(6개 언어 번역을 따로 들지 않는다).
// 운영자가 예전에 글자로 넣은 값('베트남' 등)도 있어서, 코드가 아니면 그대로 보여 준다.

// 한국 외국인 유학생·취업 비자 신청자 분포 기반(VisaLandingPage 와 같은 목록) + 맨 앞에 한국.
export const NATIONALITY_CODES = [
  "KR",
  "VN", "CN", "ID", "MN", "MM", "TH", "JP", "PH", "IN", "BD",
  "PK", "NP", "UZ", "KH", "KZ", "KG", "MY", "SG", "TW", "LK",
  "LA", "TJ", "TM", "RU", "TR", "EG", "NG", "ZA", "KE",
  "US", "GB", "CA", "AU", "NZ", "DE", "FR", "IT", "ES", "NL", "PL", "UA",
  "BR", "MX", "AR", "CL",
  "OTHER"
] as const;

const KOREAN = new Set(["kr", "kor", "korea", "southkorea", "republicofkorea", "대한민국", "한국"]);

/** 국가 이름 — 코드면 화면 언어로, 아니면 저장된 글자 그대로. OTHER 는 otherLabel. */
export function nationalityLabel(value: string | null | undefined, locale: string, otherLabel: string): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  if (v === "OTHER") return otherLabel;
  if (/^[A-Z]{2}$/.test(v)) {
    try {
      return new Intl.DisplayNames([locale], { type: "region" }).of(v) ?? v;
    } catch {
      return v;
    }
  }
  return v;
}

/** 외국인인가 — 국적이 비어 있으면 null(모름), 한국이면 false, 그 밖은 true. */
export function isForeignNationality(value: string | null | undefined): boolean | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  return !KOREAN.has(v.toLowerCase().replace(/[\s.]/g, ""));
}
