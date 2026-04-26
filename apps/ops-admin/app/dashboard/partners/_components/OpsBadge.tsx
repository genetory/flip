import { ReactNode } from "react";

export type PartnerOrgRole = "OWNER" | "ADMIN" | "MEMBER";
export type OpsBadgeTone =
  | "status-pending"
  | "status-approved"
  | "status-rejected"
  | "role-owner"
  | "role-admin"
  | "role-member";

const toneClassMap: Record<OpsBadgeTone, string> = {
  "status-pending": "ops-status-pending",
  "status-approved": "ops-status-approved",
  "status-rejected": "ops-status-rejected",
  "role-owner": "ops-role-owner",
  "role-admin": "ops-role-admin",
  "role-member": "ops-role-member"
};

export function toneFromPartnerOrgRole(role: PartnerOrgRole): OpsBadgeTone {
  if (role === "OWNER") return "role-owner";
  if (role === "ADMIN") return "role-admin";
  return "role-member";
}

export function toneFromEmailVerified(emailVerified: boolean): OpsBadgeTone {
  return emailVerified ? "status-approved" : "status-rejected";
}

export function getOpsBadgeClassName(tone: OpsBadgeTone, className?: string) {
  return ["ops-status-badge", toneClassMap[tone], className].filter(Boolean).join(" ");
}

type OpsBadgeProps = {
  tone: OpsBadgeTone;
  children: ReactNode;
  className?: string;
};

export function OpsBadge({ tone, children, className }: OpsBadgeProps) {
  return <span className={getOpsBadgeClassName(tone, className)}>{children}</span>;
}
