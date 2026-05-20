import {
  computeSpotAvailability,
  resolveVisitStatus,
} from "./availability";
import type {
  ParkingAssignmentSummary,
  ParkingFineItem,
  ParkingResidentSummary,
  ParkingSpotItem,
  ParkingVisitItem,
  VehicleListItem,
} from "./types";

type ResidentRow = {
  id: number;
  name: string;
  lastName: string;
  address: string;
  noRegistro: string | null;
};

type AssignmentRow = {
  id: number;
  spotId: number;
  vehicleId: number;
  residentId: number;
  startDate: Date;
  endDate: Date | null;
  spot: { code: string };
  vehicle: { plate: string };
  resident: ResidentRow;
};

type SpotRow = {
  id: number;
  code: string;
  zone: string | null;
  spotType: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeResident(r: ResidentRow): ParkingResidentSummary {
  return {
    id: r.id,
    name: r.name,
    lastName: r.lastName,
    address: r.address,
    noRegistro: r.noRegistro,
  };
}

export function serializeAssignment(
  a: AssignmentRow
): ParkingAssignmentSummary {
  return {
    id: a.id,
    spotId: a.spotId,
    spotCode: a.spot.code,
    vehicleId: a.vehicleId,
    plate: a.vehicle.plate,
    residentId: a.residentId,
    residentName: `${a.resident.name} ${a.resident.lastName}`,
    startDate: a.startDate.toISOString(),
    endDate: a.endDate?.toISOString() ?? null,
  };
}

export function serializeSpot(
  spot: SpotRow,
  activeAssignments: AssignmentRow[],
  activeVisits: { spotId: number | null; validFrom: Date; validTo: Date; status: string }[]
): ParkingSpotItem {
  const assignmentForSpot = activeAssignments.find(
    (a) => a.spotId === spot.id && a.endDate === null
  );
  const computedAvailability = computeSpotAvailability(
    spot,
    activeAssignments.map((a) => ({ spotId: a.spotId, endDate: a.endDate })),
    activeVisits.map((v) => ({
      spotId: v.spotId,
      validFrom: v.validFrom,
      validTo: v.validTo,
      status: v.status,
    }))
  );

  return {
    id: spot.id,
    code: spot.code,
    zone: spot.zone,
    spotType: spot.spotType,
    status: spot.status,
    notes: spot.notes,
    computedAvailability,
    activeAssignment: assignmentForSpot
      ? serializeAssignment(assignmentForSpot)
      : null,
    createdAt: spot.createdAt.toISOString(),
    updatedAt: spot.updatedAt.toISOString(),
  };
}

export function serializeVehicle(
  v: {
    id: number;
    plate: string;
    make: string | null;
    model: string | null;
    color: string | null;
    isActive: boolean;
    createdAt: Date;
    resident: ResidentRow;
  },
  activeAssignment: AssignmentRow | null
): VehicleListItem {
  return {
    id: v.id,
    plate: v.plate,
    make: v.make,
    model: v.model,
    color: v.color,
    isActive: v.isActive,
    resident: serializeResident(v.resident),
    activeAssignment: activeAssignment
      ? serializeAssignment(activeAssignment)
      : null,
    createdAt: v.createdAt.toISOString(),
  };
}

export function serializeVisit(
  v: {
    id: number;
    plate: string;
    visitorName: string | null;
    validFrom: Date;
    validTo: Date;
    status: string;
    notes: string | null;
    createdAt: Date;
    hostResident: ResidentRow;
    spot: { id: number; code: string } | null;
  }
): ParkingVisitItem {
  const computedStatus = resolveVisitStatus(v.status, v.validFrom, v.validTo);
  return {
    id: v.id,
    plate: v.plate,
    visitorName: v.visitorName,
    hostResident: serializeResident(v.hostResident),
    validFrom: v.validFrom.toISOString(),
    validTo: v.validTo.toISOString(),
    status: v.status,
    computedStatus,
    spot: v.spot,
    notes: v.notes,
    createdAt: v.createdAt.toISOString(),
  };
}

export function serializeFine(
  f: {
    id: number;
    plate: string;
    amount: number;
    reason: string;
    status: string;
    issuedAt: Date;
    dueDate: Date | null;
    paidAt: Date | null;
    notes: string | null;
    vehicleId: number | null;
    resident: ResidentRow | null;
    issuedBy: { id: string; username: string } | null;
  }
): ParkingFineItem {
  return {
    id: f.id,
    plate: f.plate,
    amount: f.amount,
    reason: f.reason,
    status: f.status,
    issuedAt: f.issuedAt.toISOString(),
    dueDate: f.dueDate?.toISOString() ?? null,
    paidAt: f.paidAt?.toISOString() ?? null,
    notes: f.notes,
    resident: f.resident ? serializeResident(f.resident) : null,
    vehicleId: f.vehicleId,
    issuedBy: f.issuedBy,
  };
}
