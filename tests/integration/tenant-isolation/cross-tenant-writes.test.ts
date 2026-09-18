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
import { POST as createAssignment } from "@/app/api/parking/assignments/route";
import { PATCH as assignTicket } from "@/app/api/tickets/[id]/assign/route";

const hasDb = Boolean(process.env.DATABASE_URL);

function postJson(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe.skipIf(!hasDb)("cross-tenant writes", () => {
  let seed: TwoTenantSeed;

  beforeAll(async () => {
    seed = await seedTwoTenants();
  });

  afterAll(async () => {
    await cleanupTwoTenants(seed);
  });

  describe("POST /api/parking/assignments", () => {
    it("rejects a spot belonging to another tenant", async () => {
      vi.mocked(requireTenantManager).mockResolvedValue(
        mockAuthContext(seed.tenantA.id, seed.profileA.id, seed.orgA.id)
      );

      const res = await createAssignment(
        postJson("http://localhost/api/parking/assignments", {
          spotId: seed.spotB.id,
          vehicleId: seed.vehicleA.id,
        })
      );

      expect(res.status).toBe(404);
      const created = await prisma.parkingAssignment.count({
        where: { spotId: seed.spotB.id },
      });
      expect(created).toBe(0);
    });

    it("rejects a vehicle belonging to another tenant", async () => {
      vi.mocked(requireTenantManager).mockResolvedValue(
        mockAuthContext(seed.tenantA.id, seed.profileA.id, seed.orgA.id)
      );

      const res = await createAssignment(
        postJson("http://localhost/api/parking/assignments", {
          spotId: seed.spotA.id,
          vehicleId: seed.vehicleB.id,
        })
      );

      expect(res.status).toBe(404);
      const created = await prisma.parkingAssignment.count({
        where: { vehicleId: seed.vehicleB.id },
      });
      expect(created).toBe(0);
    });

    it("still allows an assignment inside the caller's tenant", async () => {
      vi.mocked(requireTenantManager).mockResolvedValue(
        mockAuthContext(seed.tenantA.id, seed.profileA.id, seed.orgA.id)
      );

      const res = await createAssignment(
        postJson("http://localhost/api/parking/assignments", {
          spotId: seed.spotA.id,
          vehicleId: seed.vehicleA.id,
        })
      );

      expect(res.status).toBe(201);
      const created = await prisma.parkingAssignment.count({
        where: { spotId: seed.spotA.id, vehicleId: seed.vehicleA.id },
      });
      expect(created).toBe(1);
    });
  });

  describe("PATCH /api/tickets/[id]/assign", () => {
    it("rejects an assignee who is not a member of the tenant", async () => {
      vi.mocked(requireTenantManager).mockResolvedValue(
        mockAuthContext(seed.tenantA.id, seed.profileA.id, seed.orgA.id)
      );

      const res = await assignTicket(
        postJson("http://localhost/api/tickets/assign", {
          assignedToId: seed.profileB.id,
        }),
        { params: { id: String(seed.ticketA.id) } }
      );

      expect(res.status).toBe(404);
      const ticket = await prisma.maintenanceTicket.findUnique({
        where: { id: seed.ticketA.id },
        select: { assignedToId: true },
      });
      expect(ticket?.assignedToId).toBeNull();
    });

    it("still allows an assignee inside the caller's tenant", async () => {
      vi.mocked(requireTenantManager).mockResolvedValue(
        mockAuthContext(seed.tenantA.id, seed.profileA.id, seed.orgA.id)
      );

      const res = await assignTicket(
        postJson("http://localhost/api/tickets/assign", {
          assignedToId: seed.profileA.id,
        }),
        { params: { id: String(seed.ticketA.id) } }
      );

      expect(res.status).toBe(200);
      const ticket = await prisma.maintenanceTicket.findUnique({
        where: { id: seed.ticketA.id },
        select: { assignedToId: true },
      });
      expect(ticket?.assignedToId).toBe(seed.profileA.id);
    });
  });
});
