export const SPOT_TYPES = [
  { value: "resident", label: "Residente" },
  { value: "visitor", label: "Visitante" },
  { value: "handicap", label: "Discapacitado" },
  { value: "motorcycle", label: "Motocicleta" },
] as const;

export const SPOT_STATUSES = [
  { value: "available", label: "Disponible" },
  { value: "maintenance", label: "Mantenimiento" },
  { value: "reserved", label: "Reservado" },
] as const;

export const VISIT_STATUSES = [
  { value: "scheduled", label: "Programada" },
  { value: "active", label: "Activa" },
  { value: "expired", label: "Expirada" },
  { value: "cancelled", label: "Cancelada" },
] as const;

export const FINE_STATUSES = [
  { value: "pending", label: "Pendiente" },
  { value: "paid", label: "Pagada" },
  { value: "waived", label: "Perdonada" },
] as const;

export type SpotType = (typeof SPOT_TYPES)[number]["value"];
export type SpotStatus = (typeof SPOT_STATUSES)[number]["value"];
export type VisitStatus = (typeof VISIT_STATUSES)[number]["value"];
export type FineStatus = (typeof FINE_STATUSES)[number]["value"];

export type ComputedAvailability =
  | "available"
  | "occupied"
  | "maintenance"
  | "reserved";

export const AVAILABILITY_LABELS: Record<ComputedAvailability, string> = {
  available: "Disponible",
  occupied: "Ocupado",
  maintenance: "Mantenimiento",
  reserved: "Reservado",
};

export function getSpotTypeLabel(value: string): string {
  return SPOT_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function getSpotStatusLabel(value: string): string {
  return SPOT_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function getVisitStatusLabel(value: string): string {
  return VISIT_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function getFineStatusLabel(value: string): string {
  return FINE_STATUSES.find((s) => s.value === value)?.label ?? value;
}
