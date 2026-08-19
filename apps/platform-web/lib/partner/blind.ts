// 블라인드 표기 — 연결/면접 전에는 이름 대신 '직무 + 코드네임'을 정체성으로 노출(능력 중심).
// 예: "백엔드 개발자 #A3F2". 직무가 없으면 "인재 #A3F2". 코드네임은 candidateUserId로부터
// 결정적으로 생성해 같은 인재는 항상 같은 코드가 붙는다.
import type { PlatformT } from "../i18n";

// FNV-1a 32bit → base36 4자리. 결정적(같은 id → 같은 코드).
export function talentCode(id?: string | null): string {
  const s = (id ?? "").trim();
  if (!s) return "";
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36).toUpperCase().slice(0, 4).padStart(4, "0");
}

export function blindTalentName(_t: PlatformT, _role?: string | null, id?: string | null): string {
  // 마스킹 인재명은 'APLY 블라인드 인재'로 통일하고, 구분용 코드네임을 붙인다
  // (예: "APLY 블라인드 인재 #A3F2"). 같은 인재는 항상 같은 코드. 직무는 카드의 별도 필드로 노출.
  const base = "APLY 블라인드 인재";
  const code = talentCode(id);
  return code ? `${base} #${code}` : base;
}
