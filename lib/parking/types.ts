import type { ComputedAvailability } from "./constants";

export type ParkingResidentSummary = {
  id: number;
  name: string;
  lastName: string;
  address: string;
  noRegistro: string | null;
};

export type ParkingSpotItem = {
  id: number;
  code: string;
  zone: string | null;
  spotType: string;
  status: string;
  notes: string | null;
  computedAvailability: ComputedAvailability;
  activeAssignment: ParkingAssignmentSummary | null;
  createdAt: string;
  updatedAt: string;
};

export type ParkingAssignmentSummary = {
  id: number;
  spotId: number;
  spotCode: string;
  vehicleId: number;
  plate: string;
  residentId: number;
  residentName: string;
  startDate: string;
  endDate: string | null;
};

export type VehicleListItem = {
  id: number;
  plate: string;
  make: string | null;
  model: string | null;
  color: string | null;
  isActive: boolean;
  resident: ParkingResidentSummary;
  activeAssignment: ParkingAssignmentSummary | null;
  createdAt: string;
};

export type ParkingVisitItem = {
  id: number;
  plate: string;
  visitorName: string | null;
  visitorDocument?: string | null;
  hostResident: ParkingResidentSummary;
  validFrom: string;
  validTo: string;
  status: string;
  computedStatus: string;
  spot: { id: number; code: string } | null;
  notes: string | null;
  accessCode?: string | null;
  accessExpiresAt?: string | null;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  createdAt: string;
};

export type ParkingFineItem = {
  id: number;
  plate: string;
  amount: number;
  reason: string;
  status: string;
  issuedAt: string;
  dueDate: string | null;
  paidAt: string | null;
  notes: string | null;
  resident: ParkingResidentSummary | null;
  vehicleId: number | null;
  issuedBy: { id: string; username: string } | null;
};

export type ParkingOverview = {
  spots: {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
    reserved: number;
  };
  visitsToday: number;
  activeVisits: number;
  pendingFines: number;
  pendingFinesAmount: number;
  activeVehicles: number;
};

export type AvailabilityResponse = {
  items: ParkingSpotItem[];
};

export type CreateSpotInput = {
  code: string;
  zone?: string;
  spotType?: string;
  status?: string;
  notes?: string;
};

export type CreateVehicleInput = {
  plate: string;
  make?: string;
  model?: string;
  color?: string;
  residentId: number;
};

export type CreateAssignmentInput = {
  spotId: number;
  vehicleId: number;
};

export type CreateVisitInput = {
  plate: string;
  visitorName?: string;
  hostResidentId: number;
  validFrom: string;
  validTo: string;
  spotId?: number;
  notes?: string;
};

export type CreateFineInput = {
  plate: string;
  amount: number;
  reason: string;
  dueDate?: string;
  notes?: string;
  residentId?: number;
};
