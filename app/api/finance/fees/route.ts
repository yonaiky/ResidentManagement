import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";
import { resolveOrganizationId } from "@/lib/finance/org";
import { createFee, generateChargesForFee } from "@/lib/finance/fees";
import { moneyToNumber } from "@/lib/finance/money";

export async function GET() {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;
  const org = await resolveOrganizationId(auth);
  if (org instanceof NextResponse) return org;

  const fees = await prisma.fee.findMany({
    where: {
      tenantId: auth.ctx.tenantId,
      organizationId: org.organizationId,
    },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { charges: true } } },
  });

  return NextResponse.json({
    items: fees.map((f) => ({
      ...f,
      amount: moneyToNumber(f.amount),
      chargeCount: f._count.charges,
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
    if (!body.name || !body.concept || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    if (!body.dueDate) {
      return NextResponse.json({ error: "dueDate required" }, { status: 400 });
    }

    const fee = await createFee({
      tenantId: auth.ctx.tenantId,
      organizationId: org.organizationId,
      name: body.name,
      concept: body.concept,
      amount,
      dueDate: new Date(body.dueDate),
      issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
      feeType: body.feeType,
      recurrence: body.recurrence,
      periodMonth: body.periodMonth ?? null,
      periodYear: body.periodYear ?? null,
      createdById: auth.userId,
    });

    let charges = { created: 0, skipped: 0 };
    if (body.generateCharges !== false) {
      charges = await generateChargesForFee({
        feeId: fee.id,
        tenantId: auth.ctx.tenantId,
        organizationId: org.organizationId,
        userId: auth.userId,
        unitIds: body.unitIds,
      });
    }

    return NextResponse.json(
      {
        fee: { ...fee, amount: moneyToNumber(fee.amount) },
        charges,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/finance/fees", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 400 }
    );
  }
}
