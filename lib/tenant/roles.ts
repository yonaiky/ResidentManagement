import type { TenantRole } from "@/lib/tenant/constants";
import { TENANT_ROLES } from "@/lib/tenant/constants";

/** Map tenant membership role → legacy Profile.role for nav / auth helpers */
export function membershipRoleToProfileRole(role: string): string {
  if (role === "tenant_admin") return "admin";
  return role;
}

/** Map UI / Profile role → TenantMembership.role */
export function profileRoleToMembershipRole(role: string): TenantRole {
  if (role === "admin" || role === "tenant_admin") return "tenant_admin";
  if (role === "manager") return "manager";
  if (role === "technician") return "technician";
  return "user";
}

export function isValidTenantRole(role: string): role is TenantRole {
  return (TENANT_ROLES as readonly string[]).includes(role);
}

export function getTenantRoleLabel(role: string): string {
  switch (role) {
    case "tenant_admin":
    case "admin":
      return "Administrador";
    case "manager":
      return "Gerente";
    case "technician":
      return "Técnico";
    case "user":
      return "Usuario";
    case "platform_admin":
      return "Admin plataforma";
    default:
      return role;
  }
}
