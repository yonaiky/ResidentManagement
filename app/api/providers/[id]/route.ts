import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";
import { resolveOrganizationId } from "@/lib/finance/org";
import { moneyToNumber } from "@/lib/finance/money";
import { writeAuditLog } from "@/lib/audit/log";

async function loadProvider(id: string, tenantId: string, organizationId: string) {
  return prisma.provider.findFirst({
    where: { id, tenantId, organizationId },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  const provider = await loadProvider(
    params.id,
    auth.ctx.tenantId,
    org.organizationId
  );
  if (!provider) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [tickets, expenses] = await Promise.all([
    prisma.maintenanceTicket.findMany({
      where: {
        tenantId: auth.ctx.tenantId,
        providerId: provider.id,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
      },
    }),
    prisma.expense.findMany({
      where: {
        tenantId: auth.ctx.tenantId,
        organizationId: org.organizationId,
        providerId: provider.id,
        status: "ACTIVE",
      },
      orderBy: { expenseDate: "desc" },
      take: 50,
    }),
  ]);

  return NextResponse.json({
    provider,
    tickets,
    expenses: expenses.map((e) => ({
      ...e,
      amount: moneyToNumber(e.amount),
    })),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  const existing = await loadProvider(
    params.id,
    auth.ctx.tenantId,
    org.organizationId
  );
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const updated = await prisma.provider.update({
    where: { id: existing.id },
    data: {
      name: body.name != null ? String(body.name).trim() : undefined,
      serviceType:
        body.serviceType != null ? String(body.serviceType).trim() : undefined,
      taxId: body.taxId !== undefined ? body.taxId || null : undefined,
      phone: body.phone !== undefined ? body.phone || null : undefined,
      email: body.email !== undefined ? body.email || null : undefined,
      address: body.address !== undefined ? body.address || null : undefined,
      primaryContact:
        body.primaryContact !== undefined
          ? body.primaryContact || null
          : undefined,
      notes: body.notes !== undefined ? body.notes || null : undefined,
      status: body.status !== undefined ? body.status : undefined,
    },
  });

  await writeAuditLog({
    tenantId: auth.ctx.tenantId,
    organizationId: org.organizationId,
    userId: auth.userId,
    action: "update",
    entity: "Provider",
    entityId: updated.id,
  });

  return NextResponse.json(updated);
}
