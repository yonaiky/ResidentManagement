export type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
};

export type PropertySummary = {
  id: string;
  name: string;
  code: string;
  propertyType: string;
};

export type TenantContext = {
  tenantId: string;
  propertyId: string | null;
  membershipRole: string;
  userId: string;
  isPlatformAdmin: boolean;
};

export type AuthTenantUser = {
  userId: string;
  username: string;
  email: string;
  profileRole: string;
  ctx: TenantContext;
};

export type PropertyListItem = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  propertyType: string;
  unitCount: number;
  occupiedCount: number;
  occupancyRate: number;
  createdAt: string;
};

export type UnitMapItem = {
  id: string;
  code: string;
  unitType: string;
  floor: number | null;
  status: string;
  computedStatus: string;
  structureName: string | null;
  owner: { id: number; name: string } | null;
  tenantOccupant: { id: number; name: string } | null;
};

export type UnitDetail = UnitMapItem & {
  bedrooms: number | null;
  areaSqm: number | null;
  propertyId: string;
  structureId: string | null;
  occupancies: {
    id: string;
    role: string;
    status: string;
    startDate: string;
    endDate: string | null;
    resident: { id: number; name: string; lastName: string; cedula: string };
  }[];
};
