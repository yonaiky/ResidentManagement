import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/tenant/auth";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = params.id;

  if (!isPlatformAdmin(user.role)) {
    const membership = await prisma.tenantMembership.findUnique({
      where: {
        tenantId_profileId: {
          tenantId,
          profileId: user.userId,
        },
      },
    });
    if (!membership || membership.status !== "active") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const properties = await prisma.property.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      address: true,
      propertyType: true,
      createdAt: true,
      _count: { select: { units: true } },
    },
  });

  return NextResponse.json({
    items: properties.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      address: p.address,
      propertyType: p.propertyType,
      unitCount: p._count.units,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}
