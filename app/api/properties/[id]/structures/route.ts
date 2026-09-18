import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";
import { z } from "zod";
import { parseJsonBody } from "@/lib/validation/http";
import { structureTypeSchema } from "@/lib/validation/enums";
import { shortText } from "@/lib/validation/common";

type RouteContext = { params: { id: string } };

const createStructureSchema = z.object({
  name: shortText,
  structureType: structureTypeSchema,
  parentId: z.string().min(1).nullable().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;

  const structures = await prisma.structure.findMany({
    where: {
      propertyId: params.id,
      property: { tenantId: auth.ctx.tenantId },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ items: structures });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

  const property = await prisma.property.findFirst({
    where: { id: params.id, tenantId: auth.ctx.tenantId },
  });
  if (!property) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = await parseJsonBody(request, createStructureSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  if (body.parentId) {
    const parent = await prisma.structure.findFirst({
      where: { id: String(body.parentId), propertyId: params.id },
      select: { id: true },
    });
    if (!parent) {
      return NextResponse.json(
        { error: "Estructura padre no encontrada en esta propiedad" },
        { status: 404 }
      );
    }
  }

  const structure = await prisma.structure.create({
    data: {
      propertyId: params.id,
      parentId: body.parentId || null,
      name: body.name,
      structureType: body.structureType,
      sortOrder: body.sortOrder ?? 0,
    },
  });

  return NextResponse.json(structure, { status: 201 });
}
