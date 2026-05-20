export const TENANT_COOKIE = "rm-tenant-id";
export const PROPERTY_COOKIE = "rm-property-id";

export const TENANT_ROLES = [
  "tenant_admin",
  "manager",
  "user",
  "technician",
] as const;

export type TenantRole = (typeof TENANT_ROLES)[number];

export const TENANT_STATUS = ["TRIAL", "ACTIVE", "SUSPENDED", "CANCELLED"] as const;

export const UNIT_TYPES = [
  { value: "apartment", label: "Apartamento" },
  { value: "villa", label: "Villa" },
  { value: "penthouse", label: "Penthouse" },
  { value: "commercial", label: "Comercial" },
  { value: "other", label: "Otro" },
] as const;

export const UNIT_STATUSES = [
  { value: "available", label: "Disponible" },
  { value: "occupied", label: "Ocupada" },
  { value: "maintenance", label: "Mantenimiento" },
  { value: "reserved", label: "Reservada" },
  { value: "inactive", label: "Inactiva" },
] as const;

export const STRUCTURE_TYPES = [
  { value: "tower", label: "Torre" },
  { value: "block", label: "Bloque" },
  { value: "wing", label: "Ala" },
  { value: "floor", label: "Piso" },
  { value: "zone", label: "Zona" },
] as const;

export const OCCUPANCY_ROLES = [
  { value: "owner", label: "Propietario" },
  { value: "tenant", label: "Inquilino" },
] as const;

export const PROPERTY_TYPES = [
  { value: "condominium", label: "Condominio" },
  { value: "villas", label: "Villas" },
  { value: "mixed", label: "Mixto" },
] as const;

export function getUnitStatusLabel(v: string) {
  return UNIT_STATUSES.find((s) => s.value === v)?.label ?? v;
}

export function getOccupancyRoleLabel(v: string) {
  return OCCUPANCY_ROLES.find((r) => r.value === v)?.label ?? v;
}
