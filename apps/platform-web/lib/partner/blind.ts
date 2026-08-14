// 블라인드 코드네임 — 연결/면접 전 후보를 '이름 비공개' 대신 능력 기반의 익명 코드로 구분.
// id(후보 식별자)에서 안정적으로 파생되어 같은 후보는 항상 같은 코드를 갖는다.
import type { PlatformT } from "../i18n";

export function blindCode(id: string): string {
  const clean = (id || "").replace(/[^a-zA-Z0-9]/g, "");
  return (clean.slice(0, 4) || "0000").toUpperCase();
}

export function blindTalentName(t: PlatformT, id: string): string {
  return `${t("인재", "Talent", "人才", "Nhân tài", "人材", "Talenta")} #${blindCode(id)}`;
}
