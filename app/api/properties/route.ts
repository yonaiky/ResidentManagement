import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";
import { mergeTenantWhere } from "@/lib/tenant/scope";
import { assertWithinLimit } from "@/lib/tenant/limits";
import { serializePropertyListItem } from "@/lib/tenant/serialize";

export async function GET() {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;

  const properties = await prisma.property.findMany({
    where: mergeTenantWhere({}, auth.ctx),
    include: {
      units: {
        include: {
          occupancies: {
            where: { status: "active" },
            include: {
              resident: {
                select: { id: true, name: true, lastName: true },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    items: properties.map(serializePropertyListItem),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.ctx.tenantId },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const limit = await assertWithinLimit(tenant, "properties");
    if (!limit.ok) {
      return NextResponse.json({ error: limit.message }, { status: 403 });
    }

    const body = await request.json();
    const { name, code, address, propertyType } = body;

    if (!name?.trim() || !code?.trim()) {
      return NextResponse.json({ error: "name and code required" }, { status: 400 });
    }

    const property = await prisma.property.create({
      data: {
        tenantId: auth.ctx.tenantId,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        address: address?.trim() || null,
        propertyType: propertyType ?? "condominium",
      },
      include: { units: { include: { occupancies: { include: { resident: true } } } } },
    });

    return NextResponse.json(serializePropertyListItem(property), { status: 201 });
  } catch (error) {
    console.error("POST /api/properties", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
