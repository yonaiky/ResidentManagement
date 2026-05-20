export type SpotFilters = {
  zone?: string;
  spotType?: string;
  status?: string;
  availability?: string;
  search?: string;
};

export type VehicleFilters = {
  residentId?: number;
  plate?: string;
  activeOnly?: boolean;
};

export type VisitFilters = {
  residentId?: number;
  plate?: string;
  status?: string;
  from?: Date;
  to?: Date;
};

export type FineFilters = {
  status?: string;
  plate?: string;
  residentId?: number;
};

export function parseSpotFilters(params: URLSearchParams): SpotFilters {
  return {
    zone: params.get("zone") || undefined,
    spotType: params.get("spotType") || undefined,
    status: params.get("status") || undefined,
    availability: params.get("availability") || undefined,
    search: params.get("search")?.trim() || undefined,
  };
}

export function parseVehicleFilters(params: URLSearchParams): VehicleFilters {
  const residentId = params.get("residentId");
  return {
    residentId: residentId ? parseInt(residentId, 10) : undefined,
    plate: params.get("plate")?.trim() || undefined,
    activeOnly: params.get("activeOnly") !== "false",
  };
}

export function parseVisitFilters(params: URLSearchParams): VisitFilters {
  const residentId = params.get("residentId");
  const from = params.get("from");
  const to = params.get("to");
  return {
    residentId: residentId ? parseInt(residentId, 10) : undefined,
    plate: params.get("plate")?.trim() || undefined,
    status: params.get("status") || undefined,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  };
}

export function parseFineFilters(params: URLSearchParams): FineFilters {
  const residentId = params.get("residentId");
  return {
    status: params.get("status") || undefined,
    plate: params.get("plate")?.trim() || undefined,
    residentId: residentId ? parseInt(residentId, 10) : undefined,
  };
}
