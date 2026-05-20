import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";

type RouteContext = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;

  const property = await prisma.property.findFirst({
    where: { id: params.id, tenantId: auth.ctx.tenantId },
  });
  if (!property) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(property);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const property = await prisma.property.updateMany({
    where: { id: params.id, tenantId: auth.ctx.tenantId },
    data: {
      ...(body.name !== undefined && { name: String(body.name).trim() }),
      ...(body.address !== undefined && {
        address: body.address ? String(body.address).trim() : null,
      }),
      ...(body.propertyType !== undefined && { propertyType: body.propertyType }),
    },
  });
  if (property.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
