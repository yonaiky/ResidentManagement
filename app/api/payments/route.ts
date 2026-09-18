import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAuth, requireTenantManager } from "@/lib/tenant/auth";
import { mergeTenantWhere } from "@/lib/tenant/scope";
import { money, moneyToNumber } from "@/lib/finance/money";
import { resolveOrganizationId } from "@/lib/finance/org";
import { voidPayment } from "@/lib/finance/payments";
import { z } from "zod";
import { parseJsonBody } from "@/lib/validation/http";
import {
  legacyPaymentStatusSchema,
  paymentMethodSchema,
} from "@/lib/validation/enums";
import {
  dateValue,
  intIdFromString,
  positiveAmount,
} from "@/lib/validation/common";

const createPaymentSchema = z.object({
  amount: positiveAmount,
  residentId: intIdFromString,
  paymentDate: dateValue,
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  paymentMethod: paymentMethodSchema.optional(),
});

const updatePaymentSchema = z.object({
  id: intIdFromString,
  amount: positiveAmount.optional(),
  status: legacyPaymentStatusSchema.optional(),
  paymentDate: dateValue.optional(),
  dueDate: dateValue.optional(),
});

export async function GET() {
  const auth = await requireTenantAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const payments = await prisma.payment.findMany({
      where: mergeTenantWhere({}, auth.ctx),
      include: {
        resident: {
          select: {
            name: true,
            lastName: true,
            cedula: true,
            noRegistro: true,
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    const formattedPayments = payments.map((payment) => ({
      ...payment,
      amount: moneyToNumber(payment.amount),
      residentName: payment.resident
        ? `${payment.resident.name} ${payment.resident.lastName}`
        : "—",
      cedula: payment.resident?.cedula ?? "",
      noRegistro: payment.resident?.noRegistro ?? "",
      monthName:
        payment.month && payment.year
          ? new Date(payment.year, payment.month - 1).toLocaleString("es", {
              month: "long",
            })
          : "",
      year: payment.year,
    }));

    return NextResponse.json(formattedPayments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      {
        error: "Error fetching payments",
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
    const parsed = await parseJsonBody(request, createPaymentSchema);
    if (!parsed.ok) return parsed.response;
    const { amount, residentId, paymentDate, month, year } = parsed.data;

    const resident = await prisma.resident.findFirst({
      where: { id: residentId, tenantId: auth.ctx.tenantId },
    });
    if (!resident) {
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    }

    const org = await resolveOrganizationId(auth);
    const organizationId =
      org instanceof NextResponse ? null : org.organizationId;

    const payment = await prisma.payment.create({
      data: {
        tenantId: auth.ctx.tenantId,
        organizationId,
        amount: money(amount),
        residentId,
        paymentDate,
        month,
        year,
        dueDate: new Date(year, month - 1, 30),
        createdById: auth.userId,
        status: "CONFIRMED",
        paymentMethod: parsed.data.paymentMethod ?? "other",
      },
      include: { resident: true },
    });

    await prisma.resident.update({
      where: { id: residentId },
      data: {
        paymentStatus: "paid",
        nextPaymentDate: new Date(year, month, 30),
      },
    });

    return NextResponse.json(
      { ...payment, amount: moneyToNumber(payment.amount) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      {
        error: "Error creating payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/** Legacy PUT — preferir flujos /api/finance. No permite editar montos de pagos CONFIRMED con aplicaciones. */
export async function PUT(request: Request) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

  try {
    const parsed = await parseJsonBody(request, updatePaymentSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const { id, status, paymentDate, dueDate } = body;

    const existing = await prisma.payment.findFirst({
      where: { id, tenantId: auth.ctx.tenantId },
      include: { applications: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (existing.applications.length > 0 && body.amount != null) {
      return NextResponse.json(
        {
          error:
            "No se puede modificar el monto de un pago aplicado. Use anulación.",
        },
        { status: 409 }
      );
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        amount: body.amount != null ? money(body.amount) : undefined,
        status,
        paymentDate: paymentDate ?? undefined,
        dueDate: dueDate ?? undefined,
      },
      include: { resident: true },
    });

    return NextResponse.json({
      ...payment,
      amount: moneyToNumber(payment.amount),
    });
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      {
        error: "Error updating payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/** DELETE físico deshabilitado — redirige a VOID si hay organizationId. */
export async function DELETE(request: Request) {
  const auth = await requireTenantManager();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const reason = searchParams.get("reason") ?? "Anulación vía API legacy";

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const existing = await prisma.payment.findFirst({
    where: { id: parseInt(id), tenantId: auth.ctx.tenantId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (existing.organizationId) {
    try {
      await voidPayment({
        paymentId: existing.id,
        tenantId: auth.ctx.tenantId,
        organizationId: existing.organizationId,
        userId: auth.userId,
        reason,
      });
      return NextResponse.json({
        message: "Payment voided (no physical delete)",
        status: "VOID",
      });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Error" },
        { status: 400 }
      );
    }
  }

  // Legacy sin org: soft-void local
  await prisma.payment.update({
    where: { id: existing.id },
    data: {
      status: "VOID",
      voidedAt: new Date(),
      voidedById: auth.userId,
      voidReason: reason,
    },
  });

  return NextResponse.json({
    message: "Payment voided (no physical delete)",
    status: "VOID",
  });
}
