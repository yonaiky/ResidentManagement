import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";
import { mergeTenantWhere } from "@/lib/tenant/scope";
import { assertWithinLimit } from "@/lib/tenant/limits";

export async function GET() {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const today = new Date();
    const tenantWhere = mergeTenantWhere({}, auth.ctx);

    await prisma.resident.updateMany({
      where: {
        ...tenantWhere,
        nextPaymentDate: { lt: today },
        paymentStatus: "pending",
      },
      data: { paymentStatus: "overdue" },
    });

    const residents = await prisma.resident.findMany({
      where: tenantWhere,
      include: {
        tokens: { select: { id: true, name: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(residents);
  } catch (error) {
    console.error("Error fetching residents:", error);
    return NextResponse.json(
      {
        error: "Error fetching residents",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

  try {
    const { name, lastName, cedula, noRegistro, phone, address } =
      await request.json();

    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.ctx.tenantId },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }
    const limitCheck = await assertWithinLimit(tenant, "residents");
    if (!limitCheck.ok) {
      return NextResponse.json({ error: limitCheck.message }, { status: 403 });
    }

    const today = new Date();
    const nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), 30);

    const resident = await prisma.resident.create({
      data: {
        tenantId: auth.ctx.tenantId,
        name,
        lastName,
        cedula,
        noRegistro,
        phone,
        address,
        paymentStatus: "pending",
        nextPaymentDate,
      },
    });

    return NextResponse.json(resident, { status: 201 });
  } catch (error) {
    console.error("Error creating resident:", error);
    return NextResponse.json(
      {
        error: "Error creating resident",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

  try {
    const { id, name, lastName, cedula, noRegistro, phone, address } =
      await request.json();

    const today = new Date();
    const nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), 30);

    const existing = await prisma.resident.findFirst({
      where: { id, tenantId: auth.ctx.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    }

    const resident = await prisma.resident.update({
      where: { id },
      data: {
        name,
        lastName,
        cedula,
        noRegistro,
        phone,
        address,
        nextPaymentDate,
      },
    });

    return NextResponse.json(resident);
  } catch (error) {
    console.error("Error updating resident:", error);
    return NextResponse.json(
      {
        error: "Error updating resident",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
