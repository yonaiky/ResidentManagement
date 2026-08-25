/** Roles de la aplicación (Profile.role) */
export const APP_ROLES = [
  "admin",
  "manager",
  "user",
  "technician",
  "platform_admin",
] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const PLATFORM_ADMIN_PATHS = ["/platform"] as const;

export function isPlatformAdminRole(role: string | undefined): boolean {
  return role === "platform_admin";
}

export function isTechnician(role: string | undefined): boolean {
  return role === "technician";
}

export function isStaff(role: string | undefined): boolean {
  return role === "admin" || role === "manager" || role === "user";
}

/** Rutas permitidas para técnicos (prefijos) */
export const TECHNICIAN_ALLOWED_PATHS = ["/tickets", "/profile"] as const;

export function isTechnicianAllowedPath(pathname: string): boolean {
  return TECHNICIAN_ALLOWED_PATHS.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`)
  );
}

export function getDefaultHomeForRole(role: string | undefined): string {
  if (isTechnician(role)) return "/tickets";
  return "/dashboard";
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case "admin":
    case "tenant_admin":
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
