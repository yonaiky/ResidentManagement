import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { NextResponse } from "next/server";
import {
  seedTwoTenants,
  cleanupTwoTenants,
  mockAuthContext,
  type TwoTenantSeed,
} from "../../helpers/seed-two-tenants";

vi.mock("@/lib/tenant/auth", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/tenant/auth")>();
  return {
    ...original,
    requireTenantAuth: vi.fn(),
    requireTenantManager: vi.fn(),
  };
});

import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";
import { GET as getResident } from "@/app/api/residents/[id]/route";
import { DELETE as deleteResident } from "@/app/api/residents/[id]/route";
import { GET as getToken } from "@/app/api/tokens/[id]/route";
import { GET as getPendingPayments } from "@/app/api/payments/pending/route";
import { GET as getReports } from "@/app/api/reports/route";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("tenant isolation", () => {
  let seed: TwoTenantSeed;

  beforeAll(async () => {
    seed = await seedTwoTenants();
  });

  afterAll(async () => {
    await cleanupTwoTenants(seed);
  });

  it("TenantA cannot GET ResidentB", async () => {
    vi.mocked(requireTenantAuth).mockResolvedValue(
      mockAuthContext(seed.tenantA.id, seed.profileA.id, seed.orgA.id)
    );

    const res = await getResident(
      new Request("http://localhost"),
      { params: { id: String(seed.residentB.id) } }
    );

    expect(res.status).toBe(404);
  });

  it("TenantA cannot DELETE ResidentB", async () => {
    vi.mocked(requireTenantManager).mockResolvedValue(
      mockAuthContext(seed.tenantA.id, seed.profileA.id, seed.orgA.id)
    );

    const res = await deleteResident(
      new Request("http://localhost", { method: "DELETE" }),
      { params: { id: String(seed.residentB.id) } }
    );

    expect(res.status).toBe(404);
  });

  it("TenantA can GET own ResidentA", async () => {
    vi.mocked(requireTenantAuth).mockResolvedValue(
      mockAuthContext(seed.tenantA.id, seed.profileA.id, seed.orgA.id)
    );

    const res = await getResident(
      new Request("http://localhost"),
      { params: { id: String(seed.residentA.id) } }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(seed.residentA.id);
  });

  it("TenantA cannot GET TokenB", async () => {
    vi.mocked(requireTenantAuth).mockResolvedValue(
      mockAuthContext(seed.tenantA.id, seed.profileA.id, seed.orgA.id)
    );

    const res = await getToken(
      new Request("http://localhost"),
      { params: { id: String(seed.tokenB.id) } }
    );

    expect(res.status).toBe(404);
  });

  it("pending payments only returns TenantA data", async () => {
    vi.mocked(requireTenantAuth).mockResolvedValue(
      mockAuthContext(seed.tenantA.id, seed.profileA.id, seed.orgA.id)
    );

    const res = await getPendingPayments();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { tenantId: string }[];
    for (const p of body) {
      expect(p.tenantId).toBe(seed.tenantA.id);
    }
  });

  it("reports require auth", async () => {
    vi.mocked(requireTenantAuth).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );

    const res = await getReports(
      new Request("http://localhost/api/reports?reportType=payments")
    );

    expect(res.status).toBe(401);
  });
});
