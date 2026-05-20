import { computeUnitStatus, getOccupancyDisplayName } from "./units";
import type { PropertyListItem, UnitDetail, UnitMapItem } from "./types";

type PropertyRow = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  propertyType: string;
  createdAt: Date;
  units: {
    id: string;
    status: string;
    occupancies: {
      role: string;
      status: string;
      resident: { id: number; name: string; lastName: string };
    }[];
  }[];
};

export function serializePropertyListItem(p: PropertyRow): PropertyListItem {
  const unitCount = p.units.length;
  const occupiedCount = p.units.filter((u) => {
    const active = u.occupancies.filter((o) => o.status === "active");
    return computeUnitStatus({ status: u.status }, active) === "occupied";
  }).length;

  return {
    id: p.id,
    name: p.name,
    code: p.code,
    address: p.address,
    propertyType: p.propertyType,
    unitCount,
    occupiedCount,
    occupancyRate: unitCount === 0 ? 0 : Math.round((occupiedCount / unitCount) * 100),
    createdAt: p.createdAt.toISOString(),
  };
}

type UnitRow = {
  id: string;
  code: string;
  unitType: string;
  floor: number | null;
  bedrooms: number | null;
  areaSqm: number | null;
  status: string;
  propertyId: string;
  structureId: string | null;
  structure: { name: string } | null;
  occupancies: {
    id: string;
    role: string;
    status: string;
    startDate: Date;
    endDate: Date | null;
    resident: { id: number; name: string; lastName: string; cedula: string };
  }[];
};

export function serializeUnitMapItem(u: UnitRow): UnitMapItem {
  const active = u.occupancies.filter((o) => o.status === "active");
  const computedStatus = computeUnitStatus(u, active);
  const owner = active.find((o) => o.role === "owner");
  const tenantOcc = active.find((o) => o.role === "tenant");

  return {
    id: u.id,
    code: u.code,
    unitType: u.unitType,
    floor: u.floor,
    status: u.status,
    computedStatus,
    structureName: u.structure?.name ?? null,
    owner: owner
      ? { id: owner.resident.id, name: getOccupancyDisplayName(owner) }
      : null,
    tenantOccupant: tenantOcc
      ? { id: tenantOcc.resident.id, name: getOccupancyDisplayName(tenantOcc) }
      : null,
  };
}

export function serializeUnitDetail(u: UnitRow): UnitDetail {
  const base = serializeUnitMapItem(u);
  return {
    ...base,
    bedrooms: u.bedrooms,
    areaSqm: u.areaSqm,
    propertyId: u.propertyId,
    structureId: u.structureId,
    occupancies: u.occupancies.map((o) => ({
      id: o.id,
      role: o.role,
      status: o.status,
      startDate: o.startDate.toISOString(),
      endDate: o.endDate?.toISOString() ?? null,
      resident: o.resident,
    })),
  };
}
