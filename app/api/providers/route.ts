import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";
import { resolveOrganizationId } from "@/lib/finance/org";
import { emitOpsEvent, OPS_EVENTS } from "@/lib/operations/events";

export async function GET(request: NextRequest) {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  const q = request.nextUrl.searchParams.get("q")?.trim();
  const status = request.nextUrl.searchParams.get("status") || "ACTIVE";
  const serviceType = request.nextUrl.searchParams.get("serviceType");
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get("pageSize") || "20", 10) || 20));

  const where: Record<string, unknown> = {
    tenantId: auth.ctx.tenantId,
    organizationId: org.organizationId,
  };
  if (status !== "all") where.status = status;
  if (serviceType) where.serviceType = serviceType;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { primaryContact: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.provider.count({ where }),
    prisma.provider.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(request: NextRequest) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  try {
    const body = await request.json();
    if (!body.name?.trim() || !body.serviceType?.trim()) {
      return NextResponse.json(
        { error: "name y serviceType son requeridos" },
        { status: 400 }
      );
    }

    const provider = await prisma.provider.create({
      data: {
        tenantId: auth.ctx.tenantId,
        organizationId: org.organizationId,
        name: String(body.name).trim(),
        serviceType: String(body.serviceType).trim(),
        taxId: body.taxId ? String(body.taxId).trim() : null,
        phone: body.phone ? String(body.phone).trim() : null,
        email: body.email ? String(body.email).trim() : null,
        address: body.address ? String(body.address).trim() : null,
        primaryContact: body.primaryContact
          ? String(body.primaryContact).trim()
          : null,
        notes: body.notes ? String(body.notes).trim() : null,
        status: "ACTIVE",
        createdByUserId: auth.userId,
      },
    });

    await emitOpsEvent({
      tenantId: auth.ctx.tenantId,
      organizationId: org.organizationId,
      userId: auth.userId,
      event: OPS_EVENTS.ProviderCreated,
      entity: "Provider",
      entityId: provider.id,
      payload: { name: provider.name, serviceType: provider.serviceType },
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 400 }
    );
  }
}
