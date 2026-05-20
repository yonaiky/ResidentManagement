/** Roles de la aplicación (Profile.role) */
export const APP_ROLES = ["admin", "manager", "user", "technician"] as const;
export type AppRole = (typeof APP_ROLES)[number];

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
      return "Administrador";
    case "manager":
      return "Gerente";
    case "technician":
      return "Técnico";
    case "user":
      return "Usuario";
    default:
      return role;
  }
}
