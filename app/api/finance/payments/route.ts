import { NextRequest, NextResponse } from "next/server";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";
import { resolveOrganizationId } from "@/lib/finance/org";
import { registerPayment, voidPayment } from "@/lib/finance/payments";
import { moneyToNumber } from "@/lib/finance/money";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  const unitId = request.nextUrl.searchParams.get("unitId");

  const payments = await prisma.payment.findMany({
    where: {
      tenantId: auth.ctx.tenantId,
      organizationId: org.organizationId,
      ...(unitId ? { unitId } : {}),
    },
    include: {
      receipts: true,
      applications: true,
      unit: { select: { code: true } },
    },
    orderBy: { paymentDate: "desc" },
    take: 100,
  });

  return NextResponse.json({
    items: payments.map((p) => ({
      ...p,
      amount: moneyToNumber(p.amount),
      applications: p.applications.map((a) => ({
        ...a,
        amount: moneyToNumber(a.amount),
      })),
      receipts: p.receipts.map((r) => ({
        ...r,
        amount: moneyToNumber(r.amount),
      })),
    })),
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
    if (!body.unitId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const result = await registerPayment({
      tenantId: auth.ctx.tenantId,
      organizationId: org.organizationId,
      unitId: body.unitId,
      amount,
      paymentMethod: body.paymentMethod,
      reference: body.reference,
      notes: body.notes,
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : undefined,
      residentId: body.residentId ?? null,
      chargeIds: body.chargeIds,
      registeredByUserId: auth.userId,
    });

    return NextResponse.json(
      {
        payment: {
          ...result.payment,
          amount: moneyToNumber(result.payment.amount),
        },
        receipt: {
          ...result.receipt,
          amount: moneyToNumber(result.receipt.amount),
        },
        applications: result.applications,
        creditCreated: result.creditCreated,
        balance: result.balance,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/finance/payments", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 400 }
    );
  }
}
