import type { PublicPositionListItem } from "./member-profile-client";

// Aply 포지션 → 분석/면접용 JD 텍스트(담당업무·자격요건·우대 등을 합침). AI 입력용.
export function positionToJobText(p: PublicPositionListItem): string {
  const company = p.partnerOrganization?.name ?? p.sourceCompanyName ?? "";
  const parts: string[] = [`[${p.title}]`];
  if (company) parts.push(`회사: ${company}`);
  if (p.preferredJobRole) parts.push(`직무: ${p.preferredJobRole}`);
  if (p.mainResponsibilities) parts.push(`담당업무:\n${p.mainResponsibilities}`);
  if (p.requiredQualifications) parts.push(`자격요건:\n${p.requiredQualifications}`);
  if (p.preferredQualifications) parts.push(`우대사항:\n${p.preferredQualifications}`);
  if (p.additionalNotes) parts.push(`기타:\n${p.additionalNotes}`);
  return parts.join("\n\n").slice(0, 6000);
}
