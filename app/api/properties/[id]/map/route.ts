import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth } from "@/lib/tenant/auth";
import { serializeUnitMapItem } from "@/lib/tenant/serialize";

type RouteContext = { params: { id: string } };

export async function GET(_req: Request, { params }: RouteContext) {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;

  const property = await prisma.property.findFirst({
    where: { id: params.id, tenantId: auth.ctx.tenantId },
  });
  if (!property) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const units = await prisma.unit.findMany({
    where: { propertyId: params.id },
    include: {
      structure: { select: { name: true } },
      occupancies: {
        where: { status: "active" },
        include: {
          resident: { select: { id: true, name: true, lastName: true, cedula: true } },
        },
      },
    },
    orderBy: [{ floor: "asc" }, { code: "asc" }],
  });

  return NextResponse.json({
    propertyId: params.id,
    items: units.map(serializeUnitMapItem),
  });
}
