import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";
import { resolveOrganizationId } from "@/lib/finance/org";
import { money, moneyToNumber } from "@/lib/finance/money";
import { writeAuditLog } from "@/lib/audit/log";

export async function GET() {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  const items = await prisma.expense.findMany({
    where: {
      tenantId: auth.ctx.tenantId,
      organizationId: org.organizationId,
      status: "ACTIVE",
    },
    orderBy: { expenseDate: "desc" },
    take: 100,
  });

  return NextResponse.json({
    items: items.map((e) => ({ ...e, amount: moneyToNumber(e.amount) })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  try {
    const body = await request.json();
    const amount = parseFloat(body.amount);
    if (!body.concept || !body.category || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    if (body.providerId) {
      const provider = await prisma.provider.findFirst({
        where: {
          id: String(body.providerId),
          tenantId: auth.ctx.tenantId,
          organizationId: org.organizationId,
        },
      });
      if (!provider) {
        return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });
      }
    }

    const expense = await prisma.expense.create({
      data: {
        tenantId: auth.ctx.tenantId,
        organizationId: org.organizationId,
        providerId: body.providerId ? String(body.providerId) : null,
        concept: String(body.concept).trim(),
        category: String(body.category).trim(),
        amount: money(amount),
        vendor: body.vendor ? String(body.vendor).trim() : null,
        paymentMethod: body.paymentMethod ?? "other",
        reference: body.reference ?? null,
        notes: body.notes ?? null,
        expenseDate: body.expenseDate ? new Date(body.expenseDate) : new Date(),
        createdById: auth.userId,
      },
    });

    await writeAuditLog({
      tenantId: auth.ctx.tenantId,
      organizationId: org.organizationId,
      userId: auth.userId,
      action: "create",
      entity: "Expense",
      entityId: expense.id,
      newValues: { amount, concept: expense.concept },
    });

    return NextResponse.json(
      { ...expense, amount: moneyToNumber(expense.amount) },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 400 }
    );
  }
}
