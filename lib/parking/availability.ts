import type { ComputedAvailability } from "./constants";

type SpotLike = {
  id: number;
  status: string;
};

type AssignmentLike = {
  spotId: number;
  endDate: Date | null;
};

type VisitLike = {
  spotId: number | null;
  validFrom: Date;
  validTo: Date;
  status: string;
};

function isVisitActive(visit: VisitLike, now: Date): boolean {
  if (visit.status === "cancelled") return false;
  return visit.validFrom <= now && visit.validTo >= now;
}

export function computeSpotAvailability(
  spot: SpotLike,
  assignments: AssignmentLike[],
  visits: VisitLike[],
  now: Date = new Date()
): ComputedAvailability {
  if (spot.status === "maintenance") return "maintenance";
  if (spot.status === "reserved") return "reserved";

  const hasActiveAssignment = assignments.some(
    (a) => a.spotId === spot.id && a.endDate === null
  );
  if (hasActiveAssignment) return "occupied";

  const hasActiveVisit = visits.some(
    (v) => v.spotId === spot.id && isVisitActive(v, now)
  );
  if (hasActiveVisit) return "occupied";

  return "available";
}

export function resolveVisitStatus(
  storedStatus: string,
  validFrom: Date,
  validTo: Date,
  now: Date = new Date()
): string {
  if (storedStatus === "cancelled") return "cancelled";
  if (now < validFrom) return "scheduled";
  if (now > validTo) return "expired";
  return "active";
}

export function aggregateAvailabilityCounts(
  spots: SpotLike[],
  assignments: AssignmentLike[],
  visits: VisitLike[],
  now?: Date
): {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
  reserved: number;
} {
  const counts = {
    total: spots.length,
    available: 0,
    occupied: 0,
    maintenance: 0,
    reserved: 0,
  };

  for (const spot of spots) {
    const avail = computeSpotAvailability(spot, assignments, visits, now);
    if (avail === "available") counts.available++;
    else if (avail === "occupied") counts.occupied++;
    else if (avail === "maintenance") counts.maintenance++;
    else if (avail === "reserved") counts.reserved++;
  }

  return counts;
}
