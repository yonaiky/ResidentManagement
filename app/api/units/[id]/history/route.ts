import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth } from "@/lib/tenant/auth";

type RouteContext = { params: { id: string } };

export async function GET(_req: Request, { params }: RouteContext) {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;

  const unit = await prisma.unit.findFirst({
    where: { id: params.id, property: { tenantId: auth.ctx.tenantId } },
  });
  if (!unit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [statusHistory, occupancyHistory] = await Promise.all([
    prisma.unitStatusHistory.findMany({
      where: { unitId: params.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.occupancyHistory.findMany({
      where: { unitId: params.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    statusHistory: statusHistory.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
    })),
    occupancyHistory: occupancyHistory.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
    })),
  });
}
