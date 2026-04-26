export type Role = "USER" | "PARTNER_ADMIN" | "OPS_ADMIN";

export function hasRole(userRole: Role, allowed: Role[]) {
  return allowed.includes(userRole);
}
