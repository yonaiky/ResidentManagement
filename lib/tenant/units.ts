import type { Unit } from "@prisma/client";

type OccupancyLike = {
  role: string;
  status: string;
  resident: { id: number; name: string; lastName: string };
};

export function computeUnitStatus(
  unit: Pick<Unit, "status">,
  activeOccupancies: OccupancyLike[]
): string {
  if (unit.status === "maintenance" || unit.status === "reserved" || unit.status === "inactive") {
    return unit.status;
  }
  if (activeOccupancies.length > 0) return "occupied";
  return "available";
}

export function getOccupancyDisplayName(o: OccupancyLike): string {
  return `${o.resident.name} ${o.resident.lastName}`.trim();
}
