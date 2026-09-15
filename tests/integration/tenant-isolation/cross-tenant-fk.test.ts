import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  seedTwoTenants,
  cleanupTwoTenants,
  mockAuthContext,
  type TwoTenantSeed,
} from "../../helpers/seed-two-tenants";

vi.mock("@/lib/tenant/auth", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/tenant/auth")>();
  return {
    ...original,
    requireTenantAuth: vi.fn(),
    requireTenantManager: vi.fn(),
  };
});

import { requireTenantManager } from "@/lib/tenant/auth";
import { registerPayment } from "@/lib/finance/payments";
import { createReservation } from "@/lib/reservations/service";
import { PATCH as patchVisit } from "@/app/api/parking/visits/[id]/route";
import { POST as createUnit } from "@/app/api/properties/[id]/units/route";
import { POST as createStructure } from "@/app/api/properties/[id]/structures/route";

const hasDb = Boolean(process.env.DATABASE_URL);

function jsonRequest(url: string, body: unknown, method = "POST"): NextRequest {
  return new NextRequest(url, {
    method,
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

// Every case here sends a foreign key that belongs to tenant B while
// authenticated as tenant A. A pre-fix build linked the row across tenants.
describe.skipIf(!hasDb)("cross-tenant foreign keys are rejected", () => {
  let seed: TwoTenantSeed;

  beforeAll(async () => {
    seed = await seedTwoTenants();
  });

  afterAll(async () => {
    await cleanupTwoTenants(seed);
  });

  it("PATCH /api/parking/visits/[id] rejects a spot from another tenant", async () => {
    vi.mocked(requireTenantManager).mockResolvedValue(
      mockAuthContext(seed.tenantA.id, seed.profileA.id, seed.orgA.id),
    );

    const res = await patchVisit(
      jsonRequest(
        "http://localhost/api/parking/visits/1",
        { spotId: seed.spotB.id },
        "PATCH",
      ),
      { params: { id: String(seed.visitA.id) } },
    );

    expect(res.status).toBe(404);
    const visit = await prisma.parkingVisit.findUnique({
      where: { id: seed.visitA.id },
      select: { spotId: true },
    });
    expect(visit?.spotId).toBeNull();
  });

  it("PATCH /api/parking/visits/[id] still accepts a spot from the same tenant", async () => {
    vi.mocked(requireTenantManager).mockResolvedValue(
      mockAuthContext(seed.tenantA.id, seed.profileA.id, seed.orgA.id),
    );

    const res = await patchVisit(
      jsonRequest(
        "http://localhost/api/parking/visits/1",
        { spotId: seed.spotA.id },
        "PATCH",
      ),
      { params: { id: String(seed.visitA.id) } },
    );

    expect(res.status).toBe(200);
    const visit = await prisma.parkingVisit.findUnique({
      where: { id: seed.visitA.id },
      select: { spotId: true },
    });
    expect(visit?.spotId).toBe(seed.spotA.id);
  });

  it("registerPayment rejects a resident from another tenant", async () => {
    await expect(
      registerPayment({
        tenantId: seed.tenantA.id,
        organizationId: seed.orgA.id,
        unitId: seed.unitA.id,
        amount: 100,
        residentId: seed.residentB.id,
        registeredByUserId: seed.profileA.id,
      }),
    ).rejects.toThrow(/Resident not found/);

    const leaked = await prisma.payment.count({
      where: { tenantId: seed.tenantA.id, residentId: seed.residentB.id },
    });
    expect(leaked).toBe(0);
  });

  it("createReservation rejects a resident from another tenant", async () => {
    await expect(
      createReservation({
        tenantId: seed.tenantA.id,
        organizationId: seed.orgA.id,
        commonAreaId: seed.commonAreaA.id,
        unitId: seed.unitA.id,
        residentId: seed.residentB.id,
        startAt: new Date(Date.now() + 86_400_000),
        endAt: new Date(Date.now() + 90_000_000),
        createdByUserId: seed.profileA.id,
      }),
    ).rejects.toThrow(/Residente no encontrado/);

    const leaked = await prisma.reservation.count({
      where: { tenantId: seed.tenantA.id, residentId: seed.residentB.id },
    });
    expect(leaked).toBe(0);
  });

  it("POST /api/properties/[id]/units rejects a structure from another property", async () => {
    vi.mocked(requireTenantManager).mockResolvedValue(
      mockAuthContext(seed.tenantA.id, seed.profileA.id, seed.orgA.id),
    );

    const res = await createUnit(
      jsonRequest(`http://localhost/api/properties/x/units`, {
        code: "IDOR-1",
        structureId: seed.structureB.id,
      }),
      { params: { id: seed.propertyA.id } },
    );

    expect(res.status).toBe(404);
    const leaked = await prisma.unit.count({
      where: { structureId: seed.structureB.id },
    });
    expect(leaked).toBe(0);
  });

  it("POST /api/properties/[id]/structures rejects a parent from another property", async () => {
    vi.mocked(requireTenantManager).mockResolvedValue(
      mockAuthContext(seed.tenantA.id, seed.profileA.id, seed.orgA.id),
    );

    const res = await createStructure(
      jsonRequest(`http://localhost/api/properties/x/structures`, {
        name: "IDOR tower",
        structureType: "tower",
        parentId: seed.structureB.id,
      }),
      { params: { id: seed.propertyA.id } },
    );

    expect(res.status).toBe(404);
    const leaked = await prisma.structure.count({
      where: { parentId: seed.structureB.id },
    });
    expect(leaked).toBe(0);
  });
});
