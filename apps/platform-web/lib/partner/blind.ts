// 블라인드 표기 — 연결/면접 전에는 이름 대신 '직무'를 정체성으로 노출(능력 중심).
// 직무가 없으면 중립 문구로 폴백.
import type { PlatformT } from "../i18n";

export function blindTalentName(t: PlatformT, role?: string | null): string {
  const r = (role ?? "").trim();
  return r || t("블라인드 인재", "Blind talent", "盲选人才", "Nhân tài ẩn", "ブラインド人材", "Talenta anonim");
}
